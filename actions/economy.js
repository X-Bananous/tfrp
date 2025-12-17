

import { state } from '../state.js';
import { render } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';
import { generateInventoryRow } from '../views/assets.js';

export const setBankTab = (tab) => {
    state.activeBankTab = tab;
    render();
};

export const searchRecipients = (query) => {
    const container = document.getElementById('search-results-container');
    if (!container) return;
    if (!query) {
        state.filteredRecipients = [];
        container.classList.add('hidden');
        return;
    }
    const lower = query.toLowerCase();
    const filtered = state.recipientList.filter(r => 
        r.first_name.toLowerCase().includes(lower) || 
        r.last_name.toLowerCase().includes(lower)
    );
    
    if (filtered.length > 0) {
        container.innerHTML = filtered.map(r => `
            <div onclick="actions.selectRecipient('${r.id}', '${r.first_name} ${r.last_name}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">${r.first_name[0]}</div>
                <div class="text-sm text-gray-200">${r.first_name} ${r.last_name}</div>
            </div>
        `).join('');
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
};

export const selectRecipient = (id, name) => {
    state.selectedRecipient = { id, name };
    render(); 
};

export const clearRecipient = () => {
    state.selectedRecipient = null;
    render();
};

export const bankDeposit = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const amount = parseInt(new FormData(e.target).get('amount'));
    if (amount <= 0 || amount > state.bankAccount.cash_balance) {
         toggleBtnLoading(btn, false);
         return;
    }
    const charId = state.activeCharacter.id;
    
    const { error } = await state.supabase.from('bank_accounts').update({
        bank_balance: state.bankAccount.bank_balance + amount,
        cash_balance: state.bankAccount.cash_balance - amount
    }).eq('character_id', charId);
    
    if (error) { ui.showToast("Erreur dépôt", 'error'); }
    else {
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'deposit' });
        await services.fetchBankData(charId);
        ui.showToast(`Dépôt effectué: +$${amount}`, 'success');
        render();
    }
    toggleBtnLoading(btn, false);
};

export const bankWithdraw = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const amount = parseInt(new FormData(e.target).get('amount'));
    if (amount <= 0 || amount > state.bankAccount.bank_balance) {
        toggleBtnLoading(btn, false);
        return;
    }
    const charId = state.activeCharacter.id;
    
    const { error } = await state.supabase.from('bank_accounts').update({
        bank_balance: state.bankAccount.bank_balance - amount,
        cash_balance: state.bankAccount.cash_balance + amount
    }).eq('character_id', charId);
    
    if (error) { ui.showToast("Erreur retrait", 'error'); }
    else {
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'withdraw' });
        await services.fetchBankData(charId);
        ui.showToast(`Retrait effectué: -$${amount}`, 'success');
        render();
    }
    toggleBtnLoading(btn, false);
};

export const bankTransfer = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    
    const data = new FormData(e.target);
    const amount = parseInt(data.get('amount'));
    const targetId = data.get('target_id');
    const description = data.get('description') || 'Virement';
    
    if (amount <= 0 || amount > state.bankAccount.bank_balance || !targetId) { 
        ui.showToast("Données invalides", 'error'); 
        return; 
    }
    
    ui.showModal({
        title: "Confirmation Virement",
        content: `Envoyer <b>$${amount}</b> à <b>${state.selectedRecipient.name}</b> ?`,
        confirmText: "Envoyer",
        onConfirm: async () => {
            toggleBtnLoading(btn, true, 'Envoi...');
            const rpcResult = await state.supabase.rpc('transfer_money', { 
                sender: state.activeCharacter.id, receiver: targetId, amt: amount
            });

            if (rpcResult.error) { ui.showToast("Erreur: " + rpcResult.error.message, 'error'); }
            else {
                const { data: lastTx } = await state.supabase.from('transactions').select('id').eq('sender_id', state.activeCharacter.id).eq('type', 'transfer').order('created_at', { ascending: false }).limit(1).single();
                if (lastTx) await state.supabase.from('transactions').update({ description: description }).eq('id', lastTx.id);
                
                ui.showToast("Virement envoyé avec succès.", 'success');
                state.selectedRecipient = null;
                await services.fetchBankData(state.activeCharacter.id);
                render();
            }
            toggleBtnLoading(btn, false);
        }
    });
};

export const setAssetsTab = (tab) => {
    state.activeAssetsTab = tab;
    render();
};

export const handleInventorySearch = (query) => {
    state.inventoryFilter = query;
    const container = document.getElementById('inventory-list-container');
    if(container) {
        let items = [...state.inventory];
        if(state.bankAccount.cash_balance > 0) items.push({
            id: 'cash', name: 'Espèces', quantity: state.bankAccount.cash_balance, is_cash:true, estimated_value:1
        });
        
        const lower = query.toLowerCase();
        const filtered = items.filter(i => i.name.toLowerCase().includes(lower));
        
        container.innerHTML = filtered.length > 0 
            ? filtered.map(generateInventoryRow).join('') 
            : '<div class="text-center text-gray-500 py-10">Rien trouvé.</div>';
        
        if(window.lucide) lucide.createIcons();
    }
};

export const deleteInventoryItem = async (itemId, itemName, currentQty) => {
    if (currentQty > 1) {
        // Modal for quantity
        ui.showModal({
            title: `Jeter ${itemName}`,
            content: `
                <p class="mb-2 text-sm text-gray-400">Combien voulez-vous jeter ? (Total: ${currentQty})</p>
                <input type="number" id="delete-qty" class="glass-input w-full p-2" min="1" max="${currentQty}" value="1">
            `,
            confirmText: "Jeter",
            type: "danger",
            onConfirm: async () => {
                const qtyToDelete = parseInt(document.getElementById('delete-qty').value);
                if (qtyToDelete > 0 && qtyToDelete <= currentQty) {
                    await processDelete(itemId, qtyToDelete, currentQty);
                }
            }
        });
    } else {
        // Direct confirmation for single item
        ui.showModal({
            title: "Jeter Objet",
            content: `Voulez-vous vraiment jeter <b>${itemName}</b> ?`,
            confirmText: "Jeter",
            type: "danger",
            onConfirm: async () => {
                await processDelete(itemId, 1, 1);
            }
        });
    }

    async function processDelete(id, qty, total) {
        if (qty >= total) {
            await state.supabase.from('inventory').delete().eq('id', id);
        } else {
            await state.supabase.from('inventory').update({ quantity: total - qty }).eq('id', id);
        }
        ui.showToast("Objet(s) jeté(s).", 'info');
        await services.fetchInventory(state.activeCharacter.id);
        render();
    }
};

export const claimAdventReward = async (day) => {
    await services.claimAdventReward(day);
};
