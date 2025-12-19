import { state } from '../state.js';
import { BankView } from './bank.js';
import { StaffView } from './staff.js';
import { AssetsView } from './assets.js';
import { IllicitView } from './illicit.js';
import { ServicesView } from './services.js';
import { EnterpriseView } from './enterprise.js';
import { NotificationsView } from './notifications.js';
import { ProfileView } from './profile.js';
import { hasPermission, router } from '../utils.js';
import { ui } from '../ui.js';
import { HEIST_DATA } from './illicit.js';
import { CONFIG } from '../config.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-500/5 border-b border-blue-500/10 gap-3 shrink-0">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">Hub Central</span> • Données en temps réel</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser
        </button>
    </div>
`;

const AdventCalendarView = () => {
    const today = new Date();
    const currentDay = today.getDate();
    // Logic: 12 to 25
    const startDay = 12;
    const endDay = 25;
    const days = [];
    
    // Check next unlock
    let nextUnlockStr = '';
    if (currentDay < startDay) {
        nextUnlockStr = `Ouverture le ${startDay} Décembre`;
    } else if (currentDay >= endDay) {
        nextUnlockStr = "Joyeuses Fêtes !";
    } else {
        // Precise countdown for display
        const tomorrow = new Date(today);
        tomorrow.setDate(currentDay + 1);
        tomorrow.setHours(0,0,0,0);
        const diffMs = tomorrow - today;
        const h = Math.floor(diffMs / (1000 * 60 * 60));
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diffMs % (1000 * 60)) / 1000);
        nextUnlockStr = `Prochain cadeau : ${h}h ${m}m ${s}s`;
        
        // Setup simple refresh for timer (rough but effective)
        if(!window.adventTimer) {
            window.adventTimer = setInterval(() => {
                const now = new Date();
                const tmr = new Date(now);
                tmr.setDate(now.getDate() + 1);
                tmr.setHours(0,0,0,0);
                const d = tmr - now;
                const hh = Math.floor(d / 3600000);
                const mm = Math.floor((d % 3600000) / 60000);
                const ss = Math.floor((d % 60000) / 1000);
                const el = document.getElementById('advent-countdown');
                if(el) el.innerText = `Prochain cadeau : ${hh}h ${mm}m ${ss}s`;
                else clearInterval(window.adventTimer);
            }, 1000);
        }
    }

    for (let i = startDay; i <= endDay; i++) {
        const isClaimed = state.user.advent_calendar?.includes(i);
        const isLocked = i > currentDay; // Future
        const isMissed = i < currentDay && !isClaimed; // Past and forgotten
        let isAvailable = i === currentDay && !isClaimed; // Only Today
        
        let bgClass = 'bg-white/5 border-white/5';
        let icon = 'lock';
        let textClass = 'text-gray-500';
        let statusText = 'Verrouillé';
        
        if (isClaimed) {
            bgClass = 'bg-emerald-900/20 border-emerald-500/30';
            icon = 'check-circle';
            textClass = 'text-emerald-400';
            statusText = 'Ouvert';
            
            // SPECIAL RETROACTIVE FIX FOR DAY 16
            if (i === 16) {
                // If item missing, re-enable button to claim item only
                const hasItem = state.inventory.some(item => item.name === "Anniversaire de la patate 2025");
                if (!hasItem) {
                    isAvailable = true;
                    statusText = 'Récupérer Objet';
                    bgClass = 'bg-yellow-500/20 border-yellow-500 animate-pulse';
                    icon = 'alert-triangle';
                    textClass = 'text-yellow-400';
                }
            }

        } else if (isMissed) {
            bgClass = 'bg-gray-800/50 border-white/5 opacity-50 grayscale';
            icon = 'x-circle';
            textClass = 'text-gray-600';
            statusText = 'Raté';
        } else if (isAvailable) {
            bgClass = 'bg-gradient-to-br from-red-600 to-red-800 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] animate-pulse-slow';
            icon = 'gift';
            textClass = 'text-white';
            statusText = 'Ouvrir !';
        }

        days.push({ day: i, isClaimed, isLocked, isMissed, isAvailable, bgClass, icon, textClass, statusText });
    }

    return `
        <div class="animate-fade-in h-full flex flex-col">
            ${refreshBanner}
            <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div class="max-w-5xl mx-auto">
                    <div class="text-center mb-10">
                        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 text-sm font-bold border border-red-500/20 mb-4">
                            <i data-lucide="snowflake" class="w-4 h-4"></i> Édition Spéciale Noël
                        </div>
                        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">Calendrier de l'Avent</h1>
                        <p class="text-gray-400 max-w-lg mx-auto">Connectez-vous chaque jour pour débloquer des récompenses. Les jours manqués sont perdus.</p>
                        <div class="mt-4 text-xs font-mono text-emerald-400 bg-black/40 inline-block px-3 py-1 rounded border border-emerald-500/20">
                            <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i> <span id="advent-countdown">${nextUnlockStr}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        ${days.map(d => `
                            <button 
                                ${d.isAvailable ? `onclick="actions.claimAdventReward(${d.day})"` : 'disabled'}
                                class="relative aspect-square rounded-2xl border ${d.bgClass} flex flex-col items-center justify-center gap-2 group transition-all transform ${d.isAvailable ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed'} ${d.day === 25 ? 'col-span-2 md:col-span-1 lg:col-span-1 border-yellow-500/50' : ''}">
                                
                                <div class="absolute top-3 left-4 font-black text-4xl text-white/10 select-none">${d.day}</div>
                                
                                <div class="relative z-10 p-3 rounded-full bg-black/20 backdrop-blur-sm">
                                    <i data-lucide="${d.day === 25 ? 'star' : d.icon}" class="w-8 h-8 ${d.day === 25 ? 'text-yellow-400' : d.textClass}"></i>
                                </div>
                                
                                <div class="relative z-10 text-sm font-bold ${d.day === 25 ? 'text-yellow-400' : d.textClass} uppercase tracking-wider">
                                    ${d.statusText}
                                </div>
                                
                                ${d.isAvailable ? '<div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>' : ''}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="mt-12 text-center pb-10">
                        <div class="inline-block p-4 bg-white/5 rounded-xl border border-white/5 max-w-md">
                            <h4 class="text-white font-bold mb-1 flex items-center justify-center gap-2"><i data-lucide="gift" class="w-4 h-4 text-yellow-400"></i> Le 25 Décembre</h4>
                            <p class="text-xs text-gray-400">Une prime exceptionnelle de <b>$25,000</b> vous attend pour Noël !</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const HubView = () => {
    // --- CHECK ALIGNMENT ---
    if (state.activeCharacter && !state.activeCharacter.alignment && !state.alignmentModalShown) {
        state.alignmentModalShown = true;
        setTimeout(() => {
            ui.showModal({
                title: "Mise à jour Dossier",
                content: `
                    <div class="text-center">
                        <p class="mb-4">Votre dossier citoyen nécessite une mise à jour administrative.</p>
                        <p class="font-bold text-white mb-2">Quelle est votre orientation actuelle ?</p>
                        <div class="grid grid-cols-2 gap-4 mt-4">
                            <button onclick="actions.setAlignment('legal')" class="p-4 rounded-xl bg-blue-500/20 border border-blue-500 hover:bg-blue-500/30 transition-colors">
                                <i data-lucide="briefcase" class="w-8 h-8 text-blue-400 mx-auto mb-2"></i>
                                <div class="text-sm font-bold text-white">Légal / Civil</div>
                            </button>
                            <button onclick="actions.setAlignment('illegal')" class="p-4 rounded-xl bg-red-500/20 border border-red-500 hover:bg-red-500/30 transition-colors">
                                <i data-lucide="skull" class="w-8 h-8 text-red-400 mx-auto mb-2"></i>
                                <div class="text-sm font-bold text-white">Illégal</div>
                            </button>
                        </div>
                    </div>
                `,
                confirmText: null, 
                type: 'default'
            });
            setTimeout(() => {
                const confirmBtn = document.getElementById('modal-confirm');
                if(confirmBtn) confirmBtn.style.display = 'none';
            }, 50);
        }, 500);
    }

    let content = '';
    
    // LOADER
    if (state.isPanelLoading) {
        return `
            <div class="flex h-full w-full bg-[#050505] items-center justify-center">
                <div class="text-center">
                    <div class="loader-spinner mb-4 mx-auto"></div>
                    <p class="text-gray-500 text-sm tracking-widest uppercase animate-pulse">Chargement des données...</p>
                </div>
            </div>
        `;
    }

    const isBypass = state.activeCharacter?.id === 'STAFF_BYPASS';
    // ERLC Data
    const { currentPlayers, maxPlayers, queue, joinKey } = state.erlcData;
    const robloxUrl = `roblox://placeId=2534724415&launchData=%7B%22psCode%22%3A%22${joinKey}%22%7D`;
    
    // Guild Memberships
    const inServiceGuild = state.user.guilds && state.user.guilds.includes(CONFIG.GUILD_SERVICES);
    const inIllegalGuild = state.user.guilds && state.user.guilds.includes(CONFIG.GUILD_ILLEGAL);
    const inStaffGuild = state.user.guilds && state.user.guilds.includes(CONFIG.GUILD_STAFF);
    
    // Check Session
    const isSessionActive = !!state.activeGameSession;

    // ... [Content logic] ...
    if (state.activeHubPanel === 'main') {
        if(isBypass) {
             setTimeout(() => actions.setHubPanel('staff'), 0);
             return ''; 
        }

        const showStaffCard = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
        const isIllegal = state.activeCharacter?.alignment === 'illegal';
        const job = state.activeCharacter?.job || 'unemployed';
        const hasServiceAccess = ['leo', 'lafd', 'ladot', 'lawyer'].includes(job);
        
        let newsHtml = '';
        if (state.globalActiveHeists && state.globalActiveHeists.length > 0) {
            const majorHeists = state.globalActiveHeists.filter(h => !['house', 'gas', 'atm'].includes(h.heist_type));
            if (majorHeists.length > 0) {
                newsHtml = `
                    <div class="glass-panel p-4 rounded-2xl bg-gradient-to-r from-red-900/40 to-black border-red-500/30 flex items-center gap-4 animate-pulse-slow">
                        <div class="p-2 bg-red-500 rounded-lg animate-pulse">
                            <i data-lucide="radio" class="w-5 h-5 text-white"></i>
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <div class="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Flash Info • Alerte Générale</div>
                            <div class="text-white font-medium text-sm truncate">
                                ${majorHeists.map(h => {
                                    const hData = HEIST_DATA.find(d => d.id === h.heist_type);
                                    return `Braquage en cours : ${hData ? hData.name : h.heist_type}`;
                                }).join(' • ')}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                 newsHtml = `
                    <div class="glass-panel p-4 rounded-2xl border-white/5 flex items-center gap-4 opacity-70">
                        <div class="p-2 bg-white/10 rounded-lg">
                            <i data-lucide="sun" class="w-5 h-5 text-yellow-200"></i>
                        </div>
                        <div>
                            <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Flash Info</div>
                            <div class="text-gray-300 font-medium text-sm">Aucun incident majeur à signaler à Los Angeles.</div>
                        </div>
                    </div>
                `;
            }
        } else {
             newsHtml = `
                <div class="glass-panel p-4 rounded-2xl border-white/5 flex items-center gap-4 opacity-70">
                    <div class="p-2 bg-white/10 rounded-lg">
                        <i data-lucide="sun" class="w-5 h-5 text-yellow-200"></i>
                    </div>
                    <div>
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Flash Info</div>
                        <div class="text-gray-300 font-medium text-sm">Aucun incident majeur à signaler à Los Angeles.</div>
                    </div>
                </div>
            `;
        }
        
        // 911 Bubble only if session active
        const callBubble = isSessionActive ? `
            <button onclick="actions.openCallPage()" class="glass-panel p-4 rounded-2xl border-red-500/20 flex items-center gap-4 hover:bg-red-500/5 transition-colors cursor-pointer text-left w-full group">
                <div class="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 text-red-400">
                    <i data-lucide="phone-call" class="w-5 h-5"></i>
                </div>
                <div>
                    <div class="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Urgence (911)</div>
                    <div class="text-white font-medium text-sm">Contacter Police / EMS</div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-500 ml-auto"></i>
            </button>
        ` : `
            <div class="glass-panel p-4 rounded-2xl border-white/5 flex items-center gap-4 opacity-50 cursor-not-allowed">
                <div class="p-2 bg-gray-700/50 rounded-lg text-gray-400">
                    <i data-lucide="phone-off" class="w-5 h-5"></i>
                </div>
                <div>
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Central 911</div>
                    <div class="text-gray-400 font-medium text-sm">Services Indisponibles</div>
                </div>
            </div>
        `;

        content = `
            <div class="animate-fade-in h-full flex flex-col">
                 <!-- DASHBOARD HEADER & BANNER -->
                 ${refreshBanner}
                 
                 <div class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                    <div class="max-w-7xl mx-auto space-y-6">
                        <div class="mb-6 relative rounded-3xl overflow-hidden h-48 group shadow-2xl bg-gradient-to-r from-gray-900 via-gray-800 to-black border border-white/10 shrink-0">
                            <div class="absolute inset-0 p-8 flex flex-col justify-center">
                                <div class="flex justify-between items-end">
                                    <div>
                                        <h1 class="text-3xl font-bold text-white mb-2">Team French RolePlay</h1>
                                        <p class="text-gray-300 mb-4 flex items-center gap-2">
                                            <span class="w-2 h-2 ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} rounded-full"></span>
                                            ${isSessionActive ? 'Serveur Privé ERLC' : 'Session Fermée'}
                                        </p>
                                        <div class="flex items-center gap-4">
                                            <div class="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                                                <span class="text-gray-400 uppercase tracking-wide mr-2">Joueurs</span>
                                                <span class="font-mono font-bold text-lg">${currentPlayers}/${maxPlayers}</span>
                                            </div>
                                            <div class="bg-white/10 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                                                <span class="text-gray-400 uppercase tracking-wide mr-2">File</span>
                                                <span class="font-mono font-bold text-lg erlc-queue-count">${queue ? queue.length : 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="text-right hidden md:block">
                                        ${isSessionActive ? `
                                            <div class="text-sm text-gray-400 mb-2 uppercase tracking-widest font-bold">Code Serveur</div>
                                            <div class="text-4xl font-mono font-bold text-white tracking-widest mb-4 text-glow">${joinKey}</div>
                                            <a href="${robloxUrl}" class="glass-btn px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform bg-white text-black shadow-lg shadow-white/10">
                                                <i data-lucide="play" class="w-5 h-5 fill-current"></i>
                                                Rejoindre
                                            </a>
                                        ` : `
                                            <div class="flex flex-col items-end">
                                                <div class="px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold flex items-center gap-2 mb-2">
                                                    <i data-lucide="lock" class="w-4 h-4"></i> Accès Restreint
                                                </div>
                                                <p class="text-gray-500 text-xs max-w-[200px] leading-relaxed">
                                                    Aucune session de jeu n'est en cours. Attendez l'ouverture par le staff.
                                                </p>
                                            </div>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${newsHtml}
                            ${callBubble}
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- CARDS -->
                            <button onclick="actions.setHubPanel('notifications')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-blue-500/20">
                                <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"><i data-lucide="bell" class="w-6 h-6"></i></div>
                                <div class="relative z-10">
                                    <h3 class="text-xl font-bold text-white">Notifications</h3>
                                    <p class="text-sm text-gray-400 mt-1">Flux système & Actualités</p>
                                    ${state.notifications.length > 0 ? `<div class="absolute top-0 right-0 mt-6 mr-6 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>` : ''}
                                </div>
                            </button>

                            <button onclick="actions.setHubPanel('advent')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-red-500/20">
                                <div class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"><i data-lucide="gift" class="w-6 h-6"></i></div>
                                <div class="relative z-10"><h3 class="text-xl font-bold text-white">Calendrier Avent</h3><p class="text-sm text-gray-400 mt-1">Cadeaux Quotidiens (12-25)</p></div>
                            </button>

                            <button onclick="actions.setHubPanel('bank')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-emerald-500/20">
                                <div class="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"><i data-lucide="landmark" class="w-6 h-6"></i></div>
                                <div class="relative z-10"><h3 class="text-xl font-bold text-white">Ma Banque</h3><p class="text-sm text-gray-400 mt-1">Solde, Retraits & Virements</p></div>
                            </button>

                            <button onclick="actions.setHubPanel('assets')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-indigo-500/20">
                                <div class="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"><i data-lucide="gem" class="w-6 h-6"></i></div>
                                <div class="relative z-10"><h3 class="text-xl font-bold text-white">Patrimoine</h3><p class="text-sm text-gray-400 mt-1">Inventaire & Valeur Totale</p></div>
                            </button>

                            <button onclick="actions.setHubPanel('enterprise')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-blue-500/20">
                                <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"><i data-lucide="building-2" class="w-6 h-6"></i></div>
                                <div class="relative z-10"><h3 class="text-xl font-bold text-white">Entreprise</h3><p class="text-sm text-gray-400 mt-1">Gestion Société & Employés</p></div>
                            </button>

                            ${hasServiceAccess ? `
                                <button onclick="actions.setHubPanel('services')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer ${!inServiceGuild ? 'border-red-500/30 opacity-90' : ''}">
                                    ${!inServiceGuild ? '<div class="absolute top-4 right-4 text-red-500 bg-red-500/10 p-2 rounded-full"><i data-lucide="lock" class="w-5 h-5"></i></div>' : ''}
                                    <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"><i data-lucide="siren" class="w-6 h-6"></i></div>
                                    <div class="relative z-10">
                                        <h3 class="text-xl font-bold text-white">Services Publics</h3>
                                        <p class="text-sm text-gray-400 mt-1">Dispatch, Annuaire & Rapports</p>
                                        <div class="inline-block px-2 py-0.5 mt-2 rounded bg-blue-500/20 text-blue-300 text-xs font-bold uppercase">${job}</div>
                                    </div>
                                </button>
                            ` : isIllegal ? `
                                <button onclick="actions.setHubPanel('illicit')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-red-500/20 ${!inIllegalGuild ? 'border-red-500/40 opacity-90' : ''}">
                                    ${!inIllegalGuild ? '<div class="absolute top-4 right-4 text-red-500 bg-red-500/10 p-2 rounded-full"><i data-lucide="lock" class="w-5 h-5"></i></div>' : ''}
                                    <div class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"><i data-lucide="skull" class="w-6 h-6"></i></div>
                                    <div class="relative z-10"><h3 class="text-xl font-bold text-white">Monde Criminel</h3><p class="text-sm text-gray-400 mt-1">Mafias, Gangs & Marché Noir</p></div>
                                </button>
                            ` : `
                                <div class="glass-card p-6 rounded-[24px] h-64 flex flex-col justify-center items-center text-center border-white/5 opacity-50">
                                    <i data-lucide="briefcase" class="w-10 h-10 text-gray-500 mb-4"></i>
                                    <h3 class="text-lg font-bold text-gray-400">Accès Civil</h3>
                                    <p class="text-sm text-gray-600 mt-1">Rejoignez un métier (LEO/EMS) ou le crime pour débloquer.</p>
                                </div>
                            `}
                        </div>
                    </div>
                 </div>
            </div>
        `;
    } else if (state.activeHubPanel === 'profile') {
        content = ProfileView();
    } else if (state.activeHubPanel === 'notifications') {
        content = NotificationsView();
    } else if (state.activeHubPanel === 'advent') {
        content = AdventCalendarView();
    } else if (state.activeHubPanel === 'staff_list') {
        // ... same staff list ...
        const staffList = state.staffMembers || [];
        staffList.sort((a, b) => {
             const aF = state.adminIds.includes(a.id);
             const bF = state.adminIds.includes(b.id);
             return (aF === bF) ? 0 : aF ? -1 : 1;
        });

        content = `
            <div class="animate-fade-in h-full flex flex-col">
                ${refreshBanner}
                <div class="shrink-0 p-6 pb-0 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <i data-lucide="users-round" class="w-6 h-6 text-blue-400"></i>
                            Liste du Staff
                        </h2>
                        <p class="text-gray-400 text-sm">Membres de l'équipe et statut de connexion.</p>
                    </div>
                </div>
                
                <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        ${staffList.map(s => {
                            const isFounder = state.adminIds.includes(s.id);
                            const discordStatus = state.discordStatuses[s.id] || 'offline';
                            const discordColor = { online: 'bg-green-500', idle: 'bg-yellow-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[discordStatus] || 'bg-zinc-600';
                            
                            return `
                            <div class="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                <div class="w-14 h-14 rounded-full border border-white/10 shrink-0">
                                    <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-full object-cover">
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <h3 class="font-bold text-white truncate">${s.username}</h3>
                                        ${isFounder ? '<span class="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold uppercase">Fondateur</span>' : ''}
                                    </div>
                                    <div class="flex items-center gap-3 mt-2 text-xs">
                                        <div class="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full border border-white/5">
                                            <div class="w-2 h-2 rounded-full ${s.is_on_duty ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}"></div>
                                            <span class="text-gray-400 uppercase text-[9px]">Panel</span>
                                        </div>
                                        <div class="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded-full border border-white/5">
                                            <div class="w-2 h-2 rounded-full ${discordColor}"></div>
                                            <span class="text-gray-400 uppercase text-[9px]">Discord</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

    } else if (state.activeHubPanel === 'enterprise') {
        content = EnterpriseView();
    } else if (state.activeHubPanel === 'bank') {
        content = BankView();
    } else if (state.activeHubPanel === 'assets') {
        content = AssetsView();
    } else if (state.activeHubPanel === 'illicit') {
        content = IllicitView();
    } else if (state.activeHubPanel === 'staff') {
        content = StaffView();
    } else if (state.activeHubPanel === 'services') {
        content = ServicesView();
    } else if (state.activeHubPanel === 'emergency_call') {
        // ... (Emergency Call View Code) ...
        content = `
            <div class="animate-fade-in h-full flex flex-col">
                ${refreshBanner}
                <div class="shrink-0 p-6 pb-0 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <i data-lucide="phone-call" class="w-6 h-6 text-red-500"></i>
                            Appel d'Urgence
                        </h2>
                        <p class="text-gray-400 text-sm">Central 911 • Los Angeles</p>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center p-6">
                    <div class="glass-panel p-8 rounded-2xl w-full max-w-2xl border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        ${isSessionActive ? `
                            <form onsubmit="actions.createEmergencyCall(event)" class="space-y-6">
                                <div><label class="text-xs text-gray-500 uppercase font-bold ml-1">Service Requis</label><select name="service" class="glass-input p-3 rounded-xl w-full text-sm bg-black/40 mt-1"><option value="police">Police / Sheriff</option><option value="ems">Ambulance / Pompier</option><option value="dot">Dépanneuse (DOT)</option></select></div>
                                <div><label class="text-xs text-gray-500 uppercase font-bold ml-1">Localisation</label><input type="text" list="streets" name="location" placeholder="Rue ou Point de repère" class="glass-input w-full p-3 rounded-xl text-sm bg-black/40 mt-1" required><datalist id="streets">${CONFIG.STREET_NAMES.map(s => `<option value="${s}">`).join('')}</datalist></div>
                                <div><label class="text-xs text-gray-500 uppercase font-bold ml-1">Description</label><textarea name="description" rows="3" placeholder="Nature de l'incident, blessés, armes..." class="glass-input w-full p-3 rounded-xl text-sm bg-black/40 mt-1" required></textarea></div>
                                <button type="submit" class="glass-btn w-full py-4 rounded-xl font-bold text-lg bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"><i data-lucide="radio" class="w-5 h-5"></i> Envoyer au Central</button>
                            </form>
                        ` : `
                            <div class="text-center py-10"><i data-lucide="radio-off" class="w-16 h-16 text-gray-600 mx-auto mb-4"></i><h3 class="text-xl font-bold text-gray-400 mb-2">Service Indisponible</h3><p class="text-sm text-gray-500">Aucun central de réception d'appels n'est actif car il n'y a pas de session de jeu en cours.</p></div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // Function helper to generate nav links (used for both Sidebar and Mobile Menu)
    const generateNavItems = () => {
        const navItem = (panel, icon, label, color = 'text-white') => {
            const isActive = state.activeHubPanel === panel;
            const bgClass = isActive 
                ? 'bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 text-white shadow-lg shadow-blue-500/5' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-4 border-transparent';
            
            let lockIcon = '';
            if (panel === 'services' && !inServiceGuild) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto opacity-50"></i>';
            if (panel === 'illicit' && !inIllegalGuild) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto opacity-50"></i>';
            if (panel === 'staff' && !inStaffGuild) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto opacity-50"></i>';

            // Badge for notifications
            const badge = (panel === 'notifications' && state.notifications.length > 0) ? `<span class="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>` : '';

            return `
                <button onclick="actions.setHubPanel('${panel}'); actions.toggleSidebar();" class="group w-full text-left px-4 py-3 text-sm font-medium transition-all flex items-center gap-3 cursor-pointer rounded-r-xl ${bgClass} mb-1">
                    <div class="p-1.5 rounded-lg ${isActive ? 'bg-blue-500/20' : 'bg-white/5 group-hover:bg-white/10'} transition-colors">
                        <i data-lucide="${icon}" class="w-4 h-4 ${isActive ? color : 'text-gray-400 group-hover:text-white'}"></i>
                    </div>
                    ${label}
                    ${badge || lockIcon}
                </button>
            `;
        };

        const hasStaffAccess = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
        const hasServiceAccess = ['leo', 'lafd', 'ladot', 'lawyer'].includes(state.activeCharacter?.job);
        const isIllegal = state.activeCharacter?.alignment === 'illegal';

        if (isBypass) return '';

        let html = `
            <div class="px-6 mt-6 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span class="w-8 h-[1px] bg-gray-700"></span> Menu
            </div>
            ${navItem('main', 'layout-grid', 'Tableau de bord', 'text-blue-400')}
            ${navItem('notifications', 'bell', 'Notifications', 'text-blue-400')}
            ${navItem('advent', 'snowflake', 'Calendrier Avent', 'text-red-400')}
            ${navItem('staff_list', 'users-round', 'Liste du Staff', 'text-yellow-400')}
            
            ${isSessionActive ? `
                <button onclick="actions.openCallPage(); actions.toggleSidebar();" class="group w-full text-left px-4 py-3 text-sm font-medium transition-all flex items-center gap-3 cursor-pointer rounded-r-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 border-l-4 border-transparent hover:border-red-500/50 mb-1">
                     <div class="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20"><i data-lucide="phone" class="w-4 h-4 text-red-500"></i></div>
                     Appel d'urgence
                </button>
            ` : ''}

            <div class="px-6 mt-6 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <span class="w-8 h-[1px] bg-gray-700"></span> Gestion
            </div>
            ${navItem('bank', 'landmark', 'Ma Banque', 'text-emerald-400')}
            ${navItem('assets', 'gem', 'Patrimoine', 'text-indigo-400')}
            ${navItem('enterprise', 'building-2', 'Entreprise', 'text-blue-400')}
            
            ${hasServiceAccess ? navItem('services', 'siren', 'Services Publics', 'text-blue-400') : ''}
            ${isIllegal ? navItem('illicit', 'skull', 'Illégal', 'text-red-400') : ''}
            
            ${hasStaffAccess ? `
                <div class="px-6 mt-6 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <span class="w-8 h-[1px] bg-gray-700"></span> Admin
                </div>
                ${navItem('staff', 'shield-alert', 'Administration', 'text-purple-400')}
            ` : ''}
        `;
        
        return html;
    };

    const staffOnDuty = state.onDutyStaff || [];

    // --- MOBILE BOTTOM NAV BAR (Modern iOS style) ---
    const mobileNav = `
        <div class="md:hidden fixed bottom-0 left-0 w-full bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 z-50 flex justify-around items-center pb-[env(safe-area-inset-bottom)]">
            <button onclick="actions.setHubPanel('main')" class="flex-1 py-3 flex flex-col items-center gap-1 ${state.activeHubPanel === 'main' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}">
                <i data-lucide="layout-grid" class="w-6 h-6"></i>
                <span class="text-[10px] font-medium">Accueil</span>
            </button>
            <button onclick="actions.setHubPanel('notifications')" class="flex-1 py-3 flex flex-col items-center gap-1 ${state.activeHubPanel === 'notifications' ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'}">
                <i data-lucide="bell" class="w-6 h-6"></i>
                <span class="text-[10px] font-medium">Messages</span>
            </button>
            <!-- MENU TOGGLE (Center) -->
            <button onclick="actions.toggleSidebar()" class="flex-1 py-3 flex flex-col items-center gap-1 text-white relative group">
                <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10 group-active:bg-white/20 transition-colors -mt-4 shadow-lg backdrop-blur-md">
                    <i data-lucide="${state.ui.sidebarOpen ? 'x' : 'menu'}" class="w-6 h-6"></i>
                </div>
            </button>
            <button onclick="actions.setHubPanel('bank')" class="flex-1 py-3 flex flex-col items-center gap-1 ${state.activeHubPanel === 'bank' ? 'text-emerald-500' : 'text-gray-500 hover:text-gray-300'}">
                <i data-lucide="landmark" class="w-6 h-6"></i>
                <span class="text-[10px] font-medium">Banque</span>
            </button>
            <button onclick="actions.setHubPanel('assets')" class="flex-1 py-3 flex flex-col items-center gap-1 ${state.activeHubPanel === 'assets' ? 'text-indigo-500' : 'text-gray-500 hover:text-gray-300'}">
                <i data-lucide="backpack" class="w-6 h-6"></i>
                <span class="text-[10px] font-medium">Sac</span>
            </button>
        </div>
    `;

    // --- MOBILE EXPANDED MENU (BOTTOM SHEET) ---
    const mobileMenuOverlay = `
        <div class="md:hidden fixed inset-0 z-[40] bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${state.ui.sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}" onclick="actions.toggleSidebar()"></div>
        <div class="md:hidden fixed bottom-0 left-0 w-full z-[45] glass-panel rounded-t-[30px] border-x-0 border-b-0 border-t border-white/10 transition-transform duration-300 transform ${state.ui.sidebarOpen ? 'translate-y-0' : 'translate-y-full'} pb-24 max-h-[85vh] flex flex-col">
            <div class="w-full flex justify-center pt-3 pb-1">
                <div class="w-12 h-1.5 bg-white/20 rounded-full"></div>
            </div>
            <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div onclick="actions.setHubPanel('profile'); actions.toggleSidebar();" class="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 cursor-pointer transition-all">
                    <img src="${state.user.avatar}" class="w-12 h-12 rounded-full border border-white/10 object-cover">
                    <div class="flex-1">
                        <h3 class="font-bold text-white text-sm">${state.user.username}</h3>
                        <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</p>
                    </div>
                    <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600"></i>
                </div>
                <div class="space-y-1">
                    ${generateNavItems()}
                </div>
                <div class="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-3">
                    <button onclick="actions.backToSelect()" class="glass-btn-secondary py-3 rounded-xl text-xs flex items-center justify-center gap-2">
                        <i data-lucide="users" class="w-4 h-4"></i> Changer Perso
                    </button>
                    <button onclick="actions.confirmLogout()" class="glass-btn-secondary py-3 rounded-xl text-xs text-red-300 flex items-center justify-center gap-2 hover:bg-red-500/20">
                        <i data-lucide="log-out" class="w-4 h-4"></i> Déconnexion
                    </button>
                </div>
            </div>
        </div>
    `;

    return `
        <div class="flex h-full w-full bg-[#050505] relative overflow-hidden">
            <!-- Mobile Elements -->
            ${mobileNav}
            ${mobileMenuOverlay}

            <!-- DESKTOP SIDEBAR (Redesigned) -->
            <aside class="hidden md:flex relative top-0 bottom-0 left-0 z-[100] w-72 h-[100dvh] bg-[#09090b]/95 backdrop-blur-xl border-r border-white/5 flex-col shadow-2xl">
                <!-- User Profile Header -->
                <div onclick="actions.setHubPanel('profile')" class="p-6 shrink-0 relative overflow-hidden cursor-pointer group">
                    <div class="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none group-hover:from-blue-900/20 transition-all"></div>
                    <div class="relative z-10 flex items-center gap-3">
                        <div class="relative w-12 h-12 shrink-0 group-hover:scale-105 transition-transform">
                            <div class="absolute inset-0 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <img src="${state.user.avatar}" class="w-full h-full rounded-full border-2 border-white/10 relative z-10 object-cover">
                            ${state.user.avatar_decoration ? `<img src="${state.user.avatar_decoration}" class="absolute top-1/2 left-1/2 w-[125%] h-[125%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style="max-width: none">` : ''}
                        </div>
                        <div class="overflow-hidden flex-1">
                            <h3 class="font-bold text-white truncate text-sm group-hover:text-blue-300 transition-colors">${state.user.username}</h3>
                            <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider truncate">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</p>
                        </div>
                        <i data-lucide="settings" class="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400 group-hover:rotate-45 transition-all"></i>
                    </div>
                </div>
                
                <!-- Navigation -->
                <div class="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1">
                    ${generateNavItems()}
                    
                    ${isSessionActive ? `
                        <div class="mt-8 mx-2 p-4 bg-gradient-to-br from-green-900/20 to-black rounded-xl border border-green-500/20 relative group overflow-hidden">
                             <div class="absolute -right-6 -top-6 w-16 h-16 bg-green-500/20 rounded-full blur-2xl"></div>
                             <div class="flex items-center justify-between mb-3 relative z-10">
                                <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                                    <span class="text-xs font-bold text-white tracking-wide">ERLC LIVE</span>
                                </div>
                                <span class="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-gray-400 font-mono">Q: <span class="text-white erlc-queue-count">${queue ? queue.length : 0}</span></span>
                             </div>
                             
                             <div class="bg-black/40 rounded-lg border border-white/5 py-2 px-3 mb-3 flex items-center justify-between group-hover:border-green-500/30 transition-colors">
                                <span class="font-mono font-bold text-white text-lg tracking-widest select-all">${joinKey}</span>
                                <i data-lucide="copy" class="w-3 h-3 text-gray-500"></i>
                             </div>

                             <a href="${robloxUrl}" class="glass-btn-secondary w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all text-gray-300">
                                <i data-lucide="play" class="w-3 h-3 fill-current"></i> Rejoindre
                             </a>
                        </div>
                    ` : ''}

                    <div class="mt-4 mx-2 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                        <div class="flex justify-between items-center mb-2">
                            <div class="text-[10px] font-bold text-gray-500 uppercase">Staff Actif</div>
                            <span class="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded-full">${staffOnDuty.length}</span>
                        </div>
                        ${staffOnDuty.length > 0 
                            ? `<div class="space-y-2">${staffOnDuty.map(s => `
                                <div class="flex items-center gap-2 text-xs text-gray-300">
                                    <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <img src="${s.avatar_url}" class="w-4 h-4 rounded-full"> ${s.username}
                                </div>`).join('')}</div>` 
                            : '<div class="text-[10px] text-gray-600 italic">Aucun membre en service.</div>'
                        }
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="p-4 border-t border-white/5 shrink-0 bg-[#0c0c0e]">
                        <div class="flex justify-center gap-4 text-[10px] text-gray-600 mb-3">
                            <button onclick="router('terms')" class="hover:text-white transition-colors">CGU</button>
                            <span class="text-gray-800">•</span>
                            <button onclick="router('privacy')" class="hover:text-white transition-colors">Privé</button>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="actions.backToSelect()" class="w-full glass-btn-secondary py-2.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer flex items-center justify-center gap-2 transition-all group" title="Changer de personnage">
                                <i data-lucide="users" class="w-4 h-4 group-hover:scale-110 transition-transform"></i> Persos
                            </button>
                            <button onclick="actions.confirmLogout()" class="w-full glass-btn-secondary py-2.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/10 hover:border-red-500/30 cursor-pointer flex items-center justify-center gap-2 transition-all group">
                                <i data-lucide="log-out" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i> Sortir
                            </button>
                        </div>
                </div>
            </aside>

            <main class="flex-1 flex flex-col relative overflow-hidden h-full">
                <!-- Mobile Header (Logo Only) -->
                <div class="md:hidden p-4 flex items-center justify-center border-b border-white/5 bg-[#050505] z-30 pt-[env(safe-area-inset-top)]">
                    <div class="font-bold text-white tracking-tight flex items-center gap-2">
                        <i data-lucide="shield-check" class="w-5 h-5 text-blue-500"></i> TFRP
                    </div>
                </div>

                <!-- Main Content (Removed Wrapper Padding/Scroll to allow Full Height views) -->
                <div class="flex-1 overflow-hidden relative z-0 flex flex-col pb-32 md:pb-[env(safe-area-inset-bottom)]">
                    ${content}
                </div>
            </main>
        </div>
    `;
};