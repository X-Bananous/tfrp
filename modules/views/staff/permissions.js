
import { state } from '../../state.js';

export const StaffPermissionsView = () => {
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 h-full min-h-0 animate-fade-in overflow-hidden">
            <!-- LEFT PANEL: EDITOR -->
            <div class="flex flex-col h-full overflow-hidden">
                <div class="glass-panel p-8 rounded-[40px] relative border border-white/5 bg-[#0a0a0a] flex flex-col h-full shadow-2xl overflow-hidden">
                    <div class="absolute -right-20 -top-20 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div class="shrink-0">
                        <h3 class="font-black text-white text-xl uppercase italic tracking-tighter mb-4">Gouvernance & Accréditations</h3>
                        <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mb-8">Recherchez un citoyen Discord pour altérer ses niveaux d'accès.</p>
                        
                        <div class="relative mb-10 z-20">
                            <i data-lucide="search" class="w-5 h-5 absolute left-4 top-4 text-gray-600"></i>
                            <input type="text" placeholder="Pseudo Discord ou UID..." oninput="actions.searchProfilesForPerms(this.value)" class="glass-input p-4 pl-12 rounded-2xl w-full text-sm placeholder-gray-700 bg-black/40 border-white/10 font-bold" autocomplete="off">
                            <div id="perm-search-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl mt-2 max-h-56 overflow-y-auto z-50 shadow-2xl custom-scrollbar hidden animate-fade-in"></div>
                        </div>
                    </div>

                    <div id="perm-editor-container" class="flex-1 overflow-y-auto custom-scrollbar border-t border-white/5 mt-auto">
                        <div class="text-center py-20">
                            <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-700 mx-auto mb-4 border border-white/5 shadow-inner">
                                <i data-lucide="lock" class="w-8 h-8"></i>
                            </div>
                            <p class="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">En attente de sélection</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT PANEL: STAFF LIST -->
            <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] flex flex-col h-full shadow-2xl overflow-hidden">
                <div class="shrink-0">
                    <h3 class="font-black text-white text-sm uppercase tracking-widest mb-8 flex items-center gap-3">
                        <i data-lucide="shield" class="w-5 h-5 text-purple-400"></i> Corps Administratif Actuel
                    </h3>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    ${state.staffMembers.map(m => {
                        const perms = m.permissions || {};
                        const permKeys = Object.keys(perms).filter(k => perms[k] === true);
                        const permMap = {
                            can_approve_characters: 'WL',
                            can_manage_characters: 'Pop',
                            can_manage_economy: 'Éco',
                            can_manage_illegal: 'Crim',
                            can_manage_enterprises: 'Comm',
                            can_manage_staff: 'Admin',
                            can_manage_inventory: 'Inv',
                            can_change_team: 'Team',
                            can_go_onduty: 'Live',
                            can_manage_jobs: 'Jobs',
                            can_launch_session: 'Sess',
                            can_execute_commands: 'Cmd'
                        };

                        return `
                            <button onclick="actions.selectUserForPerms('${m.id}')" class="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center gap-4 transition-all border border-white/5 group relative overflow-hidden">
                                <img src="${m.avatar_url || 'https://cdn.discordapp.com/embed/avatars/0.png'}" class="w-12 h-12 rounded-xl border border-white/10 group-hover:border-purple-500/50 transition-all object-cover shadow-lg relative z-10">
                                <div class="flex-1 min-w-0 relative z-10">
                                    <div class="font-black text-white text-sm truncate uppercase italic tracking-tight mb-1">${m.username}</div>
                                    <div class="flex flex-wrap gap-1">
                                        ${permKeys.length > 0 ? permKeys.map(pk => `
                                            <span class="text-[7px] px-1.5 py-0.5 rounded-lg bg-purple-600/20 text-purple-400 font-black uppercase border border-purple-500/20 tracking-tighter">${permMap[pk] || pk}</span>
                                        `).join('') : '<span class="text-[7px] text-gray-700 font-black italic uppercase">Accès restreint</span>'}
                                    </div>
                                </div>
                                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-800 group-hover:text-purple-400 transition-colors"></i>
                            </button>
                        `;
                    }).join('')}
                </div>
                <div class="mt-8 pt-6 border-t border-white/5 text-center shrink-0">
                    <p class="text-[9px] text-gray-700 uppercase font-black tracking-[0.4em]">Département de la Sécurité Intérieure</p>
                </div>
            </div>
        </div>
    `;
};
