
import { state } from '../../state.js';
import { BLACK_MARKET_CATALOG } from '../illicit.js';

export const IllicitMarketView = () => {
     if (!state.activeGameSession) {
         return `
            <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                <div class="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20 shadow-xl">
                    <i data-lucide="lock-keyhole" class="w-12 h-12"></i>
                </div>
                <h2 class="text-3xl font-bold text-white mb-2 italic uppercase tracking-tighter">Marché Suspendu</h2>
                <p class="text-gray-500 max-w-md mx-auto leading-relaxed">Les connexions au réseau d'approvisionnement sont coupées. Revenez lors d'une session active.</p>
            </div>
         `;
     }

     const catTabs = [
        { id: 'light', label: 'Légères', icon: 'target' },
        { id: 'medium', label: 'Moyennes', icon: 'zap' },
        { id: 'heavy', label: 'Lourdes', icon: 'flame' },
        { id: 'sniper', label: 'Précision', icon: 'crosshair' }
    ];

    let currentSubTab = state.activeIllicitTab === 'market' ? 'light' : state.activeIllicitTab.replace('market-', '');
    let currentItems = BLACK_MARKET_CATALOG[currentSubTab] || [];
    if (state.blackMarketSearch) {
        const q = state.blackMarketSearch.toLowerCase();
        currentItems = currentItems.filter(i => i.name.toLowerCase().includes(q));
    }

    return `
        <div class="h-full flex flex-col min-h-0 animate-fade-in">
             
             <!-- TOOLBAR -->
             <div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 shrink-0">
                <div class="relative w-full md:w-[450px] group">
                    <i data-lucide="search" class="w-5 h-5 absolute left-4 top-3.5 text-gray-500 group-focus-within:text-red-500 transition-colors"></i>
                    <input type="text" oninput="actions.searchBlackMarket(this.value)" value="${state.blackMarketSearch}" placeholder="Filtrer arsenal (ex: Beretta, AK47...)" class="glass-input pl-12 pr-4 py-4 rounded-[20px] w-full text-sm bg-black/40 border-white/5 focus:border-red-500/30">
                </div>
                
                <div class="flex items-center gap-6 px-8 py-4 bg-white/5 rounded-[24px] border border-white/5 shadow-2xl">
                    <div>
                        <div class="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] mb-1">Fonds Disponibles</div>
                        <div class="text-2xl font-mono font-black text-emerald-400 tracking-tighter">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                    </div>
                    <div class="w-px h-10 bg-white/10"></div>
                    <div class="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                        <i data-lucide="banknote" class="w-6 h-6"></i>
                    </div>
                </div>
            </div>

            <!-- NAVIGATION CATEGORIES -->
            <div class="flex gap-3 overflow-x-auto custom-scrollbar pb-6 mb-2 shrink-0 no-scrollbar">
                ${catTabs.map(tab => `
                    <button onclick="actions.setIllicitTab('market-${tab.id}')" 
                        class="px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all border shrink-0
                        ${currentSubTab === tab.id ? 'bg-red-600 text-white border-red-500 shadow-xl shadow-red-900/20' : 'bg-white/5 text-gray-500 border-white/5 hover:text-white hover:bg-white/10'}">
                        <i data-lucide="${tab.icon}" class="w-4 h-4"></i> ${tab.label}
                    </button>
                `).join('')}
            </div>

            <!-- GRID ITEMS -->
            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    ${currentItems.length === 0 ? '<div class="col-span-full py-32 text-center text-gray-700 italic uppercase font-black tracking-widest text-xs">Aucun équipement disponible sur cette fréquence.</div>' : currentItems.map(item => {
                        const canAfford = state.bankAccount.cash_balance >= item.price;
                        return `
                            <div class="glass-panel p-6 rounded-[32px] border border-white/5 hover:border-red-500/30 transition-all group flex flex-col relative overflow-hidden shadow-lg hover:shadow-red-950/10">
                                <div class="absolute -right-6 -top-6 w-20 h-20 bg-white/5 rounded-full blur-2xl transition-all duration-700 group-hover:bg-red-500/10"></div>
                                
                                <div class="flex justify-between items-start mb-8 relative z-10">
                                    <div class="w-14 h-14 rounded-2xl bg-[#1a1a1c] border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-red-400 group-hover:scale-110 transition-all shadow-inner">
                                        <i data-lucide="${item.icon}" class="w-7 h-7"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Prix Unitaire</div>
                                        <div class="font-mono text-xl font-black ${canAfford ? 'text-emerald-400' : 'text-red-500'} tracking-tighter">$${item.price.toLocaleString()}</div>
                                    </div>
                                </div>
                                
                                <h3 class="text-xl font-black text-white mb-8 flex-1 uppercase italic tracking-tight group-hover:translate-x-1 transition-transform">${item.name}</h3>
                                
                                <button onclick="actions.buyIllegalItem('${item.name}', ${item.price})" ${!canAfford ? 'disabled' : ''} 
                                    class="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all transform active:scale-95
                                    ${canAfford ? 'bg-white text-black hover:bg-red-600 hover:text-white' : 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5'}">
                                    ${canAfford ? 'INITIER TRANSACTION' : 'FONDS INSUFFISANTS'}
                                </button>
                            </div>`;
                    }).join('')}
                </div>
                
                <div class="py-16 text-center text-[9px] text-gray-700 font-black uppercase tracking-[0.4em] opacity-40">
                    SÉQUENCE DE MARQUAGE BIOMÉTRIQUE ACTIVÉE
                </div>
            </div>
        </div>
    `;
};
