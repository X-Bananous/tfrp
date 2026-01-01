
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { IllicitDashboardView } from './illicit/dashboard.js';
import { IllicitGangsView } from './illicit/gangs.js';
import { IllicitHeistsView } from './illicit/heists.js';
import { IllicitDrugsView } from './illicit/drugs.js';
import { IllicitBountiesView } from './illicit/bounties.js';
import { IllicitMarketView } from './illicit/market.js';

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
    { id: 'car_theft', name: 'Vol de Voiture', min: 5000, max: 15000, time: 300, icon: 'car', requiresValidation: false, teamMin: 1, teamMax: 2 },
    { id: 'atm', name: 'Braquage ATM', min: 1000, max: 4000, time: 90, icon: 'credit-card', requiresValidation: false, teamMin: 1, teamMax: 3, requiresLocation: true },
    { id: 'house', name: 'Cambriolage Maison', min: 2000, max: 8000, time: 60, icon: 'home', requiresValidation: false, teamMin: 3, teamMax: 5, requiresLocation: true },
    { id: 'gas', name: 'Station Service', min: 3000, max: 10000, time: 105, icon: 'fuel', requiresValidation: false, teamMin: 2, teamMax: 6, requiresLocation: true },
    { id: 'truck', name: 'Fourgon Blindé', min: 150000, max: 300000, time: 900, icon: 'truck', requiresValidation: true, teamMin: 5, teamMax: 10 },
    { id: 'jewelry', name: 'Bijouterie', min: 350000, max: 550000, time: 1020, icon: 'gem', requiresValidation: true, teamMin: 2, teamMax: 9 },
    { id: 'bank', name: 'Banque Centrale', min: 600000, max: 900000, time: 1200, icon: 'landmark', requiresValidation: true, teamMin: 7, teamMax: 13 }
];

export const DRUG_DATA = {
    coke: { name: 'Cocaïne', harvest: { 100: 5, 500: 7, 1000: 35 }, process: { 100: 5, 500: 10, 1000: 30 }, sell: { 100: 7, 500: 13, 1000: 25 }, pricePerG: 60 },
    weed: { name: 'Cannabis', harvest: { 100: 3, 500: 5, 1000: 25 }, process: { 100: 5, 500: 7, 1000: 25 }, sell: { 100: 5, 500: 10, 1000: 25 }, pricePerG: 20 }
};

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-red-900/10 border-b border-red-500/10 gap-3 shrink-0 relative">
        <div class="text-xs text-red-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </div>
            <span><span class="font-bold">DARKNET OS v4.1</span> • Signal Chiffré AES-512</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-red-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser Flux
        </button>
    </div>
`;

export const IllicitView = () => {
    if (!state.user.guilds || !state.user.guilds.includes(CONFIG.GUILD_ILLEGAL)) {
         return `
            <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-[#050505]">
                <div class="glass-panel max-w-md w-full p-8 rounded-2xl border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                    <div class="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
                        <i data-lucide="skull" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Réseau Restreint</h2>
                    <p class="text-gray-400 mb-8">L'accès à ces fréquences nécessite d'être membre du Discord Illégal.</p>
                    <a href="${CONFIG.INVITE_ILLEGAL}" target="_blank" class="glass-btn w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20">
                        <i data-lucide="external-link" class="w-5 h-5"></i>
                        Rejoindre le Réseau
                    </a>
                </div>
            </div>
         `;
    }

    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full"><div class="loader-spinner mb-4 border-red-500"></div>Initialisation du signal...</div>';

    const tabs = [
        { id: 'dashboard', label: 'Surveillance', icon: 'layout-dashboard' },
        { id: 'gangs', label: 'Gang', icon: 'users' },
        { id: 'heists', label: 'Contrats', icon: 'timer' },
        { id: 'drugs', label: 'Laboratoire', icon: 'flask-conical' },
        { id: 'bounties', label: 'Mise à prix', icon: 'crosshair' },
        { id: 'market', label: 'Marché Noir', icon: 'shopping-cart' }
    ];

    const currentTabId = state.activeIllicitTab || 'dashboard';
    let content = '';

    if (currentTabId === 'dashboard') content = IllicitDashboardView();
    else if (currentTabId === 'gangs') content = IllicitGangsView();
    else if (currentTabId === 'heists') content = IllicitHeistsView();
    else if (currentTabId === 'drugs') content = IllicitDrugsView();
    else if (currentTabId === 'bounties') content = IllicitBountiesView();
    else if (currentTabId.startsWith('market')) content = IllicitMarketView();
    else content = IllicitDashboardView();

    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            <!-- Unified Header Block -->
            <div class="flex flex-col shrink-0">
                ${refreshBanner}
                
                <div class="px-8 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative">
                    <div>
                        <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                            <i data-lucide="skull" class="w-8 h-8 text-red-500"></i>
                            Terminal Criminel
                        </h2>
                        <div class="flex items-center gap-3 mt-1">
                             <span class="text-[10px] text-red-500/60 font-black uppercase tracking-widest">Darknet Secure Link v4.1</span>
                             <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                             <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Signal Niveau 5</span>
                        </div>
                    </div>
                    <div class="flex flex-nowrap gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-white/5">
                        ${tabs.map(t => `
                            <button onclick="actions.setIllicitTab('${t.id}')" 
                                class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${(currentTabId === t.id || (t.id === 'market' && currentTabId.startsWith('market'))) ? 'bg-red-600 text-white shadow-xl shadow-red-900/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
                                <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- MAIN SCROLLABLE CONTENT AREA -->
            <div class="flex-1 p-8 overflow-hidden relative min-h-0">
                <div class="h-full overflow-hidden">
                    ${content}
                </div>
            </div>
        </div>
    `;
};
