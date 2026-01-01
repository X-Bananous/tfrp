
import { state } from '../../state.js';

export const IllicitGangsView = () => {
    const myGang = state.activeGang;
    
    if (myGang) {
        const isLeader = (myGang.myRank === 'leader' || myGang.myRank === 'co_leader') && myGang.myStatus === 'accepted';
        const isPending = myGang.myStatus === 'pending';
        
        const leaderName = myGang.leader ? `${myGang.leader.first_name} ${myGang.leader.last_name}` : 'Inconnu';
        const coLeaderName = myGang.co_leader ? `${myGang.co_leader.first_name} ${myGang.co_leader.last_name}` : 'Aucun';
        
        const allMembers = myGang.members || [];
        const acceptedMembers = allMembers.filter(m => m.status === 'accepted');
        const pendingMembers = allMembers.filter(m => m.status === 'pending');
        const balance = myGang.balance || 0;

        if (isPending) {
            return `
                <div class="flex items-center justify-center h-full p-4 animate-fade-in">
                    <div class="glass-panel p-10 rounded-[40px] max-w-lg w-full text-center border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.1)] relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                        <div class="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-6 relative"><i data-lucide="hourglass" class="w-10 h-10 animate-pulse"></i></div>
                        <h2 class="text-3xl font-bold text-white mb-2 italic uppercase tracking-tighter">Candidature au Gang</h2>
                        <div class="inline-block px-6 py-2 rounded-full bg-purple-500/10 text-purple-300 text-sm font-black border border-purple-500/20 mb-8 uppercase tracking-widest">${myGang.name}</div>
                        <div class="text-gray-400 mb-8 text-sm bg-black/20 p-6 rounded-2xl border border-white/5 leading-relaxed font-medium">Votre demande d'affiliation est en cours de traitement par le haut commandement du gang.</div>
                        <button onclick="actions.leaveGang()" class="glass-btn-secondary px-8 py-4 rounded-2xl text-red-400 font-bold border-red-500/20 w-full transition-all hover:bg-red-500/10">Révoquer ma candidature</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0 animate-fade-in">
                
                <!-- LEFT SIDE: MEMBERSHIP -->
                <div class="lg:col-span-8 flex flex-col min-h-0">
                    <div class="glass-panel p-8 rounded-[32px] border border-white/5 bg-[#0a0a0a] mb-6 shrink-0 relative overflow-hidden">
                        <div class="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
                        <div class="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <h2 class="text-4xl font-black text-white mb-1 tracking-tighter uppercase italic">${myGang.name}</h2>
                                <div class="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-purple-500/30">
                                    <i data-lucide="shield" class="w-3 h-3"></i> RANG : ${myGang.myRank}
                                </div>
                            </div>
                            <button onclick="actions.leaveGang()" class="text-[10px] text-red-500 font-black uppercase tracking-widest hover:text-red-400 transition-colors">Quitter le Gang</button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                            <div class="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><i data-lucide="crown" class="w-5 h-5"></i></div>
                                <div><div class="text-[9px] text-gray-500 uppercase font-black tracking-widest">Leader</div><div class="text-sm font-bold text-white">${leaderName}</div></div>
                            </div>
                            <div class="bg-black/30 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><i data-lucide="star" class="w-5 h-5"></i></div>
                                <div><div class="text-[9px] text-gray-500 uppercase font-black tracking-widest">Co-Leader</div><div class="text-sm font-bold text-white">${coLeaderName}</div></div>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 glass-panel rounded-[32px] border border-white/5 bg-[#080808] flex flex-col overflow-hidden">
                        <div class="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
                            <h3 class="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                                <i data-lucide="users" class="w-4 h-4 text-purple-400"></i>
                                Effectif du Gang (${acceptedMembers.length})
                            </h3>
                        </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar">
                            <table class="w-full text-left text-sm border-separate border-spacing-0">
                                <thead class="bg-black/30 text-gray-500 uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th class="p-5 border-b border-white/5">Membre</th>
                                        <th class="p-5 border-b border-white/5">Grade</th>
                                        ${isLeader ? '<th class="p-5 border-b border-white/5 text-right">Opérations</th>' : ''}
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5">
                                    ${acceptedMembers.map(m => `
                                        <tr class="hover:bg-white/[0.02] transition-colors group">
                                            <td class="p-5">
                                                <div class="font-bold text-white uppercase tracking-tight group-hover:text-purple-400 transition-colors">${m.characters?.first_name} ${m.characters?.last_name}</div>
                                                <div class="text-[9px] text-gray-600 font-mono">#${m.character_id.substring(0,8).toUpperCase()}</div>
                                            </td>
                                            <td class="p-5">
                                                <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${m.rank === 'leader' ? 'bg-red-500/10 text-red-400 border-red-500/20' : m.rank === 'co_leader' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-white/5 text-gray-500 border-white/10'}">
                                                    ${m.rank}
                                                </span>
                                            </td>
                                            ${isLeader ? `
                                                <td class="p-5 text-right flex justify-end gap-2">
                                                    ${m.character_id !== state.activeCharacter.id ? `
                                                        <button onclick="actions.gangDistribute('${m.character_id}', '${m.characters?.first_name}')" class="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 border border-emerald-500/10 transition-all" title="Distribuer"><i data-lucide="banknote" class="w-4 h-4"></i></button>
                                                        ${m.rank !== 'leader' ? `<button onclick="actions.manageGangRequest('${m.character_id}', 'kick')" class="p-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 border border-red-500/10 transition-all" title="Exclure"><i data-lucide="user-x" class="w-4 h-4"></i></button>` : ''}
                                                    ` : '<span class="text-[9px] text-gray-600 font-black uppercase tracking-widest pt-2.5">Vous</span>'}
                                                </td>
                                            `: ''}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- RIGHT SIDE: VAULT & PENDING -->
                <div class="lg:col-span-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                    
                    <div class="glass-panel p-8 rounded-[32px] bg-gradient-to-br from-emerald-950/20 via-[#0c0c0e] to-black border border-emerald-500/20 shadow-2xl relative overflow-hidden group">
                        <div class="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
                        <div class="flex items-center justify-between mb-8 relative z-10">
                            <h3 class="font-black text-emerald-400 text-[10px] uppercase tracking-[0.2em]">Coffre de Gang</h3>
                            <i data-lucide="vault" class="w-5 h-5 text-emerald-500"></i>
                        </div>
                        <div class="text-4xl font-mono font-bold text-white mb-8 text-center tracking-tighter drop-shadow-lg">$ ${balance.toLocaleString()}</div>
                        
                        <div class="space-y-3 relative z-10">
                            <form onsubmit="actions.gangDeposit(event)" class="flex gap-2">
                                <input type="number" name="amount" placeholder="Dépôt" class="glass-input flex-1 p-3 rounded-xl text-xs font-mono bg-black/40 border-white/10 focus:border-emerald-500/50" required min="1">
                                <button type="submit" class="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/20"><i data-lucide="arrow-down-to-line" class="w-4 h-4"></i></button>
                            </form>
                            ${isLeader ? `
                                <form onsubmit="actions.gangWithdraw(event)" class="flex gap-2">
                                    <input type="number" name="amount" placeholder="Retrait" class="glass-input flex-1 p-3 rounded-xl text-xs font-mono bg-black/40 border-white/10 focus:border-red-500/50" required min="1">
                                    <button type="submit" class="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all shadow-lg shadow-red-900/20"><i data-lucide="arrow-up-from-line" class="w-4 h-4"></i></button>
                                </form>
                            ` : ''}
                        </div>
                    </div>

                    ${isLeader && pendingMembers.length > 0 ? `
                        <div class="glass-panel p-6 rounded-[32px] border border-orange-500/20 bg-orange-500/[0.02]">
                            <h3 class="font-black text-orange-400 mb-6 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3">
                                <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span> 
                                Nouvelles Recrues (${pendingMembers.length})
                            </h3>
                            <div class="space-y-3">
                                ${pendingMembers.map(p => `
                                    <div class="p-4 bg-black/40 rounded-2xl flex justify-between items-center border border-white/5 hover:border-orange-500/30 transition-all">
                                        <div class="font-bold text-white text-xs uppercase tracking-tight">${p.characters?.first_name} ${p.characters?.last_name}</div>
                                        <div class="flex gap-2">
                                            <button onclick="actions.manageGangRequest('${p.character_id}', 'accept')" class="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 p-2 rounded-lg transition-all border border-emerald-500/20 hover:text-white"><i data-lucide="check" class="w-4 h-4"></i></button>
                                            <button onclick="actions.manageGangRequest('${p.character_id}', 'reject')" class="bg-red-500/10 text-red-400 hover:bg-red-500 p-2 rounded-lg transition-all border border-red-500/20 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-white/[0.01] flex items-center justify-center py-12 text-center">
                            <div class="opacity-20 flex flex-col items-center">
                                <i data-lucide="user-plus" class="w-10 h-10 mb-2"></i>
                                <div class="text-[9px] font-black uppercase tracking-widest">Aucune candidature</div>
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    return `
        <div class="max-w-6xl mx-auto h-full flex flex-col animate-fade-in">
            <div class="text-center mb-10 shrink-0">
                <div class="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] border border-purple-500/20 mb-4">
                    <i data-lucide="globe" class="w-3 h-3"></i> Registre des Gangs
                </div>
                <h2 class="text-4xl font-black text-white tracking-tighter uppercase italic">Hiérarchie du Crime</h2>
                <p class="text-gray-500 text-xs font-medium uppercase tracking-widest mt-2">Los Angeles, California • Unified Criminal Network</p>
            </div>
            
            <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${state.gangs.map(g => `
                        <div class="glass-panel p-8 rounded-[32px] border border-white/5 hover:border-purple-500/30 transition-all group flex flex-col relative overflow-hidden shadow-xl">
                            <div class="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-700"></div>
                            
                            <div class="flex justify-between items-start mb-8 relative z-10">
                                <div class="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#1a1a1c] to-black border border-white/10 flex items-center justify-center text-purple-400 font-black text-2xl shadow-2xl group-hover:scale-110 group-hover:text-purple-300 transition-all">
                                    ${g.name[0]}
                                </div>
                                <div class="text-right">
                                    <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest">Status</div>
                                    <div class="text-[10px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">Recrutement</div>
                                </div>
                            </div>
                            
                            <h3 class="text-2xl font-black text-white mb-2 relative z-10 uppercase italic tracking-tight">${g.name}</h3>
                            <div class="flex items-center gap-2 text-xs text-gray-500 mb-8 relative z-10 font-medium">
                                <i data-lucide="crown" class="w-3.5 h-3.5 text-purple-500/50"></i>
                                Chef: <span class="text-gray-300 font-black uppercase">${g.leader ? `${g.leader.first_name} ${g.leader.last_name}` : 'Inconnu'}</span>
                            </div>

                            <button onclick="actions.applyToGang('${g.id}')" class="mt-auto glass-btn-secondary w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-purple-600 hover:text-white hover:border-purple-500 hover:shadow-purple-900/20 transition-all relative z-10">
                                SOUMETTRE AFFILIATION
                            </button>
                        </div>
                    `).join('')}
                    
                    ${state.gangs.length === 0 ? `
                        <div class="col-span-full flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
                            <i data-lucide="ghost" class="w-16 h-16 mb-4"></i>
                            <div class="text-sm font-black uppercase tracking-[0.4em]">Zone Franche</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
};
