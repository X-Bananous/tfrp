
import { state } from '../state.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-500/5 border-b border-blue-500/10 gap-3 shrink-0 relative z-20">
        <div class="text-[10px] text-blue-200 flex items-center gap-2 font-black uppercase tracking-[0.2em]">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span>Terminal Message • Flux en direct</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Sync. Terminal
        </button>
    </div>
`;

export const NotificationsView = () => {
    const notifs = state.notifications || [];
    const hasPersonalNotifs = notifs.some(n => n.user_id === state.user?.id);

    return `
    <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
        ${refreshBanner}
        
        <div class="px-8 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative z-10 shrink-0">
            <div>
                <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                    <i data-lucide="bell" class="w-8 h-8 text-blue-500"></i>
                    Centre de Notifications
                </h2>
                <div class="flex items-center gap-3 mt-1">
                     <span class="text-[10px] text-blue-500/60 font-black uppercase tracking-widest">Communications Système v4.5</span>
                     <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                     <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">${notifs.length} Signalement(s)</span>
                </div>
            </div>
            
            ${hasPersonalNotifs ? `
                <button onclick="actions.clearNotifications()" class="px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-red-600 hover:border-red-500 transition-all flex items-center gap-3 group shadow-xl">
                    <i data-lucide="trash-2" class="w-4 h-4 group-hover:scale-110 transition-transform"></i>
                    Purge Terminal
                </button>
            ` : ''}
        </div>

        <div class="flex-1 p-8 overflow-hidden relative min-h-0">
            <div class="h-full overflow-y-auto custom-scrollbar pr-2 max-w-5xl mx-auto space-y-6 pb-20">
                ${notifs.length === 0 ? `
                    <div class="flex flex-col items-center justify-center py-40 text-center opacity-30">
                        <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                            <i data-lucide="bell-off" class="w-12 h-12 text-gray-500"></i>
                        </div>
                        <p class="text-xl font-black uppercase tracking-[0.4em] text-gray-400">Signal Inactif</p>
                        <p class="text-xs font-bold uppercase tracking-widest text-gray-600 mt-2">Le flux de données est actuellement vide.</p>
                    </div>
                ` : notifs.map(n => {
                    let icon = 'info';
                    let iconColor = 'text-blue-400';
                    let bgColor = 'bg-white/[0.01]';
                    let borderColor = 'border-white/5';
                    let leftBarColor = 'bg-blue-500/50';
                    const isPersonal = n.user_id === state.user?.id;

                    if (n.type === 'maintenance') {
                        icon = 'wrench';
                        iconColor = 'text-orange-400';
                        borderColor = 'border-orange-500/20';
                        bgColor = 'bg-orange-500/[0.02]';
                        leftBarColor = 'bg-orange-500';
                    } else if (n.type === 'warning') {
                        icon = 'alert-triangle';
                        iconColor = 'text-red-400';
                        borderColor = 'border-red-500/20';
                        bgColor = 'bg-red-500/[0.02]';
                        leftBarColor = 'bg-red-500';
                    }

                    return `
                        <div class="glass-panel p-6 rounded-[32px] border ${borderColor} ${bgColor} relative group transition-all hover:border-white/20 hover:scale-[1.01] shadow-2xl overflow-hidden">
                            <div class="absolute top-0 left-0 w-1.5 h-full ${leftBarColor}"></div>
                            <div class="absolute -right-10 -top-10 w-32 h-32 ${iconColor.replace('text', 'bg')}/5 rounded-full blur-3xl pointer-events-none"></div>
                            
                            <div class="flex gap-6 relative z-10">
                                <div class="w-14 h-14 rounded-2xl bg-black/60 flex items-center justify-center ${iconColor} shrink-0 border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                                    <i data-lucide="${icon}" class="w-7 h-7"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex justify-between items-start mb-2 gap-6">
                                        <div class="min-w-0">
                                            <div class="flex items-center gap-3 flex-wrap">
                                                <h3 class="font-black text-white text-xl leading-tight uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">${n.title}</h3>
                                                ${n.is_pinned ? `
                                                    <span class="px-2.5 py-0.5 rounded-lg bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest border border-blue-400 shadow-lg flex items-center gap-1.5 shrink-0">
                                                        <i data-lucide="pin" class="w-2.5 h-2.5"></i> Prioritaire
                                                    </span>
                                                ` : ''}
                                            </div>
                                            <div class="text-[9px] text-gray-600 font-mono mt-1 uppercase font-bold tracking-widest">${new Date(n.created_at).toLocaleString()}</div>
                                        </div>
                                        
                                        ${isPersonal ? `
                                            <button onclick="actions.deleteNotification('${n.id}')" class="p-2.5 rounded-xl text-gray-700 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100" title="Effacer du registre">
                                                <i data-lucide="x" class="w-5 h-5"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                    <p class="text-gray-400 text-sm leading-relaxed font-medium italic">"${n.message}"</p>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <div class="pt-20 pb-10 text-center">
                    <div class="text-[9px] font-black uppercase tracking-[0.6em] text-gray-700 opacity-50">Séquence de transmission terminée</div>
                </div>
            </div>
        </div>
    </div>
    `;
};
