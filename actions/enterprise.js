






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
            await services.fetchTopSellers(); // LOAD BEST SELLERS
            await services.fetchEnterprises(); // For filter list
        } else if (tab === 'directory') {
            await services.fetchEnterprises(); // Fetch all for directory
            await services.fetchMyEnterprises(state.activeCharacter.id); // For button logic
        } else if (tab === 'my_companies') {
            await services.fetchMyEnterprises(state.activeCharacter.id);
        } else if (tab === 'appointments') {
            await services.fetchClientAppointments(state.activeCharacter.id);
        }
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

export const setEnterpriseManageTab = (tab) => {
    state.activeEnterpriseManageTab = tab;
    render();
};

export const cancelClientAppointment = async (aptId) => {
    ui.showModal({
        title: "Annuler Rendez-vous",
        content: "Voulez-vous annuler ce rendez-vous ?",
        confirmText: "Oui, annuler",
        type: "danger",
        onConfirm: async () => {
            const { error } = await state.supabase.from('enterprise_appointments').delete().eq('id', aptId);
            if(error) ui.showToast("Erreur annulation.", "error");
            else ui.showToast("Rendez-vous annulé.", "info");
            await services.fetchClientAppointments(state.activeCharacter.id);
            render();
        }
    });
};

export const filterMarketByEnterprise = (entId) => {
    state.marketEnterpriseFilter = entId;
    render();
};

export const openEnterpriseManagement = async (entId) => {
    state.isPanelLoading = true;
    render();
    await services.fetchEnterpriseDetails(entId);
    state.activeEnterpriseTab = 'manage'; 
    state.activeEnterpriseManageTab = 'dashboard'; // Reset to dashboard
    state.isPanelLoading = false;
    render();
};

export const applyToEnterprise = async (entId) => {
    await services.joinEnterprise(entId, state.activeCharacter.id);
    // Refresh to update UI feedback if needed, although simple toast is usually enough
};

// ICON PICKER LOGIC
export const openIconPicker = () => {
    state.iconPickerOpen = true;
    state.iconSearchQuery = '';
    render();
    setTimeout(() => {
        const input = document.querySelector('input[placeholder*="Rechercher"]');
        if(input) input.focus();
    }, 50);
};

export const closeIconPicker = () => {
    state.iconPickerOpen = false;
    render();
};

export const searchIcons = (query) => {
    state.iconSearchQuery = query;
    render();
    setTimeout(() => {
        const input = document.querySelector('input[placeholder*="Rechercher"]');
        if(input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }, 0);
};

export const selectIcon = (iconName) => {
    state.selectedCreateIcon = iconName;
    state.iconPickerOpen = false;
    render();
};

export const addItemToMarket = async (e) => {
    e.preventDefault();
    const btn = e.submitter || e.target.querySelector('button[type="submit"]');
    
    // Check permissions (Employee, Leader, Co-Leader)
    const ent = state.activeEnterpriseManagement;
    if (!ent) return ui.showToast("Erreur : Entreprise non chargée.", 'error');
    
    if (ent.name === "L.A. Auto School") {
        return ui.showToast("L.A. Auto School ne peut pas créer de nouveaux articles.", 'error');
    }

    const rank = ent?.myRank;
    if (!rank || rank === 'pending') return ui.showToast("Accès refusé.", 'error');

    const data = new FormData(e.target);
    const name = data.get('name');
    const description = data.get('description');
    const price = parseInt(data.get('price'));
    const quantity = parseInt(data.get('quantity'));
    const payment = data.get('payment_type');
    const object_icon = data.get('object_icon') || 'package'; // Retrieve icon
    const productType = data.get('product_type');
    const requiresAppointment = productType === 'service';

    // 1. LIMIT CHECKS
    if (name.length > 25) return ui.showToast("Nom trop long (Max 25 car.)", 'error');
    if (description && description.length > 55) return ui.showToast("Description trop longue (Max 55 car.)", 'error');
    
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

    if (btn) toggleBtnLoading(btn, true);

    // 3. CREATE ITEM
    // If unpaid, just create it but hidden/awaiting_tax. If paid, deduct + pending.
    
    // UNIQUE NAME CHECK
    try {
        const { data: existing, error: existError } = await state.supabase.from('enterprise_items').select('id').eq('name', name).maybeSingle();
        if(existing) {
            ui.showToast("Ce nom d'article existe déjà sur le marché.", 'error');
            if (btn) toggleBtnLoading(btn, false);
            return;
        }

        if (taxPaid) {
            const { error: taxError } = await state.supabase.from('enterprises')
                .update({ balance: entBalance - taxAmount })
                .eq('id', ent.id);
            
            if (taxError) {
                if (btn) toggleBtnLoading(btn, false);
                return ui.showToast("Erreur prélèvement taxe.", 'error');
            }
        }

        const { error: insertError } = await state.supabase.from('enterprise_items').insert({ 
            enterprise_id: ent.id, 
            name, 
            price, 
            quantity, 
            payment_type: payment, 
            description, 
            status: initialStatus, 
            is_hidden: isHidden,
            object_icon, // Save icon to DB
            requires_appointment: requiresAppointment // Save appointment flag
        });

        if (insertError) {
            console.error("Failed to insert item:", insertError);
            if (btn) toggleBtnLoading(btn, false);
            return ui.showToast("Erreur création : " + insertError.message, 'error');
        }
        
        if(taxPaid) {
            ui.showToast(`Article ajouté. Taxe payée: $${taxAmount}`, 'success');
        } else {
            ui.showToast(`Article créé (Taxe impayée). Veuillez payer via le panel.`, 'warning');
        }
        
        // Reset icon after add
        state.selectedCreateIcon = 'package';
        
        await services.fetchEnterpriseDetails(ent.id);
        e.target.reset();
    } catch (err) {
        console.error("Critical error adding item:", err);
        ui.showToast("Erreur critique système.", 'error');
    } finally {
        if (btn) toggleBtnLoading(btn, false);
        render();
    }
};

export const setProductDiscount = async (itemId, discount) => {
    const validDiscount = Math.min(Math.max(parseInt(discount) || 0, 0), 90);
    await services.updateEnterpriseItem(itemId, { discount_percent: validDiscount });
    ui.showToast(`Réduction appliquée: -${validDiscount}%`, 'success');
    await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
    render();
};

export const createPromo = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const ent = state.activeEnterpriseManagement;
    
    const promoData = {
        enterprise_id: ent.id,
        code: data.get('code').toUpperCase(),
        type: data.get('type'),
        value: parseInt(data.get('value')),
        max_uses: parseInt(data.get('max_uses')),
        expires_at: new Date(Date.now() + parseInt(data.get('duration_days')) * 86400000).toISOString()
    };
    
    await services.createEnterprisePromo(promoData);
    await services.fetchEnterpriseDetails(ent.id);
    render();
};

export const deletePromo = async (promoId) => {
    await services.deleteEnterprisePromo(promoId);
    ui.showToast("Code promo supprimé.", "info");
    await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
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

export const restockItem = async (itemId, price) => {
    const ent = state.activeEnterpriseManagement;
    if (ent.name === "L.A. Auto School") return;

    const item = ent.items.find(i => i.id === itemId);
    
    ui.showModal({
        title: "Réapprovisionnement",
        content: `
            <p class="text-sm text-gray-400 mb-2">Une taxe de 5% est appliquée sur la valeur ajoutée.</p>
            <input type="number" id="restock-qty" class="glass-input w-full p-2 mt-2" min="1" placeholder="Quantité à ajouter">
        `,
        confirmText: "Ajouter & Payer",
        onConfirm: async () => {
            const val = parseInt(document.getElementById('restock-qty').value);
            if(!val || val < 1) return;
            
            // Calculate tax
            const cost = Math.ceil(item.price * val * 0.05);
            
            // Check Ent Balance (Fresh fetch suggested)
            const { data: currentEnt } = await state.supabase.from('enterprises').select('balance').eq('id', ent.id).single();
            if((currentEnt.balance || 0) < cost) {
                return ui.showToast(`Fonds insuffisants pour la taxe ($${cost}).`, 'error');
            }
            
            // Deduct & Update
            await state.supabase.from('enterprises').update({ balance: currentEnt.balance - cost }).eq('id', ent.id);
            await services.updateEnterpriseItem(itemId, { quantity: item.quantity + val });
            
            ui.showToast(`Stock mis à jour (+${val}). Taxe payée: $${cost}`, 'success');
            await services.fetchEnterpriseDetails(ent.id);
            render();
        }
    });
};

export const openEditItemModal = (itemId) => {
    const ent = state.activeEnterpriseManagement;
    if (ent.name === "L.A. Auto School") return;

    const item = ent.items.find(i => i.id === itemId);
    if (!item) return;

    ui.showModal({
        title: "Modifier Article",
        content: `
            <p class="text-xs text-orange-400 mb-3 bg-orange-500/10 p-2 rounded border border-orange-500/20">Attention: Toute modification renverra l'article en validation staff.</p>
            <form id="edit-item-form" class="space-y-3">
                <input type="hidden" id="edit-item-id" value="${itemId}">
                <div>
                    <label class="text-xs text-gray-500 uppercase font-bold">Nom</label>
                    <input type="text" id="edit-item-name" value="${item.name}" class="glass-input w-full p-2 rounded text-sm">
                </div>
                <div>
                    <label class="text-xs text-gray-500 uppercase font-bold">Prix ($)</label>
                    <input type="number" id="edit-item-price" value="${item.price}" class="glass-input w-full p-2 rounded text-sm font-mono">
                </div>
                <div>
                    <label class="text-xs text-gray-500 uppercase font-bold">Description</label>
                    <input type="text" id="edit-item-desc" value="${item.description || ''}" class="glass-input w-full p-2 rounded text-sm">
                </div>
            </form>
        `,
        confirmText: "Enregistrer",
        onConfirm: () => {
            const name = document.getElementById('edit-item-name').value;
            const price = parseInt(document.getElementById('edit-item-price').value);
            const desc = document.getElementById('edit-item-desc').value;
            
            if(name && price > 0) {
                updateItem(itemId, { name, price, description: desc });
            }
        }
    });
};

export const updateItem = async (itemId, updates) => {
    // If updating critical fields, force status pending
    if (updates.name || updates.price || updates.description) {
        updates.status = 'pending';
    }
    
    await services.updateEnterpriseItem(itemId, updates);
    ui.showToast("Modifications enregistrées (Validation requise).", 'success');
    await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
    render();
};

export const deleteItem = async (itemId) => {
    const ent = state.activeEnterpriseManagement;
    if (ent.name === "L.A. Auto School") return ui.showToast("L.A. Auto School ne peut pas supprimer ses articles standards.", 'error');

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

export const checkPromoCode = async (code, entId, basePrice, qty) => {
    if (!code) return ui.showToast("Code vide.", 'warning');
    
    const { data: promo } = await state.supabase.from('enterprise_promos').select('*').eq('code', code.toUpperCase()).eq('enterprise_id', entId).maybeSingle();
    
    const ttcSpan = document.getElementById('buy-total-ttc');
    const input = document.getElementById('buy-promo');
    
    if (promo) {
        const now = new Date();
        if (new Date(promo.expires_at) > now && promo.current_uses < promo.max_uses) {
            let priceHT = basePrice * qty;
            
            if (promo.type === 'percent') priceHT = Math.ceil(priceHT * (1 - promo.value/100));
            else priceHT = Math.max(0, priceHT - promo.value);
            
            const priceVAT = Math.ceil(priceHT * 0.20);
            const total = priceHT + priceVAT;
            
            if(ttcSpan) ttcSpan.textContent = `$${total.toLocaleString()}`;
            if(input) input.classList.add('border-green-500', 'text-green-400');
            
            ui.showToast(`Code appliqué : -${promo.value}${promo.type === 'percent' ? '%' : '$'}`, 'success');
        } else {
            ui.showToast("Code expiré ou épuisé.", 'error');
            if(input) input.classList.add('border-red-500');
        }
    } else {
        ui.showToast("Code invalide.", 'error');
        if(input) input.classList.add('border-red-500');
    }
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
    
    // Price Calculation with Discount & VAT
    const discount = item.discount_percent || 0;
    const priceHT = Math.ceil(item.price * (1 - discount/100));
    const priceTTC = Math.ceil(priceHT * 1.20); // 20% VAT

    // Calculate max affordable based on TTC
    let maxAffordable = 0;
    if (item.payment_type === 'cash_only') maxAffordable = Math.floor(currentCash / priceTTC);
    else if (item.payment_type === 'bank_only') maxAffordable = Math.floor(currentBank / priceTTC);
    else maxAffordable = Math.floor((currentCash + currentBank) / priceTTC);
    
    // Max purchase is limited by Stock AND Money
    // FOR AUTO-ECOLE: Infinite Stock Logic is handled in confirmBuyItem, but for display we assume current quantity is valid (it should be high)
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
        
        // Reset promo style on qty change
        const promoInput = document.getElementById('buy-promo');
        if(promoInput) promoInput.classList.remove('border-green-500', 'text-green-400', 'border-red-500');
    };

    const itemIcon = item.object_icon || 'package';
    const isService = item.requires_appointment || (item.enterprises && item.enterprises.name === "L.A. Auto School");

    ui.showModal({
        title: isService ? "Réserver Service (TTC)" : "Détails Produit (TTC)",
        content: `
            <div class="flex gap-4 mb-4">
                <div class="w-20 h-20 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                    <i data-lucide="${itemIcon}" class="w-10 h-10"></i>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-white text-lg">${item.name}</h3>
                    <div class="text-xs text-gray-400 mb-2">Vendu par <span class="text-blue-300">${item.enterprises?.name}</span></div>
                    <div class="bg-black/30 p-2 rounded-lg border border-white/5 text-xs text-gray-300 italic mb-2">
                        "${item.description || 'Aucune description fournie.'}"
                    </div>
                    ${isService ? '<span class="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded font-bold uppercase">Sur Rendez-vous</span>' : ''}
                </div>
            </div>
            
            <div class="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-400">Prix HT (Init: $${item.price})</span>
                    <span class="font-mono text-white ${discount > 0 ? 'text-emerald-400' : ''}">$${priceHT.toLocaleString()} ${discount > 0 ? `(-${discount}%)` : ''}</span>
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
                    <label class="text-xs text-gray-500 uppercase font-bold mb-1 block">${isService ? 'Nombre de sessions / places' : 'Quantité souhaitée'}</label>
                    <input type="number" id="buy-qty" class="glass-input w-full p-2 rounded-lg text-sm font-mono" 
                        value="1" min="1" max="${item.quantity}" oninput="window.updateBuyTotal(${priceHT})">
                </div>

                <div class="pt-2">
                    <label class="text-xs text-gray-500 uppercase font-bold mb-1 block">Code Promo</label>
                    <div class="flex gap-2">
                        <input type="text" id="buy-promo" class="glass-input flex-1 p-2 rounded-lg text-sm font-mono placeholder-gray-600 uppercase" placeholder="CODEPROMO">
                        <button onclick="actions.checkPromoCode(document.getElementById('buy-promo').value, '${item.enterprise_id}', ${priceHT}, document.getElementById('buy-qty').value)" class="glass-btn-secondary px-3 rounded-lg text-xs font-bold">Appliquer</button>
                    </div>
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
        confirmText: canBuy ? (isService ? "Prendre RDV" : "Confirmer Achat") : null,
        cancelText: "Annuler",
        onConfirm: () => {
            const qty = parseInt(document.getElementById('buy-qty').value);
            const code = document.getElementById('buy-promo').value;
            if(qty > 0 && qty <= item.quantity) {
                confirmBuyItem(itemId, qty, code);
            }
        }
    });
    
    if(window.lucide) lucide.createIcons();
};

export const confirmBuyItem = async (itemId, quantity, promoCode) => {
    const item = state.enterpriseMarket.find(i => i.id === itemId);
    if(!item) return;
    
    // Check if it is Service Item (Auto Ecole or Custom Service)
    const isService = item.requires_appointment || (item.enterprises && item.enterprises.name === "L.A. Auto School");
    const itemNameLower = item.name.toLowerCase();
    const charId = state.activeCharacter.id;

    // --- CHECK LICENSE ALREADY OWNED ---
    // Should block buying "Permis" if already have item
    if (isService && itemNameLower.includes("permis")) {
        const { data: hasItem } = await state.supabase.from('inventory').select('id').eq('character_id', charId).eq('name', 'Permis de conduire').maybeSingle();
        if (hasItem) {
            return ui.showToast("Vous possédez déjà votre permis physique.", 'error');
        }
    }

    // Apply Product Discount
    const itemDiscount = item.discount_percent || 0;
    let priceHT = Math.ceil(item.price * (1 - itemDiscount/100)) * quantity;
    
    // Apply Promo Code
    let promoDetails = null;
    if (promoCode) {
        const { data: promo } = await state.supabase.from('enterprise_promos').select('*').eq('code', promoCode.toUpperCase()).eq('enterprise_id', item.enterprise_id).maybeSingle();
        if (promo) {
            const now = new Date();
            if (new Date(promo.expires_at) > now && promo.current_uses < promo.max_uses) {
                if (promo.type === 'percent') priceHT = Math.ceil(priceHT * (1 - promo.value/100));
                else priceHT = Math.max(0, priceHT - promo.value);
                promoDetails = promo;
                // Increment promo use
                await state.supabase.from('enterprise_promos').update({ current_uses: promo.current_uses + 1 }).eq('id', promo.id);
            } else {
                ui.showToast("Code promo expiré ou invalide.", 'warning');
            }
        } else {
            ui.showToast("Code promo introuvable.", 'warning');
        }
    }

    const priceVAT = Math.ceil(priceHT * 0.20);
    const totalPriceTTC = priceHT + priceVAT;

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
    
    // 2. CREATE APPOINTMENT OR INVENTORY ITEM
    if (isService) {
        // Service / Appointment Logic
        const { error: apptError } = await state.supabase.from('enterprise_appointments').insert({
            enterprise_id: item.enterprise_id,
            client_id: charId,
            service_name: item.name,
            item_price: totalPriceTTC, // Store price paid for record
            status: 'pending'
        });
        
        if (apptError) {
            console.error("Appt Error", apptError);
            ui.showToast("Erreur prise de RDV. Contactez un admin.", 'error');
        } else {
            ui.showToast("Rendez-vous réservé. En attente de validation.", 'success');
        }
    } else {
        // Standard Inventory Logic with Icon
        const { data: existingInv } = await state.supabase.from('inventory').select('*').eq('character_id', charId).eq('name', item.name).maybeSingle();
        if (existingInv) { 
            await state.supabase.from('inventory').update({ quantity: existingInv.quantity + quantity }).eq('id', existingInv.id); 
        } else { 
            // Insert with custom icon
            await state.supabase.from('inventory').insert({ 
                character_id: charId, 
                name: item.name, 
                quantity: quantity, 
                estimated_value: item.price,
                object_icon: item.object_icon || 'package' 
            }); 
        }
        ui.showToast(`Achat effectué : ${quantity}x ${item.name}`, 'success');
    }
    
    // 3. Pay Enterprise (HT Only)
    const { data: entData } = await state.supabase.from('enterprises').select('balance').eq('id', item.enterprise_id).single();
    if(entData) {
        await state.supabase.from('enterprises').update({ balance: (entData.balance || 0) + priceHT }).eq('id', item.enterprise_id);
    }
    
    // 4. Update Stock (Skip for Auto Ecole to allow infinite stock feeling, but respect limit if it's a custom service)
    const isAutoEcole = item.enterprises && item.enterprises.name === "L.A. Auto School";
    if (!isAutoEcole) {
        if (item.quantity === quantity) { 
            await state.supabase.from('enterprise_items').delete().eq('id', itemId); 
        } else { 
            await state.supabase.from('enterprise_items').update({ quantity: item.quantity - quantity }).eq('id', itemId); 
        }
    }

    // 5. Generate Invoice
    await state.supabase.from('invoices').insert({
        buyer_id: charId,
        enterprise_id: item.enterprise_id,
        item_name: item.name,
        quantity: quantity,
        total_price: totalPriceTTC,
        promo_code: promoCode || null
    });
    
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
    const ent = state.activeEnterpriseManagement;
    if (ent.name === "L.A. Auto School") return ui.showToast("L'Auto-école ne dispose pas de coffre.", 'error');

    const amt = parseInt(new FormData(e.target).get('amount'));
    
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
    const ent = state.activeEnterpriseManagement;
    if (ent.name === "L.A. Auto School") return ui.showToast("L'Auto-école ne dispose pas de coffre.", 'error');

    const amt = parseInt(new FormData(e.target).get('amount'));
    
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

export const manageApplication = async (memberId, action) => {
    const entId = state.activeEnterpriseManagement.id;
    if (action === 'accept') {
        await state.supabase.from('enterprise_members').update({ status: 'accepted' }).eq('id', memberId);
        ui.showToast("Candidature acceptée.", 'success');
    } else {
        await state.supabase.from('enterprise_members').delete().eq('id', memberId);
        ui.showToast("Candidature refusée.", 'info');
    }
    await services.fetchEnterpriseDetails(entId);
    render();
};

export const handleAppointment = async (aptId, action, serviceName, charId) => {
    // action: 'approve', 'reject'
    const entId = state.activeEnterpriseManagement.id;
    
    if (action === 'reject') {
        await state.supabase.from('enterprise_appointments').delete().eq('id', aptId);
        ui.showToast("Rendez-vous refusé. (Aucun remboursement)", "warning");
    } 
    else if (action === 'approve') {
        const lowerService = serviceName.toLowerCase();
        
        // Grant Item / Points logic based on service name
        if (lowerService.includes("permis")) {
            // Give Item + Reset Points
            await state.supabase.from('characters').update({ driver_license_points: 12 }).eq('id', charId);
            
            // Check if item exists first to avoid duplicates or error
            const { data: existing } = await state.supabase.from('inventory').select('id, quantity').eq('character_id', charId).eq('name', serviceName).maybeSingle();
            if(!existing) {
                await state.supabase.from('inventory').insert({
                    character_id: charId, name: serviceName, quantity: 1, estimated_value: 0
                });
            }
            ui.showToast("Permis accordé et points remis à 12.", "success");
        } 
        else if (lowerService.includes("stage")) {
            // Add Points
            const { data: char } = await state.supabase.from('characters').select('driver_license_points').eq('id', charId).single();
            const current = char.driver_license_points || 0;
            const newPoints = Math.min(12, current + 3);
            await state.supabase.from('characters').update({ driver_license_points: newPoints }).eq('id', charId);
            ui.showToast(`Stage validé. Nouveau solde: ${newPoints}/12`, "success");
        }
        
        // Delete appointment after processing
        await state.supabase.from('enterprise_appointments').delete().eq('id', aptId);
    }
    
    await services.fetchEnterpriseDetails(entId);
    render();
};