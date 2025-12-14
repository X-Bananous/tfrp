
import { state } from '../state.js';
import { render } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';
import { CONFIG } from '../config.js';

export const setEnterpriseTab = async (tab) => {
    state.activeEnterpriseTab = tab;
    
    // Clear management details if leaving the management view
    if (tab !== 'manage') {
        state.activeEnterpriseManagement = null;
    }

    state.isPanelLoading = true;
    render();
    try {
        if (tab === 'market') {
            await services.fetchEnterpriseMarket();
        } else if (tab === 'directory') {
            await services.fetchEnterprises(); // Fetch all for directory
            await services.fetchMyEnterprises(state.activeCharacter.id); // For button logic
        } else if (tab === 'my_companies') {
            await services.fetchMyEnterprises(state.activeCharacter.id);
        }
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

export const openEnterpriseManagement = async (entId) => {
    state.isPanelLoading = true;
    render();
    await services.fetchEnterpriseDetails(entId);
    state.activeEnterpriseTab = 'manage'; // Special internal tab state
    state.isPanelLoading = false;
    render();
};

export const applyToEnterprise = async (entId) => {
    await services.joinEnterprise(entId, state.activeCharacter.id);
    // Refresh to update UI feedback if needed, although simple toast is usually enough
};

export const addItemToMarket = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    
    // Check permissions (Employee, Leader, Co-Leader)
    const ent = state.activeEnterpriseManagement;
    const rank = ent?.myRank;
    if (!rank || rank === 'pending') return ui.showToast("Accès refusé.", 'error');

    const data = new FormData(e.target);
    const name = data.get('name');
    const description = data.get('description');
    const price = parseInt(data.get('price'));
    const quantity = parseInt(data.get('quantity'));
    const payment = data.get('payment_type');

    // 1. LIMIT CHECKS
    if (name.length > 25) return ui.showToast("Nom trop long (Max 25 car.)", 'error');
    if (description.length > 55) return ui.showToast("Description trop longue (Max 55 car.)", 'error');
    
    // 2. TAX CALCULATION (5%)
    const taxAmount = Math.ceil(price * quantity * 0.05);
    const entBalance = ent.balance || 0;
    
    // CHECK FUNDS
    let taxPaid = false;
    let initialStatus = 'awaiting_tax';
    let isHidden = true; // Hidden until tax paid

    if (entBalance >= taxAmount) {
        taxPaid = true;
        initialStatus = 'pending'; // Go to moderation directly
        isHidden = false; // Staff will see it
    }

    toggleBtnLoading(btn, true);

    // 3. CREATE ITEM
    // If unpaid, just create it but hidden/awaiting_tax. If paid, deduct + pending.
    
    // UNIQUE NAME CHECK
    const { data: existing } = await state.supabase.from('enterprise_items').select('id').eq('name', name).maybeSingle();
    if(existing) {
        ui.showToast("Ce nom d'article existe déjà sur le marché.", 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    if (taxPaid) {
        const { error: taxError } = await state.supabase.from('enterprises')
            .update({ balance: entBalance - taxAmount })
            .eq('id', ent.id);
        
        if (taxError) {
            toggleBtnLoading(btn, false);
            return ui.showToast("Erreur prélèvement taxe.", 'error');
        }
    }

    await state.supabase.from('enterprise_items').insert({ 
        enterprise_id: ent.id, 
        name, 
        price, 
        quantity, 
        payment_type: payment, 
        description, 
        status: initialStatus, 
        is_hidden: isHidden 
    });
    
    if(taxPaid) {
        ui.showToast(`Article ajouté. Taxe payée: $${taxAmount}`, 'success');
    } else {
        ui.showToast(`Article créé (Taxe impayée). Veuillez payer via le panel.`, 'warning');
    }
    
    await services.fetchEnterpriseDetails(ent.id);
    e.target.reset();
    toggleBtnLoading(btn, false);
    render();
};

export const payItemTax = async (itemId) => {
    const ent = state.activeEnterpriseManagement;
    const item = ent.items.find(i => i.id === itemId);
    if (!item || item.status !== 'awaiting_tax') return;

    const taxAmount = Math.ceil(item.price * item.quantity * 0.05);
    
    if ((ent.balance || 0) < taxAmount) {
        return ui.showToast(`Fonds insuffisants ($${taxAmount}).`, 'error');
    }

    ui.showModal({
        title: "Paiement Taxe",
        content: `Payer la taxe de mise en rayon de <b>$${taxAmount}</b> ?<br><small>L'article passera en validation staff.</small>`,
        confirmText: "Payer",
        onConfirm: async () => {
            // Deduct
            await state.supabase.from('enterprises').update({ balance: ent.balance - taxAmount }).eq('id', ent.id);
            // Update Item
            await state.supabase.from('enterprise_items').update({ status: 'pending', is_hidden: false }).eq('id', itemId);
            
            ui.showToast("Taxe payée. Article en attente de validation.", 'success');
            await services.fetchEnterpriseDetails(ent.id);
            render();
        }
    });
};

export const toggleItemVisibility = async (itemId, isHidden) => {
    // Only works if item is not pending
    const item = state.activeEnterpriseManagement.items.find(i => i.id === itemId);
    if(item && (item.status === 'pending' || item.status === 'awaiting_tax')) return ui.showToast("Impossible: Item en attente.", 'error');

    await services.updateEnterpriseItem(itemId, { is_hidden: !isHidden });
    ui.showToast(!isHidden ? "Article masqué." : "Article visible.", 'info');
    await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
    render();
};

export const restockItem = async (itemId) => {
    ui.showModal({
        title: "Réapprovisionnement",
        content: `Entrez la quantité à ajouter au stock :<br><input type="number" id="restock-qty" class="glass-input w-full p-2 mt-2" min="1">`,
        confirmText: "Ajouter",
        onConfirm: async () => {
            const val = parseInt(document.getElementById('restock-qty').value);
            if(!val || val < 1) return;
            
            const item = state.activeEnterpriseManagement.items.find(i => i.id === itemId);
            if(!item) return;
            
            // Tax logic for restocking could apply here too, but instructions only specified creation. 
            // Assuming no tax on simple restock for now to keep it simple, or apply same 5% logic if strict.
            // Let's keep it simple as per prompt "a la creation d'un objet".

            await services.updateEnterpriseItem(itemId, { quantity: item.quantity + val });
            ui.showToast(`Stock mis à jour (+${val}).`, 'success');
            await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
            render();
        }
    });
};

export const updateItem = async (itemId, field, value) => {
    const item = state.activeEnterpriseManagement.items.find(i => i.id === itemId);
    if(item && item.status === 'pending') return ui.showToast("Modif. impossible en cours de validation.", 'error');

    const updates = {};
    updates[field] = value;
    
    await services.updateEnterpriseItem(itemId, updates);
    await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
    render();
};

export const deleteItem = async (itemId) => {
    const item = state.activeEnterpriseManagement.items.find(i => i.id === itemId);
    // Delete is allowed even if pending, to clean up
    ui.showModal({
        title: "Supprimer Article",
        content: "Supprimer définitivement cet article ?",
        confirmText: "Supprimer",
        type: "danger",
        onConfirm: async () => {
            await state.supabase.from('enterprise_items').delete().eq('id', itemId);
            ui.showToast("Article supprimé.", 'info');
            await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
            render();
        }
    });
};

export const openBuyModal = (itemId) => {
    if (!state.activeGameSession) { 
        ui.showToast("Impossible : Session fermée.", 'error'); 
        return; 
    }

    const item = state.enterpriseMarket.find(i => i.id === itemId);
    if(!item) return;

    const currentCash = state.bankAccount ? state.bankAccount.cash_balance : 0;
    const currentBank = state.bankAccount ? state.bankAccount.bank_balance : 0;
    
    // Price Calculation with VAT
    const priceHT = item.price;
    const priceTTC = Math.ceil(priceHT * 1.20); // 20% VAT

    // Calculate max affordable based on TTC
    let maxAffordable = 0;
    if (item.payment_type === 'cash_only') maxAffordable = Math.floor(currentCash / priceTTC);
    else if (item.payment_type === 'bank_only') maxAffordable = Math.floor(currentBank / priceTTC);
    else maxAffordable = Math.floor((currentCash + currentBank) / priceTTC);
    
    // Max purchase is limited by Stock AND Money
    const maxQty = Math.min(item.quantity, maxAffordable);
    const canBuy = maxQty > 0;

    // Helper script for dynamic price
    window.updateBuyTotal = (basePrice) => {
        const qty = parseInt(document.getElementById('buy-qty').value) || 0;
        const totalHT = qty * basePrice;
        const totalVAT = Math.ceil(totalHT * 0.20);
        const totalTTC = totalHT + totalVAT;
        
        document.getElementById('buy-total-ht').textContent = '$' + totalHT.toLocaleString();
        document.getElementById('buy-vat').textContent = '$' + totalVAT.toLocaleString();
        document.getElementById('buy-total-ttc').textContent = '$' + totalTTC.toLocaleString();
    };

    ui.showModal({
        title: "Détails Produit (TTC)",
        content: `
            <div class="flex gap-4 mb-4">
                <div class="w-20 h-20 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                    <i data-lucide="package" class="w-10 h-10"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-white text-lg">${item.name}</h3>
                    <div class="text-xs text-gray-400 mb-2">Vendu par <span class="text-blue-300">${item.enterprises?.name}</span></div>
                    <div class="bg-black/30 p-2 rounded-lg border border-white/5 text-xs text-gray-300 italic mb-2">
                        "${item.description || 'Aucune description fournie.'}"
                    </div>
                </div>
            </div>
            
            <div class="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400">Prix Unitaire (HT)</span>
                    <span class="font-mono text-white">$${priceHT.toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400">TVA (20%)</span>
                    <span class="font-mono text-gray-500">+ $${Math.ceil(priceHT * 0.20).toLocaleString()}</span>
                </div>
                <div class="flex justify-between items-center text-sm border-t border-white/5 pt-2 mt-2">
                    <span class="text-emerald-400 font-bold">Prix Unitaire (TTC)</span>
                    <span class="font-mono font-bold text-emerald-400">$${priceTTC.toLocaleString()}</span>
                </div>
                
                <div class="pt-3 border-t border-white/5">
                    <label class="text-xs text-gray-500 uppercase font-bold mb-1 block">Quantité souhaitée</label>
                    <input type="number" id="buy-qty" class="glass-input w-full p-2 rounded-lg text-sm font-mono" 
                        value="1" min="1" max="${item.quantity}" oninput="window.updateBuyTotal(${priceHT})">
                </div>
                
                <div class="bg-black/40 p-3 rounded-lg mt-2 space-y-1">
                    <div class="flex justify-between items-center text-xs text-gray-500">
                        <span>Total HT</span>
                        <span id="buy-total-ht">$${priceHT.toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs text-gray-500">
                        <span>Total TVA</span>
                        <span id="buy-vat">$${Math.ceil(priceHT * 0.20).toLocaleString()}</span>
                    </div>
                    <div class="flex justify-between items-center pt-1 border-t border-white/10 mt-1">
                        <span class="text-gray-400 text-xs font-bold uppercase">Total à Payer</span>
                        <span class="font-mono font-bold text-xl text-emerald-400" id="buy-total-ttc">$${priceTTC.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            ${!canBuy ? `<div class="mt-2 text-center text-xs text-red-400">Fonds insuffisants.</div>` : ''}
        `,
        confirmText: canBuy ? "Confirmer Achat" : null,
        cancelText: "Annuler",
        onConfirm: () => {
            const qty = parseInt(document.getElementById('buy-qty').value);
            if(qty > 0 && qty <= item.quantity) {
                confirmBuyItem(itemId, qty);
            }
        }
    });
    
    if(window.lucide) lucide.createIcons();
};

export const confirmBuyItem = async (itemId, quantity) => {
    const item = state.enterpriseMarket.find(i => i.id === itemId);
    if(!item) return;
    
    const priceHT = item.price * quantity;
    const priceVAT = Math.ceil(priceHT * 0.20);
    const totalPriceTTC = priceHT + priceVAT;

    const charId = state.activeCharacter.id;
    const { data: bank } = await state.supabase.from('bank_accounts').select('*').eq('character_id', charId).single();
    
    let canPay = false;
    let paySource = '';
    
    if (item.payment_type === 'cash_only' || item.payment_type === 'both') { 
        if (bank.cash_balance >= totalPriceTTC) { canPay = true; paySource = 'cash'; } 
    }
    if (!canPay && (item.payment_type === 'bank_only' || item.payment_type === 'both')) { 
        if (bank.bank_balance >= totalPriceTTC) { canPay = true; paySource = 'bank'; } 
    }
    
    if (!canPay) return ui.showToast(`Fonds insuffisants (TTC: $${totalPriceTTC}).`, 'error');
    
    // 1. Deduct from User (Total TTC)
    const updateBank = {};
    if (paySource === 'cash') updateBank.cash_balance = bank.cash_balance - totalPriceTTC; 
    else updateBank.bank_balance = bank.bank_balance - totalPriceTTC;
    
    await state.supabase.from('bank_accounts').update(updateBank).eq('character_id', charId);
    
    // 2. Add Item to Inventory
    const { data: existingInv } = await state.supabase.from('inventory').select('*').eq('character_id', charId).eq('name', item.name).maybeSingle();
    if (existingInv) { 
        await state.supabase.from('inventory').update({ quantity: existingInv.quantity + quantity }).eq('id', existingInv.id); 
    } else { 
        await state.supabase.from('inventory').insert({ character_id: charId, name: item.name, quantity: quantity, estimated_value: item.price }); 
    }
    
    // 3. Pay Enterprise (HT Only) - VAT is burned/removed from economy
    await state.supabase.from('enterprises').update({ balance: (item.enterprises.balance || 0) + priceHT }).eq('id', item.enterprise_id);
    
    // 4. Update Stock
    if (item.quantity === quantity) { 
        await state.supabase.from('enterprise_items').delete().eq('id', itemId); 
    } else { 
        await state.supabase.from('enterprise_items').update({ quantity: item.quantity - quantity }).eq('id', itemId); 
    }
    
    ui.showToast(`Achat effectué : ${quantity}x ${item.name} (TVA incluse)`, 'success');
    await services.fetchBankData(charId); 
    await services.fetchEnterpriseMarket();
    render();
};

// Legacy method alias for compatibility if needed, but UI now uses openBuyModal
export const buyItem = async (itemId, price) => {
    openBuyModal(itemId);
};

export const quitEnterprise = async (entId) => {
    // Check if leader using the stored list
    const ent = state.myEnterprises.find(e => e.id === entId);
    if (ent && ent.myRank === 'leader') {
        return ui.showToast("Le PDG ne peut pas démissionner. Vous devez dissoudre l'entreprise.", 'error');
    }

    ui.showModal({
        title: "Démissionner",
        content: "Quitter cette entreprise ?",
        confirmText: "Quitter",
        type: "danger",
        onConfirm: async () => {
            await state.supabase.from('enterprise_members').delete()
                .eq('enterprise_id', entId)
                .eq('character_id', state.activeCharacter.id);
            
            ui.showToast("Vous avez quitté l'entreprise.", 'info');
            await services.fetchMyEnterprises(state.activeCharacter.id);
            state.activeEnterpriseTab = 'my_companies';
            render();
        }
    });
};

export const entDeposit = async (e) => {
    e.preventDefault();
    const amt = parseInt(new FormData(e.target).get('amount'));
    const ent = state.activeEnterpriseManagement;
    
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
    if(bank.cash_balance < amt) return ui.showToast("Liquide insuffisant.", 'error');

    // Transfer
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - amt }).eq('character_id', state.activeCharacter.id);
    await state.supabase.from('enterprises').update({ balance: (ent.balance || 0) + amt }).eq('id', ent.id);
    
    ui.showToast(`Dépôt de $${amt} effectué.`, 'success');
    await services.fetchEnterpriseDetails(ent.id);
    render();
};

export const entWithdraw = async (e) => {
    e.preventDefault();
    const amt = parseInt(new FormData(e.target).get('amount'));
    const ent = state.activeEnterpriseManagement;
    
    // Only leaders
    if (ent.myRank !== 'leader') return ui.showToast("Réservé au patron.", 'error');
    if ((ent.balance || 0) < amt) return ui.showToast("Fonds insuffisants.", 'error');
    if (amt > 100000) return ui.showToast("Retrait maximum autorisé : 100 000 $.", 'error');

    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
    
    await state.supabase.from('enterprises').update({ balance: ent.balance - amt }).eq('id', ent.id);
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + amt }).eq('character_id', state.activeCharacter.id);
    
    ui.showToast(`Retrait de $${amt} effectué.`, 'success');
    await services.fetchEnterpriseDetails(ent.id);
    render();
};
