

import { state } from '../state.js';
import { render } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';
import { hasPermission } from '../utils.js';
import { CONFIG } from '../config.js';

export const setStaffTab = async (tab) => {
    state.activeStaffTab = tab;
    state.staffSearchQuery = ''; 
    state.editingGang = null; // Reset editing state
    state.isPanelLoading = true;
    render();

    try {
        if (tab === 'economy' || tab === 'illegal') {
             await services.fetchServerStats();
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
            await services.fetchAllCharacters(); // For leader selection
        }
        if (tab === 'sessions' || tab === 'logs') {
            await services.fetchERLCData();
            await services.fetchActiveSession();
            await services.fetchSessionHistory();
            await services.fetchMaintenanceStatus();
        }
    } finally {
        state.isPanelLoading = false;
        render();
    }
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
        const input = document.querySelector('input[placeholder*="Filtrer commandes"]');
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

// MAINTENANCE
export const activateMaintenance = async (e) => {
    e.preventDefault();
    if (!state.adminIds.includes(state.user.id)) return;

    const data = new FormData(e.target);
    const duration = parseInt(data.get('duration')) || 30;
    const reason = data.get('reason') || 'Mise à jour';

    ui.showModal({
        title: "Activer Maintenance ?",
        content: `Cela verrouillera l'accès pour tous les joueurs non-admins pendant <b>${duration} minutes</b>.<br>Raison: ${reason}`,
        confirmText: "VERROUILLER",
        type: "danger",
        onConfirm: async () => {
            const success = await services.updateMaintenance(true, duration, reason);
            if(success) {
                ui.showToast("Mode Maintenance ACTIVÉ.", "warning");
                render();
            }
        }
    });
};

export const toggleMaintenance = async (isActive) => {
    if (!state.adminIds.includes(state.user.id)) return;
    
    if(!isActive) {
        await services.updateMaintenance(false, 0, null);
        ui.showToast("Maintenance désactivée.", "success");
        render();
    }
};

export const assignJob = async (charId, jobName) => {
    const char = state.allCharactersAdmin.find(c => c.id === charId);
    if(char && char.alignment === 'illegal' && jobName !== 'unemployed') {
        ui.showToast('Interdit: Personnage illégal.', 'error');
        render();
        return;
    }
    await services.assignJob(charId, jobName);
    render();
};

export const decideApplication = async (id, status) => {
    if (!hasPermission('can_approve_characters')) return;
    const { error } = await state.supabase.from('characters').update({ status: status }).eq('id', id);
    if (!error) {
        ui.showToast(`Candidature ${status === 'accepted' ? 'Validée' : 'Refusée'}.`, status === 'accepted' ? 'success' : 'warning');
        await services.fetchPendingApplications();
        await services.fetchAllCharacters();
        render(); 
    }
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

export const validateHeist = async (lobbyId, success) => {
    if (!hasPermission('can_manage_illegal')) return;
    await services.adminResolveHeist(lobbyId, success);
    ui.showToast(success ? "Braquage validé" : "Braquage échoué", success ? 'success' : 'info');
    render();
};

// --- ENTERPRISE ADMINISTRATION ---
export const adminCreateEnterprise = async (e) => {
    e.preventDefault();
    if (!hasPermission('can_manage_enterprises')) return;
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    
    if(!state.activePermissionUserId) {
        ui.showToast("Veuillez sélectionner un PDG.", 'error');
        return;
    }

    await services.createEnterprise(name, state.activePermissionUserId);
    
    // Reset state
    state.activePermissionUserId = null;
    state.staffPermissionSearchResults = [];
    e.target.reset();
    
    await services.fetchEnterprises();
    render();
};

export const adminModerateItem = async (itemId, action) => {
    // action: 'approve', 'reject'
    await services.moderateEnterpriseItem(itemId, action === 'approve' ? 'approved' : 'rejected');
    ui.showToast(action === 'approve' ? "Article approuvé." : "Article rejeté.", action === 'approve' ? 'success' : 'warning');
    await services.fetchPendingEnterpriseItems();
    render();
};

export const adminDeleteEnterprise = async (entId) => {
    if (!hasPermission('can_manage_enterprises')) return;
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

// --- ERLC COMMANDS ---
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

// --- GANG ADMINISTRATION ---
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

    if (state.gangCreation.coLeaderResult && state.gangCreation.leaderResult.id === state.gangCreation.coLeaderResult.id) {
         ui.showToast("Le Chef et le Sous-Chef ne peuvent pas être la même personne.", 'error');
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

// Inventory Admin
export const openInventoryModal = async (charId, charName) => {
    if (!hasPermission('can_manage_inventory')) return;
    ui.showToast("Chargement inventaire...", 'info');
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
            character_id: targetId, name: formData.get('item_name'), quantity: parseInt(formData.get('quantity')), estimated_value: parseInt(formData.get('value'))
        });
        refreshInv();
    }
    
    async function refreshInv() {
        await services.fetchInventory(targetId);
        state.inventoryModal.items = state.inventory;
        render();
    }
};

// Permissions
export const searchProfilesForPerms = async (query) => {
    const container = document.getElementById('perm-search-dropdown');
    if (!container) return;
    
    if (!query) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    let results = [];

    // Switch Search Context: Character vs Discord User
    if (state.activeStaffTab === 'enterprise') {
        // Search Characters (Citizens)
        if(!state.allCharactersAdmin || state.allCharactersAdmin.length === 0) {
             await services.fetchAllCharacters();
        }
        const q = query.toLowerCase();
        results = state.allCharactersAdmin
            .filter(c => c.status === 'accepted' && (`${c.first_name} ${c.last_name}`.toLowerCase().includes(q)))
            .slice(0, 10);
    } else {
        // Search Discord Profiles
        results = await services.searchProfiles(query);
    }

    state.staffPermissionSearchResults = results;
    
    if (results.length > 0) {
         container.innerHTML = results.map(p => {
            // Handle differences between Profile (username) and Character (first_name)
            const name = p.username || `${p.first_name} ${p.last_name}`;
            const avatar = p.avatar_url || p.discord_avatar;
            const subtext = state.activeStaffTab === 'enterprise' ? `Citoyen • ${p.discord_username}` : `Discord ID: ${p.id}`;

            return `
            <div onclick="actions.selectUserForPerms('${p.id}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                <img src="${avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-8 h-8 rounded-full bg-gray-700 object-cover">
                <div>
                    <div class="font-bold text-sm text-white">${name}</div>
                    <div class="text-[10px] text-gray-500">${subtext}</div>
                </div>
            </div>
            `;
        }).join('');
        container.classList.remove('hidden');
    } else {
         container.innerHTML = '<div class="p-3 text-xs text-gray-500 italic">Aucun résultat</div>';
         container.classList.remove('hidden');
    }
};

export const selectUserForPerms = async (userId) => {
    state.activePermissionUserId = userId; 
    let profile = state.staffPermissionSearchResults.find(p => p.id === userId);
    
    // Fallback lookups
    if(!profile) profile = state.staffMembers.find(p => p.id === userId);
    if(!profile) profile = state.allCharactersAdmin.find(c => c.id === userId); 
    
    if(!profile) {
        // Try fetching Discord profile if not found in memory (only if not enterprise mode ideally, but acceptable fallback)
        const { data } = await state.supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        profile = data;
    }
    
    if (!profile) return;
    
    const dropdown = document.getElementById('perm-search-dropdown');
    if(dropdown) dropdown.classList.add('hidden');

    if (state.activeStaffTab === 'permissions') {
        renderPermEditor(profile);
    } else if (state.activeStaffTab === 'enterprise') {
        // Special logic for Enterprise Leader Selection
        // Update input with Character Name
        const input = document.getElementById('ent-leader-search');
        if(input) {
            const name = profile.first_name ? `${profile.first_name} ${profile.last_name}` : profile.username;
            input.value = name;
        }
        // Keep ID in state.activePermissionUserId (This is now a UUID from character)
    }
};

export const renderPermEditor = (profile) => {
    const container = document.getElementById('perm-editor-container');
    if (!container) return;

    const currentPerms = profile.permissions || {};
    const isSelf = profile.id === state.user.id;
    const isTargetFounder = state.adminIds.includes(profile.id);
    const isDisabled = isSelf || isTargetFounder;
    
    let warningMsg = '';
    if (isSelf) warningMsg = '<div class="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded">Modification de soi-même interdite.</div>';
    if (isTargetFounder) warningMsg = '<div class="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded">Admin Fondateur (Intouchable).</div>';

    const checkboxes = [
        { k: 'can_approve_characters', l: 'Valider Fiches' },
        { k: 'can_manage_characters', l: 'Gérer Personnages' },
        { k: 'can_manage_economy', l: 'Gérer Économie' },
        { k: 'can_manage_illegal', l: 'Gérer Illégal' },
        { k: 'can_manage_enterprises', l: 'Gérer Entreprises' },
        { k: 'can_manage_staff', l: 'Gérer Staff' },
        { k: 'can_manage_inventory', l: 'Gérer Inventaires' },
        { k: 'can_change_team', l: 'Changer Équipe' },
        { k: 'can_go_onduty', l: 'Prendre Service' },
        { k: 'can_manage_jobs', l: 'Gérer Métiers' },
        { k: 'can_bypass_login', l: 'Bypass Login' },
        { k: 'can_launch_session', l: 'Gérer Sessions' },
        { k: 'can_execute_commands', l: 'Commandes ERLC' }
    ].map(p => `
        <label class="flex items-center gap-3 p-3 bg-white/5 rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'} transition-colors">
            <input type="checkbox" onchange="actions.updatePermission('${profile.id}', '${p.k}', this.checked)" 
            ${currentPerms[p.k] ? 'checked' : ''} 
            ${isDisabled ? 'disabled' : ''}
            class="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700">
            <span class="text-white text-sm font-medium">${p.l}</span>
        </label>
    `).join('');

    container.innerHTML = `
        <div class="animate-fade-in bg-white/5 border border-white/5 p-4 rounded-xl mt-4">
            <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                <div class="flex items-center gap-3">
                    <img src="${profile.avatar_url || ''}" class="w-12 h-12 rounded-full border border-white/10">
                    <div>
                        <div class="font-bold text-white text-lg">${profile.username}</div>
                        <div class="text-xs text-gray-500">Modification des droits</div>
                    </div>
                </div>
                <button onclick="document.getElementById('perm-editor-container').innerHTML = ''; state.activePermissionUserId = null;" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            ${warningMsg}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                ${checkboxes}
            </div>
        </div>
    `;
};

export const updatePermission = async (userId, permKey, value) => {
    if (!hasPermission('can_manage_staff')) return;
    
    state.activePermissionUserId = userId; 
    const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', userId).single();
    const newPerms = { ...(profile.permissions || {}) };
    if (value) newPerms[permKey] = true; else delete newPerms[permKey];
    
    await state.supabase.from('profiles').update({ permissions: newPerms }).eq('id', userId);
    ui.showToast('Permissions mises à jour.', 'success');
    await services.fetchStaffProfiles();
    render(); 
};

// Economy
export const openEconomyModal = (targetId, targetName = null) => {
    state.economyModal = { isOpen: true, targetId, targetName };
    render();
};
export const closeEconomyModal = () => {
    state.economyModal = { isOpen: false, targetId: null, targetName: null };
    render();
};

export const executeEconomyAction = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const mode = formData.get('mode'); // fixed vs percent
    const amountVal = parseFloat(formData.get('amount'));
    const description = formData.get('description') || 'Staff Action';
    const balanceType = formData.get('balance_type'); // 'bank' or 'cash'
    const action = e.submitter.value; // 'add' or 'remove'
    const targetId = state.economyModal.targetId;
    const isGlobal = targetId === 'ALL';
    
    if (action === 'add' && mode === 'percent') {
        ui.showToast("L'ajout par pourcentage (inflation) est interdit.", 'error');
        return;
    }

    const typeLabel = balanceType === 'bank' ? 'Banque' : 'Liquide';

    ui.showModal({
        title: "Action Économique Critique",
        content: `Confirmer ${action === 'add' ? 'Ajout' : 'Retrait'} de ${amountVal}${mode === 'percent' ? '%' : '$'} sur <b>${typeLabel}</b> ?`,
        confirmText: "Exécuter",
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
                // Select column based on type
                const col = balanceType === 'bank' ? 'bank_balance' : 'cash_balance';
                let currentBalance = Number(account[col]);
                let newBalance = currentBalance;

                if (mode === 'fixed') {
                    if (action === 'add') newBalance += amountVal; else newBalance -= amountVal;
                } else {
                    const delta = currentBalance * (amountVal / 100);
                    if (action === 'add') newBalance += delta; else newBalance -= delta;
                }
                newBalance = Math.round(newBalance);

                // Transaction Log
                await state.supabase.from('transactions').insert({
                    sender_id: null, 
                    receiver_id: account.character_id, 
                    amount: (action === 'remove' ? -1 : 1) * (mode === 'fixed' ? amountVal : 0),
                    type: 'admin_adjustment', 
                    description: `${description} (${action} ${amountVal} ${mode} on ${balanceType})`
                });
                
                // Construct dynamic update object
                const updatePayload = {};
                updatePayload[col] = newBalance;

                await state.supabase.from('bank_accounts').update(updatePayload).eq('id', account.id);
            }

            ui.showToast("Opération terminée.", 'success');
            closeEconomyModal();
            await services.fetchAllCharacters();
            render();
        }
    });
};

export const adminManageGangBalance = (gangId, action) => {
    ui.showModal({
        title: action === 'add' ? "Ajouter au Coffre Gang" : "Retirer du Coffre Gang",
        content: `
            <input type="number" id="gang-admin-amount" class="glass-input w-full p-2 mt-2" placeholder="Montant">
            <textarea id="gang-admin-reason" class="glass-input w-full p-2 mt-2 h-20" placeholder="Raison (Admin Log)"></textarea>
        `,
        confirmText: "Valider",
        onConfirm: async () => {
             const amt = parseInt(document.getElementById('gang-admin-amount').value);
             const reason = document.getElementById('gang-admin-reason').value || "Admin Adjustment";
             
             if(!amt || amt <= 0) return;
             
             const gang = state.gangs.find(g => g.id === gangId);
             if(!gang) return;
             
             let newBalance = gang.balance || 0;
             if(action === 'add') newBalance += amt;
             else newBalance -= amt;
             
             await services.updateGangBalance(gangId, newBalance);
             
             ui.showToast(`Coffre mis à jour : $${newBalance}`, 'success');
             await services.fetchGangs();
             render();
        }
    });
};

export const adminManageEnterpriseBalance = (entId, action) => {
    ui.showModal({
        title: action === 'add' ? "Ajouter au Coffre Entreprise" : "Retirer du Coffre Entreprise",
        content: `
            <input type="number" id="ent-admin-amount" class="glass-input w-full p-2 mt-2" placeholder="Montant">
            <textarea id="ent-admin-reason" class="glass-input w-full p-2 mt-2 h-20" placeholder="Raison (Admin Log)"></textarea>
        `,
        confirmText: "Valider",
        onConfirm: async () => {
             const amt = parseInt(document.getElementById('ent-admin-amount').value);
             const reason = document.getElementById('ent-admin-reason').value || "Admin Adjustment";
             
             if(!amt || amt <= 0) return;
             
             const ent = state.enterprises.find(e => e.id === entId);
             if(!ent) return;
             
             let newBalance = ent.balance || 0;
             if(action === 'add') newBalance += amt;
             else newBalance -= amt;
             
             await services.updateEnterpriseBalance(entId, newBalance);
             
             ui.showToast(`Coffre mis à jour : $${newBalance}`, 'success');
             await services.fetchEnterprises();
             render();
        }
    });
};