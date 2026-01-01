
import { state } from '../../state.js';

export const IllicitBountiesView = () => {
    return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0 animate-fade-in">
            
            <!-- LEFT: NEW CONTRACT -->
            <div class="lg:col-span-4 flex flex-col">
                <div class="glass-panel p-8 rounded-[40px] h-fit border border-white/5 bg-white/[0.01] relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <h3 class="font-black text-white uppercase tracking-widest text-sm mb-8 flex items-center gap-3 shrink-0">
                        <i data-lucide="file-plus" class="w-5 h-5 text-red-500"></i> 
                        Émettre un Contrat
                    </h3>
                    
                    <form onsubmit="actions.createNewBounty(event)" class="space-y-6" autocomplete="off">
                        <div class="relative z-20">
                            <label class="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1 mb-2 block">Cible Identifiée</label>
                            <div class="relative group">
                                <i data-lucide="search" class="w-4 h-4 absolute left-4 top-4 text-gray-500 group-focus-within:text-red-500 transition-colors"></i>
                                <input type="text" id="bounty_target_input" placeholder="Rechercher citoyen..." value="${state.bountySearchQuery}" oninput="actions.searchBountyTarget(this.value)" 
                                    class="glass-input w-full p-4 pl-12 rounded-2xl text-sm bg-black/40 border-white/10 ${state.bountyTarget ? 'text-red-400 font-bold border-red-500/30' : ''}" 
                                    ${state.bountyTarget ? 'readonly' : ''}>
                                ${state.bountyTarget ? `<button type="button" onclick="actions.clearBountyTarget()" class="absolute right-4 top-4 text-gray-500 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>` : ''}
                            </div>
                            ${!state.bountyTarget && state.gangCreation.searchResults.length > 0 ? `
                                <div class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl mt-2 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar animate-fade-in">
                                    ${state.gangCreation.searchResults.map(r => `
                                        <div onclick="actions.selectBountyTarget('${r.id}', '${r.first_name} ${r.last_name}')" class="p-4 hover:bg-white/10 cursor-pointer text-sm text-gray-200 border-b border-white/5 last:border-0 flex items-center gap-3">
                                            <div class="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-[10px] font-black text-gray-500">${r.first_name[0]}</div>
                                            ${r.first_name} ${r.last_name}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <div>
                            <label class="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1 mb-2 block">Mise à Prix ($)</label>
                            <div class="relative">
                                <span class="absolute left-4 top-3.5 text-red-500 font-black text-lg">$</span>
                                <input type="number" name="amount" min="10000" max="100000" placeholder="10,000 - 100,000" class="glass-input w-full p-4 pl-10 rounded-2xl text-lg font-mono font-black text-white bg-black/40 border-white/10" required>
                            </div>
                        </div>

                        <div>
                            <label class="text-[10px] text-gray-600 font-black uppercase tracking-widest ml-1 mb-2 block">Cahier des Charges (RP)</label>
                            <textarea name="description" rows="4" placeholder="Description de l'objectif..." class="glass-input w-full p-4 rounded-2xl text-sm bg-black/40 border-white/10 italic"></textarea>
                        </div>

                        <button type="submit" class="glass-btn w-full py-5 rounded-2xl font-black text-sm bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30 uppercase tracking-[0.2em] transform active:scale-95 transition-all">
                            DÉLIVRER L'ORDRE
                        </button>
                    </form>
                </div>
            </div>

            <!-- RIGHT: BOUNTY LIST -->
            <div class="lg:col-span-8 flex flex-col h-full overflow-hidden">
                <div class="glass-panel p-0 rounded-[40px] flex-1 flex flex-col border border-white/5 bg-[#080808] overflow-hidden shadow-2xl relative">
                    <div class="p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
                        <h3 class="font-black text-white uppercase tracking-tighter text-xl flex items-center gap-3">
                            <i data-lucide="list" class="w-6 h-6 text-gray-600"></i>
                            Tableau de Chasse
                        </h3>
                        <div class="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] font-black border border-red-500/20 uppercase tracking-widest animate-pulse">Signals Actifs</div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                        ${state.bounties.length === 0 ? `
                            <div class="h-full flex flex-col items-center justify-center opacity-20">
                                <i data-lucide="crosshair" class="w-20 h-20 mb-4"></i>
                                <p class="text-sm font-black uppercase tracking-[0.4em]">Aucune cible active</p>
                            </div>
                        ` : state.bounties.map(b => {
                            const isCreator = b.creator_id === state.activeCharacter.id;
                            const isActive = b.status === 'active';
                            return `
                            <div class="p-6 bg-black/40 border ${isActive ? 'border-white/5 hover:border-red-500/30' : 'border-gray-800 opacity-50'} rounded-[32px] transition-all group relative overflow-hidden">
                                ${!isActive ? '<div class="absolute inset-0 bg-black/60 z-10 flex items-center justify-center"><span class="text-[10px] font-black uppercase tracking-[0.5em] text-gray-600 border border-gray-800 px-6 py-2 rounded-full">Dossier Clos</span></div>' : ''}
                                <div class="flex flex-col md:flex-row justify-between items-start gap-6 relative z-0">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-4 mb-4">
                                            <div class="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 group-hover:scale-110 transition-transform shadow-lg">
                                                <i data-lucide="skull" class="w-7 h-7"></i>
                                            </div>
                                            <div>
                                                <h3 class="font-black text-white text-2xl uppercase italic tracking-tighter group-hover:text-red-400 transition-colors">${b.target_name}</h3>
                                                <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Sponsor : ${isCreator ? '<span class="text-blue-400">VOUS</span>' : 'NON RÉPERTORIÉ'}</div>
                                            </div>
                                        </div>
                                        ${b.description ? `<div class="text-sm text-gray-400 bg-white/5 p-4 rounded-2xl border border-white/5 italic font-medium">"${b.description}"</div>` : ''}
                                    </div>
                                    <div class="text-right shrink-0">
                                        <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Rémunération</div>
                                        <div class="text-3xl font-mono font-black text-red-500 tracking-tighter drop-shadow-lg">$${b.amount.toLocaleString()}</div>
                                        <div class="text-[8px] text-gray-700 font-mono mt-2 uppercase tracking-tighter">REF: #${b.id.substring(0,8).toUpperCase()}</div>
                                    </div>
                                </div>
                                ${isCreator && isActive ? `
                                    <div class="mt-6 pt-6 border-t border-white/5 flex justify-end gap-4">
                                        <button onclick="actions.resolveBounty('${b.id}', 'CANCEL')" class="text-[10px] font-black text-gray-600 uppercase tracking-widest hover:text-red-500 transition-colors">ANNULER L'ORDRE</button>
                                        <button onclick="actions.resolveBounty('${b.id}')" class="px-6 py-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-black uppercase rounded-xl border border-emerald-600/30 transition-all shadow-lg shadow-emerald-900/10">SÉCURISER LE PAIEMENT</button>
                                    </div>
                                ` : ''}
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};
