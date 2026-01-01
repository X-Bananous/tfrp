import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffCitizensView = () => {
    const canApprove = hasPermission('can_approve_characters');
    const canManage = hasPermission('can_manage_characters');
    const canDelete = hasPermission('can_manage_characters');
    const canInventory = hasPermission('can_manage_inventory');
    const canChangeTeam = hasPermission('can_change_team');
    const canManageJobs = hasPermission('can_manage_jobs');
    const canGiveWheelTurns = hasPermission('can_give_wheel_turn');
    
    const q = state.staffSearchQuery ? state.staffSearchQuery.toLowerCase() : '';
    
    // Section WL
    let pendingList = [];
    if (canApprove) {
        pendingList = state.pendingApplications.filter(p => 
            p.first_name.toLowerCase().includes(q) || 
            p.last_name.toLowerCase().includes(q) || 
            p.discord_username.toLowerCase().includes(q)
        );
    }

    // Section DB
    let citizensList = [];
    if (canManage) {
        citizensList = [...state.allCharactersAdmin];
        
        // Sorting Logic
        const sortField = state.adminDbSort.field;
        const sortDir = state.adminDbSort.direction === 'asc' ? 1 : -1;
        
        citizensList.sort((a, b) => {
             let valA = a[sortField] || '';
             let valB = b[sortField] || '';
             if (sortField === 'name') {
                 valA = a.last_name + a.first_name;
                 valB = b.last_name + b.first_name;
             }
             if (valA < valB) return -1 * sortDir;
             if (valA > valB) return 1 * sortDir;
             return 0;
        });

        if (q) {
            citizensList = citizensList.filter(c => 
                c.first_name.toLowerCase().includes(q) || 
                c.last_name.toLowerCase().includes(q) || 
                c.discord_username.toLowerCase().includes(q)
            );
        }
    }

    return `
        <div class="space-y-10 animate-fade-in">
            
            <!-- TOOLBAR COMMON -->
            <div class="flex flex-col md:flex-row gap-4">
                <div class="relative flex-1">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher nom ou Discord..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm bg-white/5 border-white/10 focus:border-purple-500/50">
                </div>
                ${canManage ? `
                    <div class="flex gap-2">
                        <select onchange="actions.setAdminSort(this.value)" class="glass-input px-3 py-2.5 rounded-xl text-xs bg-black/40 border-white/10 text-gray-300">
                            <option value="name" ${state.adminDbSort.field === 'name' ? 'selected' : ''}>Trier par Nom</option>
                            <option value="job" ${state.adminDbSort.field === 'job' ? 'selected' : ''}>Trier par Métier</option>
                            <option value="status" ${state.adminDbSort.field === 'status' ? 'selected' : ''}>Trier par Statut</option>
                        </select>
                        <button onclick="actions.openAdminCreateChar()" class="glass-btn px-5 rounded-xl text-xs font-black uppercase tracking-widest bg-purple-600 hover:bg-purple-500 flex items-center gap-2">
                            <i data-lucide="user-plus" class="w-4 h-4"></i> Créer Citoyen
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- PENDING WHITELIST (WL) -->
            ${canApprove && state.pendingApplications.length > 0 ? `
                <div class="space-y-4">
                    <h3 class="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                        <i data-lucide="file-check" class="w-4 h-4"></i> Dossiers en attente (WL)
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${pendingList.length === 0 && q ? '<div class="col-span-full py-4 text-center text-gray-600 text-xs italic">Aucun résultat dans les WL.</div>' : ''}
                        ${pendingList.map(p => `
                            <div class="glass-panel p-5 rounded-[28px] flex items-center justify-between border-l-4 border-l-amber-500/50 bg-amber-500/[0.02]">
                                <div class="flex items-center gap-4 min-w-0">
                                    <div class="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center font-bold text-gray-500 border border-white/10 overflow-hidden shrink-0 shadow-lg">
                                        ${p.discord_avatar ? `<img src="${p.discord_avatar}" class="w-full h-full object-cover">` : p.first_name[0]}
                                    </div>
                                    <div class="min-w-0">
                                        <div class="font-black text-white text-base truncate italic uppercase tracking-tight">${p.first_name} ${p.last_name}</div>
                                        <div class="text-[9px] text-gray-400 flex items-center gap-2 mt-0.5">
                                            <span class="text-blue-400 font-bold">@${p.discord_username}</span>
                                            <span class="w-1 h-1 bg-gray-700 rounded-full"></span>
                                            <span>${p.age} ans</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex gap-2 shrink-0 ml-4">
                                    <button onclick="actions.decideApplication('${p.id}', 'accepted')" class="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white p-2.5 rounded-xl transition-all border border-emerald-500/20"><i data-lucide="check" class="w-5 h-5"></i></button>
                                    <button onclick="actions.decideApplication('${p.id}', 'rejected')" class="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white p-2.5 rounded-xl transition-all border border-red-500/20"><i data-lucide="x" class="w-5 h-5"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- DATABASE TABLE -->
            ${canManage ? `
                <div class="space-y-4">
                    <h3 class="text-xs font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                        <i data-lucide="database" class="w-4 h-4"></i> Registre National des Citoyens
                    </h3>
                    <div class="glass-panel overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.01] shadow-2xl">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-separate border-spacing-0">
                                <thead class="bg-black/30 text-[9px] uppercase text-gray-500 font-black tracking-[0.2em] sticky top-0 z-10">
                                    <tr>
                                        <th class="p-5 border-b border-white/5">Identité</th>
                                        <th class="p-5 border-b border-white/5">Profession & Droits</th>
                                        <th class="p-5 border-b border-white/5">Permis (Points)</th>
                                        <th class="p-5 border-b border-white/5">Clés</th>
                                        <th class="p-5 border-b border-white/5">Statut</th>
                                        <th class="p-5 border-b border-white/5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="text-sm divide-y divide-white/5">
                                    ${citizensList.map(c => {
                                        const isEnterpriseOwner = state.enterprises?.some(e => e.leader_id === c.id);
                                        const displayJob = (c.job === 'unemployed' && isEnterpriseOwner) ? 'PDG' : (c.job || 'unemployed');
                                        const pts = (c.driver_license_points !== null && c.driver_license_points !== undefined) ? c.driver_license_points : 12;

                                        return `
                                        <tr class="hover:bg-white/[0.03] transition-colors group">
                                            <td class="p-5">
                                                <div class="font-black text-white italic uppercase tracking-tight group-hover:text-purple-400 transition-colors">${c.first_name} ${c.last_name}</div>
                                                <div class="text-[9px] text-blue-300 font-mono mt-0.5">@${c.discord_username}</div>
                                            </td>
                                            <td class="p-5">
                                                <div class="flex flex-col gap-2">
                                                    ${canManageJobs && c.status === 'accepted' ? `
                                                        <select onchange="actions.assignJob('${c.id}', this.value)" class="text-[9px] bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-gray-400 focus:text-white uppercase font-black tracking-widest outline-none">
                                                            <option value="unemployed" ${c.job === 'unemployed' ? 'selected' : ''}>Civil / Chômeur</option>
                                                            <optgroup label="Gouvernement" class="bg-[#1a1a1c]">
                                                                <option value="maire" ${c.job === 'maire' ? 'selected' : ''}>Maire</option>
                                                                <option value="adjoint" ${c.job === 'adjoint' ? 'selected' : ''}>Adjoint</option>
                                                                <option value="juge" ${c.job === 'juge' ? 'selected' : ''}>Juge</option>
                                                                <option value="procureur" ${c.job === 'procureur' ? 'selected' : ''}>Procureur</option>
                                                            </optgroup>
                                                            <optgroup label="Public" class="bg-[#1a1a1c]">
                                                                <option value="leo" ${c.job === 'leo' ? 'selected' : ''}>Police (LEO)</option>
                                                                <option value="lafd" ${c.job === 'lafd' ? 'selected' : ''}>Pompier (LAFD)</option>
                                                                <option value="ladot" ${c.job === 'ladot' ? 'selected' : ''}>Technique (DOT)</option>
                                                                <option value="lawyer" ${c.job === 'lawyer' ? 'selected' : ''}>Avocat</option>
                                                            </optgroup>
                                                        </select>
                                                    ` : `<span class="text-[10px] text-gray-500 font-black uppercase tracking-widest">${displayJob}</span>`}
                                                    
                                                    <button onclick="actions.adminToggleBar('${c.id}', ${!!c.bar_passed})" class="w-fit text-[8px] px-2 py-0.5 rounded border transition-colors ${c.bar_passed ? 'bg-purple-600/20 text-purple-400 border-purple-500/30 shadow-lg' : 'bg-white/5 text-gray-600 border-white/5'} font-black uppercase tracking-widest">
                                                        <i data-lucide="scale" class="w-2.5 h-2.5 inline mr-1"></i> Barreau: ${c.bar_passed ? 'OUI' : 'NON'}
                                                    </button>
                                                </div>
                                            </td>
                                            <td class="p-5">
                                                <div class="flex items-center gap-2">
                                                    <input type="number" value="${pts}" min="0" max="12" 
                                                        onchange="actions.adminUpdateLicensePoints('${c.id}', this.value)"
                                                        class="w-12 bg-black/50 border border-white/10 rounded-lg py-1 text-center font-mono font-black text-xs text-white focus:border-blue-500 transition-colors">
                                                    <span class="text-gray-600 font-mono text-[9px] uppercase font-black">/ 12</span>
                                                </div>
                                            </td>
                                            <td class="p-5">
                                                <div class="flex items-center gap-2">
                                                    <span class="text-xs font-mono font-black text-yellow-500">${c.whell_turn || 0}</span>
                                                    <i data-lucide="key" class="w-3 h-3 text-yellow-500/50"></i>
                                                </div>
                                            </td>
                                            <td class="p-5">
                                                <span class="px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest shadow-lg ${c.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : c.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                                                    ${c.status}
                                                </span>
                                            </td>
                                            <td class="p-5 text-right">
                                                <div class="flex justify-end gap-1.5">
                                                    ${canGiveWheelTurns ? `
                                                        <button onclick="actions.giveWheelTurn('${c.user_id}')" class="text-yellow-500 hover:text-white p-2 hover:bg-yellow-600 rounded-xl transition-all" title="Donner tours de roue">
                                                            <i data-lucide="sun" class="w-4 h-4"></i>
                                                        </button>
                                                    ` : ''}
                                                    <button onclick="actions.openAdminEditChar('${c.id}')" class="text-blue-400 hover:text-white p-2 hover:bg-blue-600 rounded-xl transition-all" title="Réviser"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                                                    ${canChangeTeam ? `<button onclick="actions.adminSwitchTeam('${c.id}', '${c.alignment}')" class="text-purple-400 hover:text-white p-2 hover:bg-purple-600 rounded-xl transition-all" title="Team Switch"><i data-lucide="shuffle" class="w-4 h-4"></i></button>` : ''}
                                                    ${canInventory && c.status === 'accepted' ? `<button onclick="actions.openInventoryModal('${c.id}', '${c.first_name} ${c.last_name}')" class="text-orange-400 hover:text-white p-2 hover:bg-orange-600 rounded-xl transition-all" title="Inventaire"><i data-lucide="backpack" class="w-4 h-4"></i></button>` : ''}
                                                    ${canDelete ? `<button onclick="actions.adminDeleteCharacter('${c.id}', '${c.first_name} ${c.last_name}')" class="text-gray-600 hover:text-red-500 p-2 transition-colors" title="Purger"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                                                </div>
                                            </td>
                                        </tr>
                                    `}).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${!canApprove && !canManage ? `
                <div class="py-20 text-center text-gray-600 uppercase font-black tracking-widest opacity-30 italic">
                    Accès restreint aux gestionnaires de population.
                </div>
            ` : ''}
        </div>
    `;
};