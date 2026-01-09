
import { state } from '../../state.js';

export const EnterpriseMarketView = () => {
    let items = state.enterpriseMarket || [];
    const isSessionActive = !!state.activeGameSession;
    const currentCash = state.bankAccount ? state.bankAccount.cash_balance : 0;
    const todayStats = state.dailyEconomyStats?.[0] || { amount: 0 };
    const volumeToday = todayStats.amount;

    if (state.marketEnterpriseFilter && state.marketEnterpriseFilter !== 'all') {
        items = items.filter(i => i.enterprise_id === state.marketEnterpriseFilter);
    }

    const enterpriseOptions = [...new Set(state.enterpriseMarket.map(i => JSON.stringify({id: i.enterprise_id, name: i.enterprises?.name})))]
        .map(s => JSON.parse(s))
        .sort((a,b) => a.name.localeCompare(b.name));

    const bestSellers = state.topSellers || [];

    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <!-- TOOLBAR & STATS -->
            <div class="flex flex-col xl:flex-row gap-4 mb-6 shrink-0">
                <div class="flex-1 flex gap-2">
                    <div class="relative flex-1">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                        <input type="text" placeholder="Rechercher produit..." class="glass-input pl-10 w-full p-2.5 rounded-[14px] text-sm bg-black/20 focus:bg-black/40 border-white/10">
                    </div>
                    <select onchange="actions.filterMarketByEnterprise(this.value)" class="glass-input w-48 p-2.5 rounded-[14px] text-sm bg-black/20 focus:bg-black/40 border-white/10 text-gray-300">
                        <option value="all">Toutes les boutiques</option>
                        ${enterpriseOptions.map(e => `<option value="${e.id}" ${state.marketEnterpriseFilter === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                    </select>
                </div>
                
                <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
                    <div class="flex items-center gap-3 px-5 py-2.5 bg-blue-500/5 rounded-2xl border border-blue-500/10 whitespace-nowrap">
                        <div class="p-1.5 bg-blue-500/10 rounded-lg text-blue-400"><i data-lucide="bar-chart-3" class="w-4 h-4"></i></div>
                        <div>
                            <div class="text-[9px] text-blue-300/70 uppercase font-black tracking-widest">Flux 24h</div>
                            <div class="text-sm font-mono font-bold text-blue-100">$${volumeToday.toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 whitespace-nowrap">
                        <div class="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400"><i data-lucide="wallet" class="w-4 h-4"></i></div>
                        <div>
                            <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest">Liquidité</div>
                            <div class="text-sm font-mono font-bold text-emerald-400">$${currentCash.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            ${!isSessionActive ? `
                <div class="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-[20px] flex items-center gap-4 text-orange-300 text-xs font-bold animate-pulse">
                    <i data-lucide="lock" class="w-5 h-5"></i>
                    Session de jeu inactive : Les transactions sont suspendues.
                </div>
            ` : ''}

            <!-- BEST SELLERS / TRENDING -->
            ${bestSellers.length > 0 ? `
                <div class="mb-8 shrink-0">
                    <h3 class="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] flex items-center gap-3 mb-4 px-1">
                        <i data-lucide="flame" class="w-4 h-4"></i> Tendances Actuelles
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${bestSellers.map((item, idx) => {
                            const rankColors = [
                                'from-yellow-600/20 to-black border-yellow-500/30', // Gold
                                'from-gray-400/20 to-black border-gray-400/30', // Silver
                                'from-orange-700/20 to-black border-orange-700/30' // Bronze
                            ];
                            const isPromo = item.is_promo_trend;
                            const itemIcon = item.object_icon || 'package';
                            const discount = item.discount_percent || 0;
                            const priceHT = Math.ceil(item.price * (1 - discount/100));
                            
                            return `
                            <div onclick="${isSessionActive ? `actions.openBuyModal('${item.id}')` : ''}" 
                                 class="relative bg-gradient-to-br ${rankColors[idx]} border rounded-[28px] p-5 flex items-center gap-5 cursor-pointer hover:scale-[1.03] transition-all shadow-xl overflow-hidden group">
                                <div class="absolute -right-6 -top-6 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                                <div class="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center text-white border border-white/5 shadow-2xl shrink-0 relative z-10 group-hover:scale-110 transition-transform">
                                    <i data-lucide="${itemIcon}" class="w-7 h-7"></i>
                                    <div class="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center border-2 border-black">#${idx+1}</div>
                                </div>
                                <div class="flex-1 min-w-0 relative z-10">
                                    <div class="flex justify-between items-start">
                                        <div class="font-black text-white truncate text-base italic tracking-tight uppercase">${item.name}</div>
                                        ${isPromo ? '<span class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded font-black uppercase animate-pulse">PROMO</span>' : ''}
                                    </div>
                                    <div class="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate mt-0.5">${item.enterprises?.name}</div>
                                    <div class="flex items-center gap-3 mt-2">
                                        <span class="font-mono font-black text-emerald-400 text-lg">$${priceHT.toLocaleString()}</span>
                                        ${item.sales_count ? `<span class="text-[8px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400 font-black uppercase">+${item.sales_count} Ventes</span>` : ''}
                                    </div>
                                </div>
                                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-700 group-hover:text-white group-hover:translate-x-1 transition-all"></i>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="flex-1 overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] flex flex-col min-h-0 shadow-2xl">
                <div class="overflow-y-auto custom-scrollbar flex-1">
                    ${items.length === 0 ? '<div class="text-center text-gray-500 py-32 italic uppercase font-black tracking-widest text-xs opacity-50">Aucun produit en rayon.</div>' : `
                        <table class="w-full text-left border-separate border-spacing-0">
                            <thead class="bg-black/40 text-[10px] uppercase text-gray-500 font-black tracking-widest sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th class="p-5 w-20">Ref</th>
                                    <th class="p-5">Article & Description</th>
                                    <th class="p-5">Émetteur</th>
                                    <th class="p-5 text-center">Stock</th>
                                    <th class="p-5 text-right">Tarif HT</th>
                                    <th class="p-5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody class="text-sm divide-y divide-white/5">
                                ${items.map(item => {
                                    const hasDiscount = item.discount_percent > 0;
                                    const itemIcon = item.object_icon || 'package';
                                    return `
                                    <tr class="hover:bg-white/[0.03] transition-colors group ${isSessionActive ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}" 
                                        onclick="${isSessionActive ? `actions.openBuyModal('${item.id}')` : ''}">
                                        <td class="p-5 text-center">
                                            <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 border border-white/10 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-all">
                                                <i data-lucide="${itemIcon}" class="w-5 h-5"></i>
                                            </div>
                                        </td>
                                        <td class="p-5">
                                            <div class="font-black text-white flex items-center gap-2 uppercase italic tracking-tight">
                                                ${item.name}
                                                ${hasDiscount ? `<span class="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded font-black">-${item.discount_percent}%</span>` : ''}
                                                ${item.requires_appointment ? `<span class="bg-yellow-500/10 text-yellow-400 text-[8px] px-2 py-0.5 rounded font-black border border-yellow-500/20 uppercase tracking-widest">RDV</span>` : ''}
                                            </div>
                                            ${item.description ? `<div class="text-[11px] text-gray-500 truncate max-w-[250px] mt-1 font-medium italic">"${item.description}"</div>` : ''}
                                        </td>
                                        <td class="p-5 text-gray-400">
                                            <div class="flex items-center gap-2">
                                                <div class="w-2 h-2 rounded-full bg-blue-500/30"></div>
                                                <span class="text-xs font-bold uppercase tracking-widest">${item.enterprises?.name || 'Entreprise'}</span>
                                            </div>
                                        </td>
                                        <td class="p-5 text-center">
                                            <span class="bg-white/5 px-3 py-1 rounded-lg text-xs font-mono font-bold text-gray-300 border border-white/5">${item.quantity > 9000 ? '∞' : item.quantity}</span>
                                        </td>
                                        <td class="p-5 text-right">
                                            <div class="font-mono font-black text-base ${hasDiscount ? 'text-emerald-400' : 'text-white'}">
                                                ${hasDiscount ? `<span class="line-through text-gray-600 text-xs mr-2">$${item.price}</span>` : ''}
                                                $${Math.ceil(item.price * (1 - (item.discount_percent||0)/100)).toLocaleString()}
                                            </div>
                                            <div class="text-[8px] uppercase font-black text-gray-600 tracking-tighter mt-1">${item.payment_type === 'both' ? 'Paiement Mixte' : item.payment_type === 'cash_only' ? 'Cash Uniquement' : 'Virement Requis'}</div>
                                        </td>
                                        <td class="p-5 text-right">
                                            ${isSessionActive ? `
                                                <button class="glass-btn-secondary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white border-white/10 group-hover:border-blue-500 transition-all flex items-center gap-2 ml-auto shadow-lg">
                                                    <i data-lucide="${item.requires_appointment ? 'calendar' : 'shopping-cart'}" class="w-3.5 h-3.5"></i> ${item.requires_appointment ? 'Réserver' : 'Acheter'}
                                                </button>
                                            ` : `
                                                <span class="text-[9px] uppercase font-black text-gray-600 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">Signal Coupé</span>
                                            `}
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        </div>
    `;
};
