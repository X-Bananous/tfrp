
import { state } from '../../state.js';

export const DirectoryView = (job) => {
    const isLeo = job === 'leo';
    const isJustice = job === 'juge' || job === 'procureur';
    let citizens = state.allCharactersAdmin || [];
    if (state.servicesSearchQuery) {
        const q = state.servicesSearchQuery.toLowerCase();
        citizens = citizens.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q));
    }

    let contentList = citizens.map(c => {
        const displayJob = (!c.job || c.job === 'unemployed') ? 'Sans emploi' : c.job.toUpperCase();
        
        return `
        <div class="bg-white/5 rounded-xl border border-white/5 p-4 hover:bg-white/10 hover:border-blue-500/30 transition-all group flex flex-col relative overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="flex justify-between items-start mb-3">
                <div class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 font-bold border border-white/10 text-sm">${c.first_name[0]}${c.last_name[0]}</div>
                <div class="flex gap-1">
                    ${isLeo ? `<button onclick="actions.addSuspectToReport('${c.id}')" class="text-xs bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white px-2 py-1.5 rounded-lg border border-red-600/20 transition-colors" title="Ajouter au rapport"><i data-lucide="file-plus" class="w-4 h-4"></i></button>` : ''}
                    ${isJustice ? `<button onclick="actions.openSummonModal('${c.id}', '${c.first_name} ${c.last_name}')" class="text-xs bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white px-2 py-1.5 rounded-lg border border-purple-600/20 transition-colors" title="Convoquer"><i data-lucide="gavel" class="w-4 h-4"></i></button>` : ''}
                    <button onclick="actions.openDossier('${c.id}')" class="text-xs bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-600/20 transition-colors font-medium">Dossier</button>
                </div>
            </div>
            <div class="font-bold text-white text-sm mb-0.5 truncate">${c.first_name} ${c.last_name}</div>
            <div class="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-xs text-gray-400"><span>${c.age} Ans</span><span class="uppercase font-bold text-[10px] text-blue-400">${displayJob}</span></div>
        </div>
    `}).join('');

    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <div class="flex flex-col md:flex-row gap-4 mb-4 shrink-0">
                <div class="relative flex-1">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.searchServices(this.value)" value="${state.servicesSearchQuery}" placeholder="Rechercher un citoyen..." class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm bg-black/20">
                </div>
                <button onclick="actions.openFullReports()" class="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-white/5 text-orange-400 border-orange-500/30 hover:bg-orange-500/10 flex items-center gap-2">
                    <i data-lucide="archive" class="w-3 h-3"></i> Consulter Archives
                </button>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-2">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    ${citizens.length === 0 ? '<div class="col-span-full text-center py-20 text-gray-500 italic">Aucun citoyen trouvé dans la base.</div>' : contentList}
                </div>
            </div>
        </div>
    `;
};

export const DossierView = (job) => {
    const c = state.dossierTarget;
    if (!c) return '';
    
    const isLeo = job === 'leo';
    const isJustice = job === 'juge' || job === 'procureur';
    const hasLicense = c.has_physical_license === true;
    const points = (c.driver_license_points !== undefined && c.driver_license_points !== null) ? c.driver_license_points : 12; 
    const reports = state.criminalRecordReports || [];
    const displayJob = (!c.job || c.job === 'unemployed') ? 'Sans emploi' : c.job.toUpperCase();
    
    let dots = '';
    for(let i=1; i<=12; i++) {
        let color = i <= points ? (points > 8 ? 'bg-emerald-500' : points > 4 ? 'bg-orange-500' : 'bg-red-500') : 'bg-gray-800';
        dots += `<div class="flex-1 h-2 rounded-full ${color}"></div>`;
    }

    return `
        <div class="h-full flex flex-col animate-fade-in">
            <div class="flex items-center justify-between mb-8 pb-6 border-b border-white/5 shrink-0">
                <div class="flex items-center gap-6">
                    <button onclick="actions.closeDossierPage()" class="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <div>
                        <h2 class="text-4xl font-black text-white tracking-tighter uppercase italic">${c.last_name}, ${c.first_name}</h2>
                        <div class="flex items-center gap-3 mt-1">
                            <span class="text-xs text-gray-500 font-mono uppercase tracking-widest">Dossier n°${c.id.split('-')[0].toUpperCase()}</span>
                            <span class="w-1.5 h-1.5 bg-gray-700 rounded-full"></span>
                            <span class="text-xs font-bold text-blue-400 uppercase tracking-widest">${displayJob}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3">
                    ${isLeo ? `
                        <button onclick="actions.addSuspectToReport('${c.id}')" class="glass-btn px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20">
                            <i data-lucide="file-plus" class="w-4 h-4"></i> Ajouter au Rapport
                        </button>
                        <button onclick="actions.performPoliceSearch('${c.id}', '${c.first_name} ${c.last_name}')" class="glass-btn px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/20">
                            <i data-lucide="search" class="w-4 h-4"></i> Lancer Fouille
                        </button>
                    ` : ''}
                    ${isJustice ? `
                         <button onclick="actions.openSummonModal('${c.id}', '${c.first_name} ${c.last_name}')" class="glass-btn px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/20">
                            <i data-lucide="gavel" class="w-4 h-4"></i> Convoquer
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.01] relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
                        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                            <i data-lucide="user" class="w-4 h-4 text-blue-400"></i> État Civil & Identité
                        </h3>
                        <div class="grid grid-cols-2 gap-y-8 gap-x-6">
                            <div><div class="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Prénom</div><div class="text-white font-bold text-lg">${c.first_name}</div></div>
                            <div><div class="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Nom de famille</div><div class="text-white font-bold text-lg">${c.last_name}</div></div>
                            <div><div class="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Date de naissance</div><div class="text-white font-medium">${new Date(c.birth_date).toLocaleDateString('fr-FR')}</div></div>
                            <div><div class="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Âge actuel</div><div class="text-white font-medium">${c.age} ans</div></div>
                            <div><div class="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Lieu de naissance</div><div class="text-white font-medium">${c.birth_place || 'Los Angeles'}</div></div>
                            <div><div class="text-[10px] text-gray-600 uppercase font-black tracking-widest mb-1">Profession</div><div class="text-blue-400 font-bold uppercase text-xs tracking-wider">${displayJob}</div></div>
                        </div>
                    </div>

                    <div class="glass-panel p-8 rounded-3xl border ${hasLicense ? 'border-blue-500/20 bg-blue-500/[0.02]' : 'border-red-500/20 bg-red-500/[0.02]'} relative overflow-hidden">
                        <div class="flex justify-between items-start mb-8">
                            <h3 class="text-xs font-bold ${hasLicense ? 'text-blue-400' : 'text-red-400'} uppercase tracking-[0.2em] flex items-center gap-3">
                                <i data-lucide="id-card" class="w-4 h-4"></i> Permis de Conduire
                            </h3>
                            <div class="text-right">
                                <div class="text-2xl font-black text-white font-mono">${hasLicense ? `${points}/12` : 'NON TITULAIRE'}</div>
                                <span class="text-[9px] font-black uppercase tracking-tighter ${hasLicense ? 'text-emerald-500' : 'text-red-500'}">${hasLicense ? 'Document Valide' : 'Absence de titre'}</span>
                            </div>
                        </div>
                        
                        ${hasLicense ? `
                            <div class="flex gap-1.5 mb-8 h-2.5 bg-black/40 rounded-full p-0.5 overflow-hidden border border-white/5">${dots}</div>
                            ${isLeo ? `
                                <div class="grid grid-cols-3 gap-3">
                                    <button onclick="actions.updateLicensePoints('${c.id}', 1)" class="py-2.5 bg-red-500/10 hover:bg-red-500/30 text-[10px] font-black rounded-xl border border-red-500/20 transition-all text-red-400 uppercase tracking-widest">-1 Point</button>
                                    <button onclick="actions.updateLicensePoints('${c.id}', 3)" class="py-2.5 bg-red-500/10 hover:bg-red-500/30 text-[10px] font-black rounded-xl border border-red-500/20 transition-all text-red-400 uppercase tracking-widest">-3 Points</button>
                                    <button onclick="actions.updateLicensePoints('${c.id}', 6)" class="py-2.5 bg-red-500/10 hover:bg-red-500/30 text-[10px] font-black rounded-xl border border-red-500/20 transition-all text-red-400 uppercase tracking-widest">-6 Points</button>
                                </div>
                            ` : `
                                <div class="py-3 px-4 bg-white/5 rounded-xl border border-white/5 text-[10px] text-blue-300/50 italic text-center uppercase font-bold tracking-widest">
                                    Consultation Administrative Uniquement
                                </div>
                            `}
                        ` : `
                            <div class="py-12 text-center flex flex-col items-center justify-center">
                                <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
                                    <i data-lucide="slash" class="w-8 h-8"></i>
                                </div>
                                <p class="text-sm font-bold text-red-300 uppercase tracking-widest">Avertissement</p>
                                <p class="text-[10px] text-gray-500 mt-1">Le citoyen ne possède aucun document de conduite.</p>
                            </div>
                        `}
                    </div>
                </div>

                <div class="glass-panel p-8 rounded-3xl border border-orange-500/10 bg-orange-500/[0.01]">
                    <div class="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                        <h3 class="text-xs font-bold text-orange-400 uppercase tracking-[0.2em] flex items-center gap-3">
                            <i data-lucide="file-clock" class="w-4 h-4"></i> Historique Judiciaire & Sanctions
                        </h3>
                        <div class="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-[10px] font-black border border-orange-500/20 uppercase tracking-tighter">
                            ${reports.length} Entrée(s)
                        </div>
                    </div>

                    <div class="space-y-4">
                        ${reports.length > 0 ? reports.map(r => {
                            const suspects = r.police_report_suspects || [];
                            const suspectsList = suspects.map(s => s.suspect_name).join(', ');

                            return `
                            <div class="bg-black/30 border border-white/5 rounded-2xl p-6 hover:bg-black/50 transition-all group relative">
                                ${isLeo || isJustice ? `
                                    <button onclick="actions.startEditReport('${r.id}')" class="absolute top-6 right-6 p-2 bg-white/5 hover:bg-orange-500/20 text-gray-500 hover:text-orange-400 rounded-lg border border-white/10 transition-all group/edit" title="Modifier Titre/Description">
                                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                                    </button>
                                ` : ''}
                                <div class="flex flex-col md:flex-row justify-between items-start gap-4 mb-4 pr-10">
                                    <div class="flex-1">
                                        <div class="font-black text-white text-lg uppercase tracking-tight group-hover:text-orange-400 transition-colors">${r.title}</div>
                                        <div class="text-[10px] text-gray-500 font-mono mt-0.5">${new Date(r.created_at).toLocaleString('fr-FR')} • Réf: #${r.id.substring(0,6).toUpperCase()} ${r.is_closed ? '• [SCELLÉ]' : ''}</div>
                                    </div>
                                    <div class="text-right shrink-0">
                                        <div class="text-red-400 font-black text-lg font-mono">$${r.fine_amount.toLocaleString()}</div>
                                        <div class="text-[9px] text-gray-600 uppercase font-bold tracking-widest">Officier: ${r.author_id}</div>
                                    </div>
                                </div>
                                
                                <div class="text-sm text-gray-400 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5 italic mb-4">
                                    "${r.description}"
                                </div>
                                
                                <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 pt-4 border-t border-white/5">
                                    <div class="flex items-center gap-2 text-[10px] text-gray-500">
                                        <i data-lucide="users" class="w-3.5 h-3.5 text-blue-400"></i>
                                        Impliqués : <span class="text-blue-300 font-bold">${suspectsList || 'Non listés'}</span>
                                    </div>
                                    ${r.jail_time > 0 ? `
                                        <div class="flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                            <i data-lucide="lock" class="w-3 h-3"></i> Prison : ${Math.round(r.jail_time / 60)} MIN
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `}).join('') : `
                            <div class="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                                <div class="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500/40 mx-auto mb-4 border border-emerald-500/20">
                                    <i data-lucide="shield-check" class="w-8 h-8"></i>
                                </div>
                                <p class="text-gray-500 text-sm font-bold uppercase tracking-[0.2em]">Casiers Judiciaire Vierge</p>
                                <p class="text-[10px] text-gray-700 mt-2">Aucun incident enregistré pour ce citoyen dans la base de données.</p>
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="py-10 text-center text-[9px] text-gray-700 uppercase font-black tracking-[0.3em] opacity-50">
                    Fin du dossier administratif sécurisé
                </div>
            </div>
        </div>
    `;
};

export const ArchivesView = () => {
    const job = state.activeCharacter?.job || 'unemployed';
    const isLeo = job === 'leo';
    const isJustice = job === 'juge' || job === 'procureur';
    let reports = state.globalReports || [];
    
    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <div class="flex items-center justify-between mb-8 pb-4 border-b border-white/5 shrink-0">
                <div class="flex items-center gap-4">
                    <button onclick="actions.setServicesTab('directory')" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5 transition-all"><i data-lucide="arrow-left" class="w-5 h-5"></i></button>
                    <h2 class="text-2xl font-black text-white uppercase tracking-tight italic">Archives Centrales de Police</h2>
                </div>
                <div class="text-xs text-gray-500 font-bold uppercase tracking-widest">${reports.length} Rapports Archivés</div>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                ${reports.length === 0 ? '<div class="text-center py-20 text-gray-600">Aucune archive disponible.</div>' : reports.map(r => {
                    const suspects = r.police_report_suspects || [];
                    const suspectsList = suspects.map(s => s.suspect_name).join(', ');
                    const isClosed = r.is_closed;
                    
                    return `
                    <div class="bg-white/5 rounded-2xl border border-white/5 p-6 hover:bg-white/[0.08] transition-all group relative">
                        ${(isLeo || isJustice) && !isClosed ? `
                            <button onclick="actions.startEditReport('${r.id}')" class="absolute top-6 right-6 p-2 bg-white/5 hover:bg-orange-500/20 text-gray-500 hover:text-orange-400 rounded-lg border border-white/10 transition-all" title="Modifier">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                        ` : isClosed ? '<div class="absolute top-6 right-6 text-emerald-500"><i data-lucide="shield-check" class="w-5 h-5"></i></div>' : ''}
                        <div class="flex justify-between items-start mb-6 pr-10">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:scale-110 transition-transform">
                                    <i data-lucide="file-text" class="w-6 h-6"></i>
                                </div>
                                <div>
                                    <h3 class="font-black text-white text-lg uppercase tracking-tight">${r.title}</h3>
                                    <p class="text-[10px] text-gray-500 font-mono">${new Date(r.created_at).toLocaleString('fr-FR')} ${isClosed ? '• [SCELLÉ]' : ''}</p>
                                </div>
                            </div>
                            <div class="text-white font-black bg-white/10 px-3 py-1 rounded-lg text-[10px] uppercase border border-white/10 tracking-widest">Off. ${r.author_id}</div>
                        </div>
                        
                        <div class="bg-black/40 p-4 rounded-xl text-gray-300 text-sm leading-relaxed mb-6 font-medium italic border border-white/5">
                            "${r.description}"
                        </div>
                        
                        <div class="mb-6">
                             <div class="text-[10px] text-gray-500 flex items-center gap-2">
                                <i data-lucide="users" class="w-3.5 h-3.5 text-blue-400"></i> 
                                <span class="font-black uppercase tracking-widest">Suspect(s) :</span> 
                                <span class="text-blue-300 font-bold">${suspectsList || 'Non renseigné'}</span>
                            </div>
                        </div>

                        <div class="flex gap-6 text-[10px] border-t border-white/5 pt-5">
                            <div class="flex flex-col"><span class="text-gray-600 font-bold uppercase tracking-widest">Amende</span><span class="text-red-400 font-black text-base">$${r.fine_amount.toLocaleString()}</span></div>
                            <div class="flex flex-col"><span class="text-gray-600 font-bold uppercase tracking-widest">Peine de prison</span><span class="text-blue-400 font-black text-base">${Math.round(r.jail_time / 60)} MIN</span></div>
                        </div>
                    </div>
                `}).join('')}
                <div class="py-10 text-center text-[10px] text-gray-700 uppercase font-black tracking-[0.3em] opacity-30">Contenu Chiffré • Accès CAD-LEO</div>
            </div>
        </div>
    `;
};
