
import { state } from '../../state.js';
import { HEIST_DATA } from '../illicit.js';

export const StaffIllegalView = () => {
    const { totalCoke, totalWeed } = state.serverStats;
    const totalDrugs = totalCoke + totalWeed;
    const cokePercent = totalDrugs > 0 ? (totalCoke / totalDrugs) * 100 : 0;
    const weedPercent = totalDrugs > 0 ? (totalWeed / totalDrugs) * 100 : 0;
    const pendingHeists = state.pendingHeistReviews || [];

    const searchUI = (role) => `
        <div class="relative">
            <input type="text" placeholder="Chercher ${role}..." 
                id="gang-${role === 'Leader' ? 'leader' : 'coleader'}-search"
                value="${role === 'Leader' ? (state.gangCreation.leaderResult ? state.gangCreation.leaderResult.name : state.gangCreation.leaderQuery) : (state.gangCreation.coLeaderResult ? state.gangCreation.coLeaderResult.name : state.gangCreation.coLeaderQuery)}"
                oninput="actions.searchGangSearch('${role}', this.value)"
                class="glass-input w-full p-3 pl-10 rounded-2xl text-xs bg-black/40 border-white/10 ${role === 'Leader' && state.gangCreation.leaderResult ? 'border-purple-500 text-purple-300' : ''}" required autocomplete="off">
            <i data-lucide="search" class="w-3.5 h-3.5 absolute left-4 top-4 text-gray-500"></i>
            <div id="gang-${role === 'Leader' ? 'leader' : 'coleader'}-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl mt-1 z-50 max-h-48 overflow-y-auto shadow-2xl hidden"></div>
        </div>
    `;

    return `
        <div class="space-y-8 animate-fade-in">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- DRUG MONITORING -->
                <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    <h3 class="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <i data-lucide="flask-conical" class="w-5 h-5 text-indigo-400"></i> Narcotiques en Circulation
                    </h3>
                    <div class="flex items-end justify-between mb-6">
                        <div class="text-5xl font-mono font-black text-white tracking-tighter">${totalDrugs}<span class="text-sm ml-2 text-gray-600 uppercase tracking-widest">Grammes</span></div>
                        <div class="text-right">
                            <div class="text-[9px] text-gray-500 uppercase font-black mb-1">Masse Saisie Estimée</div>
                            <div class="text-emerald-400 font-mono font-bold text-sm">$${(totalDrugs * 40).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="h-3 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/10 mb-2">
                        <div style="width: ${cokePercent}%" class="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" title="Coke: ${totalCoke}g"></div>
                        <div style="width: ${weedPercent}%" class="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" title="Weed: ${totalWeed}g"></div>
                    </div>
                    <div class="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest">
                        <span>Cocaïne (${Math.round(cokePercent)}%)</span>
                        <span>Cannabis (${Math.round(weedPercent)}%)</span>
                    </div>
                </div>

                <!-- GANG REGISTRATION -->
                <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl relative overflow-hidden">
                    <h3 class="text-xs font-black text-purple-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <i data-lucide="${state.editingGang ? 'edit-3' : 'users-round'}" class="w-5 h-5"></i> 
                        ${state.editingGang ? 'Mutation de Syndicat' : 'Enregistrement de Syndicat'}
                    </h3>
                    <form onsubmit="${state.editingGang ? 'actions.submitEditGang(event)' : 'actions.createGangAdmin(event)'}" class="space-y-4">
                        <input type="text" name="name" 
                            value="${state.editingGang ? state.editingGang.name : state.gangCreation.draftName}" 
                            oninput="actions.updateGangDraftName(this.value)"
                            placeholder="Nom du Syndicat..." class="glass-input w-full p-3.5 rounded-2xl text-sm font-bold bg-black/40 border-white/10 uppercase tracking-tight" required>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                             ${searchUI('Leader')}
                             ${searchUI('Co-Leader')}
                        </div>
                        <div class="flex gap-3 pt-2">
                            ${state.editingGang ? `<button type="button" onclick="actions.cancelEditGang()" class="glass-btn-secondary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Annuler</button>` : ''}
                            <button type="submit" class="glass-btn flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-900/30 transition-all">
                                ${state.editingGang ? 'RATIFIER LES MODIFICATIONS' : 'CRÉER LE SYNDICAT'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[400px]">
                <!-- GANG LIST -->
                <div class="glass-panel rounded-[40px] border border-white/5 bg-[#080808] shadow-2xl flex flex-col overflow-hidden">
                    <div class="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
                        <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-3"><i data-lucide="list" class="w-4 h-4"></i> Syndicats Actifs</h3>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        ${state.gangs.map(g => `
                            <div class="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:bg-white/[0.08] transition-all group">
                                <div>
                                    <div class="font-black text-white text-sm uppercase italic group-hover:text-purple-400 transition-colors">${g.name}</div>
                                    <div class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Haut Commandement: <span class="text-gray-400">${g.leader ? g.leader.first_name + ' ' + g.leader.last_name : 'N/A'}</span></div>
                                </div>
                                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick="actions.openEditGang('${g.id}')" class="p-2 text-blue-400 hover:bg-blue-600/10 rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                    <button onclick="actions.deleteGang('${g.id}')" class="p-2 text-red-400 hover:bg-red-600/10 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- HEIST REVIEWS -->
                <div class="glass-panel rounded-[40px] border border-red-500/20 bg-red-950/[0.01] shadow-2xl flex flex-col overflow-hidden">
                    <div class="p-6 border-b border-red-500/20 bg-red-500/[0.03] flex justify-between items-center shrink-0">
                        <h3 class="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-3"><i data-lucide="shield-alert" class="w-4 h-4"></i> Audit de Braquage (${pendingHeists.length})</h3>
                        <div class="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[8px] font-black uppercase tracking-widest animate-pulse">Action Immédiate</div>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                        ${pendingHeists.length === 0 ? '<div class="h-full flex flex-col items-center justify-center text-gray-600 opacity-30 italic text-xs uppercase font-black tracking-widest">Aucune opération en attente d\'audit</div>' : pendingHeists.map(lobby => {
                            const hInfo = HEIST_DATA.find(h => h.id === lobby.heist_type);
                            return `
                                <div class="bg-black/40 p-5 rounded-3xl border border-white/10 hover:border-red-500/30 transition-all relative group overflow-hidden">
                                    <div class="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                                    <div class="flex justify-between items-start mb-4 pr-4">
                                        <div>
                                            <div class="font-black text-white text-lg uppercase italic tracking-tighter">${hInfo?.name || lobby.heist_type}</div>
                                            <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Opérateur: <span class="text-blue-400">${lobby.characters?.first_name} ${lobby.characters?.last_name}</span></div>
                                        </div>
                                        <div class="text-right">
                                             <div class="text-[8px] text-gray-600 uppercase font-bold tracking-widest">Effectif</div>
                                             <div class="text-xs font-mono font-bold text-white">${lobby.heist_members?.[0]?.count || 0} OPS</div>
                                        </div>
                                    </div>
                                    ${lobby.location ? `<div class="text-[10px] text-orange-300 mb-6 flex items-center gap-2 bg-orange-500/10 p-2 rounded-xl border border-orange-500/20"><i data-lucide="map-pin" class="w-3 h-3"></i> ${lobby.location}</div>` : ''}
                                    
                                    <div class="flex gap-3">
                                        <button onclick="actions.validateHeist('${lobby.id}', true)" class="flex-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-600/30 transition-all shadow-lg shadow-emerald-950/20">VALIDER SUCCÈS</button>
                                        <button onclick="actions.validateHeist('${lobby.id}', false)" class="flex-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-600/30 transition-all shadow-lg shadow-red-950/20">MARQUER ÉCHEC</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};
