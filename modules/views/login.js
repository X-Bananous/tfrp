
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';

export const LoginView = () => {
    // 1. SORT STAFF: Founders First (Requires Admin IDs loaded from DB)
    const sortedStaff = [...state.landingStaff].sort((a, b) => {
        const aIsFounder = state.adminIds.includes(a.id);
        const bIsFounder = state.adminIds.includes(b.id);
        if (aIsFounder && !bIsFounder) return -1;
        if (!aIsFounder && bIsFounder) return 1;
        return 0;
    });

    const founders = sortedStaff.filter(s => state.adminIds.includes(s.id));
    const others = sortedStaff.filter(s => !state.adminIds.includes(s.id));

    // Render logic helper
    const renderCard = (s, isFounder) => {
        const status = state.discordStatuses[s.id] || 'offline';
        const color = { online: 'bg-green-500', idle: 'bg-yellow-500', dnd: 'bg-red-500', offline: 'bg-gray-500' }[status];
        return `
            <div class="glass-card w-40 p-4 rounded-2xl flex flex-col items-center border ${isFounder ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5'} shrink-0 relative overflow-hidden group">
                <div class="w-16 h-16 rounded-full border-2 ${s.is_on_duty ? 'border-green-500' : 'border-white/10'} p-0.5 mb-3 relative">
                    <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-full object-cover">
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${color} border border-black" title="Discord Status"></div>
                </div>
                <div class="text-center w-full">
                    <div class="font-bold text-white text-sm truncate">${s.username}</div>
                    ${isFounder ? '<div class="text-[10px] text-yellow-400 font-bold uppercase mt-1">Fondateur</div>' : '<div class="text-[10px] text-gray-400 mt-1">Staff</div>'}
                </div>
            </div>
        `;
    };

    return `
    <style>
        @keyframes scroll {
            0% { transform: translateY(0); } /* Fallback, specific horizontal scroll handled by flex */
        }
        .staff-carousel {
            display: flex;
            gap: 1rem;
            overflow-x: auto; 
            padding-bottom: 1rem;
        }
    </style>

    <div class="flex-1 flex flex-col relative overflow-hidden h-full w-full bg-[#050505]">
        <div class="landing-gradient-bg"></div>
        
        <nav class="relative z-10 w-full p-6 flex justify-between items-center animate-fade-in shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <i data-lucide="shield-check" class="w-5 h-5 text-white"></i>
                </div>
                <span class="font-bold text-xl tracking-tight text-white">TFRP</span>
            </div>
            <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn-secondary px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
                <i data-lucide="users" class="w-4 h-4"></i>
                Rejoindre Discord
            </a>
        </nav>

        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
            <div class="min-h-full flex flex-col">
                <!-- Hero Section -->
                <div class="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 animate-slide-up w-full max-w-7xl mx-auto">
                    <div class="mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md inline-flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span class="text-xs font-medium text-gray-300 tracking-wide uppercase">Serveur Ouvert • ERLC Roblox</span>
                    </div>
                    
                    <h1 class="landing-hero-text mb-6">
                        Team French<br>RolePlay
                    </h1>
                    
                    <p class="text-lg text-gray-400 max-w-2xl mb-10 leading-relaxed">
                        Bienvenue à <b>Los Angeles</b>, Global City et cœur de la Mégalopole de Californie.
                        <br>Ici, écrivez votre propre histoire sans aucune limite.
                    </p>

                    <div class="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-none justify-center mb-16 items-center">
                        ${state.isLoggingIn ? `
                            <button disabled class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 w-64">
                                <div class="loader-spinner w-5 h-5 border-2"></div>
                                Connexion...
                            </button>
                        ` : state.user ? `
                            <div class="flex items-center gap-3 bg-white/10 border border-white/20 p-2 rounded-full pr-6">
                                <div class="relative w-10 h-10">
                                    <img src="${state.user.avatar}" class="w-full h-full rounded-full object-cover">
                                    ${state.user.avatar_decoration ? `<img src="${state.user.avatar_decoration}" class="absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" style="max-width: none">` : ''}
                                </div>
                                <div class="text-left">
                                    <div class="text-[10px] text-gray-400 uppercase font-bold">Connecté en tant que</div>
                                    <div class="text-white font-bold text-sm">${state.user.username}</div>
                                </div>
                            </div>
                            <button onclick="router('select')" class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer shadow-[0_0_40px_rgba(10,132,255,0.3)]">
                                Accéder au Panel <i data-lucide="arrow-right" class="w-5 h-5"></i>
                            </button>
                        ` : `
                            <button onclick="actions.login()" class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer shadow-[0_0_40px_rgba(10,132,255,0.3)]">
                                <i data-lucide="gamepad-2" class="w-6 h-6"></i>
                                Connexion Citoyen
                            </button>
                        `}
                    </div>

                    <!-- Layout: Full Width Info -->
                    <div class="w-full max-w-6xl mx-auto">
                        
                        <div class="w-full space-y-12">
                             <!-- Info Bubbles Grid -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div class="glass-panel p-6 rounded-2xl text-left border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                                    <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400">
                                        <i data-lucide="globe-2" class="w-5 h-5"></i>
                                    </div>
                                    <h3 class="font-bold text-white text-lg mb-2">Global City</h3>
                                    <p class="text-sm text-gray-400 leading-relaxed">
                                        Plongez au cœur de la Mégalopole Californienne. Une immersion réaliste dans une ville qui ne dort jamais.
                                    </p>
                                </div>

                                <div class="glass-panel p-6 rounded-2xl text-left border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                                    <div class="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400">
                                        <i data-lucide="users" class="w-5 h-5"></i>
                                    </div>
                                    <h3 class="font-bold text-white text-lg mb-2">Liberté Totale</h3>
                                    <p class="text-sm text-gray-400 leading-relaxed">
                                        RP Légal, Illégal, Gérant d'entreprise ou simple Fermier. Tout est possible, votre imagination est la seule limite.
                                    </p>
                                </div>
                            </div>

                            <!-- Staff Section -->
                            <div>
                                <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2 justify-center md:justify-start">
                                    <i data-lucide="shield" class="w-5 h-5 text-purple-400"></i> La Fondation
                                </h3>
                                
                                <!-- Founders Fixed -->
                                <div class="flex justify-center md:justify-start gap-4 mb-6 flex-wrap">
                                    ${founders.map(f => renderCard(f, true)).join('')}
                                </div>

                                <!-- Horizontal Scroll for Others -->
                                ${others.length > 0 ? `
                                    <div class="w-full overflow-x-auto no-scrollbar pb-4">
                                        <div class="flex gap-4">
                                            ${others.map(s => renderCard(s, false)).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="shrink-0 relative z-10 py-8 border-t border-white/5 bg-[#050505]/90 backdrop-blur-md mt-12 w-full text-center">
                    <div class="max-w-6xl mx-auto px-6 flex justify-center gap-6 text-xs text-gray-500">
                        <button onclick="ui.showModal({title:'Conditions d\\'Utilisation', content: window.LEGAL_TERMS, confirmText: 'Fermer'})" class="hover:text-white transition-colors">Conditions d'utilisation</button>
                        <button onclick="ui.showModal({title:'Politique de Confidentialité', content: window.LEGAL_PRIVACY, confirmText: 'Fermer'})" class="hover:text-white transition-colors">Politique de confidentialité</button>
                        <span>&copy; 2024 TFRP</span>
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const AccessDeniedView = () => `
    <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div class="glass-panel max-w-md w-full p-8 rounded-2xl border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <i data-lucide="shield-off" class="w-10 h-10"></i>
            </div>
            <h2 class="text-2xl font-bold text-white mb-2">Accès Refusé</h2>
            <p class="text-gray-400 mb-8">Vous devez être membre du serveur Discord officiel pour accéder à cette application.</p>
            <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <i data-lucide="external-link" class="w-4 h-4"></i>
                Rejoindre le Discord
            </a>
            <button onclick="router('login')" class="mt-4 text-sm text-gray-500 hover:text-white underline">Retour à l'accueil</button>
        </div>
    </div>
`;
