
import { state } from '../state.js';
import { fetchPlayerInvoices } from '../services.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-indigo-500/5 border-b border-indigo-500/10 gap-3 shrink-0 relative z-20">
        <div class="text-[10px] text-indigo-200 flex items-center gap-2 font-black uppercase tracking-[0.2em]">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </div>
            <span>Registre de Propriété • Données Sécurisées</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Sync. Patrimoine
        </button>
    </div>
`;

const initAssetsChart = () => {
    const ctx = document.getElementById('patrimonyChart');
    if (!ctx || !window.Chart) return;
    if (window.myPatrimonyChart) window.myPatrimonyChart.destroy();
    const bankVal = state.bankAccount?.bank_balance || 0;
    const cashVal = state.bankAccount?.cash_balance || 0;
    let invVal = 0;
    state.inventory.forEach(i => { if (!i.is_virtual) invVal += (i.quantity * i.estimated_value); });
    let entVal = 0;
    if (state.myEnterprises) { state.myEnterprises.forEach(e => { if (e.myRank === 'leader') entVal += (e.balance || 0); }); }
    const data = {
        labels: ['Banque', 'Liquide', 'Inventaire', 'Entreprises'],
        datasets: [{
            data: [bankVal, cashVal, invVal, entVal],
            backgroundColor: ['#10b981', '#3b82f6', '#6366f1', '#a855f7'],
            borderColor: 'rgba(0,0,0,0.5)',
            borderWidth: 2,
            hoverOffset: 15,
            borderRadius: 5
        }]
    };
    window.myPatrimonyChart = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            animation: { animateScale: true, animateRotate: true }
        }
    });
};

export const generateInventoryRow = (item) => {
    let iconName = item.object_icon || 'package';
    let iconClass = 'bg-indigo-500/10 text-indigo-400';
    let borderClass = 'border-white/5';
    let action = `actions.openIdCard(null, 'id_card')`;
    const isGiftable = !item.is_cash && !item.is_virtual;

    if (item.is_cash) {
        iconName = 'banknote';
        iconClass = 'bg-emerald-500/10 text-emerald-400';
        borderClass = 'border-emerald-500/20';
    } else if (item.is_virtual) {
        iconName = item.icon || 'id-card';
        if(item.docType === 'credit_card') {
            iconClass = 'bg-yellow-500/10 text-yellow-400';
            action = `actions.openIdCard(null, 'credit_card')`;
        } else if(item.name === "Permis de conduire") {
            iconClass = 'bg-blue-500/10 text-blue-400';
            action = `actions.openIdCard(null, 'driver_license')`;
        } else if(item.docType?.includes('card') || item.docType?.includes('badge')) {
            iconClass = 'bg-indigo-600/20 text-indigo-400';
            action = `actions.openIdCard(null, '${item.docType}')`;
        }
    }

    return `
    <div class="flex items-center justify-between p-5 bg-white/[0.02] rounded-3xl border ${borderClass} hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all group">
        <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl ${iconClass} flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                <i data-lucide="${iconName}" class="w-7 h-7"></i>
            </div>
            <div>
                <div class="font-black text-white text-lg uppercase italic tracking-tight group-hover:text-indigo-400 transition-colors">${item.name}</div>
                <div class="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">
                    ${item.is_virtual ? 'Document Certifié' : `Unité(s) : <span class="text-white font-mono">${item.quantity}</span>`}
                </div>
            </div>
        </div>
        <div class="text-right flex items-center gap-6">
            ${!item.is_virtual ? `
                <div class="hidden md:block">
                    <div class="font-mono font-black text-white text-base tracking-tighter">$ ${(item.quantity * item.estimated_value).toLocaleString()}</div>
                    <div class="text-[8px] text-gray-700 font-black uppercase tracking-widest">Valeur Marchande</div>
                </div>
                <div class="flex gap-2">
                    ${isGiftable ? `
                        <button onclick="actions.openGiveItemModal('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.quantity}, ${item.estimated_value})" class="p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg" title="Transférer">
                            <i data-lucide="gift" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                    ${!item.is_cash ? `
                        <button onclick="actions.deleteInventoryItem('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.quantity})" class="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-lg" title="Jeter">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            ` : `
                <button onclick="${action}" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/20 transition-all flex items-center gap-2">
                    <i data-lucide="eye" class="w-3.5 h-3.5"></i> Consulter
                </button>
            `}
        </div>
    </div>
    `;
};

export const AssetsView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Synchronisation du patrimoine...</div>';

    let documentHtml = '';
    if (state.idCardModalOpen) {
        const char = state.idCardTarget || state.activeCharacter;
        const birthDate = new Date(char.birth_date).toLocaleDateString('fr-FR');
        const createdAt = new Date(char.created_at).toLocaleDateString('fr-FR');
        const docType = state.activeDocumentType || 'id_card';
        const displayAvatar = (state.idCardTarget && state.idCardTarget.discord_avatar) ? state.idCardTarget.discord_avatar : state.user.avatar;
        const points = (char.driver_license_points !== undefined && char.driver_license_points !== null) ? char.driver_license_points : 12;

        let cardContent = '';
        if (docType === 'driver_license') {
            cardContent = `
                <div class="id-card-bg w-full max-w-[400px] h-[250px] rounded-2xl relative z-10 overflow-hidden text-gray-800 p-6 flex flex-col justify-between shadow-2xl transform scale-110">
                    <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div class="flex justify-between items-start border-b-2 border-blue-800 pb-2 relative z-10">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs">LA</div>
                            <div>
                                <h3 class="font-bold text-lg leading-none text-blue-900">STATE OF CALIFORNIA</h3>
                                <div class="text-[8px] font-bold tracking-widest uppercase text-blue-700">Driver License</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-bold text-red-600">ID: ${char.id.split('-')[0].toUpperCase()}</div>
                            <div class="text-[8px] text-gray-500 font-bold">PTS: ${points}/12</div>
                        </div>
                    </div>
                    <div class="flex gap-4 mt-2 relative z-10">
                        <div class="w-24 h-32 bg-gray-300 border border-gray-400 rounded-md overflow-hidden shrink-0">
                            ${displayAvatar ? `<img src="${displayAvatar}" class="w-full h-full object-cover grayscale contrast-125">` : '<div class="w-full h-full flex items-center justify-center bg-gray-200"><i data-lucide="user" class="w-8 h-8 text-gray-400"></i></div>'}
                        </div>
                        <div class="flex-1 space-y-1">
                            <div><div class="text-[8px] text-gray-500 uppercase">Last Name</div><div class="font-bold text-lg uppercase leading-none">${char.last_name}</div></div>
                            <div><div class="text-[8px] text-gray-500 uppercase">First Name</div><div class="font-bold text-sm uppercase leading-none">${char.first_name}</div></div>
                             <div class="grid grid-cols-2 gap-2 mt-2">
                                <div><div class="text-[8px] text-gray-500 uppercase">DOB</div><div class="font-bold text-xs leading-none text-red-700">${birthDate}</div></div>
                                <div><div class="text-[8px] text-gray-500 uppercase">Sex</div><div class="font-bold text-xs leading-none">M</div></div>
                            </div>
                            <div class="mt-2"><div class="text-[8px] text-gray-500 uppercase">Issued</div><div class="font-bold text-xs leading-none">${createdAt}</div></div>
                        </div>
                    </div>
                </div>
            `;
        } 
        else if (docType === 'credit_card') {
            cardContent = `
                <div class="w-full max-w-[400px] h-[250px] rounded-2xl relative z-10 overflow-hidden text-white p-8 flex flex-col justify-between shadow-2xl transform scale-110 bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-yellow-600/30">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div class="flex items-center gap-2"><i data-lucide="landmark" class="w-6 h-6 text-yellow-500"></i><span class="font-bold tracking-widest text-lg">TFRP BANK</span></div>
                        <span class="text-xs font-bold text-yellow-500 uppercase tracking-widest border border-yellow-500/30 px-2 py-1 rounded">Gold Debit</span>
                    </div>
                    <div class="relative z-10">
                        <div class="w-12 h-9 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 mb-4 shadow-lg flex items-center justify-center relative overflow-hidden">
                            <div class="absolute inset-0 border border-black/20 rounded"></div>
                            <div class="w-8 h-6 border border-black/10 rounded flex flex-col justify-between p-1"><div class="h-[1px] bg-black/20 w-full"></div><div class="h-[1px] bg-black/20 w-full"></div><div class="h-[1px] bg-black/20 w-full"></div></div>
                        </div>
                        <div class="font-mono text-xl tracking-widest text-gray-300 drop-shadow-md">**** **** **** ${char.id.substring(0,4).toUpperCase()}</div>
                    </div>
                    <div class="flex justify-between items-end relative z-10">
                        <div><div class="text-[8px] text-gray-400 uppercase tracking-widest mb-0.5">Card Holder</div><div class="font-bold text-sm uppercase tracking-wide text-yellow-100">${char.first_name} ${char.last_name}</div></div>
                        <div class="text-right"><div class="text-[8px] text-gray-400 uppercase tracking-widest mb-0.5">Expires</div><div class="font-mono text-sm">12/28</div></div>
                    </div>
                </div>
            `;
        } else {
             cardContent = `
                <div class="bg-white w-full max-w-[400px] h-[250px] rounded-2xl relative z-10 overflow-hidden text-gray-900 p-6 flex flex-col justify-between shadow-2xl transform scale-110 border-2 border-gray-300">
                    <div class="flex justify-between items-center border-b-2 border-gray-800 pb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold text-xl rounded">US</div>
                            <div><h3 class="font-black text-xl uppercase tracking-tighter">Identification</h3><div class="text-[10px] font-bold uppercase text-gray-500 tracking-widest">United States of America</div></div>
                        </div>
                    </div>
                    <div class="flex gap-4 mt-4 h-full">
                        <div class="w-28 bg-gray-200 border border-gray-300 rounded overflow-hidden shrink-0 relative">
                             ${displayAvatar ? `<img src="${displayAvatar}" class="w-full h-full object-cover grayscale">` : ''}
                        </div>
                        <div class="flex-1 flex flex-col justify-center space-y-3">
                            <div><div class="text-[9px] font-bold text-gray-400 uppercase">Name</div><div class="font-bold text-xl uppercase">${char.last_name}, ${char.first_name}</div></div>
                            <div class="grid grid-cols-2 gap-2">
                                <div><div class="text-[9px] font-bold text-gray-400 uppercase">Birth Date</div><div class="font-mono font-bold">${birthDate}</div></div>
                                <div><div class="text-[9px] font-bold text-gray-400 uppercase">Sex</div><div class="font-mono font-bold">M</div></div>
                            </div>
                            <div><div class="text-[9px] font-bold text-gray-400 uppercase">ID Number</div><div class="font-mono text-sm tracking-widest text-red-600">${char.id.substring(0,8).toUpperCase()}</div></div>
                        </div>
                    </div>
                </div>
            `;
        }

        documentHtml = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closeIdCard()"></div>
                ${cardContent}
                <button onclick="actions.closeIdCard()" class="absolute top-10 right-10 text-white hover:text-gray-300 z-50">
                    <i data-lucide="x-circle" class="w-10 h-10"></i>
                </button>
            </div>
        `;
    }

    const tabs = [
        { id: 'overview', label: 'Dashboard', icon: 'pie-chart' },
        { id: 'inventory', label: 'Mon Sac', icon: 'backpack' },
        { id: 'invoices', label: 'Factures', icon: 'file-text' }
    ];

    let content = '';

    if (state.activeAssetsTab === 'overview') {
        const bankVal = state.bankAccount.bank_balance || 0;
        const cashVal = state.bankAccount.cash_balance || 0;
        let inventoryValue = 0;
        state.inventory.forEach(item => { if(!item.is_virtual) inventoryValue += (item.quantity * item.estimated_value); });
        let enterpriseValue = 0;
        if (state.myEnterprises) { state.myEnterprises.forEach(e => { if (e.myRank === 'leader') enterpriseValue += (e.balance || 0); }); }
        const totalPersonal = bankVal + cashVal + inventoryValue;
        const globalTotal = totalPersonal + enterpriseValue;

        setTimeout(initAssetsChart, 50);

        content = `
            <div class="space-y-8 animate-fade-in pb-20">
                <!-- HERO ASSET CARD -->
                <div class="glass-panel p-10 rounded-[48px] bg-gradient-to-br from-indigo-900/40 via-black to-black border border-indigo-500/20 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10">
                    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div class="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <div class="relative z-10 text-center md:text-left">
                        <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] border border-indigo-500/20 mb-6 rounded-lg">
                            <i data-lucide="gem" class="w-3.5 h-3.5"></i> Valeur Nette Consolidée
                        </div>
                        <h1 class="text-6xl md:text-7xl font-black text-white tracking-tighter mb-4 italic uppercase drop-shadow-2xl">$ ${globalTotal.toLocaleString()}</h1>
                        <p class="text-indigo-400/60 text-sm font-bold uppercase tracking-widest">Fortune Totale de ${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 relative z-10 w-full md:w-auto">
                        <div class="bg-black/60 backdrop-blur-xl px-6 py-5 rounded-3xl border border-white/5 text-center shadow-2xl">
                            <div class="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Privé</div>
                            <div class="font-mono font-black text-emerald-400 text-xl tracking-tighter">$${totalPersonal.toLocaleString()}</div>
                        </div>
                        <div class="bg-black/60 backdrop-blur-xl px-6 py-5 rounded-3xl border border-white/5 text-center shadow-2xl">
                            <div class="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Corporate</div>
                            <div class="font-mono font-black text-blue-400 text-xl tracking-tighter">$${enterpriseValue.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- CHART PANEL -->
                    <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] relative overflow-hidden group">
                        <div class="flex justify-between items-center mb-8">
                            <h3 class="font-black text-white text-xl uppercase italic tracking-tighter">Répartition de Fortune</h3>
                            <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest">Analyse Dynamique</div>
                        </div>
                        <div class="relative h-64 w-full flex items-center justify-center">
                            <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div class="w-20 h-20 bg-black rounded-full border border-white/10 flex items-center justify-center text-indigo-500 shadow-2xl">
                                    <i data-lucide="bar-chart-2" class="w-10 h-10"></i>
                                </div>
                            </div>
                            <canvas id="patrimonyChart" class="relative z-0"></canvas>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mt-10">
                            <div class="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5"><div class="w-2 h-2 rounded-full bg-[#10b981]"></div><span class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Banque</span></div>
                            <div class="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5"><div class="w-2 h-2 rounded-full bg-[#3b82f6]"></div><span class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Espèces</span></div>
                            <div class="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5"><div class="w-2 h-2 rounded-full bg-[#6366f1]"></div><span class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Inventaire</span></div>
                            <div class="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5"><div class="w-2 h-2 rounded-full bg-[#a855f7]"></div><span class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Entreprises</span></div>
                        </div>
                    </div>

                    <!-- DOCS PANEL -->
                    <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] flex flex-col items-center text-center relative overflow-hidden group">
                        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
                        <div class="w-24 h-24 bg-indigo-500/10 rounded-[32px] flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-700 shadow-2xl border border-indigo-500/20">
                            <i data-lucide="fingerprint" class="w-12 h-12"></i>
                        </div>
                        <h3 class="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Coffre-fort Numérique</h3>
                        <p class="text-sm text-gray-500 mb-10 max-w-xs font-medium">Accès chiffré à vos documents d'identité et titres de transport officiels.</p>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <button onclick="actions.openIdCard(null, 'id_card')" class="glass-btn p-5 rounded-3xl font-black flex flex-col items-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/20 uppercase tracking-widest italic group">
                                <i data-lucide="id-card" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                                <span class="text-[10px]">Identité</span>
                            </button>
                            <button onclick="actions.openMyRecord()" class="glass-btn-secondary p-5 rounded-3xl font-black text-orange-400 border-orange-500/20 flex flex-col items-center gap-3 hover:bg-orange-600 hover:text-white transition-all uppercase tracking-widest italic group">
                                <i data-lucide="file-clock" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                                <span class="text-[10px]">Casier</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    else if (state.activeAssetsTab === 'inventory') {
        let combinedInventory = [];
        if (state.bankAccount.cash_balance > 0) { combinedInventory.push({ id: 'cash', name: 'Espèces (Liquide)', quantity: state.bankAccount.cash_balance, estimated_value: 1, is_cash: true, object_icon: 'banknote' }); }
        combinedInventory = [...combinedInventory, ...state.inventory];
        if (state.inventoryFilter) { const lower = state.inventoryFilter.toLowerCase(); combinedInventory = combinedInventory.filter(i => i.name.toLowerCase().includes(lower)); }
        const inventoryHtml = combinedInventory.length > 0 ? combinedInventory.map(generateInventoryRow).join('') : `<div class="text-center text-gray-600 py-32 border-2 border-dashed border-white/5 rounded-[40px] opacity-30 flex flex-col items-center"><i data-lucide="package-open" class="w-20 h-20 mb-4"></i><span class="text-sm font-black uppercase tracking-[0.4em]">Sac Vide</span></div>`;
        content = `
            <div class="flex flex-col h-full animate-fade-in">
                <div class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 shrink-0 px-2">
                    <h3 class="text-xl font-black text-white flex items-center gap-4 uppercase italic tracking-tighter">
                        <i data-lucide="backpack" class="w-7 h-7 text-gray-500"></i>
                        Contenu de votre sac
                    </h3>
                    <div class="relative w-full md:w-80">
                        <i data-lucide="search" class="w-4 h-4 absolute left-4 top-3.5 text-gray-500"></i>
                        <input type="text" oninput="actions.handleInventorySearch(this.value)" value="${state.inventoryFilter}" placeholder="Rechercher objet..." class="glass-input pl-10 pr-4 py-3 rounded-2xl w-full text-sm bg-black/40 border-white/10 focus:border-indigo-500/50">
                    </div>
                </div>
                <div class="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20" id="inventory-list-container">
                    ${inventoryHtml}
                </div>
            </div>
        `;
    }
    else if (state.activeAssetsTab === 'invoices') {
        if(state.invoices.length === 0 && !state.hasFetchedInvoices) { fetchPlayerInvoices(state.activeCharacter.id).then(() => { state.hasFetchedInvoices = true; render(); }); }
        const invoicesList = state.invoices.length > 0 ? state.invoices.map(inv => {
            const isFine = !inv.enterprise_id;
            if (isFine) {
                return `
                    <div class="relative w-full max-w-sm bg-[#fafafa] text-black p-6 shadow-2xl border-t-8 border-red-800 rotate-1 transform hover:scale-105 transition-all duration-300 mx-auto mb-6 group">
                        <div class="flex justify-between items-start border-b border-red-800/20 pb-3 mb-4"><div class="text-[10px] font-black text-red-900 tracking-widest uppercase">City Traffic Violation</div><div class="bg-red-800 text-white px-2 py-0.5 text-[8px] font-black uppercase rounded">ID-99</div></div>
                        <div class="text-center mb-6"><div class="font-black text-2xl tracking-tighter uppercase text-red-900 mb-1">L.A. POLICE DEPT</div><div class="text-[8px] uppercase tracking-[0.3em] font-black text-gray-400">Official Citation Report</div></div>
                        <div class="text-xs font-mono mb-6 space-y-2 text-gray-700 font-bold uppercase"><div class="flex justify-between"><span>Date:</span> <span>${new Date(inv.created_at).toLocaleDateString()}</span></div><div class="flex justify-between border-b border-dashed border-gray-300 pb-1"><span>Motif:</span> <span class="text-red-900 truncate ml-4">${inv.item_name.replace('CONTRAVENTION - ', '')}</span></div><div class="flex justify-between"><span>Unit:</span> <span>${inv.promo_code || 'CAD-SYSTEM'}</span></div></div>
                        <div class="border-t-2 border-red-800 pt-4 flex justify-between items-center"><div class="text-[10px] font-black text-red-900 uppercase tracking-widest">Fine Amount</div><div class="font-mono font-black text-3xl text-red-600">-$${inv.total_price}</div></div>
                        <div class="absolute -bottom-2 right-4 opacity-10 grayscale"><i data-lucide="shield-alert" class="w-16 h-16"></i></div>
                    </div>
                `;
            } else {
                return `
                    <div class="relative w-full max-w-xs bg-white text-gray-900 p-8 shadow-2xl mx-auto mb-6 font-mono text-xs transform -rotate-1 hover:scale-105 transition-all duration-300 group">
                        <div class="text-center border-b border-dashed border-gray-400 pb-6 mb-6"><div class="font-black text-xl uppercase tracking-tighter mb-2 italic">${inv.enterprises?.name || 'STORE'}</div><div class="text-[10px] text-gray-400 font-bold">Los Angeles, CA</div><div class="text-[9px] text-gray-400 mt-1">${new Date(inv.created_at).toLocaleString()}</div></div>
                        <div class="space-y-3 mb-6"><div class="flex justify-between font-bold"><span>${inv.item_name} (x${inv.quantity})</span><span>$${inv.total_price.toLocaleString()}</span></div>${inv.promo_code ? `<div class="flex justify-between text-[10px] text-blue-600 font-black"><span>PROMO APPLIED:</span> <span>${inv.promo_code}</span></div>` : ''}</div>
                        <div class="border-t-4 border-double border-gray-400 pt-5 flex justify-between items-center text-base font-black"><span>TOTAL DUE</span><span class="text-lg">$${inv.total_price.toLocaleString()}</span></div>
                        <div class="mt-8 text-center text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">*** Secure Payment ***</div>
                    </div>
                `;
            }
        }).join('') : '<div class="text-center text-gray-600 py-32 italic uppercase font-black tracking-widest text-xs col-span-full opacity-30">Aucun registre de facturation</div>';
        content = `
            <div class="h-full flex flex-col animate-fade-in">
                <h3 class="text-xl font-black text-white mb-8 flex items-center gap-4 uppercase italic tracking-tighter px-2"><i data-lucide="file-text" class="w-7 h-7 text-gray-500"></i> Historique des Factures</h3>
                <div class="flex-1 overflow-y-auto custom-scrollbar p-6 pb-20"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">${invoicesList}</div></div>
            </div>
        `;
    }

    return `
        ${documentHtml}
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            ${refreshBanner}
            
            <div class="px-8 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative z-10 shrink-0">
                <div>
                    <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                        <i data-lucide="gem" class="w-8 h-8 text-indigo-500"></i>
                        Registre Patrimonial
                    </h2>
                    <div class="flex items-center gap-3 mt-1">
                         <span class="text-[10px] text-indigo-500/60 font-black uppercase tracking-widest">Inventaire Civil TFRP</span>
                         <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                         <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Accès Prioritaire</span>
                    </div>
                </div>
                <div class="flex gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-white/5">
                    ${tabs.map(t => `
                        <button onclick="actions.setAssetsTab('${t.id}')" 
                            class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap ${state.activeAssetsTab === t.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex-1 p-8 overflow-y-auto custom-scrollbar relative min-h-0">
                ${content}
            </div>
        </div>
    `;
};
