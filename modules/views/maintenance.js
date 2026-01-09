import { state } from '../state.js';

export const MaintenanceView = () => {
    const endTime = state.maintenance.endTime ? new Date(state.maintenance.endTime) : null;
    let timeDisplay = '';
    
    if (endTime) {
        const now = new Date();
        if(endTime > now) {
            const diff = endTime - now;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            timeDisplay = `${h}h ${m}m ${s}s`;
        } else {
            timeDisplay = "Finalisation...";
        }
    }

    return `
    <div class="flex items-center justify-center h-full w-full bg-[#050505] relative overflow-hidden animate-fade-in">
        <!-- Subtle Background Elements -->
        <div class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>
        <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="relative z-10 max-w-lg w-full p-8 text-center">
            <div class="glass-panel p-10 rounded-3xl border border-white/5 shadow-2xl flex flex-col items-center">
                
                <div class="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20">
                    <i data-lucide="wrench" class="w-8 h-8 text-blue-400"></i>
                </div>

                <h1 class="text-3xl font-bold text-white mb-3 tracking-tight">Maintenance en cours</h1>
                <p class="text-gray-400 text-sm leading-relaxed mb-8">
                    Le terminal est temporairement indisponible pour effectuer des mises à jour importantes. L'accès est restreint aux administrateurs.
                </p>

                <div class="w-full bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
                    <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Raison</div>
                    <div class="text-white font-medium text-sm">"${state.maintenance.reason || 'Amélioration des services'}"</div>
                </div>

                ${endTime ? `
                    <div class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-500/10 text-blue-300 text-sm font-bold border border-blue-500/20 mb-8">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        <span id="maintenance-timer" class="font-mono">${timeDisplay}</span>
                    </div>
                ` : ''}

                <div class="flex flex-col gap-4 w-full">
                    <button onclick="window.location.reload()" class="group relative w-full py-4 rounded-xl bg-white text-black font-bold text-sm flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg hover:shadow-white/10 active:scale-95">
                        <i data-lucide="refresh-cw" class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500"></i>
                        Tenter d'actualiser
                    </button>
                    
                    <div class="pt-6 border-t border-white/5 w-full">
                        <div class="text-[10px] text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Système hors ligne
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-6 text-xs text-gray-600 font-mono">
                TFRP • v4.4.0
            </div>
        </div>
    </div>
    `;
};