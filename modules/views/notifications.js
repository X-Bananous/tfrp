import { state } from '../state.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-900/10 border-b border-blue-500/10 gap-3 shrink-0 z-20 relative">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">Message System</span> • Los Angeles Center</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser
        </button>
    </div>
`;

export const NotificationsView = () => {
    const notifs = state.notifications || [];

    return `
    <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
        ${refreshBanner}
        
        <div class="px-6 pb-4 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 shrink-0 relative z-10 bg-[#050505]">
            <div>
                <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                    <i data-lucide="bell" class="w-6 h-6 text-blue-500"></i>
                    Centre de Notifications
                </h2>
                <p class="text-gray-400 text-sm">Actualités et programmations du serveur</p>
            </div>
        </div>

        <div class="flex-1 p-6 overflow-hidden relative min-h-0">
            <div class="h-full overflow-y-auto custom-scrollbar pr-2 max-w-4xl mx-auto space-y-4">
                ${notifs.length === 0 ? `
                    <div class="flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <i data-lucide="bell-off" class="w-20 h-20 mb-4"></i>
                        <p class="text-xl font-bold">Aucune notification</p>
                        <p class="text-sm">Vous êtes à jour avec le système.</p>
                    </div>
                ` : notifs.map(n => {
                    let icon = 'info';
                    let iconColor = 'text-blue-400';
                    let bgColor = 'bg-white/5';
                    let borderColor = 'border-white/5';

                    if (n.type === 'maintenance') {
                        icon = 'wrench';
                        iconColor = 'text-orange-400';
                        borderColor = 'border-orange-500/20';
                        bgColor = 'bg-orange-950/5';
                    } else if (n.type === 'warning') {
                        icon = 'alert-triangle';
                        iconColor = 'text-red-400';
                        borderColor = 'border-red-500/20';
                    }

                    return `
                        <div class="glass-panel p-5 rounded-2xl border ${borderColor} ${bgColor} relative group transition-all hover:border-white/20 ${n.is_pinned ? 'ring-1 ring-blue-500/30' : ''}">
                            <div class="flex gap-4">
                                <div class="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center ${iconColor} shrink-0 border border-white/5 shadow-inner">
                                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex justify-between items-start mb-2 gap-4">
                                        <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <h3 class="font-bold text-white text-lg leading-tight">${n.title}</h3>
                                            ${n.is_pinned ? `
                                                <span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest border border-blue-500/30 flex items-center gap-1 w-fit">
                                                    <i data-lucide="pin" class="w-2.5 h-2.5"></i> Épinglé
                                                </span>
                                            ` : ''}
                                        </div>
                                        <span class="text-[10px] text-gray-500 font-mono whitespace-nowrap pt-1.5">${new Date(n.created_at).toLocaleString()}</span>
                                    </div>
                                    <p class="text-gray-300 text-sm leading-relaxed">${n.message}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <div class="pt-10 pb-6 text-center text-[10px] text-gray-600 uppercase tracking-[0.3em] font-bold">
                    Fin du flux de données
                </div>
            </div>
        </div>
    </div>
    `;
};