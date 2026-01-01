
import { state } from '../../state.js';

export const LEOMapView = () => {
    const vehicles = state.erlcData.vehicles || [];
    const query = state.vehicleSearchQuery ? state.vehicleSearchQuery.toLowerCase() : '';
    const filtered = vehicles.filter(v => v.Name.toLowerCase().includes(query) || v.Owner.toLowerCase().includes(query) || (v.LicensePlate && v.LicensePlate.toLowerCase().includes(query)));

    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <div class="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
                <div class="relative w-full md:w-96">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.searchVehicles(this.value)" value="${state.vehicleSearchQuery || ''}" placeholder="Plaque, Modèle ou Propriétaire..." class="glass-input pl-10 w-full p-2.5 rounded-xl text-sm bg-black/20">
                </div>
                <div class="text-xs text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                    ${filtered.length} Véhicule(s) détecté(s)
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
                    ${filtered.map(v => `
                        <div class="glass-panel p-4 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group">
                            <div class="flex justify-between items-start mb-3">
                                <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                    <i data-lucide="car-front" class="w-6 h-6"></i>
                                </div>
                                <div class="text-right">
                                    <div class="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 mb-1 select-all font-mono">${v.LicensePlate || 'SANS PLAQUE'}</div>
                                    <div class="text-[8px] text-gray-500 uppercase font-bold tracking-tighter">Immatriculation</div>
                                </div>
                            </div>
                            <div class="font-bold text-white mb-1 truncate">${v.Name}</div>
                            <div class="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
                                <i data-lucide="user" class="w-3 h-3"></i> 
                                Propriétaire: <span class="text-blue-300 font-medium">${v.Owner}</span>
                            </div>
                            <div class="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-500">
                                <span>${v.Texture || 'Série'}</span>
                                <span class="text-blue-500">Signal GPS : OK</span>
                            </div>
                        </div>
                    `).join('')}
                    ${filtered.length === 0 ? '<div class="col-span-full py-20 text-center text-gray-600 italic">Aucun véhicule ne correspond à la recherche.</div>' : ''}
                </div>
            </div>
        </div>
    `;
};

export const LEOReportsView = () => {
    const job = state.activeCharacter?.job;
    const isJustice = job === 'juge' || job === 'procureur';
    const isEditing = !!state.editingReport;
    const maxFine = isJustice ? 1000000 : 25000;

    const suspectsList = state.reportSuspects.map((s, idx) => {
        return `
        <div class="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-4 animate-fade-in relative group overflow-hidden">
            <div class="absolute top-0 left-0 w-1 h-full ${isEditing ? 'bg-orange-500/50' : 'bg-blue-500/50'}"></div>
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-black border border-blue-500/20 shadow-lg">
                        ${s.name[0]}
                    </div>
                    <div>
                        <div class="font-black text-white text-sm uppercase tracking-tight">${s.name}</div>
                        <div class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">ID: #${s.id.substring(0,6)}</div>
                    </div>
                </div>
                ${!isEditing || isJustice ? `
                    <button type="button" onclick="actions.removeSuspectFromReport(${idx})" class="p-2 text-gray-500 hover:text-red-500 transition-colors">
                        <i data-lucide="user-minus" class="w-4 h-4"></i>
                    </button>
                ` : '<div class="text-[8px] bg-white/5 px-2 py-1 rounded text-gray-500 uppercase font-black">Lecture Seule</div>'}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 ${isEditing && !isJustice ? 'opacity-40 pointer-events-none' : ''}">
                <div class="space-y-1.5">
                    <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Amende ($)</label>
                    <div class="relative">
                        <span class="absolute left-2.5 top-2 text-emerald-500 font-bold text-xs">$</span>
                        <input type="number" 
                            value="${s.fine || 0}" 
                            oninput="actions.updateSuspectSanction(${idx}, 'fine', this.value)"
                            placeholder="Max $${maxFine.toLocaleString()}" 
                            max="${maxFine}"
                            class="glass-input w-full pl-6 pr-2 py-1.5 rounded-lg text-xs font-mono bg-black/40 border-white/10 text-emerald-400 focus:border-emerald-500/50">
                    </div>
                </div>
                <div class="space-y-1.5">
                    <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Prison (sec)</label>
                    <div class="relative">
                        <i data-lucide="clock" class="w-3 h-3 absolute left-2.5 top-2.5 text-blue-500"></i>
                        <input type="number" 
                            value="${s.jail || 0}" 
                            oninput="actions.updateSuspectSanction(${idx}, 'jail', this.value)"
                            placeholder="0" 
                            class="glass-input w-full pl-7 pr-2 py-1.5 rounded-lg text-xs font-mono bg-black/40 border-white/10 text-blue-300 focus:border-blue-500/50">
                    </div>
                </div>
                
                ${s.has_license ? `
                    <div class="space-y-1.5">
                        <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Retrait Points</label>
                        <div class="relative">
                            <i data-lucide="id-card" class="w-3 h-3 absolute left-2.5 top-2.5 text-orange-500"></i>
                            <input type="number" 
                                value="${s.points || 0}" 
                                oninput="actions.updateSuspectSanction(${idx}, 'points', this.value)"
                                max="${s.points_limit}" 
                                min="0"
                                placeholder="0" 
                                class="glass-input w-full pl-7 pr-2 py-1.5 rounded-lg text-xs font-mono bg-black/40 border-white/10 text-orange-400 focus:border-orange-500/50">
                        </div>
                    </div>
                ` : `
                    <div class="flex items-center justify-center bg-black/20 border border-white/5 rounded-lg px-3 text-center">
                         <span class="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Aucun Permis</span>
                    </div>
                `}
            </div>
        </div>
    `}).join('');

    return `
        <div class="flex flex-col lg:flex-row gap-6 h-full overflow-hidden animate-fade-in">
            <div class="flex-1 flex flex-col bg-white/5 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div class="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="p-2 ${isJustice ? 'bg-purple-600/20 text-purple-400' : isEditing ? 'bg-orange-600/20 text-orange-400' : 'bg-blue-600/20 text-blue-400'} rounded-xl">
                            <i data-lucide="${isEditing ? 'edit' : 'file-signature'}" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <h3 class="font-black text-white uppercase tracking-tighter text-lg">${isJustice && isEditing ? 'Révision Judiciaire' : isEditing ? 'Modification de Rapport' : 'Rédaction de Rapport'}</h3>
                            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Plafond Amende: $${maxFine.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <form onsubmit="actions.submitPoliceReport(event)" class="space-y-8">
                        <div class="space-y-4">
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 block">Qualification des faits</label>
                            <input type="text" name="title" value="${isEditing ? state.editingReport.title : ''}" class="glass-input w-full p-4 rounded-2xl text-sm bg-black/30 border-white/10 font-bold" required maxlength="60">
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 block">Narration</label>
                            <textarea name="description" rows="5" class="glass-input w-full p-4 rounded-2xl text-sm leading-relaxed bg-black/30 border-white/10 italic" required>${isEditing ? state.editingReport.description : ''}</textarea>
                        </div>

                        <div class="space-y-4">
                            <h4 class="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span class="w-4 h-0.5 bg-purple-500/30"></span> Individus & Sanctions
                            </h4>
                            <div class="space-y-4">
                                ${suspectsList}
                                ${isJustice || !isEditing ? `
                                    <button type="button" onclick="actions.setServicesTab('directory')" class="w-full py-3 bg-white/5 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                        <i data-lucide="plus" class="w-4 h-4"></i> Ajouter un individu
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="pt-6 border-t border-white/5">
                            <button type="submit" class="glass-btn w-full py-4 rounded-2xl font-black text-base ${isJustice ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}">
                                ${isEditing ? 'ENTÉRINER LA RÉVISION' : 'ARCHIVER LE RAPPORT'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="w-full lg:w-80 flex flex-col gap-6 shrink-0">
                <div class="glass-panel p-6 rounded-3xl border border-purple-500/10 bg-purple-500/[0.02]">
                    <h4 class="text-[10px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><i data-lucide="scale" class="w-4 h-4 text-purple-400"></i> Code Judiciaire</h4>
                    <p class="text-[10px] text-gray-500 leading-relaxed uppercase font-bold">Le Juge et le Procureur ont la primauté sur les rapports de police. Ils peuvent annuler des amendes ou aggraver des peines jusqu'au plafond maximal.</p>
                </div>
            </div>
        </div>
    `;
};
