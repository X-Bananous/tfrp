
import { state } from '../state.js';
import { BankView } from './bank.js';
import { StaffView } from './staff.js';
import { AssetsView } from './assets.js';
import { IllicitView } from './illicit.js';
import { ServicesView } from './services.js';
import { EnterpriseView } from './enterprise.js';
import { NotificationsView } from './notifications.js';
import { ProfileView } from './profile.js';
import { JobCenterView } from './jobs.js';
import { hasPermission, router } from '../utils.js';
import { ui } from '../ui.js';
import { HEIST_DATA } from './illicit.js';
import { CONFIG } from '../config.js';

const refreshBanner = (color = 'blue') => `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-${color}-500/5 border-b border-${color}-500/10 gap-3 shrink-0 relative z-20">
        <div class="text-[10px] text-${color}-200 flex items-center gap-2 font-black uppercase tracking-[0.2em]">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-${color}-500"></span>
            </div>
            <span>Terminal d'Information • Signal Sécurisé</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-[10px] font-black uppercase tracking-widest text-${color}-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchronisation Cloud
        </button>
    </div>
`;

const LawyersListView = () => {
    const lawyers = state.lawyers || [];
    const onDutyLawyers = lawyers.filter(l => l.is_on_duty).length;

    return `
        <div class="animate-fade-in h-full flex flex-col bg-[#050505]">
            ${refreshBanner('purple')}
            
            <div class="px-8 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative z-10 shrink-0">
                <div>
                    <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                        <i data-lucide="scale" class="w-8 h-8 text-purple-500"></i>
                        Barreau de Los Angeles
                    </h2>
                    <div class="flex items-center gap-3 mt-1">
                         <span class="text-[10px] text-purple-500/60 font-black uppercase tracking-widest">Conseil de l'Ordre</span>
                         <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                         <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">${lawyers.length} Praticien(s) Accrédité(s)</span>
                    </div>
                </div>
                <div class="bg-purple-500/10 border border-purple-500/20 px-6 py-2 rounded-2xl flex items-center gap-4 shadow-xl">
                    <div class="text-[9px] text-purple-400 font-black uppercase tracking-widest">Avocats en Cabinet</div>
                    <div class="text-xl font-mono font-black text-white">${onDutyLawyers}</div>
                    <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto pb-10">
                    ${lawyers.map(l => {
                        const status = state.discordStatuses[l.id] || 'offline';
                        const statusColor = { online: 'bg-green-500', idle: 'bg-yellow-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[status];
                        return `
                        <div class="glass-panel p-8 rounded-[40px] border border-white/5 hover:border-purple-500/30 bg-[#0a0a0a] flex flex-col gap-6 relative overflow-hidden transition-all group shadow-2xl">
                            <div class="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-700"></div>
                            
                            <div class="flex justify-between items-start relative z-10">
                                <div class="relative">
                                    <div class="w-20 h-20 rounded-[28px] border-2 border-white/10 p-1 bg-black shadow-2xl">
                                        <img src="${l.avatar_url}" class="w-full h-full rounded-[22px] object-cover">
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${statusColor} border-4 border-[#0a0a0a] shadow-xl"></div>
                                </div>
                                <span class="px-4 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20 shadow-lg italic">Maître</span>
                            </div>

                            <div>
                                <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter truncate group-hover:text-purple-400 transition-colors">${l.username}</h3>
                                <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">Inscrit au Barreau de L.A.</div>
                            </div>

                            <div class="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-2.5 h-2.5 rounded-full ${l.is_on_duty ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}"></div>
                                    <span class="text-[10px] font-black ${l.is_on_duty ? 'text-emerald-400' : 'text-gray-600'} uppercase tracking-widest">${l.is_on_duty ? 'EN CABINET' : 'INDISPONIBLE'}</span>
                                </div>
                                <a href="https://discord.com/users/${l.id}" target="_blank" class="p-3 rounded-2xl bg-white/5 hover:bg-purple-600 text-gray-400 hover:text-white border border-white/10 hover:border-purple-500 transition-all shadow-lg">
                                    <i data-lucide="message-square" class="w-5 h-5"></i>
                                </a>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
};

export const HubView = () => {
    const u = state.user;
    const standaloneMode = !state.activeCharacter; // Détecte si on est en consultation profil hors-jeu

    if (state.activeCharacter && !state.activeCharacter.alignment && !state.alignmentModalShown) {
        state.alignmentModalShown = true;
        setTimeout(() => {
            ui.showModal({
                title: "Mise à jour Dossier",
                content: `
                    <div class="text-center">
                        <p class="mb-4">Votre dossier citoyen nécessite une mise à jour administrative.</p>
                        <p class="font-bold text-white mb-6 uppercase tracking-widest text-xs">Quelle est votre orientation actuelle ?</p>
                        <div class="grid grid-cols-2 gap-4">
                            <button onclick="actions.setAlignment('legal')" class="p-6 rounded-[24px] bg-blue-500/10 border border-blue-500/30 hover:bg-blue-600/20 transition-all group">
                                <i data-lucide="briefcase" class="w-10 h-10 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform"></i>
                                <div class="text-xs font-black text-white uppercase tracking-widest">Légal / Civil</div>
                            </button>
                            <button onclick="actions.setAlignment('illegal')" class="p-6 rounded-[24px] bg-red-500/10 border border-red-500/30 hover:bg-red-600/20 transition-all group">
                                <i data-lucide="skull" class="w-10 h-10 text-red-400 mx-auto mb-4 group-hover:scale-110 transition-transform"></i>
                                <div class="text-xs font-black text-white uppercase tracking-widest">Illégal</div>
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
    if (state.isPanelLoading) {
        return `
            <div class="flex h-full w-full bg-[#050505] items-center justify-center animate-fade-in relative">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(10,132,255,0.03),transparent_70%)]"></div>
                <div class="text-center relative z-10 max-w-xs w-full px-6">
                    <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-6 relative">
                        <div class="absolute inset-y-0 left-0 bg-blue-500 w-1/3 animate-loading-bar shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    </div>
                    <p class="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.3em] animate-pulse">Synchronisation Monde...</p>
                </div>
            </div>
        `;
    }

    const isBypass = state.activeCharacter?.id === 'STAFF_BYPASS';
    const { currentPlayers, maxPlayers, queue, joinKey } = state.erlcData;
    const robloxUrl = `roblox://placeId=2534724415&launchData=%7B%22psCode%22%3A%22${joinKey}%22%7D`;
    const isSessionActive = !!state.activeGameSession;
    const inServiceGuild = state.user.guilds?.includes(CONFIG.GUILD_SERVICES);
    const inIllegalGuild = state.user.guilds?.includes(CONFIG.GUILD_ILLEGAL);

    if (state.activeHubPanel === 'main') {
        if(isBypass) { setTimeout(() => actions.setHubPanel('staff'), 0); return ''; }
        
        const char = state.activeCharacter;
        const isEnterpriseOwner = state.myEnterprises?.length > 0;
        const job = (char?.job === 'unemployed' && isEnterpriseOwner) ? 'pdg' : (char?.job || 'unemployed');
        const isIllegal = char?.alignment === 'illegal';
        const isJustice = ['juge', 'procureur'].includes(job.toLowerCase());
        const hasServiceAccess = ['leo', 'lafd', 'ladot', 'lawyer', 'maire', 'adjoint', 'juge', 'procureur'].includes(job.toLowerCase());

        let newsHtml = '';
        const majorHeists = state.globalActiveHeists?.filter(h => !['house', 'gas', 'atm'].includes(h.heist_type)) || [];
        
        if (majorHeists.length > 0) {
            newsHtml = `
                <div class="glass-panel p-5 rounded-3xl bg-gradient-to-r from-red-900/40 to-black border-red-500/30 flex items-center gap-5 animate-pulse-slow">
                    <div class="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-900/40 shrink-0">
                        <i data-lucide="radio" class="w-6 h-6 animate-pulse"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Alerte Prioritaire • Flash Info</div>
                        <div class="text-white font-bold text-sm truncate uppercase tracking-tight italic">
                            ${majorHeists.map(h => HEIST_DATA.find(d => d.id === h.heist_type)?.name || h.heist_type).join(' • ')} EN COURS
                        </div>
                    </div>
                </div>
            `;
        } else {
            newsHtml = `
                <div class="glass-panel p-5 rounded-3xl border-white/5 bg-white/[0.01] flex items-center gap-5 opacity-60">
                    <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 shrink-0 border border-white/10">
                        <i data-lucide="sun" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Status Ville</div>
                        <div class="text-gray-400 font-bold text-sm uppercase tracking-tight">Ciel dégagé sur Los Angeles.</div>
                    </div>
                </div>
            `;
        }

        content = `
            <div class="animate-fade-in h-full flex flex-col bg-[#050505]">
                 ${refreshBanner('blue')}
                 <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div class="max-w-7xl mx-auto space-y-8">
                        <div class="relative rounded-[48px] overflow-hidden group shadow-2xl bg-gradient-to-br from-blue-900/40 via-black to-black border border-white/10">
                            <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                            <div class="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                            <div class="relative z-10 p-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
                                <div class="text-center md:text-left">
                                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] border border-blue-500/20 mb-6 rounded-lg">
                                        <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Unified Portal v4.5
                                    </div>
                                    <h1 class="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter uppercase italic drop-shadow-2xl">Team French <br><span class="text-blue-500">Roleplay</span></h1>
                                    <p class="text-gray-500 text-sm font-bold uppercase tracking-widest mb-8">Serveur Privé • California State</p>
                                    <div class="flex items-center justify-center md:justify-start gap-4">
                                        <div class="bg-white/5 backdrop-blur px-5 py-3 rounded-2xl border border-white/5 text-center">
                                            <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Joueurs</div>
                                            <div class="font-mono font-black text-2xl text-white">${currentPlayers}/${maxPlayers}</div>
                                        </div>
                                        <div class="bg-white/5 backdrop-blur px-5 py-3 rounded-2xl border border-white/5 text-center">
                                            <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">File d'attente</div>
                                            <div class="font-mono font-black text-2xl text-blue-400">${queue?.length || 0}</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-center md:text-right flex flex-col items-center md:items-end gap-6">
                                    ${isSessionActive ? `
                                        <div>
                                            <div class="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em] mb-2">Code Fréquence</div>
                                            <div class="text-6xl font-mono font-black text-white tracking-[0.2em] mb-6 text-glow">${joinKey}</div>
                                        </div>
                                        <a href="${robloxUrl}" class="glass-btn px-10 py-5 rounded-[24px] font-black text-base flex items-center gap-4 hover:scale-105 transition-all bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.15)] uppercase tracking-widest italic">
                                            <i data-lucide="play" class="w-6 h-6 fill-current"></i> Revenir en jeu
                                        </a>
                                    ` : `
                                        <div class="bg-red-500/10 border border-red-500/30 p-8 rounded-[32px] text-center backdrop-blur-xl">
                                            <i data-lucide="lock" class="w-12 h-12 text-red-500 mx-auto mb-4"></i>
                                            <div class="text-sm font-black text-red-400 uppercase tracking-[0.2em]">Session Fermée</div>
                                            <p class="text-[10px] text-gray-600 mt-2 uppercase font-bold tracking-widest">Fréquences radio hors-ligne</p>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${newsHtml}
                            <button onclick="actions.openCallPage()" class="glass-panel p-5 rounded-3xl border border-red-500/20 bg-red-500/[0.02] flex items-center gap-5 hover:bg-red-500/5 transition-all group ${!isSessionActive ? 'opacity-50 cursor-not-allowed grayscale' : ''}">
                                <div class="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-all shrink-0 border border-red-500/20">
                                    <i data-lucide="phone-call" class="w-6 h-6"></i>
                                </div>
                                <div class="text-left">
                                    <div class="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Central d'Urgence</div>
                                    <div class="text-white font-bold text-sm uppercase tracking-tight italic">Contacter le 911</div>
                                </div>
                                <i data-lucide="chevron-right" class="w-5 h-5 text-gray-700 ml-auto group-hover:text-white transition-all"></i>
                            </button>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <button onclick="actions.setHubPanel('notifications')" class="glass-panel group p-8 rounded-[32px] border border-blue-500/20 bg-[#0a0a0c] hover:border-blue-500/50 transition-all text-left relative overflow-hidden flex flex-col h-64">
                                <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                                <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-auto border border-blue-500/20 group-hover:scale-110 transition-transform">
                                    <i data-lucide="bell" class="w-7 h-7"></i>
                                </div>
                                <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Messages</h3>
                                <p class="text-xs text-gray-600 font-bold uppercase tracking-widest mt-1">Flux système & News</p>
                                ${state.notifications.length > 0 ? `<div class="absolute top-8 right-8 w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>` : ''}
                            </button>
                            <button onclick="actions.setHubPanel('jobs')" class="glass-panel group p-8 rounded-[32px] border border-emerald-500/20 bg-[#0a0c0a] hover:border-emerald-500/50 transition-all text-left relative overflow-hidden flex flex-col h-64">
                                <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                                <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-auto border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                    <i data-lucide="briefcase" class="w-7 h-7"></i>
                                </div>
                                <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Pôle Emploi</h3>
                                <p class="text-xs text-gray-600 font-bold uppercase tracking-widest mt-1">Métiers & Carrières</p>
                            </button>
                            <button onclick="actions.setHubPanel('lawyers_list')" class="glass-panel group p-8 rounded-[32px] border border-purple-500/20 bg-[#0b0a0c] hover:border-purple-500/50 transition-all text-left relative overflow-hidden flex flex-col h-64">
                                <div class="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
                                <div class="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-auto border border-purple-500/20 group-hover:scale-110 transition-transform">
                                    <i data-lucide="scale" class="w-7 h-7"></i>
                                </div>
                                <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Barreau</h3>
                                <p class="text-xs text-gray-600 font-bold uppercase tracking-widest mt-1">Défenseurs de la ville</p>
                            </button>
                            ${isJustice ? `
                                <button onclick="actions.setHubPanel('services'); setTimeout(() => actions.setServicesTab('justice_docket'), 100);" class="glass-panel group p-8 rounded-[32px] border border-purple-500/40 bg-purple-900/5 hover:border-purple-500 transition-all text-left relative overflow-hidden flex flex-col h-64">
                                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                                    <div class="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-auto border border-purple-500/30 group-hover:scale-110 transition-transform">
                                        <i data-lucide="gavel" class="w-7 h-7"></i>
                                    </div>
                                    <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Magistrature</h3>
                                    <p class="text-xs text-purple-300/60 font-bold uppercase tracking-widest mt-1">Dossiers Judiciaires</p>
                                </button>
                            ` : `
                                <button onclick="actions.setHubPanel('bank')" class="glass-panel group p-8 rounded-[32px] border border-emerald-500/20 bg-[#0a0c0a] hover:border-emerald-500/50 transition-all text-left relative overflow-hidden flex flex-col h-64">
                                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
                                    <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-auto border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                        <i data-lucide="landmark" class="w-7 h-7"></i>
                                    </div>
                                    <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Ma Banque</h3>
                                    <p class="text-xs text-gray-600 font-bold uppercase tracking-widest mt-1">Soldes & Virements</p>
                                </button>
                            `}
                            <button onclick="actions.setHubPanel('assets')" class="glass-panel group p-8 rounded-[32px] border border-indigo-500/20 bg-[#0a0a0c] hover:border-indigo-500/50 transition-all text-left relative overflow-hidden flex flex-col h-64">
                                <div class="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
                                <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-auto border border-indigo-500/20 group-hover:scale-110 transition-transform">
                                    <i data-lucide="gem" class="w-7 h-7"></i>
                                </div>
                                <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Patrimoine</h3>
                                <p class="text-xs text-gray-600 font-bold uppercase tracking-widest mt-1">Sac à dos & Propriétés</p>
                            </button>
                            <button onclick="actions.setHubPanel('enterprise')" class="glass-panel group p-8 rounded-[32px] border border-blue-500/20 bg-[#0a0b0c] hover:border-blue-500/50 transition-all text-left relative overflow-hidden flex flex-col h-64">
                                <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                                <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-auto border border-blue-500/20 group-hover:scale-110 transition-transform">
                                    <i data-lucide="building-2" class="w-7 h-7"></i>
                                </div>
                                <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Commerce</h3>
                                <p class="text-xs text-gray-600 font-bold uppercase tracking-widest mt-1">Gestion de Société</p>
                            </button>
                            ${hasServiceAccess && !isJustice ? `
                                <button onclick="actions.setHubPanel('services')" class="glass-panel group p-8 rounded-[32px] border border-blue-500/30 bg-blue-900/5 hover:border-blue-500 transition-all text-left relative overflow-hidden flex flex-col h-64 ${!inServiceGuild ? 'grayscale opacity-60' : ''}">
                                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                                    <div class="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-auto border border-blue-500/30 group-hover:scale-110 transition-transform">
                                        <i data-lucide="siren" class="w-7 h-7"></i>
                                    </div>
                                    <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Services Publics</h3>
                                    <p class="text-xs text-blue-300/60 font-bold uppercase tracking-widest mt-1">${!inServiceGuild ? 'Accès Restreint' : 'Gouvernement & CAD'}</p>
                                    ${!inServiceGuild ? '<div class="absolute bottom-8 right-8 text-red-500"><i data-lucide="lock" class="w-5 h-5"></i></div>' : ''}
                                </button>
                            ` : isIllegal ? `
                                <button onclick="actions.setHubPanel('illicit')" class="glass-panel group p-8 rounded-[32px] border border-red-500/30 bg-red-900/5 hover:border-red-500 transition-all text-left relative overflow-hidden flex flex-col h-64 ${!inIllegalGuild ? 'grayscale opacity-60' : ''}">
                                    <div class="absolute -right-6 -top-6 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
                                    <div class="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 mb-auto border border-red-500/30 group-hover:scale-110 transition-transform">
                                        <i data-lucide="skull" class="w-7 h-7"></i>
                                    </div>
                                    <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter">Monde Criminel</h3>
                                    <p class="text-xs text-red-300/60 font-bold uppercase tracking-widest mt-1">${!inIllegalGuild ? 'Fréquence Cryptée' : 'Gangs & Marché Noir'}</p>
                                    ${!inIllegalGuild ? '<div class="absolute bottom-8 right-8 text-red-600"><i data-lucide="lock" class="w-5 h-5"></i></div>' : ''}
                                </button>
                            ` : `
                                <div class="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.01] opacity-40 flex flex-col items-center justify-center text-center h-64">
                                    <i data-lucide="briefcase" class="w-10 h-10 text-gray-700 mb-4"></i>
                                    <div class="text-sm font-black text-gray-600 uppercase tracking-widest">En attente d'affectation</div>
                                </div>
                            `}
                        </div>
                    </div>
                    <div class="py-20 text-center opacity-20">
                        <div class="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500">TFRP Operating System • v4.5.1 Gold Edition</div>
                    </div>
                 </div>
            </div>
        `;
    } 
    else if (state.activeHubPanel === 'profile') content = ProfileView();
    else if (state.activeHubPanel === 'notifications') content = NotificationsView();
    else if (state.activeHubPanel === 'jobs') content = JobCenterView();
    else if (state.activeHubPanel === 'lawyers_list') content = LawyersListView();
    else if (state.activeHubPanel === 'staff_list') {
        const staffList = [...(state.staffMembers || [])];
        staffList.sort((a, b) => {
            const aF = state.adminIds.includes(a.id);
            const bF = state.adminIds.includes(b.id);
            return (aF === bF) ? 0 : aF ? -1 : 1;
        });

        content = `
            <div class="animate-fade-in h-full flex flex-col bg-[#050505]">
                ${refreshBanner('yellow')}
                <div class="px-8 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative z-10 shrink-0">
                    <div>
                        <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                            <i data-lucide="shield" class="w-8 h-8 text-yellow-500"></i>
                            Équipe Administrative
                        </h2>
                        <div class="flex items-center gap-3 mt-1">
                             <span class="text-[10px] text-yellow-500/60 font-black uppercase tracking-widest">Conseil Supérieur</span>
                             <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                             <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">${staffList.length} Membre(s) Actif(s)</span>
                        </div>
                    </div>
                    <div class="bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-2xl flex items-center gap-4 shadow-xl">
                        <div class="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Staff en Ligne</div>
                        <div class="text-xl font-mono font-black text-white">${state.onDutyStaff.length}</div>
                        <i data-lucide="users-round" class="w-4 h-4 text-emerald-500"></i>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar p-8 pb-20">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        ${staffList.map(s => {
                            const isFounder = state.adminIds.includes(s.id);
                            const status = state.discordStatuses[s.id] || 'offline';
                            const statusColor = { online: 'bg-green-500', idle: 'bg-yellow-500', dnd: 'bg-red-500', offline: 'bg-zinc-600' }[status];
                            return `
                            <div class="glass-panel p-8 rounded-[40px] border ${isFounder ? 'border-yellow-500/30 bg-yellow-500/[0.02]' : 'border-white/5'} flex flex-col gap-6 relative overflow-hidden transition-all group shadow-2xl">
                                <div class="absolute -right-10 -top-10 w-48 h-48 ${isFounder ? 'bg-yellow-500/5' : 'bg-white/5'} rounded-full blur-3xl pointer-events-none group-hover:opacity-100 transition-opacity"></div>
                                <div class="flex justify-between items-start relative z-10">
                                    <div class="relative">
                                        <div class="w-20 h-20 rounded-[28px] border-2 ${isFounder ? 'border-yellow-500/30' : 'border-white/10'} p-1 bg-black shadow-2xl">
                                            <img src="${s.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-full h-full rounded-[22px] object-cover">
                                        </div>
                                        <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${statusColor} border-4 border-[#0a0a0a] shadow-xl"></div>
                                    </div>
                                    <span class="px-4 py-1.5 rounded-xl ${isFounder ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-white/5 text-gray-500 border-white/10'} text-[10px] font-black uppercase tracking-widest border shadow-lg italic">
                                        ${isFounder ? 'Fondation' : 'Staff'}
                                    </span>
                                </div>
                                <div class="relative z-10">
                                    <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter truncate group-hover:text-yellow-400 transition-colors">${s.username}</h3>
                                    <div class="text-[9px] text-gray-600 font-mono mt-1 uppercase tracking-widest">UID: ${s.id.substring(0,12)}</div>
                                </div>
                                <div class="mt-auto pt-6 border-t border-white/5 grid grid-cols-2 gap-3 relative z-10">
                                    <div class="flex flex-col items-center gap-1 p-3 rounded-2xl bg-black/40 border border-white/5">
                                        <div class="text-[8px] text-gray-600 font-black uppercase tracking-widest">Console</div>
                                        <div class="flex items-center gap-2">
                                            <div class="w-2 h-2 rounded-full ${s.is_on_duty ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}"></div>
                                            <span class="text-[10px] font-bold ${s.is_on_duty ? 'text-emerald-400' : 'text-gray-500'} uppercase">${s.is_on_duty ? 'Live' : 'OFF'}</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col items-center gap-1 p-3 rounded-2xl bg-black/40 border border-white/5">
                                        <div class="text-[8px] text-gray-600 font-black uppercase tracking-widest">Discord</div>
                                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${status}</span>
                                    </div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    else if (state.activeHubPanel === 'enterprise') content = EnterpriseView();
    else if (state.activeHubPanel === 'bank') content = BankView();
    else if (state.activeHubPanel === 'assets') content = AssetsView();
    else if (state.activeHubPanel === 'illicit') content = IllicitView();
    else if (state.activeHubPanel === 'staff') content = StaffView();
    else if (state.activeHubPanel === 'services') content = ServicesView();
    else if (state.activeHubPanel === 'emergency_call') {
        content = `
            <div class="animate-fade-in h-full flex flex-col bg-[#050505]">
                ${refreshBanner('red')}
                <div class="flex-1 flex items-center justify-center p-8">
                    <div class="glass-panel p-10 rounded-[48px] w-full max-w-2xl border border-red-500/20 shadow-[0_0_80px_rgba(239,68,68,0.1)] relative overflow-hidden">
                        <div class="absolute top-0 left-0 w-full h-3 bg-red-600"></div>
                        <div class="flex items-center gap-6 mb-10">
                            <div class="w-20 h-20 bg-red-500/10 rounded-[28px] flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl">
                                <i data-lucide="phone-call" class="w-10 h-10 animate-pulse"></i>
                            </div>
                            <div>
                                <h2 class="text-4xl font-black text-white uppercase italic tracking-tighter">Appel d'Urgence</h2>
                                <p class="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Système CAD Centralisé • Los Angeles</p>
                            </div>
                        </div>
                        ${isSessionActive ? `
                            <form onsubmit="actions.createEmergencyCall(event)" class="space-y-8 relative z-10">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label class="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] ml-1 mb-2 block">Unité Requise</label>
                                        <select name="service" class="glass-input p-4 rounded-2xl w-full text-sm bg-black/40 font-bold text-white uppercase tracking-wider">
                                            <option value="police">L.A. Police Dept</option>
                                            <option value="ems">L.A. Fire Dept</option>
                                            <option value="dot">L.A. Transport (DOT)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] ml-1 mb-2 block">Localisation</label>
                                        <input type="text" list="streets" name="location" placeholder="Nom de rue / n° bâtiment" class="glass-input w-full p-4 rounded-2xl text-sm bg-black/40 font-mono font-bold" required>
                                        <datalist id="streets">${CONFIG.STREET_NAMES.map(s => `<option value="${s}">`).join('')}</datalist>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] ml-1 mb-2 block">Nature de l'incident</label>
                                    <textarea name="description" rows="4" placeholder="Décrivez brièvement la situation..." class="glass-input w-full p-5 rounded-3xl text-sm bg-black/40 font-medium leading-relaxed italic" required></textarea>
                                </div>
                                <button type="submit" class="glass-btn w-full py-5 rounded-3xl font-black text-xl bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30 flex items-center justify-center gap-4 transition-all transform active:scale-95 uppercase tracking-widest italic">
                                    <i data-lucide="radio" class="w-6 h-6"></i> Émettre le Signal
                                </button>
                            </form>
                        ` : `
                            <div class="text-center py-16 opacity-30">
                                <i data-lucide="radio-off" class="w-24 h-24 text-gray-600 mx-auto mb-6"></i>
                                <h3 class="text-xl font-black text-white uppercase tracking-[0.3em]">Services Indisponibles</h3>
                                <p class="text-xs text-gray-500 mt-2">Aucun central actif en dehors des sessions officielles.</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    const generateNavItems = () => {
        const navItem = (panel, icon, label, color = 'text-white', customAction = null) => {
            const isActive = state.activeHubPanel === panel;
            const bgClass = isActive 
                ? 'bg-gradient-to-r from-blue-600/20 to-transparent border-l-4 border-blue-500 text-white shadow-xl shadow-blue-500/5' 
                : 'text-gray-500 hover:text-white hover:bg-white/5 border-l-4 border-transparent';
            
            let lockIcon = '';
            if (panel === 'services' && !inServiceGuild) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto opacity-50"></i>';
            if (panel === 'illicit' && !inIllegalGuild) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto opacity-50"></i>';
            if (panel === 'staff' && !(Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder)) lockIcon = '<i data-lucide="lock" class="w-3 h-3 text-red-500 ml-auto opacity-50"></i>';
            
            const badge = (panel === 'notifications' && state.notifications.length > 0) ? `<span class="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>` : '';

            return `
                <button onclick="${customAction || `actions.setHubPanel('${panel}')`}; actions.toggleSidebar();" class="group w-full text-left px-5 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-4 cursor-pointer rounded-r-2xl ${bgClass} mb-1">
                    <div class="p-2 rounded-xl ${isActive ? 'bg-blue-500/20 shadow-inner' : 'bg-white/5 group-hover:bg-white/10'} transition-colors"><i data-lucide="${icon}" class="w-4 h-4 ${isActive ? color : 'text-gray-600 group-hover:text-white'}"></i></div>
                    ${label}
                    ${badge || lockIcon}
                </button>
            `;
        };

        const hasStaffAccess = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
        const char = state.activeCharacter;
        const isEnterpriseOwner = state.myEnterprises?.length > 0;
        const currentJob = (char?.job === 'unemployed' && isEnterpriseOwner) ? 'pdg' : (char?.job || 'unemployed');
        const isJustice = currentJob === 'juge' || currentJob === 'procureur';
        const hasServiceAccess = ['leo', 'lafd', 'ladot', 'lawyer', 'maire', 'adjoint', 'juge', 'procureur'].includes(currentJob);
        const isIllegal = char?.alignment === 'illegal';

        if (isBypass) return '';

        const renderSection = (id, label, itemsHtml) => {
            const isCollapsed = state.ui.sidebarCollapsedSections.includes(id);
            return `
                <div class="mt-8 mb-2">
                    <button onclick="actions.toggleSidebarSection('${id}')" class="w-full px-6 py-2 flex justify-between items-center group">
                        <span class="text-[9px] font-black text-gray-700 uppercase tracking-[0.5em] flex items-center gap-3 transition-colors group-hover:text-gray-400">${label}</span>
                        <i data-lucide="${isCollapsed ? 'plus' : 'minus'}" class="w-2.5 h-2.5 text-gray-800 transition-colors group-hover:text-gray-500"></i>
                    </button>
                    <div class="${isCollapsed ? 'hidden' : 'block'} animate-fade-in">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        };

        const explorationHtml = `
            ${navItem('main', 'layout-grid', 'Accueil', 'text-blue-400')}
            ${navItem('notifications', 'bell', 'Actualités', 'text-blue-400')}
            ${navItem('jobs', 'briefcase', 'Pôle Emploi', 'text-emerald-400')}
            ${navItem('lawyers_list', 'scale', 'Avocats', 'text-purple-400')}
            ${navItem('staff_list', 'users-round', 'Administration', 'text-yellow-400')}
        `;

        const managementHtml = `
            ${navItem('bank', 'landmark', 'Banque', 'text-emerald-400')}
            ${navItem('assets', 'gem', 'Patrimoine', 'text-indigo-400')}
            ${navItem('enterprise', 'building-2', 'Entreprise', 'text-blue-400')}
            ${isJustice ? navItem('services', 'scale', 'Justice', 'text-purple-400', "actions.setHubPanel('services'); setTimeout(() => actions.setServicesTab('justice_docket'), 100)") : ''}
            ${hasServiceAccess && !isJustice ? navItem('services', 'siren', 'Services Publics', 'text-blue-400') : ''}
            ${isIllegal ? navItem('illicit', 'skull', 'Clandestinité', 'text-red-400') : ''}
        `;

        const terminalHtml = hasStaffAccess ? navItem('staff', 'shield-alert', 'Commandement', 'text-purple-400') : '';

        return `
            ${renderSection('explor', 'Exploration', explorationHtml)}
            ${renderSection('manage', 'Gestion Perso', managementHtml)}
            ${hasStaffAccess ? renderSection('term', 'Console Terminal', terminalHtml) : ''}
        `;
    };

    const sidebarContent = `
        <div onclick="actions.setHubPanel('profile')" class="p-8 pb-4 shrink-0 relative overflow-hidden cursor-pointer group">
            <div class="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none group-hover:from-blue-900/20 transition-all"></div>
            <div class="relative z-10 flex items-center gap-4">
                <div class="relative w-14 h-14 shrink-0 group-hover:scale-105 transition-transform">
                    <div class="absolute inset-0 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <img src="${u.avatar}" class="w-full h-full rounded-2xl border-2 border-white/10 relative z-10 object-cover shadow-2xl">
                    ${u.avatar_decoration ? `<img src="${u.avatar_decoration}" class="absolute top-1/2 left-1/2 w-[125%] h-[125%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style="max-width:none">` : ''}
                </div>
                <div class="overflow-hidden flex-1">
                    <h3 class="font-black text-white truncate text-sm group-hover:text-blue-300 transition-colors uppercase tracking-tight italic">${u.username}</h3>
                    <p class="text-[9px] text-blue-400 font-black uppercase tracking-widest truncate mt-0.5">${state.activeCharacter ? `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}` : 'Identité non chargée'}</p>
                </div>
            </div>
        </div>
        <div class="px-6 mb-4 space-y-2 shrink-0">
            <div class="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                     <div class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                     <span class="text-[8px] text-gray-500 font-black uppercase tracking-widest">Serveur ERLC</span>
                </div>
                <div class="text-[10px] font-mono font-black text-white">${currentPlayers || 0}/${maxPlayers || 42}</div>
            </div>
            <div class="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                     <div class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                     <span class="text-[8px] text-gray-500 font-black uppercase tracking-widest">Staff Service</span>
                </div>
                <div class="text-[10px] font-mono font-black text-white">${state.onDutyStaff?.length || 0}</div>
            </div>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar px-2">
            ${generateNavItems()}
        </div>
        <div class="p-6 border-t border-white/5 shrink-0 bg-[#0c0c0e]">
            <div class="grid grid-cols-2 gap-3">
                <button onclick="actions.backToSelect()" class="w-full glass-btn-secondary py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center justify-center gap-3">
                    <i data-lucide="users" class="w-4 h-4"></i>
                </button>
                <button onclick="actions.confirmLogout()" class="w-full glass-btn-secondary py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 border-red-500/20 flex items-center justify-center gap-3">
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                </button>
            </div>
        </div>
    `;

    const mobileNav = `
        <div class="md:hidden fixed bottom-0 left-0 w-full bg-[#050505]/95 backdrop-blur-3xl border-t border-white/10 z-50 flex justify-around items-center pb-[env(safe-area-inset-bottom)] h-20">
            <button onclick="actions.setHubPanel('main')" class="flex-1 py-3 flex flex-col items-center gap-1 ${state.activeHubPanel === 'main' ? 'text-blue-500' : 'text-gray-600'}"><i data-lucide="layout-grid" class="w-6 h-6"></i></button>
            <button onclick="actions.setHubPanel('notifications')" class="flex-1 py-3 flex flex-col items-center gap-1 ${state.activeHubPanel === 'notifications' ? 'text-blue-500' : 'text-gray-600'}"><i data-lucide="bell" class="w-6 h-6"></i></button>
            <button onclick="actions.toggleSidebar()" class="flex-1 py-3 flex flex-col items-center gap-1 text-white relative group"><div class="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/10 -mt-6 shadow-2xl backdrop-blur-xl group-active:scale-95 transition-all"><i data-lucide="${state.ui.sidebarOpen ? 'x' : 'menu'}" class="w-7 h-7"></i></div></button>
            <button onclick="actions.setHubPanel('bank')" class="flex-1 py-3 flex flex-col items-center gap-1 ${state.activeHubPanel === 'bank' ? 'text-emerald-500' : 'text-gray-600'}"><i data-lucide="landmark" class="w-6 h-6"></i></button>
            <button onclick="actions.setHubPanel('jobs')" class="flex-1 py-3 flex flex-col items-center gap-1 ${state.activeHubPanel === 'jobs' ? 'text-emerald-500' : 'text-gray-600'}"><i data-lucide="briefcase" class="w-6 h-6"></i></button>
        </div>
    `;

    const mobileMenuOverlay = `
        <div class="md:hidden fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${state.ui.sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}" onclick="actions.toggleSidebar()"></div>
        <aside class="md:hidden fixed top-0 bottom-0 left-0 w-72 z-[200] bg-[#08080a]/95 backdrop-blur-3xl border-r border-white/10 transition-transform duration-500 transform ${state.ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col shadow-2xl">
            ${sidebarContent}
        </aside>
    `;

    // MODE STANDALONE : Pas de sidebar, barre de navigation avec bouton retour
    if (standaloneMode) {
        return `
            <div class="flex h-full w-full bg-[#050505] relative overflow-hidden flex-col">
                <nav class="p-6 border-b border-white/5 flex justify-between items-center bg-[#08080a] z-50 shrink-0">
                    <div class="flex items-center gap-4">
                        <button onclick="actions.backToSelect()" class="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10 group flex items-center gap-3">
                            <i data-lucide="arrow-left" class="w-5 h-5 group-hover:-translate-x-1 transition-transform"></i>
                            <span class="text-[10px] font-black uppercase tracking-widest">Retour au sélecteur</span>
                        </button>
                    </div>
                    <div class="font-black text-white tracking-tighter italic uppercase text-lg">TFRP <span class="text-blue-500">Panel</span></div>
                    <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <i data-lucide="user-circle" class="w-6 h-6 text-blue-400"></i>
                    </div>
                </nav>
                <main class="flex-1 relative overflow-hidden h-full">
                    <div class="h-full overflow-hidden relative z-0 flex flex-col">${content}</div>
                </main>
            </div>
        `;
    }

    return `
        <div class="flex h-full w-full bg-[#050505] relative overflow-hidden">
            ${mobileNav}${mobileMenuOverlay}
            <aside class="hidden md:flex relative top-0 bottom-0 left-0 z-[100] w-72 h-[100dvh] bg-[#08080a]/95 backdrop-blur-3xl border-r border-white/5 flex-col shadow-2xl">
                ${sidebarContent}
            </aside>
            <main class="flex-1 flex flex-col relative overflow-hidden h-full">
                <div class="md:hidden p-5 flex items-center justify-between border-b border-white/5 bg-[#050505] z-30 pt-[env(safe-area-inset-top)] shadow-2xl">
                    <div class="font-black text-white tracking-tighter italic uppercase text-lg">TFRP <span class="text-blue-500">Panel</span></div>
                    <div class="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <i data-lucide="shield-check" class="w-4 h-4 text-blue-400"></i>
                    </div>
                </div>
                <div class="flex-1 overflow-hidden relative z-0 flex flex-col pb-20 md:pb-0">${content}</div>
            </main>
        </div>
    `;
};
