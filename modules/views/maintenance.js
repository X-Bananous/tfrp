import { state } from '../state.js';

export const MaintenanceView = () => {
    const endTime = state.maintenance.endTime ? new Date(state.maintenance.endTime) : null;
    let timeRemaining = '';
    
    // Logic for countdown display if end time exists
    if (endTime) {
        const now = new Date();
        if(endTime > now) {
            const diff = endTime - now;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            timeRemaining = `Retour estimé dans: ${h}h ${m}m`;
        } else {
            timeRemaining = "Retour imminent...";
        }
    }

    return `
    <div class="flex items-center justify-center h-full w-full bg-black relative overflow-hidden animate-fade-in">
        <!-- Background Graphics -->
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-pulse"></div>
        <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-pulse"></div>
        
        <div class="glass-panel max-w-lg w-full p-10 rounded-[30px] border border-red-500/20 text-center relative z-10 shadow-[0_0_100px_rgba(220,38,38,0.2)]">
            <div class="mb-8 relative inline-block">
                <div class="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse-slow"></div>
                <i data-lucide="triangle-alert" class="w-24 h-24 text-red-500 relative z-10"></i>
            </div>
            
            <h1 class="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Maintenance</h1>
            <div class="h-1 w-20 bg-red-500 mx-auto mb-6 rounded-full"></div>
            
            <p class="text-gray-300 text-lg mb-8 leading-relaxed">
                Le système est actuellement verrouillé pour une opération de maintenance technique par La Fondation.
            </p>
            
            <div class="bg-white/5 border border-white/10 p-6 rounded-2xl mb-8">
                <div class="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">Statut</div>
                <div class="text-red-400 font-mono text-xl animate-pulse">● SYSTÈME HORS LIGNE</div>
                ${state.maintenance.reason ? `<div class="mt-4 pt-4 border-t border-white/5 text-sm text-gray-400 italic">"${state.maintenance.reason}"</div>` : ''}
            </div>

            ${timeRemaining ? `
                <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/30 border border-red-500/30 text-red-300 font-mono text-sm">
                    <i data-lucide="timer" class="w-4 h-4"></i> ${timeRemaining}
                </div>
            ` : ''}
            
            <div class="mt-10 text-xs text-gray-600">
                TFRP System • Accès Administratif Uniquement
            </div>
        </div>
    </div>
    `;
};