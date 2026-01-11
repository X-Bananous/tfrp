import { state } from '../../state.js';

export const StaffSanctionsView = () => {
    const results = state.staffSanctionResults || [];
    const target = state.activeSanctionTarget;
    const globalSanctions = state.globalSanctions || [];
    const targetHistory = state.activeSanctionTargetHistory || [];

    // On isole les contestations actives (sanctions avec appeal_at non null)
    const activeAppeals = globalSanctions.filter(s => s.appeal_at !== null);

    return `
        <div class="h-full flex flex-col gap-8 animate-fade-in overflow-y-auto custom-scrollbar pr-2 pb-20">
            
            ${activeAppeals.length > 0 ? `
                <!-- APPEALS SECTION (PRIORITY) -->
                <div class="space-y-4 shrink-0">
                    <h3 class="text-xs font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-4 px-2">
                        <span class="w-8 h-px bg-blue-500/30"></span> Contestations en Attente (${activeAppeals.length})
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${activeAppeals.map(s => {
                            const tColor = s.type === 'warn' ? 'yellow' : s.type === 'mute' ? 'orange' : 'red';
                            return `
                                <div class="glass-panel p-6 rounded-[32px] border border-blue-500/30 bg-blue-900/[0.02] relative overflow-hidden group">
                                    <div class="absolute top-0 right-0 p-3">
                                        <i data-lucide="bell" class="w-5 h-5 text-blue-500/50 animate-pulse"></i>
                                    </div>
                                    <div class="flex items-center gap-4 mb-4">
                                        <img src="${s.target?.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-12 h-12 rounded-xl border border-white/10 object-cover">
                                        <div>
                                            <div class="font-black text-white text-base uppercase italic tracking-tight">${s.target?.username || 'Citoyen Inconnu'}</div>
                                            <div class="text-[8px] text-gray-500 uppercase font-black">Appel déposé le ${new Date(s.appeal_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="space-y-4">
                                        <div class="bg-black/40 p-4 rounded-2xl border border-white/5">
                                            <div class="text-[8px] text-gray-600 font-black uppercase mb-1">Sanction d'origine (${s.type})</div>
                                            <p class="text-[11px] text-gray-400 italic">"${s.reason}"</p>
                                        </div>
                                        <div class="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
                                            <div class="text-[8px] text-blue-400 font-black uppercase mb-1">Argumentaire de défense</div>
                                            <p class="text-xs text-white leading-relaxed">"${s.appeal_text}"</p>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-3 mt-6">
                                        <button onclick="actions.decideSanctionAppeal('${s.id}', 'approve')" class="py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-black text-[9px] uppercase tracking-widest transition-all">Accepter (Purge)</button>
                                        <button onclick="actions.decideSanctionAppeal('${s.id}', 'reject')" class="py-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-black text-[9px] uppercase tracking-widest transition-all">Rejeter</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                
                <!-- LEFT: SEARCH & TARGET -->
                <div class="lg:col-span-5 flex flex-col gap-6">
                    <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl relative no-overflow-clipping">
                        <h3 class="font-black text-white text-lg uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                            <i data-lucide="search" class="w-5 h-5 text-purple-400"></i> Rechercher Cible
                        </h3>
                        <div class="relative z-[100]">
                            <input type="text" oninput="actions.searchUserForSanction(this.value)" value="${state.staffSanctionSearchQuery || ''}" placeholder="Discord ID ou Pseudo..." class="glass-input w-full p-4 pl-12 rounded-2xl text-sm font-bold bg-black/40 border-white/10 uppercase" autocomplete="off">
                            <i data-lucide="user" class="w-5 h-5 absolute left-4 top-4 text-gray-600"></i>
                            
                            <div id="sanction-search-results" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl mt-2 max-h-56 overflow-y-auto z-[150] shadow-2xl custom-scrollbar hidden animate-fade-in"></div>
                        </div>
                    </div>

                    ${target ? `
                        <!-- TARGET HISTORY -->
                        <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-[#0a0a0a] animate-fade-in">
                            <h4 class="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i data-lucide="history" class="w-3.5 h-3.5"></i> Antécédents de ${target.username}
                            </h4>
                            <div class="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                ${targetHistory.length === 0 ? '<p class="text-[9px] text-gray-700 italic uppercase font-black text-center py-4">Casier Vierge</p>' : targetHistory.map(s => `
                                    <div class="p-2 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center">
                                        <div class="flex items-center gap-2">
                                            <span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${s.type === 'ban' ? 'bg-red-600' : s.type === 'mute' ? 'bg-orange-600' : 'bg-yellow-600'} text-white">${s.type}</span>
                                            <span class="text-[9px] text-gray-400 font-medium truncate max-w-[120px]">"${s.reason}"</span>
                                        </div>
                                        <span class="text-[8px] text-gray-600 font-mono">${new Date(s.created_at).toLocaleDateString()}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="glass-panel p-8 rounded-[40px] border border-purple-500/30 bg-purple-950/[0.02] shadow-xl animate-slide-up">
                            <div class="flex items-center gap-6 mb-8">
                                <img src="${target.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-16 h-16 rounded-2xl border-2 border-purple-500/50 shadow-2xl">
                                <div class="flex-1 min-w-0">
                                    <div class="font-black text-white text-xl uppercase italic tracking-tighter truncate">${target.username}</div>
                                    <div class="text-[9px] text-purple-400 font-black uppercase tracking-widest">Émission Sanction</div>
                                </div>
                                <button onclick="actions.clearSanctionTarget()" class="text-gray-600 hover:text-white transition-colors"><i data-lucide="x" class="w-6 h-6"></i></button>
                            </div>
                            <form onsubmit="actions.applySanctionStaff(event)" class="space-y-6">
                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Nature du Signalement</label>
                                    <div class="grid grid-cols-3 gap-2">
                                        <label class="cursor-pointer">
                                            <input type="radio" name="type" value="warn" checked class="peer sr-only">
                                            <div class="py-3 text-center rounded-xl bg-white/5 text-gray-500 peer-checked:bg-yellow-600/20 peer-checked:text-yellow-400 peer-checked:border peer-checked:border-yellow-500/50 transition-all font-black text-[10px] uppercase">WARN</div>
                                        </label>
                                        <label class="cursor-pointer">
                                            <input type="radio" name="type" value="mute" class="peer sr-only">
                                            <div class="py-3 text-center rounded-xl bg-white/5 text-gray-500 peer-checked:bg-orange-600/20 peer-checked:text-orange-400 peer-checked:border peer-checked:border-orange-500/50 transition-all font-black text-[10px] uppercase">MUTE</div>
                                        </label>
                                        <label class="cursor-pointer">
                                            <input type="radio" name="type" value="ban" class="peer sr-only">
                                            <div class="py-3 text-center rounded-xl bg-white/5 text-gray-500 peer-checked:bg-red-600/20 peer-checked:text-red-400 peer-checked:border peer-checked:border-red-500/50 transition-all font-black text-[10px] uppercase">BAN</div>
                                        </label>
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Raison Officielle</label>
                                    <textarea name="reason" rows="3" placeholder="Motif précis..." class="glass-input w-full p-4 rounded-2xl text-xs italic bg-black/40 border-white/10" required></textarea>
                                </div>

                                <div class="space-y-2">
                                    <label class="text-[9px] text-gray-600 font-black uppercase tracking-widest ml-1">Durée (minutes - 0 = permanent)</label>
                                    <input type="number" name="duration" value="0" min="0" class="glass-input w-full p-3 rounded-2xl text-sm font-mono font-bold bg-black/40 border-white/10 text-white">
                                </div>

                                <button type="submit" class="glass-btn w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] bg-red-600 hover:bg-red-500 shadow-xl shadow-red-900/30 transition-all transform active:scale-95">
                                    APPLIQUER LA PUNITION
                                </button>
                            </form>
                        </div>
                    ` : `
                        <div class="glass-panel p-12 rounded-[40px] border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center opacity-40">
                            <i data-lucide="user-plus" class="w-16 h-16 text-gray-700 mb-4"></i>
                            <p class="text-xs font-black uppercase tracking-widest">Sélectionner une cible pour sanctionner</p>
                        </div>
                    `}
                </div>

                <!-- RIGHT: REGISTRE -->
                <div class="lg:col-span-7 flex flex-col min-h-0">
                    <div class="glass-panel rounded-[40px] border border-white/5 bg-[#0a0a0a] flex flex-col h-full shadow-2xl overflow-hidden relative">
                         <div class="p-6 border-b border-white/5 bg-white/[0.02] shrink-0">
                             <h3 class="font-black text-white text-sm uppercase tracking-widest flex items-center gap-3">
                                <i data-lucide="history" class="w-5 h-5 text-blue-400"></i> Registre National des Sanctions
                            </h3>
                         </div>
                        <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            ${globalSanctions.length === 0 ? `
                                <div class="h-full flex flex-col items-center justify-center opacity-20 text-center py-20">
                                    <i data-lucide="shield-check" class="w-16 h-16 mb-4"></i>
                                    <p class="text-xs font-black uppercase tracking-widest">Registre vierge</p>
                                </div>
                            ` : globalSanctions.map(s => {
                                const tColor = s.type === 'warn' ? 'yellow' : s.type === 'mute' ? 'orange' : 'red';
                                const canRevoke = state.user?.isFounder || s.staff_id === state.user?.id;
                                const isAppealed = !!s.appeal_at;
                                return `
                                    <div class="p-4 bg-white/[0.02] border ${isAppealed ? 'border-blue-500/30 bg-blue-500/[0.02]' : 'border-white/5'} rounded-2xl hover:border-${tColor}-500/30 transition-all group relative">
                                        <div class="flex justify-between items-start mb-2">
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded-lg bg-${tColor}-500/10 flex items-center justify-center text-${tColor}-400 border border-${tColor}-500/20 font-black text-[9px]">${s.type.toUpperCase()}</div>
                                                <div>
                                                    <div class="font-bold text-white text-xs uppercase">Cible: <span class="text-${tColor}-300">${s.target?.username || 'Inconnu'}</span></div>
                                                    <div class="text-[8px] text-gray-500 font-mono">Par: ${s.staff?.username || 'Système'} • ${new Date(s.created_at).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                ${isAppealed ? '<span class="text-[7px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase shadow-lg animate-pulse">APPEL</span>' : ''}
                                                ${canRevoke ? `
                                                    <button onclick="actions.revokeSanction('${s.id}')" class="p-2 text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Annuler Sanction">
                                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </div>
                                        <div class="text-[11px] text-gray-400 italic bg-black/40 p-2 rounded-xl border border-white/5">"${s.reason}"</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};