
import { state } from '../../state.js';

export const EnterpriseDirectoryView = () => {
    const ents = state.enterprises || [];
    
    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <div class="mb-8 shrink-0">
                <h3 class="font-black text-white flex items-center gap-3 text-lg uppercase italic tracking-tighter">
                    <i data-lucide="building" class="w-6 h-6 text-blue-400"></i> 
                    Annuaire Économique de Los Angeles
                </h3>
                <p class="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Registre officiel du Commerce et de l'Industrie</p>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${ents.length === 0 ? '<div class="col-span-full text-center text-gray-600 py-32 border-2 border-dashed border-white/5 rounded-[40px] uppercase font-black tracking-[0.4em] opacity-30">Zone Franche</div>' : ''}
                    ${ents.map(ent => {
                        const membership = state.myEnterprises.find(me => me.id === ent.id);
                        const isGov = ent.name === 'L.A. Auto School';
                        
                        return `
                        <div class="glass-panel p-8 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all flex flex-col group relative overflow-hidden shadow-xl">
                            ${isGov ? '<div class="absolute top-0 left-0 bg-blue-600 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-br-2xl z-20 shadow-xl border-b border-r border-white/10 tracking-widest">Gouvernemental</div>' : ''}
                            <div class="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"></div>
                            
                            <div class="flex justify-between items-start mb-8 relative z-10 ${isGov ? 'mt-6' : ''}">
                                <div class="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#1a1a1c] to-black border border-white/10 flex items-center justify-center text-blue-400 font-black text-2xl shadow-2xl group-hover:scale-110 group-hover:text-blue-300 transition-all">
                                    ${ent.name[0]}
                                </div>
                                <div class="text-right">
                                    <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest">Status</div>
                                    <div class="text-[10px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">Enregistrée</div>
                                </div>
                            </div>
                            
                            <h4 class="font-black text-white text-2xl mb-2 relative z-10 uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">${ent.name}</h4>
                            <div class="flex items-center gap-2 text-xs text-gray-500 mb-10 relative z-10 font-medium">
                                <i data-lucide="user" class="w-3.5 h-3.5 text-blue-500/50"></i> 
                                PDG: <span class="text-gray-300 font-black uppercase">${ent.leader ? `${ent.leader.first_name} ${ent.leader.last_name}` : 'Inconnu'}</span>
                            </div>

                            ${membership ? `
                                <button disabled class="mt-auto w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 text-gray-600 cursor-not-allowed border border-white/5 relative z-10 flex items-center justify-center gap-2">
                                    <i data-lucide="${membership.myStatus === 'pending' ? 'clock' : 'check'}" class="w-4 h-4"></i> 
                                    ${membership.myStatus === 'pending' ? 'DEMANDE EN COURS' : 'DÉJÀ AFFILIÉ'}
                                </button>
                            ` : `
                                <button onclick="actions.applyToEnterprise('${ent.id}')" class="mt-auto glass-btn-secondary w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all relative z-10 flex items-center justify-center gap-3">
                                    <i data-lucide="send" class="w-4 h-4"></i> DÉPOSER CANDIDATURE
                                </button>
                            `}
                        </div>
                    `}).join('')}
                </div>
            </div>
        </div>
    `;
};
