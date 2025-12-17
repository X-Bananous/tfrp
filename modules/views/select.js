
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { hasPermission, router } from '../utils.js';
import { ui } from '../ui.js';

export const CharacterSelectView = () => {
    const charsHtml = state.characters.map(char => {
        const isAccepted = char.status === 'accepted';
        const isRejected = char.status === 'rejected';
        
        const statusColor = isAccepted ? 'text-emerald-400 bg-emerald-500/10' : 
                            isRejected ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';
        const statusIcon = isAccepted ? 'check-circle' : isRejected ? 'x-circle' : 'clock';

        const alignColor = char.alignment === 'illegal' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        const alignIcon = char.alignment === 'illegal' ? 'skull' : 'briefcase';
        const alignLabel = char.alignment === 'illegal' ? 'Criminel' : 'Civil';

        let btnHtml = '';
        
        if (isRejected) {
            btnHtml = `
                <button onclick="actions.deleteCharacter('${char.id}')" class="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg">
                    <i data-lucide="trash-2" class="w-4 h-4"></i> Supprimer / Recommencer
                </button>
            `;
        } else {
            const btnClass = isAccepted ? 'glass-btn flex-1' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5 w-full';
            const btnText = isAccepted ? 'Jouer' : 'Dossier en cours';

            btnHtml = `
                <div class="flex gap-2">
                    <button 
                        ${isAccepted ? `onclick="actions.selectCharacter('${char.id}')"` : 'disabled'} 
                        class="${btnClass} py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                        <i data-lucide="${isAccepted ? 'play' : 'lock'}" class="w-4 h-4 ${isAccepted ? 'fill-current' : ''}"></i> 
                        ${btnText}
                    </button>
                    ${isAccepted ? `
                        <button onclick="actions.startEditCharacter('${char.id}')" class="glass-btn-secondary px-3 rounded-xl hover:bg-white/10" title="Modifier">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }

        return `
            <div class="glass-card group p-6 rounded-[30px] w-full md:w-[340px] relative overflow-hidden flex flex-col h-[380px] hover:border-blue-500/30 transition-all">
                <div class="absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusColor} border border-white/5">
                    <i data-lucide="${statusIcon}" class="w-3 h-3"></i>
                    ${char.status}
                </div>

                <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 mb-6 flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-500">
                    <span class="text-2xl font-bold text-gray-500">${char.first_name[0]}</span>
                </div>

                <h3 class="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">${char.first_name} ${char.last_name}</h3>
                <p class="text-gray-400 text-sm mb-6 flex items-center gap-2">
                    <i data-lucide="map-pin" class="w-3 h-3"></i> ${char.birth_place}
                </p>

                <div class="space-y-3 mt-auto">
                    <div class="flex justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold px-1">
                        <span>Âge</span>
                        <span class="text-gray-300">${char.age} Ans</span>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold px-1 border-t border-white/5 pt-3 items-center">
                        <span>Alignement</span>
                        <span class="flex items-center gap-1 px-2 py-0.5 rounded border ${alignColor} text-[10px] uppercase font-bold">
                            <i data-lucide="${alignIcon}" class="w-3 h-3"></i> ${alignLabel}
                        </span>
                    </div>
                </div>

                <div class="mt-6">
                    ${btnHtml}
                </div>
            </div>
        `;
    }).join('');

    // Request Slot Modal Logic
    window.openSlotRequest = () => {
        ui.showModal({
            title: "Demande de Slot",
            content: "Pour obtenir un 2ème, 3ème ou 4ème personnage, vous devez ouvrir un ticket 'Support' sur le Discord.",
            confirmText: "Ouvrir Discord",
            cancelText: "Fermer",
            onConfirm: () => window.open(CONFIG.INVITE_URL, '_blank')
        });
    };

    return `
        <div class="flex-1 flex flex-col p-8 animate-fade-in overflow-hidden relative h-full">
            <div class="flex justify-between items-center mb-10 z-10 px-4">
                <div>
                    <h2 class="text-3xl font-bold text-white tracking-tight">Mes Citoyens</h2>
                    <p class="text-gray-400 text-sm mt-1">Gérez vos identités pour le serveur Roblox ERLC.</p>
                </div>
                <div class="flex items-center gap-4">
                        ${Object.keys(state.user.permissions || {}).length > 0 ? `
                        <div class="px-4 py-2 badge-staff rounded-xl text-xs font-bold flex items-center gap-2">
                            <i data-lucide="shield" class="w-4 h-4"></i> Staff
                        </div>
                    ` : ''}
                    <button onclick="actions.confirmLogout()" class="glass-btn-secondary p-3 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer">
                        <i data-lucide="log-out" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                <div class="flex flex-wrap gap-8 justify-center items-center min-h-[50vh]">
                    ${charsHtml}
                    ${state.characters.length < CONFIG.MAX_CHARS ? `
                        <button onclick="actions.goToCreate()" class="group w-full md:w-[340px] h-[380px] rounded-[30px] border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 flex flex-col items-center justify-center transition-all cursor-pointer">
                            <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                                <i data-lucide="plus" class="w-8 h-8 text-gray-400 group-hover:text-blue-400"></i>
                            </div>
                            <span class="text-gray-300 font-semibold group-hover:text-white">Créer un citoyen</span>
                            <span class="text-xs text-gray-600 mt-1 uppercase tracking-widest">Slot Disponible (${state.characters.length}/${CONFIG.MAX_CHARS})</span>
                        </button>
                    ` : `
                        <button onclick="window.openSlotRequest()" class="group w-full md:w-[340px] h-[380px] rounded-[30px] border-2 border-dashed border-yellow-500/20 hover:border-yellow-500/50 hover:bg-yellow-500/5 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden">
                            <div class="absolute inset-0 bg-yellow-500/5 animate-pulse"></div>
                            <div class="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-yellow-500/20 transition-all relative z-10">
                                <i data-lucide="lock" class="w-8 h-8 text-yellow-500"></i>
                            </div>
                            <span class="text-yellow-200 font-bold group-hover:text-yellow-100 relative z-10">Slot Supplémentaire</span>
                            <span class="text-xs text-yellow-500/60 mt-2 uppercase tracking-widest relative z-10 px-6 text-center">Faire une demande au staff</span>
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
};
