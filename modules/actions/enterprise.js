
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
            await services.fetchTopSellers(); 
            await services.fetchEnterprises(); 
        } else if (tab === 'directory') {
            await services.fetchEnterprises(); 
            await services.fetchMyEnterprises(state.activeCharacter.id); 
        } else if (tab === 'my_companies') {
            await services.fetchMyEnterprises(state.activeCharacter.id);
        } else if (tab === 'appointments') {
            await services.fetchClientAppointments(state.activeCharacter.id);
        }
    } catch (e) {
        console.error("Tab switch error:", e);
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
            const { error = null } = await state.supabase.from('enterprise_appointments').delete().eq('id', aptId);
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
    state.activeEnterpriseManagement = null; // Reset avant chargement
    render();
    
    try {
        console.log("[Action] Ouverture gestion entreprise:", entId);
        await services.fetchEnterpriseDetails(entId);
        
        if (!state.activeEnterpriseManagement) {
            throw new Error("Données de gestion non chargées.");
        }

        state.activeEnterpriseTab = 'manage'; 
        state.activeEnterpriseManageTab = 'dashboard'; 
    } catch (error) {
        console.error("[Action] Erreur critique openEnterpriseManagement:", error);
        ui.showToast("Impossible d'accéder au panel de gestion : " + (error.message || "Erreur réseau"), "error");
        state.activeEnterpriseTab = 'my_companies'; 
        state.activeEnterpriseManagement = null;
    } finally {
        state.isPanelLoading = false;
        console.log("[Action] Fin du chargement gestion.");
        render();
    }
};

export const applyToEnterprise = async (entId) => {
    await services.joinEnterprise(entId, state.activeCharacter.id);
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
    
    const ent = state.activeEnterpriseManagement;
    if (!ent) return ui.showToast("Erreur : Entreprise non chargée.", 'error');
    
    if (ent.name === "L.A. Auto School") {
        return ui.showToast("L.A. Auto School ne peut pas créer de nouveaux articles.", 'error');
    }

    const rank = ent?.myRank;
    if (!rank || rank === 'pending') return ui.showToast("Accès refusé.", 'error');

    const data = new FormData(e.target);
    const name = data.get('name').trim();
    const description = data.get('description');
    const price = Number(data.get('price'));
    const quantity = Number(data.get('quantity'));
    const payment = data.get('payment_type');
    const object_icon = data.get('object_icon') || 'package'; 

    if (name.length > 25) return ui.showToast("Nom trop long (Max 25 car.)", 'error');
    if (description && description.length > 55) return ui.showToast("Description trop longue (Max 55 car.)", 'error');
    
    const taxRate = (Number(state.economyConfig.create_item_ent_tax) || 0) / 100;
    const taxAmount = Math.ceil(price * quantity * taxRate);
    const entBalance = ent.balance || 0;
    
    let taxPaid = false;
    let initialStatus = 'awaiting_tax';
    let isHidden = true; 

    if (entBalance >= taxAmount) {
        taxPaid = true;
        initialStatus = 'pending'; 
        isHidden = false; 
    }

    if (btn) toggleBtnLoading(btn, true);

    try {
        const { data: existing, error: checkError } = await state.supabase
            .from('enterprise_items')
            .select('id')
            .ilike('name', name)
            .maybeSingle();

        if (existing) {
            ui.showToast("Ce nom d'article existe déjà sur le marché.", 'error');
            if (btn) toggleBtnLoading(btn, false);
            return;
        }

        if (taxPaid) {
            const { error: balanceError } = await state.supabase.from('enterprises')
                .update({ balance: entBalance - taxAmount })
                .eq('id', ent.id);
            
            if (balanceError) throw new Error("Erreur lors du prélèvement de la taxe.");
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
            object_icon: object_icon
        });

        if (insertError) {
            if (taxPaid) {
                await state.supabase.from('enterprises').update({ balance: entBalance }).eq('id', ent.id);
            }
            throw insertError;
        }

        if(taxPaid) ui.showToast(`Article ajouté. Taxe payée: $${taxAmount}`, 'success');
        else ui.showToast(`Article créé (Taxe impayée). Veuillez payer via le panel.`, 'warning');
        
        state.selectedCreateIcon = 'package';
        await services.fetchEnterpriseDetails(ent.id);
        e.target.reset();
    } catch (err) {
        console.error("Item creation error:", err);
        ui.showToast("Erreur lors de la création de l'article.", 'error');
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
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const data = new FormData(e.target);
    const ent = state.activeEnterpriseManagement;
    const code = data.get('code').toUpperCase().trim();
    
    const promoData = {
        enterprise_id: ent.id,
        code: code,
        type: data.get('type'),
        value: parseInt(data.get('value')),
        max_uses: parseInt(data.get('max_uses')),
        expires_at: new Date(Date.now() + parseInt(data.get('duration_days')) * 86400000).toISOString()
    };
    
    try {
        const { error } = await state.supabase.from('enterprise_promos').insert(promoData);
        if (error) throw error;
        
        ui.showToast("Code promo créé avec succès.", "success");
        await services.fetchEnterpriseDetails(ent.id);
        e.target.reset();
    } catch (err) {
        ui.showToast("Code déjà expiré ou invalide.", "error");
    } finally {
        toggleBtnLoading(btn, false);
        render();
    }
};

export const deletePromo = async (promoId) => {
    ui.showModal({
        title: "Supprimer Promo",
        content: "Voulez-vous vraiment supprimer ce code promotionnel ?",
        confirmText: "Supprimer",
        type: "danger",
        onConfirm: async () => {
            const { error = null } = await state.supabase.from('enterprise_promos').delete().eq('id', promoId);
            if (!error) {
                ui.showToast("Code promo supprimé.", "info");
                await services.fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
                render();
            }
        }
    });
};

export const payItemTax = async (itemId) => {
    const ent = state.activeEnterpriseManagement;
    const item = ent.items.find(i => i.id === itemId);
    if (!item || item.status !== 'awaiting_tax') return;

    const taxRate = (Number(state.economyConfig.create_item_ent_tax) || 0) / 100;
    const taxAmount = Math.ceil(item.price * item.quantity * taxRate);
    
    if ((ent.balance || 0) < taxAmount) {
        return ui.showToast(`Fonds insuffisants ($${taxAmount}).`, 'error');
    }

    ui.showModal({
        title: "Paiement Taxe",
        content: `Payer la taxe de mise en rayon de <b>$${taxAmount}</b> ?<br><small>L'article passera en validation staff.</small>`,
        confirmText: "Payer",
        onConfirm: async () => {
            await state.supabase.from('enterprises').update({ balance: ent.balance - taxAmount }).eq('id', ent.id);
            await state.supabase.from('enterprise_items').update({ status: 'pending', is_hidden: false }).eq('id', itemId);
            ui.showToast("Taxe payée. Article en attente de validation.", 'success');
            await services.fetchEnterpriseDetails(ent.id);
            render();
        }
    });
};

export const toggleItemVisibility = async (itemId, isHidden) => {
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
    
    const taxRate = Number(state.economyConfig.create_item_ent_tax) || 0;

    ui.showModal({
        title: "Réapprovisionnement",
        content: `
            <p class="text-sm text-gray-400 mb-2">Une taxe de ${taxRate}% est appliquée sur la valeur ajoutée.</p>
            <input type="number" id="restock-qty" class="glass-input w-full p-2 mt-2" min="1" placeholder="Quantité à ajouter">
        `,
        confirmText: "Ajouter & Payer",
        onConfirm: async () => {
            const val = Number(document.getElementById('restock-qty').value);
            if(!val || val < 1) return;
            const cost = Math.ceil(item.price * val * (taxRate/100));
            const { data: currentEnt } = await state.supabase.from('enterprises').select('balance').eq('id', ent.id).single();
            if((currentEnt.balance || 0) < cost) return ui.showToast(`Fonds insuffisants pour la taxe ($${cost}).`, 'error');
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
                <div><label class="text-xs text-gray-500 uppercase font-bold">Nom</label><input type="text" id="edit-item-name" value="${item.name}" class="glass-input w-full p-2 rounded text-sm"></div>
                <div><label class="text-xs text-gray-500 uppercase font-bold">Prix ($)</label><input type="number" id="edit-item-price" value="${item.price}" class="glass-input w-full p-2 rounded text-sm font-mono"></div>
                <div><label class="text-xs text-gray-500 uppercase font-bold">Description</label><input type="text" id="edit-item-desc" value="${item.description || ''}" class="glass-input w-full p-2 rounded text-sm"></div>
            </form>
        `,
        confirmText: "Enregistrer",
        onConfirm: () => {
            const name = document.getElementById('edit-item-name').value;
            const price = Number(document.getElementById('edit-item-price').value);
            const desc = document.getElementById('edit-item-desc').value;
            if(name && price > 0) updateItem(itemId, { name, price, description: desc });
        }
    });
};

export const updateItem = async (itemId, updates) => {
    if (updates.name || updates.price || updates.description) updates.status = 'pending';
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
            
            const vRate = (Number(state.economyConfig.tva_tax) || 0) / 100;
            const total = Math.ceil(priceHT * (1 + vRate));
            
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
    if (!state.activeGameSession) { ui.showToast("Impossible : Session fermée.", 'error'); return; }
    const item = state.enterpriseMarket.find(i => i.id === itemId);
    if(!item) return;
    const currentCash = state.bankAccount ? state.bankAccount.cash_balance : 0;
    const currentBank = state.bankAccount ? state.bankAccount.bank_balance : 0;
    const discount = item.discount_percent || 0;
    const priceHT = Math.ceil(item.price * (1 - discount/100));
    
    const vRate = (Number(state.economyConfig.tva_tax) || 0) / 100;
    const priceTTC = Math.ceil(priceHT * (1 + vRate)); 
    
    let maxAffordable = 0;
    if (item.payment_type === 'cash_only') maxAffordable = Math.floor(currentCash / priceTTC);
    else if (item.payment_type === 'bank_only') maxAffordable = Math.floor(currentBank / priceTTC);
    else maxAffordable = Math.floor((currentCash + currentBank) / priceTTC);
    const maxQty = Math.min(item.quantity, maxAffordable);
    const canBuy = maxQty > 0;

    window.updateBuyTotal = (basePrice) => {
        const qty = Number(document.getElementById('buy-qty').value) || 0;
        const totalHT = qty * basePrice;
        const totalVAT = Math.ceil(totalHT * vRate);
        const totalTTC = totalHT + totalVAT;
        document.getElementById('buy-total-ht').textContent = '$' + totalHT.toLocaleString();
        document.getElementById('buy-vat').textContent = '$' + totalVAT.toLocaleString();
        document.getElementById('buy-total-ttc').textContent = '$' + totalTTC.toLocaleString();
        const promoInput = document.getElementById('buy-promo');
        if(promoInput) promoInput.classList.remove('border-green-500', 'text-green-400', 'border-red-500');
    };

    const itemIcon = item.object_icon || 'package';
    const isService = (item.enterprises && item.enterprises.name === "L.A. Auto School") || (item.description && item.description.toLowerCase().includes('rdv')) || item.requires_appointment;

    ui.showModal({
        title: isService ? "RéSERVER SERVICE (TTC)" : "DéTAILS PRODUIT (TTC)",
        content: `
            <div class="flex gap-4 mb-4">
                <div class="w-20 h-20 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20"><i data-lucide="${itemIcon}" class="w-10 h-10"></i></div>
                <div class="flex-1">
                    <h3 class="font-bold text-white text-lg">${item.name}</h3>
                    <div class="text-xs text-gray-400 mb-2">Vendu par <span class="text-blue-300">${item.enterprises?.name}</span></div>
                    <div class="bg-black/30 p-2 rounded-lg border border-white/5 text-xs text-gray-300 italic mb-2">"${item.description || 'Aucune description fournie.'}"</div>
                    ${isService ? '<span class="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded font-bold uppercase">Sur Rendez-vous</span>' : ''}
                </div>
            </div>
            <div class="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                <div class="flex justify-between items-center text-sm"><span class="text-gray-400">Prix HT (Init: $${item.price})</span><span class="font-mono text-white ${discount > 0 ? 'text-emerald-400' : ''}">$${priceHT.toLocaleString()} ${discount > 0 ? `(-${discount}%)` : ''}</span></div>
                <div class="flex justify-between items-center text-sm"><span class="text-gray-400">TVA (${state.economyConfig.tva_tax}%)</span><span class="font-mono text-gray-500">+ $${Math.ceil(priceHT * vRate).toLocaleString()}</span></div>
                <div class="flex justify-between items-center text-sm border-t border-white/5 pt-2 mt-2"><span class="text-emerald-400 font-bold">Prix Unitaire (TTC)</span><span class="font-mono font-bold text-emerald-400">$${priceTTC.toLocaleString()}</span></div>
                <div class="pt-3 border-t border-white/5">
                    <label class="text-xs text-gray-500 uppercase font-bold mb-1 block">${isService ? 'Nombre de sessions / places' : 'Quantité souhaitée'}</label>
                    <input type="number" id="buy-qty" class="glass-input w-full p-2 rounded-lg text-sm font-mono ${isService ? 'bg-black/60 opacity-50 cursor-not-allowed' : ''}" value="1" min="1" max="${item.quantity}" ${isService ? 'disabled' : ''} oninput="window.updateBuyTotal(${priceHT})">
                </div>
                <div class="pt-2">
                    <label class="text-xs text-gray-500 uppercase font-bold mb-1 block">Code Promo</label>
                    <div class="flex gap-2">
                        <input type="text" id="buy-promo" class="glass-input flex-1 p-2 rounded-lg text-sm font-mono placeholder-gray-600 uppercase" placeholder="CODEPROMO">
                        <button onclick="actions.checkPromoCode(document.getElementById('buy-promo').value, '${item.enterprise_id}', ${priceHT}, document.getElementById('buy-qty').value)" class="glass-btn-secondary px-3 rounded-lg text-xs font-bold">Appliquer</button>
                    </div>
                </div>
                <div class="bg-black/40 p-3 rounded-lg mt-2 space-y-1">
                    <div class="flex justify-between items-center text-xs text-gray-500"><span>Total HT</span><span id="buy-total-ht">$${priceHT.toLocaleString()}</span></div>
                    <div class="flex justify-between items-center text-xs text-gray-500"><span>Total TVA</span><span id="buy-vat">$${Math.ceil(priceHT * vRate).toLocaleString()}</span></div>
                    <div class="flex justify-between items-center pt-1 border-t border-white/10 mt-1"><span class="text-gray-400 text-xs font-bold uppercase">Total à Payer</span><span class="font-mono font-bold text-xl text-emerald-400" id="buy-total-ttc">$${priceTTC.toLocaleString()}</span></div>
                </div>
            </div>
            ${!canBuy ? `<div class="mt-2 text-center text-xs text-red-400">Fonds insuffisants.</div>` : ''}
        `,
        confirmText: canBuy ? (isService ? "Prendre RDV" : "Confirmer Achat") : null,
        cancelText: "Annuler",
        onConfirm: () => {
            const qty = Number(document.getElementById('buy-qty').value);
            const code = document.getElementById('buy-promo').value;
            if(qty > 0 && qty <= item.quantity) confirmBuyItem(itemId, qty, code);
        }
    });
    if(window.lucide) lucide.createIcons();
};

export const confirmBuyItem = async (itemId, quantity, promoCode) => {
    const item = state.enterpriseMarket.find(i => i.id === itemId);
    if(!item) return;

    const entId = item.enterprise_id;
    if(!entId) return ui.showToast("Erreur : Entreprise non identifiée.", "error");

    const isService = (item.enterprises && item.enterprises.name === "L.A. Auto School") || (item.description && item.description.toLowerCase().includes('rdv')) || item.requires_appointment;
    const charId = state.activeCharacter.id;
    const itemDiscount = item.discount_percent || 0;
    
    let priceHT = Math.ceil(item.price * (1 - itemDiscount/100)) * quantity;
    let finalPromoCode = promoCode ? promoCode.toUpperCase() : null;

    if (finalPromoCode) {
        const { data: promo } = await state.supabase.from('enterprise_promos').select('*').eq('code', finalPromoCode).eq('enterprise_id', entId).maybeSingle();
        if (promo) {
            const now = new Date();
            if (new Date(promo.expires_at) > now && promo.current_uses < promo.max_uses) {
                if (promo.type === 'percent') priceHT = Math.ceil(priceHT * (1 - promo.value/100));
                else priceHT = Math.max(0, priceHT - promo.value);
                await state.supabase.from('enterprise_promos').update({ current_uses: promo.current_uses + 1 }).eq('id', promo.id);
            } else finalPromoCode = null;
        } else finalPromoCode = null;
    }

    const vRate = (Number(state.economyConfig.tva_tax) || 0) / 100;
    const priceVAT = Math.ceil(priceHT * vRate);
    const totalPriceTTC = priceHT + priceVAT;
    const { data: bank } = await state.supabase.from('bank_accounts').select('*').eq('character_id', charId).single();
    
    let canPay = false; 
    let paySource = '';
    if (bank.cash_balance >= totalPriceTTC) { canPay = true; paySource = 'cash'; } 
    else if (bank.bank_balance >= totalPriceTTC) { canPay = true; paySource = 'bank'; } 
    
    if (!canPay) return ui.showToast(`Fonds insuffisants (TTC: $${totalPriceTTC}).`, 'error');
    
    const updateBank = {};
    if (paySource === 'cash') updateBank.cash_balance = bank.cash_balance - totalPriceTTC; 
    else updateBank.bank_balance = bank.bank_balance - totalPriceTTC;
    
    await state.supabase.from('bank_accounts').update(updateBank).eq('character_id', charId);
    
    // ARCHIVAGE TRANSACTION ACHAT
    await state.supabase.from('transactions').insert({
        sender_id: charId, amount: totalPriceTTC, type: 'withdraw', description: `Achat boutique: ${item.name} (TTC)`
    });

    // NOTIFICATION POUR L'ACHETEUR (FACTURE)
    await services.createNotification(
        "FACTURE REÇUE",
        `Nouvelle facture acquittée pour : ${quantity}x ${item.name}. Total TTC : $${totalPriceTTC.toLocaleString()}. Vendeur : ${item.enterprises?.name || 'Commerce'}`,
        "info",
        false,
        state.user.id
    );

    if (isService) {
        await state.supabase.from('enterprise_appointments').insert({ enterprise_id: entId, client_id: charId, service_name: item.name, item_price: totalPriceTTC, status: 'pending' });
        ui.showToast("Rendez-vous réservé.", 'success');
    } else {
        const { data: existingInv } = await state.supabase.from('inventory').select('*').eq('character_id', charId).eq('name', item.name).maybeSingle();
        if (existingInv) await state.supabase.from('inventory').update({ quantity: existingInv.quantity + quantity }).eq('id', existingInv.id); 
        else await state.supabase.from('inventory').insert({ character_id: charId, name: item.name, quantity: quantity, estimated_value: item.price, object_icon: item.object_icon || 'package' }); 
        ui.showToast(`Achat effectué.`, 'success');
    }
    
    const { data: entData } = await state.supabase.from('enterprises').select('balance, name, leader_id').eq('id', entId).single();
    if(entData) {
        if (entData.name === "L.A. Auto School") {
            const newGouvBalance = (Number(state.gouvBank) || 0) + priceHT;
            await state.supabase.from('keys_data').upsert({ key: 'gouv_bank', value: newGouvBalance.toString() }, { onConflict: 'key' });
            state.gouvBank = newGouvBalance;
        } else {
            await state.supabase.from('enterprises').update({ balance: (entData.balance || 0) + priceHT }).eq('id', entId);
            
            // NOTIFICATION POUR LE PDG (VENTE)
            const { data: leader } = await state.supabase.from('characters').select('user_id').eq('id', entData.leader_id).single();
            if (leader?.user_id && leader.user_id !== state.user.id) {
                await services.createNotification(
                    "VENTE EFFECTUÉE",
                    `${state.activeCharacter.first_name} a acheté ${quantity}x ${item.name} pour $${totalPriceTTC.toLocaleString()}. Les fonds ont été crédités au coffre.`,
                    "success",
                    false,
                    leader.user_id
                );
            }
        }
    }
    
    if (entData?.name !== "L.A. Auto School") {
        if (item.quantity === quantity) await state.supabase.from('enterprise_items').delete().eq('id', itemId); 
        else await state.supabase.from('enterprise_items').update({ quantity: item.quantity - quantity }).eq('id', itemId); 
    }

    await state.supabase.from('invoices').insert({
        buyer_id: charId,
        enterprise_id: entId, 
        item_name: item.name,
        quantity: quantity,
        total_price: totalPriceTTC,
        promo_code: finalPromoCode
    });
    
    await services.fetchBankData(charId); 
    await services.fetchEnterpriseMarket();
    render();
};

export const quitEnterprise = async (entId) => {
    const ent = state.myEnterprises.find(e => e.id === entId);
    if (ent && ent.myRank === 'leader') return ui.showToast("Le PDG ne peut pas démissionner.", 'error');
    ui.showModal({
        title: "Démissionner", content: "Quitter cette entreprise ?", confirmText: "Quitter", type: "danger",
        onConfirm: async () => {
            await state.supabase.from('enterprise_members').delete().eq('enterprise_id', entId).eq('character_id', state.activeCharacter.id);
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
    const amt = Number(new FormData(e.target).get('amount'));
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
    if(bank.cash_balance < amt) return ui.showToast("Liquide insuffisant.", 'error');
    
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - amt }).eq('character_id', state.activeCharacter.id);
    await state.supabase.from('enterprises').update({ balance: (ent.balance || 0) + amt }).eq('id', ent.id);
    
    // LOG
    await state.supabase.from('transactions').insert({ sender_id: state.activeCharacter.id, amount: amt, type: 'withdraw', description: `Dépôt coffre entreprise: ${ent.name}` });
    
    ui.showToast(`Dépôt effectué.`, 'success');
    await services.fetchEnterpriseDetails(ent.id);
    render();
};

export const entWithdraw = async (e) => {
    e.preventDefault();
    const ent = state.activeEnterpriseManagement;
    if (ent.name === "L.A. Auto School") return ui.showToast("L'Auto-école ne dispose pas de coffre.", 'error');
    const amt = Number(new FormData(e.target).get('amount'));
    if (ent.myRank !== 'leader') return ui.showToast("Réservé au patron.", 'error');
    if ((ent.balance || 0) < amt) return ui.showToast("Fonds insuffisants.", 'error');
    
    await state.supabase.from('enterprises').update({ balance: ent.balance - amt }).eq('id', ent.id);
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
    await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + amt }).eq('character_id', state.activeCharacter.id);
    
    // LOG
    await state.supabase.from('transactions').insert({ receiver_id: state.activeCharacter.id, amount: amt, type: 'deposit', description: `Retrait coffre entreprise: ${ent.name}` });

    ui.showToast(`Retrait effectué.`, 'success');
    await services.fetchEnterpriseDetails(ent.id);
    render();
};

export const manageApplication = async (memberId, action) => {
    const entId = state.activeEnterpriseManagement.id;
    if (action === 'accept') await state.supabase.from('enterprise_members').update({ status: 'accepted' }).eq('id', memberId);
    else await state.supabase.from('enterprise_members').delete().eq('id', memberId);
    await services.fetchEnterpriseDetails(entId);
    render();
};

export const handleAppointment = async (aptId, action, serviceName, charId) => {
    const entId = state.activeEnterpriseManagement.id;
    if (action === 'reject') {
        await state.supabase.from('enterprise_appointments').delete().eq('id', aptId);
        ui.showToast("Rendez-vous refusé.", "warning");
    } else if (action === 'approve') {
        const lowerService = serviceName.toLowerCase();
        if (lowerService.includes("permis")) {
            await state.supabase.from('characters').update({ driver_license_points: 12 }).eq('id', charId);
            const { data: existing } = await state.supabase.from('inventory').select('id').eq('character_id', charId).eq('name', serviceName).maybeSingle();
            if(!existing) {
                await state.supabase.from('inventory').insert({ character_id: charId, name: serviceName, quantity: 1, estimated_value: 0, object_icon: 'car' });
            }
            ui.showToast("Permis accordé (Points restaurés).", "success");
        } else if (lowerService.includes("stage")) {
            const { data: char } = await state.supabase.from('characters').select('driver_license_points').eq('id', charId).single();
            const currentPts = (char.driver_license_points !== null) ? char.driver_license_points : 12;
            const newPts = Math.min(12, currentPts + 4); // +4 points pour un stage selon barème standard TFRP
            await state.supabase.from('characters').update({ driver_license_points: newPts }).eq('id', charId);
            ui.showToast(`Stage validé : +4 points (Nouveau solde: ${newPts}/12).`, "success");
        }
        await state.supabase.from('enterprise_appointments').delete().eq('id', aptId);
    }
    await services.fetchEnterpriseDetails(entId);
    render();
};
