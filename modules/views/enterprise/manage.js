
import { state } from '../../state.js';
import { ICON_LIBRARY } from '../enterprise.js';

export const EnterpriseManageView = () => {
    const ent = state.activeEnterpriseManagement;
    if (!ent) return '<div class="p-8 text-center text-gray-500">Signal perdu. Re-chargement...</div>';
    
    const isLeader = ent.myRank === 'leader' || ent.myRank === 'co_leader';
    const invoices = ent.invoices || [];
    const appointments = ent.appointments || []; 
    const promos = ent.promos || [];
    const isAutoEcole = ent.name === "L.A. Auto School";
    
    const entBalance = isAutoEcole ? state.gouvBank : (ent.balance || 0);
    
    const sortedItems = [...(ent.items || [])].sort((a, b) => {
        const scores = { 'awaiting_tax': 10, 'pending': 5, 'approved': 1, 'rejected': 0 };
        const sA = scores[a.status] || 0;
        const sB = scores[b.status] || 0;
        return sB - sA;
    });

    let iconPickerModal = '';
    if (state.iconPickerOpen) {
        let displayedIcons = ICON_LIBRARY;
        if (state.iconSearchQuery) {
            displayedIcons = ICON_LIBRARY.filter(i => i.toLowerCase().includes(state.iconSearchQuery.toLowerCase()));
        }

        iconPickerModal = `
            <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closeIconPicker()"></div>
                <div class="glass-panel w-full max-w-lg p-8 rounded-[40px] relative z-10 flex flex-col max-h-[80vh] border border-blue-500/30">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-black text-white uppercase italic tracking-tight">Iconothèque</h3>
                        <button onclick="actions.closeIconPicker()" class="text-gray-500 hover:text-white transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
                    </div>
                    <div class="mb-6">
                        <div class="relative">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                            <input type="text" oninput="actions.searchIcons(this.value)" value="${state.iconSearchQuery}" placeholder="Filtrer librairie..." class="glass-input pl-10 w-full p-3 rounded-2xl text-sm bg-black/40 border-white/10">
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-6 gap-3 p-4 bg-black/40 rounded-3xl border border-white/5">
                        ${displayedIcons.map(icon => `
                            <button onclick="actions.selectIcon('${icon}')" class="aspect-square rounded-xl hover:bg-blue-600/20 flex items-center justify-center text-gray-500 hover:text-blue-400 transition-all border border-transparent hover:border-blue-500/30 ${state.selectedCreateIcon === icon ? 'bg-blue-600 text-white shadow-lg border-blue-400' : ''}">
                                <i data-lucide="${icon}" class="w-6 h-6"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    return `
        ${iconPickerModal}
        <div class="h-full flex flex-col animate-fade-in min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-10">
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                ${!isAutoEcole ? `
                    <!-- BANQUE -->
                    <div class="glass-panel rounded-[32px] p-8 border border-white/5 bg-[#0a0a0a] relative overflow-hidden group">
                        <div class="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700"></div>
                        <div class="flex justify-between items-center mb-8 relative z-10">
                            <h3 class="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <i data-lucide="landmark" class="w-5 h-5"></i> Trésorerie Interne
                            </h3>
                            <div class="text-3xl font-mono font-black text-emerald-400 drop-shadow-lg">$ ${entBalance.toLocaleString()}</div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 relative z-10">
                            <form onsubmit="actions.entDeposit(event)" class="flex gap-2">
                                <input type="number" name="amount" placeholder="Dépôt" class="glass-input w-full p-3 rounded-2xl text-sm font-mono bg-black/40 border-white/10" required min="1">
                                <button class="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl shadow-xl shadow-emerald-900/20 transition-all"><i data-lucide="arrow-down-to-line" class="w-5 h-5"></i></button>
                            </form>
                            ${isLeader ? `
                                <form onsubmit="actions.entWithdraw(event)" class="flex gap-2">
                                    <input type="number" name="amount" placeholder="Retrait" class="glass-input w-full p-3 rounded-2xl text-sm font-mono bg-black/40 border-white/10" required min="1">
                                    <button class="bg-red-600 hover:bg-red-500 text-white p-3 rounded-2xl shadow-xl shadow-red-900/20 transition-all"><i data-lucide="arrow-up-from-line" class="w-5 h-5"></i></button>
                                </form>
                            ` : ''}
                        </div>
                    </div>
                ` : `
                    <div class="glass-panel rounded-[32px] p-8 border border-blue-500/20 bg-blue-500/[0.02] flex flex-col justify-center text-center relative overflow-hidden">
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.05),transparent_70%)]"></div>
                        <div class="text-[10px] text-blue-300 uppercase font-black tracking-[0.4em] mb-3 relative z-10">Comptabilité Étatique Unifiée</div>
                        <div class="text-5xl font-mono font-black text-white mb-2 relative z-10 drop-shadow-xl">$ ${entBalance.toLocaleString()}</div>
                        <div class="text-[9px] text-gray-500 italic uppercase font-bold tracking-widest relative z-10">Aucun retrait direct autorisé • Fonds souverains</div>
                    </div>
                `}

                <!-- SALES LOG -->
                <div class="glass-panel rounded-[32px] border border-white/5 bg-[#0a0a0a] flex flex-col h-64 shadow-2xl">
                    <div class="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
                        <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                            <i data-lucide="file-text" class="w-5 h-5 text-blue-400"></i> Journal des Encaissements
                        </h3>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        ${invoices.length === 0 ? '<div class="h-full flex flex-col items-center justify-center text-gray-600 text-[10px] uppercase font-black tracking-widest opacity-30">Aucun flux récent</div>' : invoices.map(inv => `
                            <div class="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:border-blue-500/20 transition-all">
                                <div>
                                    <div class="font-black text-white text-sm uppercase italic">${inv.item_name} <span class="text-gray-600 font-mono not-italic">(x${inv.quantity})</span></div>
                                    <div class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Client: <span class="text-blue-300">${inv.characters?.first_name || 'Inconnu'}</span> • ${new Date(inv.created_at).toLocaleDateString()}</div>
                                </div>
                                <div class="font-mono text-emerald-400 font-black text-lg">+$${inv.total_price.toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- PROMOS & APPOINTMENTS -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div class="glass-panel rounded-[32px] p-8 border border-white/5 bg-[#0a0a0a]">
                     <h3 class="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <i data-lucide="tag" class="w-5 h-5"></i> Campagnes Promotionnelles
                    </h3>
                    <form onsubmit="actions.createPromo(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <input type="text" name="code" placeholder="CODEPROMO" class="glass-input p-3 rounded-2xl text-sm font-mono uppercase bg-black/40 border-white/10" required maxlength="15">
                            <select name="type" class="glass-input p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-black/40 border-white/10 text-gray-400">
                                <option value="percent">Réduction (%)</option>
                                <option value="fixed">Forfaitaire ($)</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-3 gap-3">
                            <input type="number" name="value" placeholder="Valeur" class="glass-input p-3 rounded-2xl text-sm font-mono bg-black/40 border-white/10" required min="1">
                            <input type="number" name="max_uses" placeholder="Lim. Use" class="glass-input p-3 rounded-2xl text-sm font-mono bg-black/40 border-white/10" required min="1">
                            <input type="number" name="duration_days" placeholder="Jours" class="glass-input p-3 rounded-2xl text-sm font-mono bg-black/40 border-white/10" required min="1">
                        </div>
                        <button type="submit" class="w-full glass-btn py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-900/20">ÉMETTRE CODE PROMO</button>
                    </form>
                    
                    <div class="mt-8 space-y-3">
                        ${promos.map(p => `
                            <div class="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                                <div>
                                    <div class="flex items-center gap-3">
                                        <span class="font-mono font-black text-indigo-300 text-base tracking-widest">${p.code}</span>
                                        <span class="text-[8px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-black uppercase border border-indigo-500/30">-${p.value}${p.type === 'percent' ? '%' : '$'}</span>
                                    </div>
                                    <div class="text-[8px] text-gray-600 mt-1 uppercase font-black tracking-widest">Usage: ${p.current_uses}/${p.max_uses} • Exp: ${new Date(p.expires_at).toLocaleDateString()}</div>
                                </div>
                                <button onclick="actions.deletePromo('${p.id}')" class="text-red-500 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-xl transition-all"><i data-lucide="trash" class="w-4 h-4"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="glass-panel rounded-[32px] border border-white/5 bg-[#0a0a0a] flex flex-col shadow-2xl">
                    <div class="p-6 border-b border-white/5 flex justify-between items-center bg-yellow-900/[0.03]">
                        <h3 class="text-xs font-black text-yellow-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <i data-lucide="calendar-clock" class="w-5 h-5"></i> Requêtes de Services (${(appointments || []).length})
                        </h3>
                        <div class="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[8px] font-black uppercase border border-yellow-500/30 animate-pulse">Action Requise</div>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        ${(appointments || []).length === 0 ? '<div class="h-full flex flex-col items-center justify-center opacity-30 italic text-xs uppercase font-bold text-gray-600">Aucun RDV en attente</div>' : appointments.map(apt => `
                            <div class="bg-black/40 p-5 rounded-[24px] border border-white/5 hover:border-yellow-500/20 transition-all flex flex-col gap-4">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <div class="flex items-center gap-3 mb-1">
                                            <div class="font-black text-white text-base uppercase italic tracking-tight">${apt.characters?.first_name} ${apt.characters?.last_name}</div>
                                            <div class="text-[9px] text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/20 font-black">@${apt.discord_username || 'Inconnu'}</div>
                                        </div>
                                        <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest">Service: <span class="text-white">${apt.service_name}</span></div>
                                    </div>
                                    <div class="text-[9px] text-gray-600 font-mono">${new Date(apt.created_at).toLocaleString()}</div>
                                </div>
                                <div class="flex gap-3 pt-3 border-t border-white/5">
                                    <button onclick="actions.handleAppointment('${apt.id}', 'approve', '${apt.service_name}', '${apt.client_id}')" class="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-600/30 transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2"><i data-lucide="check" class="w-4 h-4"></i> ACCORDER</button>
                                    <button onclick="actions.handleAppointment('${apt.id}', 'reject', '${apt.service_name}', '${apt.client_id}')" class="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-600/30 transition-all flex items-center justify-center gap-2"><i data-lucide="x" class="w-4 h-4"></i> REJETER</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- NEW ITEM & INVENTORY -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                ${!isAutoEcole ? `
                    <div class="glass-panel rounded-[32px] p-8 border border-white/5 bg-[#0a0a0a] shadow-2xl">
                        <h3 class="text-xs font-black text-orange-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <i data-lucide="package-plus" class="w-5 h-5"></i> Mise en Rayon
                        </h3>
                        <form onsubmit="actions.addItemToMarket(event)" class="space-y-6">
                            <div class="flex gap-4">
                                <button type="button" onclick="actions.openIconPicker()" class="w-14 h-14 shrink-0 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-gray-500 hover:text-blue-400 hover:border-blue-500/50 transition-all shadow-2xl" title="Librairie d'icônes">
                                    <i data-lucide="${state.selectedCreateIcon}" class="w-7 h-7"></i>
                                </button>
                                <input type="hidden" name="object_icon" id="selected-icon-input" value="${state.selectedCreateIcon}">
                                <div class="flex-1">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1 mb-2 block">Désignation</label>
                                    <input type="text" name="name" placeholder="Nom de l'article..." class="glass-input w-full p-3.5 rounded-2xl text-sm font-bold bg-black/40 border-white/10 uppercase tracking-tight" required>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <label class="cursor-pointer group">
                                    <input type="radio" name="product_type" value="standard" checked class="peer sr-only">
                                    <div class="p-4 rounded-2xl bg-black/40 border border-white/10 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-blue-400 transition-all flex flex-col items-center gap-2 group-hover:bg-white/5">
                                        <i data-lucide="package" class="w-6 h-6"></i>
                                        <div class="text-[10px] font-black uppercase tracking-widest">Produit Physique</div>
                                    </div>
                                </label>
                                <label class="cursor-pointer group">
                                    <input type="radio" name="product_type" value="service" class="peer sr-only">
                                    <div class="p-4 rounded-2xl bg-black/40 border border-white/10 peer-checked:bg-yellow-500/20 peer-checked:border-yellow-500 peer-checked:text-yellow-400 transition-all flex flex-col items-center gap-2 group-hover:bg-white/5">
                                        <i data-lucide="calendar-clock" class="w-6 h-6"></i>
                                        <div class="text-[10px] font-black uppercase tracking-widest">Service / RDV</div>
                                    </div>
                                </label>
                            </div>

                            <div class="grid grid-cols-3 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Prix HT</label>
                                    <div class="relative">
                                        <span class="absolute left-3 top-3 text-emerald-500 font-black text-xs">$</span>
                                        <input type="number" name="price" placeholder="0" class="glass-input w-full pl-7 p-3 rounded-2xl text-sm font-mono bg-black/40 border-white/10" required min="1">
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Volume Stock</label>
                                    <input type="number" name="quantity" placeholder="0" class="glass-input w-full p-3 rounded-2xl text-sm font-mono bg-black/40 border-white/10" required min="1">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Règlement</label>
                                    <select name="payment_type" class="glass-input w-full p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-black/40 border-white/10 text-gray-400">
                                        <option value="both">Mixte</option>
                                        <option value="cash_only">Cash</option>
                                        <option value="bank_only">Virement</option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Slogan / Info Bulle</label>
                                <input type="text" name="description" placeholder="Description attractive (55 car. max)" class="glass-input w-full p-4 rounded-2xl text-xs italic bg-black/40 border-white/10" maxlength="55">
                            </div>

                            <div class="flex items-center justify-between pt-6 border-t border-white/5">
                                <div class="text-[10px] text-gray-600 flex flex-col font-bold uppercase tracking-widest">
                                    <span>Taxe Rayon : <span class="text-orange-400">${state.economyConfig.create_item_ent_tax}%</span></span>
                                    <span class="opacity-50 text-[8px]">Prélevée sur valeur totale HT</span>
                                </div>
                                <button type="submit" class="glass-btn px-10 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-blue-900/30 transition-all transform hover:scale-[1.02]">
                                    PUBLIER
                                </button>
                            </div>
                        </form>
                    </div>
                ` : ''}

                <div class="flex flex-col gap-8">
                    <!-- STAFF SECTION -->
                    <div class="glass-panel rounded-[32px] border border-white/5 bg-[#0a0a0a] flex-col h-[400px] flex shadow-2xl overflow-hidden">
                        <div class="p-6 border-b border-white/5 flex justify-between items-center bg-blue-900/[0.03]">
                            <h3 class="text-xs font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <i data-lucide="users" class="w-5 h-5"></i> Effectifs & Collaborateurs (${(ent.members || []).length})
                            </h3>
                        </div>
                        <div class="overflow-y-auto custom-scrollbar p-0 flex-1">
                            <table class="w-full text-left text-sm border-separate border-spacing-0">
                                <thead class="bg-black/40 text-gray-600 uppercase text-[9px] font-black tracking-widest sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th class="p-4 border-b border-white/5">Nom & Prénom</th>
                                        <th class="p-4 border-b border-white/5">Grade</th>
                                        <th class="p-4 border-b border-white/5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    ${(ent.members || []).map(m => `
                                        <tr class="hover:bg-white/[0.03] transition-colors group">
                                            <td class="p-4">
                                                <div class="font-black text-white uppercase italic tracking-tight text-sm">${m.characters?.first_name} ${m.characters?.last_name}</div>
                                                <div class="text-[8px] text-gray-600 font-mono mt-0.5">#${m.character_id.substring(0,8).toUpperCase()}</div>
                                            </td>
                                            <td class="p-4">
                                                <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase text-gray-400 tracking-widest">${m.rank}</span>
                                            </td>
                                            <td class="p-4 text-right">
                                                ${m.status === 'pending' && isLeader ? `
                                                    <div class="flex gap-2 justify-end">
                                                        <button onclick="actions.manageApplication('${m.id}', 'accept')" class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white p-2 rounded-xl transition-all shadow-lg shadow-emerald-950/20"><i data-lucide="check" class="w-4 h-4"></i></button>
                                                        <button onclick="actions.manageApplication('${m.id}', 'reject')" class="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all shadow-lg shadow-red-950/20"><i data-lucide="x" class="w-4 h-4"></i></button>
                                                    </div>
                                                ` : `
                                                    <span class="text-[9px] font-black uppercase tracking-widest ${m.status === 'accepted' ? 'text-emerald-500' : 'text-orange-500 animate-pulse'}">
                                                        ${m.status === 'accepted' ? 'Engagé' : 'Attente Validation'}
                                                    </span>
                                                `}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- CATALOG SECTION -->
                    <div class="glass-panel rounded-[32px] border border-white/5 bg-[#0a0a0a] flex flex-col h-[400px] overflow-hidden shadow-2xl">
                        <div class="p-6 border-b border-white/5 flex justify-between items-center bg-gray-900/[0.03]">
                            <h3 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <i data-lucide="archive" class="w-5 h-5"></i> Catalogue & Stocks
                            </h3>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                            <table class="w-full text-left text-sm border-separate border-spacing-0">
                                <thead class="bg-black/40 text-gray-600 uppercase text-[9px] font-black tracking-widest sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th class="p-4 border-b border-white/5 w-14">Ref</th>
                                        <th class="p-4 border-b border-white/5">Article</th>
                                        <th class="p-4 border-b border-white/5 text-right">Prix</th>
                                        <th class="p-4 border-b border-white/5 text-center">Stock</th>
                                        <th class="p-4 border-b border-white/5 text-right">Opérations</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    ${sortedItems.map(i => {
                                        const isPending = i.status === 'pending';
                                        const isAwaitingTax = i.status === 'awaiting_tax';
                                        const icon = i.object_icon || 'package';
                                        return `
                                        <tr class="hover:bg-white/[0.03] transition-colors group">
                                            <td class="p-4 text-center">
                                                <i data-lucide="${icon}" class="w-4 h-4 text-gray-600 group-hover:text-white transition-colors"></i>
                                            </td>
                                            <td class="p-4">
                                                <div class="font-black text-white uppercase italic text-sm tracking-tight ${i.is_hidden ? 'opacity-40' : ''}">${i.name}</div>
                                                <div class="mt-1 flex gap-2">
                                                    ${isPending ? '<span class="text-[8px] text-orange-500 uppercase font-black bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">Modération</span>' : isAwaitingTax ? `<button onclick="actions.payItemTax('${i.id}')" class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black border border-red-400 shadow-lg animate-pulse uppercase tracking-widest">Action: Payer Taxe</button>` : ''}
                                                    ${i.requires_appointment ? '<span class="text-[8px] text-yellow-400 uppercase font-black bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 tracking-widest">RDV Requis</span>' : ''}
                                                </div>
                                            </td>
                                            <td class="p-4 text-right">
                                                <div class="font-mono font-black text-emerald-400 text-base">$${i.price.toLocaleString()}</div>
                                            </td>
                                            <td class="p-4 text-center">
                                                <span class="font-mono text-xs font-black text-white bg-white/5 px-2 py-1 rounded border border-white/5">${i.quantity > 9000 ? '∞' : i.quantity}</span>
                                            </td>
                                            <td class="p-4 text-right">
                                                <div class="flex gap-1 justify-end">
                                                    ${!isAwaitingTax && !isAutoEcole ? `<button onclick="actions.restockItem('${i.id}', ${i.price})" class="p-2 text-blue-500 hover:bg-blue-600/10 rounded-lg" title="Réapprovisionner"><i data-lucide="plus-circle" class="w-4 h-4"></i></button>` : ''}
                                                    ${!isAwaitingTax ? `<button onclick="actions.toggleItemVisibility('${i.id}', ${i.is_hidden})" class="p-2 text-gray-600 hover:text-white rounded-lg" title="Masquer/Afficher"><i data-lucide="${i.is_hidden ? 'eye-off' : 'eye'}" class="w-4 h-4"></i></button>` : ''}
                                                    ${!isAutoEcole ? `<button onclick="actions.deleteItem('${i.id}')" class="p-2 text-red-500 hover:bg-red-600/10 rounded-lg" title="Supprimer"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `}).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};
