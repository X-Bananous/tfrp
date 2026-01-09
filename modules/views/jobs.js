
import { state } from '../state.js';
import { CONFIG } from '../config.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-900/10 border-b border-blue-500/10 gap-3 shrink-0 relative z-20">
        <div class="text-[10px] text-blue-200 flex items-center gap-2 font-black uppercase tracking-[0.2em]">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span>Terminal d'Emploi • Flux de Recrutement Certifié</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser Offres
        </button>
    </div>
`;

export const JobCenterView = () => {
    const ents = state.enterprises || [];

    const jobCard = (title, category, icon, description, recruitType, color = 'blue') => {
        let badgeColor = '';
        let badgeText = '';
        
        switch(recruitType) {
            case 'discord': 
                badgeColor = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
                badgeText = 'Postuler sur Discord';
                break;
            case 'free':
                badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                badgeText = 'Accès Libre / Panel';
                break;
            case 'election':
                badgeColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                badgeText = 'Élections Discord';
                break;
            case 'appointment':
                badgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                badgeText = 'Nomination Officielle';
                break;
            case 'complex':
                badgeColor = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                badgeText = 'Discord + Panel';
                break;
        }

        return `
            <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-white/[0.01] hover:border-${color}-500/30 transition-all group relative overflow-hidden shadow-xl">
                <div class="absolute -right-10 -top-10 w-32 h-32 bg-${color}-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-${color}-500/10 transition-all duration-700"></div>
                
                <div class="flex justify-between items-start mb-6 relative z-10">
                    <div class="w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 border border-${color}-500/20 group-hover:scale-110 transition-transform shadow-lg">
                        <i data-lucide="${icon}" class="w-6 h-6"></i>
                    </div>
                    <span class="text-[9px] font-black text-gray-600 uppercase tracking-widest">${category}</span>
                </div>

                <h4 class="text-xl font-black text-white mb-2 uppercase italic tracking-tight group-hover:text-${color}-400 transition-colors">${title}</h4>
                <p class="text-xs text-gray-500 leading-relaxed mb-6 font-medium line-clamp-3">${description}</p>
                
                <div class="mt-auto pt-4 border-t border-white/5">
                    <div class="px-3 py-1.5 rounded-xl border ${badgeColor} text-[10px] font-black uppercase tracking-widest text-center shadow-lg">
                        ${badgeText}
                    </div>
                </div>
            </div>
        `;
    };

    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            <!-- Header Block Standardisé -->
            <div class="flex flex-col shrink-0">
                ${refreshBanner}
                
                <div class="px-8 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative">
                    <div>
                        <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                            <i data-lucide="briefcase" class="w-8 h-8 text-blue-500"></i>
                            Pôle Emploi L.A.
                        </h2>
                        <div class="flex items-center gap-3 mt-1">
                             <span class="text-[10px] text-blue-500/60 font-black uppercase tracking-widest">Service Municipal de l'Emploi</span>
                             <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                             <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Opportunités de Carrière</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <div class="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex items-center gap-4 shadow-xl">
                            <div class="text-[9px] text-gray-500 font-black uppercase tracking-widest">Postes Ouverts</div>
                            <div class="text-xl font-mono font-black text-white">${ents.length + 8}</div>
                            <i data-lucide="trending-up" class="w-4 h-4 text-emerald-500"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Area Scrollable -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div class="max-w-7xl mx-auto space-y-16 pb-20">
                    
                    <!-- PUBLIC SERVICES SECTION -->
                    <div class="space-y-6">
                        <h3 class="text-xs font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-4 px-2">
                            <span class="w-8 h-px bg-blue-500/30"></span> SERVICES PUBLICS & SÉCURITÉ
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            ${jobCard('L.A.P.D.', 'Sécurité', 'shield-check', 'Rejoignez les forces de police de la ville. Assurez l\'ordre et la protection des citoyens.', 'discord', 'blue')}
                            ${jobCard('L.A.S.D.', 'Sécurité', 'shield', 'Le bureau du Shérif recrute pour les zones péri-urbaines. Patrouillez les comtés.', 'discord', 'blue')}
                            ${jobCard('L.A.F.D.', 'Urgence', 'flame', 'Pompiers et secours médicaux. Sauvez des vies lors d\'incidents majeurs.', 'free', 'red')}
                            ${jobCard('L.A.D.O.T.', 'Technique', 'truck', 'Département des transports. Remorquage et gestion de la voirie publique.', 'free', 'yellow')}
                        </div>
                    </div>

                    <!-- JUSTICE & POLITIQUE SECTION -->
                    <div class="space-y-6">
                        <h3 class="text-xs font-black text-purple-400 uppercase tracking-[0.4em] flex items-center gap-4 px-2">
                            <span class="w-8 h-px bg-purple-500/30"></span> JUSTICE & GOUVERNEMENT
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            ${jobCard('Maire', 'Politique', 'landmark', 'Gérez la ville, les taxes et les décrets. Poste soumis à des élections périodiques.', 'election', 'emerald')}
                            ${jobCard('Adjoint', 'Politique', 'users', 'Épaulez le Maire dans ses décisions et la gestion du cabinet municipal.', 'appointment', 'emerald')}
                            ${jobCard('Procureur', 'Justice', 'scale', 'Représentez l\'intérêt public. Dirigez les poursuites judiciaires contre les criminels.', 'discord', 'purple')}
                            ${jobCard('Juge', 'Justice', 'gavel', 'Arbitrez les litiges et prononcez les sentences au Palais de Justice.', 'discord', 'purple')}
                        </div>
                    </div>

                    <!-- PRIVATE SECTOR / ENTERPRISES -->
                    <div class="space-y-6">
                        <div class="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
                            <h3 class="text-xs font-black text-orange-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                <span class="w-8 h-px bg-orange-500/30"></span> CORPORATIONS PRIVÉES & AVOCATS
                            </h3>
                            <a href="${CONFIG.INVITE_URL}" target="_blank" class="text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest border-b border-gray-800 pb-1 flex items-center gap-2 transition-all">
                                <i data-lucide="plus-circle" class="w-3 h-3"></i> Fonder une entreprise sur Discord
                            </a>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- SPECIAL CASE: AVOCAT -->
                            <div class="glass-panel p-8 rounded-[40px] border border-orange-500/20 bg-orange-500/[0.02] flex flex-col group relative overflow-hidden shadow-xl">
                                <div class="absolute -right-10 -top-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/20 transition-all duration-700"></div>
                                <div class="flex justify-between items-start mb-8 relative z-10">
                                    <div class="w-16 h-16 rounded-[24px] bg-black/40 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-2xl group-hover:scale-110 transition-all">
                                        <i data-lucide="scroll" class="w-8 h-8"></i>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-[9px] text-gray-500 font-black uppercase tracking-widest">Secteur</div>
                                        <div class="text-[10px] text-orange-400 font-black uppercase tracking-widest">Droit Privé</div>
                                    </div>
                                </div>
                                <h4 class="text-2xl font-black text-white mb-3 uppercase italic tracking-tight">Avocat Indépendant</h4>
                                <p class="text-sm text-gray-500 leading-relaxed mb-8">Défendez les citoyens. Nécessite la création d'un cabinet (Discord), une licence du Barreau et la réussite de l'examen.</p>
                                <div class="mt-auto bg-orange-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center border border-orange-400 shadow-xl shadow-orange-950/20">
                                    BARREAU TFRP REQUIS
                                </div>
                            </div>

                            <!-- LIST DYNAMIC ENTERPRISES -->
                            ${ents.filter(e => e.name !== "L.A. Auto School").map(ent => `
                                <div class="glass-panel p-8 rounded-[40px] border border-white/5 hover:border-blue-500/30 transition-all group flex flex-col relative overflow-hidden shadow-xl bg-[#0a0a0a]">
                                    <div class="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all"></div>
                                    <div class="flex justify-between items-start mb-8 relative z-10">
                                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a1a1c] to-black border border-white/10 flex items-center justify-center text-blue-400 font-black text-xl shadow-2xl group-hover:scale-110 group-hover:text-blue-300 transition-all">
                                            ${ent.name[0]}
                                        </div>
                                        <div class="text-right">
                                            <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest">Société</div>
                                            <div class="text-[10px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">Recrutement</div>
                                        </div>
                                    </div>
                                    <h4 class="text-2xl font-black text-white mb-2 uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">${ent.name}</h4>
                                    <p class="text-xs text-gray-500 mb-8 flex-1 italic line-clamp-3">"Entreprise privée enregistrée. Postulez via le panel et confirmez sur le Discord de la société."</p>
                                    <button onclick="actions.setHubPanel('enterprise'); setTimeout(() => actions.setEnterpriseTab('directory'), 100);" class="mt-auto glass-btn-secondary w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all">
                                        VOIR FICHE RECRUTEMENT
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="pt-20 pb-10 text-center opacity-30">
                    <div class="text-[9px] font-black uppercase tracking-[0.6em] text-gray-500">Service Municipal de l'Emploi • Los Angeles Division</div>
                </div>
            </div>
        </div>
    `;
};
