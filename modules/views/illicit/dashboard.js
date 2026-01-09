
import { state } from '../../state.js';
import { HEIST_DATA, DRUG_DATA } from '../illicit.js';

export const IllicitDashboardView = () => {
    const hasGang = !!state.activeGang;
    const char = state.activeCharacter;
    
    // --- DYNAMIC RISK INDEX CALCULATION ---
    const totalReports = state.globalReports?.length || 0;
    const gangMemberIds = state.activeGang?.members?.map(m => m.character_id) || [];
    const gangReportsCount = state.globalReports?.filter(r => 
        r.police_report_suspects?.some(s => gangMemberIds.includes(s.character_id))
    ).length || 0;
    
    // Logic: If gang members are cited in many reports relative to the total, risk increases.
    // Multiplier of 2 to make it more sensitive.
    const riskPercent = totalReports > 0 ? Math.min(100, Math.round((gangReportsCount / totalReports) * 100 * 3)) : 0;
    
    let riskColor = 'bg-blue-500';
    let riskLabel = 'Indétectable';
    if (riskPercent > 20) { riskColor = 'bg-emerald-500'; riskLabel = 'Faible'; }
    if (riskPercent > 40) { riskColor = 'bg-yellow-500'; riskLabel = 'Modéré'; }
    if (riskPercent > 60) { riskColor = 'bg-orange-500'; riskLabel = 'Élevé'; }
    if (riskPercent > 80) { riskColor = 'bg-red-600'; riskLabel = 'Critique'; }

    // Heist Widget
    let heistWidget = '';
    if (state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
         const hData = HEIST_DATA.find(h => h.id === state.activeHeistLobby.heist_type);
         heistWidget = `
            <div class="glass-panel p-6 rounded-[32px] border border-orange-500/20 bg-orange-500/[0.03] flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden group">
                <div class="absolute -right-10 -top-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div class="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/20 shrink-0 shadow-lg animate-pulse">
                    <i data-lucide="timer" class="w-8 h-8"></i>
                </div>
                <div class="flex-1 text-center md:text-left relative z-10">
                    <div class="flex items-center gap-2 mb-1 justify-center md:justify-start">
                        <span class="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500/60">Opération en cours</span>
                        <span class="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[8px] font-bold uppercase tracking-tighter animate-pulse">Live</span>
                    </div>
                    <h3 class="text-white font-black text-xl mb-1 tracking-tight uppercase italic">${hData ? hData.name : 'Mission Alpha'}</h3>
                    ${state.activeHeistLobby.location ? `<p class="text-gray-400 text-xs flex items-center gap-2 justify-center md:justify-start"><i data-lucide="map-pin" class="w-3 h-3"></i> ${state.activeHeistLobby.location}</p>` : ''}
                </div>
                <div class="text-4xl font-mono font-bold text-orange-500 tracking-tighter" id="heist-timer-display">00:00</div>
            </div>
         `;
    } else {
         heistWidget = `
            <button onclick="actions.setIllicitTab('heists')" class="glass-panel p-6 rounded-[32px] border border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-center gap-6 hover:bg-white/[0.05] transition-all group text-left">
                <div class="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors border border-white/5">
                    <i data-lucide="zap" class="w-8 h-8"></i>
                </div>
                <div class="flex-1">
                    <div class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Système Opérationnel</div>
                    <h3 class="text-gray-300 font-bold text-lg">Préparer une Opération</h3>
                    <p class="text-xs text-gray-600">Choisissez une cible pour votre équipe.</p>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-700 group-hover:text-white transition-colors"></i>
            </button>
         `;
    }

    // Lab Widget
    let labWidget = '';
    if(hasGang && state.activeGang.myStatus === 'accepted' && state.drugLab && state.drugLab.current_batch && state.drugLab.current_batch.end_time > Date.now()) {
         const batch = state.drugLab.current_batch;
         const drugInfo = DRUG_DATA[batch.type];
         labWidget = `
            <div class="glass-panel p-6 rounded-[32px] border border-emerald-500/20 bg-emerald-500/[0.03] flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden group">
                <div class="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shrink-0 shadow-lg">
                    <i data-lucide="flask-conical" class="w-8 h-8"></i>
                </div>
                <div class="flex-1 text-center md:text-left relative z-10">
                    <div class="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60 mb-1">Laboratoire Actif</div>
                    <h3 class="text-white font-black text-xl mb-1 tracking-tight uppercase italic">${drugInfo ? drugInfo.name : 'Produit'} (${batch.amount}g)</h3>
                    <p class="text-emerald-400/60 text-xs font-bold uppercase tracking-widest">${batch.stage}</p>
                </div>
                <div class="text-4xl font-mono font-bold text-emerald-500 tracking-tighter" id="drug-timer-display">00:00</div>
            </div>
         `;
    }

    return `
        <div class="flex flex-col h-full overflow-hidden gap-8 animate-fade-in">
             
             <!-- MAIN ALERTS / WIDGETS -->
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
                 ${heistWidget}
                 ${labWidget ? labWidget : `
                    <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-white/[0.01] flex items-center gap-6">
                        <div class="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center text-gray-700 border border-white/5 shrink-0">
                            <i data-lucide="activity" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <div class="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Fréquence Radio</div>
                            <div class="text-gray-500 text-sm italic font-medium">"Signal stable. Los Angeles dort encore."</div>
                        </div>
                    </div>
                 `}
             </div>

             <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                 
                 <!-- LEFT COLUMN: STATUS & NEWS -->
                 <div class="lg:col-span-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
                    
                    <!-- TOP STATS -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                        <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c0c0e] to-black group hover:border-red-500/20 transition-all">
                            <div class="flex justify-between items-start mb-4">
                                <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><i data-lucide="wallet" class="w-4 h-4"></i></div>
                                <div class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Liquidité</div>
                            </div>
                            <div class="text-2xl font-mono font-bold text-white tracking-tight">$${state.bankAccount.cash_balance.toLocaleString()}</div>
                        </div>
                        
                        <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c0c0e] to-black group hover:border-purple-500/20 transition-all">
                            <div class="flex justify-between items-start mb-4">
                                <div class="p-2 rounded-lg bg-purple-500/10 text-purple-400"><i data-lucide="users" class="w-4 h-4"></i></div>
                                <div class="text-[9px] font-black text-gray-500 uppercase tracking-widest">Affiliation Gang</div>
                            </div>
                            <div class="text-xl font-bold text-white truncate">${state.activeGang ? state.activeGang.name : 'Cavalier Seul'}</div>
                        </div>
                    </div>

                    <!-- ACTIVITY FEED -->
                    <div class="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.02] flex-1 flex flex-col overflow-hidden">
                        <div class="flex justify-between items-center mb-6 shrink-0">
                            <h3 class="font-black text-white uppercase tracking-tighter text-lg flex items-center gap-3">
                                <i data-lucide="radio" class="w-6 h-6 text-red-500"></i>
                                Réseau d'Information
                            </h3>
                            <div class="px-2 py-1 bg-red-500/10 text-red-400 rounded text-[9px] font-black uppercase tracking-widest border border-red-500/20 animate-pulse">Live Feed</div>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            ${state.bounties.length === 0 ? '<div class="text-center py-20 text-gray-600 text-xs italic uppercase font-bold tracking-widest">Aucune alerte prioritaire détectée.</div>' : state.bounties.slice(0, 5).map(b => `
                                <div class="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-red-500/30 transition-all group">
                                    <div class="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 group-hover:scale-110 transition-transform">
                                        <i data-lucide="crosshair" class="w-5 h-5"></i>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="text-sm font-bold text-white truncate uppercase tracking-tight">${b.target_name}</div>
                                        <div class="text-[10px] text-gray-500 font-medium">Prime active : <span class="text-red-400 font-bold">$${b.amount.toLocaleString()}</span></div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-[9px] text-gray-600 font-mono">${new Date(b.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                        <button onclick="actions.setIllicitTab('bounties')" class="text-[8px] text-red-400 font-black uppercase tracking-widest hover:text-red-300">Détails</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="pt-6 border-t border-white/5 text-center shrink-0">
                            <p class="text-[9px] text-gray-700 uppercase font-black tracking-[0.3em]">Surveillance des fréquences en continu</p>
                        </div>
                    </div>
                 </div>

                 <!-- RIGHT COLUMN: QUICK NAVIGATION & RISK -->
                 <div class="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                    
                    <div class="glass-panel p-6 rounded-[32px] border border-orange-500/10 bg-orange-500/[0.01] mb-2">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <i data-lucide="shield-alert" class="w-4 h-4"></i> Indice de Risque
                            </h4>
                            <span class="text-[10px] font-black ${riskPercent > 70 ? 'text-red-500' : 'text-orange-400'} uppercase tracking-widest">${riskLabel}</span>
                        </div>
                        <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                            <div class="h-full ${riskColor} transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.3)]" style="width: ${riskPercent}%"></div>
                        </div>
                        <p class="text-[9px] text-gray-600 leading-relaxed font-bold uppercase">Calculé sur l'activité des membres du gang (${gangReportsCount}/${totalReports} rapports CAD)</p>
                    </div>

                    <button onclick="actions.setIllicitTab('gangs')" class="glass-panel p-6 rounded-[32px] border border-white/5 bg-gradient-to-br from-purple-900/10 to-transparent hover:border-purple-500/40 transition-all text-left group">
                        <div class="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform border border-purple-500/20">
                            <i data-lucide="users" class="w-6 h-6"></i>
                        </div>
                        <h4 class="font-black text-white uppercase tracking-tight text-base mb-1">Gestion de Gang</h4>
                        <p class="text-xs text-gray-500 leading-relaxed">Membres, coffre-fort et hiérarchie interne.</p>
                    </button>

                    <button onclick="actions.setIllicitTab('market')" class="glass-panel p-6 rounded-[32px] border border-white/5 bg-gradient-to-br from-red-900/10 to-transparent hover:border-red-500/40 transition-all text-left group">
                        <div class="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mb-4 group-hover:scale-110 transition-transform border border-red-500/20">
                            <i data-lucide="shopping-cart" class="w-6 h-6"></i>
                        </div>
                        <h4 class="font-black text-white uppercase tracking-tight text-base mb-1">Marché de l'Ombre</h4>
                        <p class="text-xs text-gray-500 leading-relaxed">Équipement tactique et arsenal non répertorié.</p>
                    </button>

                    <button onclick="actions.setIllicitTab('drugs')" class="glass-panel p-6 rounded-[32px] border border-white/5 bg-gradient-to-br from-emerald-900/10 to-transparent hover:border-emerald-500/40 transition-all text-left group ${!hasGang || state.activeGang?.myStatus !== 'accepted' ? 'opacity-50 grayscale' : ''}">
                        <div class="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform border border-emerald-500/20">
                            <i data-lucide="flask-conical" class="w-6 h-6"></i>
                        </div>
                        <h4 class="font-black text-white uppercase tracking-tight text-base mb-1">Gestion Labo</h4>
                        <p class="text-xs text-gray-500 leading-relaxed">Chaîne de production et stocks de stupéfiants.</p>
                    </button>

                    <div class="mt-auto glass-panel p-5 rounded-3xl border border-red-500/10 bg-red-500/[0.02]">
                        <div class="flex items-center gap-3 mb-2">
                            <i data-lucide="shield-alert" class="w-4 h-4 text-red-500"></i>
                            <span class="text-[10px] font-black text-white uppercase tracking-widest">Sécurité Terminal</span>
                        </div>
                        <p class="text-[10px] text-gray-600 leading-relaxed font-bold uppercase">Effacement d'urgence : F5. Ne pas laisser de session ouverte sans surveillance.</p>
                    </div>
                 </div>

             </div>
        </div>
    `;
};
