
import { state } from '../state.js';
import { DispatchView } from './services/dispatch.js';
import { LEOReportsView, LEOMapView } from './services/leo.js';
import { DirectoryView, DossierView, ArchivesView } from './services/common.js';
import { GovView } from './services/gov.js';
import { JusticeView } from './services/justice.js';
import { LawyerExamView } from './services/lawyer_exam.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-900/10 border-b border-blue-500/10 gap-3 shrink-0 relative">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">CAD System v2.4</span> • Liaison Gouvernementale Sécurisée</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Actualiser Flux
        </button>
    </div>
`;

export const ServicesView = () => {
    const char = state.activeCharacter;
    const job = char?.job || 'unemployed';
    const isLeo = job === 'leo';
    const isLawyer = job === 'lawyer';
    const isGov = job === 'maire' || job === 'adjoint';
    const isJustice = job === 'juge' || job === 'procureur';
    const isAllowed = ['leo', 'lafd', 'ladot', 'lawyer', 'maire', 'adjoint', 'juge', 'procureur'].includes(job);

    if (!isAllowed) {
         return `<div class="h-full flex flex-col items-center justify-center text-gray-500 animate-fade-in bg-[#050505]">
            <div class="w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center mb-6 border border-gray-700/50 shadow-2xl">
                <i data-lucide="shield-off" class="w-10 h-10 opacity-50"></i>
            </div>
            <h2 class="text-xl font-bold text-white mb-2 italic uppercase tracking-tighter">Accès Refusé</h2>
            <p class="text-sm uppercase font-black tracking-widest text-gray-600">Terminal réservé au personnel accrédité</p>
         </div>`;
    }

    // Le barreau est maintenant vérifié sur le personnage actif
    if ((isLawyer || isJustice) && !char.bar_passed) {
        return LawyerExamView();
    }

    // Modal Fouille
    let searchResultModal = '';
    if (state.policeSearchTarget) {
        const { targetName, items, cash } = state.policeSearchTarget;
        searchResultModal = `
            <div class="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="actions.closePoliceSearch()"></div>
                <div class="glass-panel w-full max-w-lg p-6 rounded-2xl relative z-10 flex flex-col shadow-2xl border border-blue-500/30">
                    <h3 class="text-lg font-bold text-white mb-4">Résultat Fouille : ${targetName}</h3>
                    <div class="space-y-2 mb-6">
                        <div class="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between"><span>Liquide</span><span class="text-emerald-400 font-mono">$${cash.toLocaleString()}</span></div>
                        ${items.length > 0 ? items.map(item => `<div class="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between"><span>${item.name}</span><span class="text-gray-400">x${item.quantity}</span></div>`).join('') : '<div class="text-center text-gray-500 italic text-sm">Aucun objet illégal.</div>'}
                    </div>
                    <button onclick="actions.closePoliceSearch()" class="glass-btn w-full py-3 rounded-xl font-bold">Fermer</button>
                </div>
            </div>
        `;
    }

    const tabs = [];
    if (isGov) {
        tabs.push({ id: 'gov_dashboard', label: 'Surveillance', icon: 'layout-dashboard' });
        tabs.push({ id: 'gov_economy', label: 'Pilotage Éco', icon: 'landmark' });
        tabs.push({ id: 'gov_salaries', label: 'Paies', icon: 'banknote' });
    }
    if (isJustice) tabs.push({ id: 'justice_docket', label: 'Dossiers', icon: 'gavel' });
    if (isLeo || job === 'lafd' || job === 'ladot') tabs.push({ id: 'dispatch', label: 'Dispatch', icon: 'radio' });
    if (isLeo || isLawyer || isGov || isJustice) tabs.push({ id: 'directory', label: 'Annuaire', icon: 'folder-search' });
    if (isLeo || isJustice) tabs.push({ id: 'reports', label: isJustice ? 'Décret' : 'Rapport', icon: 'file-plus' });
    if (isLeo) tabs.push({ id: 'map', label: 'Véhicules', icon: 'car-front' });

    let mainContent = '';
    const tab = state.activeServicesTab;

    if (tab === 'dispatch') mainContent = DispatchView(job);
    else if (tab === 'directory') mainContent = DirectoryView(job);
    else if (tab === 'reports' && (isLeo || isJustice)) mainContent = LEOReportsView();
    else if (tab === 'map' && isLeo) mainContent = LEOMapView();
    else if (tab.startsWith('gov_') && isGov) mainContent = GovView(tab);
    else if (tab === 'justice_docket' && isJustice) mainContent = JusticeView();
    else if (tab === 'dossier_detail') mainContent = DossierView(job);
    else if (tab === 'full_reports') mainContent = ArchivesView();
    else {
        mainContent = isJustice ? JusticeView() : isGov ? GovView('gov_dashboard') : isLeo ? DispatchView(job) : DirectoryView(job);
    }

    const themeColor = isJustice ? 'text-purple-400' : 'text-blue-500';
    const themeIcon = isJustice ? 'gavel' : 'shield-check';

    return `
        ${searchResultModal}
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            <!-- Header Block -->
            <div class="flex flex-col shrink-0">
                ${refreshBanner}
                
                <div class="px-8 pb-4 pt-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] relative">
                    <div>
                        <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                            <i data-lucide="${themeIcon}" class="w-8 h-8 ${themeColor}"></i>
                            Terminal Services
                        </h2>
                        <div class="flex items-center gap-3 mt-1">
                             <span class="text-[10px] text-blue-500/60 font-black uppercase tracking-widest">CAD OS v2.4.2</span>
                             <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                             <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Accès Officiel - ${job.toUpperCase()}</span>
                        </div>
                    </div>
                    
                    ${tab !== 'dossier_detail' && tab !== 'full_reports' ? `
                        <div class="flex flex-nowrap gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-white/5">
                            ${tabs.map(t => `
                                <button onclick="actions.setServicesTab('${t.id}')" 
                                    class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${tab === t.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
                                    <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                                </button>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="flex gap-2">
                             <button onclick="actions.setServicesTab('directory')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all bg-white/5 text-gray-400 hover:text-white border border-white/5 shrink-0">
                                <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour Annuaire
                            </button>
                        </div>
                    `}
                </div>
            </div>

            <!-- MAIN SCROLLABLE CONTENT AREA -->
            <div class="flex-1 p-8 overflow-hidden relative min-h-0">
                <div class="h-full overflow-hidden">
                    ${mainContent}
                </div>
            </div>
        </div>
    `;
};
