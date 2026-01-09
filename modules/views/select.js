
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { hasPermission, router } from '../utils.js';
import { ui } from '../ui.js';

export const CharacterSelectView = () => {
    const isFounder = state.user?.isFounder || state.adminIds.includes(state.user?.id);
    const wheelTurns = state.user?.whell_turn || 0;
    const notifyWheel = state.user?.isnotified_wheel === false;

    if (notifyWheel && wheelTurns > 0) {
        setTimeout(() => {
            ui.showToast(`Vous avez ${wheelTurns} tour(s) de roue disponible(s) !`, 'success');
            state.user.isnotified_wheel = true;
            state.supabase.from('profiles').update({ isnotified_wheel: true }).eq('id', state.user.id);
        }, 1000);
    }
    
    const charsHtml = state.characters.map(char => {
        const isAccepted = char.status === 'accepted';
        const isRejected = char.status === 'rejected';
        const isDeleting = !!char.deletion_requested_at;
        
        const statusClass = isDeleting ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 
                            isAccepted ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                            isRejected ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        
        const alignColor = char.alignment === 'illegal' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        const alignIcon = char.alignment === 'illegal' ? 'skull' : 'briefcase';
        const alignLabel = char.alignment === 'illegal' ? 'Criminel' : 'Civil';

        let actionHtml = '';
        
        if (isDeleting) {
            actionHtml = `
                <div class="flex flex-col gap-3">
                    <button disabled class="w-full py-4 rounded-2xl bg-white/5 text-gray-600 border border-white/5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                        <i data-lucide="lock" class="w-4 h-4"></i> Dossier Verrouillé
                    </button>
                    <button onclick="actions.cancelCharacterDeletion('${char.id}')" class="w-full py-4 rounded-2xl bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/30 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                        <i data-lucide="shield-check" class="w-4 h-4"></i> Annuler la purge
                    </button>
                </div>
            `;
        } else if (isRejected) {
            actionHtml = `
                <button onclick="actions.deleteCharacter('${char.id}')" class="w-full py-4 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                    <i data-lucide="trash-2" class="w-4 h-4"></i> Dossier Rejeté • Purger
                </button>
            `;
        } else {
            actionHtml = `
                <div class="flex gap-3">
                    <button 
                        ${isAccepted ? `onclick="actions.selectCharacter('${char.id}')"` : 'disabled'} 
                        class="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-2xl
                        ${isAccepted ? 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-blue-900/20' : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'}">
                        <i data-lucide="${isAccepted ? 'play' : 'lock'}" class="w-4 h-4 ${isAccepted ? 'fill-current' : ''}"></i> 
                        ${isAccepted ? 'Initialiser' : 'En attente'}
                    </button>
                    ${isAccepted ? `
                        <button onclick="actions.startEditCharacter('${char.id}')" class="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white border border-white/10 transition-all" title="Réviser le dossier">
                            <i data-lucide="edit-3" class="w-5 h-5"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }

        return `
            <div class="glass-panel group p-8 rounded-[48px] w-full md:w-[380px] relative overflow-hidden flex flex-col h-[460px] border border-white/5 hover:border-blue-500/30 transition-all duration-500 shadow-2xl bg-gradient-to-br from-[#0c0c0e] via-black to-black">
                <div class="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-all duration-700"></div>
                
                <div class="flex justify-between items-start mb-10 relative z-10">
                    <div class="w-20 h-20 rounded-[28px] bg-gradient-to-br from-gray-800 to-black border-2 border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                        <span class="text-3xl font-black text-gray-600 select-none">${char.first_name[0]}</span>
                    </div>
                    <div class="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${statusClass} shadow-lg italic ${isDeleting ? 'animate-pulse' : ''}">
                        ${isDeleting ? 'Purge en cours' : char.status}
                    </div>
                </div>

                <div class="relative z-10 mb-auto">
                    <h3 class="text-3xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter leading-none">${char.first_name}<br>${char.last_name}</h3>
                    <div class="flex items-center gap-4 mt-4">
                        <div class="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                            <i data-lucide="map-pin" class="w-3 h-3 text-gray-500"></i>
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${char.birth_place}</span>
                        </div>
                        <div class="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                            <i data-lucide="calendar" class="w-3 h-3 text-gray-500"></i>
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${char.age} Ans</span>
                        </div>
                    </div>
                </div>

                <div class="relative z-10 space-y-4 mb-8 pt-6 border-t border-white/5">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Secteur Social</span>
                        <span class="flex items-center gap-2 px-3 py-1 rounded-lg border ${alignColor} text-[10px] uppercase font-black italic tracking-wider">
                            <i data-lucide="${alignIcon}" class="w-3 h-3"></i> ${alignLabel}
                        </span>
                    </div>
                </div>

                <div class="relative z-10">
                    ${actionHtml}
                </div>
            </div>
        `;
    }).join('');

    const founderHtml = isFounder ? `
        <div class="glass-panel group p-8 rounded-[48px] w-full md:w-[380px] relative overflow-hidden flex flex-col h-[460px] border border-purple-500/30 hover:border-purple-500/60 transition-all duration-500 shadow-2xl bg-gradient-to-br from-purple-900/20 via-black to-black">
            <div class="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-all duration-700"></div>
            
            <div class="flex justify-between items-start mb-10 relative z-10">
                <div class="w-20 h-20 rounded-[28px] bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    <i data-lucide="shield-alert" class="w-10 h-10 text-purple-400"></i>
                </div>
                <div class="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-purple-500/40 text-purple-400 shadow-lg italic">
                    Accès Fondation
                </div>
            </div>

            <div class="relative z-10 mb-auto">
                <h3 class="text-3xl font-black text-white mb-2 group-hover:text-purple-400 transition-colors uppercase italic tracking-tighter leading-none">Administration<br>Système</h3>
                <div class="flex items-center gap-4 mt-4">
                    <div class="flex items-center gap-2 px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <i data-lucide="key" class="w-3 h-3 text-purple-400"></i>
                        <span class="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Console Bypass</span>
                    </div>
                </div>
            </div>

            <div class="relative z-10 space-y-4 mb-8 pt-6 border-t border-purple-500/20">
                <div class="flex justify-between items-center">
                    <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Niveau d'accréditation</span>
                    <span class="text-[10px] text-purple-400 font-black uppercase italic">Niveau 5</span>
                </div>
            </div>

            <div class="relative z-10">
                <button onclick="actions.openFoundationModal()" 
                    class="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-2xl bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/40 border border-purple-400/30">
                    <i data-lucide="zap" class="w-4 h-4 fill-current"></i> 
                    LANCER LE TERMINAL
                </button>
            </div>
        </div>
    ` : '';

    return `
        <div class="flex-1 flex flex-col p-8 animate-fade-in overflow-hidden relative h-full bg-[#050505]">
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(10,132,246,0.05),transparent_70%)] pointer-events-none"></div>
            
            <div class="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 z-10 px-6">
                <div>
                    <h2 class="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">Portail Citoyen</h2>
                    <p class="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Los Angeles Administration • Accès Sécurisé</p>
                </div>
                <div class="flex items-center gap-4">
                    ${wheelTurns > 0 ? `
                        <button onclick="actions.openWheel()" class="group relative px-6 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black text-xs uppercase tracking-widest flex items-center gap-3 animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                            <i data-lucide="sun" class="w-5 h-5"></i>
                            Roue de la Fortune (${wheelTurns})
                        </button>
                    ` : ''}
                    <button onclick="actions.setHubPanel('profile'); router('hub');" class="p-4 rounded-2xl bg-white/5 hover:bg-blue-600/10 text-gray-500 hover:text-blue-400 border border-white/10 transition-all group" title="Accéder au Profil">
                        <i data-lucide="user-circle" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                    </button>
                    ${Object.keys(state.user.permissions || {}).length > 0 && !isFounder ? `
                        <div class="px-6 py-2.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-[10px] font-black text-purple-400 uppercase tracking-widest italic shadow-xl">
                            <i data-lucide="shield" class="w-4 h-4 inline-block mr-2 -mt-0.5"></i> Accès Staff
                        </div>
                    ` : ''}
                    <button onclick="actions.confirmLogout()" class="p-4 rounded-2xl bg-white/5 hover:bg-red-600/10 text-gray-500 hover:text-red-500 border border-white/10 transition-all group">
                        <i data-lucide="log-out" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto pb-32 custom-scrollbar px-4">
                <div class="flex flex-wrap gap-10 justify-center items-center min-h-[50vh]">
                    ${founderHtml}
                    ${charsHtml}
                    ${state.characters.length < CONFIG.MAX_CHARS ? `
                        <button onclick="actions.goToCreate()" class="group w-full md:w-[380px] h-[460px] rounded-[48px] border-2 border-dashed border-white/10 hover:border-blue-500/40 hover:bg-blue-500/[0.02] flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden">
                            <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.03),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div class="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all border border-white/5 group-hover:border-blue-400 shadow-2xl">
                                <i data-lucide="plus" class="w-10 h-10"></i>
                            </div>
                            <span class="text-white text-xl font-black uppercase italic tracking-tight">Nouveau Dossier</span>
                            <span class="text-[10px] text-gray-600 mt-2 uppercase font-black tracking-[0.3em]">Slot Libre : ${state.characters.length} / ${CONFIG.MAX_CHARS}</span>
                        </button>
                    ` : `
                        <div class="group w-full md:w-[380px] h-[460px] rounded-[48px] border-2 border-dashed border-yellow-500/10 flex flex-col items-center justify-center relative overflow-hidden opacity-60">
                            <div class="w-24 h-24 rounded-3xl bg-yellow-500/5 flex items-center justify-center mb-8 border border-yellow-500/10">
                                <i data-lucide="lock" class="w-10 h-10 text-yellow-600"></i>
                            </div>
                            <span class="text-yellow-600 text-xl font-black uppercase italic tracking-tight">Slots Saturés</span>
                            <p class="text-[9px] text-gray-700 mt-4 uppercase font-black tracking-widest max-w-[200px] text-center">Contactez le Support pour obtenir un slot additionnel</p>
                        </div>
                    `}
                </div>
            </div>

            <div class="fixed bottom-10 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
                 <div class="text-[9px] font-black uppercase tracking-[0.6em] text-gray-500">TFRP Operating System • v4.5.1</div>
            </div>
        </div>
    `;
};
