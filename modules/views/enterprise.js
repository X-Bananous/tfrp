



import { state } from '../state.js';
import { CONFIG } from '../config.js';

// LISTE DE 250 ICONES (Lucide compatible)
const ICON_LIBRARY = [
    // COMMERCE / OBJETS
    "package", "shopping-bag", "shopping-cart", "gift", "tag", "credit-card", "coins", "wallet", "banknote", "gem",
    "watch", "glasses", "shirt", "scissors", "umbrella", "key", "lock", "unlock", "map", "compass",
    "camera", "video", "mic", "headphones", "speaker", "smartphone", "laptop", "tablet", "tv", "printer",
    "book", "notebook", "pencil", "pen", "ruler", "briefcase", "archive", "folder", "file", "paperclip",
    
    // NOURRITURE / BOISSON
    "coffee", "beer", "wine", "martini", "cup-soda", "glass-water", "pizza", "burger", "sandwich", "cake",
    "candy", "cookie", "ice-cream", "donut", "apple", "banana", "cherry", "grape", "carrot", "drumstick",
    "utensils", "chef-hat", "refrigerator", "microwave",
    
    // VEHICULES / MECANIQUE
    "car", "car-front", "bus", "truck", "bike", "ship", "plane", "anchor", "fuel", "wrench",
    "hammer", "screwdriver", "drill", "axe", "shovel", "nut", "settings", "gauge", "battery", "plug",
    
    // MEDICAL / SECOURS
    "pill", "syringe", "stethoscope", "thermometer", "activity", "heart", "heart-pulse", "first-aid-kit", "ambulance", "siren",
    "flame", "fire-extinguisher", "droplet", "shield", "shield-check", "shield-alert", "life-buoy", "bone", "brain", "dna",
    
    // ARMES / ILLÉGAL (RP)
    "target", "crosshair", "swords", "skull", "ghost", "bomb", "zap", "radio", "cctv", "fingerprint",
    "footprints", "eye", "eye-off", "lock-keyhole", "venetian-mask",
    
    // NATURE / DIVERS
    "sun", "moon", "cloud", "rain", "snowflake", "wind", "flame-kindling", "tree-pine", "tree-deciduous", "flower",
    "leaf", "feather", "bird", "cat", "dog", "fish", "paw-print", "shell", "snail", "bug",
    
    // MOBILIER / MAISON
    "home", "building", "tent", "bed", "sofa", "lamp", "door-open", "door-closed", "fan", "air-vent",
    "bath", "shower-head", "armchair", "tv-2", "router", "trash", "recycle", "box", "container", "pallet",
    
    // TECH / SCIENCE
    "atom", "flask-conical", "flask-round", "microscope", "telescope", "rocket", "satellite", "bot", "cpu", "database",
    "server", "hard-drive", "cloud-upload", "cloud-download", "wifi", "bluetooth", "signal", "power", "keyboard", "mouse",
    
    // SPORT / LOISIR
    "trophy", "medal", "ribbon", "crown", "ticket", "music", "guitar", "drum", "piano", "gamepad",
    "dice-5", "puzzle", "club", "spade", "diamond", "heart-handshake", "dumbbell", "bike", "trophy", "flag",
    
    // SYMBOLES
    "check", "check-circle", "x", "x-circle", "alert-triangle", "alert-circle", "info", "help-circle", "star", "sun-medium",
    "bell", "bell-ring", "calendar", "clock", "timer", "hourglass", "compass", "map-pin", "navigation", "globe",
    "mail", "message-square", "phone", "thumbs-up", "thumbs-down", "smile", "frown", "meh", "user", "users"
];

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-900/10 border-b border-blue-500/10 gap-3 shrink-0 z-20 relative">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">Registre du Commerce</span> • Terminal de Gestion V3.3</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser
        </button>
    </div>
`;

export const EnterpriseView = () => {
    const tabs = [
        { id: 'market', label: 'Marché Public', icon: 'shopping-cart' },
        { id: 'directory', label: 'Annuaire & Recrutement', icon: 'building' },
        { id: 'my_companies', label: 'Mes Entreprises', icon: 'briefcase' },
        { id: 'appointments', label: 'Mes Rendez-vous', icon: 'calendar-clock' }
    ];

    // Safe access to wallet
    const currentCash = state.bankAccount ? state.bankAccount.cash_balance : 0;
    const currentBank = state.bankAccount ? state.bankAccount.bank_balance : 0;
    
    // Stats Volume
    const todayStats = state.dailyEconomyStats?.[0] || { amount: 0 };
    const volumeToday = todayStats.amount;

    let content = '';

    // --- MARKET TAB ---
    if (state.activeEnterpriseTab === 'market') {
        // ... (Market Tab Code Unchanged) ...
        let items = state.enterpriseMarket || [];
        const isSessionActive = !!state.activeGameSession;
        
        if (state.marketEnterpriseFilter && state.marketEnterpriseFilter !== 'all') {
            items = items.filter(i => i.enterprise_id === state.marketEnterpriseFilter);
        }

        const enterpriseOptions = [...new Set(state.enterpriseMarket.map(i => JSON.stringify({id: i.enterprise_id, name: i.enterprises?.name})))]
            .map(s => JSON.parse(s))
            .sort((a,b) => a.name.localeCompare(b.name));

        const bestSellers = state.topSellers || [];

        content = `
            <div class="flex flex-col h-full overflow-hidden animate-fade-in">
                <!-- TOOLBAR & STATS -->
                <div class="flex flex-col xl:flex-row gap-4 mb-6 shrink-0">
                    <div class="flex-1 flex gap-2">
                        <div class="relative flex-1">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                            <input type="text" placeholder="Rechercher produit..." class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm bg-black/20 focus:bg-black/40">
                        </div>
                        <select onchange="actions.filterMarketByEnterprise(this.value)" class="glass-input w-48 p-2.5 rounded-xl text-sm bg-black/20 focus:bg-black/40 border-white/10 text-gray-300">
                            <option value="all">Toutes les boutiques</option>
                            ${enterpriseOptions.map(e => `<option value="${e.id}" ${state.marketEnterpriseFilter === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2 xl:pb-0">
                        <div class="flex items-center gap-3 px-4 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10 whitespace-nowrap">
                            <div class="p-1.5 bg-blue-500/10 rounded-lg text-blue-400"><i data-lucide="bar-chart-3" class="w-4 h-4"></i></div>
                            <div>
                                <div class="text-[9px] text-blue-300/70 uppercase font-bold">Volume Jour</div>
                                <div class="text-sm font-mono font-bold text-blue-100">$${volumeToday.toLocaleString()}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 whitespace-nowrap">
                            <div class="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400"><i data-lucide="wallet" class="w-4 h-4"></i></div>
                            <div>
                                <div class="text-[9px] text-gray-500 uppercase font-bold">Portefeuille</div>
                                <div class="text-sm font-mono font-bold text-emerald-400">$${currentCash.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${!isSessionActive ? `
                    <div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-300 text-xs font-bold animate-pulse">
                        <i data-lucide="lock" class="w-4 h-4"></i>
                        Marché hors-ligne : Consultation uniquement. Les achats sont désactivés hors session.
                    </div>
                ` : ''}

                <!-- BEST SELLERS / TRENDING -->
                ${bestSellers.length > 0 ? `
                    <div class="mb-6 shrink-0">
                        <h3 class="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2 mb-3 px-1">
                            <i data-lucide="flame" class="w-4 h-4"></i> Tendance & Meilleures Ventes
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${bestSellers.map((item, idx) => {
                                const rankColors = [
                                    'from-yellow-600/40 to-yellow-900/10 border-yellow-500/50', // Gold
                                    'from-gray-400/40 to-gray-700/10 border-gray-400/50', // Silver
                                    'from-orange-700/40 to-orange-900/10 border-orange-700/50' // Bronze
                                ];
                                const isPromo = item.is_promo_trend;
                                const isRandom = item.is_random_trend;
                                const itemIcon = item.object_icon || 'package';
                                const discount = item.discount_percent || 0;
                                const priceHT = Math.ceil(item.price * (1 - discount/100));
                                
                                return `
                                <div onclick="${isSessionActive ? `actions.openBuyModal('${item.id}')` : ''}" 
                                     class="relative bg-gradient-to-br ${rankColors[idx]} border rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg overflow-hidden group">
                                    <div class="absolute -right-6 -top-6 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
                                    <div class="w-12 h-12 bg-black/30 rounded-xl flex items-center justify-center text-white border border-white/10 shadow-inner shrink-0 relative z-10">
                                        <i data-lucide="${itemIcon}" class="w-6 h-6"></i>
                                        <div class="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center border-2 border-black">#${idx+1}</div>
                                    </div>
                                    <div class="flex-1 min-w-0 relative z-10">
                                        <div class="flex justify-between items-start">
                                            <div class="font-bold text-white truncate text-sm">${item.name}</div>
                                            ${isPromo ? '<span class="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">Promo</span>' : ''}
                                        </div>
                                        <div class="text-[10px] text-gray-300 truncate">${item.enterprises?.name}</div>
                                        <div class="flex items-center gap-2 mt-1">
                                            <span class="font-mono font-bold text-white">$${priceHT.toLocaleString()}</span>
                                            ${item.sales_count ? `<span class="text-[9px] bg-black/40 px-1.5 py-0.5 rounded text-emerald-400 font-mono">+${item.sales_count} ventes</span>` : ''}
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform"></i>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="flex-1 overflow-hidden rounded-xl border border-white/5 bg-white/5 flex flex-col min-h-0">
                    <div class="overflow-y-auto custom-scrollbar flex-1">
                        ${items.length === 0 ? '<div class="text-center text-gray-500 py-10 italic">Aucune offre correspondant aux critères.</div>' : `
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-[#151515] text-xs uppercase text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th class="p-4 w-16"></th>
                                        <th class="p-4">Produit</th>
                                        <th class="p-4">Vendeur</th>
                                        <th class="p-4 text-center">Stock</th>
                                        <th class="p-4 text-right">Prix HT</th>
                                        <th class="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="text-sm divide-y divide-white/5">
                                    ${items.map(item => {
                                        const hasDiscount = item.discount_percent > 0;
                                        const itemIcon = item.object_icon || 'package';
                                        return `
                                        <tr class="hover:bg-white/5 transition-colors group ${isSessionActive ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}" 
                                            onclick="${isSessionActive ? `actions.openBuyModal('${item.id}')` : ''}">
                                            <td class="p-4 text-center">
                                                <div class="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-400 border border-white/5">
                                                    <i data-lucide="${itemIcon}" class="w-4 h-4"></i>
                                                </div>
                                            </td>
                                            <td class="p-4">
                                                <div class="font-bold text-white flex items-center gap-2">
                                                    ${item.name}
                                                    ${hasDiscount ? `<span class="bg-red-500 text-white text-[9px] px-1.5 rounded font-bold">-${item.discount_percent}%</span>` : ''}
                                                    ${item.requires_appointment ? `<span class="bg-yellow-500/20 text-yellow-300 text-[9px] px-1.5 py-0.5 rounded font-bold border border-yellow-500/30 uppercase">RDV</span>` : ''}
                                                </div>
                                                ${item.description ? `<div class="text-xs text-gray-500 truncate max-w-[200px]">${item.description}</div>` : ''}
                                            </td>
                                            <td class="p-4 text-gray-400">
                                                <div class="flex items-center gap-1.5">
                                                    <i data-lucide="building-2" class="w-3 h-3 text-blue-500/50"></i>
                                                    ${item.enterprises?.name || 'Entreprise'}
                                                </div>
                                            </td>
                                            <td class="p-4 text-center">
                                                <span class="bg-white/10 px-2 py-0.5 rounded text-xs font-mono text-white">${item.quantity > 9000 ? '∞' : item.quantity}</span>
                                            </td>
                                            <td class="p-4 text-right">
                                                <div class="font-mono font-bold ${hasDiscount ? 'text-emerald-400' : 'text-gray-300'}">
                                                    ${hasDiscount ? `<span class="line-through text-gray-500 text-[10px] mr-1">$${item.price}</span>` : ''}
                                                    $${Math.ceil(item.price * (1 - (item.discount_percent||0)/100)).toLocaleString()}
                                                </div>
                                                <div class="text-[9px] uppercase font-bold text-gray-600">${item.payment_type === 'both' ? 'Mixte' : item.payment_type === 'cash_only' ? 'Cash' : 'Banque'}</div>
                                            </td>
                                            <td class="p-4 text-right">
                                                ${isSessionActive ? `
                                                    <button class="glass-btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500/20 hover:text-blue-300 border-white/10 group-hover:border-blue-500/50 transition-all flex items-center gap-2 ml-auto">
                                                        <i data-lucide="${item.requires_appointment ? 'calendar' : 'shopping-cart'}" class="w-3 h-3"></i> ${item.requires_appointment ? 'Réserver' : 'Achat'}
                                                    </button>
                                                ` : `
                                                    <span class="text-[10px] uppercase font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">Fermé</span>
                                                `}
                                            </td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // --- DIRECTORY TAB ---
    else if (state.activeEnterpriseTab === 'directory') {
        // ... (Directory Tab Code Unchanged) ...
        const ents = state.enterprises || [];
        content = `
            <div class="flex flex-col h-full overflow-hidden animate-fade-in">
                <div class="mb-6 flex justify-between items-center shrink-0">
                    <h3 class="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                        <i data-lucide="building" class="w-4 h-4 text-blue-400"></i> Annuaire des Entreprises
                    </h3>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${ents.length === 0 ? '<div class="col-span-full text-center text-gray-500 py-10 italic border border-dashed border-white/10 rounded-xl">Aucune entreprise enregistrée.</div>' : ''}
                        ${ents.map(ent => {
                            const membership = state.myEnterprises.find(me => me.id === ent.id);
                            const isGov = ent.name === 'L.A. Auto School';
                            
                            return `
                            <div class="glass-panel p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all flex flex-col group relative overflow-hidden">
                                ${isGov ? '<div class="absolute top-0 left-0 bg-blue-600/80 text-white text-[9px] font-bold uppercase px-2 py-1 rounded-br-lg z-20 shadow-lg border-b border-r border-white/20">Organisation gouvernementale</div>' : ''}
                                <div class="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>
                                
                                <div class="flex justify-between items-start mb-4 relative z-10 ${isGov ? 'mt-3' : ''}">
                                    <div class="w-12 h-12 rounded-lg bg-blue-900/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 text-lg">
                                        ${ent.name[0]}
                                    </div>
                                </div>
                                
                                <h4 class="font-bold text-white text-lg mb-1 relative z-10">${ent.name}</h4>
                                <div class="text-xs text-gray-500 mb-6 relative z-10 flex items-center gap-1">
                                    <i data-lucide="user" class="w-3 h-3"></i> PDG: <span class="text-gray-300 font-bold">${ent.leader ? `${ent.leader.first_name} ${ent.leader.last_name}` : 'Inconnu'}</span>
                                </div>

                                ${membership ? `
                                    <button disabled class="mt-auto w-full py-3 rounded-xl text-sm font-bold bg-white/5 text-gray-500 cursor-not-allowed border border-white/5 relative z-10 flex items-center justify-center gap-2">
                                        <i data-lucide="${membership.myStatus === 'pending' ? 'clock' : 'check'}" class="w-3 h-3"></i> 
                                        ${membership.myStatus === 'pending' ? 'Candidature envoyée' : 'Déjà Membre'}
                                    </button>
                                ` : `
                                    <button onclick="actions.applyToEnterprise('${ent.id}')" class="mt-auto glass-btn-secondary w-full py-3 rounded-xl text-sm font-bold hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30 transition-all relative z-10 flex items-center justify-center gap-2">
                                        <i data-lucide="send" class="w-3 h-3"></i> Postuler
                                    </button>
                                `}
                            </div>
                        `}).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // --- MY COMPANIES TAB ---
    else if (state.activeEnterpriseTab === 'my_companies') {
        // ... (My Companies Code Unchanged) ...
        content = `
            <div class="flex flex-col h-full overflow-hidden animate-fade-in">
                <div class="mb-6 flex justify-between items-center shrink-0">
                    <h3 class="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                        <i data-lucide="briefcase" class="w-4 h-4 text-blue-400"></i> Vos Affiliations
                    </h3>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${state.myEnterprises.length === 0 ? '<div class="col-span-full text-center text-gray-500 py-10 italic border border-dashed border-white/10 rounded-xl">Vous n\'êtes employé d\'aucune entreprise.</div>' : ''}
                        ${state.myEnterprises.map(ent => `
                            <div class="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all flex flex-col">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                                            ${ent.name[0]}
                                        </div>
                                        <div>
                                            <h4 class="font-bold text-white text-base">${ent.name}</h4>
                                            <div class="text-xs text-gray-400 uppercase font-bold tracking-wider">${ent.myRank === 'leader' ? 'PDG' : ent.myRank === 'co_leader' ? 'Directeur' : 'Employé'}</div>
                                        </div>
                                    </div>
                                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${ent.myStatus === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}">
                                        ${ent.myStatus === 'accepted' ? 'Actif' : 'En Attente'}
                                    </span>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2 text-xs mb-4">
                                    <div class="bg-black/30 p-2 rounded border border-white/5 text-center">
                                        <div class="text-gray-500 mb-0.5">Articles</div>
                                        <div class="text-white font-bold">${ent.items?.[0]?.count || 0}</div>
                                    </div>
                                    <div class="bg-black/30 p-2 rounded border border-white/5 text-center">
                                        <div class="text-gray-500 mb-0.5">Solde</div>
                                        <div class="text-emerald-400 font-mono font-bold">${ent.myRank === 'leader' ? '$' + (ent.balance||0).toLocaleString() : 'Masqué'}</div>
                                    </div>
                                </div>

                                <div class="mt-auto flex gap-2">
                                    ${ent.myStatus === 'accepted' ? `
                                        <button onclick="actions.openEnterpriseManagement('${ent.id}')" class="flex-1 glass-btn py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500">
                                            <i data-lucide="settings" class="w-3 h-3"></i> Gestion
                                        </button>
                                    ` : `
                                        <button disabled class="flex-1 bg-white/5 py-2 rounded-lg text-xs text-gray-500 cursor-not-allowed border border-white/5">En Attente</button>
                                    `}
                                    <button onclick="actions.quitEnterprise('${ent.id}')" class="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors" title="Démissionner">
                                        <i data-lucide="log-out" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // --- TAB: APPOINTMENTS (NEW) ---
    else if (state.activeEnterpriseTab === 'appointments') {
        const apts = state.clientAppointments || [];
        
        content = `
            <div class="flex flex-col h-full overflow-hidden animate-fade-in">
                <div class="mb-6 flex justify-between items-center shrink-0">
                    <h3 class="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                        <i data-lucide="calendar-clock" class="w-4 h-4 text-blue-400"></i> Mes Demandes de Rendez-vous
                    </h3>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div class="grid grid-cols-1 gap-4">
                        ${apts.length === 0 ? '<div class="col-span-full text-center text-gray-500 py-10 italic border border-dashed border-white/10 rounded-xl">Aucun rendez-vous en cours.</div>' : ''}
                        ${apts.map(apt => `
                            <div class="glass-panel p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all flex justify-between items-center">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 border border-yellow-500/20">
                                        <i data-lucide="clock" class="w-6 h-6"></i>
                                    </div>
                                    <div>
                                        <div class="font-bold text-white text-lg">${apt.service_name}</div>
                                        <div class="text-xs text-gray-400 flex items-center gap-2">
                                            <span>${apt.enterprises?.name || 'Entreprise'}</span>
                                            <span class="w-1 h-1 bg-gray-600 rounded-full"></span>
                                            <span>${new Date(apt.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <div class="text-right">
                                        <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Statut</div>
                                        <div class="font-bold text-sm ${apt.status === 'pending' ? 'text-orange-400' : 'text-emerald-400'} uppercase">${apt.status === 'pending' ? 'En Attente' : apt.status}</div>
                                    </div>
                                    ${apt.status === 'pending' ? `
                                        <button onclick="actions.cancelClientAppointment('${apt.id}')" class="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-colors" title="Annuler">
                                            <i data-lucide="trash" class="w-4 h-4"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // --- MANAGEMENT VIEW (Single Page Dashboard) ---
    else if (state.activeEnterpriseTab === 'manage' && state.activeEnterpriseManagement) {
        const ent = state.activeEnterpriseManagement;
        const isLeader = ent.myRank === 'leader' || ent.myRank === 'co_leader';
        const invoices = ent.invoices || [];
        const appointments = ent.appointments || []; 
        const isAutoEcole = ent.name === "L.A. Auto School";
        
        // Sorting items to prioritize Pending/Awaiting Tax
        const sortedItems = [...ent.items].sort((a, b) => {
            const scores = { 'awaiting_tax': 10, 'pending': 5, 'approved': 1, 'rejected': 0 };
            const sA = scores[a.status] || 0;
            const sB = scores[b.status] || 0;
            return sB - sA;
        });

        let iconPickerModal = '';
        if (state.iconPickerOpen) {
            let displayedIcons = ICON_LIBRARY;
            if (state.iconSearchQuery) {
                displayedIcons = ICON_LIBRARY.filter(i => i.toLowerCase().includes(state.iconSearchQuery.toLowerCase()));
            }

            iconPickerModal = `
                <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
                    <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" onclick="actions.closeIconPicker()"></div>
                    <div class="glass-panel w-full max-w-lg p-6 rounded-2xl relative z-10 flex flex-col max-h-[80vh]">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-bold text-white">Sélectionner une icône</h3>
                            <button onclick="actions.closeIconPicker()" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                        </div>
                        <div class="mb-4">
                            <div class="relative">
                                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                                <input type="text" oninput="actions.searchIcons(this.value)" value="${state.iconSearchQuery}" placeholder="Rechercher..." class="glass-input pl-10 w-full p-2 rounded-xl text-sm bg-black/40">
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-6 gap-2 p-2 bg-black/20 rounded-xl">
                            ${displayedIcons.map(icon => `
                                <button onclick="actions.selectIcon('${icon}')" class="p-2 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors ${state.selectedCreateIcon === icon ? 'bg-blue-600 text-white shadow-lg' : ''}">
                                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        content = `
            ${iconPickerModal}
            <div class="h-full flex flex-col animate-fade-in min-h-0 overflow-y-auto custom-scrollbar p-1">
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    ${!isAutoEcole ? `
                        <!-- BANQUE -->
                        <div class="bg-white/5 border border-white/5 rounded-xl p-4">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <i data-lucide="landmark" class="w-4 h-4 text-emerald-500"></i> Opérations Bancaires
                                </h3>
                                <div class="text-sm font-mono font-bold text-emerald-400 bg-black/30 px-2 py-1 rounded border border-emerald-500/20">$ ${(ent.balance || 0).toLocaleString()}</div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <form onsubmit="actions.entDeposit(event)" class="flex gap-2">
                                    <input type="number" name="amount" placeholder="Dépôt" class="glass-input w-full py-1.5 px-3 rounded-lg text-xs font-mono bg-black/30" required min="1">
                                    <button class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 p-1.5 rounded-lg transition-colors"><i data-lucide="arrow-down" class="w-4 h-4"></i></button>
                                </form>
                                ${isLeader ? `
                                    <form onsubmit="actions.entWithdraw(event)" class="flex gap-2">
                                        <input type="number" name="amount" placeholder="Retrait" class="glass-input w-full py-1.5 px-3 rounded-lg text-xs font-mono bg-black/30" required min="1">
                                        <button class="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 p-1.5 rounded-lg transition-colors"><i data-lucide="arrow-up" class="w-4 h-4"></i></button>
                                    </form>
                                ` : ''}
                            </div>
                        </div>
                    ` : `
                        <div class="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-center text-center">
                            <div class="text-xs text-gray-500 uppercase font-bold tracking-widest mb-2">Trésorerie Gouvernementale</div>
                            <div class="text-2xl font-mono font-bold text-emerald-400 mb-1">$ ${(ent.balance || 0).toLocaleString()}</div>
                            <div class="text-[10px] text-gray-500 italic">Compte certifié par l'État de San Andreas.</div>
                        </div>
                    `}

                    <!-- STATS / SALES -->
                    <div class="bg-white/5 border border-white/5 rounded-xl flex flex-col p-4 h-48">
                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                            <i data-lucide="file-text" class="w-4 h-4 text-blue-300"></i> Dernières Ventes
                        </h3>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-0 space-y-2">
                            ${invoices.length === 0 ? '<div class="text-center text-gray-500 text-xs py-4">Aucune vente récente.</div>' : invoices.map(inv => `
                                <div class="bg-white/5 p-2 rounded border border-white/5 text-xs">
                                    <div class="flex justify-between mb-1">
                                        <span class="font-bold text-white">${inv.item_name} (x${inv.quantity})</span>
                                        <span class="font-mono text-emerald-400 font-bold">+$${inv.total_price.toLocaleString()}</span>
                                    </div>
                                    <div class="flex justify-between text-gray-500">
                                        <span>Client: ${inv.characters?.first_name || 'Inconnu'}</span>
                                        <span>${new Date(inv.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- SECTION RENDEZ-VOUS (NOUVEAU) -->
                <div class="bg-white/5 border border-white/5 rounded-xl flex flex-col mb-6">
                    <div class="p-4 border-b border-white/5 flex justify-between items-center bg-yellow-900/10">
                        <h3 class="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                            <i data-lucide="calendar-clock" class="w-4 h-4"></i> Rendez-Vous & Demandes (${appointments.length})
                        </h3>
                    </div>
                    <div class="p-2 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        ${appointments.length === 0 ? '<div class="text-center text-gray-500 text-xs py-4">Aucun rendez-vous en attente.</div>' : appointments.map(apt => `
                            <div class="bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <div class="font-bold text-white text-sm">${apt.characters?.first_name} ${apt.characters?.last_name}</div>
                                        <div class="text-xs text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">@${apt.discord_username || 'Inconnu'}</div>
                                    </div>
                                    <div class="text-xs text-gray-400">Service: <span class="text-white font-bold">${apt.service_name}</span></div>
                                    <div class="text-xs text-gray-500 mt-1">Date: ${new Date(apt.created_at).toLocaleString()}</div>
                                </div>
                                <div class="flex gap-2 w-full md:w-auto">
                                    <button onclick="actions.handleAppointment('${apt.id}', 'approve', '${apt.service_name}', '${apt.client_id}')" class="flex-1 md:flex-none bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 py-2 px-4 rounded-lg text-xs font-bold border border-emerald-600/30 flex items-center justify-center gap-1">
                                        <i data-lucide="check" class="w-4 h-4"></i> Accorder
                                    </button>
                                    <button onclick="actions.handleAppointment('${apt.id}', 'reject', '${apt.service_name}', '${apt.client_id}')" class="flex-1 md:flex-none bg-red-600/20 hover:bg-red-600/40 text-red-400 py-2 px-4 rounded-lg text-xs font-bold border border-red-600/30 flex items-center justify-center gap-1">
                                        <i data-lucide="x" class="w-4 h-4"></i> Refuser
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${!isAutoEcole ? `
                    <div class="bg-white/5 border border-white/5 rounded-xl p-4 mb-6">
                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <i data-lucide="package-plus" class="w-4 h-4 text-orange-400"></i> Nouvel Article
                        </h3>
                        <form onsubmit="actions.addItemToMarket(event)" class="space-y-3">
                            <div class="flex gap-2">
                                <button type="button" onclick="actions.openIconPicker()" class="w-10 h-10 shrink-0 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-blue-500/50 transition-colors" title="Choisir icône">
                                    <i data-lucide="${state.selectedCreateIcon}" class="w-5 h-5"></i>
                                </button>
                                <input type="hidden" name="object_icon" id="selected-icon-input" value="${state.selectedCreateIcon}">
                                <input type="text" name="name" placeholder="Nom du produit" class="glass-input flex-1 p-2.5 rounded-lg text-sm" required>
                            </div>

                            <!-- PRODUCT TYPE SELECTOR -->
                            <div class="grid grid-cols-2 gap-2">
                                <label class="cursor-pointer">
                                    <input type="radio" name="product_type" value="standard" checked class="peer sr-only">
                                    <div class="p-2 rounded-lg bg-black/40 border border-white/10 peer-checked:bg-blue-500/20 peer-checked:border-blue-500 peer-checked:text-blue-400 text-center text-xs font-bold transition-all flex items-center justify-center gap-2">
                                        <i data-lucide="package" class="w-4 h-4"></i> Produit
                                    </div>
                                </label>
                                <label class="cursor-pointer">
                                    <input type="radio" name="product_type" value="service" class="peer sr-only">
                                    <div class="p-2 rounded-lg bg-black/40 border border-white/10 peer-checked:bg-yellow-500/20 peer-checked:border-yellow-500 peer-checked:text-yellow-400 text-center text-xs font-bold transition-all flex items-center justify-center gap-2">
                                        <i data-lucide="calendar-clock" class="w-4 h-4"></i> Service (RDV)
                                    </div>
                                </label>
                            </div>

                            <div class="grid grid-cols-3 gap-2">
                                <div class="relative">
                                    <span class="absolute left-2.5 top-2.5 text-gray-500 text-xs">$</span>
                                    <input type="number" name="price" placeholder="Prix" class="glass-input w-full pl-6 p-2.5 rounded-lg text-sm font-mono" required min="1">
                                </div>
                                <input type="number" name="quantity" placeholder="Qté" class="glass-input w-full p-2.5 rounded-lg text-sm" required min="1">
                                <select name="payment_type" class="glass-input w-full p-2.5 rounded-lg text-xs bg-black/40 text-gray-300">
                                    <option value="both">Mixte</option>
                                    <option value="cash_only">Cash</option>
                                    <option value="bank_only">Banque</option>
                                </select>
                            </div>

                            <input type="text" name="description" placeholder="Description courte (facultatif)" class="glass-input w-full p-2.5 rounded-lg text-sm" maxlength="55">

                            <div class="flex items-center justify-between pt-2">
                                <div class="text-[10px] text-gray-500 flex flex-col">
                                    <span>Taxe mise en rayon: <span class="text-orange-400 font-bold">5%</span></span>
                                    <span class="opacity-50">Calculée sur la valeur totale.</span>
                                </div>
                                <button type="submit" class="glass-btn px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold shadow-lg shadow-blue-900/20">
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                ` : ''}

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- STAFF SECTION -->
                    <div class="bg-white/5 border border-white/5 rounded-xl flex-col h-[500px] flex">
                        <div class="p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <i data-lucide="users" class="w-4 h-4 text-blue-400"></i> Personnel (${ent.members.length})
                            </h3>
                        </div>
                        <div class="overflow-y-auto custom-scrollbar p-0 flex-1">
                            <table class="w-full text-left text-xs">
                                <thead class="bg-black/20 text-gray-500 uppercase sticky top-0">
                                    <tr>
                                        <th class="p-3">Nom</th>
                                        <th class="p-3">Rang</th>
                                        <th class="p-3 text-right">Statut</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    ${ent.members.map(m => `
                                        <tr class="hover:bg-white/5 transition-colors">
                                            <td class="p-3 font-medium text-white">${m.characters?.first_name} ${m.characters?.last_name}</td>
                                            <td class="p-3"><span class="bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase text-gray-300">${m.rank}</span></td>
                                            <td class="p-3 text-right">
                                                ${m.status === 'pending' && isLeader ? `
                                                    <div class="flex gap-1 justify-end">
                                                        <button onclick="actions.manageApplication('${m.id}', 'accept')" class="bg-emerald-500 hover:bg-emerald-400 text-white p-1 rounded"><i data-lucide="check" class="w-3 h-3"></i></button>
                                                        <button onclick="actions.manageApplication('${m.id}', 'reject')" class="bg-red-500 hover:bg-red-400 text-white p-1 rounded"><i data-lucide="x" class="w-3 h-3"></i></button>
                                                    </div>
                                                ` : `
                                                    <span class="text-[10px] font-bold ${m.status === 'accepted' ? 'text-emerald-400' : 'text-orange-400'}">${m.status === 'accepted' ? 'Actif' : 'Attente'}</span>
                                                `}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- CATALOG SECTION -->
                    <div class="bg-white/5 border border-white/5 rounded-xl flex flex-col h-[500px] overflow-hidden">
                        <div class="p-4 border-b border-white/5"><h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Catalogue Services</h3></div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                            <table class="w-full text-left text-xs">
                                <thead class="bg-black/20 text-gray-500 uppercase sticky top-0">
                                    <tr><th class="p-3 w-8"></th><th class="p-3">Produit</th><th class="p-3 text-right">Prix</th><th class="p-3 text-center">Stock</th><th class="p-3 text-right">Actions</th></tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    ${sortedItems.map(i => {
                                        const isPending = i.status === 'pending';
                                        const isAwaitingTax = i.status === 'awaiting_tax';
                                        const icon = i.object_icon || 'package';
                                        return `
                                        <tr class="hover:bg-white/5 transition-colors">
                                            <td class="p-3 text-center"><i data-lucide="${icon}" class="w-3 h-3 text-gray-500"></i></td>
                                            <td class="p-3">
                                                <div class="font-medium text-white ${i.is_hidden ? 'opacity-50' : ''}">${i.name}</div>
                                                ${isPending ? '<span class="text-[9px] text-orange-400 uppercase font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">Validation</span>' : isAwaitingTax ? `<button onclick="actions.payItemTax('${i.id}')" class="text-[9px] bg-red-600 text-white px-2 py-0.5 rounded font-bold animate-pulse shadow-lg shadow-red-500/30">Payer Taxe</button>` : ''}
                                                ${i.requires_appointment ? '<span class="text-[9px] text-yellow-300 uppercase font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20 ml-1">RDV</span>' : ''}
                                            </td>
                                            <td class="p-3 text-right text-emerald-400">$${i.price}</td>
                                            <td class="p-3 text-center">${i.quantity > 9000 ? '∞' : i.quantity}</td>
                                            <td class="p-3 text-right">
                                                ${!isAwaitingTax && !isAutoEcole ? `<button onclick="actions.restockItem('${i.id}', ${i.price})" class="p-1 text-blue-400"><i data-lucide="plus" class="w-3 h-3"></i></button>` : ''}
                                                ${!isAwaitingTax ? `<button onclick="actions.toggleItemVisibility('${i.id}', ${i.is_hidden})" class="p-1 text-gray-400"><i data-lucide="${i.is_hidden ? 'eye-off' : 'eye'}" class="w-3 h-3"></i></button>` : ''}
                                                ${!isAutoEcole ? `<button onclick="actions.deleteItem('${i.id}')" class="p-1 text-red-400"><i data-lucide="trash" class="w-3 h-3"></i></button>` : ''}
                                            </td>
                                        </tr>
                                    `}).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // MAIN LAYOUT WRAPPER
    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            ${refreshBanner}

            ${!state.activeEnterpriseManagement ? `
                <!-- HEADER STANDARD -->
                <div class="px-6 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 shrink-0 z-10 relative bg-[#050505]">
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <i data-lucide="building-2" class="w-6 h-6 text-blue-500"></i>
                            Registre du Commerce
                        </h2>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-gray-400">Opérateur:</span>
                            <span class="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                        ${tabs.map(t => `
                            <button onclick="actions.setEnterpriseTab('${t.id}')" 
                                class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeEnterpriseTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                                <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : `
                <!-- HEADER GESTION (Remplace le header standard) -->
                <div class="px-6 pb-4 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 shrink-0 z-10 relative bg-[#050505]">
                    <div class="flex items-center gap-4 w-full">
                        <button onclick="actions.setEnterpriseTab('my_companies')" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <div>
                            <h2 class="text-xl font-bold text-white flex items-center gap-2">
                                ${state.activeEnterpriseManagement.name}
                                <span class="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 uppercase font-bold tracking-wider">Panel Gestion</span>
                            </h2>
                        </div>
                    </div>
                    <div class="text-right hidden md:block whitespace-nowrap">
                        <div class="text-[10px] text-gray-500 uppercase font-bold">Trésorerie</div>
                        <div class="text-lg font-mono font-bold text-emerald-400">$ ${(state.activeEnterpriseManagement.balance || 0).toLocaleString()}</div>
                    </div>
                </div>
            `}
            
            <div class="flex-1 p-6 overflow-hidden relative min-h-0">
                ${content}
            </div>
        </div>
    `;
};