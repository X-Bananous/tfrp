

import { state } from './state.js';
import { showToast, showModal } from './ui.js';
import { HEIST_DATA } from './views/illicit.js';
import { CONFIG } from './config.js';
import { render } from './utils.js';

// --- NEW SECURE FETCH ---
export const fetchSecureConfig = async () => {
    if (!state.supabase) return;
    try {
        const { data, error } = await state.supabase.rpc('get_secure_config');
        if (error) throw error;
        if (data) {
            state.adminIds = JSON.parse(data.admin_ids || '[]');
            state.erlcKey = data.erlc_api_key;
        }
    } catch (e) {
        console.error("Failed to load secure config", e);
        // Fallback or critical error handling
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

// ... (Realtime setup skipped for brevity, assumes standard implementation) ...
export const setupRealtimeListener = () => {
    if(!state.supabase) return;

    const channel = state.supabase.channel('public-db-changes');

    channel
        // 0. MAINTENANCE
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance' }, async (payload) => {
            await fetchMaintenanceStatus();
            render();
        })

        // 1. GAME SESSIONS
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

        // 2. HEIST LOBBIES
        .on('postgres_changes', { event: '*', schema: 'public', table: 'heist_lobbies' }, async (payload) => {
            await fetchGlobalHeists();
            
            if (state.activeCharacter) {
                // If the lobby I was in is deleted (host left), clear my state
                if (payload.eventType === 'DELETE' && state.activeHeistLobby && state.activeHeistLobby.id === payload.old.id) {
                    state.activeHeistLobby = null;
                    state.heistMembers = [];
                    showToast("Le braquage a été annulé (Chef parti ou terminé).", "info");
                } else {
                    await fetchActiveHeistLobby(state.activeCharacter.id);
                }
                await fetchAvailableLobbies(state.activeCharacter.id);
                render();
            }
        })

        // 3. HEIST MEMBERS
        .on('postgres_changes', { event: '*', schema: 'public', table: 'heist_members' }, async (payload) => {
            if (!state.activeCharacter) return;

            if (payload.new?.character_id === state.activeCharacter.id || payload.old?.character_id === state.activeCharacter.id) {
                await fetchActiveHeistLobby(state.activeCharacter.id);
                if (payload.eventType === 'UPDATE' && payload.new.status === 'accepted' && payload.new.character_id === state.activeCharacter.id) {
                    showToast("Vous avez été accepté dans l'équipe !", "success");
                }
                render();
            }
            else if (state.activeHeistLobby && state.activeHeistLobby.host_id === state.activeCharacter.id) {
                 if (payload.new?.lobby_id === state.activeHeistLobby.id || payload.old?.lobby_id === state.activeHeistLobby.id) {
                     await fetchActiveHeistLobby(state.activeCharacter.id);
                     render();
                 }
            }
        })

        // 4. BOUNTIES
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bounties' }, async () => {
            if(state.activeHubPanel === 'illicit') {
                await fetchBounties();
                render();
            }
        })

        // 5. EMERGENCY CALLS
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_calls' }, async () => {
            if(state.activeHubPanel === 'services') {
                await fetchEmergencyCalls();
                render();
            }
        })
        
        // 6. ENTERPRISE MARKET
        .on('postgres_changes', { event: '*', schema: 'public', table: 'enterprise_items' }, async () => {
            if (state.activeHubPanel === 'enterprise') {
                await fetchEnterpriseMarket();
                render();
            }
        })

        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Realtime Sync Active');
            }
        });
};

export const fetchDiscordWidgetData = async () => {
    try {
        // Use the specific JSON API
        const response = await fetch(`https://discord.com/api/guilds/1279455759414857759/widget.json`);
        if (!response.ok) return;
        const data = await response.json();
        const memberMap = {};
        if (data.members) {
            data.members.forEach(m => { 
                // Store by ID. Status is 'online', 'idle', 'dnd'
                memberMap[m.id] = m.status; 
            });
        }
        state.discordStatuses = memberMap;
    } catch (e) { console.warn("Failed to fetch Discord Widget", e); }
};

export const fetchPublicLandingData = async () => {
    if (!state.supabase) return;
    // Ensure keys are loaded first for admin check
    if(state.adminIds.length === 0) await fetchSecureConfig();
    
    await fetchDiscordWidgetData();
    const { data: staff } = await state.supabase.from('profiles').select('id, username, avatar_url, permissions, is_on_duty');
    if (staff) {
        state.landingStaff = staff.filter(p => (p.permissions && Object.keys(p.permissions).length > 0) || state.adminIds.includes(p.id));
    }
    // Check maintenance even on landing
    await fetchMaintenanceStatus();
};

export const fetchMaintenanceStatus = async () => {
    if (!state.supabase) return;
    const { data } = await state.supabase.from('maintenance').select('*').eq('id', 1).maybeSingle();
    if (data) {
        state.maintenance = {
            isActive: data.is_active,
            endTime: data.end_time ? new Date(data.end_time) : null,
            reason: data.reason,
            activatedBy: data.activated_by
        };
    }
};

export const updateMaintenance = async (isActive, durationMinutes, reason) => {
    if (!state.user || !state.adminIds.includes(state.user.id)) return false;
    
    let endTime = null;
    if (isActive && durationMinutes) {
        endTime = new Date(Date.now() + durationMinutes * 60000).toISOString();
    }

    const { error } = await state.supabase.from('maintenance').update({
        is_active: isActive,
        end_time: endTime,
        reason: reason,
        activated_by: isActive ? state.user.username : null
    }).eq('id', 1);

    if (error) {
        showToast("Erreur mise à jour maintenance.", 'error');
        return false;
    }
    await fetchMaintenanceStatus();
    return true;
};

export const fetchCharactersWithProfiles = async (statusFilter = null) => {
    if (!state.user || !state.supabase) return [];
    let query = state.supabase.from('characters').select('*');
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data: chars } = await query;
    if (!chars || chars.length === 0) return [];

    const userIds = [...new Set(chars.map(c => c.user_id))];
    const charIds = chars.map(c => c.id);
    const { data: profiles } = await state.supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);
    const { data: accounts } = await state.supabase.from('bank_accounts').select('*').in('character_id', charIds);

    return chars.map(char => {
        const profile = profiles?.find(p => p.id === char.user_id);
        const bank = accounts?.find(a => a.character_id === char.id) || { bank_balance: 0, cash_balance: 0 };
        return {
            ...char,
            discord_username: profile ? profile.username : 'N/A', // Fixed N/A issue if profile found
            discord_id: profile ? profile.id : null,
            discord_avatar: profile ? profile.avatar_url : null,
            bank_balance: bank.bank_balance,
            cash_balance: bank.cash_balance,
            bank_id: bank.id 
        };
    });
};

export const fetchAllReports = async () => {
    const { data } = await state.supabase.from('police_reports').select('*, police_report_suspects(suspect_name)').order('created_at', { ascending: false }).limit(50);
    state.globalReports = data || [];
};

export const fetchPendingApplications = async () => { state.pendingApplications = await fetchCharactersWithProfiles('pending'); };
export const fetchAllCharacters = async () => { state.allCharactersAdmin = await fetchCharactersWithProfiles(null); };

export const fetchStaffProfiles = async () => {
    if (!state.user || !state.supabase) return;
    // Ensure keys loaded
    if(state.adminIds.length === 0) await fetchSecureConfig();

    await fetchDiscordWidgetData(); 
    const { data: profiles } = await state.supabase.from('profiles').select('*');
    if (profiles) {
        state.staffMembers = profiles.filter(p => (p.permissions && Object.keys(p.permissions).length > 0) || state.adminIds.includes(p.id));
    }
};

export const fetchOnDutyStaff = async () => {
    const { data } = await state.supabase.from('profiles').select('username, avatar_url, id').eq('is_on_duty', true);
    state.onDutyStaff = data || [];
};

// ... (toggleStaffDuty, assignJob, searchProfiles, fetchGlobalHeists, fetchLastFinishedHeist remain same) ...
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
    const { data } = await state.supabase.from('heist_lobbies').select('end_time').eq('status', 'finished').order('end_time', { ascending: false }).limit(1).maybeSingle();
    return data ? new Date(data.end_time) : null;
};

// ... (Session functions remain same) ...
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
    const { data, error } = await state.supabase.from('game_sessions').insert({
        host_id: state.user.id, start_time: new Date(), start_player_count: state.erlcData.currentPlayers || 0, status: 'active'
    }).select().single();
    if(!error) { state.activeGameSession = data; showToast("Session de jeu lancée.", 'success'); }
    else { showToast("Erreur lancement session: " + error.message, 'error'); }
};

export const stopSession = async () => {
    if (!state.activeGameSession || !state.supabase) return;
    await fetchERLCData(); 
    const endCount = state.erlcData.currentPlayers || 0;
    const peak = Math.max(state.activeGameSession.start_player_count, endCount); 
    const modCallsCount = state.erlcData.modCalls ? state.erlcData.modCalls.length : 0;
    const bansCount = state.erlcData.bans ? state.erlcData.bans.length : 0;

    const { error } = await state.supabase.from('game_sessions').update({
        end_time: new Date(), end_player_count: endCount, peak_player_count: peak, mod_calls_count: modCallsCount, bans_count: bansCount, status: 'finished'
    }).eq('id', state.activeGameSession.id);

    if(!error) {
        state.activeGameSession = null;
        await state.supabase.from('profiles').update({ is_on_duty: false }).neq('id', '0');
        await fetchOnDutyStaff();
        showToast("Session fermée. Staff mis hors service.", 'info');
        await fetchSessionHistory();
    } else { showToast("Erreur fermeture session.", 'error'); }
};

// ... (ERLC API, Emergency Calls, Reports, Stats) ...
const getERLCApiKey = async () => {
    if (!state.erlcKey) await fetchSecureConfig();
    return state.erlcKey;
};

export const fetchERLCData = async () => {
    const apiKey = await getERLCApiKey();
    if (!apiKey) return;
    const headers = { 'Server-Key': apiKey };
    const baseUrl = CONFIG.ERLC_API_URL; 
    const endpoints = [baseUrl, `${baseUrl}/players`, `${baseUrl}/queue`, `${baseUrl}/vehicles`, `${baseUrl}/modcalls`, `${baseUrl}/bans`, `${baseUrl}/killlogs`, `${baseUrl}/commandlogs`];

    try {
        const results = await Promise.allSettled(endpoints.map(url => fetch(url, { headers }).then(res => res.ok ? res.json() : null)));
        const [baseRes, playersRes, queueRes, vehiclesRes, modRes, bansRes, killRes, cmdRes] = results;

        if (baseRes.status === 'fulfilled' && baseRes.value) {
            state.erlcData.joinKey = baseRes.value.JoinKey || '?????';
            state.erlcData.maxPlayers = baseRes.value.MaxPlayers || 42;
            state.erlcData.currentPlayers = baseRes.value.CurrentPlayers; 
        }
        if (playersRes.status === 'fulfilled') { state.erlcData.players = playersRes.value || []; state.erlcData.currentPlayers = state.erlcData.players.length; }
        if (queueRes.status === 'fulfilled') state.erlcData.queue = queueRes.value || []; 
        if (vehiclesRes.status === 'fulfilled') state.erlcData.vehicles = vehiclesRes.value || [];
        if (modRes.status === 'fulfilled') state.erlcData.modCalls = modRes.value || [];
        if (bansRes.status === 'fulfilled') state.erlcData.bans = bansRes.value || [];
        if (killRes.status === 'fulfilled') state.erlcData.killLogs = killRes.value || [];
        if (cmdRes.status === 'fulfilled') state.erlcData.commandLogs = cmdRes.value || [];
    } catch (e) { console.warn("ERLC Global Fetch Error", e); }
};

export const executeServerCommand = async (command) => {
    const apiKey = await getERLCApiKey();
    if (!apiKey) return false;
    const commandUrl = "https://api.policeroleplay.community/v1/server/command";
    try {
        const res = await fetch(commandUrl, { method: 'POST', headers: { 'Server-Key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ command: command }) });
        if (res.ok) { showToast(`Commande envoyée : ${command}`, 'success'); return true; }
        else { showToast("Erreur exécution ERLC (API Reject).", 'error'); return false; }
    } catch(e) { showToast("Erreur réseau ERLC.", 'error'); return false; }
};

export const fetchEmergencyCalls = async () => {
    const { data } = await state.supabase.from('emergency_calls').select('*').neq('status', 'closed').order('created_at', { ascending: false });
    state.emergencyCalls = data || [];
};

export const createEmergencyCall = async (service, location, description) => {
    const { error } = await state.supabase.from('emergency_calls').insert({
        caller_id: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`, service, location, description, status: 'pending', joined_units: []
    });
    if(!error) showToast("Appel d'urgence envoyé au central.", 'success'); else showToast("Erreur lors de l'appel.", 'error');
};

export const joinEmergencyCall = async (callId) => {
    const { data: call } = await state.supabase.from('emergency_calls').select('joined_units').eq('id', callId).single();
    if(!call) return;
    
    const myUnit = { 
        name: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`, 
        id: state.activeCharacter.id,
        badge: state.activeCharacter.job === 'leo' ? 'POLICE' : state.activeCharacter.job === 'lafd' ? 'EMS' : 'DOT'
    };
    
    const currentUnits = call.joined_units || [];
    // Check if already joined
    if (currentUnits.some(u => u.id === myUnit.id)) return showToast("Vous êtes déjà sur cet appel.", "warning");
    
    const updatedUnits = [...currentUnits, myUnit];
    
    await state.supabase.from('emergency_calls').update({ joined_units: updatedUnits }).eq('id', callId);
    await fetchEmergencyCalls();
};

export const fetchCharacterReports = async (charId) => {
    const { data: suspectLinks } = await state.supabase.from('police_report_suspects').select('report_id').eq('character_id', charId);
    if (!suspectLinks || suspectLinks.length === 0) { state.policeReports = []; return; }
    const reportIds = suspectLinks.map(l => l.report_id);
    const { data: reports } = await state.supabase.from('police_reports').select('*').in('id', reportIds).order('created_at', { ascending: false });
    state.policeReports = reports || [];
};

export const createPoliceReport = async (reportData, suspects) => {
    const { data: report, error } = await state.supabase.from('police_reports').insert(reportData).select().single();
    if (error || !report) { showToast("Erreur création rapport: " + (error?.message || "Inconnue"), 'error'); return false; }
    const suspectsPayload = suspects.map(s => ({ report_id: report.id, character_id: s.id, suspect_name: s.name }));
    if (suspectsPayload.length > 0) {
        const { error: linkError } = await state.supabase.from('police_report_suspects').insert(suspectsPayload);
        if (linkError) { showToast("Rapport créé mais erreur liaison suspects.", 'warning'); return false; }
    }
    showToast("Rapport archivé avec succès.", 'success'); return true;
};

// ... (Server Stats, Transactions, Gangs, Bounties, Enterprise - mostly unchanged) ...
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

    state.serverStats.totalBank = tBank; 
    state.serverStats.totalCash = tCash; 
    state.serverStats.totalGang = tGang; 
    state.serverStats.totalEnterprise = tEnt;
    state.serverStats.totalMoney = tBank + tCash + tGang + tEnt;
    
    const { data: labs } = await state.supabase.from('drug_labs').select('stock_coke_raw, stock_coke_pure, stock_weed_raw, stock_weed_pure');
    let tCoke = 0, tWeed = 0;
    if (labs) labs.forEach(l => { tCoke += (l.stock_coke_raw || 0) + (l.stock_coke_pure || 0); tWeed += (l.stock_weed_raw || 0) + (l.stock_weed_pure || 0); });
    state.serverStats.totalCoke = tCoke; state.serverStats.totalWeed = tWeed;
};

export const fetchGlobalTransactions = async () => {
    const { data } = await state.supabase.from('transactions').select(`*, sender:characters!sender_id(first_name, last_name), receiver:characters!receiver_id(first_name, last_name)`).order('created_at', { ascending: false }).limit(50);
    state.globalTransactions = data || [];
};

export const fetchDailyEconomyStats = async () => {
    const { data } = await state.supabase.from('transactions').select('amount, created_at').order('created_at', { ascending: false }).limit(500);
    if (!data) return;
    const stats = {};
    data.forEach(t => { const date = new Date(t.created_at).toLocaleDateString(); if(!stats[date]) stats[date] = 0; stats[date] += Math.abs(t.amount); });
    state.dailyEconomyStats = Object.keys(stats).map(date => ({ date, amount: stats[date] }));
};

export const updateEnterpriseBalance = async (entId, newBalance) => {
    const { error } = await state.supabase.from('enterprises').update({ balance: newBalance }).eq('id', entId);
    if(error) console.error("Ent balance update failed", error);
};

export const fetchPendingHeistReviews = async () => {
    const { data: lobbies } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name), heist_members(count)').in('status', ['pending_review', 'active']);
    state.pendingHeistReviews = lobbies || [];
};

export const adminResolveHeist = async (lobbyId, success) => {
    const { data: lobby } = await state.supabase.from('heist_lobbies').select('*').eq('id', lobbyId).single();
    if(!lobby) return;
    if (!success) { await state.supabase.from('heist_lobbies').update({ status: 'failed' }).eq('id', lobbyId); } 
    else {
        const heist = HEIST_DATA.find(h => h.id === lobby.heist_type);
        const rawLoot = Math.floor(Math.random() * (heist.max - heist.min + 1)) + heist.min;
        let distributedLoot = rawLoot, gangTax = 0;
        if (heist.requiresGang) {
            const { data: membership } = await state.supabase.from('gang_members').select('gang_id, gangs(balance)').eq('character_id', lobby.host_id).maybeSingle();
            if (membership) { gangTax = Math.floor(rawLoot * 0.25); distributedLoot = rawLoot - gangTax; await state.supabase.from('gangs').update({ balance: (membership.gangs.balance || 0) + gangTax }).eq('id', membership.gang_id); }
        }
        const { data: members } = await state.supabase.from('heist_members').select('character_id').eq('lobby_id', lobbyId).eq('status', 'accepted');
        const share = Math.floor(distributedLoot / members.length);
        for (const m of members) {
             const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', m.character_id).single();
             if(bank) { await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + share }).eq('character_id', m.character_id); await state.supabase.from('transactions').insert({ sender_id: m.character_id, amount: share, type: 'deposit', description: `Gain Braquage: ${heist.name}` }); }
        }
        await state.supabase.from('heist_lobbies').update({ status: 'finished' }).eq('id', lobbyId);
    }
    await fetchPendingHeistReviews();
};

export const fetchGangs = async () => {
    const { data } = await state.supabase.from('gangs').select('*, leader:characters!gangs_leader_id_fkey(first_name, last_name), co_leader:characters!gangs_co_leader_id_fkey(first_name, last_name)');
    state.gangs = data || [];
};

export const fetchActiveGang = async (charId) => {
    let { data: membership } = await state.supabase.from('gang_members').select('*, gangs(*, leader:characters!gangs_leader_id_fkey(first_name, last_name), co_leader:characters!gangs_co_leader_id_fkey(first_name, last_name))').eq('character_id', charId).maybeSingle();
    if (!membership) {
        const { data: gangOwned } = await state.supabase.from('gangs').select('*, leader:characters!gangs_leader_id_fkey(first_name, last_name), co_leader:characters!gangs_co_leader_id_fkey(first_name, last_name)').or(`leader_id.eq.${charId},co_leader_id.eq.${charId}`).maybeSingle();
        if (gangOwned) {
            const rank = gangOwned.leader_id === charId ? 'leader' : 'co_leader';
            await state.supabase.from('gang_members').upsert({ gang_id: gangOwned.id, character_id: charId, rank: rank, status: 'accepted' }, { onConflict: 'gang_id, character_id' });
            membership = { rank: rank, status: 'accepted', gangs: gangOwned };
        }
    }
    if (membership && membership.gangs) {
        const { data: members } = await state.supabase.from('gang_members').select('rank, character_id, status, characters(id, first_name, last_name)').eq('gang_id', membership.gangs.id);
        state.activeGang = { ...membership.gangs, myRank: membership.rank, myStatus: membership.status, members: members || [], balance: membership.gangs.balance || 0 };
    } else { state.activeGang = null; }
};

export const createGang = async (name, leaderId, coLeaderId) => {
    const { data: gang, error } = await state.supabase.from('gangs').insert({ name, leader_id: leaderId, co_leader_id: coLeaderId || null, balance: 0 }).select().single();
    if (error) { showToast('Erreur création gang: ' + error.message, 'error'); return; }
    await state.supabase.from('gang_members').upsert({ gang_id: gang.id, character_id: leaderId, rank: 'leader', status: 'accepted' });
    if (coLeaderId) { await state.supabase.from('gang_members').upsert({ gang_id: gang.id, character_id: coLeaderId, rank: 'co_leader', status: 'accepted' }); }
    showToast('Gang créé avec succès', 'success');
};

export const updateGang = async (gangId, name, leaderId, coLeaderId) => {
    const { error } = await state.supabase.from('gangs').update({ name, leader_id: leaderId, co_leader_id: coLeaderId || null }).eq('id', gangId);
    if (error) { showToast('Erreur update gang: ' + error.message, 'error'); return; }
    await state.supabase.from('gang_members').upsert({ gang_id: gangId, character_id: leaderId, rank: 'leader', status: 'accepted' }, { onConflict: 'gang_id, character_id'});
    if (coLeaderId) { await state.supabase.from('gang_members').upsert({ gang_id: gangId, character_id: coLeaderId, rank: 'co_leader', status: 'accepted' }, { onConflict: 'gang_id, character_id'}); }
    showToast('Gang mis à jour. Leader/Co-Leader forcés.', 'success');
};

export const updateGangBalance = async (gangId, newBalance) => {
    const { error } = await state.supabase.from('gangs').update({ balance: newBalance }).eq('id', gangId);
    if(error) console.error("Balance update failed", error);
};

export const fetchBounties = async () => {
    const { data } = await state.supabase.from('bounties').select('*, creator:characters!bounties_creator_id_fkey(first_name, last_name)').order('amount', { ascending: false });
    state.bounties = data || [];
};

export const createBounty = async (targetName, amount, description) => {
    if (amount < 10000 || amount > 100000) return showToast('La prime doit être entre $10k et $100k', 'error');
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
    if (bank.cash_balance < amount) return showToast('Fonds insuffisants en liquide.', 'error');
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - amount }).eq('character_id', state.activeCharacter.id);
    const { error } = await state.supabase.from('bounties').insert({ creator_id: state.activeCharacter.id, target_name: targetName, amount, description, status: 'active' });
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

// ... (Enterprise Services) ...
export const fetchEnterprises = async () => { 
    // Used for Admin View and Directory
    const { data } = await state.supabase.from('enterprises').select('*, leader:characters!enterprises_leader_id_fkey(first_name, last_name)'); 
    state.enterprises = data || []; 
};

export const fetchMyEnterprises = async (charId) => {
    const { data: memberships } = await state.supabase.from('enterprise_members').select('*, enterprises(*, items:enterprise_items(count))').eq('character_id', charId);
    if (memberships) { state.myEnterprises = memberships.map(m => ({ ...m.enterprises, myRank: m.rank, myStatus: m.status })); } else { state.myEnterprises = []; }
};

export const createEnterprise = async (name, leaderId) => {
    const { data: ent, error } = await state.supabase.from('enterprises').insert({ name, leader_id: leaderId, balance: 0 }).select().single();
    if (error) { showToast('Erreur création: ' + error.message, 'error'); return; }
    await state.supabase.from('enterprise_members').insert({ enterprise_id: ent.id, character_id: leaderId, rank: 'leader', status: 'accepted' });
    showToast('Entreprise créée avec succès', 'success');
};

export const joinEnterprise = async (entId, charId) => {
    // Check existing
    const {data} = await state.supabase.from('enterprise_members').select('*').eq('enterprise_id', entId).eq('character_id', charId).maybeSingle();
    if(data) return showToast("Vous avez déjà postulé ou êtes membre.", 'warning');

    const { error } = await state.supabase.from('enterprise_members').insert({ enterprise_id: entId, character_id: charId, rank: 'employee', status: 'pending' });
    if(!error) showToast('Candidature envoyée au PDG.', 'success');
    else showToast("Erreur candidature.", 'error');
};

export const fetchEnterpriseMarket = async () => {
    const { data } = await state.supabase.from('enterprise_items').select('*, enterprises(name)').gt('quantity', 0).eq('is_hidden', false).eq('status', 'approved');
    state.enterpriseMarket = data || [];
};

export const fetchPendingEnterpriseItems = async () => {
    const { data } = await state.supabase.from('enterprise_items').select('*, enterprises(name)').eq('status', 'pending');
    state.pendingEnterpriseItems = data || [];
};

export const moderateEnterpriseItem = async (itemId, status) => { await state.supabase.from('enterprise_items').update({ status: status }).eq('id', itemId); };

export const createEnterpriseItem = async (entId, name, price, quantity, paymentType, description) => {
    if (price > 1000000) return showToast("Prix maximum 1 Million $.", 'error');
    // UNIQUE NAME CHECK
    const { data: existing } = await state.supabase.from('enterprise_items').select('id').eq('name', name).maybeSingle();
    if(existing) {
        showToast("Ce nom d'article existe déjà sur le marché (toutes entreprises confondues).", 'error');
        return false;
    }

    await state.supabase.from('enterprise_items').insert({ enterprise_id: entId, name, price, quantity, payment_type: paymentType, description, status: 'pending', is_hidden: false });
    showToast("Article soumis pour validation staff.", 'info');
    return true;
};

export const updateEnterpriseItem = async (itemId, updates) => {
    if (updates.name || updates.price || updates.description) { updates.status = 'pending'; }
    const { error } = await state.supabase.from('enterprise_items').update(updates).eq('id', itemId);
    if (!error) { showToast("Article mis à jour.", 'success'); if (updates.status === 'pending') showToast("Modifications soumises à validation.", 'info'); }
};

export const fetchEnterpriseCirculation = async (entId) => {
    // Unique names mean we can just query inventory by names of items this enterprise has produced (or currently lists)
    // Note: This only tracks items currently listed or tracked. If deleted from market, we might lose tracking unless we keep logs.
    // For now, based on active items.
    const { data: items } = await state.supabase.from('enterprise_items').select('name').eq('enterprise_id', entId);
    if(!items || items.length === 0) return [];
    const names = items.map(i => i.name);
    const { data: inventory } = await state.supabase.from('inventory').select('name, quantity, characters(first_name, last_name)').in('name', names);
    return inventory || [];
};

export const fetchEnterpriseDetails = async (entId) => {
    const { data: ent } = await state.supabase.from('enterprises').select('*').eq('id', entId).single();
    if(!ent) return;
    const { data: members } = await state.supabase.from('enterprise_members').select('*, characters(first_name, last_name)').eq('enterprise_id', entId);
    const { data: items } = await state.supabase.from('enterprise_items').select('*').eq('enterprise_id', entId);
    const myMember = members.find(m => m.character_id === state.activeCharacter.id);
    let circulation = [];
    if (myMember && (myMember.rank === 'leader' || myMember.rank === 'co_leader')) { circulation = await fetchEnterpriseCirculation(entId); }
    state.activeEnterpriseManagement = { ...ent, members: members || [], items: items || [], circulation: circulation, myRank: myMember ? myMember.rank : null };
};

// ... (Rest of file including advent calendar etc.) ...
export const claimAdventReward = async (targetDay) => {
    const today = new Date();
    const currentDay = today.getDate();
    
    if (targetDay < 12 || targetDay > 25) {
        showToast("Date invalide (12-25 Décembre).", 'error');
        return;
    }

    if (targetDay > currentDay) {
        showToast("Patience ! Cette case est verrouillée.", 'error');
        return;
    }

    const claimedDays = state.user.advent_calendar || [];
    if (claimedDays.includes(targetDay)) {
        showToast("Vous avez déjà ouvert cette case.", 'warning');
        return;
    }

    let reward = 0;
    if (targetDay === 25) {
        reward = 25000;
    } else {
        reward = (targetDay - 11) * 1000;
    }

    let extraItemMessage = "";
    const charId = state.activeCharacter.id;

    const newClaimed = [...claimedDays, targetDay];
    const { error } = await state.supabase.from('profiles').update({ advent_calendar: newClaimed }).eq('id', state.user.id);
    
    if (error) {
        showToast("Erreur de sauvegarde.", 'error');
        return;
    }

    const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', charId).single();
    await state.supabase.from('bank_accounts').update({ bank_balance: (bank.bank_balance || 0) + reward }).eq('character_id', charId);
    await state.supabase.from('transactions').insert({ sender_id: null, receiver_id: charId, amount: reward, type: 'deposit', description: `Calendrier Avent (Jour ${targetDay})` });

    state.user.advent_calendar = newClaimed;
    await fetchBankData(charId); 
    
    showModal({
        title: `🎁 Case du ${targetDay} Décembre`,
        content: `
            <div class="text-center">
                <div class="text-4xl mb-4">🎄</div>
                <div class="text-xl font-bold text-white mb-2">${targetDay === 25 ? "Joyeux Noël !" : "Récompense du jour"}</div>
                <p class="text-gray-300">Vous avez reçu un virement de <span class="text-emerald-400 font-bold">$${reward.toLocaleString()}</span>.${extraItemMessage}</p>
            </div>
        `,
        confirmText: "Merci !"
    });
    
    render();
};

export const fetchBankData = async (charId) => {
    let { data: bank, error } = await state.supabase
        .from('bank_accounts')
        .select('*')
        .eq('character_id', charId)
        .maybeSingle(); 
    
    if (!bank) {
        const { data: newBank } = await state.supabase.from('bank_accounts').insert([{ character_id: charId, bank_balance: 5000, cash_balance: 500 }]).select().single();
        bank = newBank;
    }
    state.bankAccount = bank;

    const { data: txs } = await state.supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${charId},receiver_id.eq.${charId}`)
        .order('created_at', { ascending: false })
        .limit(20);
    state.transactions = txs || [];

    const { data: recipients } = await state.supabase
        .from('characters')
        .select('id, first_name, last_name')
        .eq('status', 'accepted')
        .neq('id', charId);
    state.recipientList = recipients || [];
};

export const fetchInventory = async (charId) => {
    if (!state.supabase) return;
    await fetchBankData(charId);
    const { data: items, error } = await state.supabase
        .from('inventory')
        .select('*')
        .eq('character_id', charId);
    state.inventory = items || [];

    const requiredVirtualItems = [
        { id: 'virtual-id-card', name: "Carte d'Identité", icon: 'id-card' },
        { id: 'virtual-credit-card', name: "Carte Bancaire", icon: 'credit-card' },
        { id: 'virtual-license', name: "Permis de Conduire", icon: 'car' }
    ];

    requiredVirtualItems.forEach(vItem => {
        const exists = state.inventory.some(i => i.name === vItem.name);
        if (!exists) {
            state.inventory.unshift({ 
                id: vItem.id, 
                name: vItem.name, 
                quantity: 1, 
                estimated_value: 0, 
                is_virtual: true,
                icon: vItem.icon 
            });
        }
    });

    let total = (state.bankAccount.bank_balance || 0) + (state.bankAccount.cash_balance || 0);
    state.inventory.forEach(item => { total += (item.quantity * item.estimated_value); });
    state.patrimonyTotal = total;
};

// ... (Other functions match previous versions) ...
export const fetchDrugLab = async (charId) => {
    let { data: lab } = await state.supabase.from('drug_labs').select('*').eq('character_id', charId).maybeSingle();
    
    if (!lab) {
        const { data: newLab } = await state.supabase.from('drug_labs').insert([{ character_id: charId }]).select().single();
        lab = newLab;
    }
    state.drugLab = lab;
};

export const updateDrugLab = async (updates) => {
    if(!state.activeCharacter) return;
    await state.supabase.from('drug_labs').update(updates).eq('character_id', state.activeCharacter.id);
    await fetchDrugLab(state.activeCharacter.id);
};

export const fetchActiveHeistLobby = async (charId) => {
    const { data: membership } = await state.supabase.from('heist_members').select('lobby_id').eq('character_id', charId).maybeSingle();
    let lobbyId = membership ? membership.lobby_id : null;
    if (!lobbyId) {
        const { data: hosted } = await state.supabase.from('heist_lobbies').select('id').eq('host_id', charId).neq('status', 'finished').neq('status', 'failed').maybeSingle();
        if(hosted) lobbyId = hosted.id;
    }
    if (lobbyId) {
        const { data: lobby } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name)').eq('id', lobbyId).maybeSingle();
        if (!lobby) { state.activeHeistLobby = null; state.heistMembers = []; await fetchAvailableLobbies(charId); return; }
        if (lobby.characters) { const host = Array.isArray(lobby.characters) ? lobby.characters[0] : lobby.characters; lobby.host_name = host ? `${host.first_name} ${host.last_name}` : 'Inconnu'; } else { lobby.host_name = 'Inconnu'; }
        const { data: members } = await state.supabase.from('heist_members').select('*, characters(first_name, last_name)').eq('lobby_id', lobbyId);
        state.activeHeistLobby = lobby; state.heistMembers = members;
    } else { state.activeHeistLobby = null; state.heistMembers = []; await fetchAvailableLobbies(charId); }
};

export const fetchAvailableLobbies = async (charId) => {
    const { data: lobbies } = await state.supabase.from('heist_lobbies').select('*, characters(first_name, last_name)').in('status', ['setup', 'active']).neq('host_id', charId);
    state.availableHeistLobbies = (lobbies || []).map(l => { const host = Array.isArray(l.characters) ? l.characters[0] : l.characters; return { ...l, host_name: host ? `${host.first_name} ${host.last_name}` : 'Inconnu' }; });
};

export const createHeistLobby = async (heistId, location = null, accessType = 'private') => {
    const { data, error } = await state.supabase.from('heist_lobbies').insert({ host_id: state.activeCharacter.id, heist_type: heistId, status: 'setup', location: location, access_type: accessType }).select().single();
    if(error) { showToast("Erreur création lobby: " + error.message, 'error'); return; }
    await state.supabase.from('heist_members').insert({ lobby_id: data.id, character_id: state.activeCharacter.id, status: 'accepted' });
    await fetchActiveHeistLobby(state.activeCharacter.id);
};

export const inviteToLobby = async (targetId) => {
    if(!state.activeHeistLobby) return;
    const existing = state.heistMembers.find(m => m.character_id === targetId);
    if(existing) return showToast("Déjà dans l'équipe", 'warning');
    await state.supabase.from('heist_members').insert({ lobby_id: state.activeHeistLobby.id, character_id: targetId, status: 'pending' });
};

export const joinLobbyRequest = async (lobbyId) => {
    const charId = state.activeCharacter.id;
    const { data: existing } = await state.supabase.from('heist_members').select('*').eq('character_id', charId).eq('lobby_id', lobbyId).maybeSingle();
    if (existing) { showToast("Vous avez déjà demandé à rejoindre.", 'warning'); return; }
    const { data: lobby } = await state.supabase.from('heist_lobbies').select('access_type').eq('id', lobbyId).single();
    const status = (lobby && lobby.access_type === 'open') ? 'accepted' : 'pending';
    await state.supabase.from('heist_members').insert({ lobby_id: lobbyId, character_id: charId, status: status });
    if (status === 'accepted') { showToast("Vous avez rejoint l'équipe (Accès Libre).", 'success'); } else { showToast("Demande envoyée au chef d'équipe.", 'info'); }
    await fetchActiveHeistLobby(charId);
};

export const acceptLobbyMember = async (targetCharId) => {
    if(!state.activeHeistLobby) return;
    await state.supabase.from('heist_members').update({ status: 'accepted' }).eq('lobby_id', state.activeHeistLobby.id).eq('character_id', targetCharId);
    await fetchActiveHeistLobby(state.activeCharacter.id);
};

export const startHeistSync = async (durationSeconds) => {
    if(!state.activeHeistLobby) return;
    const now = Date.now();
    const endTime = now + (durationSeconds * 1000);
    const { error } = await state.supabase.from('heist_lobbies').update({ status: 'active', start_time: now, end_time: endTime }).eq('id', state.activeHeistLobby.id);
    if(error) showToast("Erreur lancement", 'error');
    await fetchActiveHeistLobby(state.activeCharacter.id);
};