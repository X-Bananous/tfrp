
import { CONFIG } from '../config.js';
import { state } from '../state.js';
import { router } from '../utils.js';

export const LoginView = () => {
    // 1. FILTER & SORT STAFF
    // Filter out specific ID and sort Founders First
    const EXCLUDED_ID = '1449442051904245812';
    
    const validStaff = state.landingStaff.filter(s => s.id !== EXCLUDED_ID);

    const founders = validStaff.filter(s => state.adminIds.includes(s.id));
    const others = validStaff.filter(s => !state.adminIds.includes(s.id));

    // Duplicate staff for infinite scroll effect (only if enough staff)
    const staffCarouselItems = others.length > 0 ? [...others, ...others, ...others] : [];

    // Render logic helper for Founders (Larger, Gold)
    const renderFounderCard = (s) => {
        const status = state.discordStatuses[s.id] || 'offline';
        const color = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[status];
        return `
            <div class="glass-card p-6 rounded-3xl flex flex-col items-center border border-amber-500/20 bg-amber-500/5 relative overflow-hidden group w-48 hover:border-amber-500/40 transition-all">
                <div class="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="w-20 h-20 rounded-2xl border-2 border-amber-500/30 p-1 mb-4 relative z-10 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-xl object-cover">
                    <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${color} border-2 border-[#050505]" title="Discord Status"></div>
                </div>
                <div class="text-center w-full relative z-10">
                    <div class="font-bold text-white text-lg truncate tracking-tight">${s.username}</div>
                    <div class="text-[10px] text-amber-400 font-bold uppercase tracking-widest mt-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">Fondation</div>
                </div>
            </div>
        `;
    };

    // Render logic helper for Staff Carousel (Compact)
    const renderStaffCard = (s) => {
        const status = state.discordStatuses[s.id] || 'offline';
        const color = { online: 'bg-emerald-500', idle: 'bg-amber-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[status];
        return `
            <div class="glass-panel w-64 p-3 rounded-2xl flex items-center gap-4 border border-white/5 bg-white/[0.02] shrink-0">
                <div class="relative w-12 h-12 shrink-0">
                    <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-full object-cover border border-white/10">
                    <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${color} border border-black"></div>
                </div>
                <div class="min-w-0">
                    <div class="font-bold text-white text-sm truncate">${s.username}</div>
                    <div class="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Administration</div>
                </div>
            </div>
        `;
    };

    return `
    <div class="flex-1 flex flex-col relative overflow-hidden h-full w-full bg-[#030303] text-white">
        <!-- Ambient Background -->
        <div class="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>
        <div class="absolute -top-40 -right-40 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none"></div>

        <!-- Navbar -->
        <nav class="relative z-20 w-full px-8 py-6 flex justify-between items-center animate-fade-in">
            <div class="flex items-center gap-3">
                <span class="font-bold text-lg tracking-tight text-white/90">TFRP <span class="text-white/30 font-normal">Panel</span></span>
            </div>
            
            <div class="flex items-center gap-6">
                <!-- Legal Links Group -->
                <div class="hidden md:flex items-center gap-4 text-sm font-medium text-gray-500">
                    <button onclick="router('terms')" class="hover:text-white transition-colors">CGU</button>
                    <span class="text-white/10">•</span>
                    <button onclick="router('privacy')" class="hover:text-white transition-colors">Confidentialité</button>
                </div>
                <div class="w-px h-4 bg-white/10 hidden md:block"></div>
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-2">
                    Discord <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
                </a>
            </div>
        </nav>

        <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
            <div class="flex flex-col items-center pt-10 pb-20 px-6">
                
                <!-- Hero Section -->
                <div class="text-center max-w-4xl mx-auto mb-20 animate-slide-up">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-8">
                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                        <span class="text-xs font-bold text-indigo-200 tracking-widest uppercase">Global City • Los Angeles</span>
                    </div>
                    
                    <h1 class="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 leading-[0.9]">
                        TEAM FRENCH<br>
                        <span class="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">ROLEPLAY</span>
                    </h1>
                    
                    <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                        L'expérience roleplay ultime sur ERLC. Une économie réaliste, une administration stricte et des possibilités infinies.
                    </p>

                    <!-- Main Action -->
                    <div class="flex flex-col items-center gap-6">
                        ${state.isLoggingIn ? `
                            <button disabled class="h-16 px-10 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4 text-white/50 cursor-wait">
                                <div class="loader-sm"></div>
                                <span class="font-bold">Authentification...</span>
                            </button>
                        ` : state.user ? `
                            <div class="flex flex-col items-center gap-4">
                                <div class="flex items-center gap-3 bg-white/5 border border-white/10 p-2 pr-6 rounded-full backdrop-blur-md">
                                    <img src="${state.user.avatar}" class="w-8 h-8 rounded-full">
                                    <span class="text-sm font-bold text-white">${state.user.username}</span>
                                </div>
                                <button onclick="router('select')" class="group relative h-16 px-10 rounded-2xl bg-white text-black font-bold text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                                    Accéder au Terminal
                                    <i data-lucide="arrow-right" class="w-5 h-5 group-hover:translate-x-1 transition-transform"></i>
                                </button>
                            </div>
                        ` : `
                            <button onclick="actions.login()" class="group relative h-16 px-10 rounded-2xl bg-white text-black font-bold text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                                <i data-lucide="log-in" class="w-5 h-5"></i>
                                Connexion Citoyen
                            </button>
                        `}
                    </div>
                </div>

                <!-- Features Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mb-32">
                    <div class="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left">
                        <div class="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 border border-blue-500/10">
                            <i data-lucide="globe" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Univers Persistant</h3>
                        <p class="text-sm text-gray-400 leading-relaxed">Votre argent, vos biens et votre casier judiciaire sont sauvegardés en temps réel et synchronisés.</p>
                    </div>
                    <div class="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left">
                        <div class="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 border border-purple-500/10">
                            <i data-lucide="scale" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Légal & Illégal</h3>
                        <p class="text-sm text-gray-400 leading-relaxed">Devenez chef d'entreprise, officier de police ou parrain de la pègre. Le choix vous appartient.</p>
                    </div>
                    <div class="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left">
                        <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/10">
                            <i data-lucide="shield-check" class="w-6 h-6"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white mb-2">Whitelist</h3>
                        <p class="text-sm text-gray-400 leading-relaxed">Un accès restreint garantissant une qualité de jeu (Roleplay) supérieure et une communauté mature.</p>
                    </div>
                </div>

                <!-- Staff Section -->
                <div class="w-full max-w-7xl mx-auto">
                    <!-- Founders (Centered) -->
                    <div class="text-center mb-16">
                        <h3 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-8">Direction & Fondation</h3>
                        <div class="flex flex-wrap justify-center gap-6">
                            ${founders.map(f => renderFounderCard(f)).join('')}
                        </div>
                    </div>

                    <!-- Staff Carousel (Full Width) -->
                    ${others.length > 0 ? `
                        <div class="relative w-full overflow-hidden mask-fade-sides py-8">
                            <div class="animate-marquee">
                                ${staffCarouselItems.map(s => renderStaffCard(s)).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Footer -->
                <div class="mt-20 pt-10 border-t border-white/5 w-full max-w-4xl flex justify-between items-center text-xs text-gray-600">
                    <div>&copy; 2024 Team French RolePlay. All rights reserved.</div>
                    <div class="flex gap-4 md:hidden">
                        <button onclick="router('terms')" class="hover:text-white transition-colors">CGU</button>
                        <button onclick="router('privacy')" class="hover:text-white transition-colors">Confidentialité</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

export const AccessDeniedView = () => {
    return `
    <div class="flex items-center justify-center h-full w-full bg-[#050505] p-6 animate-fade-in">
        <div class="glass-panel max-w-md w-full p-8 rounded-3xl text-center border border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
            <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
                <i data-lucide="shield-x" class="w-10 h-10"></i>
            </div>
            
            <h1 class="text-3xl font-bold text-white mb-2">Accès Refusé</h1>
            <p class="text-gray-400 text-sm mb-8 leading-relaxed">
                Vous devez être membre du serveur Discord <b>Team French RolePlay</b> pour accéder à ce terminal.
            </p>

            <div class="space-y-3">
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                    Rejoindre le Discord
                </a>
                
                <button onclick="actions.logout()" class="w-full py-3.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                    Déconnexion
                </button>
            </div>
        </div>
    </div>
    `;
};
