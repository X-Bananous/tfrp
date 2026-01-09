
import { state } from '../../state.js';
import { HEIST_DATA, HEIST_LOCATIONS } from '../illicit.js';
import { CONFIG } from '../../config.js';

export const IllicitHeistsView = () => {
    const hasGang = !!state.activeGang;
    
    if (!state.activeGameSession) {
        return `
            <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                <div class="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mb-6 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                    <i data-lucide="timer-off" class="w-12 h-12"></i>
                </div>
                <h2 class="text-3xl font-bold text-white mb-4 italic uppercase tracking-tighter">Opérations Suspendues</h2>
                <p class="text-gray-400 max-w-md mx-auto leading-relaxed font-medium">Les équipes logistiques préparent le terrain. Le réseau de coordination est hors-ligne car aucune session n'est active.</p>
            </div>
        `;
    }

    if (state.activeHeistLobby) {
        const lobby = state.activeHeistLobby;
        const hData = HEIST_DATA.find(h => h.id === lobby.heist_type);
        const isHost = lobby.host_id === state.activeCharacter.id;
        const isActive = lobby.status === 'active';
        const isPendingReview = lobby.status === 'pending_review';

        const myMembership = state.heistMembers.find(m => m.character_id === state.activeCharacter.id);
        if (myMembership && myMembership.status === 'pending') {
             return `
                <div class="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                    <div class="loader-spinner w-16 h-16 border-4 mb-8 border-orange-500"></div>
                    <h2 class="text-2xl font-bold text-white mb-2 italic uppercase tracking-tighter">Attente de Signal</h2>
                    <p class="text-gray-400 mb-10 leading-relaxed">Demande envoyée au chef d'équipe <b>${lobby.host_name}</b>.</p>
                    <button onclick="actions.leaveLobby()" class="glass-btn-secondary px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-red-500/20 transition-all">Interrompre la demande</button>
                </div>
             `;
        }

        const pendingMembers = state.heistMembers.filter(m => m.status === 'pending');

        return `
            <div class="max-w-4xl mx-auto h-full flex flex-col justify-center animate-fade-in">
                <div class="glass-panel p-10 rounded-[48px] text-center border border-orange-500/30 shadow-[0_0_80px_rgba(234,88,12,0.15)] relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-600 via-yellow-400 to-orange-600"></div>
                    <div class="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px]"></div>
                    
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] border border-orange-500/20 mb-6">
                        <i data-lucide="radio" class="w-3 h-3 animate-pulse"></i> Fréquence Tactique Unifiée
                    </div>
                    
                    <h2 class="text-6xl font-black text-white mb-3 uppercase italic tracking-tighter">${hData ? hData.name : 'Mission Inconnue'}</h2>
                    <p class="text-gray-500 text-sm font-bold uppercase tracking-widest mb-10">Opérateur Principal : <span class="text-orange-400">${lobby.host_name}</span></p>
                    
                    ${isActive ? `
                        <div class="bg-black/40 rounded-[32px] p-10 border border-white/5 mb-10 relative group">
                            <div class="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div class="text-8xl font-mono font-black text-orange-500 mb-2 tracking-tighter drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]" id="heist-timer-display">00:00</div>
                            <div class="text-[10px] text-gray-600 font-black uppercase tracking-[0.5em]">Synchronisation Chrono</div>
                        </div>
                        ${isHost ? `
                            <button onclick="actions.finishHeist()" class="glass-btn bg-emerald-600 w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest animate-pulse shadow-xl shadow-emerald-900/30">
                                FINALISER L'EXTRACTION
                            </button>
                        ` : `
                            <div class="py-6 px-10 rounded-2xl bg-white/5 text-orange-300 font-black uppercase tracking-[0.2em] border border-orange-500/20 animate-pulse">
                                MISSION EN COURS • MAINTENEZ LE PÉRIMÈTRE
                            </div>
                        `}
                    ` : isPendingReview ? `
                         <div class="bg-blue-600/10 border border-blue-500/30 p-8 rounded-3xl text-blue-300 mb-8 flex flex-col items-center">
                            <i data-lucide="clipboard-check" class="w-12 h-12 mb-4 text-blue-400"></i>
                            <div class="text-lg font-bold uppercase tracking-tight">Debriefing Administratif</div>
                            <p class="text-xs text-blue-400/60 mt-2">Opération terminée. En attente de validation du commandement staff.</p>
                         </div>
                         <button onclick="actions.leaveLobby()" class="text-xs text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors">Dissoudre l'unité</button>
                    ` : `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-10">
                            <div class="glass-panel rounded-3xl p-8 border border-white/5 bg-white/[0.01]">
                                <h3 class="font-black text-white mb-6 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3">
                                    <i data-lucide="users" class="w-4 h-4 text-orange-400"></i> Équipe d'assaut (${state.heistMembers.filter(m => m.status === 'accepted').length}/${hData.teamMax})
                                </h3>
                                <div class="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                                    ${state.heistMembers.filter(m => m.status === 'accepted').map(m => `
                                        <div class="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-orange-500/30 transition-all">
                                            <span class="text-sm font-bold text-gray-200 uppercase tracking-tight group-hover:text-white">${m.characters?.first_name}</span>
                                            <span class="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="glass-panel rounded-3xl p-8 border border-orange-500/20 bg-orange-500/[0.02]">
                                <h3 class="font-black text-orange-400 mb-6 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3">
                                    <span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span> 
                                    Renforts en attente (${pendingMembers.length})
                                </h3>
                                <div class="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                                    ${pendingMembers.length === 0 ? '<div class="py-10 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest opacity-30">Aucun signal</div>' : pendingMembers.map(p => `
                                        <div class="flex items-center justify-between p-4 bg-black/60 rounded-2xl border border-orange-500/10">
                                            <span class="text-xs font-bold text-gray-300 uppercase tracking-tighter">${p.characters?.first_name}</span>
                                            <div class="flex gap-2">
                                                <button onclick="actions.acceptHeistApplicant('${p.character_id}')" class="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 p-2 rounded-xl border border-emerald-500/20 hover:text-white transition-all"><i data-lucide="check" class="w-4 h-4"></i></button>
                                                <button onclick="actions.rejectHeistApplicant('${p.character_id}')" class="bg-red-500/10 text-red-400 hover:bg-red-500 p-2 rounded-xl border border-red-500/20 hover:text-white transition-all"><i data-lucide="x" class="w-4 h-4"></i></button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4 w-full">
                            <button onclick="actions.leaveLobby()" class="glass-btn-secondary flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all">AVORTEMENT MISSION</button>
                            ${isHost ? `
                                <button onclick="actions.startHeistLobby(${hData.time})" class="glass-btn flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-900/30">
                                    LANCER L'ASSAUT
                                </button>
                            ` : ''}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    const activeLobbies = state.availableHeistLobbies.filter(l => l.status === 'active');
    const setupLobbies = state.availableHeistLobbies.filter(l => l.status === 'setup');

    return `
        <div class="h-full flex flex-col min-h-0 animate-fade-in">
            <div class="flex-1 overflow-y-auto custom-scrollbar pb-10 pr-2">
                
                ${[...activeLobbies, ...setupLobbies].length > 0 ? `
                    <div class="mb-12">
                        <h3 class="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
                            <span class="flex-1 h-px bg-white/10"></span>
                            FRÉQUENCES ACTIVES
                            <span class="flex-1 h-px bg-white/10"></span>
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${[...activeLobbies, ...setupLobbies].map(l => {
                                const h = HEIST_DATA.find(d => d.id === l.heist_type);
                                return `
                                    <div class="glass-panel p-6 rounded-[32px] border ${l.status === 'setup' ? 'border-blue-500/30 bg-blue-500/[0.02]' : 'border-orange-500/30 bg-orange-500/[0.03]'} flex flex-col gap-6 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                        <div class="absolute top-0 right-0 w-20 h-20 ${l.status === 'setup' ? 'bg-blue-500/5' : 'bg-orange-500/5'} rounded-bl-full"></div>
                                        <div class="flex justify-between items-start relative z-10">
                                            <div>
                                                <div class="text-[9px] font-black ${l.status === 'setup' ? 'text-blue-400' : 'text-orange-400'} uppercase mb-1 tracking-widest">
                                                    ${l.status === 'setup' ? 'RECUTEMENT OUVERT' : 'MISSION EN COURS'}
                                                </div>
                                                <div class="font-black text-white text-xl uppercase tracking-tight italic">${h.name}</div>
                                            </div>
                                            <div class="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-white border border-white/5">
                                                <i data-lucide="${h.icon}" class="w-5 h-5"></i>
                                            </div>
                                        </div>
                                        <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Opérateur : <span class="text-white">${l.host_name}</span></div>
                                        ${l.status === 'setup' ? `
                                            <button onclick="actions.requestJoinLobby('${l.id}')" class="mt-auto glass-btn-secondary w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all">REJOINDRE L'UNITÉ</button>
                                        ` : `
                                            <div class="mt-auto py-3 bg-orange-500/10 rounded-2xl text-[9px] font-black text-orange-400 uppercase tracking-widest text-center border border-orange-500/20">SIGNAL ACTIF</div>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <div>
                    <h3 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                        <span class="flex-1 h-px bg-white/5"></span>
                        PLANIFICATION D'OPÉRATION
                        <span class="flex-1 h-px bg-white/5"></span>
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        ${HEIST_DATA.map(h => {
                            const isLocked = h.requiresGang && (!hasGang || state.activeGang?.myStatus !== 'accepted');
                            return `
                                <div class="glass-panel p-0 rounded-[32px] flex flex-col overflow-hidden border border-white/5 hover:border-white/20 transition-all group shadow-lg ${isLocked ? 'opacity-40 grayscale' : ''}">
                                    <div class="p-8 flex items-center gap-6 border-b border-white/5 bg-white/[0.02] relative overflow-hidden">
                                        ${!isLocked ? `<div class="absolute -right-6 -top-6 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all"></div>` : ''}
                                        <div class="w-14 h-14 rounded-2xl bg-[#1a1a1c] flex items-center justify-center text-orange-500 shadow-2xl border border-white/10 group-hover:scale-110 group-hover:text-orange-400 transition-all shrink-0">
                                            <i data-lucide="${h.icon}" class="w-7 h-7"></i>
                                        </div>
                                        <div class="min-w-0">
                                            <h3 class="font-black text-white text-xl uppercase italic tracking-tighter truncate">${h.name}</h3>
                                            <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">Cible Référencée</div>
                                        </div>
                                    </div>
                                    <div class="p-8 flex-1 flex flex-col justify-between gap-6">
                                        <div class="grid grid-cols-2 gap-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                            <div class="flex items-center gap-2.5 bg-black/30 p-2 rounded-xl border border-white/5">
                                                <i data-lucide="users" class="w-3.5 h-3.5 text-blue-400"></i> ${h.teamMin}-${h.teamMax} OPS
                                            </div>
                                            <div class="flex items-center gap-2.5 bg-black/30 p-2 rounded-xl border border-white/5">
                                                <i data-lucide="clock" class="w-3.5 h-3.5 text-orange-400"></i> ${Math.floor(h.time/60)} MIN
                                            </div>
                                        </div>
                                        <div class="flex items-end justify-between mt-2 pt-6 border-t border-white/5">
                                            <div>
                                                <div class="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Butin Potentiel</div>
                                                <div class="font-mono font-black text-emerald-400 text-2xl tracking-tighter">$${(h.max/1000).toFixed(0)}k</div>
                                            </div>
                                            <button onclick="actions.createLobby('${h.id}')" ${isLocked ? 'disabled' : ''} 
                                                class="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all transform active:scale-95
                                                ${isLocked ? 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5' : 'bg-white text-black hover:bg-orange-500 hover:text-white shadow-orange-900/10'}">
                                                INITIALISER
                                            </button>
                                        </div>
                                    </div>
                                    ${isLocked ? `
                                        <div class="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                                            <div class="bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1 rounded shadow-lg transform -rotate-12">Syndicat Requis</div>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
};
