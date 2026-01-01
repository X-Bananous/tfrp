
import { state } from '../state.js';
import { render } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';
import { DRUG_DATA, HEIST_DATA, HEIST_LOCATIONS } from '../views/illicit.js';
import { CONFIG } from '../config.js';

export const setIllicitTab = async (tab) => {
    state.activeIllicitTab = tab;
    state.isPanelLoading = true;
    render();
    try {
        if (tab === 'heists') {
             await services.fetchActiveHeistLobby(state.activeCharacter.id);
             await services.fetchAvailableLobbies(state.activeCharacter.id);
        }
        else if (tab === 'drugs') {
            await services.fetchActiveGang(state.activeCharacter.id);
            if (state.activeGang) {
                await services.checkAndCompleteDrugBatch(state.activeGang.id);
                await services.fetchDrugLab(state.activeGang.id);
            }
        }
        else if (tab === 'gangs') {
            await services.fetchGangs();
            await services.fetchActiveGang(state.activeCharacter.id);
        } else if (tab === 'bounties') {
            state.bountyTarget = null;
            state.bountySearchQuery = '';
            await services.fetchBounties();
        }
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

export const searchBlackMarket = (query) => {
    state.blackMarketSearch = query;
    render();
    setTimeout(() => {
        const input = document.querySelector('input[placeholder*="Rechercher arme"]');
        if(input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }, 0);
};

export const buyIllegalItem = async (itemName, price) => {
    if (!state.activeGameSession) {
         ui.showToast("Impossible: Aucune session active.", 'error');
         return;
    }

    ui.showModal({
        title: "Marché Noir",
        content: `Acheter : <b>${itemName}</b> pour <span class="text-emerald-400">$${price}</span> ?`,
        confirmText: "Acheter",
        onConfirm: async () => {
            const charId = state.activeCharacter.id;
            const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', charId).single();
            
            if (!bank || bank.cash_balance < price) {
                ui.showToast("Pas assez de liquide.", 'error');
                return;
            }

            const { error: bankError } = await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - price }).eq('character_id', charId);
            if (bankError) return;

            const { data: existingItem } = await state.supabase.from('inventory').select('*').eq('character_id', charId).eq('name', itemName).maybeSingle();

            if (existingItem) {
                await state.supabase.from('inventory').update({ quantity: existingItem.quantity + 1 }).eq('id', existingItem.id);
            } else {
                await state.supabase.from('inventory').insert({
                    character_id: charId, name: itemName, quantity: 1, estimated_value: price 
                });
            }

            await state.supabase.from('transactions').insert({ sender_id: charId, amount: price, type: 'withdraw', description: `Achat Marché Noir: ${itemName}` });
            await services.fetchBankData(charId);
            ui.showToast(`Objet reçu : ${itemName}`, 'success');
            render();
        }
    });
};

// Gangs
export const updateGangDraftName = (name) => {
    state.gangCreation.draftName = name;
};

export const searchGangSearch = (role, query) => {
    state.gangCreation.target = role;
    if (role === 'Leader') state.gangCreation.leaderQuery = query;
    else state.gangCreation.coLeaderQuery = query;

    const dropdownId = role === 'Leader' ? 'gang-leader-dropdown' : 'gang-coleader-dropdown';
    const container = document.getElementById(dropdownId);
    
    if(!container) return; 

    if(query.length > 1) {
         const lower = query.toLowerCase();
         state.gangCreation.searchResults = state.allCharactersAdmin.filter(c => 
             c.first_name.toLowerCase().includes(lower) || 
             c.last_name.toLowerCase().includes(lower)
         );
         
         if (state.gangCreation.searchResults.length > 0) {
             container.innerHTML = state.gangCreation.searchResults.map(r => `
                <div onclick="actions.selectGangLeader('${role}', '${r.id}', '${r.first_name} ${r.last_name}')" class="p-2 hover:bg-white/10 cursor-pointer text-xs text-white border-b border-white/5">
                    ${r.first_name} ${r.last_name}
                </div>
             `).join('');
             container.classList.remove('hidden');
         } else {
             container.classList.add('hidden');
         }
    } else {
         state.gangCreation.searchResults = [];
         container.classList.add('hidden');
    }
};

export const selectGangLeader = (role, id, name) => {
    if (role === 'Leader') {
        state.gangCreation.leaderResult = { id, name };
        state.gangCreation.leaderQuery = name;
    } else {
        state.gangCreation.coLeaderResult = { id, name };
        state.gangCreation.coLeaderQuery = name;
    }
    state.gangCreation.searchResults = [];
    render(); 
};

export const createGangAdmin = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const data = new FormData(e.target);
    const name = data.get('name');
    
    if (!state.gangCreation.leaderResult) {
        ui.showToast("Veuillez sélectionner un Chef.", 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    await services.createGang(name, state.gangCreation.leaderResult.id, state.gangCreation.coLeaderResult?.id);
    state.gangCreation = { leaderQuery: '', coLeaderQuery: '', leaderResult: null, coLeaderResult: null, searchResults: [] };
    await services.fetchGangs();
    render();
    toggleBtnLoading(btn, false);
};

export const deleteGang = async (gangId) => {
    ui.showModal({
        title: "Dissoudre Gang",
        content: "Supprimer définitivement ce gang ?",
        confirmText: "Supprimer",
        type: "danger",
        onConfirm: async () => {
            await state.supabase.from('gangs').delete().eq('id', gangId);
            ui.showToast("Gang dissous.", 'info');
            await services.fetchGangs();
            render();
        }
    });
};

export const applyToGang = async (gangId) => {
    const { data: existing } = await state.supabase.from('gang_members').select('*').eq('character_id', state.activeCharacter.id).maybeSingle();
    if(existing) return ui.showToast("Vous avez déjà un gang ou une demande en cours.", 'error');
    
    await state.supabase.from('gang_members').insert({
        gang_id: gangId, character_id: state.activeCharacter.id, rank: 'member', status: 'pending'
    });
    ui.showToast("Candidature envoyée.", 'success');
    await services.fetchActiveGang(state.activeCharacter.id);
    render();
};

export const leaveGang = async () => {
    ui.showModal({
        title: "Quitter le Gang",
        content: "Êtes-vous sûr de vouloir quitter votre gang ?",
        confirmText: "Quitter",
        type: "danger",
        onConfirm: async () => {
            const char = state.activeCharacter;
            const gang = state.activeGang;

            if (gang) {
                const memberName = `${char.first_name} ${char.last_name}`;
                const leaderUserId = gang.leader?.user_id;
                const coLeaderUserId = gang.co_leader?.user_id;

                // Notify Leader if it's not the one leaving
                if (leaderUserId && leaderUserId !== state.user.id) {
                    await services.createNotification(
                        "Départ du Gang",
                        `${memberName} a quitté le gang ${gang.name}.`,
                        "warning",
                        false,
                        leaderUserId
                    );
                }
                // Notify Co-Leader if it's not the one leaving
                if (coLeaderUserId && coLeaderUserId !== state.user.id) {
                    await services.createNotification(
                        "Départ du Gang",
                        `${memberName} a quitté le gang ${gang.name}.`,
                        "warning",
                        false,
                        coLeaderUserId
                    );
                }
            }

            await state.supabase.from('gang_members').delete().eq('character_id', char.id);
            state.activeGang = null;
            ui.showToast("Vous avez quitté le gang.", 'info');
            render();
        }
    });
};

export const manageGangRequest = async (charId, action) => {
    if (!state.activeGang) return;
    
    if (action === 'accept') {
        await state.supabase.from('gang_members')
            .update({ status: 'accepted' })
            .eq('gang_id', state.activeGang.id)
            .eq('character_id', charId);
        ui.showToast("Nouveau membre accepté.", 'success');
    } else if (action === 'reject') {
        await state.supabase.from('gang_members')
            .delete()
            .eq('gang_id', state.activeGang.id)
            .eq('character_id', charId);
        ui.showToast("Demande rejetée.", 'info');
    } else if (action === 'kick') {
        ui.showModal({
            title: "Renvoyer Membre",
            content: "Retirer ce membre du gang ?",
            confirmText: "Virer",
            type: "danger",
            onConfirm: async () => {
                 await state.supabase.from('gang_members')
                    .delete()
                    .eq('gang_id', state.activeGang.id)
                    .eq('character_id', charId);
                 await services.fetchActiveGang(state.activeCharacter.id);
                 ui.showToast("Membre exclu.", 'info');
                 render();
            }
        });
        return;
    }
    
    await services.fetchActiveGang(state.activeCharacter.id);
    render();
};

export const gangDeposit = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);
    
    const amount = parseInt(new FormData(e.target).get('amount'));
    const charId = state.activeCharacter.id;
    const gang = state.activeGang;

    if(amount <= 0 || !gang) { toggleBtnLoading(btn, false); return; }

    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', charId).single();
    if(bank.cash_balance < amount) {
        ui.showToast("Pas assez de liquide.", 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - amount }).eq('character_id', charId);
    await services.updateGangBalance(gang.id, (gang.balance || 0) + amount);
    
    // ARCHIVAGE TRANSACTION
    await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'withdraw', description: `Dépôt coffre gang: ${gang.name}` });

    await services.fetchActiveGang(charId);
    await services.fetchBankData(charId);
    ui.showToast("Dépôt effectué.", 'success');
    
    toggleBtnLoading(btn, false);
    render();
};

export const gangWithdraw = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);
    
    const amount = parseInt(new FormData(e.target).get('amount'));
    const charId = state.activeCharacter.id;
    const gang = state.activeGang;

    if(amount <= 0 || !gang) { toggleBtnLoading(btn, false); return; }
    if((gang.balance || 0) < amount) {
        ui.showToast("Fonds du gang insuffisants.", 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', charId).single();
    await services.updateGangBalance(gang.id, gang.balance - amount);
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + amount }).eq('character_id', charId);
    
    // ARCHIVAGE TRANSACTION
    await state.supabase.from('transactions').insert({ receiver_id: charId, amount: amount, type: 'deposit', description: `Retrait coffre gang: ${gang.name}` });

    await services.fetchActiveGang(charId);
    await services.fetchBankData(charId);
    ui.showToast("Retrait effectué.", 'success');
    
    toggleBtnLoading(btn, false);
    render();
};

export const gangDistribute = async (targetId, targetName) => {
    ui.showModal({
        title: "Distribution Fonds",
        content: `Combien voulez-vous donner à <b>${targetName}</b> depuis le coffre ?<br><input type="number" id="distrib-amount" class="glass-input w-full p-2 mt-2" placeholder="Montant">`,
        confirmText: "Envoyer",
        onConfirm: async () => {
            const val = document.getElementById('distrib-amount').value;
            const amount = parseInt(val);
            if(!amount || amount <= 0) return;
            
            const gang = state.activeGang;
            if((gang.balance || 0) < amount) return ui.showToast("Coffre insuffisant.", 'error');

            const { data: targetBank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', targetId).single();
            await services.updateGangBalance(gang.id, gang.balance - amount);
            await state.supabase.from('bank_accounts').update({ cash_balance: targetBank.cash_balance + amount }).eq('character_id', targetId);
            
            // ARCHIVAGE TRANSACTION
            await state.supabase.from('transactions').insert({ 
                sender_id: state.activeCharacter.id, 
                receiver_id: targetId, 
                amount: amount, 
                type: 'transfer', 
                description: `Distribution fonds de gang (${gang.name})` 
            });

            await services.fetchActiveGang(state.activeCharacter.id);
            ui.showToast(`Envoyé $${amount} à ${targetName}`, 'success');
            render();
        }
    });
};

export const searchBountyTarget = (query) => {
    state.bountySearchQuery = query;
    if(query.length > 1 && state.allCharactersAdmin) {
         const lower = query.toLowerCase();
         state.gangCreation.searchResults = state.allCharactersAdmin.filter(c => 
             c.first_name.toLowerCase().includes(lower) || 
             c.last_name.toLowerCase().includes(lower)
         );
    } else {
         state.gangCreation.searchResults = [];
    }
    render();
    setTimeout(() => {
        const input = document.getElementById('bounty_target_input');
        if(input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }, 0);
};

export const selectBountyTarget = (id, name) => {
    state.bountyTarget = { id, name };
    state.bountySearchQuery = name;
    render();
};

export const clearBountyTarget = () => {
    state.bountyTarget = null;
    state.bountySearchQuery = '';
    render();
};

export const createNewBounty = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    if (!state.bountyTarget && !state.bountySearchQuery) {
        ui.showToast('Veuillez définir une cible.', 'error');
        return;
    }
    toggleBtnLoading(btn, true);
    const data = new FormData(e.target);
    const targetName = state.bountyTarget ? state.bountyTarget.name : state.bountySearchQuery;
    await services.createBounty(targetName, parseInt(data.get('amount')), data.get('description'));
    state.bountyTarget = null;
    state.bountySearchQuery = '';
    e.target.reset();
    toggleBtnLoading(btn, false);
    render();
};

export const searchBountyWinner = (query) => {
    state.bountyWinnerSearch.query = query;
    const container = document.getElementById('bounty-winner-results');
    if(!container) return;
    if(query.length > 1 && state.allCharactersAdmin) {
         const lower = query.toLowerCase();
         state.bountyWinnerSearch.results = state.allCharactersAdmin.filter(c => 
             c.first_name.toLowerCase().includes(lower) || 
             c.last_name.toLowerCase().includes(lower)
         );
    } else {
         state.bountyWinnerSearch.results = [];
    }
    if (state.bountyWinnerSearch.results.length > 0) {
        container.innerHTML = state.bountyWinnerSearch.results.map(r => `
            <div onclick="actions.selectBountyWinner('${r.id}', '${r.first_name} ${r.last_name}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">${r.first_name[0]}</div>
                <div class="text-sm text-gray-200">${r.first_name} ${r.last_name}</div>
            </div>
        `).join('');
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
};

export const selectBountyWinner = (id, name) => {
    state.bountyWinnerSearch.selected = { id, name };
    state.bountyWinnerSearch.query = name;
    state.bountyWinnerSearch.results = [];
    const input = document.getElementById('bounty-winner-input');
    if(input) input.value = name;
    const container = document.getElementById('bounty-winner-results');
    if(container) container.classList.add('hidden');
    const confirmBtn = document.getElementById('bounty-confirm-btn');
    if(confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
};

export const confirmBountyWinner = async () => {
    if(!state.bountyWinnerSearch.selected || !state.bountyWinnerSearch.bountyId) return;
    await services.resolveBounty(state.bountyWinnerSearch.bountyId, state.bountyWinnerSearch.selected.id);
    ui.closeModal();
};

export const resolveBounty = async (bountyId, winnerId = null) => {
    if(winnerId === 'CANCEL') {
        ui.showModal({
            title: "Annuler Contrat",
            content: "Annuler ce contrat ?",
            confirmText: "Annuler",
            type: 'danger',
            onConfirm: () => services.resolveBounty(bountyId, null)
        });
    } else {
         state.bountyWinnerSearch = { query: '', results: [], selected: null, bountyId: bountyId };
         ui.showModal({
             title: "Payer la Prime",
             content: `
                <p class="mb-4 text-gray-400 text-sm">Qui a rempli le contrat ? L'argent sera transféré automatiquement.</p>
                <div class="relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                    <input type="text" id="bounty-winner-input" placeholder="Rechercher le chasseur de primes..." oninput="actions.searchBountyWinner(this.value)" class="glass-input w-full p-3 pl-10 rounded-xl text-sm" autocomplete="off">
                    <div id="bounty-winner-results" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-40 overflow-y-auto z-50 shadow-2xl custom-scrollbar hidden"></div>
                </div>
                <button id="bounty-confirm-btn" onclick="actions.confirmBountyWinner()" class="mt-4 w-full glass-btn py-3 rounded-xl font-bold opacity-50 cursor-not-allowed" disabled>Valider le Paiement</button>
             `,
             cancelText: "Fermer"
         });
         if(window.lucide) lucide.createIcons();
    }
};

// Drugs
export const buyLabComponent = async (type, price) => {
    if (!state.activeGang) return ui.showToast("Gang requis.", 'error');
    const charId = state.activeCharacter.id;
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', charId).single();
     if (!bank || bank.cash_balance < price) {
        ui.showToast("Pas assez de liquide.", 'error');
        return;
    }

    ui.showModal({
        title: "Investissement",
        content: `Acheter cet élément pour le gang pour <b>$${price}</b> ?`,
        confirmText: "Payer",
        onConfirm: async () => {
            await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - price }).eq('character_id', charId);
            
            // LOG ACHAT LABO
            await state.supabase.from('transactions').insert({ sender_id: charId, amount: price, type: 'withdraw', description: `Achat installation labo: ${type}` });

            const updates = {};
            if(type === 'building') updates.has_building = true;
            if(type === 'equipment') updates.has_equipment = true;
            await services.updateDrugLab(updates);
            ui.showToast("Installation acquise pour le gang.", 'success');
            await services.fetchBankData(charId); 
            render();
        }
    });
};

export const startDrugAction = async (stage, e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const formData = new FormData(e.target.closest('form') || e.target);
    const type = formData.get('drug_type');
    const amount = parseInt(formData.get('amount'));
    const lab = state.drugLab;

    if (!type || !amount || !lab) {
        ui.showToast("Erreur labo ou formulaire.", 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    if (stage === 'harvest') {
        const lastProd = lab.last_production_date ? new Date(lab.last_production_date) : null;
        if (lastProd) {
            const diffTime = Math.abs(new Date() - lastProd);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays < 7) {
                ui.showToast("Limite atteinte (1x / Semaine pour le gang).", 'error');
                toggleBtnLoading(btn, false);
                return;
            }
        }
    } else if (stage === 'process') {
        const stockKey = type === 'coke' ? 'stock_coke_raw' : 'stock_weed_raw';
        if ((lab[stockKey] || 0) < amount) {
            ui.showToast("Stock insuffisant.", 'error');
            toggleBtnLoading(btn, false);
            return;
        }
    } else if (stage === 'sell') {
        const stockKey = type === 'coke' ? 'stock_coke_pure' : 'stock_weed_pure';
         if ((lab[stockKey] || 0) < amount) {
            ui.showToast("Stock insuffisant.", 'error');
            toggleBtnLoading(btn, false);
            return;
        }
    }

    const durationMinutes = DRUG_DATA[type][stage][amount];
    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    const updates = { current_batch: { type, stage, amount, end_time: endTime } };
    
    if (stage === 'process') {
        const stockKey = type === 'coke' ? 'stock_coke_raw' : 'stock_weed_raw';
        updates[stockKey] = lab[stockKey] - amount;
    } else if (stage === 'sell') {
        const stockKey = type === 'coke' ? 'stock_coke_pure' : 'stock_weed_pure';
        updates[stockKey] = lab[stockKey] - amount;
    } else if (stage === 'harvest') {
        updates.last_production_date = new Date().toISOString();
    }

    await services.updateDrugLab(updates);
    ui.showToast("Opération gang lancée.", 'success');
    render();
    toggleBtnLoading(btn, false);
};

// Heists
export const filterHeistLocations = (query, heistType) => {
    const list = HEIST_LOCATIONS[heistType] || [];
    const container = document.getElementById('loc-results');
    if(!container) return;
    if(!query) { container.classList.add('hidden'); return; }
    const lower = query.toLowerCase();
    const filtered = list.filter(l => l.toLowerCase().includes(lower));
    if(filtered.length > 0) {
        container.innerHTML = filtered.map(l => `
            <div onclick="document.getElementById('loc-input').value = '${l.replace(/'/g, "\\'")}'; document.getElementById('loc-results').classList.add('hidden');" class="p-2 border-b border-white/5 hover:bg-white/10 cursor-pointer text-sm">
                ${l}
            </div>
        `).join('');
        container.classList.remove('hidden');
    } else { container.classList.add('hidden'); }
};

export const finalizeHeistCreation = async (heistId, location, type) => {
    const finalLocation = location === 'null' ? null : location;
    await services.createHeistLobby(heistId, finalLocation, type);
    ui.closeModal();
    render();
};

export const createLobby = async (heistId) => {
    if (!state.activeGameSession) { ui.showToast("Impossible: Aucune session active.", 'error'); return; }
    const lastHeistTime = await services.fetchLastFinishedHeist();
    if (lastHeistTime) {
        const diffMs = Date.now() - lastHeistTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < CONFIG.HEIST_COOLDOWN_MINUTES) {
            ui.showToast(`Zone sous surveillance policière. Attendez ${CONFIG.HEIST_COOLDOWN_MINUTES - diffMins} min.`, 'error');
            return;
        }
    }
    const heist = HEIST_DATA.find(h => h.id === heistId);
    const promptAccessType = (location = null) => {
        setTimeout(() => {
            const locStr = location ? `'${location.replace(/'/g, "\\'")}'` : 'null';
            ui.showModal({
                title: "Type d'Accès",
                content: `
                    <p class="mb-4 text-gray-400">Comment les joueurs peuvent-ils rejoindre ce braquage ?</p>
                    <div class="grid grid-cols-2 gap-4">
                        <button onclick="actions.finalizeHeistCreation('${heistId}', ${locStr}, 'private')" class="p-4 rounded-xl bg-purple-500/20 border border-purple-500 hover:bg-purple-500/30 transition-colors text-left group">
                            <i data-lucide="lock" class="w-8 h-8 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="text-sm font-bold text-white text-center">Restreint</div>
                        </button>
                        <button onclick="actions.finalizeHeistCreation('${heistId}', ${locStr}, 'open')" class="p-4 rounded-xl bg-green-500/20 border border-green-500 hover:bg-green-500/30 transition-colors text-left group">
                            <i data-lucide="unlock" class="w-8 h-8 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform"></i>
                            <div class="text-sm font-bold text-white text-center">Ouvert</div>
                        </button>
                    </div>
                `,
                cancelText: "Annuler",
                confirmText: null
            });
            if(window.lucide) lucide.createIcons();
        }, 300);
    };
    if (heist.requiresLocation) {
        ui.showModal({
            title: `Lieu du Braquage (${heist.name})`,
            content: `
                <p class="mb-4 text-gray-400">Veuillez indiquer l'adresse précise pour synchroniser le dispatch.</p>
                <div class="relative mb-4">
                    <input type="text" id="loc-input" class="glass-input w-full p-3 rounded-lg" placeholder="Rechercher adresse (ex: 7001...)" oninput="actions.filterHeistLocations(this.value, '${heistId}')" autocomplete="off">
                    <div id="loc-results" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-lg mt-1 max-h-40 overflow-y-auto hidden z-50"></div>
                </div>
            `,
            confirmText: "Suivant",
            onConfirm: () => {
                const loc = document.getElementById('loc-input').value;
                if(!loc) return ui.showToast("Adresse requise.", 'error');
                promptAccessType(loc);
            }
        });
    } else { promptAccessType(null); }
};

export const requestJoinLobby = async (lobbyId) => { await services.joinLobbyRequest(lobbyId); render(); };
export const acceptHeistApplicant = async (targetCharId) => {
    const heist = HEIST_DATA.find(h => h.id === state.activeHeistLobby.heist_type);
    const currentCount = state.heistMembers.filter(m => m.status === 'accepted').length;
    if (currentCount >= heist.teamMax) { ui.showToast(`Équipe complète (Max ${heist.teamMax}).`, 'error'); return; }
    await services.acceptLobbyMember(targetCharId);
    ui.showToast('Membre accepté !', 'success');
    render();
};
export const rejectHeistApplicant = async (targetCharId) => {
    if(!state.activeHeistLobby) return;
    await state.supabase.from('heist_members').delete().eq('lobby_id', state.activeHeistLobby.id).eq('character_id', targetCharId);
    ui.showToast('Candidature rejetée.', 'info');
    await services.fetchActiveHeistLobby(state.activeCharacter.id);
    render();
};
export const startHeistLobby = async (timeSeconds) => {
    const heist = HEIST_DATA.find(h => h.id === state.activeHeistLobby.heist_type);
    const currentCount = state.heistMembers.filter(m => m.status === 'accepted').length;
    if (currentCount < heist.teamMin) { ui.showToast(`Effectif insuffisant (Min ${heist.teamMin}).`, 'error'); return; }
    
    // ANNONCE ERLC COMMAND :h
    if (state.activeGameSession) {
        const msg = `[BRAQUAGE] ${heist.name.toUpperCase()} - ${state.activeHeistLobby.location || 'Localisation Inconnue'}`;
        services.executeServerCommand(`:h ${msg}`);
    }

    await services.startHeistSync(timeSeconds);
    render();
};
export const finishHeist = async () => {
    if(!state.activeHeistLobby) return;
    const lobby = state.activeHeistLobby;
    const now = Date.now();
    if (lobby.end_time > now) { ui.showToast("L'opération est toujours en cours !", 'error'); return; }
    const heist = HEIST_DATA.find(h => h.id === lobby.heist_type);
    if (heist.requiresValidation) {
        await state.supabase.from('heist_lobbies').update({ status: 'pending_review' }).eq('id', lobby.id);
        ui.showModal({
            title: "Validation Requise",
            content: "Braquage terminé. En attente de validation administrative.",
            confirmText: "Fermer",
            onConfirm: async () => { await services.fetchActiveHeistLobby(state.activeCharacter.id); render(); }
        });
        return;
    }
    const members = state.heistMembers.filter(m => m.status === 'accepted');
    const groupSize = members.length;
    if(groupSize === 0) return; 
    const rawLoot = Math.floor(Math.random() * (heist.max - heist.min + 1)) + heist.min;
    let distributedLoot = rawLoot;
    let gangTax = 0;
    if (heist.requiresGang && state.activeGang) {
        gangTax = Math.floor(rawLoot * 0.25);
        distributedLoot = rawLoot - gangTax;
        await services.updateGangBalance(state.activeGang.id, (state.activeGang.balance || 0) + gangTax);
    }
    const myShare = Math.floor(distributedLoot / groupSize);
    for(const member of members) {
        const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', member.character_id).single();
        if(bank) {
            await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + myShare }).eq('character_id', member.character_id);
            await state.supabase.from('transactions').insert({ sender_id: member.character_id, amount: myShare, type: 'deposit', description: `Gain Braquage: ${heist.name}` });
        }
    }
    await state.supabase.from('heist_lobbies').update({ status: 'finished' }).eq('id', lobby.id);
    const message = `Braquage RÉUSSI ! Part par personne: <span class="text-emerald-400 font-bold">$${myShare.toLocaleString()}</span>.`;
    ui.showModal({ title: "Mission Accomplie", content: message, confirmText: "Fermer", onConfirm: async () => { await services.fetchActiveHeistLobby(state.activeCharacter.id); render(); } });
};
export const stopHeist = async () => {
    if(!state.activeHeistLobby) return;
    ui.showModal({
        title: "Arrêter le braquage",
        content: "Voulez-vous vraiment annuler l'opération ?",
        confirmText: "Abandonner",
        type: "danger",
        onConfirm: async () => {
             if (state.activeHeistLobby.status === 'active') { await state.supabase.from('heist_lobbies').update({ status: 'failed' }).eq('id', state.activeHeistLobby.id); } 
             else { await state.supabase.from('heist_lobbies').delete().eq('id', state.activeHeistLobby.id); }
             state.activeHeistLobby = null; state.heistMembers = []; ui.showToast("Opération annulée.", 'info'); render();
        }
    });
};
export const leaveLobby = async () => {
    if(!state.activeHeistLobby) return;
    if (state.activeHeistLobby.host_id === state.activeCharacter.id) { await state.supabase.from('heist_lobbies').delete().eq('id', state.activeHeistLobby.id); ui.showToast('Équipe dissoute.', 'info'); } 
    else { await state.supabase.from('heist_members').delete().eq('lobby_id', state.activeHeistLobby.id).eq('character_id', state.activeCharacter.id); ui.showToast('Vous avez quitté l\'équipe.', 'info'); }
    state.activeHeistLobby = null; state.heistMembers = []; await services.fetchActiveHeistLobby(state.activeCharacter.id); state.activeIllicitTab = 'heists'; render();
};
