
import { state } from '../state.js';
import { render } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';
import { generateInventoryRow } from '../views/assets.js';

export const setBankTab = (tab) => {
    state.activeBankTab = tab;
    render();
};

export const searchRecipients = (query, mode = 'bank') => {
    const containerId = mode === 'give' ? 'give-recipient-results' : 'search-results-container';
    const container = document.getElementById(containerId);
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
            <div onclick="actions.selectRecipient('${r.id}', '${r.first_name} ${r.last_name}', '${mode}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">${r.first_name[0]}</div>
                <div class="text-sm text-gray-200">${r.first_name} ${r.last_name}</div>
            </div>
        `).join('');
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
};

export const selectRecipient = (id, name, mode = 'bank') => {
    if (mode === 'give') {
        state.selectedGiveRecipient = { id, name };
        const input = document.getElementById('give_recipient_search');
        if (input) {
            input.value = name;
            input.classList.add('text-blue-400', 'font-bold');
        }
        const container = document.getElementById('give-recipient-results');
        if (container) container.classList.add('hidden');
        const confirmBtn = document.getElementById('confirm-give-btn');
        if (confirmBtn) confirmBtn.disabled = false;
        
        updateGiveTaxDisplay();
    } else {
        state.selectedRecipient = { id, name };
        render(); 
    }
};

const updateGiveTaxDisplay = () => {
    const qtyInput = document.getElementById('give-qty');
    const taxEl = document.getElementById('give-tax-summary');
    if (!qtyInput || !taxEl) return;

    const qty = parseInt(qtyInput.value) || 0;
    const estValue = parseInt(qtyInput.dataset.value) || 0;
    const totalValue = qty * estValue;
    
    if (totalValue > 5000) {
        const tax = Math.ceil(totalValue * 0.25);
        taxEl.innerHTML = `
            <div class="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs flex justify-between items-center animate-fade-in">
                <span>Taxe de transfert (25%) :</span>
                <span class="font-bold text-sm">$${tax.toLocaleString()}</span>
            </div>
        `;
    } else {
        taxEl.innerHTML = '';
    }
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
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'deposit', description: 'Dépôt ATM' });
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
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'withdraw', description: 'Retrait ATM' });
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
                
                // NOTIFICATION POUR LE DESTINATAIRE
                const { data: receiver } = await state.supabase.from('characters').select('user_id').eq('id', targetId).single();
                if (receiver?.user_id) {
                    await services.createNotification(
                        "VIREMENT REÇU",
                        `Vous avez reçu un virement de $${amount.toLocaleString()} de la part de ${state.activeCharacter.first_name} ${state.activeCharacter.last_name}. Motif : ${description}`,
                        "success",
                        false,
                        receiver.user_id
                    );
                }

                ui.showToast("Virement envoyé avec succès.", 'success');
                state.selectedRecipient = null;
                await services.fetchBankData(state.activeCharacter.id);
                render();
            }
            toggleBtnLoading(btn, false);
        }
    });
};

export const transferToSavings = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const amount = parseInt(new FormData(e.target).get('amount'));
    const charId = state.activeCharacter.id;

    if (amount <= 0 || amount > state.bankAccount.bank_balance) return;

    toggleBtnLoading(btn, true);
    const { error } = await state.supabase.from('bank_accounts').update({
        bank_balance: state.bankAccount.bank_balance - amount,
        savings_balance: (state.bankAccount.savings_balance || 0) + amount
    }).eq('character_id', charId);

    if (!error) {
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'withdraw', description: 'Placement Épargne' });
        ui.showToast(`$${amount} transférés vers votre épargne.`, 'success');
        await services.fetchBankData(charId);
    } else {
        ui.showToast("Erreur lors du transfert.", 'error');
    }
    toggleBtnLoading(btn, false);
    render();
};

export const withdrawFromSavings = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const amount = parseInt(new FormData(e.target).get('amount'));
    const charId = state.activeCharacter.id;

    if (amount <= 0 || amount > state.bankAccount.savings_balance) return;

    toggleBtnLoading(btn, true);
    const { error } = await state.supabase.from('bank_accounts').update({
        bank_balance: state.bankAccount.bank_balance + amount,
        savings_balance: state.bankAccount.savings_balance - amount
    }).eq('character_id', charId);

    if (!error) {
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'deposit', description: 'Liquidation Épargne' });
        ui.showToast(`$${amount} débloqués vers votre compte courant.`, 'info');
        await services.fetchBankData(charId);
    } else {
        ui.showToast("Erreur lors du retrait.", 'error');
    }
    toggleBtnLoading(btn, false);
    render();
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

export const openGiveItemModal = (itemId, itemName, currentQty, estValue) => {
    state.selectedGiveRecipient = null;
    
    ui.showModal({
        title: "Offrir un objet",
        content: `
            <div class="space-y-4">
                <div>
                    <label class="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1 block">Objet sélectionné</label>
                    <div class="bg-white/5 p-3 rounded-xl border border-white/5 font-bold text-white flex justify-between">
                        <span>${itemName}</span>
                        <span class="text-indigo-400 text-xs uppercase">Stock: ${currentQty}</span>
                    </div>
                </div>

                <div class="relative">
                    <label class="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1 block">Destinataire</label>
                    <div class="relative">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                        <input type="text" id="give_recipient_search" placeholder="Rechercher citoyen..." 
                            oninput="actions.searchRecipients(this.value, 'give')" 
                            class="glass-input p-3 pl-10 rounded-xl w-full text-sm">
                    </div>
                    <div id="give-recipient-results" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-32 overflow-y-auto shadow-2xl custom-scrollbar hidden z-50"></div>
                </div>

                <div>
                    <label class="text-[10px] text-gray-500 uppercase font-bold ml-1 mb-1 block">Quantité à donner</label>
                    <input type="number" id="give-qty" value="1" min="1" max="${currentQty}" 
                        data-value="${estValue}"
                        oninput="window.updateGiveTaxDisplay()"
                        class="glass-input w-full p-3 rounded-xl text-sm font-mono">
                </div>

                <div id="give-tax-summary"></div>
                
                <p class="text-[9px] text-gray-500 leading-relaxed italic">Note: Si la valeur totale dépasse $5,000, une taxe de 25% est prélevée sur votre compte pour frais de notaire.</p>
            </div>
            <button id="confirm-give-btn" onclick="actions.confirmGiveItem('${itemId}', '${itemName.replace(/'/g, "\\'")}', ${estValue})" 
                class="mt-6 w-full glass-btn py-3 rounded-xl font-bold flex items-center justify-center gap-2" disabled>
                <i data-lucide="gift" class="w-4 h-4"></i> Valider le don
            </button>
        `,
        confirmText: null,
        cancelText: "Annuler"
    });
    
    window.updateGiveTaxDisplay = updateGiveTaxDisplay;
    if(window.lucide) lucide.createIcons();
};

export const confirmGiveItem = async (itemId, itemName, estValue) => {
    const qtyInput = document.getElementById('give-qty');
    const qty = parseInt(qtyInput.value);
    const target = state.selectedGiveRecipient;
    
    if (!target || !qty || qty <= 0) return;

    const totalValue = qty * estValue;
    const taxAmount = totalValue > 5000 ? Math.ceil(totalValue * 0.25) : 0;

    ui.showModal({
        title: "Confirmer le Don",
        content: `
            <div class="text-center space-y-4">
                <div class="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 mx-auto">
                    <i data-lucide="send" class="w-8 h-8"></i>
                </div>
                <div>
                    <p class="text-sm text-gray-300">Vous offrez <b>${qty}x ${itemName}</b> à <b>${target.name}</b>.</p>
                    ${taxAmount > 0 ? `<p class="text-orange-400 font-bold mt-2">Taxe à payer : $${taxAmount.toLocaleString()}</p>` : ''}
                </div>
            </div>
        `,
        confirmText: "Confirmer",
        cancelText: "Annuler",
        onConfirm: async () => {
            const charId = state.activeCharacter.id;
            
            if (taxAmount > 0) {
                const { data: bank } = await state.supabase.from('bank_accounts').select('*').eq('character_id', charId).single();
                let canPay = false;
                let payUpdates = {};
                
                if (bank.cash_balance >= taxAmount) {
                    canPay = true;
                    payUpdates.cash_balance = bank.cash_balance - taxAmount;
                } else if (bank.bank_balance >= taxAmount) {
                    canPay = true;
                    payUpdates.bank_balance = bank.bank_balance - taxAmount;
                }

                if (!canPay) return ui.showToast(`Fonds insuffisants pour la taxe ($${taxAmount}).`, 'error');
                
                await state.supabase.from('bank_accounts').update(payUpdates).eq('character_id', charId);
                await state.supabase.from('transactions').insert({
                    sender_id: charId, amount: taxAmount, type: 'withdraw', description: `Taxe don d'objet: ${itemName}`
                });
            }

            const { data: sourceItem } = await state.supabase.from('inventory').select('*').eq('id', itemId).single();
            
            if (sourceItem.quantity <= qty) {
                await state.supabase.from('inventory').delete().eq('id', itemId);
            } else {
                await state.supabase.from('inventory').update({ quantity: sourceItem.quantity - qty }).eq('id', itemId);
            }

            const { data: targetItem } = await state.supabase.from('inventory').select('*').eq('character_id', target.id).eq('name', itemName).maybeSingle();
            
            if (targetItem) {
                await state.supabase.from('inventory').update({ quantity: targetItem.quantity + qty }).eq('id', targetItem.id);
            } else {
                await state.supabase.from('inventory').insert({
                    character_id: target.id,
                    name: itemName,
                    quantity: qty,
                    estimated_value: estValue,
                    object_icon: sourceItem.object_icon || 'package'
                });
            }

            ui.showToast(`Don effectué à ${target.name}.`, 'success');
            await services.fetchInventory(charId);
            render();
        }
    });
};
