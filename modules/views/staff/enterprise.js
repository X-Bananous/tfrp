
import { state } from '../../state.js';

export const StaffEnterpriseView = () => {
    const isEditing = !!state.editingEnterprise;
    const ents = state.enterprises || [];
    const pendingItems = state.pendingEnterpriseItems || [];
    
    const searchUI = (role) => `
        <div class="relative">
            <label class="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block">${role === 'Leader' ? 'Directeur (PDG)' : 'Sous-Directeur (Co-PDG)'}</label>
            <div class="relative group">
                <i data-lucide="user" class="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-gray-600 group-focus-within:text-blue-400 transition-colors"></i>
                <input type="text" id="ent-${role.toLowerCase()}-search" 
                    placeholder="Chercher profil..." 
                    value="${role === 'Leader' ? state.enterpriseCreation.leaderQuery : state.enterpriseCreation.coLeaderQuery}"
                    oninput="actions.searchEnterpriseLeader('${role}', this.value)"
                    class="glass-input w-full p-3 pl-10 rounded-2xl text-xs bg-black/40 border-white/10 ${role === 'Leader' && state.enterpriseCreation.leaderResult ? 'border-blue-500/50 text-blue-400' : ''}" 
                    autocomplete="off">
            </div>
            <div id="ent-${role.toLowerCase()}-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl mt-1 max-h-40 overflow-y-auto z-50 shadow-2xl hidden animate-fade-in"></div>
        </div>
    `;

    return `
        <div class="h-full grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden animate-fade-in">
            
            <!-- LEFT COLUMN: CREATION & LIST -->
            <div class="lg:col-span-8 flex flex-col min-h-0 gap-6 overflow-hidden">
                
                <!-- CREATION FORM (Shrink-0) -->
                <div class="glass-panel p-6 rounded-[32px] border ${isEditing ? 'border-blue-500/50 shadow-blue-900/20' : 'border-white/5'} bg-[#0a0a0a] relative overflow-hidden shrink-0">
                    <h3 class="font-black text-white text-lg uppercase italic tracking-tighter mb-6 flex items-center gap-3">
                        <i data-lucide="${isEditing ? 'edit-3' : 'building-2'}" class="w-5 h-5 text-blue-500"></i> 
                        ${isEditing ? 'Modification Administrative' : 'Enregistrement de Corporation'}
                    </h3>
                    <form onsubmit="actions.adminCreateEnterprise(event)" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="text-[9px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block">Dénomination Sociale</label>
                                <input type="text" name="name" 
                                    value="${state.enterpriseCreation.draftName}"
                                    oninput="actions.updateEnterpriseDraftName(this.value)"
                                    placeholder="Nom de l'enseigne..." class="glass-input w-full p-3 rounded-2xl bg-black/40 border-white/10 text-sm font-bold uppercase tracking-tight" required>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${searchUI('Leader')}
                                ${searchUI('Co-Leader')}
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4 border-t border-white/5">
                            ${isEditing ? `<button type="button" onclick="actions.cancelEditEnterprise()" class="glass-btn-secondary px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Annuler</button>` : ''}
                            <button type="submit" class="glass-btn flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/30 transition-all">
                                ${isEditing ? 'RATIFIER LES STATUTS' : 'PUBLIER LE DÉCRET D\'OUVERTURE'}
                            </button>
                        </div>
                    </form>
                </div>

                <!-- ENTERPRISE LIST (Flexible height) -->
                <div class="flex-1 glass-panel rounded-[32px] border border-white/5 bg-[#080808] flex flex-col overflow-hidden shadow-2xl">
                    <div class="p-5 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
                        <h3 class="font-black text-gray-400 uppercase tracking-widest text-[10px] flex items-center gap-3">
                            <i data-lucide="list" class="w-4 h-4"></i> Registre National des Corporations (${ents.length})
                        </h3>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        ${ents.length === 0 ? '<div class="h-full flex flex-col items-center justify-center opacity-30 italic text-xs uppercase font-black tracking-widest py-10">Aucun registre actif</div>' : ents.map(e => `
                            <div class="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5 group hover:bg-white/10 transition-all">
                                <div class="min-w-0">
                                    <div class="font-black text-white uppercase italic text-sm truncate">${e.name}</div>
                                    <div class="flex items-center gap-3 text-[8px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                        <span>PDG: <span class="text-blue-400">${e.leader ? e.leader.first_name : 'N/A'}</span></span>
                                        <span class="w-1 h-1 bg-gray-800 rounded-full"></span>
                                        <span>Trésor: <span class="text-emerald-400 font-mono">$${(e.balance||0).toLocaleString()}</span></span>
                                    </div>
                                </div>
                                <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <button onclick="actions.openAdminEditEnterprise('${e.id}')" class="p-2 text-blue-400 hover:bg-blue-600/10 rounded-xl border border-white/10" title="Éditer"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                                    <button onclick="actions.adminDeleteEnterprise('${e.id}')" class="p-2 text-red-500 hover:bg-red-600/10 rounded-xl border border-white/10" title="Dissoudre"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: ITEM MODERATION (Flexible height) -->
            <div class="lg:col-span-4 flex flex-col h-full min-h-0 overflow-hidden">
                <div class="glass-panel rounded-[32px] flex flex-col h-full border border-orange-500/20 bg-orange-950/[0.02] overflow-hidden shadow-2xl relative">
                    <div class="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                    <div class="p-6 border-b border-white/5 bg-white/[0.01] flex justify-between items-center shrink-0">
                        <h3 class="font-black text-orange-400 text-[10px] uppercase tracking-[0.2em] flex items-center gap-3">
                            <i data-lucide="clipboard-check" class="w-4 h-4"></i> Audit des Catalogues (${pendingItems.length})
                        </h3>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        ${pendingItems.length === 0 ? `
                            <div class="h-full flex flex-col items-center justify-center opacity-20 text-center py-20 italic font-black uppercase tracking-[0.4em] text-gray-500">
                                <i data-lucide="check-circle" class="w-12 h-12 mb-4"></i>
                                Flux Modération Vide
                            </div>
                        ` : 
                            pendingItems.map(item => `
                                <div class="bg-black/40 p-5 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group relative">
                                    <div class="flex justify-between items-start mb-2">
                                        <div class="font-black text-white text-base uppercase italic tracking-tight">${item.name}</div>
                                        <div class="text-[8px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20 font-black uppercase tracking-widest">${item.enterprises?.name}</div>
                                    </div>
                                    <div class="text-[10px] text-gray-500 mb-4 line-clamp-2 italic font-medium">"${item.description || 'Aucune description'}"</div>
                                    <div class="flex justify-between items-center text-[10px] mb-6 font-mono p-2 bg-white/5 rounded-xl border border-white/5">
                                        <div class="flex flex-col"><span class="text-gray-600 font-black uppercase text-[8px]">Prix HT</span><span class="text-emerald-400 font-black">$${item.price.toLocaleString()}</span></div>
                                        <div class="flex flex-col text-right"><span class="text-gray-600 font-black uppercase text-[8px]">Stock Initial</span><span class="text-white font-black">${item.quantity}</span></div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button onclick="actions.adminModerateItem('${item.id}', 'approve')" class="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">APPROUVER</button>
                                        <button onclick="actions.adminModerateItem('${item.id}', 'reject')" class="bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">REFUSER</button>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
};
