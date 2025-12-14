
import { state } from '../state.js';
import { createHeistLobby, startHeistSync } from '../services.js';
import { showToast, showModal } from '../ui.js';
import { CONFIG } from '../config.js';

// CATALOGUES CONSTANTS
export const BLACK_MARKET_CATALOG = {
    light: [
        { name: "Beretta M9", price: 2800, icon: "target" },
        { name: "Revolver", price: 3000, icon: "circle-dot" },
        { name: "Colt M1911", price: 3500, icon: "target" },
        { name: "Colt Python", price: 4200, icon: "circle-dot" },
        { name: "Desert Eagle", price: 4500, icon: "triangle" },
        { name: "Lampe Torche", price: 20, icon: "flashlight" },
        { name: "Marteau", price: 20, icon: "hammer" },
        { name: "Lockpick", price: 50, icon: "key" },
        { name: "Sac", price: 100, icon: "shopping-bag" },
        { name: "Coupe Verre", price: 350, icon: "scissors" },
        { name: "Puce ATM", price: 2300, icon: "cpu" }
    ],
    medium: [
        { name: "TEC 9", price: 9500, icon: "zap" },
        { name: "SKORPION", price: 14500, icon: "zap" },
        { name: "Remington 870", price: 16500, icon: "move" },
        { name: "Kriss Vector", price: 20500, icon: "zap" }
    ],
    heavy: [
        { name: "PPSH 41", price: 40000, icon: "flame" },
        { name: "AK47", price: 50000, icon: "flame" }
    ],
    sniper: [
        { name: "Remington MSR", price: 60000, icon: "crosshair" }
    ]
};

// HEIST LOCATIONS DATA
export const HEIST_LOCATIONS = {
    house: [
        "7001 Academy PL. Banlieue", "7002 Academy PL. Banlieue", "7011 Franklin court Banlieue",
        "7012 Franklin court Banlieue", "7013 Franklin court Banlieue", "7021 Franklin court Banlieue",
        "7022 Franklin court Banlieue", "7023 Franklin court Banlieue", "7041 Franklin court Banlieue",
        "7042 Emerson HD Banlieue", "7043 Franklin court Banlieue", "7044 Franklin court Banlieue",
        "7051 Franklin court Banlieue", "7052 Franklin court Banlieue", "7053 Franklin court Banlieue",
        "7054 Emerson HD Banlieue", "7055 Franklin court Banlieue", "7056 Franklin court Banlieue",
        "7061 Franklin court Banlieue", "7062 Franklin court Banlieue", "7063 Joyner RD Banlieue",
        "7064 Franklin court Banlieue", "7091 Pineview circle Banlieue", "7092 Pineview circle Banlieue",
        "7094 Franklin court Banlieue", "7095 Franklin court Banlieue",
        "11091 Maple Street", "11092 Maple Street"
    ],
    atm: [
        "Atm 1 - Banque Ville-centre", "Atm 2 - Station service Ville-centre (bat 2001)",
        "Atm 3 - Main Street Ville-centre (bat 2072)", "Atm 4 - Indépendance Partway Ville-centre (bat 4031)",
        "Atm 5 - Géorgia Avenue (Bat 3041)", "Atm 6 - Orchard boulevard (bat 3091)",
        "Atm 7 - Colonial drive (bat 6021)", "Atm 8 - Elm Street Ville-Nord (bat 11101)",
        "Atm 9 - Maple Street Ville-Nord (bat 11041)", "Atm 10 - Maple Street Ville-Nord (bat 11042)"
    ],
    gas: [
        "2001 Liberty Way", "2063 Freedom Avenue", "2201 Liberty Way Station service",
        "4031 Indepence Parkway", "4061 Fairfax Road", "6021 Colonial drive Station service",
        "11101 Grand ST Station service", "11051 Maple Street", "11082 Maple street"
    ]
};

export const HEIST_DATA = [
    { id: 'car_theft', name: 'Vol de Voiture', min: 10000, max: 70000, time: 300, rate: 100, icon: 'car', requiresValidation: false, requiresGang: true, risk: 1, teamMin: 1, teamMax: 2, requiresLocation: false },
    { id: 'atm', name: 'Braquage ATM', min: 1000, max: 5000, time: 90, rate: 100, icon: 'credit-card', requiresValidation: false, requiresGang: false, risk: 2, teamMin: 1, teamMax: 3, requiresLocation: true },
    { id: 'house', name: 'Cambriolage Maison', min: 100, max: 500, time: 60, rate: 100, icon: 'home', requiresValidation: false, requiresGang: false, risk: 1, teamMin: 3, teamMax: 5, requiresLocation: true },
    { id: 'gas', name: 'Station Service', min: 500, max: 1000, time: 105, rate: 100, icon: 'fuel', requiresValidation: false, requiresGang: false, risk: 2, teamMin: 2, teamMax: 6, requiresLocation: true },
    { id: 'truck', name: 'Fourgon Blindé', min: 250000, max: 500000, time: 900, rate: 15, icon: 'truck', requiresValidation: true, requiresGang: true, risk: 4, teamMin: 5, teamMax: 10, requiresLocation: false },
    { id: 'jewelry', name: 'Bijouterie', min: 500000, max: 700000, time: 1020, rate: 10, icon: 'gem', requiresValidation: true, requiresGang: true, risk: 5, teamMin: 2, teamMax: 9, requiresLocation: false },
    { id: 'bank', name: 'Banque Centrale', min: 700000, max: 1000000, time: 1200, rate: 5, icon: 'landmark', requiresValidation: true, requiresGang: true, risk: 5, teamMin: 7, teamMax: 13, requiresLocation: false }
];

export const DRUG_DATA = {
    coke: {
        name: 'Cocaïne',
        harvest: { 100: 5, 500: 7, 1000: 35 }, // Minutes
        process: { 100: 5, 500: 10, 1000: 30 },
        sell: { 100: 7, 500: 13, 1000: 25 },
        pricePerG: 60
    },
    weed: {
        name: 'Cannabis',
        harvest: { 100: 3, 500: 5, 1000: 25 },
        process: { 100: 5, 500: 7, 1000: 25 },
        sell: { 100: 5, 500: 10, 1000: 25 },
        pricePerG: 20
    }
};

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-4 py-3 mb-4 bg-red-900/10 border-y border-red-500/10 gap-3 shrink-0">
        <div class="text-xs text-red-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </div>
            <span><span class="font-bold">DARKNET ACCESS</span> • V2.4 (Encrypted)</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-red-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser
        </button>
    </div>
`;

export const IllicitView = () => {
    // GUILD CHECK
    if (!state.user.guilds || !state.user.guilds.includes(CONFIG.GUILD_ILLEGAL)) {
         return `
            <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div class="glass-panel max-w-md w-full p-8 rounded-2xl border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                    <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                        <i data-lucide="skull" class="w-10 h-10"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Accès Restreint</h2>
                    <p class="text-gray-400 mb-8">Pour accéder au réseau criminel, vous devez faire partie du serveur Discord Illégal.</p>
                    <a href="${CONFIG.INVITE_ILLEGAL}" target="_blank" class="glass-btn w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                        Rejoindre le Discord
                    </a>
                </div>
            </div>
         `;
    }

    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Chargement du réseau crypté...</div>';

    // NAVIGATION TABS
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
        { id: 'gangs', label: 'Mon Gang', icon: 'users' },
        { id: 'heists', label: 'Braquages', icon: 'timer' },
        { id: 'drugs', label: 'Labo', icon: 'flask-conical' },
        { id: 'bounties', label: 'Contrats', icon: 'crosshair' },
        { id: 'market', label: 'Marché Noir', icon: 'shopping-cart' }
    ];

    const currentTab = ['dashboard', 'gangs', 'bounties', 'market', 'heists', 'drugs'].includes(state.activeIllicitTab) ? state.activeIllicitTab : 'dashboard';
    const hasGang = !!state.activeGang;

    // --- CONTENT SWITCHER ---
    let content = '';

    // 1. DASHBOARD
    if (state.activeIllicitTab === 'dashboard') {
        
        // Activity Status
        let heistWidget = '';
        if (state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
             const hData = HEIST_DATA.find(h => h.id === state.activeHeistLobby.heist_type);
             heistWidget = `
                <button onclick="actions.setIllicitTab('heists')" class="glass-panel p-4 rounded-xl border border-orange-500/30 flex items-center justify-between animate-pulse-slow w-full hover:bg-white/5 transition-colors group text-left">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-orange-500/20 rounded-lg text-orange-400 group-hover:scale-110 transition-transform"><i data-lucide="timer" class="w-6 h-6"></i></div>
                        <div>
                            <div class="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Braquage en cours</div>
                            <div class="text-white font-bold text-lg">${hData ? hData.name : 'Opération'}</div>
                            ${state.activeHeistLobby.location ? `<div class="text-xs text-gray-400 mt-0.5"><i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${state.activeHeistLobby.location}</div>` : ''}
                        </div>
                    </div>
                    <div id="heist-timer-display" class="font-mono text-2xl font-bold text-white">00:00</div>
                </button>
             `;
        } else {
             heistWidget = `
                <button onclick="actions.setIllicitTab('heists')" class="glass-panel p-4 rounded-xl border border-white/5 flex items-center gap-4 w-full hover:bg-white/5 transition-colors group text-left opacity-75 hover:opacity-100">
                    <div class="p-3 bg-white/10 rounded-lg text-gray-400 group-hover:text-white transition-colors"><i data-lucide="play" class="w-6 h-6"></i></div>
                    <div>
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Aucune activité</div>
                        <div class="text-gray-300 font-bold text-lg">Lancer un Braquage</div>
                    </div>
                </button>
             `;
        }

        let labWidget = '';
        if(hasGang && state.activeGang.myStatus === 'accepted' && state.drugLab && state.drugLab.current_batch && state.drugLab.current_batch.end_time > Date.now()) {
             const batch = state.drugLab.current_batch;
             const drugInfo = DRUG_DATA[batch.type];
             labWidget = `
                <button onclick="actions.setIllicitTab('drugs')" class="glass-panel p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between animate-pulse-slow w-full hover:bg-white/5 transition-colors group text-left">
                    <div class="flex items-center gap-4">
                        <div class="p-3 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform"><i data-lucide="flask-conical" class="w-6 h-6"></i></div>
                        <div>
                            <div class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Production Labo</div>
                            <div class="text-white font-bold text-lg">${drugInfo ? drugInfo.name : 'Drogue'} (${batch.amount}g)</div>
                            <div class="text-xs text-gray-400 mt-0.5 capitalize">${batch.stage}</div>
                        </div>
                    </div>
                    <div id="drug-timer-display" class="font-mono text-2xl font-bold text-white">00:00</div>
                </button>
             `;
        }

        content = `
            <div class="flex flex-col h-full overflow-hidden gap-6">
                 <!-- WIDGETS ROW (Fixed) -->
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                     ${heistWidget}
                     ${labWidget ? labWidget : ''}
                 </div>

                 <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                     <!-- LEFT: STATS & FEED (Scrollable) -->
                     <div class="lg:col-span-2 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                        <!-- Quick Stats -->
                        <div class="grid grid-cols-3 gap-4 shrink-0">
                            <div class="glass-panel p-4 rounded-xl border border-white/5">
                                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Argent Sale (Liquide)</div>
                                <div class="text-xl font-bold text-white font-mono">$${state.bankAccount.cash_balance.toLocaleString()}</div>
                            </div>
                            <div class="glass-panel p-4 rounded-xl border border-white/5">
                                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Mon Gang</div>
                                <div class="text-xl font-bold text-purple-400 truncate">${state.activeGang ? state.activeGang.name : 'Aucun'}</div>
                            </div>
                            <div class="glass-panel p-4 rounded-xl border border-white/5">
                                <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Réputation</div>
                                <div class="text-xl font-bold text-white">Niveau 1</div>
                            </div>
                        </div>

                        <!-- Recent Activity / News -->
                        <div class="glass-panel p-6 rounded-2xl border border-white/5 flex-1">
                            <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="radio" class="w-5 h-5 text-red-500"></i> Fil d'actualité illégal</h3>
                            <div class="space-y-4">
                                ${state.bounties.slice(0, 3).map(b => `
                                    <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div class="p-2 bg-red-500/10 rounded-lg text-red-400"><i data-lucide="crosshair" class="w-4 h-4"></i></div>
                                        <div class="flex-1">
                                            <div class="text-sm font-bold text-white">Nouveau Contrat : ${b.target_name}</div>
                                            <div class="text-xs text-gray-500">Prime: $${b.amount.toLocaleString()}</div>
                                        </div>
                                        <button onclick="actions.setIllicitTab('bounties')" class="text-xs text-gray-400 hover:text-white px-2 py-1 bg-white/5 rounded">Voir</button>
                                    </div>
                                `).join('')}
                                <div class="text-xs text-gray-600 text-center italic mt-4">Restez discret. La police écoute.</div>
                            </div>
                        </div>
                     </div>

                     <!-- RIGHT: SHORTCUTS (Scrollable) -->
                     <div class="flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                        <button onclick="actions.setIllicitTab('gangs')" class="glass-panel p-5 rounded-2xl hover:border-purple-500/50 transition-all text-left group border border-white/5">
                            <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-3 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <i data-lucide="users" class="w-5 h-5"></i>
                            </div>
                            <div class="font-bold text-white">Gérer Gang</div>
                            <div class="text-xs text-gray-500 mt-1">Membres, Coffre & Territoire</div>
                        </button>

                        <button onclick="actions.setIllicitTab('market')" class="glass-panel p-5 rounded-2xl hover:border-red-500/50 transition-all text-left group border border-white/5">
                            <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 mb-3 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                            </div>
                            <div class="font-bold text-white">Marché Noir</div>
                            <div class="text-xs text-gray-500 mt-1">Armes & Outils illégaux</div>
                        </button>

                        <button onclick="actions.setIllicitTab('drugs')" class="glass-panel p-5 rounded-2xl hover:border-emerald-500/50 transition-all text-left group border border-white/5 ${!hasGang || state.activeGang?.myStatus !== 'accepted' ? 'opacity-50' : ''}">
                            <div class="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                <i data-lucide="flask-conical" class="w-5 h-5"></i>
                            </div>
                            <div class="font-bold text-white">Laboratoire</div>
                            <div class="text-xs text-gray-500 mt-1">Production de stupéfiants</div>
                            ${!hasGang || state.activeGang?.myStatus !== 'accepted' ? '<div class="mt-2 text-[9px] text-red-400 uppercase font-bold bg-red-500/10 inline-block px-1.5 py-0.5 rounded">Gang Requis</div>' : ''}
                        </button>
                     </div>
                </div>
            </div>
        `;
    }

    // 2. GANGS
    else if (state.activeIllicitTab === 'gangs') {
        const myGang = state.activeGang;
        
        if (myGang) {
            // SHOW MY GANG INTERFACE
            const isLeader = (myGang.myRank === 'leader' || myGang.myRank === 'co_leader') && myGang.myStatus === 'accepted';
            const isPending = myGang.myStatus === 'pending';
            
            const leaderName = myGang.leader ? `${myGang.leader.first_name} ${myGang.leader.last_name}` : 'Inconnu';
            const coLeaderName = myGang.co_leader ? `${myGang.co_leader.first_name} ${myGang.co_leader.last_name}` : 'Aucun';
            
            const allMembers = myGang.members || [];
            const acceptedMembers = allMembers.filter(m => m.status === 'accepted');
            const pendingMembers = allMembers.filter(m => m.status === 'pending');
            const balance = myGang.balance || 0;

            if (isPending) {
                content = `
                    <div class="flex items-center justify-center h-full p-4">
                        <div class="glass-panel p-10 rounded-[40px] max-w-lg w-full text-center border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)] relative overflow-hidden">
                            <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                            
                            <div class="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-6 relative">
                                <i data-lucide="hourglass" class="w-10 h-10 animate-pulse"></i>
                            </div>
                            
                            <h2 class="text-3xl font-bold text-white mb-2">Candidature en cours</h2>
                            <div class="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-300 text-sm font-bold border border-purple-500/20 mb-8">
                                ${myGang.name}
                            </div>
                            
                            <div class="text-gray-400 mb-8 leading-relaxed text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                                Votre dossier a été transmis au chef de gang. Vous ne pouvez pas postuler ailleurs tant que cette demande n'a pas été traitée.
                            </div>
                            
                            <button onclick="actions.leaveGang()" class="glass-btn-secondary px-8 py-3 rounded-xl text-red-300 hover:bg-red-500/10 border-red-500/20 hover:text-red-400 w-full transition-all">
                                Annuler ma demande
                            </button>
                        </div>
                    </div>
                `;
            } else {
                content = `
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
                        <!-- LEFT COL: MEMBERS -->
                        <div class="glass-panel p-0 rounded-2xl col-span-1 lg:col-span-2 flex flex-col overflow-hidden border border-white/5">
                            <div class="p-6 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                                <div class="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 class="text-3xl font-bold text-white mb-1 tracking-tight">${myGang.name}</h2>
                                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold uppercase tracking-wider">
                                            <i data-lucide="crown" class="w-3 h-3"></i> ${myGang.myRank}
                                        </div>
                                    </div>
                                    <button onclick="actions.leaveGang()" class="text-xs text-red-400 hover:text-red-300 underline mt-2">Quitter le Gang</button>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div class="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Chef</div>
                                        <div class="text-white font-bold text-sm">${leaderName}</div>
                                    </div>
                                    <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div class="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Sous-Chef</div>
                                        <div class="text-white font-bold text-sm">${coLeaderName}</div>
                                    </div>
                                </div>
                            </div>

                             <div class="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#080808]">
                                <table class="w-full text-left text-sm">
                                    <thead class="bg-white/5 text-gray-500 uppercase text-xs sticky top-0 backdrop-blur-md z-10">
                                        <tr>
                                            <th class="p-4 font-bold tracking-wider">Nom</th>
                                            <th class="p-4 font-bold tracking-wider">Rang</th>
                                            ${isLeader ? '<th class="p-4 text-right font-bold tracking-wider">Actions</th>' : ''}
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-white/5">
                                        ${acceptedMembers.map(m => `
                                            <tr class="hover:bg-white/5 transition-colors">
                                                <td class="p-4 font-bold text-white">${m.characters?.first_name} ${m.characters?.last_name}</td>
                                                <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${m.rank === 'leader' ? 'bg-red-500/20 text-red-400' : m.rank === 'co_leader' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-400'} border border-white/5">${m.rank}</span></td>
                                                ${isLeader ? `
                                                    <td class="p-4 text-right flex justify-end gap-2">
                                                        ${m.character_id !== state.activeCharacter.id ? `
                                                            <button onclick="actions.gangDistribute('${m.character_id}', '${m.characters?.first_name}')" class="p-2 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 border border-emerald-500/20" title="Donner Argent"><i data-lucide="banknote" class="w-4 h-4"></i></button>
                                                            ${m.rank !== 'leader' ? `<button onclick="actions.manageGangRequest('${m.character_id}', 'kick')" class="p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 border border-red-500/20" title="Virer"><i data-lucide="user-x" class="w-4 h-4"></i></button>` : ''}
                                                        ` : '<span class="text-xs text-gray-600 italic">Vous</span>'}
                                                    </td>
                                                `: ''}
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            ${isLeader && pendingMembers.length > 0 ? `
                                <div class="p-4 bg-orange-900/10 border-t border-orange-500/20 shrink-0">
                                    <h3 class="font-bold text-orange-400 mb-3 text-xs uppercase tracking-widest flex items-center gap-2">
                                        <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                        Candidatures (${pendingMembers.length})
                                    </h3>
                                    <div class="space-y-2">
                                        ${pendingMembers.map(p => `
                                            <div class="p-3 bg-black/40 rounded-lg flex justify-between items-center border border-white/5">
                                                <div class="font-bold text-white text-sm pl-2">${p.characters?.first_name} ${p.characters?.last_name}</div>
                                                <div class="flex gap-2">
                                                    <button onclick="actions.manageGangRequest('${p.character_id}', 'accept')" class="bg-emerald-500 hover:bg-emerald-400 text-white p-1.5 rounded transition-colors"><i data-lucide="check" class="w-4 h-4"></i></button>
                                                    <button onclick="actions.manageGangRequest('${p.character_id}', 'reject')" class="bg-red-500 hover:bg-red-400 text-white p-1.5 rounded transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- RIGHT COL: FINANCES -->
                        <div class="space-y-6 flex flex-col overflow-y-auto custom-scrollbar">
                            <!-- GANG SAFE (COFFRE FORT) -->
                            <div class="glass-panel p-6 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-black border-purple-500/20 shadow-2xl relative overflow-hidden shrink-0">
                                <div class="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                <h3 class="font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                                    <i data-lucide="vault" class="w-5 h-5 text-purple-400"></i> Coffre-Fort
                                </h3>
                                <div class="text-4xl font-mono font-bold text-white mb-8 text-center tracking-tight">$ ${balance.toLocaleString()}</div>
                                
                                <div class="space-y-3 relative z-10">
                                    <form onsubmit="actions.gangDeposit(event)" class="flex gap-2">
                                        <input type="number" name="amount" placeholder="Montant Dépôt" class="glass-input flex-1 p-3 rounded-xl text-sm bg-black/40 border-white/10 focus:border-purple-500/50" required min="1">
                                        <button type="submit" class="glass-btn-secondary bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-4 rounded-xl border-emerald-500/20 transition-all"><i data-lucide="arrow-down" class="w-5 h-5"></i></button>
                                    </form>
                                    ${isLeader ? `
                                        <form onsubmit="actions.gangWithdraw(event)" class="flex gap-2">
                                            <input type="number" name="amount" placeholder="Montant Retrait" class="glass-input flex-1 p-3 rounded-xl text-sm bg-black/40 border-white/10 focus:border-purple-500/50" required min="1">
                                            <button type="submit" class="glass-btn-secondary bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 rounded-xl border-red-500/20 transition-all"><i data-lucide="arrow-up" class="w-5 h-5"></i></button>
                                        </form>
                                    ` : ''}
                                    <p class="text-[10px] text-gray-500 text-center mt-2 uppercase tracking-wide opacity-50">Transactions tracées par le staff</p>
                                </div>
                            </div>

                            <div class="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
                                <h3 class="font-bold text-white mb-4">Avantages Gang</h3>
                                <div class="space-y-3">
                                    <div class="flex items-center gap-3 text-sm text-gray-300 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div class="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><i data-lucide="check" class="w-4 h-4"></i></div>
                                        Accès Gros Braquages
                                    </div>
                                    <div class="flex items-center gap-3 text-sm text-gray-300 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div class="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><i data-lucide="check" class="w-4 h-4"></i></div>
                                        Laboratoire de Drogue
                                    </div>
                                    <div class="flex items-center gap-3 text-sm text-gray-300 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div class="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><i data-lucide="check" class="w-4 h-4"></i></div>
                                        Taxe Auto (25%)
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else {
            // LIST OF GANGS TO JOIN
            content = `
                <div class="max-w-5xl mx-auto h-full flex flex-col">
                    <div class="text-center mb-8 shrink-0">
                        <h2 class="text-3xl font-bold text-white tracking-tight">Organisations Criminelles</h2>
                        <p class="text-gray-400 text-sm mt-2">Rejoignez un syndicat du crime pour étendre votre influence.</p>
                    </div>

                    <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${state.gangs.map(g => `
                                <div class="glass-panel p-6 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group flex flex-col relative overflow-hidden">
                                    <div class="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>
                                    
                                    <div class="flex justify-between items-start mb-6 relative z-10">
                                        <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-purple-400 font-bold text-xl shadow-lg">
                                            ${g.name[0]}
                                        </div>
                                    </div>
                                    
                                    <h3 class="text-xl font-bold text-white mb-1 relative z-10">${g.name}</h3>
                                    <div class="text-xs text-gray-500 mb-6 relative z-10">Chef: <span class="text-gray-300 font-bold">${g.leader ? g.leader.first_name : 'Inconnu'}</span></div>
                                    
                                    <button onclick="actions.applyToGang('${g.id}')" class="mt-auto glass-btn-secondary w-full py-3 rounded-xl text-sm font-bold hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/30 transition-all relative z-10">
                                        Postuler
                                    </button>
                                </div>
                            `).join('')}
                            ${state.gangs.length === 0 ? '<div class="col-span-full text-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">Aucun gang enregistré.</div>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // 3. BOUNTIES (CONTRATS)
    else if (state.activeIllicitTab === 'bounties') {
        content = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
                <!-- FORM -->
                <div class="glass-panel p-6 rounded-2xl h-fit overflow-y-auto custom-scrollbar">
                    <h3 class="font-bold text-white mb-6 flex items-center gap-2 text-lg"><i data-lucide="file-plus" class="w-5 h-5 text-red-400"></i> Nouveau Contrat</h3>
                    <form onsubmit="actions.createNewBounty(event)" class="space-y-5" autocomplete="off">
                        <div class="relative z-20">
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Cible</label>
                            <div class="relative">
                                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                                <input type="text" 
                                    id="bounty_target_input"
                                    placeholder="Rechercher citoyen..." 
                                    value="${state.bountySearchQuery}"
                                    oninput="actions.searchBountyTarget(this.value)"
                                    class="glass-input w-full p-3 pl-10 rounded-xl text-sm ${state.bountyTarget ? 'text-red-400 font-bold border-red-500/50' : ''}" 
                                    autocomplete="off"
                                    ${state.bountyTarget ? 'readonly' : ''}
                                >
                                ${state.bountyTarget ? `
                                    <button type="button" onclick="actions.clearBountyTarget()" class="absolute right-3 top-3 text-gray-500 hover:text-white p-1"><i data-lucide="x" class="w-4 h-4"></i></button>
                                ` : ''}
                            </div>
                             ${!state.bountyTarget ? `
                                <div class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar ${state.gangCreation.searchResults.length === 0 ? 'hidden' : ''}">
                                    ${state.gangCreation.searchResults.map(r => `
                                        <div onclick="actions.selectBountyTarget('${r.id}', '${r.first_name} ${r.last_name}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                                            <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">${r.first_name[0]}</div>
                                            <div class="text-sm text-gray-200">${r.first_name} ${r.last_name}</div>
                                        </div>
                                    `).join('')}
                                </div>
                             ` : ''}
                        </div>
                        <div>
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Prime ($)</label>
                            <input type="number" name="amount" min="10000" max="100000" placeholder="10000 - 100000" class="glass-input w-full p-3 rounded-xl text-sm font-mono" required>
                        </div>
                        <div>
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Raison (RP)</label>
                            <textarea name="description" rows="4" placeholder="Motif du contrat (facultatif mais recommandé)..." class="glass-input w-full p-3 rounded-xl text-sm leading-relaxed"></textarea>
                        </div>
                        <button type="submit" class="glass-btn w-full py-4 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20 flex items-center justify-center gap-2">
                            <i data-lucide="crosshair" class="w-4 h-4"></i> Mettre à prix
                        </button>
                        <p class="text-[10px] text-gray-500 text-center italic">Montant débité immédiatement (Liquide).</p>
                    </form>
                </div>

                <!-- LIST -->
                <div class="glass-panel p-0 rounded-2xl lg:col-span-2 flex flex-col h-full border border-white/5 overflow-hidden">
                    <div class="p-6 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                        <div class="flex justify-between items-center mt-4">
                            <h3 class="font-bold text-white flex items-center gap-2 text-lg"><i data-lucide="list" class="w-5 h-5 text-gray-400"></i> Tableau des Primes</h3>
                            <div class="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 border border-white/5">${state.bounties.filter(b => b.status === 'active').length} Actifs</div>
                        </div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#080808] space-y-4">
                        ${state.bounties.map(b => {
                            const isCreator = b.creator_id === state.activeCharacter.id;
                            const isActive = b.status === 'active';
                            
                            return `
                            <div class="bg-white/5 p-5 rounded-2xl border ${isActive ? 'border-white/5 hover:border-red-500/30' : 'border-gray-800 opacity-60'} relative group transition-all">
                                <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div>
                                        <div class="flex items-center gap-3 mb-1">
                                            <span class="text-xl font-bold text-white tracking-tight">${b.target_name}</span>
                                            ${!isActive ? `<span class="text-[10px] px-2 py-0.5 bg-gray-700 rounded text-gray-300 uppercase font-bold tracking-wider">${b.status}</span>` : ''}
                                        </div>
                                        <div class="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                            <span class="bg-white/5 px-2 py-0.5 rounded">Commanditaire: ${isCreator ? 'Vous' : 'Anonyme'}</span>
                                        </div>
                                        ${b.description ? `<div class="text-sm text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5 italic leading-relaxed max-w-md">"${b.description}"</div>` : ''}
                                    </div>
                                    <div class="text-right shrink-0">
                                        <div class="text-3xl font-mono font-bold text-red-400 tracking-tighter mb-1">$${b.amount.toLocaleString()}</div>
                                        <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Récompense</div>
                                    </div>
                                </div>
                                
                                ${isCreator && isActive ? `
                                    <div class="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                                        <button onclick="actions.resolveBounty('${b.id}', 'CANCEL')" class="text-xs text-gray-500 hover:text-white px-4 py-2 transition-colors">Annuler le contrat</button>
                                        <button onclick="actions.resolveBounty('${b.id}')" class="glass-btn-secondary px-4 py-2 rounded-lg text-xs font-bold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-2">
                                            <i data-lucide="check" class="w-3 h-3"></i> Payer Prime
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        `}).join('')}
                        ${state.bounties.length === 0 ? '<div class="text-center text-gray-500 py-20 flex flex-col items-center"><i data-lucide="check-circle" class="w-12 h-12 mb-4 opacity-20"></i>Aucun contrat en cours.</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // 4. MARCHÉ NOIR
    else if (state.activeIllicitTab === 'market' || state.activeIllicitTab.startsWith('market-')) {
         
         // SESSION CHECK FOR MARKET
         if (!state.activeGameSession) {
             content = `
                <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                    <div class="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                        <i data-lucide="lock" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-4">Réseau Hors-Ligne</h2>
                    <p class="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Les fournisseurs ne sont pas en ville actuellement. Le marché noir n'est accessible que lorsqu'une session de jeu est active (ville peuplée).
                    </p>
                    <div class="mt-8 bg-white/5 px-6 py-2 rounded-full text-sm text-gray-500 border border-white/5 inline-flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-red-500"></span> Statut : Indisponible
                    </div>
                </div>
            `;
         } else {
             const catTabs = [
                { id: 'light', label: 'Légères / Outils', icon: 'target' },
                { id: 'medium', label: 'Moyennes', icon: 'zap' },
                { id: 'heavy', label: 'Lourdes', icon: 'flame' },
                { id: 'sniper', label: 'Snipers', icon: 'crosshair' }
            ];
    
            let currentSubTab = state.activeIllicitTab === 'market' ? 'light' : state.activeIllicitTab.replace('market-', '');
    
            // Filter Items Logic
            let currentItems = BLACK_MARKET_CATALOG[currentSubTab] || [];
            if (state.blackMarketSearch) {
                const q = state.blackMarketSearch.toLowerCase();
                currentItems = currentItems.filter(i => i.name.toLowerCase().includes(q));
            }
    
            content = `
                <div class="h-full flex flex-col min-h-0">
                     
                     <!-- HEADER -->
                     <div class="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 shrink-0">
                        <div class="relative w-full md:w-96">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                            <input type="text" 
                                oninput="actions.searchBlackMarket(this.value)" 
                                value="${state.blackMarketSearch}"
                                placeholder="Rechercher arme, outil..." 
                                class="glass-input pl-10 pr-4 py-3 rounded-xl w-full text-sm">
                        </div>
                        <div class="text-right whitespace-nowrap px-6 py-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
                            <div class="text-xs text-gray-400 uppercase tracking-widest font-bold">Portefeuille</div>
                            <div class="text-xl font-mono font-bold text-emerald-400">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                        </div>
                    </div>
    
                     <!-- TABS -->
                    <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-4 mb-2 shrink-0">
                        ${catTabs.map(tab => `
                            <button onclick="actions.setIllicitTab('market-${tab.id}')" 
                                class="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border shrink-0 ${currentSubTab === tab.id 
                                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20' 
                                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}">
                                <i data-lucide="${tab.icon}" class="w-4 h-4"></i>
                                ${tab.label}
                            </button>
                        `).join('')}
                    </div>
    
                    <!-- GRID -->
                    <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            ${currentItems.length === 0 ? '<div class="col-span-full text-center text-gray-500 py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">Aucun article trouvé.</div>' : ''}
                            ${currentItems.map(item => {
                                const canAfford = state.bankAccount.cash_balance >= item.price;
                                return `
                                    <div class="glass-panel p-5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group relative overflow-hidden flex flex-col">
                                        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        
                                        <div class="flex justify-between items-start mb-6 relative z-10">
                                            <div class="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-red-400 transition-colors shadow-inner">
                                                <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                                            </div>
                                            <div class="font-mono text-lg font-bold ${canAfford ? 'text-emerald-400' : 'text-red-500'}">
                                                $${item.price.toLocaleString()}
                                            </div>
                                        </div>
                                        
                                        <div class="relative z-10 mb-6 flex-1">
                                            <h3 class="text-lg font-bold text-white mb-1 leading-tight">${item.name}</h3>
                                            <div class="text-xs text-gray-500 uppercase tracking-wide">Import Illégal</div>
                                        </div>
                                        
                                        <button onclick="actions.buyIllegalItem('${item.name}', ${item.price})" ${!canAfford ? 'disabled' : ''} class="relative z-10 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${canAfford ? 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] shadow-lg' : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'}">
                                            ${canAfford ? 'Acheter' : 'Fonds Manquants'}
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
         }
    }

    // 5. BRAQUAGES
    else if (state.activeIllicitTab === 'heists') {
        // --- NEW CHECK: SESSION ACTIVE ---
        if (!state.activeGameSession) {
            content = `
                <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                    <div class="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-6 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                        <i data-lucide="timer-off" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-4">Opérations Suspendues</h2>
                    <p class="text-gray-400 max-w-md mx-auto leading-relaxed">
                        Les équipes logistiques mettent en place le matériel nécessaire. Aucune opération majeure n'est possible tant que la session de jeu n'est pas active.
                    </p>
                    <div class="mt-8 bg-white/5 px-6 py-2 rounded-full text-sm text-gray-500 border border-white/5 inline-flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                        Statut : <span class="text-orange-400 font-bold uppercase">Stand-by</span>
                    </div>
                </div>
            `;
        } else if (state.activeHeistLobby) {
            // LOBBY ACTIVE (Joined or Host)
            const lobby = state.activeHeistLobby;
            const hData = HEIST_DATA.find(h => h.id === lobby.heist_type);
            const isHost = lobby.host_id === state.activeCharacter.id;
            const isFinished = lobby.status === 'finished';
            const isActive = lobby.status === 'active';
            const isPendingReview = lobby.status === 'pending_review';

            // Check if current user is PENDING acceptance
            const myMembership = state.heistMembers.find(m => m.character_id === state.activeCharacter.id);
            if (myMembership && myMembership.status === 'pending') {
                 content = `
                    <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                        <div class="loader-spinner w-16 h-16 border-4 mb-6"></div>
                        <h2 class="text-2xl font-bold text-white mb-2">Demande envoyée</h2>
                        <p class="text-gray-400 max-w-md mx-auto mb-8">En attente de l'acceptation du chef d'équipe <b>${lobby.host_name}</b> pour rejoindre le braquage.</p>
                        <button onclick="actions.leaveLobby()" class="glass-btn-secondary px-6 py-2 rounded-xl text-sm font-bold border-red-500/30 text-red-400 hover:bg-red-500/10">Annuler ma demande</button>
                    </div>
                 `;
            } else {
                // Filter pending members for host view
                const pendingMembers = state.heistMembers.filter(m => m.status === 'pending');

                content = `
                    <div class="max-w-3xl mx-auto h-full flex flex-col justify-center animate-fade-in">
                        <div class="glass-panel p-10 rounded-[40px] text-center border border-orange-500/20 shadow-[0_0_60px_rgba(234,88,12,0.1)] relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600"></div>
                            
                            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider mb-6 border border-orange-500/20">
                                ${isPendingReview ? 'Validation Staff Requise' : isActive ? 'Opération en cours' : isFinished ? 'Mission Terminée' : 'Phase de Préparation'}
                            </div>
                            
                            <h2 class="text-5xl font-black text-white mb-2 tracking-tight uppercase italic">${hData ? hData.name : 'Inconnu'}</h2>
                            <p class="text-gray-400 mb-8">Chef d'équipe : <span class="text-white font-bold">${lobby.host_name || 'Inconnu'}</span></p>
                            
                            ${lobby.location ? `
                                <div class="bg-white/5 p-4 rounded-2xl inline-flex items-center gap-3 mb-8 border border-white/5 mx-auto max-w-md">
                                    <div class="p-2 bg-orange-500/20 rounded-lg text-orange-400"><i data-lucide="map-pin" class="w-5 h-5"></i></div>
                                    <span class="text-sm font-bold text-white text-left">${lobby.location}</span>
                                </div>
                            ` : ''}

                            ${isActive ? `
                                <div class="text-7xl font-mono font-bold text-orange-500 mb-8 tracking-tighter drop-shadow-lg" id="heist-timer-display">
                                    00:00
                                </div>
                                <div class="mb-8 text-sm text-gray-400 px-8 max-w-lg mx-auto">
                                    <i data-lucide="alert-triangle" class="w-4 h-4 inline mr-1 text-orange-500"></i>
                                    Une fois le délai écoulé, vous pourrez valider la réussite de la mission. Restez en vie.
                                </div>
                                <div class="flex flex-col gap-4 justify-center items-center w-full max-w-sm mx-auto">
                                     ${isHost ? `<button onclick="actions.finishHeist()" class="glass-btn bg-emerald-600 hover:bg-emerald-500 w-full py-4 rounded-xl font-bold text-lg animate-pulse shadow-lg shadow-emerald-500/20">Terminer l'opération</button>` : `<div class="text-sm text-gray-500 animate-pulse bg-black/20 px-4 py-2 rounded-full">En attente du signal du chef...</div>`}
                                     
                                     ${isHost ? `
                                        <button onclick="actions.stopHeist()" class="text-xs text-red-500 hover:text-red-300 underline opacity-60 hover:opacity-100 transition-opacity">Abandonner / Arrêter le braquage</button>
                                     ` : ''}
                                </div>
                            ` : isPendingReview ? `
                                 <div class="bg-blue-900/20 border border-blue-500/20 p-6 rounded-2xl text-blue-200 mb-6">
                                    <div class="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-400"><i data-lucide="shield-check" class="w-6 h-6"></i></div>
                                    <p class="font-bold mb-1">Vérification Administrative</p>
                                    <p class="text-sm opacity-70">Le braquage est terminé. Un administrateur doit valider la réussite de l'action RP pour débloquer les fonds.</p>
                                 </div>
                                 <button onclick="actions.leaveLobby()" class="text-gray-500 hover:text-white underline text-sm">Quitter le lobby</button>
                            ` : `
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8 max-w-2xl mx-auto">
                                    <!-- TEAM LIST -->
                                    <div class="bg-white/5 rounded-2xl p-6 border border-white/5">
                                        <h3 class="font-bold text-white mb-4 flex items-center justify-between text-sm uppercase tracking-wide">
                                            Équipe d'assaut
                                            <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">${state.heistMembers.filter(m => m.status === 'accepted').length}/${hData.teamMax}</span>
                                        </h3>
                                        <div class="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                                            ${state.heistMembers.filter(m => m.status === 'accepted').map(m => `
                                                <div class="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                                    <div class="flex items-center gap-3">
                                                        <div class="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">${m.characters?.first_name[0]}</div>
                                                        <span class="text-sm text-gray-200 font-medium">${m.characters?.first_name}</span>
                                                    </div>
                                                    <span class="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    
                                    <!-- REQUESTS LIST -->
                                    ${isHost ? `
                                        <div class="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6">
                                             <h3 class="font-bold text-orange-300 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                                                <i data-lucide="user-plus" class="w-4 h-4"></i> Demandes (${pendingMembers.length})
                                             </h3>
                                             <div class="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                                                ${pendingMembers.length === 0 ? '<div class="text-xs text-gray-500 italic py-4 text-center">Aucune demande.</div>' : pendingMembers.map(m => `
                                                    <div class="flex items-center justify-between p-2 bg-black/20 rounded-xl border border-orange-500/10">
                                                        <span class="text-sm text-gray-300 ml-2 truncate max-w-[80px]">${m.characters?.first_name}</span>
                                                        <div class="flex gap-1">
                                                            <button onclick="actions.acceptHeistApplicant('${m.character_id}')" class="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white p-1.5 rounded-lg transition-colors"><i data-lucide="check" class="w-4 h-4"></i></button>
                                                            <button onclick="actions.rejectHeistApplicant('${m.character_id}')" class="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-1.5 rounded-lg transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                             </div>
                                        </div>
                                    ` : `
                                        <div class="bg-white/5 rounded-2xl p-6 flex flex-col justify-center items-center text-center opacity-50 border border-white/5">
                                            <i data-lucide="lock" class="w-8 h-8 text-gray-600 mb-2"></i>
                                            <div class="text-xs text-gray-500">Seul le chef gère les recrutements.</div>
                                        </div>
                                    `}
                                </div>

                                <div class="flex gap-4 w-full max-w-lg mx-auto">
                                    <button onclick="actions.leaveLobby()" class="glass-btn-secondary flex-1 py-4 rounded-xl text-sm font-bold border-white/10 hover:bg-white/10">Annuler</button>
                                    ${isHost ? `<button onclick="actions.startHeistLobby(${hData.time})" class="glass-btn flex-1 py-4 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-600/20">Lancer l'assaut</button>` : ''}
                                </div>
                            `}
                        </div>
                    </div>
                `;
            }
        } else {
            // LISTE DES BRAQUAGES (GRID)
            const activeLobbies = state.availableHeistLobbies.filter(l => l.status === 'active');
            const setupLobbies = state.availableHeistLobbies.filter(l => l.status === 'setup');

            content = `
                <div class="h-full flex flex-col min-h-0">
                    
                    <div class="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-2">
                        <!-- ACTIVE / RECRUITING SECTION -->
                        ${[...activeLobbies, ...setupLobbies].length > 0 ? `
                            <div class="mb-8">
                                <h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider text-opacity-80 px-1">
                                    <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> En Cours / Recrutement
                                </h3>
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    ${[...activeLobbies, ...setupLobbies].map(l => {
                                        const h = HEIST_DATA.find(d => d.id === l.heist_type);
                                        const isSetup = l.status === 'setup';
                                        const isOpen = l.access_type === 'open';
                                        
                                        // Calculate time
                                        let timeDisplay = '';
                                        if(!isSetup) {
                                            const remaining = Math.max(0, Math.ceil((new Date(l.end_time).getTime() - Date.now()) / 1000));
                                            timeDisplay = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
                                        }

                                        return `
                                            <div class="glass-panel p-5 rounded-2xl border ${isSetup ? 'border-blue-500/30' : 'border-orange-500/30'} flex flex-col gap-4 relative overflow-hidden group">
                                                <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity"><i data-lucide="${h.icon}" class="w-20 h-20"></i></div>
                                                
                                                <div class="flex justify-between items-start relative z-10">
                                                    <div>
                                                        <div class="text-[10px] font-bold ${isSetup ? 'text-blue-400' : 'text-orange-400'} uppercase tracking-widest mb-1">${isSetup ? 'Recrutement' : 'En Cours'}</div>
                                                        <div class="font-bold text-white text-lg">${h.name}</div>
                                                    </div>
                                                    ${!isSetup ? `<div class="font-mono font-bold text-xl text-orange-500 bg-black/30 px-2 py-1 rounded">${timeDisplay}</div>` : ''}
                                                </div>
                                                
                                                <div class="flex items-center gap-2 text-xs text-gray-400 relative z-10">
                                                    <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">${l.host_name[0]}</div>
                                                    Chef: <span class="text-white">${l.host_name}</span>
                                                </div>

                                                ${isSetup ? `
                                                    <button onclick="actions.requestJoinLobby('${l.id}')" class="mt-auto glass-btn-secondary w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-white/10 border-white/10 transition-colors relative z-10">
                                                        ${isOpen ? '<i data-lucide="unlock" class="w-3 h-3 text-green-400"></i> Rejoindre' : '<i data-lucide="lock" class="w-3 h-3 text-purple-400"></i> Postuler'}
                                                    </button>
                                                ` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- AVAILABLE HEISTS GRID -->
                        <div>
                            <h3 class="text-sm font-bold text-white mb-4 uppercase tracking-wider text-opacity-80 px-1">Nouvelle Opération</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                ${HEIST_DATA.map(h => {
                                    const isLocked = h.requiresGang && (!hasGang || state.activeGang?.myStatus !== 'accepted');
                                    
                                    // Visual Risk Dots
                                    let riskDots = '';
                                    for(let i=0; i<5; i++) {
                                        riskDots += `<div class="w-1.5 h-1.5 rounded-full ${i < h.risk ? 'bg-red-500' : 'bg-gray-700'}"></div>`;
                                    }

                                    return `
                                        <div class="glass-panel p-0 rounded-2xl flex flex-col overflow-hidden border border-white/5 hover:border-white/20 transition-all group ${isLocked ? 'opacity-60 grayscale hover:grayscale-0' : ''}">
                                            <div class="p-5 flex items-center gap-4 border-b border-white/5 bg-white/[0.02]">
                                                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center text-orange-500 shadow-lg group-hover:scale-110 transition-transform duration-500">
                                                    <i data-lucide="${h.icon}" class="w-6 h-6"></i>
                                                </div>
                                                <div>
                                                    <h3 class="font-bold text-white text-lg">${h.name}</h3>
                                                    <div class="flex items-center gap-1 mt-1" title="Risque">
                                                        ${riskDots}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div class="p-5 flex-1 flex flex-col justify-between gap-4">
                                                <div class="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-400">
                                                    <div class="flex items-center gap-2"><i data-lucide="users" class="w-3 h-3 text-blue-400"></i> ${h.teamMin}-${h.teamMax} Joueurs</div>
                                                    <div class="flex items-center gap-2"><i data-lucide="clock" class="w-3 h-3 text-orange-400"></i> ${Math.floor(h.time/60)} min</div>
                                                    <div class="flex items-center gap-2 col-span-2"><i data-lucide="shield" class="w-3 h-3 text-purple-400"></i> ${h.requiresGang ? 'Gang Requis' : 'Indépendant'}</div>
                                                </div>
                                                
                                                <div class="flex items-end justify-between mt-2 pt-4 border-t border-white/5">
                                                    <div>
                                                        <div class="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Butin Max</div>
                                                        <div class="text-xl font-mono font-bold text-emerald-400">$${(h.max/1000).toFixed(0)}k</div>
                                                    </div>
                                                    <button onclick="actions.createLobby('${h.id}')" ${isLocked ? 'disabled' : ''} class="px-6 py-2 rounded-xl font-bold text-xs bg-white text-black hover:bg-gray-200 transition-colors ${isLocked ? 'cursor-not-allowed opacity-50' : 'shadow-lg shadow-white/10'}">
                                                        ${isLocked ? 'Bloqué' : 'Lancer'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // 6. DROGUE (LABO)
    else if (state.activeIllicitTab === 'drugs') {
         if (!hasGang || state.activeGang.myStatus !== 'accepted') {
             content = `
                <div class="flex flex-col items-center justify-center h-full text-center p-10">
                    <div class="w-20 h-20 bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 mb-6 border border-emerald-500/20">
                        <i data-lucide="lock" class="w-10 h-10"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Laboratoire Sécurisé</h2>
                    <p class="text-gray-500 max-w-sm">Vous devez être un membre validé d'un gang pour accéder aux outils de production.</p>
                </div>
             `;
         } else {
             const lab = state.drugLab;
             const inProgress = lab.current_batch; 
             
             // Production View
             if (inProgress && inProgress.end_time > Date.now()) {
                const typeName = DRUG_DATA[inProgress.type].name;
                const stageLabels = { harvest: 'Récolte', process: 'Traitement', sell: 'Vente' };
                
                content = `
                    <div class="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in relative overflow-hidden">
                        <!-- BG Effect -->
                        <div class="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none"></div>
                        
                        <div class="relative mb-10">
                            <div class="w-48 h-48 rounded-full border-4 border-emerald-900/30 flex items-center justify-center relative">
                                <div class="absolute inset-0 border-4 border-emerald-500 rounded-full border-l-transparent border-r-transparent animate-spin-slow"></div>
                                <div class="text-center z-10">
                                    <div class="text-6xl font-mono font-bold text-white tracking-tighter drop-shadow-xl" id="drug-timer-display">00:00</div>
                                    <div class="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-2 animate-pulse">En Cours</div>
                                </div>
                            </div>
                        </div>
                        
                        <h2 class="text-3xl font-bold text-white mb-2">${stageLabels[inProgress.stage]}</h2>
                        <div class="inline-block px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-lg mb-8">
                            ${inProgress.amount}g • ${typeName}
                        </div>
                        
                        <p class="text-sm text-gray-500 max-w-xs mx-auto">
                            L'opération est automatique. Vous recevrez une notification une fois le processus terminé.
                        </p>
                    </div>
                `;
             } else {
                 // Management View
                 const stocks = [
                     { id: 'coke', label: 'Cocaïne', raw: lab.stock_coke_raw, pure: lab.stock_coke_pure, color: 'text-white' },
                     { id: 'weed', label: 'Cannabis', raw: lab.stock_weed_raw, pure: lab.stock_weed_pure, color: 'text-emerald-400' }
                 ];

                 content = `
                    <div class="h-full flex flex-col min-h-0 animate-fade-in">
                        
                        <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- STOCKS -->
                            <div class="space-y-6">
                                <div class="glass-panel p-6 rounded-2xl">
                                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="package" class="w-5 h-5 text-gray-400"></i> Stocks Labo</h3>
                                    <div class="space-y-3">
                                        ${stocks.map(s => `
                                            <div class="bg-white/5 p-4 rounded-xl border border-white/5">
                                                <div class="flex justify-between items-center mb-3">
                                                    <span class="font-bold ${s.color} text-lg">${s.label}</span>
                                                    <i data-lucide="${s.id === 'coke' ? 'wind' : 'leaf'}" class="w-5 h-5 ${s.color} opacity-50"></i>
                                                </div>
                                                <div class="grid grid-cols-2 gap-3">
                                                    <div class="bg-black/30 p-3 rounded-lg border border-white/5 text-center">
                                                        <div class="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Matière Brute</div>
                                                        <div class="font-mono font-bold text-gray-300 text-lg">${s.raw}g</div>
                                                    </div>
                                                    <div class="bg-black/30 p-3 rounded-lg border border-white/5 text-center">
                                                        <div class="text-[9px] text-gray-500 uppercase font-bold tracking-wider mb-1">Produit Fini</div>
                                                        <div class="font-mono font-bold text-white text-lg">${s.pure}g</div>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                <!-- UPGRADES -->
                                <div class="glass-panel p-6 rounded-2xl">
                                     <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="zap" class="w-5 h-5 text-yellow-400"></i> Améliorations</h3>
                                     <div class="space-y-3">
                                        <div class="flex justify-between items-center p-4 bg-white/5 rounded-xl border ${lab.has_building ? 'border-emerald-500/30 bg-emerald-900/5' : 'border-white/5'}">
                                            <div>
                                                <div class="font-bold text-white text-sm">Local Sécurisé</div>
                                                <div class="text-xs text-gray-500 mt-0.5">Réduit risque descente de police</div>
                                            </div>
                                            ${lab.has_building ? '<div class="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"><i data-lucide="check" class="w-4 h-4"></i></div>' : '<button onclick="actions.buyLabComponent(\'building\', 50000)" class="text-xs font-bold bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">$50k</button>'}
                                        </div>
                                        <div class="flex justify-between items-center p-4 bg-white/5 rounded-xl border ${lab.has_equipment ? 'border-emerald-500/30 bg-emerald-900/5' : 'border-white/5'}">
                                            <div>
                                                <div class="font-bold text-white text-sm">Matériel Pro</div>
                                                <div class="text-xs text-gray-500 mt-0.5">Vitesse de production +25%</div>
                                            </div>
                                            ${lab.has_equipment ? '<div class="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500"><i data-lucide="check" class="w-4 h-4"></i></div>' : '<button onclick="actions.buyLabComponent(\'equipment\', 25000)" class="text-xs font-bold bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">$25k</button>'}
                                        </div>
                                     </div>
                                </div>
                            </div>

                            <!-- ACTIONS PANEL -->
                            <div class="glass-panel p-6 rounded-2xl flex flex-col border border-white/5">
                                 <h3 class="font-bold text-white mb-6 text-lg">Lancer une Opération</h3>
                                 
                                 <div class="flex-1 space-y-8">
                                     <!-- RECOLTE -->
                                     <form onsubmit="actions.startDrugAction('harvest', event)">
                                        <div class="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                                            <i data-lucide="sprout" class="w-4 h-4"></i> 1. Récolte
                                        </div>
                                        <div class="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                                            <select name="drug_type" class="glass-input w-full p-3 rounded-xl text-sm bg-black/40 border-white/10">
                                                <option value="weed">Cannabis (Weed)</option>
                                                <option value="coke">Cocaïne (Feuille)</option>
                                            </select>
                                            <select name="amount" class="glass-input w-full p-3 rounded-xl text-sm bg-black/40 border-white/10">
                                                <option value="100">Petite quantité (100g)</option>
                                                <option value="500">Moyenne quantité (500g)</option>
                                                <option value="1000">Grosse quantité (1kg)</option>
                                            </select>
                                            <button type="submit" class="glass-btn w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20">
                                                Lancer Récolte
                                            </button>
                                        </div>
                                     </form>

                                     <!-- TRAITEMENT -->
                                     <form onsubmit="actions.startDrugAction('process', event)">
                                        <div class="flex items-center gap-2 mb-3 text-blue-400 font-bold text-sm uppercase tracking-wider">
                                            <i data-lucide="flask-conical" class="w-4 h-4"></i> 2. Traitement
                                        </div>
                                        <div class="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                                            <select name="drug_type" class="glass-input w-full p-3 rounded-xl text-sm bg-black/40 border-white/10">
                                                <option value="weed">Séchage Weed</option>
                                                <option value="coke">Coupe Cocaïne</option>
                                            </select>
                                            <select name="amount" class="glass-input w-full p-3 rounded-xl text-sm bg-black/40 border-white/10">
                                                <option value="100">100g</option>
                                                <option value="500">500g</option>
                                                <option value="1000">1kg</option>
                                            </select>
                                            <button type="submit" class="glass-btn w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20">
                                                Lancer Traitement
                                            </button>
                                        </div>
                                     </form>
                                 </div>
                            </div>
                        </div>
                    </div>
                 `;
             }
         }
    }

    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            <!-- FIXED BANNER -->
            ${refreshBanner}
            
            <!-- FIXED HEADER NAV -->
            <div class="px-6 pb-4 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 shrink-0">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="skull" class="w-6 h-6 text-red-500"></i>
                        Réseau Criminel
                    </h2>
                    <p class="text-gray-400 text-sm">Darknet Access • <span class="text-red-400 font-bold uppercase">Connexion Sécurisée</span></p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                    ${tabs.map(t => `
                        <button onclick="actions.setIllicitTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${currentTab === t.id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- MAIN SCROLLABLE CONTENT AREA -->
            <div class="flex-1 p-6 overflow-hidden relative min-h-0">
                ${content}
            </div>
        </div>
    `;
};
