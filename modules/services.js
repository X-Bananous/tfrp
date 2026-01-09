import { state } from './state.js';
import { showToast, showModal } from './ui.js';
import { HEIST_DATA } from './views/illicit.js';
import { CONFIG } from './config.js';
import { render } from './utils.js';

// --- NOTIFICATIONS ---
export const fetchNotifications = async () => {
    if (!state.supabase) return;
    const { data, error } = await state.supabase
        .from('notifications')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${state.user?.id}`)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);
    
    if (!error) state.notifications = data;
};

export const createNotification = async (title, message, type = 'info', isPinned = false, userId = null) => {
    if (!state.supabase) return;
    try {
        await state.supabase.from('notifications').insert({
            title, 
            message, 
            type, 
            is_pinned: isPinned,
            user_id: userId
        });
    } catch (e) {
        console.error("[Notif] Erreur création:", e);
    }
};

// --- SECURE FETCH ---
export const fetchSecureConfig = async (retries = 3) => {
    if (!state.supabase) {
        console.error("[Config] Erreur: Client Supabase non initialisé.");
        return;
    }
    
    try {
        const { data: keys, error: keysError } = await state.supabase
            .from('keys_data')
            .select('*');
        
        if (keysError) throw keysError;

        if (!keys || keys.length === 0) {
            if (retries > 0) {
                await new Promise(res => setTimeout(res, 1000));
                return fetchSecureConfig(retries - 1);
            }
            return;
        }

        keys.forEach(row => {
            if (!row.key) return;
            const k = row.key.toString().trim().toLowerCase();
            const v = row.value;

            try {
                if (k === 'admin_ids') state.adminIds = JSON.parse(v || '[]');
                if (k === 'erlc_api_key') state.erlcKey = v;
                if (k === 'dev_key') state.devKey = v;
                if (k === 'gouv_bank') state.gouvBank = parseFloat(v) || 0;
                if (k === 'last_salary_payment') state.last_salary_payment = v;
                if (k === 'taux_bank') state.savingsRate = parseFloat(v) || 1.5;
                if (k === 'last_interest_payment') state.lastInterestPayment = v;

                const numVal = parseFloat(v);
                if (!isNaN(numVal)) {
                    if (k === 'tva_tax') state.economyConfig.tva_tax = numVal;
                    if (k === 'driver_stage_price') state.economyConfig.driver_stage_price = numVal;
                    if (k === 'driver_license_price') state.economyConfig.driver_license_price = numVal;
                    if (k === 'create_item_ent_tax') state.economyConfig.create_item_ent_tax = numVal;
                }
            } catch (e) {
                console.warn(`[Config] Erreur de traitement pour la ligne ${k}:`, e.message);
            }
        });

        render();
        
    } catch (err) {
        console.error("[Config] Échec de la récupération:", err.message);
        if (retries > 0) {
            await new Promise(res => setTimeout(res, 2000));
            return fetchSecureConfig(retries - 1);
        }
    }
};

// --- GOUVERNEMENT : SALAIRES ---
export const processSalaries = async () => {
    if (!state.activeCharacter || !state.supabase) return;

    try {
        const { data, error } = await state.supabase.rpc('process_government_salaries', { 
            caller_char_id: state.activeCharacter.id 
        });

        if (error) throw error;

        if (data.success) {
            showToast(`${data.message} Montant total : $${data.total_spent.toLocaleString()}`, "success");
        } else {
            showToast(data.message, "warning");
        }
        
        await fetchSecureConfig();
        await fetchAllCharacters();
        render();
        
    } catch (e) {
        console.error("Erreur Salaire RPC:", e);
        showToast("Erreur système lors du versement.", "error");
    }
};

export const loadCharacters = async () => {
    if (!state.user || !state.supabase) return;
    const { data, error } = await state.supabase
        .from('characters')
        .select('*')
        .eq('user_id', state.user.id);
    state.characters = error ? [] : data;
};

export const fetchGlobalSanctions = async () => {
    if (!state.supabase) return;
    const { data } = await state.supabase
        .from('sanctions')
        .select('*, target:profiles!sanctions_user_id_fkey(username), staff:profiles!sanctions_staff_id_fkey(username)')
        .order('created_at', { ascending: false })
        .limit(30);
    state.globalSanctions = data || [];
};

export const setupRealtimeListener = () => {
    if(!state.supabase) return;

    const channel = state.supabase.channel('public-db-changes');

    channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, async (payload) => {
            await fetchNotifications();
            if (!payload.new.user_id || payload.new.user_id === state.user?.id) {
                showToast("Nouveau message système reçu.", "info");
            }
            render();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sanctions' }, async (payload) => {
            if (payload.new?.user_id === state.user?.id || payload.old?.user_id === state.user?.id) {
                if (payload.eventType === 'INSERT') {
                    showToast(`Une nouvelle sanction (${payload.new.type}) a été appliquée à votre dossier.`, "warning");
                }
                if (window.actions.loadUserSanctions) await window.actions.loadUserSanctions();
            }
            if (state.activeHubPanel === 'staff' && state.activeStaffTab === 'sanctions') {
                await fetchGlobalSanctions();
                render();
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, async (payload) => {
            await fetchActiveSession();
            
            if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
                showModal({
                    title: "SESSION LANCÉE !",
                    content: "Une nouvelle session de jeu vient de débuter. Les services publics et le marché noir sont désormais ouverts.",
                    confirmText: "Compris",
                    type: "success"
                });
                if (state.activeHubPanel) {
                     if (state.activeHubPanel === 'illicit' && window.actions.setIllicitTab) window.actions.setIllicitTab(state.activeIllicitTab);
                     if (state.activeHubPanel === 'enterprise') fetchEnterpriseMarket();
                     render();
                }
            }
            else if (payload.eventType === 'UPDATE' && payload.new.status === 'finished' && payload.old.status === 'active') {
                 showToast("La session de jeu est terminée.", "warning");
                 render();
            } else {
                render();
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'heist_lobbies' }, async (payload) => {
            await fetchGlobalHeists();
            if (state.activeCharacter) {
                if (payload.eventType === 'DELETE' && state.activeHeistLobby && state.activeHeistLobby.id === payload.old.id) {
                    state.activeHeistLobby = null;
                    state.heistMembers = [];
                    showToast("Le braquage a été annulé.", "info");
                } else {
                    await fetchActiveHeistLobby(state.activeCharacter.id);
                }
                await fetchAvailableLobbies(state.activeCharacter.id);
                render();
            }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'drug_labs' }, async (payload) => {
            if (state.activeHubPanel === 'illicit' && state.activeIllicitTab === 'drugs' && state.activeGang && payload.new.gang_id === state.activeGang.id) {
                state.drugLab = payload.new;
                render();
            }
        })
        .subscribe();
};

export const fetchDiscordWidgetData = async () => {
    try {
        const response = await fetch(`https://discord.com/api/guilds/1279455759414857759/widget.json`);
        if (!response.ok) return;
        const data = await response.json();
        const memberMap = {};
        if (data.members) {
            data.members.forEach(m => { memberMap[m.id] = m.status; });
        }
        state.discordStatuses = memberMap;
    } catch (e) { console.warn("Failed to fetch Discord Widget", e); }
};

export const fetchPublicLandingData = async () => {
    if (!state.supabase) return;
    await fetchSecureConfig(); 
    await fetchDiscordWidgetData();
    const { data: staff } = await state.supabase.from('profiles').select('id, username, avatar_url, permissions, is_on_duty');
    if (staff) {
        state.landingStaff = staff.filter(p => (p.permissions && Object.keys(p.permissions).length > 0) || state.adminIds.includes(p.id));
    }
};

export const fetchCharactersWithProfiles = async (statusFilter = null) => {
    if (!state.user || !state.supabase) return [];
    let query = state.supabase.from('characters').select('*');
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data: chars } = await query;
    if (!chars || chars.length === 0) return [];

    const userIds = [...new Set(chars.map(c => c.user_id))];
    const verifierIds = [...new Set(chars.map(c => c.verifiedby).filter(id => !!id))];
    const allProfileIds = [...new Set([...userIds, ...verifierIds])];
    
    const charIds = chars.map(c => c.id);
    
    const [profilesRes, accountsRes] = await Promise.all([
        state.supabase.from('profiles').select('id, username, avatar_url, whell_turn, isnotified_wheel').in('id', allProfileIds),
        state.supabase.from('bank_accounts').select('*').in('character_id', charIds)
    ]);

    const profiles = profilesRes.data || [];
    const accounts = accountsRes.data || [];

    return chars.map(char => {
        const profile = profiles.find(p => p.id === char.user_id);
        const verifier = profiles.find(p => p.id === char.verifiedby);
        const bank = accounts.find(a => a.character_id === char.id) || { bank_balance: 0, cash_balance: 0, savings_balance: 0 };
        return {
            ...char,
            discord_username: profile ? profile.username : 'N/A',
            discord_id: profile ? profile.id : null,
            discord_avatar: profile ? profile.avatar_url : null,
            verified_by_name: verifier ? verifier.username : null,
            bank_balance: bank.bank_balance,
            cash_balance: bank.cash_balance,
            savings_balance: bank.savings_balance || 0,
            bank_id: bank.id,
            whell_turn: profile ? profile.whell_turn : 0,
            isnotified_wheel: profile ? profile.isnotified_wheel : true
        };
    });
};

export const fetchAllReports = async () => {
    const { data } = await state.supabase
        .from('police_reports')
        .select('*, police_report_suspects(suspect_name, character_id)')
        .order('created_at', { ascending: false })
        .limit(50);
    state.globalReports = data || [];
};

export const fetchPendingApplications = async () => { state.pendingApplications = await fetchCharactersWithProfiles('pending'); };
export const fetchAllCharacters = async () => { state.allCharactersAdmin = await fetchCharactersWithProfiles(null); };
export const fetchStaffProfiles = async () => {
    if (!state.user || !state.supabase) return;
    if(state.adminIds.length === 0) await fetchSecureConfig();
    await fetchDiscordWidgetData(); 
    const { data: profiles } = await state.supabase.from('profiles').select('*');
    if (profiles) { state.staffMembers = profiles.filter(p => (p.permissions && Object.keys(p.permissions).length > 0) || state.adminIds.includes(p.id)); }
};
export const fetchOnDutyStaff = async () => {
    const { data } = await state.supabase.from('profiles').select('username, avatar_url, id').eq('is_on_duty', true);
    state.onDutyStaff = data || [];
};
export const fetchLawyers = async () => {
    if (!state.supabase) return;
    const { data: chars } = await state.supabase
        .from('characters')
        .select('id, user_id, first_name, last_name, bar_passed')
        .eq('bar_passed', true);
    
    if (chars && chars.length > 0) {
        const userIds = chars.map(c => c.user_id);
        const { data: profiles } = await state.supabase
            .from('profiles')
            .select('id, username, avatar_url, is_on_duty')
            .in('id', userIds);
            
        state.lawyers = chars.map(c => {
            const prof = profiles?.find(p => p.id === c.user_id);
            return {
                id: c.user_id,
                char_id: c.id,
                username: `${c.first_name} ${c.last_name}`,
                avatar_url: prof?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png',
                is_on_duty: prof?.is_on_duty || false
            };
        });
    } else {
        state.lawyers = [];
    }
};
export const toggleStaffDuty = async () => {
    if (!state.user) return;
    if (!state.activeGameSession) { showToast("Impossible : Aucune session de jeu active.", 'error'); return; }
    const { data } = await state.supabase.from('profiles').select('is_on_duty').eq('id', state.user.id).single();
    const newStatus = !data.is_on_duty;
    await state.supabase.from('profiles').update({ is_on_duty: newStatus }).eq('id', state.user.id);
    showToast(newStatus ? "Vous avez pris votre service." : "Vous avez quitté votre service.", 'success');
    await fetchOnDutyStaff();
};
export const assignJob = async (charId, jobName) => {
    const { error } = await state.supabase.from('characters').update({ job: jobName }).eq('id', charId);
    if (!error) { showToast(`Métier mis à jour: ${jobName.toUpperCase()}`, 'success'); await fetchAllCharacters(); } 
    else { showToast("Erreur mise à jour métier", 'error'); }
};
export const searchProfiles = async (query) => {
    if (!query) return [];
    const isId = /^\d+$/.test(query);
    let dbQuery = state.supabase.from('profiles').select('*');
    if (isId) dbQuery = dbQuery.eq('id', query); else dbQuery = dbQuery.ilike('username', `%${query}%`);
    const { data } = await dbQuery.limit(10);
    return data || [];
};
export const fetchGlobalHeists = async () => {
    const { data: heists } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name)').in('status', ['active', 'pending_review']);
    state.globalActiveHeists = heists || [];
};
export const fetchLastFinishedHeist = async () => {
    const { data: data } = await state.supabase.from('heist_lobbies').select('end_time').eq('status', 'finished').order('end_time', { ascending: false }).limit(1).maybeSingle();
    return data ? new Date(data.end_time) : null;
};
export const fetchActiveSession = async () => {
    if (!state.supabase) return;
    const { data } = await state.supabase.from('game_sessions').select('*').eq('status', 'active').maybeSingle();
    state.activeGameSession = data;
};
export const fetchSessionHistory = async () => {
    if (!state.supabase) return;
    const { data } = await state.supabase.from('game_sessions').select('*, host:profiles!game_sessions_host_id_fkey(username)').order('created_at', { ascending: false }).limit(10);
    state.sessionHistory = data || [];
};
export const startSession = async () => {
    if (!state.user || !state.supabase) return;
    if(state.activeGameSession) return;
    await fetchERLCData(); 
    const { data, error } = await state.supabase.from('game_sessions').insert({ host_id: state.user.id, start_time: new Date(), start_player_count: state.erlcData.currentPlayers || 0, status: 'active' }).select().single();
    if(!error) { state.activeGameSession = data; showToast("Session de jeu lancée.", 'success'); }
    else { showToast("Erreur lancement session: " + error.message, 'error'); }
};
export const stopSession = async () => {
    if (!state.supabase) return;
    
    const { data: currentSession } = await state.supabase.from('game_sessions').select('*').eq('status', 'active').maybeSingle();
    
    if (!currentSession) {
        state.activeGameSession = null;
        render();
        return;
    }

    await fetchERLCData(); 
    const endCount = state.erlcData.currentPlayers || 0;
    const peak = Math.max(currentSession.start_player_count, endCount); 
    const modCallsCount = state.erlcData.modCalls ? state.erlcData.modCalls.length : 0;
    const bansCount = state.erlcData.bans ? state.erlcData.bans.length : 0;
    
    const { error } = await state.supabase.from('game_sessions')
        .update({ 
            end_time: new Date(), 
            end_player_count: endCount, 
            peak_player_count: peak, 
            mod_calls_count: modCallsCount, 
            bans_count: bansCount, 
            status: 'finished' 
        })
        .eq('id', currentSession.id);

    if(!error) { 
        state.activeGameSession = null; 
        await state.supabase.from('profiles').update({ is_on_duty: false }).neq('id', '0'); 
        await fetchOnDutyStaff(); 
        showToast("Session fermée. Staff mis hors service.", 'info'); 
        await fetchSessionHistory(); 
        render();
    } else { 
        showToast("Erreur fermeture session: " + error.message, 'error'); 
    }
};
const getERLCApiKey = async () => { if (!state.erlcKey) await fetchSecureConfig(); return state.erlcKey; };
export const fetchERLCData = async () => {
    const apiKey = await getERLCApiKey();
    if (!apiKey) return;
    const headers = { 'Server-Key': apiKey };
    const baseUrl = CONFIG.ERLC_API_URL; 
    const endpoints = [baseUrl, `${baseUrl}/players`, `${baseUrl}/queue`, `${baseUrl}/vehicles`, `${baseUrl}/modcalls`, `${baseUrl}/bans`, `${baseUrl}/killlogs`, `${baseUrl}/commandlogs`];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
        const results = await Promise.allSettled(endpoints.map(url => fetch(url, { headers, signal: controller.signal }).then(res => res.ok ? res.json() : null)));
        clearTimeout(timeoutId);
        const [baseRes, playersRes, queueRes, vehiclesRes, modRes, bansRes, killRes, cmdRes] = results;
        if (baseRes.status === 'fulfilled' && baseRes.value) { state.erlcData.joinKey = baseRes.value.JoinKey || '?????'; state.erlcData.maxPlayers = baseRes.value.MaxPlayers || 42; state.erlcData.currentPlayers = baseRes.value.CurrentPlayers; }
        if (playersRes.status === 'fulfilled') { state.erlcData.players = playersRes.value || []; state.erlcData.currentPlayers = state.erlcData.players.length; }
        if (queueRes.status === 'fulfilled') state.erlcData.queue = queueRes.value || []; 
        if (vehiclesRes.status === 'fulfilled') state.erlcData.vehicles = vehiclesRes.value || [];
        if (modRes.status === 'fulfilled') state.erlcData.modCalls = modRes.value || [];
        if (bansRes.status === 'fulfilled') state.erlcData.bans = bansRes.value || [];
        if (killRes.status === 'fulfilled') state.erlcData.killLogs = killRes.value || [];
        if (cmdRes.status === 'fulfilled') state.erlcData.commandLogs = cmdRes.value || [];
    } catch (e) { console.warn("ERLC Global Fetch Error / Timeout", e); }
};
export const fetchEmergencyCalls = async () => { const { data } = await state.supabase.from('emergency_calls').select('*').neq('status', 'closed').order('created_at', { ascending: false }); state.emergencyCalls = data || []; };
export const createEmergencyCall = async (service, location, description) => { const { error } = await state.supabase.from('emergency_calls').insert({ caller_id: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`, service, location, description, status: 'pending', joined_units: [] }); if(!error) showToast("Appel d'urgence envoyé au central.", 'success'); else showToast("Erreur lors de l'appel.", 'error'); };
export const joinEmergencyCall = async (callId) => {
    const { data: call } = await state.supabase.from('emergency_calls').select('joined_units').eq('id', callId).single();
    if(!call) return;
    const myUnit = { name: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`, id: state.activeCharacter.id, badge: state.activeCharacter.job === 'leo' ? 'POLICE' : state.activeCharacter.job === 'lafd' ? 'EMS' : 'DOT' };
    const currentUnits = call.joined_units || [];
    if (currentUnits.some(u => u.id === myUnit.id)) return showToast("Vous êtes déjà sur cet appel.", "warning");
    const updatedUnits = [...currentUnits, myUnit];
    await state.supabase.from('emergency_calls').update({ joined_units: updatedUnits }).eq('id', callId);
    await fetchEmergencyCalls();
};

export const fetchCharacterReports = async (charId) => {
    const { data: suspectLinks = [] } = await state.supabase.from('police_report_suspects').select('report_id').eq('character_id', charId);
    if (!suspectLinks || suspectLinks.length === 0) { state.policeReports = []; return; }
    const reportIds = suspectLinks.map(l => l.report_id);
    const { data: reports } = await state.supabase.from('police_reports').select('*, police_report_suspects(suspect_name)').in('id', reportIds).order('created_at', { ascending: false });
    state.policeReports = reports || [];
};

export const createPoliceReport = async (reportData, suspects) => {
    const { data: report, error = null } = await state.supabase.from('police_reports').insert(reportData).select().single();
    if (error || !report) { showToast("Erreur création rapport: " + (error?.message || "Inconnue"), 'error'); return false; }
    const suspectsPayload = suspects.map(s => ({ report_id: report.id, character_id: s.id, suspect_name: s.name }));
    if (suspectsPayload.length > 0) { const { error: linkError } = await state.supabase.from('police_report_suspects').insert(suspectsPayload); if (linkError) { showToast("Rapport créé mais erreur liaison suspects.", 'warning'); return false; } }
    showToast("Rapport archivé avec succès.", 'success'); return true;
};
export const fetchServerStats = async () => {
    const { data: accounts } = await state.supabase.from('bank_accounts').select('bank_balance, cash_balance');
    let tBank = 0, tCash = 0;
    if (accounts) accounts.forEach(a => { tBank += (a.bank_balance || 0); tCash += (a.cash_balance || 0); });
    const { data: gangs } = await state.supabase.from('gangs').select('balance');
    let tGang = 0;
    if (gangs) gangs.forEach(g => tGang += (g.balance || 0));
    const { data: enterprises } = await state.supabase.from('enterprises').select('balance');
    let tEnt = 0;
    if (enterprises) enterprises.forEach(e => tEnt += (e.balance || 0));
    state.serverStats.totalBank = tBank; state.serverStats.totalCash = tCash; state.serverStats.totalGang = tGang; state.serverStats.totalEnterprise = tEnt; state.serverStats.totalMoney = tBank + tCash + tGang + tEnt;
    const { data: labs } = await state.supabase.from('drug_labs').select('stock_coke_raw, stock_coke_pure, stock_weed_raw, stock_weed_pure');
    let tCoke = 0, tWeed = 0;
    if (labs) labs.forEach(l => { tCoke += (l.stock_coke_raw || 0) + (l.stock_coke_pure || 0); tWeed += (l.stock_weed_raw || 0) + (l.stock_weed_pure || 0); });
    state.serverStats.totalCoke = tCoke; state.serverStats.totalCheck = tWeed;
};
export const fetchGlobalTransactions = async () => { const { data } = await state.supabase.from('transactions').select(`*, sender:characters!sender_id(first_name, last_name), receiver:characters!receiver_id(first_name, last_name)`).order('created_at', { ascending: false }).limit(50); state.globalTransactions = data || []; };
export const fetchTransactionsForAdmin = async (charId) => {
    const { data } = await state.supabase.from('transactions')
        .select('*')
        .or(`sender_id.eq.${charId},receiver_id.eq.${charId}`)
        .order('created_at', { ascending: false })
        .limit(20);
    return data || [];
};
export const fetchDailyEconomyStats = async () => {
    const { data } = await state.supabase.from('transactions').select('amount, created_at').order('created_at', { ascending: false }).limit(500);
    if (!data) return;
    const stats = {};
    data.forEach(t => { const date = new Date(t.created_at).toLocaleDateString(); if(!stats[date]) stats[date] = 0; stats[date] += Math.abs(t.amount); });
    state.dailyEconomyStats = Object.keys(stats)
        .map(date => ({ date, amount: stats[date] }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
};
export const updateEnterpriseBalance = async (entId, newBalance) => { const { error } = await state.supabase.from('enterprises').update({ balance: newBalance }).eq('id', entId); if(error) console.error("Ent balance update failed", error); };
export const fetchPendingHeistReviews = async () => { const { data: lobbies } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name), heist_members(count)').in('status', ['pending_review', 'active']); state.pendingHeistReviews = lobbies || []; };
export const adminResolveHeist = async (lobbyId, success) => {
    const { data: lobby } = await state.supabase.from('heist_lobbies').select('*').eq('id', lobbyId).single();
    if(!lobby) return;
    if (!success) { await state.supabase.from('heist_lobbies').update({ status: 'failed' }).eq('id', lobbyId); } 
    else {
        const heist = HEIST_DATA.find(h => h.id === lobby.heist_type);
        const weightedRandom = Math.pow(Math.random(), 1.8);
        const rawLoot = Math.floor(weightedRandom * (heist.max - heist.min + 1)) + heist.min;
        let distributedLoot = rawLoot, gangTax = 0;
        if (heist.requiresGang) {
            const { data: membership } = await state.supabase.from('gang_members').select('gang_id, gangs(balance)').eq('character_id', lobby.host_id).maybeSingle();
            if (membership) { gangTax = Math.floor(rawLoot * 0.25); distributedLoot = rawLoot - gangTax; await state.supabase.from('gangs').update({ balance: (membership.gangs.balance || 0) + gangTax }).eq('id', membership.gang_id); }
        }
        const { data: members = [] } = await state.supabase.from('heist_members').select('character_id').eq('lobby_id', lobbyId).eq('status', 'accepted');
        const share = Math.floor(distributedLoot / members.length);
        for (const m of members) {
             const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', m.character_id).single();
             if(bank) { await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + share }).eq('character_id', m.character_id); await state.supabase.from('transactions').insert({ sender_id: m.character_id, amount: share, type: 'deposit', description: `Gain Braquage: ${heist.name}` }); }
        }
        await state.supabase.from('heist_lobbies').update({ status: 'finished' }).eq('id', lobbyId);
    }
    await fetchPendingHeistReviews();
};
export const fetchGangs = async () => { const { data } = await state.supabase.from('gangs').select('*, leader:characters!gangs_leader_id_fkey(first_name, last_name), co_leader:characters!gangs_co_leader_id_fkey(first_name, last_name)'); state.gangs = data || []; };
export const fetchActiveGang = async (charId) => {
    let { data: membership } = await state.supabase.from('gang_members').select('*, gangs(*, leader:characters!gangs_leader_id_fkey(first_name, last_name, user_id), co_leader:characters!gangs_co_leader_id_fkey(first_name, last_name, user_id))').eq('character_id', charId).maybeSingle();
    if (!membership) {
        const { data: gangOwned } = await state.supabase.from('gangs').select('*, leader:characters!gangs_leader_id_fkey(first_name, last_name, user_id), co_leader:characters!gangs_co_leader_id_fkey(first_name, last_name, user_id)').or(`leader_id.eq.${charId},co_leader_id.eq.${charId}`).maybeSingle();
        if (gangOwned) {
            const rank = gangOwned.leader_id === charId ? 'leader' : 'co_leader';
            await state.supabase.from('gang_members').upsert({ gang_id: gangOwned.id, character_id: charId, rank: rank, status: 'accepted' }, { onConflict: 'gang_id, character_id' });
            membership = { rank: rank, status: 'accepted', gangs: gangOwned };
        }
    }
    if (membership && membership.gangs) {
        const { data: members = [] } = await state.supabase.from('gang_members').select('rank, character_id, status, characters(id, first_name, last_name)').eq('gang_id', membership.gangs.id);
        state.activeGang = { ...membership.gangs, myRank: membership.rank, myStatus: membership.status, members: members || [], balance: membership.gangs.balance || 0 };
    } else { state.activeGang = null; }
};
export const createGang = async (name, leaderId, coLeaderId) => {
    const { data: gang, error = null } = await state.supabase.from('gangs').insert({ name, leader_id: leaderId, co_leader_id: coLeaderId || null, balance: 0 }).select().single();
    if (error) { showToast('Erreur création gang: ' + error.message, 'error'); return; }
    await state.supabase.from('gang_members').upsert({ gang_id: gang.id, character_id: leaderId, rank: 'leader', status: 'accepted' });
    if (coLeaderId) { await state.supabase.from('gang_members').upsert({ gang_id: gang.id, character_id: coLeaderId, rank: 'co_leader', status: 'accepted' }); }
    showToast('Gang créé avec succès', 'success');
};
export const updateGang = async (gangId, name, leaderId, coLeaderId) => {
    const { error = null } = await state.supabase.from('gangs').update({ name, leader_id: leaderId, co_leader_id: coLeaderId || null }).eq('id', gangId);
    if (error) { showToast('Erreur update gang: ' + error.message, 'error'); return; }
    await state.supabase.from('gang_members').upsert({ gang_id: gangId, character_id: leaderId, rank: 'leader', status: 'accepted' }, { onConflict: 'gang_id, character_id'});
    if (coLeaderId) { await state.supabase.from('gang_members').upsert({ gang_id: gangId, character_id: coLeaderId, rank: 'co_leader', status: 'accepted' }, { onConflict: 'gang_id, character_id'}); }
    showToast('Gang mis à jour. Leader/Co-Leader forcés.', 'success');
};
export const updateGangBalance = async (gangId, newBalance) => { const { error = null } = await state.supabase.from('gangs').update({ balance: newBalance }).eq('id', gangId); if(error) console.error("Balance update failed", error); };
export const fetchBounties = async () => { const { data } = await state.supabase.from('bounties').select('*, creator:characters!bounties_creator_id_fkey(first_name, last_name)').order('amount', { ascending: false }); state.bounties = data || []; };
export const createBounty = async (targetName, amount, description) => {
    if (amount < 10000 || amount > 100000) return showToast('La prime doit être entre $10k et $100k', 'error');
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
    if (bank.cash_balance < amount) return showToast('Fonds insuffisants en liquide.', 'error');
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - amount }).eq('character_id', state.activeCharacter.id);
    const { error = null } = await state.supabase.from('bounties').insert({ creator_id: state.activeCharacter.id, target_name: targetName, amount, description, status: 'active' });
    if (!error) showToast('Contrat mis à prix.', 'success'); else showToast('Erreur création contrat.', 'error');
    await fetchBounties();
};
export const resolveBounty = async (bountyId, winnerId) => {
    const { data: bounty } = await state.supabase.from('bounties').select('*').eq('id', bountyId).single();
    if(!bounty || bounty.status !== 'active') return;
    if (!winnerId) { await state.supabase.from('bounties').update({ status: 'cancelled' }).eq('id', bountyId); showToast('Contrat annulé.', 'info'); } 
    else {
        const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', winnerId).single();
        if(bank) { await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + bounty.amount }).eq('character_id', winnerId); await state.supabase.from('transactions').insert({ sender_id: null, receiver_id: winnerId, amount: bounty.amount, type: 'deposit', description: `Prime: ${bounty.target_name}` }); }
        await state.supabase.from('bounties').update({ status: 'completed', winner_id: winnerId }).eq('id', bountyId);
        showToast('Contrat honoré.', 'success');
    }
    await fetchBounties();
};

export const fetchEnterprises = async () => { const { data } = await state.supabase.from('enterprises').select('*, leader:characters!enterprises_leader_id_fkey(first_name, last_name), coleader:characters!enterprises_coleader_id_fkey(first_name, last_name)'); state.enterprises = data || []; };
export const fetchMyEnterprises = async (charId) => {
    const { data: memberships = [] } = await state.supabase.from('enterprise_members').select('*, enterprises(*, items:enterprise_items(count))').eq('character_id', charId);
    if (memberships) { state.myEnterprises = memberships.map(m => ({ ...m.enterprises, myRank: m.rank, myStatus: m.status })); } else { state.myEnterprises = []; }
};
export const createEnterprise = async (name, leaderId, coleaderId = null) => {
    const { data: ent, error = null } = await state.supabase.from('enterprises').insert({ name, leader_id: leaderId, coleader_id: coleaderId, balance: 0 }).select().single();
    if (error) { showToast('Erreur création: ' + error.message, 'error'); return; }
    await state.supabase.from('enterprise_members').upsert({ enterprise_id: ent.id, character_id: leaderId, rank: 'leader', status: 'accepted' });
    if(coleaderId) await state.supabase.from('enterprise_members').upsert({ enterprise_id: ent.id, character_id: coleaderId, rank: 'co_leader', status: 'accepted' });
    showToast('Entreprise créée avec succès', 'success');
};
export const updateEnterprise = async (entId, name, leaderId, coleaderId = null) => {
    const { error = null } = await state.supabase.from('enterprises').update({ name, leader_id: leaderId, coleader_id: coleaderId }).eq('id', entId);
    if (error) { showToast('Erreur modification: ' + error.message, 'error'); return; }
    await state.supabase.from('enterprise_members').upsert({ enterprise_id: entId, character_id: leaderId, rank: 'leader', status: 'accepted' }, { onConflict: 'enterprise_id, character_id' });
    if(coleaderId) await state.supabase.from('enterprise_members').upsert({ enterprise_id: entId, character_id: coleaderId, rank: 'co_leader', status: 'accepted' }, { onConflict: 'enterprise_id, character_id' });
    showToast('Entreprise mise à jour avec succès', 'success');
};
export const joinEnterprise = async (entId, charId) => {
    const {data} = await state.supabase.from('enterprise_members').select('*').eq('enterprise_id', entId).eq('character_id', charId).maybeSingle();
    if(data) return showToast("Vous avez déjà postulé ou êtes membre.", 'warning');
    const { error = null } = await state.supabase.from('enterprise_members').insert({ enterprise_id: entId, character_id: charId, rank: 'employee', status: 'pending' });
    if(!error) showToast('Candidature envoyée au PDG.', 'success'); else showToast("Erreur candidature.", 'error');
};
export const fetchEnterpriseMarket = async () => {
    const { data: autoEcole } = await state.supabase.from('enterprises').select('id').eq('name', 'L.A. Auto School').maybeSingle();
    if (autoEcole) {
        const { data: items = [] } = await state.supabase.from('enterprise_items').select('*').eq('enterprise_id', autoEcole.id);
        const licenseItem = items?.find(i => i.name === 'Permis de conduire');
        const stageItem = items?.find(i => i.name === 'Stage de récupération de points');
        
        if (licenseItem && licenseItem.price !== state.economyConfig.driver_license_price) {
             await state.supabase.from('enterprise_items').update({ price: state.economyConfig.driver_license_price }).eq('id', licenseItem.id);
        } else if (!licenseItem) {
             await state.supabase.from('enterprise_items').insert({ enterprise_id: autoEcole.id, name: 'Permis de conduire', price: state.economyConfig.driver_license_price, quantity: 999999, payment_type: 'both', status: 'approved', is_hidden: false, description: 'Prendre RDV pour passer le Permis officiel.' });
        }

        if (stageItem && stageItem.price !== state.economyConfig.driver_stage_price) {
             await state.supabase.from('enterprise_items').update({ price: state.economyConfig.driver_stage_price }).eq('id', stageItem.id);
        } else if (!stageItem) {
             await state.supabase.from('enterprise_items').insert({ enterprise_id: autoEcole.id, name: 'Stage de récupération de points', price: state.economyConfig.driver_stage_price, quantity: 999999, payment_type: 'both', status: 'approved', is_hidden: false, description: 'Prendre RDV un stage (+3 points)' });
        }
    }
    const { data } = await state.supabase.from('enterprise_items').select('*, enterprises(name)').gt('quantity', 0).eq('is_hidden', false).eq('status', 'approved');
    state.enterpriseMarket = data || [];
};

export const fetchTopSellers = async () => {
    const { data: invoices = [] } = await state.supabase
        .from('invoices')
        .select('item_name, quantity, enterprise_id')
        .not('enterprise_id', 'is', null) 
        .order('created_at', { ascending: false })
        .limit(100);

    if (!invoices) {
        state.topSellers = [];
        return;
    }

    const salesMap = {};
    invoices.forEach(inv => {
        const key = `${inv.enterprise_id}_${inv.item_name}`; 
        if (!salesMap[key]) {
            salesMap[key] = { count: 0, name: inv.item_name, entId: inv.enterprise_id };
        }
        salesMap[key].count += inv.quantity;
    });

    const sortedSales = Object.values(salesMap).sort((a, b) => b.count - a.count);

    state.topSellers = [];
    
    for (const sale of sortedSales) {
        if (state.topSellers.length >= 3) break;
        const marketItem = state.enterpriseMarket.find(i => 
            i.enterprise_id === sale.entId && i.name === sale.name
        );
        if (marketItem) {
            state.topSellers.push({ ...marketItem, sales_count: sale.count, is_trending: true });
        }
    }

    if (state.topSellers.length < 3) {
        const discounted = state.enterpriseMarket.filter(i => i.discount_percent > 0 && !state.topSellers.includes(i));
        discounted.sort(() => Math.random() - 0.5);
        for (const item of discounted) {
            if (state.topSellers.length >= 3) break;
            state.topSellers.push({...item, is_promo_trend: true});
        }
    }
};

export const fetchPendingEnterpriseItems = async () => { const { data } = await state.supabase.from('enterprise_items').select('*, enterprises(name)').eq('status', 'pending'); state.pendingEnterpriseItems = data || []; };
export const moderateEnterpriseItem = async (itemId, status) => { await state.supabase.from('enterprise_items').update({ status: status }).eq('id', itemId); };
export const createEnterpriseItem = async (entId, name, price, quantity, paymentType, description) => {
    if (price > 1000000) return showToast("Prix maximum 1 Million $.", 'error');
    const { data: existing } = await state.supabase.from('enterprise_items').select('id').eq('name', name).maybeSingle();
    if(existing) { showToast("Ce nom d'article existe déjà sur le marché (toutes entreprises confondues).", 'error'); return false; }
    await state.supabase.from('enterprise_items').insert({ enterprise_id: entId, name, price, quantity, payment_type: paymentType, description, status: 'pending', is_hidden: false });
    showToast("Article soumis pour validation staff.", 'info');
    return true;
};
export const updateEnterpriseItem = async (itemId, updates) => {
    if (updates.name || updates.price || updates.description) { updates.status = 'pending'; }
    const { error = null } = await state.supabase.from('enterprise_items').update(updates).eq('id', itemId);
    if (!error) { showToast("Article mis à jour.", "success"); if (updates.status === 'pending') showToast("Modifications soumises à validation.", 'info'); }
};
export const fetchEnterpriseCirculation = async (entId) => {
    const { data: items = [] } = await state.supabase.from('enterprise_items').select('name').eq('enterprise_id', entId);
    if(!items || items.length === 0) return [];
    const names = items.map(i => i.name);
    const { data: inventory = [] } = await state.supabase.from('inventory').select('name, quantity, characters!character_id(first_name, last_name)').in('name', names);
    return inventory || [];
};
export const fetchClientAppointments = async (charId) => {
    const { data = [] } = await state.supabase.from('enterprise_appointments')
        .select('*, enterprises(name)')
        .eq('client_id', charId)
        .order('created_at', { ascending: false });
    state.clientAppointments = data || [];
};

export const fetchEnterpriseDetails = async (entId) => {
    try {
        const { data: ent, error: entError } = await state.supabase.from('enterprises').select('*').eq('id', entId).single();
        if(entError || !ent) throw new Error("Entreprise introuvable.");

        if (ent.name === 'L.A. Auto School') {
            try {
                const { data: itemsCheck = [] } = await state.supabase.from('enterprise_items').select('*').eq('enterprise_id', entId);
                const licenseItem = itemsCheck?.find(i => i.name === 'Permis de conduire');
                const stageItem = itemsCheck?.find(i => i.name === 'Stage de récupération de points');
                
                if (licenseItem && licenseItem.price !== state.economyConfig.driver_license_price) {
                    await state.supabase.from('enterprise_items').update({ price: state.economyConfig.driver_license_price }).eq('id', licenseItem.id);
                }
                if (stageItem && stageItem.price !== state.economyConfig.driver_stage_price) {
                    await state.supabase.from('enterprise_items').update({ price: state.economyConfig.driver_stage_price }).eq('id', stageItem.id);
                }
            } catch(e) { console.warn("[Ent] Erreur refresh Auto-école:", e); }
        }

        const [membersRes, itemsRes, promosRes, invoicesRes, appointmentsRes] = await Promise.all([
            state.supabase.from('enterprise_members').select('*, characters!character_id(first_name, last_name)').eq('enterprise_id', entId),
            state.supabase.from('enterprise_items').select('*').eq('enterprise_id', entId),
            state.supabase.from('enterprise_promos').select('*').eq('enterprise_id', entId),
            state.supabase.from('invoices').select('*, characters!buyer_id(first_name, last_name)').eq('enterprise_id', entId).order('created_at', { ascending: false }).limit(20),
            state.supabase.from('enterprise_appointments').select('*, characters!client_id (first_name, last_name, user_id)').eq('enterprise_id', entId).eq('status', 'pending')
        ]);

        const members = membersRes.data || [];
        const items = itemsRes.data || [];
        const promos = promosRes.data || [];
        const invoices = invoicesRes.data || [];
        const appointmentsData = appointmentsRes.data || [];

        let enhancedAppointments = [];
        if (appointmentsData.length > 0) {
            const userIds = [...new Set(appointmentsData.map(a => a.characters?.user_id).filter(id => !!id))];
            if (userIds.length > 0) {
                const { data: profiles = [] } = await state.supabase.from('profiles').select('id, username').in('id', userIds);
                enhancedAppointments = appointmentsData.map(a => {
                    const profile = profiles.find(p => p.id === a.characters?.user_id);
                    return { ...a, discord_username: profile ? profile.username : 'Inconnu' };
                });
            } else {
                enhancedAppointments = appointmentsData.map(a => ({ ...a, discord_username: 'Inconnu' }));
            }
        }

        const myMember = members.find(m => m.character_id === state.activeCharacter?.id);
        
        let circulation = [];
        if (items.length > 0 && myMember && (myMember.rank === 'leader' || myMember.rank === 'co_leader')) {
            const names = items.map(i => i.name);
            const { data: invCirc } = await state.supabase.from('inventory').select('name, quantity, characters!character_id(first_name, last_name)').in('name', names);
            circulation = invCirc || [];
        }

        state.activeEnterpriseManagement = { 
            ...ent, 
            members, 
            items, 
            promos,
            invoices, 
            appointments: enhancedAppointments,
            circulation, 
            myRank: myMember ? myMember.rank : null 
        };

    } catch (e) {
        console.error("[Ent] Erreur fatale fetchEnterpriseDetails:", e);
        throw e;
    }
};

export const createEnterprisePromo = async (promoData) => { const { error = null } = await state.supabase.from('enterprise_promos').insert(promoData); if(error) showToast("Erreur création promo.", "error"); else showToast("Code promo créé.", "success"); };
export const deleteEnterprisePromo = async (promoId) => { await state.supabase.from('enterprise_promos').delete().eq('id', promoId); };
export const fetchPlayerInvoices = async (charId) => { const { data = [] } = await state.supabase.from('invoices').select('*, enterprises(name)').eq('buyer_id', charId).order('created_at', { ascending: false }); state.invoices = data || []; state.hasFetchedInvoices = true; };
export const adminCreateCharacter = async (charData) => { const { error = null } = await state.supabase.from('characters').insert([charData]); return !error; };

export const fetchBankData = async (charId) => {
    let { data: bank, error = null } = await state.supabase.from('bank_accounts').select('*').eq('character_id', charId).maybeSingle(); 
    
    if (!bank) { 
        const { data: newBank } = await state.supabase.from('bank_accounts').insert([{ 
            character_id: charId, bank_balance: 5000, cash_balance: 500, savings_balance: 0,
            taux_int_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }]).select().single(); 
        bank = newBank; 
    } else if (!bank.taux_int_delivery) {
        const nextDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await state.supabase.from('bank_accounts').update({ taux_int_delivery: nextDelivery }).eq('id', bank.id);
        bank.taux_int_delivery = nextDelivery;
    }

    if (bank.taux_int_delivery && new Date(bank.taux_int_delivery) <= new Date()) {
        try {
            const { error: rpcError } = await state.supabase.rpc('claim_savings_interests', { p_char_id: charId });
            if (!rpcError) {
                const { data: updatedBank } = await state.supabase.from('bank_accounts').select('*').eq('character_id', charId).single();
                if (updatedBank) {
                    bank = updatedBank;
                    showToast("Intérêts d'épargne versés automatiquement.", "success");
                }
            } else {
                const nextRetry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                await state.supabase.from('bank_accounts').update({ taux_int_delivery: nextRetry }).eq('id', bank.id);
                bank.taux_int_delivery = nextRetry;
            }
        } catch (e) {
            console.error("[Banque] Erreur auto-intérêt:", e);
        }
    }

    state.bankAccount = bank;
    const { data: txs = [] } = await state.supabase.from('transactions').select('*').or(`sender_id.eq.${charId},receiver_id.eq.${charId}`).order('created_at', { ascending: false }).limit(20);
    state.transactions = txs || [];
    
    // PREVENT SELF TRANSFER: Filter out all characters belonging to the same user
    const { data: recipients = [] } = await state.supabase
        .from('characters')
        .select('id, first_name, last_name')
        .eq('status', 'accepted')
        .neq('user_id', state.user.id);
        
    state.recipientList = recipients || [];
};

export const fetchInventory = async (charId) => {
    if (!state.supabase) return;
    await fetchBankData(charId);
    const { data: items = [], error = null } = await state.supabase.from('inventory').select('*').eq('character_id', charId);
    state.inventory = items || [];
    
    const requiredVirtualItems = [ 
      { id: 'virtual-id-card', name: "Carte d'Identité", icon: 'id-card' }, 
      { id: 'virtual-credit-card', name: "Carte Bancaire", icon: 'credit-card' }
    ];

    const char = state.activeCharacter;
    if (char) {
        if (char.job === 'leo') {
            requiredVirtualItems.push({ id: 'virtual-leo-badge', name: "Insigne de Police (LSPD)", icon: 'shield-check', docType: 'police_badge' });
            requiredVirtualItems.push({ id: 'virtual-leo-card', name: "Carte de Service (LSPD)", icon: 'id-card', docType: 'police_card' });
        } else if (char.job === 'lafd') {
            requiredVirtualItems.push({ id: 'virtual-lafd-card', name: "Carte de Service (LAFD)", icon: 'id-card', docType: 'lafd_card' });
        } else if (char.job === 'ladot') {
            requiredVirtualItems.push({ id: 'virtual-ladot-card', name: "Carte de Service (LADOT)", icon: 'id-card', docType: 'ladot_card' });
        }

        if (state.user.bar_passed && (char.job === 'lawyer' || char.job === 'juge' || char.job === 'procureur')) {
            requiredVirtualItems.push({ id: 'virtual-bar-card', name: "Carte du Barreau (Justice)", icon: 'scale', docType: 'bar_card' });
        }
    }

    requiredVirtualItems.forEach(vItem => { 
        const exists = state.inventory.some(i => i.name === vItem.name); 
        if (!exists) { 
            state.inventory.unshift({ 
                id: vItem.id, 
                name: vItem.name, 
                quantity: 1, 
                estimated_value: 0, 
                is_virtual: true, 
                icon: vItem.icon,
                docType: vItem.docType
            }); 
        } 
    });

    state.inventory.forEach(i => { if(i.name === "Permis de conduire") { i.is_virtual = true; i.icon = 'car'; } });
    
    let total = (state.bankAccount.bank_balance || 0) + (state.bankAccount.cash_balance || 0) + (state.bankAccount.savings_balance || 0);
    state.inventory.forEach(item => { total += (item.quantity * item.estimated_value); });
    const { data: ownedEnts = [] } = await state.supabase.from('enterprises').select('balance').eq('leader_id', charId);
    if(ownedEnts) { ownedEnts.forEach(e => total += (e.balance || 0)); }
    state.patrimonyTotal = total;
};

export const fetchDrugLab = async (gangId) => {
    if (!gangId) { state.drugLab = null; return; }
    let { data: lab } = await state.supabase.from('drug_labs').select('*').eq('gang_id', gangId).maybeSingle();
    if (!lab) {
        const { data: newLab } = await state.supabase.from('drug_labs').insert([{ gang_id: gangId }]).select().single();
        lab = newLab;
    }
    state.drugLab = lab;
};

export const checkAndCompleteDrugBatch = async (gangId) => {
    if (!gangId || state._completingDrugBatch) return;
    
    state._completingDrugBatch = true;

    try {
        const { data: lab, error: fetchError } = await state.supabase
            .from('drug_labs')
            .select('*')
            .eq('gang_id', gangId)
            .maybeSingle();
        
        if (fetchError || !lab || !lab.current_batch) {
            state._completingDrugBatch = false;
            return;
        }

        const now = Date.now();
        const endTime = new Date(lab.current_batch.end_time).getTime();

        if (endTime <= now) {
            const batch = lab.current_batch;
            const updates = { current_batch: null };
            const type = batch.type;
            const stage = batch.stage;
            const amount = Number(batch.amount) || 0; 

            let logMsg = "";

            if (stage === 'harvest') {
                const key = type === 'coke' ? 'stock_coke_raw' : 'stock_weed_raw';
                updates[key] = (Number(lab[key]) || 0) + amount;
                logMsg = `Récolte terminée (Gang) : +${amount}g`;
            }
            else if (stage === 'process') {
                const key = type === 'coke' ? 'stock_coke_pure' : 'stock_weed_pure';
                updates[key] = (Number(lab[key]) || 0) + amount;
                logMsg = `Traitement terminé (Gang) : +${amount}g`;
            }
            else if (stage === 'sell') {
                const prices = { coke: 60, weed: 20 };
                const reward = amount * (prices[type] || 0);
                
                const { data: gang } = await state.supabase.from('gangs').select('balance').eq('id', gangId).single();
                if(gang) {
                    await state.supabase.from('gangs').update({ balance: (Number(gang.balance) || 0) + reward }).eq('id', gangId);
                }
                logMsg = `Vente terminée (Gang) : +$${reward.toLocaleString()} dans le coffre.`;
            }

            const { error: updateError } = await state.supabase
                .from('drug_labs')
                .update(updates)
                .eq('id', lab.id);

            if (!updateError) {
                showToast(logMsg, 'success');
                state.drugLab = { ...lab, ...updates };
                render();
            }
        }
    } catch (e) {
        console.error("[Lab] Exception lors de la complétion:", e);
    } finally {
        state._completingDrugBatch = false;
    }
};

export const updateDrugLab = async (updates) => { 
    if(!state.activeGang) return; 
    await state.supabase.from('drug_labs').update(updates).eq('gang_id', state.activeGang.id); 
    await fetchDrugLab(state.activeGang.id); 
};

export const fetchActiveHeistLobby = async (charId) => {
    const { data: membership } = await state.supabase.from('heist_members').select('lobby_id').eq('character_id', charId).maybeSingle();
    let lobbyId = membership ? membership.lobby_id : null;
    if (!lobbyId) { const { data: hosted } = await state.supabase.from('heist_lobbies').select('id').eq('host_id', charId).neq('status', 'finished').neq('status', 'failed').maybeSingle(); if(hosted) lobbyId = hosted.id; }
    if (lobbyId) {
        const { data: lobby } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name)').eq('id', lobbyId).maybeSingle();
        if (!lobby) { state.activeHeistLobby = null; state.heistMembers = []; await fetchAvailableLobbies(charId); return; }
        if (lobby.characters) { const host = Array.isArray(lobby.characters) ? lobby.characters[0] : lobby.characters; lobby.host_name = host ? `${host.first_name} ${host.last_name}` : 'Inconnu'; } else { lobby.host_name = 'Inconnu'; }
        const { data: members = [] } = await state.supabase.from('heist_members').select('*, characters(first_name, last_name)').eq('lobby_id', lobbyId);
        state.activeHeistLobby = lobby; state.heistMembers = members;
    } else { state.activeHeistLobby = null; state.heistMembers = []; await fetchAvailableLobbies(charId); }
};
export const fetchAvailableLobbies = async (charId) => { const { data: lobbies = [] } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name)').in('status', ['setup', 'active']).neq('host_id', charId); state.availableHeistLobbies = (lobbies || []).map(l => { const host = Array.isArray(l.characters) ? l.characters[0] : l.characters; return { ...l, host_name: host ? `${host.first_name} ${host.last_name}` : 'Inconnu' }; }); };
export const createHeistLobby = async (heistId, location = null, accessType = 'private') => { const { data, error = null } = await state.supabase.from('heist_lobbies').insert({ host_id: state.activeCharacter.id, heist_type: heistId, status: 'setup', location: location, access_type: accessType }).select().single(); if(error) { showToast("Erreur création lobby: " + error.message, 'error'); return; } await state.supabase.from('heist_members').insert({ lobby_id: data.id, character_id: state.activeCharacter.id, status: 'accepted' }); await fetchActiveHeistLobby(state.activeCharacter.id); };
export const inviteToLobby = async (targetId) => { if(!state.activeHeistLobby) return; const existing = state.heistMembers.find(m => m.character_id === targetId); if(existing) return showToast("Déjà dans l'équipe", 'warning'); await state.supabase.from('heist_members').insert({ lobby_id: state.activeHeistLobby.id, character_id: targetId, status: 'pending' }); };
export const joinLobbyRequest = async (lobbyId) => { const charId = state.activeCharacter.id; const { data: existing } = await state.supabase.from('heist_members').select('*').eq('character_id', charId).eq('lobby_id', lobbyId).maybeSingle(); if (existing) { showToast("Vous avez déjà demandé à rejoindre.", 'warning'); return; } const { data: lobby } = await state.supabase.from('heist_lobbies').select('access_type').eq('id', lobbyId).single(); const status = (lobby && lobby.access_type === 'open') ? 'accepted' : 'pending'; await state.supabase.from('heist_members').insert({ lobby_id: lobbyId, character_id: charId, status: status }); if (status === 'accepted') { showToast("Vous avez rejoint l'équipe (Accès Libre).", 'success'); } else { showToast("Demande envoyée au chef d'équipe.", 'info'); } await fetchActiveHeistLobby(charId); };
export const acceptLobbyMember = async (targetCharId) => { if(!state.activeHeistLobby) return; await state.supabase.from('heist_members').update({ status: 'accepted' }).eq('lobby_id', state.activeHeistLobby.id).eq('character_id', targetCharId); await fetchActiveHeistLobby(state.activeCharacter.id); };
export const startHeistSync = async (durationSeconds) => { if(!state.activeHeistLobby) return; const now = Date.now(); const endTime = now + (durationSeconds * 1000); const { error = null } = await state.supabase.from('heist_lobbies').update({ status: 'active', start_time: now, end_time: endTime }).eq('id', state.activeHeistLobby.id); if(error) showToast("Erreur lancement", 'error'); await fetchActiveHeistLobby(state.activeCharacter.id); };

export const executeServerCommand = async (command) => {
    const apiKey = await getERLCApiKey();
    if(!apiKey) return;
    try {
        const res = await fetch(CONFIG.ERLC_API_URL + '/command', {
            method: 'POST',
            headers: { 'Server-Key': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ Command: command })
        });
        if(res.ok) showToast("Commande envoyée au serveur.", 'success');
        else showToast("Erreur API ERLC.", 'error');
    } catch(e) { showToast("Erreur réseau ERLC.", 'error'); }
};