
import { state } from '../../state.js';
import { DRUG_DATA } from '../illicit.js';

export const IllicitDrugsView = () => {
    const hasGang = !!state.activeGang;
    if (!hasGang || state.activeGang.myStatus !== 'accepted') {
        return `
            <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                <div class="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20 shadow-lg">
                    <i data-lucide="lock" class="w-12 h-12"></i>
                </div>
                <h2 class="text-3xl font-bold text-white mb-2 italic uppercase tracking-tighter">Accès Labo Refusé</h2>
                <p class="text-gray-400 max-w-md mx-auto leading-relaxed">Les infrastructures de production sont la propriété exclusive des gangs criminels. Affiliez-vous à un gang pour continuer.</p>
            </div>
        `;
    }

    const lab = state.drugLab;
    if (!lab) return '<div class="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full"><div class="loader-spinner border-emerald-500 mb-4"></div>Initialisation des équipements...</div>';

    if (!lab.has_building) {
        return `
            <div class="max-w-2xl mx-auto text-center pt-20 animate-fade-in">
                <div class="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500 border border-emerald-500/20 shadow-2xl">
                    <i data-lucide="warehouse" class="w-16 h-16"></i>
                </div>
                <h2 class="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">Acquisition Immobilière</h2>
                <p class="text-gray-400 mb-10 leading-relaxed font-medium">Votre gang nécessite une base d'opérations sécurisée pour blanchir vos activités de production. Investissez dans un local clandestin.</p>
                <button onclick="actions.buyLabComponent('building', 50000)" class="glass-btn px-12 py-5 rounded-2xl text-base font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-900/30 transition-all transform hover:scale-[1.02]">
                    ACHETER LOCAL ($50,000)
                </button>
            </div>
        `;
    }

    if (!lab.has_equipment) {
        return `
            <div class="max-w-2xl mx-auto text-center pt-20 animate-fade-in">
                <div class="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-500 border border-blue-500/20 shadow-2xl">
                    <i data-lucide="flask-conical" class="w-16 h-16"></i>
                </div>
                <h2 class="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">Matériel de Synthèse</h2>
                <p class="text-gray-400 mb-10 leading-relaxed font-medium">Le local est opérationnel mais les cuves sont vides. Installez le matériel chimique nécessaire à la production de masse.</p>
                <button onclick="actions.buyLabComponent('equipment', 25000)" class="glass-btn px-12 py-5 rounded-2xl text-base font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/30 transition-all transform hover:scale-[1.02]">
                    ACHETER ÉQUIPEMENT ($25,000)
                </button>
            </div>
        `;
    }

    const batch = lab.current_batch;
    const isWorking = batch && new Date(batch.end_time) > new Date();

    return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0 animate-fade-in">
            
            <!-- LEFT: INVENTORY & OPS -->
            <div class="lg:col-span-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c0c0e] to-black relative overflow-hidden group">
                        <div class="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-3xl transition-all duration-700 group-hover:bg-white/10"></div>
                        <div class="flex justify-between items-center mb-4 relative z-10">
                            <div class="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">Stock Cocaïne Pure</div>
                            <i data-lucide="target" class="w-4 h-4 text-white/40"></i>
                        </div>
                        <div class="text-4xl font-mono font-black text-white tracking-tighter relative z-10">${lab.stock_coke_pure || 0}<span class="text-sm ml-1 text-gray-500">G</span></div>
                    </div>
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c0c0e] to-black relative overflow-hidden group">
                        <div class="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl transition-all duration-700 group-hover:bg-emerald-500/10"></div>
                        <div class="flex justify-between items-center mb-4 relative z-10">
                            <div class="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">Stock Cannabis Prêt</div>
                            <i data-lucide="leaf" class="w-4 h-4 text-emerald-500/40"></i>
                        </div>
                        <div class="text-4xl font-mono font-black text-emerald-400 tracking-tighter relative z-10">${lab.stock_weed_pure || 0}<span class="text-sm ml-1 text-gray-500">G</span></div>
                    </div>
                </div>

                <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-white/[0.01] flex-1 flex flex-col min-h-0 shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                    <h3 class="font-black text-white uppercase tracking-widest text-sm mb-8 flex items-center gap-3">
                        <i data-lucide="flask-conical" class="w-5 h-5 text-emerald-400"></i>
                        Contrôle des Unités de Production
                    </h3>
                    
                    ${isWorking ? `
                        <div class="flex-1 flex flex-col items-center justify-center p-10 bg-black/40 rounded-[32px] border border-emerald-500/20 shadow-inner relative group">
                            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.05),transparent_70%)]"></div>
                            <div class="loader-spinner w-20 h-20 mb-8 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]"></div>
                            <div class="text-emerald-400 font-black text-[10px] uppercase tracking-[0.5em] mb-2 animate-pulse">Séquence Opérationnelle</div>
                            <div class="font-mono text-6xl font-black text-white tracking-tighter mb-2" id="drug-timer-display">00:00</div>
                            <p class="text-xs text-gray-500 uppercase font-bold tracking-widest">${batch.stage} de ${batch.amount}g de ${DRUG_DATA[batch.type].name}</p>
                        </div>
                    ` : `
                        <form onsubmit="return false;" class="space-y-8 flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
                            <div class="space-y-4">
                                <label class="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Type de synthèse</label>
                                <div class="grid grid-cols-2 gap-4">
                                    <label class="cursor-pointer group">
                                        <input type="radio" name="drug_type" value="coke" checked class="peer sr-only">
                                        <div class="p-5 rounded-2xl bg-white/5 border border-white/5 peer-checked:bg-white peer-checked:border-white peer-checked:text-black group-hover:bg-white/10 transition-all text-center">
                                            <div class="font-black uppercase tracking-tighter text-sm italic">Cocaïne (Blanche)</div>
                                        </div>
                                    </label>
                                    <label class="cursor-pointer group">
                                        <input type="radio" name="drug_type" value="weed" class="peer sr-only">
                                        <div class="p-5 rounded-2xl bg-white/5 border border-white/5 peer-checked:bg-emerald-600 peer-checked:border-emerald-500 peer-checked:text-white group-hover:bg-white/10 transition-all text-center">
                                            <div class="font-black uppercase tracking-tighter text-sm italic">Cannabis (Vert)</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <label class="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1">Volume de Production</label>
                                <select name="amount" class="glass-input w-full p-4 rounded-2xl bg-black/40 border-white/10 font-mono font-bold text-gray-300 focus:text-white">
                                    <option value="100">100g (Process rapide)</option>
                                    <option value="500">500g (Optimisé)</option>
                                    <option value="1000">1kg (Production de masse)</option>
                                </select>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                                <button onclick="actions.startDrugAction('harvest', event)" class="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Récolter</button>
                                <button onclick="actions.startDrugAction('process', event)" class="py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">Traiter</button>
                                <button onclick="actions.startDrugAction('sell', event)" class="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all">Distribuer (Vendre)</button>
                            </div>
                        </form>
                    `}
                </div>
            </div>

            <!-- RIGHT: GUIDE & TIPS -->
            <div class="lg:col-span-4 space-y-6">
                <div class="glass-panel p-8 rounded-[32px] border border-emerald-500/10 bg-emerald-500/[0.02]">
                    <h3 class="font-black text-emerald-400 uppercase tracking-widest text-[10px] mb-6 flex items-center gap-3">
                        <i data-lucide="info" class="w-4 h-4"></i> Manuel de synthèse
                    </h3>
                    <div class="space-y-6 text-xs leading-relaxed">
                        <div class="flex gap-4">
                            <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 font-mono font-bold text-[10px] text-gray-400 border border-white/10">1</div>
                            <p class="text-gray-400">Lancez la <span class="text-white font-bold">Récolte</span> pour obtenir la matière brute (limité à 1x par semaine civile pour le gang).</p>
                        </div>
                        <div class="flex gap-4">
                            <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 font-mono font-bold text-[10px] text-gray-400 border border-white/10">2</div>
                            <p class="text-gray-400">Le <span class="text-white font-bold">Traitement</span> purifie le produit pour le rendre commercialisable sur le marché de détail.</p>
                        </div>
                        <div class="flex gap-4">
                            <div class="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 font-mono font-bold text-[10px] text-gray-400 border border-white/10">3</div>
                            <p class="text-gray-400">La <span class="text-emerald-400 font-bold">Vente</span> génère du liquide injecté directement dans le <span class="text-purple-400 font-bold">coffre de votre gang</span>.</p>
                        </div>
                    </div>
                </div>
                
                <div class="glass-panel p-8 rounded-[32px] border border-orange-500/10 bg-orange-500/[0.01]">
                    <h4 class="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em] mb-4">Indice de Vigilance</h4>
                    <div class="flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        <span>Pression Policière</span>
                        <span class="text-orange-400">Variable</span>
                    </div>
                    <div class="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div class="h-full bg-orange-500 w-1/3"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
};
