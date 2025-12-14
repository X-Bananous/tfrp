
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { HEIST_DATA } from './illicit.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-4 py-3 mb-4 bg-blue-500/5 border-y border-blue-500/10 gap-3 shrink-0">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">CAD System v2.4</span> • Connexion Sécurisée</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser Données
        </button>
    </div>
`;

export const ServicesView = () => {
    // ACCESS CONTROL (Job)
    const job = state.activeCharacter?.job || 'unemployed';
    const isLeo = job === 'leo';
    const isLawyer = job === 'lawyer';
    const isAllowed = ['leo', 'lafd', 'ladot', 'lawyer'].includes(job);

    if (!isAllowed) {
         return `<div class="h-full flex flex-col items-center justify-center text-gray-500 animate-fade-in">
            <div class="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-700">
                <i data-lucide="shield-off" class="w-10 h-10 opacity-50"></i>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Accès Restreint</h2>
            <p class="text-sm">Ce terminal est réservé au personnel des Services Publics & Avocats.</p>
            <div class="mt-4 px-3 py-1 rounded bg-red-500/10 text-red-400 text-xs border border-red-500/20 uppercase font-bold">Job RP Requis</div>
         </div>`;
    }

    // --- SEARCH MODAL (Overlay) ---
    // ... (policeSearchTarget and criminalRecordTarget modals stay same) ...
    let searchResultModal = '';
    if (state.policeSearchTarget) {
        const { targetName, items, cash } = state.policeSearchTarget;
        searchResultModal = `
            <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closePoliceSearch()"></div>
                <div class="glass-panel w-full max-w-lg p-0 rounded-2xl relative z-10 flex flex-col shadow-2xl border border-blue-500/30 overflow-hidden">
                    <div class="bg-blue-900/20 p-4 border-b border-white/10 flex justify-between items-center">
                        <h3 class="text-lg font-bold text-white flex items-center gap-2"><i data-lucide="search" class="w-5 h-5 text-blue-400"></i> Résultat Fouille</h3>
                        <button onclick="actions.closePoliceSearch()" class="text-gray-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>
                    <div class="p-6 bg-[#0a0a0a]">
                        <p class="text-sm text-gray-400 mb-4">Citoyen: <span class="text-white font-bold uppercase">${targetName}</span></p>
                        <div class="space-y-2 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                             <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                <div class="flex items-center gap-3">
                                    <i data-lucide="banknote" class="w-4 h-4 text-emerald-400"></i>
                                    <span class="text-sm font-bold text-white">Argent Liquide</span>
                                </div>
                                <span class="font-mono text-emerald-400">$${cash.toLocaleString()}</span>
                            </div>
                            ${items.length > 0 ? items.map(item => `
                                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="package" class="w-4 h-4 text-gray-400"></i>
                                        <span class="text-sm font-bold text-white">${item.name}</span>
                                    </div>
                                    <span class="text-sm text-gray-400">x${item.quantity}</span>
                                </div>
                            `).join('') : '<div class="text-center text-gray-500 py-4 italic text-sm">Aucun objet illégal visible.</div>'}
                        </div>
                        <button onclick="actions.closePoliceSearch()" class="glass-btn w-full py-3 rounded-xl text-sm font-bold">Fermer le rapport</button>
                    </div>
                </div>
            </div>
        `;
    }

    let recordModal = '';
    if (state.criminalRecordTarget) {
        const reports = state.criminalRecordReports || [];
        recordModal = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closeCriminalRecord()"></div>
                <div class="glass-panel w-full max-w-2xl p-0 rounded-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden">
                    <div class="p-5 border-b border-white/10 flex justify-between items-center bg-[#0f172a]">
                        <h3 class="text-lg font-bold text-white flex items-center gap-2"><i data-lucide="file-text" class="w-5 h-5 text-gray-400"></i> Casier Judiciaire</h3>
                        <button onclick="actions.closeCriminalRecord()" class="text-gray-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-5 bg-[#050505] space-y-3">
                        <div class="text-xs text-gray-500 uppercase font-bold mb-2">Historique pour ${state.criminalRecordTarget.first_name} ${state.criminalRecordTarget.last_name}</div>
                        ${reports.length > 0 ? reports.map(r => `
                            <div class="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="font-bold text-orange-400 text-sm truncate pr-2" title="${r.title}">${r.title}</div>
                                    <div class="text-[10px] text-gray-500 bg-black/30 px-2 py-1 rounded whitespace-nowrap">${new Date(r.created_at).toLocaleDateString()}</div>
                                </div>
                                <div class="text-sm text-gray-300 mb-3 leading-relaxed">"${r.description}"</div>
                                <div class="flex gap-2 text-xs border-t border-white/5 pt-3">
                                    <div class="text-red-300"><span class="text-gray-500">Amende:</span> $${r.fine_amount}</div>
                                    <div class="text-gray-500">•</div>
                                    <div class="text-blue-300"><span class="text-gray-500">Prison:</span> ${Math.round(r.jail_time / 60)} min</div>
                                    <div class="ml-auto text-gray-600">Off. ${r.author_id}</div>
                                </div>
                            </div>
                        `).join('') : '<div class="text-center text-gray-500 py-10 italic border border-dashed border-white/10 rounded-xl">Casier vierge.</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    // TABS CONFIGURATION
    let tabs = [];
    if (isLawyer) {
        // LAWYER SPECIFIC TABS (No Dispatch)
        tabs = [
            { id: 'directory', label: 'Annuaire & Rapports', icon: 'folder-search' }
        ];
    } else if (isLeo) {
        // LEO TABS
        tabs = [
            { id: 'dispatch', label: 'Dispatch', icon: 'radio' },
            { id: 'directory', label: 'Annuaire', icon: 'folder-search' },
            { id: 'reports', label: 'Rédiger Rapport', icon: 'file-plus' },
            { id: 'map', label: 'Véhicules', icon: 'car-front' }
        ];
    } else {
        // EMS / DOT
         tabs = [ { id: 'dispatch', label: 'Dispatch', icon: 'radio' } ];
    }

    // Determine current logic view
    const isDossierView = state.activeServicesTab === 'dossier_detail' && state.dossierTarget;
    const isFullReportsView = state.activeServicesTab === 'full_reports';

    // CONTENT SWITCHER
    let content = '';

    // === 1. DISPATCH / CENTRAL ===
    if (state.activeServicesTab === 'dispatch') {
        const heists = state.globalActiveHeists || [];
        const activeAlerts = heists.filter(h => (Date.now() - new Date(h.start_time).getTime()) > 30000); 
        const allCalls = state.emergencyCalls || [];
        const filteredCalls = allCalls.filter(c => {
            if (isLawyer) return false; // Double check: Lawyer shouldn't see calls logic
            if (job === 'leo') return c.service === 'police';
            if (job === 'lafd') return c.service === 'ems';
            if (job === 'ladot') return c.service === 'dot';
            return false;
        });

        const themeColor = isLeo ? 'blue' : job === 'lafd' ? 'red' : 'yellow';

        content = `
            <div class="flex flex-col h-full overflow-hidden">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
                    <div class="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                        <div><div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Code 3</div><div class="text-xl font-bold text-red-500 animate-pulse">${activeAlerts.length}</div></div>
                        <i data-lucide="siren" class="w-5 h-5 text-red-500/50"></i>
                    </div>
                    <div class="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                        <div><div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Appels 911</div><div class="text-xl font-bold text-white">${filteredCalls.length}</div></div>
                        <i data-lucide="phone-call" class="w-5 h-5 text-gray-500"></i>
                    </div>
                    <div class="bg-${themeColor}-500/10 border border-${themeColor}-500/20 p-3 rounded-xl flex items-center justify-between">
                        <div><div class="text-[10px] text-${themeColor}-300 uppercase font-bold tracking-widest">Canal</div><div class="text-lg font-bold text-${themeColor}-400 uppercase">${job}</div></div>
                        <i data-lucide="radio" class="w-5 h-5 text-${themeColor}-500"></i>
                    </div>
                </div>

                <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                    <div class="flex-1 flex flex-col bg-red-950/10 border border-red-500/20 rounded-2xl overflow-hidden relative">
                        <div class="p-4 border-b border-red-500/20 bg-red-500/5 flex justify-between items-center shrink-0">
                            <h3 class="font-bold text-red-400 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <span class="relative flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span> Alertes Prioritaires
                            </h3>
                            <span class="text-[10px] text-red-500/60 font-mono">LIVE FEED</span>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            ${activeAlerts.length > 0 ? activeAlerts.map(h => {
                                const hData = HEIST_DATA.find(d => d.id === h.heist_type);
                                return `
                                    <div class="bg-black/40 border-l-4 border-red-500 p-4 rounded-r-lg relative overflow-hidden group hover:bg-black/60 transition-colors">
                                        <div class="flex justify-between items-start mb-2"><div class="font-bold text-white text-lg">${hData ? hData.name : h.heist_type}</div><i data-lucide="alert-triangle" class="w-5 h-5 text-red-500 animate-pulse"></i></div>
                                        ${h.location ? `<div class="flex items-center gap-2 text-sm text-red-200 mb-2"><i data-lucide="map-pin" class="w-4 h-4"></i> ${h.location}</div>` : ''}
                                        <div class="flex gap-2 mt-3"><button class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded flex-1 transition-colors">Prendre l'appel</button></div>
                                    </div>
                                `;
                            }).join('') : `<div class="h-full flex flex-col items-center justify-center text-gray-600 opacity-50"><i data-lucide="check-circle" class="w-12 h-12 mb-2"></i><p class="text-sm uppercase font-bold tracking-widest">Secteur Calme</p></div>`}
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                        <div class="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                            <h3 class="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider"><i data-lucide="radio" class="w-4 h-4 text-blue-400"></i> Appels Entrants</h3>
                            <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">911</span>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                            ${filteredCalls.length > 0 ? filteredCalls.map(c => {
                                // Joined Units Badge
                                const joinedUnits = c.joined_units || [];
                                const hasJoined = joinedUnits.some(u => u.id === state.activeCharacter.id);
                                
                                return `
                                <div class="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div class="flex justify-between items-start mb-1"><div class="flex items-center gap-2"><span class="text-xs font-mono text-gray-500">${new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span><span class="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">${c.caller_id}</span></div><span class="px-2 py-0.5 bg-white/10 rounded text-[10px] text-gray-400 uppercase tracking-wide">${c.service}</span></div>
                                    <div class="text-sm text-gray-300 mb-2 pl-6 border-l-2 border-white/10 group-hover:border-blue-500/50 transition-colors">"${c.description}"</div>
                                    <div class="flex items-center justify-between pl-6 mt-2">
                                        <div class="flex items-center gap-2"><i data-lucide="map-pin" class="w-3 h-3 text-gray-500"></i><span class="text-xs text-gray-400 font-mono">${c.location}</span></div>
                                        ${!isLawyer ? `
                                            <button onclick="actions.joinCall('${c.id}')" ${hasJoined ? 'disabled' : ''} class="text-[10px] px-2 py-1 rounded border ${hasJoined ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'} transition-colors">
                                                ${hasJoined ? 'Sur place' : 'Rejoindre'}
                                            </button>
                                        ` : ''}
                                    </div>
                                    ${joinedUnits.length > 0 ? `
                                        <div class="flex gap-1 flex-wrap mt-2 pl-6">
                                            ${joinedUnits.map(u => `<span class="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">${u.badge} ${u.name.split(' ')[1]}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `}).join('') : `<div class="p-8 text-center text-gray-600 italic text-sm">Aucun appel en attente.</div>`}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === 2. ANNUAIRE / DIRECTORY ===
    else if (state.activeServicesTab === 'directory') {
        const showReports = state.servicesDirectoryMode === 'reports';
        
        let contentList = '';
        
        if (showReports) {
            // View All Reports (For Lawyers/Admins/Cops)
            let reports = state.globalReports || [];
            if(state.servicesSearchQuery) {
                const q = state.servicesSearchQuery.toLowerCase();
                reports = reports.filter(r => r.title.toLowerCase().includes(q) || r.author_id.toLowerCase().includes(q));
            }
            
            contentList = reports.length > 0 ? reports.map(r => `
                <div class="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-bold text-orange-400 text-sm truncate pr-2" title="${r.title}">${r.title}</div>
                        <div class="text-[10px] text-gray-500 bg-black/30 px-2 py-1 rounded whitespace-nowrap">${new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="text-sm text-gray-300 mb-3 leading-relaxed truncate">"${r.description}"</div>
                    <div class="flex gap-2 text-xs border-t border-white/5 pt-3">
                        <div class="text-red-300"><span class="text-gray-500">Amende:</span> $${r.fine_amount}</div>
                        <div class="text-gray-500">•</div>
                        <div class="text-blue-300"><span class="text-gray-500">Prison:</span> ${Math.round(r.jail_time / 60)} min</div>
                        <div class="ml-auto text-gray-600">Off. ${r.author_id}</div>
                    </div>
                </div>
            `).join('') : '<div class="col-span-full text-center py-10 text-gray-500 italic">Aucun rapport trouvé.</div>';
            
        } else {
            // View Citizens
            let citizens = state.allCharactersAdmin || [];
            if (state.servicesSearchQuery) {
                const q = state.servicesSearchQuery.toLowerCase();
                citizens = citizens.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q));
            }
            
            contentList = citizens.length > 0 ? citizens.map(c => `
                <div class="bg-white/5 rounded-xl border border-white/5 p-4 hover:bg-white/10 hover:border-blue-500/30 transition-all group flex flex-col relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="flex justify-between items-start mb-3">
                        <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 font-bold border border-white/10 text-sm">${c.first_name[0]}${c.last_name[0]}</div>
                        <div class="flex gap-1">
                            ${isLeo ? `
                                <button onclick="actions.addSuspectToReport('${c.id}')" class="text-xs bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white px-2 py-1.5 rounded-lg border border-red-600/20 transition-colors" title="Ajouter au rapport"><i data-lucide="file-plus" class="w-4 h-4"></i></button>
                            ` : ''}
                            <button onclick="actions.openDossier('${c.id}')" class="text-xs bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-600/20 transition-colors font-medium">Dossier</button>
                        </div>
                    </div>
                    <div class="font-bold text-white text-sm mb-0.5 truncate">${c.first_name} ${c.last_name}</div>
                    <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-3">${c.id.split('-')[0]}</div>
                    <div class="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400"><span>${c.age} Ans</span><span>${c.job === 'unemployed' ? 'Sans Emploi' : c.job.toUpperCase()}</span></div>
                </div>
            `).join('') : '<div class="col-span-full text-center py-10 text-gray-500 italic">Aucun résultat.</div>';
        }

        content = `
            <div class="flex flex-col h-full overflow-hidden">
                <div class="flex flex-col md:flex-row gap-4 mb-4 shrink-0">
                    <div class="relative flex-1">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" oninput="actions.searchServices(this.value)" value="${state.servicesSearchQuery}" placeholder="Rechercher..." class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm bg-black/20 focus:bg-black/40 transition-colors">
                    </div>
                    <div class="flex gap-2">
                        <button onclick="actions.toggleDirectoryMode('citizens')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!showReports ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/5 text-gray-400 border-white/5'}">Citoyens</button>
                        <button onclick="actions.toggleDirectoryMode('reports')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showReports ? 'bg-orange-600 text-white border-orange-600' : 'bg-white/5 text-gray-400 border-white/5'}">Rapports</button>
                        ${showReports ? `
                            <button onclick="actions.openFullReports()" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-white/5 text-blue-400 border-blue-500/30 hover:bg-blue-500/10 flex items-center gap-2">
                                <i data-lucide="maximize-2" class="w-3 h-3"></i> Archives Complètes
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        ${contentList}
                    </div>
                </div>
            </div>
        `;
    }

    // === NEW: FULL REPORTS VIEW (ARCHIVES) ===
    else if (isFullReportsView) {
        let reports = state.globalReports || [];
        if(state.servicesSearchQuery) {
            const q = state.servicesSearchQuery.toLowerCase();
            reports = reports.filter(r => r.title.toLowerCase().includes(q) || r.author_id.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
        }

        content = `
            <div class="flex flex-col h-full overflow-hidden animate-fade-in">
                <div class="flex items-center justify-between mb-6 shrink-0 border-b border-white/5 pb-4">
                    <div class="flex items-center gap-4">
                        <button onclick="actions.setServicesTab('directory')" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <i data-lucide="archive" class="w-6 h-6 text-orange-500"></i> Archives Centrales
                        </h2>
                    </div>
                    <div class="relative w-72">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" oninput="actions.searchServices(this.value)" value="${state.servicesSearchQuery}" placeholder="Recherche textuelle..." class="glass-input pl-10 pr-4 py-2 rounded-xl w-full text-sm">
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div class="space-y-4">
                        ${reports.length > 0 ? reports.map(r => `
                            <div class="bg-white/5 rounded-xl border border-white/5 p-6 hover:border-white/10 transition-colors">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                                            <i data-lucide="file-text" class="w-5 h-5"></i>
                                        </div>
                                        <div>
                                            <h3 class="font-bold text-white text-lg">${r.title}</h3>
                                            <p class="text-xs text-gray-500">Enregistré le ${new Date(r.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Officier</div>
                                        <div class="text-white font-medium bg-white/10 px-2 py-0.5 rounded text-xs">${r.author_id}</div>
                                    </div>
                                </div>
                                
                                <div class="bg-black/30 p-4 rounded-lg border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-4 font-mono">
                                    ${r.description}
                                </div>

                                <div class="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div class="flex gap-4">
                                        <div class="flex items-center gap-2 text-xs">
                                            <span class="text-gray-500 uppercase font-bold">Amende:</span>
                                            <span class="text-red-400 font-mono font-bold">$${r.fine_amount}</span>
                                        </div>
                                        <div class="flex items-center gap-2 text-xs">
                                            <span class="text-gray-500 uppercase font-bold">Peine:</span>
                                            <span class="text-blue-400 font-mono font-bold">${Math.round(r.jail_time / 60)} min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('') : '<div class="text-center py-20 text-gray-500 italic">Aucune archive trouvée.</div>'}
                    </div>
                </div>
            </div>
        `;
    }

    // === 3. DOSSIER DETAIL PAGE ===
    else if (isDossierView) {
        const c = state.dossierTarget;
        const points = c.driver_license_points !== undefined ? c.driver_license_points : 12;
        const isLicenseValid = points > 0;
        
        let dots = '';
        for(let i=1; i<=12; i++) {
            let color = 'bg-gray-800';
            if (i <= points) {
                if(points > 8) color = 'bg-emerald-500';
                else if(points > 4) color = 'bg-orange-500';
                else color = 'bg-red-500';
            }
            dots += `<div class="flex-1 h-2 rounded-full ${color}"></div>`;
        }

        content = `
            <div class="h-full flex flex-col animate-fade-in bg-[#080808]">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6 pb-6 border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-4">
                        <button onclick="actions.closeDossierPage()" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                            <i data-lucide="arrow-left" class="w-5 h-5"></i>
                        </button>
                        <div>
                            <h2 class="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                ${c.last_name.toUpperCase()}, ${c.first_name}
                                ${c.job !== 'unemployed' ? `<span class="text-xs bg-blue-900/50 text-blue-300 px-3 py-1 rounded border border-blue-500/20 uppercase font-bold">${c.job}</span>` : ''}
                            </h2>
                            <div class="flex items-center gap-4 text-xs text-gray-500 font-mono mt-1">
                                <span>ID: ${c.id.split('-')[0]}</span>
                                <span>•</span>
                                <span>Né(e) le: ${new Date(c.birth_date).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Lieu: ${c.birth_place}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="actions.openCriminalRecord('${c.id}')" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2"><i data-lucide="file-clock" class="w-4 h-4"></i> Casier</button>
                        ${isLeo ? `
                            <button onclick="actions.performPoliceSearch('${c.id}', '${c.first_name} ${c.last_name}')" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm flex items-center gap-2 text-purple-400 border-purple-500/30 hover:bg-purple-500/10"><i data-lucide="search" class="w-4 h-4"></i> Fouille</button>
                            <button onclick="actions.addSuspectToReport('${c.id}')" class="glass-btn px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-red-600 hover:bg-red-500"><i data-lucide="file-plus" class="w-4 h-4"></i> Signaler</button>
                        ` : ''}
                    </div>
                </div>

                <!-- Main Grid -->
                <div class="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Left Column -->
                    <div class="space-y-6">
                        <div class="glass-panel p-6 rounded-2xl border border-blue-500/10 relative overflow-hidden">
                            <div class="absolute top-0 right-0 p-6 opacity-5"><i data-lucide="fingerprint" class="w-32 h-32 text-white"></i></div>
                            <h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2"><i data-lucide="id-card" class="w-5 h-5 text-blue-400"></i> Permis de Conduire</h3>
                            
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-bold text-gray-400 uppercase">Solde de Points</span>
                                <span class="text-xl font-bold ${points > 8 ? 'text-emerald-400' : points > 4 ? 'text-orange-400' : 'text-red-500'}">${points}/12</span>
                            </div>
                            <div class="flex gap-1 mb-6 h-3 bg-black/40 rounded-full p-1 border border-white/5">
                                ${dots}
                            </div>

                            ${isLicenseValid && isLeo ? `
                                <div class="grid grid-cols-3 gap-3">
                                    <button onclick="actions.updateLicensePoints('${c.id}', 1)" class="py-3 bg-white/5 hover:bg-red-900/20 hover:border-red-500/30 text-gray-300 hover:text-red-400 text-xs font-bold rounded-xl border border-white/5 transition-colors flex flex-col items-center gap-1">
                                        <span class="text-lg font-bold">-1</span> Point
                                    </button>
                                    <button onclick="actions.updateLicensePoints('${c.id}', 3)" class="py-3 bg-white/5 hover:bg-red-900/20 hover:border-red-500/30 text-gray-300 hover:text-red-400 text-xs font-bold rounded-xl border border-white/5 transition-colors flex flex-col items-center gap-1">
                                        <span class="text-lg font-bold">-3</span> Points
                                    </button>
                                    <button onclick="actions.updateLicensePoints('${c.id}', 6)" class="py-3 bg-white/5 hover:bg-red-900/20 hover:border-red-500/30 text-gray-300 hover:text-red-400 text-xs font-bold rounded-xl border border-white/5 transition-colors flex flex-col items-center gap-1">
                                        <span class="text-lg font-bold">-6</span> Points
                                    </button>
                                </div>
                            ` : ''}
                        </div>

                        <div class="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 class="text-lg font-bold text-white mb-4">Informations Complémentaires</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span class="text-gray-400 text-sm">Alignement</span>
                                    <span class="text-white font-bold text-sm uppercase">${c.alignment}</span>
                                </div>
                                <div class="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span class="text-gray-400 text-sm">Age</span>
                                    <span class="text-white font-bold text-sm">${c.age} Ans</span>
                                </div>
                                <div class="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span class="text-gray-400 text-sm">Discord</span>
                                    <span class="text-blue-300 text-sm">@${c.discord_username || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === 4. RAPPORTS ===
    else if (state.activeServicesTab === 'reports') {
        const suspectsList = state.reportSuspects.map((s, idx) => `
            <div class="flex items-center justify-between bg-white/5 p-2 rounded-lg text-sm border border-white/10">
                <div class="flex items-center gap-2"><div class="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-[10px] text-gray-300 font-bold">${s.name[0]}</div><span class="text-white font-medium">${s.name}</span></div>
                <button onclick="actions.removeSuspectFromReport(${idx})" class="text-gray-500 hover:text-red-400 p-1"><i data-lucide="x" class="w-3 h-3"></i></button>
            </div>
        `).join('');

        content = `
            <div class="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                <div class="flex-1 flex flex-col bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                    <div class="p-5 border-b border-white/5 bg-white/[0.02]"><h3 class="font-bold text-white flex items-center gap-2"><i data-lucide="file-plus" class="w-5 h-5 text-blue-400"></i> Nouveau Rapport</h3></div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <form onsubmit="actions.submitPoliceReport(event)" class="space-y-5">
                            <div class="bg-black/20 p-4 rounded-xl border border-white/5">
                                <label class="text-xs text-gray-500 uppercase font-bold mb-3 block flex justify-between">Suspects <span class="text-blue-400">${state.reportSuspects.length} ajouté(s)</span></label>
                                ${suspectsList ? `<div class="space-y-2 mb-3">${suspectsList}</div>` : ''}
                                <button type="button" onclick="actions.setServicesTab('directory')" class="w-full py-2 bg-blue-500/10 border border-dashed border-blue-500/30 rounded-lg text-xs text-blue-300 hover:text-white hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"><i data-lucide="user-plus" class="w-3 h-3"></i> Sélectionner dans l'annuaire</button>
                            </div>
                            <div class="space-y-4">
                                <div><label class="text-xs text-gray-400 uppercase font-bold ml-1 mb-1 block">Qualification</label><input type="text" name="title" class="glass-input w-full p-3 rounded-xl text-sm" placeholder="Ex: Refus d'obtempérer" required maxlength="60"></div>
                                <div><label class="text-xs text-gray-400 uppercase font-bold ml-1 mb-1 block">Détails</label><textarea name="description" rows="5" class="glass-input w-full p-3 rounded-xl text-sm leading-relaxed" placeholder="Faits..."></textarea></div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div><label class="text-xs text-gray-400 uppercase font-bold ml-1 mb-1 block">Amende ($)</label><div class="relative"><span class="absolute left-3 top-3 text-emerald-500 font-bold">$</span><input type="number" name="fine_amount" class="glass-input w-full pl-6 p-3 rounded-xl text-sm font-mono" value="0" max="25000"></div></div>
                                    <div><label class="text-xs text-gray-400 uppercase font-bold ml-1 mb-1 block">Peine (Temps)</label><div class="relative"><i data-lucide="clock" class="w-4 h-4 absolute left-3 top-3 text-blue-500"></i><input type="number" name="jail_time" class="glass-input w-full pl-9 p-3 rounded-xl text-sm font-mono" value="0" placeholder="Secondes"></div></div>
                                </div>
                            </div>
                            <div class="pt-4 border-t border-white/5">
                                <button type="submit" class="glass-btn w-full py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"><i data-lucide="save" class="w-4 h-4"></i> Archiver & Sanctionner</button>
                                <p class="text-[10px] text-gray-500 text-center mt-2 italic">Prélèvement automatique sur le compte bancaire.</p>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="hidden lg:flex w-72 flex-col justify-center items-center text-center p-6 bg-white/5 rounded-2xl border border-white/5">
                    <div class="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400"><i data-lucide="book" class="w-10 h-10"></i></div>
                    <h3 class="text-lg font-bold text-white mb-2">Code Pénal</h3>
                    <p class="text-sm text-gray-400 leading-relaxed mb-6">Consultez la grille tarifaire officielle sur Discord.</p>
                    <a href="https://discord.com/channels/1446063243750543384/1447349419358949446" target="_blank" class="glass-btn-secondary px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-500/20 hover:text-blue-300 w-full flex items-center justify-center gap-2"><i data-lucide="external-link" class="w-4 h-4"></i> Ouvrir Discord</a>
                </div>
            </div>
        `;
    }

    // === 5. VEHICULES / MAP ===
    else if (state.activeServicesTab === 'map') {
        let vehicles = state.erlcData.vehicles || [];
        if(state.vehicleSearchQuery) {
            const q = state.vehicleSearchQuery.toLowerCase();
            vehicles = vehicles.filter(v => 
                (v.Name && v.Name.toLowerCase().includes(q)) || 
                (v.Owner && v.Owner.toLowerCase().includes(q))
            );
        }

        content = `
            <div class="flex flex-col h-full overflow-hidden">
                <div class="flex gap-4 mb-4 shrink-0">
                    <div class="relative flex-1">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" oninput="actions.searchVehicles(this.value)" value="${state.vehicleSearchQuery}" placeholder="Rechercher plaque, modèle..." class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm bg-black/20 focus:bg-black/40">
                    </div>
                    <div class="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-400 flex items-center gap-2"><i data-lucide="car" class="w-3 h-3"></i> ${vehicles.length} Véhicules</div>
                </div>
                <div class="flex-1 overflow-hidden rounded-xl border border-white/5 bg-white/5 flex flex-col">
                    <div class="overflow-y-auto custom-scrollbar flex-1">
                        <table class="w-full text-left text-sm border-collapse">
                            <thead class="bg-[#151515] text-xs uppercase text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
                                <tr><th class="p-4">Modèle</th><th class="p-4">Propriétaire</th><th class="p-4">Livrée</th><th class="p-4 text-right">Type</th></tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                ${vehicles.length > 0 ? vehicles.map(v => {
                                    // IMPROVED TEAM LOGIC
                                    let team = 'Civil';
                                    let colorClass = 'bg-gray-800 text-gray-400 border-gray-700';
                                    
                                    if (v.Team) {
                                        if (v.Team === 'Police' || v.Team === 'Sheriff') { team = 'Police'; colorClass = 'bg-blue-900/50 text-blue-300 border-blue-500/20'; }
                                        else if (v.Team === 'Fire' || v.Team === 'EMS') { team = 'Urgence'; colorClass = 'bg-red-900/50 text-red-300 border-red-500/20'; }
                                        else if (v.Team === 'DOT') { team = 'DOT'; colorClass = 'bg-yellow-900/50 text-yellow-300 border-yellow-500/20'; }
                                    } else {
                                        const name = (v.Name || '').toLowerCase();
                                        const texture = (v.Texture || '').toLowerCase();
                                        if (name.includes('police') || name.includes('sheriff') || name.includes('undercover') || name.includes('fbi') || texture.includes('police')) {
                                            team = 'Force de l\'ordre';
                                            colorClass = 'bg-blue-900/50 text-blue-300 border-blue-500/20';
                                        } else if (name.includes('ambulance') || name.includes('fire') || name.includes('ems')) {
                                            team = 'Urgence';
                                            colorClass = 'bg-red-900/50 text-red-300 border-red-500/20';
                                        } else if (name.includes('dot') || name.includes('tow')) {
                                            team = 'DOT';
                                            colorClass = 'bg-yellow-900/50 text-yellow-300 border-yellow-500/20';
                                        }
                                    }

                                    return `
                                    <tr class="hover:bg-white/5 transition-colors group">
                                        <td class="p-4 font-bold text-white">${v.Name || 'Inconnu'}</td>
                                        <td class="p-4 text-gray-300 group-hover:text-white transition-colors">${v.Owner || 'Non identifié'}</td>
                                        <td class="p-4 text-gray-500 text-xs">${v.Texture || 'Standard'}</td>
                                        <td class="p-4 text-right"><span class="text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${colorClass}">${team}</span></td>
                                    </tr>
                                    `;
                                }).join('') : '<tr><td colspan="4" class="p-10 text-center text-gray-500 italic">Aucun véhicule détecté.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        ${searchResultModal}
        ${recordModal}
        
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            ${refreshBanner}
            ${!isDossierView && !isFullReportsView ? `
                <div class="px-6 pb-4 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 shrink-0">
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2"><i data-lucide="shield-check" class="w-6 h-6 text-blue-500"></i> Terminal Services</h2>
                        <div class="flex items-center gap-2 mt-1"><span class="text-xs text-gray-400">Opérateur:</span><span class="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</span></div>
                    </div>
                    <div class="flex bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                        ${tabs.map(t => `
                            <button onclick="actions.setServicesTab('${t.id}')" class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeServicesTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                                <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="flex-1 p-6 overflow-hidden relative min-h-0">
                ${content}
            </div>
        </div>
    `;
};
