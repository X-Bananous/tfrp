import { state } from '../state.js';
import { WHEEL_REWARDS } from '../actions/wheel.js';

export const WheelView = () => {
    const turns = state.user.whell_turn || 0;
    const items = state.currentWheelItems || [];
    const isSpinning = state.isSpinning;

    const renderItems = () => {
        // On n'altère plus la liste selon isSpinning pour éviter les sauts de position du ruban
        // Si la liste est courte (idle initial), on la multiplie juste pour le visuel
        const displayItems = items.length < 50 ? [...items, ...items, ...items, ...items] : items;
        
        return displayItems.map(item => `
            <div class="w-[150px] h-[180px] shrink-0 bg-gradient-to-b from-[#1a1a1c] to-black rounded-2xl border-b-4 flex flex-col items-center justify-center p-4 shadow-2xl transition-all" style="border-color: ${item.color}">
                <div class="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center shadow-inner" style="background-color: ${item.color}20">
                    <i data-lucide="${item.type === 'money' ? 'banknote' : item.type === 'role' ? 'crown' : 'star'}" class="w-8 h-8" style="color: ${item.color}"></i>
                </div>
                <div class="text-[10px] font-black text-white uppercase text-center leading-tight tracking-tighter">${item.label}</div>
                <div class="text-[7px] text-gray-500 font-bold uppercase mt-2 tracking-widest">${item.rarity}</div>
            </div>
        `).join('');
    };

    // Calcul de la marge initiale pour centrer le ruban si on n'est pas en train de tourner
    const stripStyle = isSpinning 
        ? `transform: translateX(0);` 
        : `margin-left: calc(50% - 75px); transform: translateX(0); transition: none;`;

    return `
    <div class="fixed inset-0 z-[500] bg-[#050505] flex flex-col items-center justify-center p-8 animate-fade-in overflow-hidden">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.08),transparent_70%)]"></div>
        <div class="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <div class="relative w-full max-w-6xl flex flex-col items-center">
            
            <!-- HEADER -->
            <div class="mb-12 text-center relative z-10">
                <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.4em] border border-blue-500/20 mb-4 animate-pulse">
                    Système de Loterie Nationale
                </div>
                <h2 class="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl">TFRP <span class="text-blue-500">LOOTBOX</span></h2>
                <div class="mt-8 flex items-center justify-center gap-4">
                    <div class="bg-white/5 border border-white/10 px-8 py-3 rounded-[24px] backdrop-blur-xl flex items-center gap-4 shadow-2xl">
                        <div class="text-left">
                            <div class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Clés d'Accès</div>
                            <div class="text-3xl font-mono font-black text-yellow-400">${turns}</div>
                        </div>
                        <i data-lucide="key" class="w-6 h-6 text-yellow-500/50"></i>
                    </div>
                    <button onclick="actions.showProbabilities()" class="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all shadow-xl group" title="Consulter les probabilités">
                        <i data-lucide="info" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                    </button>
                </div>
            </div>

            <!-- SLIDER CONTAINER (Style CS:GO) -->
            <div class="relative w-full h-[250px] flex items-center justify-center mb-16 overflow-hidden">
                <!-- Pointeur Central Fixe -->
                <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-blue-500 z-[100] shadow-[0_0_20px_rgba(59,130,246,0.8)]">
                    <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 rotate-45 shadow-lg border-2 border-white/20"></div>
                    <div class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 rotate-45 shadow-lg border-2 border-white/20"></div>
                </div>

                <!-- Effets de dégradé sur les bords -->
                <div class="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none"></div>
                <div class="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none"></div>

                <!-- Ruban des items -->
                <div class="w-full h-full border-y border-white/5 bg-black/40 flex items-center">
                    <div id="case-strip" 
                         class="flex gap-[10px] ${!isSpinning && items.length < 50 ? 'animate-lootbox-idle' : ''}" 
                         style="${stripStyle}">
                        ${renderItems()}
                    </div>
                </div>
            </div>

            <!-- ACTIONS -->
            <div class="flex flex-col items-center gap-8 relative z-10">
                <button onclick="actions.spinWheel()" 
                    ${isSpinning || turns <= 0 ? 'disabled' : ''}
                    class="h-24 px-24 rounded-[32px] font-black text-2xl uppercase italic tracking-widest transition-all transform active:scale-95 shadow-2xl
                    ${isSpinning || turns <= 0 ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5' : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-blue-900/40'}">
                    ${isSpinning ? 'DÉCRYPTAGE EN COURS...' : 'OUVRIR LA CAISSE'}
                </button>
                
                ${!isSpinning ? `
                    <button onclick="actions.closeWheel()" 
                        class="px-10 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] hover:text-white hover:bg-white/10 transition-all flex items-center gap-3">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i>
                        Quitter le Terminal
                    </button>
                ` : ''}
            </div>
        </div>

        <!-- FOOTER INFO -->
        <div class="fixed bottom-10 left-10 opacity-30 flex items-center gap-4">
            <i data-lucide="shield-check" class="w-6 h-6 text-blue-500"></i>
            <div class="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] leading-relaxed">
                Algorithme Certifié v4.6.2 Platinum Edition<br>
                Protection anti-screenshot active
            </div>
        </div>
    </div>
    `;
};