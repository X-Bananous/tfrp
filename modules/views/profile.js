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

    return `
    <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
        <div class="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        
        <div class="px-6 py-8 shrink-0 relative z-10">
            <h2 class="text-3xl font-bold text-white flex items-center gap-3">
                <i data-lucide="user-circle" class="w-8 h-8 text-gray-400"></i>
                Mon Profil
            </h2>
            <p class="text-gray-500 text-sm mt-1">Gérer vos informations personnelles et votre compte</p>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div class="max-w-3xl mx-auto space-y-6">
                
                <!-- USER IDENTITY CARD -->
                <div class="glass-panel p-8 rounded-[24px] border-white/5 flex flex-col md:flex-row items-center gap-8 bg-white/[0.02]">
                    <div class="relative group">
                        <div class="absolute inset-0 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <img src="${u.avatar}" class="w-32 h-32 rounded-full border-4 border-white/10 relative z-10 object-cover">
                        ${u.avatar_decoration ? `<img src="${u.avatar_decoration}" class="absolute top-1/2 left-1/2 w-[125%] h-[125%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style="max-width:none">` : ''}
                    </div>
                    <div class="text-center md:text-left">
                        <h3 class="text-2xl font-bold text-white mb-1">${u.username}</h3>
                        <p class="text-gray-500 font-mono text-xs mb-4">Discord ID: ${u.id}</p>
                        <div class="flex flex-wrap justify-center md:justify-start gap-2">
                            <span class="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">Citoyen Actif</span>
                            ${u.isFounder ? `<span class="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-widest border border-yellow-500/20">Fondateur</span>` : ''}
                        </div>
                    </div>
                </div>

                <!-- RGPD / DELETION SECTION -->
                <div class="glass-panel p-8 rounded-[24px] border ${isDeleting ? 'border-orange-500/30 bg-orange-500/5' : 'border-red-500/10 bg-red-500/[0.02]'}">
                    <div class="flex items-start gap-4 mb-6">
                        <div class="w-12 h-12 rounded-xl ${isDeleting ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'} flex items-center justify-center shrink-0">
                            <i data-lucide="${isDeleting ? 'clock' : 'shield-alert'}" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-bold text-white">Gestion des données (RGPD)</h4>
                            <p class="text-sm text-gray-400">Droit à l'oubli et suppression de compte</p>
                        </div>
                    </div>

                    ${isDeleting ? `
                        <div class="bg-black/40 border border-orange-500/30 p-6 rounded-2xl mb-6">
                            <div class="flex justify-between items-center mb-4">
                                <span class="text-orange-400 font-bold uppercase text-xs tracking-widest">Suppression en cours</span>
                                <span class="text-white font-mono text-lg font-bold">${timeRemainingStr} restants</span>
                            </div>
                            <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
                                <div class="bg-orange-500 h-full w-2/3 animate-pulse"></div>
                            </div>
                            <p class="text-xs text-gray-400 leading-relaxed mb-6">Votre compte et toutes les données associées seront définitivement supprimés à l'issue de ce délai. Cette action est irréversible après l'exécution.</p>
                            <button onclick="actions.cancelDataDeletion()" class="w-full py-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                                <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Annuler la suppression
                            </button>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            <p class="text-sm text-gray-300 leading-relaxed">
                                Vous avez le droit de demander la suppression intégrale de vos informations de notre base de données. 
                                Après votre demande, une période de grâce de <b>3 jours</b> vous est accordée pour changer d'avis.
                            </p>
                            <button onclick="actions.requestDataDeletion()" class="group py-4 px-6 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-3">
                                <i data-lucide="trash-2" class="w-4 h-4"></i> Demander la suppression totale
                            </button>
                        </div>
                    `}
                </div>

                <div class="text-center pt-10 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                    Terminal TFRP • Conformité Européenne 2025
                </div>
            </div>
        </div>
    </div>
    `;
};