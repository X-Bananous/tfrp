
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { EnterpriseMarketView } from './enterprise/market.js';
import { EnterpriseDirectoryView } from './enterprise/directory.js';
import { EnterpriseMyCompaniesView } from './enterprise/my_companies.js';
import { EnterpriseAppointmentsView } from './enterprise/appointments.js';
import { EnterpriseManageView } from './enterprise/manage.js';

export const ICON_LIBRARY = [
    "package", "shopping-bag", "shopping-cart", "gift", "tag", "credit-card", "coins", "wallet", "banknote", "gem",
    "watch", "glasses", "shirt", "scissors", "umbrella", "key", "lock", "unlock", "map", "compass",
    "camera", "video", "mic", "headphones", "speaker", "smartphone", "laptop", "tablet", "tv", "printer",
    "book", "notebook", "pencil", "pen", "ruler", "briefcase", "archive", "folder", "file", "paperclip",
    "coffee", "beer", "wine", "martini", "cup-soda", "glass-water", "pizza", "burger", "sandwich", "cake",
    "candy", "cookie", "ice-cream", "donut", "apple", "banana", "cherry", "grape", "carrot", "drumstick",
    "utensils", "chef-hat", "refrigerator", "microwave",
    "car", "car-front", "bus", "truck", "bike", "ship", "plane", "anchor", "fuel", "wrench",
    "hammer", "screwdriver", "drill", "axe", "shovel", "nut", "settings", "gauge", "battery", "plug",
    "pill", "syringe", "stethoscope", "thermometer", "activity", "heart", "heart-pulse", "first-aid-kit", "ambulance", "siren",
    "flame", "fire-extinguisher", "droplet", "shield", "shield-check", "shield-alert", "life-buoy", "bone", "brain", "dna",
    "target", "crosshair", "swords", "skull", "ghost", "bomb", "zap", "radio", "cctv", "fingerprint",
    "footprints", "eye", "eye-off", "lock-keyhole", "venetian-mask",
    "sun", "moon", "cloud", "rain", "snowflake", "wind", "flame-kindling", "tree-pine", "tree-deciduous", "flower",
    "leaf", "feather", "bird", "cat", "dog", "fish", "paw-print", "shell", "snail", "bug",
    "home", "building", "tent", "bed", "sofa", "lamp", "door-open", "door-closed", "fan", "air-vent",
    "bath", "shower-head", "armchair", "tv-2", "router", "trash", "recycle", "box", "container", "pallet",
    "atom", "flask-conical", "flask-round", "microscope", "telescope", "rocket", "satellite", "bot", "cpu", "database",
    "server", "hard-drive", "cloud-upload", "cloud-download", "wifi", "bluetooth", "signal", "power", "keyboard", "mouse",
    "trophy", "medal", "ribbon", "crown", "ticket", "music", "guitar", "drum", "piano", "gamepad",
    "dice-5", "puzzle", "club", "spade", "diamond", "heart-handshake", "dumbbell", "flag",
    "check", "check-circle", "x", "x-circle", "alert-triangle", "alert-circle", "info", "help-circle", "star", "sun-medium",
    "bell", "bell-ring", "calendar", "clock", "timer", "hourglass", "map-pin", "navigation", "globe",
    "mail", "message-square", "phone", "thumbs-up", "thumbs-down", "smile", "frown", "meh", "user", "users"
];

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-900/10 border-b border-blue-500/10 gap-3 shrink-0 relative">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">REGISTRE DU COMMERCE</span> • Signal Certifié AES-256</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser Flux
        </button>
    </div>
`;

export const EnterpriseView = () => {
    const tabs = [
        { id: 'market', label: 'Marché Public', icon: 'shopping-cart' },
        { id: 'directory', label: 'Annuaire', icon: 'building' },
        { id: 'my_companies', label: 'Affiliations', icon: 'briefcase' },
        { id: 'appointments', label: 'Rendez-vous', icon: 'calendar-clock' }
    ];

    const currentTabId = state.activeEnterpriseTab || 'market';
    let content = '';

    if (currentTabId === 'market') content = EnterpriseMarketView();
    else if (currentTabId === 'directory') content = EnterpriseDirectoryView();
    else if (currentTabId === 'my_companies') content = EnterpriseMyCompaniesView();
    else if (currentTabId === 'appointments') content = EnterpriseAppointmentsView();
    else if (currentTabId === 'manage') content = EnterpriseManageView();
    else content = EnterpriseMarketView();

    const isManaging = currentTabId === 'manage' && state.activeEnterpriseManagement;
    const ent = state.activeEnterpriseManagement;
    const entBalance = isManaging ? (ent.name === "L.A. Auto School" ? state.gouvBank : (ent.balance || 0)) : 0;

    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            <!-- Header Block -->
            <div class="flex flex-col shrink-0">
                ${refreshBanner}
                
                <div class="px-8 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative">
                    ${!isManaging ? `
                        <div>
                            <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                                <i data-lucide="building-2" class="w-8 h-8 text-blue-500"></i>
                                Portail Entreprises
                            </h2>
                            <div class="flex items-center gap-3 mt-1">
                                 <span class="text-[10px] text-blue-500/60 font-black uppercase tracking-widest">Registre Los Angeles v4.1</span>
                                 <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                                 <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Citoyen: ${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</span>
                            </div>
                        </div>
                        <div class="flex flex-nowrap gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-white/5">
                            ${tabs.map(t => `
                                <button onclick="actions.setEnterpriseTab('${t.id}')" 
                                    class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${currentTabId === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
                                    <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="flex items-center gap-6">
                            <button onclick="actions.setEnterpriseTab('my_companies')" class="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10 group">
                                <i data-lucide="arrow-left" class="w-6 h-6 group-hover:-translate-x-1 transition-transform"></i>
                            </button>
                            <div>
                                <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                                    ${ent.name}
                                    <span class="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-black tracking-[0.2em] border border-blue-400 shadow-lg">GÉRANCE</span>
                                </h2>
                                <div class="flex items-center gap-3 mt-1">
                                    <span class="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">Trésorerie Actuelle</span>
                                    <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                                    <span class="text-sm font-mono font-bold text-emerald-400">$ ${entBalance.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-nowrap gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                            <button onclick="actions.setEnterpriseManageTab('dashboard')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 ${state.activeEnterpriseManageTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}">Infos</button>
                            <button onclick="actions.setEnterpriseManageTab('staff')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 ${state.activeEnterpriseManageTab === 'staff' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}">Staff</button>
                            <button onclick="actions.setEnterpriseManageTab('stock')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 ${state.activeEnterpriseManageTab === 'stock' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}">Articles</button>
                        </div>
                    `}
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
