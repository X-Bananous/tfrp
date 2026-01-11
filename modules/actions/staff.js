import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';
import { hasPermission } from '../utils.js';
import { CONFIG } from '../config.js';

export const setStaffTab = async (tab) => {
    state.activeStaffTab = tab;
    state.staffSearchQuery = ''; 
    state.editingGang = null; 
    state.editingEnterprise = null; 
    state.enterpriseCreation = { draftName: '', leaderQuery: '', coLeaderQuery: '', leaderResult: null, coLeaderResult: null, searchResults: [] };
    state.isPanelLoading = true;
    render();

    try {
        if (tab === 'economy' || tab === 'illegal') {
             await services.fetchServerStats();
        }
        if (tab === 'citizens') {
            await Promise.all([
                services.fetchPendingApplications(),
                services.fetchAllCharacters(),
                services.fetchEnterprises()
            ]);
        }
        if (tab === 'economy') {
            await services.fetchGangs();
            if(state.activeEconomySubTab === 'enterprises') {
                await services.fetchEnterprises();
            }
            if(state.activeEconomySubTab === 'stats') {
                await services.fetchGlobalTransactions();
                await services.fetchDailyEconomyStats();
            }
        }
        if (tab === 'illegal') {
            await services.fetchPendingHeistReviews();
            await services.fetchGangs();
        }
        if (tab === 'enterprise') {
            await services.fetchEnterprises();
            await services.fetchPendingEnterpriseItems();
            await services.fetchAllCharacters(); 
        }
        if (tab === 'permissions') {
            await services.fetchStaffProfiles();
        }
        if (tab === 'sanctions') {
            await services.fetchGlobalSanctions();
        }
        if (tab === 'sessions' || tab === 'logs') {
            await services.fetchERLCData();
            await services.fetchActiveSession();
            await services.fetchSessionHistory();
        }
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

// SANCTION ACTIONS
export const searchUserForSanction = async (query) => {
    const container = document.getElementById('sanction-search-results');
    if (!container) return;
    
    state.staffSanctionSearchQuery = query;
    if (query.length > 2) {
        const results = await services.searchProfiles(query);
        state.staffSanctionResults = results;
        
        if (results.length > 0) {
            container.innerHTML = results.map(r => `
                <div onclick="actions.selectUserForSanction('${r.id}', '${r.username}', '${r.avatar_url}')" class="p-4 hover:bg-white/10 cursor-pointer flex items-center gap-4 border-b border-white/5 last:border-0">
                    <img src="${r.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-10 h-10 rounded-xl object-cover border border-white/10">
                    <div>
                        <div class="font-bold text-white text-sm uppercase">${r.username}</div>
                        <div class="text-[9px] text-gray-500 font-mono">UID: ${r.id}</div>
                    </div>
                </div>
            `).join('');
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    } else {
        state.staffSanctionResults = [];
        container.classList.add('hidden');
    }
};

export const selectUserForSanction = async (id, username, avatar_url) => {
    state.activeSanctionTarget = { id, username, avatar_url };
    state.staffSanctionResults = [];
    state.staffSanctionSearchQuery = username;
    
    // Charger l'historique spécifique de la cible
    const { data } = await state.supabase.from('sanctions').select('*').eq('user_id', id).order('created_at', { ascending: false });
    state.activeSanctionTargetHistory = data || [];
    
    render();
};

export const clearSanctionTarget = () => {
    state.activeSanctionTarget = null;
    state.activeSanctionTargetHistory = [];
    state.staffSanctionSearchQuery = '';
    render();
};

export const applySanctionStaff = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const target = state.activeSanctionTarget;
    if (!target) return ui.showToast("Cible non définie.", "error");

    const data = new FormData(e.target);
    const type = data.get('type');
    const reason = data.get('reason');
    const duration = parseInt(data.get('duration'));

    // Check perms
    const myPerms = state.user.permissions || {};
    if (type === 'warn' && !myPerms.can_warn && !state.user.isFounder) return ui.showToast("Pas autorisé à warn.", "error");
    if (type === 'mute' && !myPerms.can_mute && !state.user.isFounder) return ui.showToast("Pas autorisé à mute.", "error");
    if (type === 'ban' && !myPerms.can_ban && !state.user.isFounder) return ui.showToast("Pas autorisé à ban.", "error");

    toggleBtnLoading(btn, true, "Application...");

    const expires_at = duration && duration > 0 ? new Date(Date.now() + duration * 60000).toISOString() : null;
    
    const { error } = await state.supabase.from('sanctions').insert({
        user_id: target.id,
        staff_id: state.user.id,
        type,
        reason,
        expires_at
    });

    if (!error) {
        ui.showToast(`Sanction ${type.toUpperCase()} appliquée.`, "success");
        state.activeSanctionTarget = null;
        state.activeSanctionTargetHistory = [];
        state.staffSanctionSearchQuery = '';
        await services.fetchGlobalSanctions();
        render();
    } else {
        ui.showToast("Erreur serveur lors de la sanction.", "error");
    }
    
    toggleBtnLoading(btn, false);
};

export const revokeSanction = async (sanctionId) => {
    ui.showModal({
        title: "Révoquer la Sanction",
        content: "Cette action annulera définitivement la sanction. Confirmer ?",
        confirmText: "Révoquer",
        type: "danger",
        onConfirm: async () => {
            const { error } = await state.supabase.from('sanctions').delete().eq('id', sanctionId);
            if (!error) {
                ui.showToast("Sanction révoquée.", "info");
                await services.fetchGlobalSanctions();
                render();
            } else {
                ui.showToast("Échec de la révocation.", "error");
            }
        }
    });
};

export const decideSanctionAppeal = async (sanctionId, decision) => {
    const sanction = state.globalSanctions.find(s => s.id === sanctionId);
    if (!sanction) return;

    ui.showModal({
        title: decision === 'approve' ? "Accepter la contestation" : "Rejeter la contestation",
        content: decision === 'approve' 
            ? `En acceptant, la sanction sera <b>définitivement supprimée</b> du casier de ${sanction.target?.username}.`
            : `En rejetant, l'appel sera effacé mais la <b>sanction sera maintenue</b>.`,
        confirmText: "Confirmer la décision",
        type: decision === 'approve' ? "success" : "danger",
        onConfirm: async () => {
            if (decision === 'approve') {
                await state.supabase.from('sanctions').delete().eq('id', sanctionId);
                ui.showToast("Contestation acceptée. Sanction purgée.", "success");
            } else {
                await state.supabase.from('sanctions').update({
                    appeal_text: null,
                    appeal_at: null
                }).eq('id', sanctionId);
                ui.showToast("Contestation rejetée. Sanction maintenue.", "info");
            }
            await services.fetchGlobalSanctions();
            render();
        }
    });
};

export const giveWheelTurn = async (userId) => {
    if (!hasPermission('can_give_wheel_turn')) return;
    
    const { data: profile } = await state.supabase.from('profiles').select('username, whell_turn').eq('id', userId).single();
    const current = profile?.whell_turn || 0;

    ui.showModal({
        title: "Gestion des Tours de Roue",
        content: `
            <div class="space-y-6">
                <div class="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                    <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest">Citoyen : <span class="text-white">${profile?.username || userId}</span></div>
                    <div class="text-right">
                        <div class="text-[8px] text-yellow-500 uppercase font-black mb-1">Solde Actuel</div>
                        <div class="text-xl font-mono font-black text-white">${current} Clé(s)</div>
                    </div>
                </div>

                <p class="text-xs text-gray-400">Sélectionnez l'opération à effectuer :</p>
                
                <div class="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <label class="flex-1 text-center cursor-pointer">
                        <input type="radio" name="turn_mode" value="add" checked class="peer sr-only">
                        <span class="block py-2 text-[10px] font-black uppercase tracking-widest rounded-lg text-gray-500 peer-checked:bg-emerald-600/20 peer-checked:text-emerald-400 transition-all">Ajouter</span>
                    </label>
                    <label class="flex-1 text-center cursor-pointer">
                        <input type="radio" name="turn_mode" value="remove" class="peer sr-only">
                        <span class="block py-2 text-[10px] font-black uppercase tracking-widest rounded-lg text-gray-500 peer-checked:bg-red-600/20 peer-checked:text-red-400 transition-all">Retirer</span>
                    </label>
                </div>

                <div class="space-y-2">
                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Quantité de clés</label>
                    <input type="number" id="wheel-turns-amount" class="glass-input w-full p-4 rounded-2xl text-center font-mono font-black text-2xl" value="1" min="1">
                </div>
                
                <p class="text-[9px] text-gray-600 uppercase font-black tracking-widest text-center italic">Le citoyen sera notifié lors de sa prochaine reconnexion en cas d'ajout.</p>
            </div>
        `,
        confirmText: "Valider la modification",
        onConfirm: async () => {
            const amount = parseInt(document.getElementById('wheel-turns-amount').value);
            const mode = document.querySelector('input[name="turn_mode"]:checked').value;
            
            if (isNaN(amount) || amount < 1) return;

            const newTotal = mode === 'add' ? current + amount : Math.max(0, current - amount);
            
            const { error } = await state.supabase.from('profiles').update({ 
                whell_turn: newTotal,
                isnotified_wheel: mode === 'add' ? false : true 
            }).eq('id', userId);

            if (!error) {
                ui.showToast(`Solde mis à jour (${newTotal} tours).`, 'success');
                await services.fetchStaffProfiles();
                render();
            } else {
                ui.showToast("Erreur lors de la modification des données.", "error");
            }
        }
    });
};

export const setEconomySubTab = async (subTab) => {
    state.activeEconomySubTab = subTab;
    state.isPanelLoading = true;
    render();
    try {
        if (subTab === 'stats') {
             await services.fetchGlobalTransactions();
             await services.fetchDailyEconomyStats();
        }
        if (subTab === 'enterprises') {
            await services.fetchEnterprises();
        }
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

export const setStaffLogTab = (subTab) => {
    state.activeStaffLogTab = subTab;
    state.erlcLogSearch = ''; 
    render();
};

export const staffSearch = (query) => {
    state.staffSearchQuery = query;
    render(); 
    setTimeout(() => {
        const input = document.querySelector('input[placeholder*="Rechercher"]');
        if(input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }, 0);
};

export const searchCommandLogs = (query) => {
    state.erlcLogSearch = query;
    render();
     setTimeout(() => {
        const input = document.querySelector('input[placeholder*="Filtrer"]');
        if(input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }, 0);
};

export const setAdminSort = (field) => {
    state.adminDbSort.field = field;
    render();
};

export const toggleAdminSortDir = () => {
    state.adminDbSort.direction = state.adminDbSort.direction === 'asc' ? 'desc' : 'asc';
    render();
};

export const confirmToggleDuty = (currentStatus) => {
    if (!state.activeGameSession) {
         ui.showToast("Impossible : Aucune session de jeu active.", 'error');
         return;
    }
    
    ui.showModal({
        title: currentStatus ? "Fin de Service" : "Prise de Service",
        content: currentStatus ? "Vous quittez votre service staff." : "Vous entrez en service staff.",
        confirmText: "Confirmer",
        onConfirm: async () => {
            await services.toggleStaffDuty();
            render();
        }
    });
};

export const toggleSession = () => {
    if (!hasPermission('can_launch_session')) return ui.showToast("Permission manquante (LaunchSess).", 'error');

    if (state.activeGameSession) {
        ui.showModal({
            title: "Arrêter Session",
            content: "Voulez-vous fermer la session de jeu actuelle ? Cela bloquera les activités (services, illégal...).",
            confirmText: "Arrêter la Session",
            type: "danger",
            onConfirm: async () => {
                await services.stopSession();
                render();
            }
        });
    } else {
         ui.showModal({
            title: "Lancer Session",
            content: "Ouvrir une nouvelle session de jeu ? Cela débloquera les fonctionnalités RP.",
            confirmText: "Lancer",
            onConfirm: async () => {
                await services.startSession();
                render();
            }
        });
    }
};

export const assignJob = async (charId, jobName) => {
    const char = state.allCharactersAdmin.find(c => c.id === charId);
    if(char && char.alignment === 'illegal' && !['unemployed', 'pdg'].includes(jobName)) {
        ui.showToast('Interdit: Personnage illégal.', 'error');
        render();
        return;
    }

    if (jobName === 'maire') {
        const count = state.allCharactersAdmin.filter(c => c.job === 'maire' && c.id !== charId && c.status === 'accepted').length;
        if (count >= 1) return ui.showToast("Quota atteint : Un seul Maire autorisé.", 'error');
    }
    if (jobName === 'adjoint') {
        const count = state.allCharactersAdmin.filter(c => c.job === 'adjoint' && c.id !== charId && c.status === 'accepted').length;
        if (count >= 2) return ui.showToast("Quota atteint : Maximum 2 Adjoints autorisés.", 'error');
    }

    await services.assignJob(charId, jobName);
    render();
};

export const decideApplication = async (id, status) => {
    if (!hasPermission('can_approve_characters')) return;
    
    const { error } = await state.supabase.from('characters').update({ 
        status: status,
        verifiedby: state.user.id,
        is_notified: false 
    }).eq('id', id);

    if (!error) {
        ui.showToast(`Candidature ${status === 'accepted' ? 'Validée' : 'Refusée'}.`, status === 'accepted' ? 'success' : 'warning');
        await services.fetchPendingApplications();
        await services.fetchAllCharacters();
        render(); 
    } else {
        ui.showToast("Erreur lors de la décision.", "error");
    }
};

export const openAdminEditChar = (charId) => {
    const char = state.allCharactersAdmin.find(c => c.id === charId);
    if(char) {
        state.editingCharacter = char;
        state.isAdminEditing = true; 
        router('create');
    }
};

export const openAdminCreateChar = async () => {
    ui.showModal({
        title: "Créer Personnage (Admin)",
        content: `
            <p class="text-sm text-gray-400 mb-4">Pour qui créez-vous ce personnage ?</p>
            <div class="relative">
                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                <input type="text" placeholder="Rechercher utilisateur Discord..." oninput="actions.searchProfilesForPerms(this.value)" class="glass-input p-3 pl-10 rounded-lg w-full text-sm">
                <div id="perm-search-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar hidden"></div>
            </div>
            <div id="selected-target-preview" class="mt-4 text-emerald-400 font-bold text-center text-sm hidden"></div>
        `,
        confirmText: "Continuer",
        onConfirm: () => {
            if(state.activePermissionUserId) {
                state.editingCharacter = null;
                state.isAdminEditing = true;
                state.adminTargetUserId = state.activePermissionUserId;
                router('create');
            } else {
                ui.showToast("Veuillez sélectionner un utilisateur.", "error");
            }
        }
    });
};

export const adminDeleteCharacter = async (id, name) => {
    ui.showModal({
        title: "Suppression Administrative",
        content: `Supprimer définitivement le citoyen <b>${name}</b> ?`,
        confirmText: "Supprimer",
        type: "danger",
        onConfirm: async () => {
            const { error } = await state.supabase.from('characters').delete().eq('id', id);
            if (!error) { 
                ui.showToast("Citoyen supprimé.", 'info');
                await services.fetchAllCharacters(); 
                await services.fetchPendingApplications(); 
                render(); 
            }
        }
    });
};

export const adminSwitchTeam = async (id, currentAlignment) => {
    if (!hasPermission('can_change_team')) return;
    const newAlign = currentAlignment === 'legal' ? 'illegal' : 'legal';
    const updates = { alignment: newAlign };
    if(newAlign === 'illegal') updates.job = 'unemployed';
    
    await state.supabase.from('characters').update(updates).eq('id', id);
    ui.showToast(`Équipe changée en ${newAlign}`, 'success');
    await services.fetchAllCharacters();
    render();
};

export const adminUpdateLicensePoints = async (charId, points) => {
    if (!hasPermission('can_manage_characters')) return;
    const pts = parseInt(points);
    if(isNaN(pts) || pts < 0 || pts > 12) return ui.showToast("Points invalides (0-12).", "error");
    
    const { error } = await state.supabase.from('characters').update({ driver_license_points: pts }).eq('id', charId);
    if (!error) {
        ui.showToast(`Points mis à jour : ${pts}/12`, 'success');
        await services.fetchAllCharacters();
        render();
    }
};

export const adminToggleBar = async (charId, currentStatus) => {
    if (!hasPermission('can_manage_characters')) return;
    const newStatus = !currentStatus;
    
    const { error } = await state.supabase.from('characters').update({ bar_passed: newStatus }).eq('id', charId);
    if (!error) {
        ui.showToast(newStatus ? "Barreau accordé." : "Barreau révoqué.", 'info');
        await services.fetchAllCharacters();
        render();
    }
};

export const validateHeist = async (lobbyId, success) => {
    if (!hasPermission('can_manage_illegal')) return;
    await services.adminResolveHeist(lobbyId, success);
    ui.showToast(success ? "Braquage validé" : "Braquage échoué", success ? 'success' : 'info');
    render();
};

export const searchEnterpriseLeader = (role, query) => {
    const q = query.toLowerCase();
    const dropdownId = role === 'Leader' ? 'ent-leader-dropdown' : 'ent-coleader-dropdown';
    const container = document.getElementById(dropdownId);
    
    if (role === 'Leader') state.enterpriseCreation.leaderQuery = query;
    else state.enterpriseCreation.coLeaderQuery = query;

    if (query.length > 1) {
        state.enterpriseCreation.searchResults = state.allCharactersAdmin
            .filter(c => c.status === 'accepted' && `${c.first_name} ${c.last_name}`.toLowerCase().includes(q))
            .slice(0, 10);
        
        if (container) {
            container.innerHTML = state.enterpriseCreation.searchResults.map(r => `
                <div onclick="actions.selectEnterpriseLeader('${role}', '${r.id}', '${r.first_name} ${r.last_name}')" class="p-2 hover:bg-white/10 cursor-pointer text-xs text-white border-b border-white/5">
                    ${r.first_name} ${r.last_name}
                </div>
            `).join('');
            container.classList.remove('hidden');
        }
    } else {
        if(container) container.classList.add('hidden');
    }
};

export const selectEnterpriseLeader = (role, id, name) => {
    if (role === 'Leader') {
        state.enterpriseCreation.leaderResult = { id, name };
        state.enterpriseCreation.leaderQuery = name;
    } else {
        state.enterpriseCreation.coLeaderResult = { id, name };
        state.enterpriseCreation.coLeaderQuery = name;
    }
    const dropdownId = role === 'Leader' ? 'ent-leader-dropdown' : 'ent-coleader-dropdown';
    const container = document.getElementById(dropdownId);
    if(container) container.classList.add('hidden');
    render();
};

export const updateEnterpriseDraftName = (name) => {
    state.enterpriseCreation.draftName = name;
};

export const openAdminEditEnterprise = (entId) => {
    const ent = state.enterprises.find(e => e.id === entId);
    if (ent) {
        state.editingEnterprise = ent;
        state.enterpriseCreation.draftName = ent.name;
        state.enterpriseCreation.leaderResult = { id: ent.leader_id, name: `${ent.leader?.first_name} ${ent.leader?.last_name}` };
        state.enterpriseCreation.leaderQuery = `${ent.leader?.first_name} ${ent.leader?.last_name}`;
        if (ent.coleader_id) {
            state.enterpriseCreation.coLeaderResult = { id: ent.coleader_id, name: `${ent.coleader?.first_name} ${ent.coleader?.last_name}` };
            state.enterpriseCreation.coLeaderQuery = `${ent.coleader?.first_name} ${ent.coleader?.last_name}`;
        } else {
            state.enterpriseCreation.coLeaderResult = null;
            state.enterpriseCreation.coLeaderQuery = '';
        }
        render();
    }
};

export const cancelEditEnterprise = () => {
    state.editingEnterprise = null;
    state.enterpriseCreation = { draftName: '', leaderQuery: '', coLeaderQuery: '', leaderResult: null, coLeaderResult: null, searchResults: [] };
    render();
};

export const adminCreateEnterprise = async (e) => {
    e.preventDefault();
    if (!hasPermission('can_manage_enterprises')) return;
    
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const name = state.enterpriseCreation.draftName;
    const leaderId = state.enterpriseCreation.leaderResult?.id;
    const coLeaderId = state.enterpriseCreation.coLeaderResult?.id;

    if (!leaderId) {
        ui.showToast("Un PDG est requis.", 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    if (state.editingEnterprise) {
        await services.updateEnterprise(state.editingEnterprise.id, name, leaderId, coLeaderId);
    } else {
        await services.createEnterprise(name, leaderId, coLeaderId);
    }
    
    state.editingEnterprise = null;
    state.enterpriseCreation = { draftName: '', leaderQuery: '', coLeaderQuery: '', leaderResult: null, coLeaderResult: null, searchResults: [] };
    
    await services.fetchEnterprises();
    render();
    toggleBtnLoading(btn, false);
};

export const adminModerateItem = async (itemId, action) => {
    if (action === 'approve') {
        await services.moderateEnterpriseItem(itemId, 'approved');
        ui.showToast("Article approuvé.", 'success');
    } else {
        const { error } = await state.supabase.from('enterprise_items').delete().eq('id', itemId);
        if (!error) ui.showToast("Article refusé.", 'warning');
    }
    await services.fetchPendingEnterpriseItems();
    render();
};

export const adminDeleteEnterprise = async (entId) => {
    if (!hasPermission('can_manage_enterprises')) return;
    
    const ent = state.enterprises.find(e => e.id === entId);
    if (ent && (ent.name === "L.A. Auto School")) {
        ui.showToast("Impossible de supprimer cette entité.", 'error');
        return;
    }

    ui.showModal({
        title: "Dissoudre Entreprise",
        content: "Cette action supprimera l'entreprise et tous ses membres.",
        confirmText: "Dissoudre",
        type: "danger",
        onConfirm: async () => {
            await state.supabase.from('enterprises').delete().eq('id', entId);
            ui.showToast("Entreprise supprimée.", 'info');
            await services.fetchEnterprises();
            render();
        }
    });
};

export const executeCommand = async (e) => {
    e.preventDefault();
    if (!hasPermission('can_execute_commands')) return;
    
    const btn = e.submitter;
    toggleBtnLoading(btn, true);
    
    const command = new FormData(e.target).get('command');
    await services.executeServerCommand(command);
    
    toggleBtnLoading(btn, false);
    e.target.reset();
};

export const openEditGang = (gangId) => {
    const gang = state.gangs.find(g => g.id === gangId);
    if(gang) {
        state.editingGang = gang;
        state.gangCreation.leaderResult = { id: gang.leader_id, name: `${gang.leader?.first_name} ${gang.leader?.last_name}` };
        state.gangCreation.leaderQuery = `${gang.leader?.first_name} ${gang.leader?.last_name}`;
        if(gang.co_leader_id) {
            state.gangCreation.coLeaderResult = { id: gang.co_leader_id, name: `${gang.co_leader?.first_name} ${gang.co_leader?.last_name}` };
            state.gangCreation.coLeaderQuery = `${gang.co_leader?.first_name} ${gang.co_leader?.last_name}`;
        } else {
            state.gangCreation.coLeaderResult = null;
            state.gangCreation.coLeaderQuery = '';
        }
        render();
    }
};

export const cancelEditGang = () => {
    state.editingGang = null;
    state.gangCreation = { leaderQuery: '', coLeaderQuery: '', leaderResult: null, coLeaderResult: null, searchResults: [] };
    render();
};

export const submitEditGang = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const data = new FormData(e.target);
    const name = data.get('name');
    
    if (!state.gangCreation.leaderResult) {
        ui.showToast("Un Chef est requis.", 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    await services.updateGang(state.editingGang.id, name, state.gangCreation.leaderResult.id, state.gangCreation.coLeaderResult?.id);
    
    state.editingGang = null;
    state.gangCreation = { leaderQuery: '', coLeaderQuery: '', leaderResult: null, coLeaderResult: null, searchResults: [] };
    
    await services.fetchGangs();
    render();
    toggleBtnLoading(btn, false);
};

export const openInventoryModal = async (charId, charName) => {
    if (!hasPermission('can_manage_inventory')) return;
    ui.showToast("Ouverture inventaire...", 'info');
    await services.fetchInventory(charId); 
    state.inventoryModal = { isOpen: true, targetId: charId, targetName: charName, items: state.inventory };
    render();
};
export const closeInventoryModal = () => {
    state.inventoryModal.isOpen = false;
    render();
};

export const manageInventoryItem = async (action, itemId, itemName, event = null) => {
    if (event) event.preventDefault();
    const targetId = state.inventoryModal.targetId;
    
    if (action === 'remove') {
        ui.showModal({
            title: "Confiscation",
            content: "Retirer cet objet ?",
            confirmText: "Confisquer",
            type: "danger",
            onConfirm: async () => {
                await state.supabase.from('inventory').delete().eq('id', itemId);
                refreshInv();
            }
        });
    } else if (action === 'add') {
        const formData = new FormData(event.target);
        await state.supabase.from('inventory').insert({
            character_id: targetId, name: formData.get('item_name'), quantity: parseInt(formData.get('quantity')), estimated_value: 0
        });
        refreshInv();
    }
    
    async function refreshInv() {
        await services.fetchInventory(targetId);
        state.inventoryModal.items = state.inventory;
        render();
    }
};

export const searchProfilesForPerms = async (query) => {
    const container = document.getElementById('perm-search-dropdown');
    if (!container) return;
    
    if (!query) {
        container.classList.add('hidden');
        return;
    }

    const results = await services.searchProfiles(query);
    state.staffPermissionSearchResults = results;
    
    if (results.length > 0) {
         container.innerHTML = results.map(p => `
            <div onclick="actions.selectUserForPerms('${p.id}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                <img src="${p.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-8 h-8 rounded-full bg-gray-700 object-cover">
                <div>
                    <div class="font-bold text-sm text-white">${p.username}</div>
                    <div class="text-[10px] text-gray-500">ID: ${p.id}</div>
                </div>
            </div>
            `).join('');
        container.classList.remove('hidden');
    } else {
         container.classList.add('hidden');
    }
};

export const selectUserForPerms = async (userId) => {
    state.activePermissionUserId = userId; 
    
    if (state.isAdminEditing) {
        const el = document.getElementById('selected-target-preview');
        if(el) {
            el.textContent = "Cible : " + userId;
            el.classList.remove('hidden');
        }
        return;
    }

    let profile = state.staffPermissionSearchResults.find(p => p.id === userId) || state.staffMembers.find(p => p.id === userId);
    
    if(!profile) {
        const { data } = await state.supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        profile = data;
    }
    
    if (!profile) return;
    
    const dropdown = document.getElementById('perm-search-dropdown');
    if(dropdown) dropdown.classList.add('hidden');

    renderPermEditor(profile);
};

export const renderPermEditor = (profile) => {
    const container = document.getElementById('perm-editor-container');
    if (!container) return;

    const currentPerms = profile.permissions || {};
    const isSelf = profile.id === state.user.id;
    const isTargetFounder = state.adminIds.includes(profile.id);
    const isDisabled = isSelf || isTargetFounder;
    
    const PERM_DESCRIPTIONS = {
        can_approve_characters: "Autorise l'examen des dossiers d'immigration (Whitelist). Permet d'accepter ou de rejeter définitivement les nouveaux citoyens en attente de validation.",
        can_manage_characters: "Donne un accès total au Registre National. Permet de modifier les points de permis, révoquer ou accorder le barreau, changer manuellement le métier et purger des dossiers complets.",
        can_manage_economy: "Accès de niveau Trésorier. Permet d'ajuster les soldes bancaires et liquides de n'importe quel citoyen, d'effectuer des saisies ou des crédits globaux sur toute la population.",
        can_manage_illegal: "Supervision des activités criminelles. Permet de créer, dissoudre ou modifier les gangs (syndicats) et de valider/refuser les gains des braquages complexes.",
        can_manage_enterprises: "Contrôle du Registre du Commerce. Autorise la fondation ou la dissolution de n'importe quelle entreprise, ainsi que la modération (approbation/rejet) des articles mis en vente.",
        can_manage_staff: "Accréditation de niveau Commandement. Permet de nommer de nouveaux membres du personnel et de configurer précisément leurs droits'accès administratifs.",
        can_manage_inventory: "Droit de perquisition administrative. Permet de visualiser, confisquer ou injecter des objets directement dans le sac d'un citoyen à distance.",
        can_change_team: "Mutation d'Alignement. Permet de basculer un citoyen du secteur Légal vers l'Illégal et vice-versa, réinitialisant ses accès de faction.",
        can_go_onduty: "Autorisation de Service Live. Permet d'apparaître comme modérateur actif sur le Panel pour les citoyens et d'accéder aux fonctionnalités de terrain.",
        can_manage_jobs: "Gestion des Carrières. Permet d'assigner arbitrairement n'importe quel métier civil ou gouvernemental à un citoyen sans passer par le Pôle Emploi.",
        can_bypass_login: "Accès Racine (Bypass). Permet de naviguer sur l'intégralité du panel administratif sans avoir besoin de charger un personnage citoyen actif.",
        can_launch_session: "Contrôle des Cycles. Autorise l'ouverture et la fermeture des sessions de jeu officielles, déclenchant la synchronisation globale du CAD.",
        can_execute_commands: "Accès au Terminal ERLC. Permet d'envoyer des instructions directes au serveur de jeu via l'API (messages globaux, annonces de braquage, etc.).",
        can_give_wheel_turn: "Gestionnaire de Récompenses. Autorise l'attribution de tours de Roue de la Fortune aux citoyens via le registre administratif.",
        can_use_dm: "Messagerie Directe Bot. Autorise l'envoi de messages privés (MP) via l'identité du bot pour des communications administratives ou RP.",
        can_use_say: "Transmission Publique Bot. Permet d'utiliser le bot pour parler dans les salons textuels publics de façon officielle.",
        can_warn: "Autorise l'application d'avertissements (Warns).",
        can_mute: "Autorise la mise en sourdine (Mute) des citoyens.",
        can_ban: "Autorise le bannissement définitif ou temporaire (Ban)."
    };

    const checkboxes = [
        { k: 'can_approve_characters', l: 'File Whitelist' },
        { k: 'can_manage_characters', l: 'Registre Civil' },
        { k: 'can_manage_economy', l: 'Pilotage Économique' },
        { k: 'can_manage_illegal', l: 'Audit Illégal' },
        { k: 'can_manage_enterprises', l: 'Réseau Commercial' },
        { k: 'can_manage_staff', l: 'Directoire Staff' },
        { k: 'can_manage_inventory', l: 'Saisie d\'Objets' },
        { k: 'can_change_team', l: 'Mutation Secteur' },
        { k: 'can_go_onduty', l: 'Badge Service' },
        { k: 'can_manage_jobs', l: 'Affectation Métier' },
        { k: 'can_bypass_login', l: 'Accès Fondation' },
        { k: 'can_launch_session', l: 'Cycle de Session' },
        { k: 'can_execute_commands', l: 'Console ERLC' },
        { k: 'can_give_wheel_turn', l: 'Maître des Roues' },
        { k: 'can_use_dm', l: 'Messagerie Bot' },
        { k: 'can_use_say', l: 'Transmission Bot' },
        { k: 'can_warn', l: 'Warn System' },
        { k: 'can_mute', l: 'Mute System' },
        { k: 'can_ban', l: 'Ban System' }
    ].map(p => `
        <div class="bg-white/5 p-4 rounded-2xl border border-white/5 transition-all hover:bg-white/[0.08] ${isDisabled ? 'opacity-50 grayscale' : ''}">
            <label class="flex items-center gap-4 cursor-pointer">
                <input type="checkbox" onchange="actions.updatePermission('${profile.id}', '${p.k}', this.checked)" 
                ${currentPerms[p.k] ? 'checked' : ''} 
                ${isDisabled ? 'disabled' : ''}
                class="w-5 h-5 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-700">
                <div class="flex-1 min-w-0">
                    <span class="text-white text-xs font-black uppercase tracking-widest block">${p.l}</span>
                    <span class="text-[9px] text-gray-500 font-medium leading-tight mt-0.5 block">${PERM_DESCRIPTIONS[p.k] || 'Action administrative'}</span>
                </div>
            </label>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="animate-fade-in bg-[#1a1a1c] border border-white/5 p-6 rounded-[32px] mt-4 shadow-2xl">
            <div class="flex items-center justify-between mb-6 border-b border-white/5 pb-6">
                <div class="flex items-center gap-4">
                    <img src="${profile.avatar_url || ''}" class="w-14 h-14 rounded-2xl border border-white/10 shadow-xl">
                    <div>
                        <div class="font-black text-white text-xl uppercase italic tracking-tighter">${profile.username}</div>
                        <div class="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Niveau d'accréditation</div>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="actions.giveWheelTurn('${profile.id}')" class="p-2 bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600 hover:text-white rounded-xl transition-all border border-yellow-600/30" title="Gérer les tours de roue"><i data-lucide="sun" class="w-5 h-5"></i></button>
                    <button onclick="document.getElementById('perm-editor-container').innerHTML = ''; state.activePermissionUserId = null;" class="text-gray-600 hover:text-white transition-colors"><i data-lucide="x-circle" class="w-8 h-8"></i></button>
                </div>
            </div>
            <div class="grid grid-cols-1 gap-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                ${checkboxes}
            </div>
            ${isSelf ? '<div class="mt-6 text-[10px] text-red-400 font-black uppercase text-center border border-red-500/20 bg-red-500/5 p-2 rounded-xl italic">Sécurité : Impossible de s\'auto-éditer</div>' : ''}
        </div>
    `;
    if(window.lucide) lucide.createIcons();
};

export const updatePermission = async (userId, permKey, value) => {
    if (!hasPermission('can_manage_staff')) return;
    
    const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', userId).single();
    const newPerms = { ...(profile.permissions || {}) };
    if (value) newPerms[permKey] = true; else delete newPerms[permKey];
    
    await state.supabase.from('profiles').update({ permissions: newPerms }).eq('id', userId);
    ui.showToast('Permissions mises à jour.', 'success');
    await services.fetchStaffProfiles();
    render(); 
};

export const openEconomyModal = async (targetId, targetName = null) => {
    state.economyModal = { isOpen: true, targetId, targetName, transactions: [] };
    render();
    if (targetId !== 'ALL') {
        const txs = await services.fetchTransactionsForAdmin(targetId);
        state.economyModal.transactions = txs;
        render();
    }
};
export const closeEconomyModal = () => {
    state.economyModal.isOpen = false;
    state.economyModal.targetName = null;
    state.economyModal.transactions = [];
    render();
};

export const executeEconomyAction = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const mode = formData.get('mode'); 
    const amountVal = parseFloat(formData.get('amount'));
    const description = formData.get('description') || 'Staff Action';
    const balanceType = formData.get('balance_type'); 
    const action = e.submitter.value; 
    const targetId = state.economyModal.targetId;
    const isGlobal = targetId === 'ALL';
    
    if (action === 'add' && mode === 'percent') {
        ui.showToast("L'inflation forcée positive est interdite.", 'error');
        return;
    }

    ui.showModal({
        title: "Ratification Budgétaire",
        content: `Confirmer l'intervention de ${amountVal}${mode === 'percent' ? '%' : '$'} sur les comptes ?`,
        confirmText: "Ratifier",
        type: "danger",
        onConfirm: async () => {
            let bankAccountsToUpdate = [];
            if (isGlobal) {
                const { data } = await state.supabase.from('bank_accounts').select('*');
                bankAccountsToUpdate = data;
            } else {
                 const { data } = await state.supabase.from('bank_accounts').select('*').eq('character_id', targetId).maybeSingle();
                 if (data) bankAccountsToUpdate = [data];
            }

            for (const account of bankAccountsToUpdate) {
                const col = balanceType === 'bank' ? 'bank_balance' : 'cash_balance';
                let currentBalance = Number(account[col]);
                let newBalance = currentBalance;
                let logAmount = 0;

                if (mode === 'fixed') {
                    logAmount = amountVal;
                    if (action === 'add') newBalance += amountVal; else newBalance -= amountVal;
                } else {
                    const delta = currentBalance * (amountVal / 100);
                    logAmount = Math.abs(delta);
                    if (action === 'add') newBalance += delta; else newBalance -= delta;
                }
                newBalance = Math.round(newBalance);

                await state.supabase.from('transactions').insert({
                    sender_id: null, 
                    receiver_id: account.character_id, 
                    amount: logAmount,
                    type: 'admin_adjustment', 
                    description: description
                });
                
                const updatePayload = {};
                updatePayload[col] = newBalance;
                await state.supabase.from('bank_accounts').update(updatePayload).eq('id', account.id);
            }

            ui.showToast("Registre économique mis à jour.", 'success');
            closeEconomyModal();
            await services.fetchAllCharacters();
            render();
        }
    });
};

export const adminManageGangBalance = (gangId, action) => {
    ui.showModal({
        title: "Opération Coffre-Fort",
        content: `
            <input type="number" id="gang-admin-amount" class="glass-input w-full p-4 rounded-2xl mb-4 text-center font-mono font-black text-xl" placeholder="Somme ($)">
            <textarea id="gang-admin-reason" class="glass-input w-full p-3 rounded-xl h-24 text-xs italic" placeholder="Motif de l'opération..."></textarea>
        `,
        confirmText: "Valider",
        onConfirm: async () => {
             const amt = parseInt(document.getElementById('gang-admin-amount').value);
             if(!amt || amt <= 0) return;
             const gang = state.gangs.find(g => g.id === gangId);
             let newBalance = (gang.balance || 0) + (action === 'add' ? amt : -amt);
             await services.updateGangBalance(gangId, newBalance);
             ui.showToast("Trésorerie du gang ajustée.", 'success');
             await services.fetchGangs();
             render();
        }
    });
};

export const adminManageEnterpriseBalance = (entId, action) => {
    ui.showModal({
        title: "Régulation Trésorerie Corp.",
        content: `
            <input type="number" id="ent-admin-amount" class="glass-input w-full p-4 rounded-2xl mb-4 text-center font-mono font-black text-xl" placeholder="Somme ($)">
            <textarea id="ent-admin-reason" class="glass-input w-full p-3 rounded-xl h-24 text-xs italic" placeholder="Motif de régulation..."></textarea>
        `,
        confirmText: "Exécuter",
        onConfirm: async () => {
             const amt = parseInt(document.getElementById('ent-admin-amount').value);
             if(!amt || amt <= 0) return;
             const ent = state.enterprises.find(e => e.id === entId);
             let newBalance = (ent.balance || 0) + (action === 'add' ? amt : -amt);
             await services.updateEnterpriseBalance(entId, newBalance);
             ui.showToast("Compte corporation mis à jour.", 'success');
             await services.fetchEnterprises();
             render();
        }
    });
};