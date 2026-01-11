import { state } from '../state.js';

export const WheelView = () => {
    const turns = state.user.whell_turn || 0;
    const isOpening = state.isOpening;
    const openingCrateIdx = state.openingCrateIdx;

    const renderCrates = () => {
        let crates = [];
        // On affiche toujours au moins 8 caisses pour le visuel
        const count = Math.max(8, turns);
        for(let i=0; i < count; i++) {
            const isTarget = openingCrateIdx === i;
            const canOpen = turns > 0 && !isOpening;
            
            crates.push(`
                <div class="relative group">
                    <button onclick="${canOpen ? `actions.openCrate(${i})` : ''}" 
                        ${!canOpen && !isTarget ? 'disabled' : ''}
                        class="w-full aspect-square glass-panel rounded-[32px] border border-white/5 bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 transition-all duration-500 
                        ${canOpen ? 'hover:border-blue-500/50 hover:bg-blue-600/5 hover:scale-[1.02] cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        ${isTarget ? 'border-blue-500 bg-blue-600/20 scale-[1.05] animate-pulse shadow-[0_0_50px_rgba(59,130,246,0.3)]' : ''}">
                        
                        <div class="relative">
                            <div class="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                <i data-lucide="package" class="w-8 h-8 ${isTarget ? 'animate-bounce' : ''}"></i>
                            </div>
                            ${canOpen ? '<div class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0a0a0a] flex items-center justify-center"><i data-lucide="check" class="w-3 h-3 text-white"></i></div>' : ''}
                        </div>
                        
                        <div class="text-center">
                            <div class="text-[10px] font-black text-white uppercase tracking-widest">${isTarget ? 'DÉCRYPTAGE...' : 'CAISSE SÉCURISÉE'}</div>
                            <div class="text-[8px] text-gray-500 uppercase font-bold tracking-widest mt-1">LOTERIE NATIONALE</div>
                        </div>
                    </button>
                </div>
            `);
        }
        return crates.join('');
    };

    return `
    <div class="fixed inset-0 z-[500] bg-[#050505] flex flex-col items-center justify-start p-8 animate-fade-in overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(10,132,246,0.08),transparent_70%)]"></div>
        <div class="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <!-- HEADER -->
        <div class="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between mb-12 relative z-10 shrink-0">
            <div class="text-center md:text-left mb-8 md:mb-0">
                <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] border border-blue-500/20 mb-4">
                    Système de Loterie Nationale
                </div>
                <h2 class="text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">TFRP <span class="text-blue-500">LOOTBOX</span></h2>
            </div>

            <div class="flex items-center gap-4">
                <div class="bg-white/5 border border-white/10 px-8 py-3 rounded-[24px] backdrop-blur-xl flex items-center gap-4 shadow-2xl">
                    <div class="text-left">
                        <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-0.5">Clés d'Accès</div>
                        <div class="text-3xl font-mono font-black text-yellow-400">${turns}</div>
                    </div>
                    <i data-lucide="key" class="w-6 h-6 text-yellow-500/50"></i>
                </div>
                <button onclick="actions.showProbabilities()" class="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl group" title="Consulter les probabilités">
                    <i data-lucide="info" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                </button>
                <button onclick="actions.closeWheel()" class="p-4 bg-white/5 hover:bg-red-600/20 border border-white/10 rounded-2xl text-gray-400 hover:text-red-500 transition-all shadow-xl">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
        </div>

        <!-- MAIN AREA -->
        <div class="w-full max-w-6xl flex-1 overflow-y-auto custom-scrollbar pr-4 relative z-10">
            ${turns === 0 && !isOpening ? `
                <div class="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
                    <div class="w-32 h-32 rounded-full bg-gray-800/30 flex items-center justify-center mb-8 border border-white/5">
                        <i data-lucide="lock" class="w-16 h-16 text-gray-600"></i>
                    </div>
                    <h3 class="text-2xl font-black text-white uppercase tracking-widest italic">Signal Interrompu</h3>
                    <p class="text-gray-500 mt-4 max-w-md uppercase font-bold text-[10px] tracking-widest leading-relaxed">
                        Vous n'avez plus de clés d'accès. <br>Rejoignez le Discord ou boostez le serveur pour obtenir de nouveaux jetons.
                    </p>
                </div>
            ` : `
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-20">
                    ${renderCrates()}
                </div>
            `}
        </div>

        <!-- FOOTER INFO -->
        <div class="fixed bottom-10 left-1/2 -translate-x-1/2 opacity-30 flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/5 backdrop-blur-xl">
            <i data-lucide="shield-check" class="w-5 h-5 text-blue-500"></i>
            <div class="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] leading-relaxed">
                Algorithme Certifié v4.6.2 Platinum Edition • Sélection Aléatoire Chiffrée
            </div>
        </div>
    </div>
    `;
};