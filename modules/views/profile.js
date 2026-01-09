import { state } from '../state.js';

export const ProfileView = () => {
    const u = state.user;
    const deletionDate = u.deletion_requested_at ? new Date(u.deletion_requested_at) : null;
    const isDeleting = !!deletionDate;
    
    let timeRemainingStr = "";
    if (isDeleting) {
        const expiry = new Date(deletionDate.getTime() + (3 * 24 * 60 * 60 * 1000));
        const now = new Date();
        const diff = expiry - now;
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeRemainingStr = `${days}j ${hours}h`;
        } else {
            timeRemainingStr = "Imminente";
        }
    }

    const perms = u.permissions || {};
    const permKeys = Object.keys(perms).filter(k => perms[k] === true);

    const charactersHtml = state.characters.map(char => {
        const charDelDate = char.deletion_requested_at ? new Date(char.deletion_requested_at) : null;
        const isCharDeleting = !!charDelDate;
        let charTimeRemaining = "";
        if (isCharDeleting) {
            const expiry = new Date(charDelDate.getTime() + (3 * 24 * 60 * 60 * 1000));
            const diff = expiry - now;
            if (diff > 0) {
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                charTimeRemaining = `${d}j ${h}h`;
            } else {
                charTimeRemaining = "Imminente";
            }
        }

        return `
            <div class="bg-black/40 border ${isCharDeleting ? 'border-orange-500/30 bg-orange-500/[0.02]' : 'border-white/5'} p-6 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-white/20 transition-all">
                <div class="flex items-center gap-5">
                    <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 font-black border border-white/10 text-xl shadow-xl">
                        ${char.first_name[0]}
                    </div>
                    <div>
                        <div class="font-black text-white text-lg uppercase italic tracking-tight">${char.first_name} ${char.last_name}</div>
                        <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Niveau d'accès : Citoyen Validé</div>
                    </div>
                </div>
                
                <div class="flex items-center gap-4 w-full md:w-auto">
                    ${isCharDeleting ? `
                        <div class="flex-1 md:text-right">
                            <div class="text-[8px] text-orange-400 font-black uppercase tracking-widest mb-1">Purge programmée</div>
                            <div class="text-sm font-mono font-bold text-white">${charTimeRemaining}</div>
                        </div>
                        <button onclick="actions.cancelCharacterDeletion('${char.id}')" class="px-6 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Annuler</button>
                    ` : `
                        <button onclick="actions.requestCharacterDeletion('${char.id}')" class="w-full md:w-auto px-6 py-2.5 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Purger le dossier</button>
                    `}
                </div>
            </div>
        `;
    }).join('');

    const sanctionsHtml = state.userSanctions.length > 0 ? state.userSanctions.map(s => {
        const typeColor = s.type === 'warn' ? 'yellow' : s.type === 'mute' ? 'orange' : 'red';
        const hasAppealed = !!s.appeal_at;
        
        return `
            <div class="p-6 bg-black/40 border border-${typeColor}-500/20 rounded-[32px] group relative overflow-hidden transition-all hover:border-${typeColor}-500/40">
                <div class="absolute top-0 left-0 w-1 h-full bg-${typeColor}-500"></div>
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-${typeColor}-500/10 flex items-center justify-center text-${typeColor}-400 border border-${typeColor}-500/20">
                            <i data-lucide="${s.type === 'ban' ? 'shield-off' : s.type === 'mute' ? 'mic-off' : 'alert-triangle'}" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="font-black text-white text-base uppercase italic tracking-tight">${s.type.toUpperCase()}</div>
                            <div class="text-[9px] text-gray-500 font-mono mt-0.5">${new Date(s.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="text-right">
                         ${hasAppealed ? '<span class="text-[8px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-black uppercase border border-blue-500/20 shadow-lg">Appel déposé</span>' : ''}
                    </div>
                </div>
                <div class="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-gray-400 italic mb-4 font-medium leading-relaxed">"${s.reason}"</div>
                ${!hasAppealed ? `
                    <button onclick="actions.openAppealModal('${s.id}')" class="w-full py-2.5 rounded-xl bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white hover:text-black transition-all">Déposer une contestation (1/an)</button>
                ` : `
                    <div class="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
                         <div class="text-[8px] text-blue-400 uppercase font-black mb-1">Votre Argumentaire</div>
                         <p class="text-[11px] text-gray-300 italic">"${s.appeal_text}"</p>
                    </div>
                `}
            </div>
        `;
    }).join('') : '<div class="p-12 text-center text-gray-700 italic border-2 border-dashed border-white/5 rounded-[40px] uppercase font-black tracking-widest text-[10px] opacity-40">Registre de sanctions vierge</div>';

    return `
    <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
        <div class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>
        
        <div class="px-8 pb-4 pt-8 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10 shrink-0">
            <div>
                <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <i data-lucide="user-circle" class="w-8 h-8 text-blue-500"></i>
                    Profil Citoyen
                </h2>
                <div class="flex items-center gap-3 mt-1">
                     <span class="text-[10px] text-blue-500/60 font-black uppercase tracking-widest">Identité Numérique TFRP</span>
                     <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                     <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Accès Certifié</span>
                </div>
            </div>
            <div class="bg-white/5 border border-white/5 px-6 py-2 rounded-2xl flex items-center gap-4 shadow-xl">
                <div class="text-[9px] text-gray-500 font-black uppercase tracking-widest">Ancienneté Système</div>
                <div class="text-xl font-mono font-black text-white">GEN-4</div>
                <i data-lucide="cpu" class="w-4 h-4 text-blue-500"></i>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
            <div class="max-w-4xl mx-auto space-y-12 pb-20">
                
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div class="lg:col-span-5 glass-panel p-10 rounded-[48px] border border-white/5 bg-[#0a0a0c] flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                        <div class="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div class="relative mb-8">
                            <div class="w-40 h-40 rounded-full p-1.5 border-4 border-white/10 bg-black relative z-10 shadow-[0_0_50px_rgba(59,130,246,0.15)] group-hover:scale-105 transition-transform duration-700">
                                <img src="${u.avatar}" class="w-full h-full rounded-full object-cover">
                            </div>
                            ${u.avatar_decoration ? `<img src="${u.avatar_decoration}" class="absolute top-1/2 left-1/2 w-[125%] h-[125%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style="max-width:none">` : ''}
                            <div class="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#050505] border-4 border-blue-500 flex items-center justify-center text-blue-500 z-30 shadow-2xl">
                                <i data-lucide="verified" class="w-5 h-5"></i>
                            </div>
                        </div>
                        <h3 class="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-blue-400 transition-colors">${u.username}</h3>
                        <p class="text-xs text-gray-600 font-mono tracking-widest mb-8">UID : ${u.id}</p>
                        
                        <div class="flex flex-wrap justify-center gap-2">
                            ${u.isFounder ? `<span class="px-4 py-1.5 rounded-xl bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest border border-yellow-500/20 italic">Fondation</span>` : ''}
                            <span class="px-4 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 italic">Citoyen</span>
                        </div>
                    </div>

                    <div class="lg:col-span-7 space-y-6">
                        <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] h-full flex flex-col">
                            <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                <i data-lucide="shield-check" class="w-4 h-4"></i> Accréditations & Droits
                            </h4>
                            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-64">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    ${permKeys.length > 0 ? permKeys.map(key => `
                                        <div class="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group hover:border-blue-500/30 transition-all">
                                            <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><i data-lucide="check" class="w-4 h-4"></i></div>
                                            <span class="text-xs font-bold text-gray-300 uppercase tracking-wide truncate">${key.replace('can_', '').replace(/_/g, ' ')}</span>
                                        </div>
                                    `).join('') : `
                                        <div class="col-span-full py-12 text-center text-gray-700 italic border-2 border-dashed border-white/5 rounded-3xl">
                                            <p class="text-xs font-black uppercase tracking-widest">Aucune permission spéciale</p>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SANCTIONS SECTION -->
                <div class="space-y-6">
                    <h3 class="text-xs font-black text-red-500 uppercase tracking-[0.4em] flex items-center gap-4 px-2">
                        <span class="w-8 h-px bg-red-500/30"></span> Registre Disciplinaire
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${sanctionsHtml}
                    </div>
                </div>

                <!-- CHARACTER MANAGEMENT SECTION -->
                <div class="space-y-6">
                    <h3 class="text-xs font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-4 px-2">
                        <span class="w-8 h-px bg-blue-500/30"></span> Registre des Identités
                    </h3>
                    <div class="grid grid-cols-1 gap-4">
                        ${charactersHtml}
                    </div>
                </div>

                <div class="glass-panel p-10 rounded-[48px] border ${isDeleting ? 'border-orange-500/40 bg-orange-950/10 shadow-orange-900/10' : 'border-red-500/10 bg-red-950/[0.02]'} relative overflow-hidden transition-all duration-700">
                    <div class="absolute top-0 right-0 w-64 h-64 ${isDeleting ? 'bg-orange-500/5' : 'bg-red-500/5'} rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <div class="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
                        <div class="text-center md:text-left flex-1">
                            <h4 class="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 flex items-center gap-4 justify-center md:justify-start">
                                <i data-lucide="${isDeleting ? 'shield-alert' : 'fingerprint'}" class="w-8 h-8 ${isDeleting ? 'text-orange-500' : 'text-red-500'}"></i>
                                Sécurité des Données & Droit à l'Oubli
                            </h4>
                            <p class="text-gray-400 text-sm leading-relaxed max-w-xl font-medium">
                                Conformément aux directives RGPD, vous disposez d'un contrôle total sur vos informations. La suppression de compte efface l'intégralité de vos personnages, inventaires et actifs bancaires de façon irréversible.
                            </p>
                        </div>
                        
                        <div class="shrink-0 w-full md:w-auto">
                            ${isDeleting ? `
                                <div class="bg-black/60 p-8 rounded-[32px] border border-orange-500/30 text-center shadow-2xl animate-pulse">
                                    <div class="text-[10px] text-orange-400 font-black uppercase tracking-[0.2em] mb-2">Compte en phase de purge</div>
                                    <div class="text-4xl font-mono font-black text-white tracking-tighter mb-4">${timeRemainingStr}</div>
                                    <button onclick="actions.cancelDataDeletion()" class="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-white/10">INTERROMPRE LA SUPPRESSION</button>
                                </div>
                            ` : `
                                <button onclick="actions.requestDataDeletion()" class="w-full md:w-auto px-10 py-5 rounded-[24px] bg-red-600/10 border border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-900/20 group">
                                    DÉTRUIRE TOUTES MES DONNÉES <i data-lucide="trash-2" class="w-4 h-4 inline-block ml-2 group-hover:rotate-12 transition-transform"></i>
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};