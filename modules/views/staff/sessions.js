
import { state } from '../../state.js';

export const StaffSessionsView = () => {
    return `
        <div class="h-full overflow-hidden animate-fade-in flex flex-col">
            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
                <div class="max-w-5xl mx-auto space-y-8">
                    <div class="glass-panel p-10 rounded-[48px] border border-white/5 bg-[#0a0a0a] shadow-2xl relative overflow-hidden">
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(16,185,129,0.05),transparent_70%)] pointer-events-none"></div>
                        
                        <div class="flex flex-col md:flex-row justify-between items-center mb-12 gap-8 relative z-10">
                            <div class="text-center md:text-left">
                                <h3 class="font-black text-white text-2xl uppercase italic tracking-tighter flex items-center gap-4 justify-center md:justify-start">
                                    <i data-lucide="server" class="w-8 h-8 text-blue-500"></i>
                                    Gestion des Cycles de Jeu
                                </h3>
                                <p class="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Activation des services et synchronisation CAD</p>
                            </div>
                            <button onclick="actions.toggleSession()" class="glass-btn px-10 py-5 rounded-[28px] font-black text-base uppercase tracking-[0.2em] flex items-center gap-4 shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${state.activeGameSession ? 'bg-red-600 hover:bg-red-500 shadow-red-900/30' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'}">
                                <i data-lucide="${state.activeGameSession ? 'stop-circle' : 'play-circle'}" class="w-7 h-7"></i>
                                ${state.activeGameSession ? 'ARRÊTER LA SESSION' : 'OUVRIR LA SESSION'}
                            </button>
                        </div>

                        ${state.activeGameSession ? `
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 relative z-10">
                                <div class="bg-white/5 p-6 rounded-3xl border border-white/5 text-center shadow-inner group hover:border-blue-500/30 transition-all">
                                    <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Temps Écoulé</div>
                                    <div class="text-3xl font-mono font-black text-white">${Math.floor((Date.now() - new Date(state.activeGameSession.start_time).getTime())/60000)}<span class="text-xs ml-1 opacity-50">MIN</span></div>
                                </div>
                                <div class="bg-white/5 p-6 rounded-3xl border border-white/5 text-center shadow-inner group hover:border-blue-500/30 transition-all">
                                    <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Population ERLC</div>
                                    <div class="text-3xl font-mono font-black text-blue-400">${state.erlcData.currentPlayers}<span class="text-xs ml-1 opacity-30">/ ${state.erlcData.maxPlayers}</span></div>
                                </div>
                                <div class="bg-white/5 p-6 rounded-3xl border border-white/5 text-center shadow-inner group hover:border-blue-500/30 transition-all">
                                    <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Staff Mobilisé</div>
                                    <div class="text-3xl font-mono font-black text-purple-400">${state.onDutyStaff.length}</div>
                                </div>
                                <div class="bg-white/5 p-6 rounded-3xl border border-white/5 text-center shadow-inner group hover:border-blue-500/30 transition-all">
                                    <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Signal Crypté</div>
                                    <div class="text-2xl font-mono font-black text-emerald-400 select-all tracking-widest uppercase">${state.erlcData.joinKey}</div>
                                </div>
                            </div>
                        ` : `
                            <div class="py-12 bg-black/40 rounded-[32px] border border-dashed border-white/10 text-center relative z-10 mb-10">
                                <i data-lucide="radio-off" class="w-16 h-16 text-gray-700 mx-auto mb-4"></i>
                                <p class="text-xs font-black uppercase tracking-[0.4em] text-gray-600">Aucun cycle actif détecté sur le cluster</p>
                            </div>
                        `}

                        <h4 class="font-black text-white mb-6 text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 opacity-60 px-2"><i data-lucide="history" class="w-4 h-4"></i> Archives des Sessions</h4>
                        <div class="overflow-hidden rounded-3xl border border-white/5 bg-black/20">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm border-separate border-spacing-0">
                                    <thead class="bg-white/5 text-gray-600 uppercase text-[9px] font-black tracking-widest">
                                        <tr>
                                            <th class="p-5 border-b border-white/5">Hôte de Session</th>
                                            <th class="p-5 border-b border-white/5">Date d'Ouverture</th>
                                            <th class="p-5 border-b border-white/5">Calculée</th>
                                            <th class="p-5 border-b border-white/5 text-center">Pic Pop.</th>
                                            <th class="p-5 border-b border-white/5 text-right">Registre</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-white/5">
                                        ${state.sessionHistory.map(s => {
                                            const duration = s.end_time ? Math.floor((new Date(s.end_time) - new Date(s.start_time)) / 60000) + ' min' : 'En cours';
                                            return `
                                                <tr class="hover:bg-white/[0.02] transition-colors group">
                                                    <td class="p-5 font-black text-white uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">${s.host?.username || 'Système'}</td>
                                                    <td class="p-5 text-gray-500 font-mono text-xs">${new Date(s.start_time).toLocaleDateString()} ${new Date(s.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                                    <td class="p-5 font-mono text-gray-400 font-bold">${duration}</td>
                                                    <td class="p-5 text-center text-gray-300 font-black">${s.peak_player_count || '-'}</td>
                                                    <td class="p-5 text-right"><span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${s.status === 'active' ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-white/5 text-gray-600 border-white/10'}">${s.status}</span></td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};
