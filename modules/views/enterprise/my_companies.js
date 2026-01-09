
import { state } from '../../state.js';

export const EnterpriseMyCompaniesView = () => {
    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <div class="mb-8 shrink-0">
                <h3 class="font-black text-white flex items-center gap-3 text-lg uppercase italic tracking-tighter">
                    <i data-lucide="briefcase" class="w-6 h-6 text-blue-400"></i> 
                    Vos Affiliations Professionnelles
                </h3>
                <p class="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Gestion de votre carrière et de vos entreprises</p>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${state.myEnterprises.length === 0 ? `
                        <div class="col-span-full flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
                            <i data-lucide="ghost" class="w-16 h-16 mb-4"></i>
                            <div class="text-sm font-black uppercase tracking-[0.4em]">Aucune Affiliation</div>
                        </div>
                    ` : ''}
                    ${state.myEnterprises.map(ent => {
                        const isAutoEcole = ent.name === 'L.A. Auto School';
                        const mBalance = isAutoEcole ? state.gouvBank : (ent.balance || 0);
                        const isLeader = ent.myRank === 'leader' || ent.myRank === 'co_leader';

                        return `
                        <div class="glass-panel p-8 rounded-[32px] border border-white/5 hover:border-white/20 transition-all flex flex-col relative overflow-hidden shadow-2xl">
                            <div class="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div class="flex justify-between items-start mb-8 relative z-10">
                                <div class="flex items-center gap-4">
                                    <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black border border-blue-500/20 shadow-xl text-xl">
                                        ${ent.name[0]}
                                    </div>
                                    <div>
                                        <h4 class="font-black text-white text-xl uppercase italic tracking-tight">${ent.name}</h4>
                                        <div class="inline-flex px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-[9px] font-black uppercase tracking-[0.2em] border border-blue-500/30 mt-1">${ent.myRank}</div>
                                    </div>
                                </div>
                                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${ent.myStatus === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}">
                                    ${ent.myStatus === 'accepted' ? 'CONTRAT ACTIF' : 'ATTENTE SIGNAL'}
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 mb-10 relative z-10">
                                <div class="bg-black/40 p-4 rounded-2xl border border-white/5 text-center group hover:border-white/20 transition-colors">
                                    <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Articles</div>
                                    <div class="text-xl font-mono font-black text-white">${ent.items?.[0]?.count || 0}</div>
                                </div>
                                <div class="bg-black/40 p-4 rounded-2xl border border-white/5 text-center group hover:border-white/20 transition-colors">
                                    <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Trésorerie</div>
                                    <div class="text-xl font-mono font-black text-emerald-400">${isLeader ? '$' + mBalance.toLocaleString() : '---'}</div>
                                </div>
                            </div>

                            <div class="mt-auto flex gap-3 relative z-10">
                                ${ent.myStatus === 'accepted' ? `
                                    <button onclick="actions.openEnterpriseManagement('${ent.id}')" class="flex-1 glass-btn py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/20">
                                        <i data-lucide="settings" class="w-4 h-4"></i> ACCÉDER PANEL
                                    </button>
                                ` : `
                                    <button disabled class="flex-1 bg-white/5 py-4 rounded-2xl text-[10px] font-black text-gray-500 cursor-not-allowed border border-white/5 uppercase tracking-[0.3em]">DOSSIER EN COURS</button>
                                `}
                                <button onclick="actions.quitEnterprise('${ent.id}')" class="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 transition-all group/quit" title="Résilier Contrat">
                                    <i data-lucide="log-out" class="w-5 h-5 group-hover/quit:scale-110 transition-transform"></i>
                                </button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        </div>
    `;
};
