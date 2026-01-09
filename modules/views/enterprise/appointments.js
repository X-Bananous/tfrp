
import { state } from '../../state.js';

export const EnterpriseAppointmentsView = () => {
    const apts = state.clientAppointments || [];
    
    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <div class="mb-8 shrink-0">
                <h3 class="font-black text-white flex items-center gap-3 text-lg uppercase italic tracking-tighter">
                    <i data-lucide="calendar-clock" class="w-6 h-6 text-blue-400"></i> 
                    Carnet de Rendez-vous
                </h3>
                <p class="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Suivi de vos demandes de services spécialisés</p>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
                <div class="grid grid-cols-1 gap-4">
                    ${apts.length === 0 ? `
                        <div class="col-span-full flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[40px] opacity-30">
                            <i data-lucide="calendar-x" class="w-16 h-16 mb-4"></i>
                            <div class="text-sm font-black uppercase tracking-[0.4em]">Aucune Requête</div>
                        </div>
                    ` : ''}
                    ${apts.map(apt => `
                        <div class="glass-panel p-6 rounded-[28px] border border-white/5 hover:bg-white/[0.03] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden group">
                            <div class="absolute -right-6 -top-6 w-20 h-20 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-all"></div>
                            <div class="flex items-center gap-6">
                                <div class="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-400 border border-yellow-500/20 shadow-2xl group-hover:scale-105 transition-transform">
                                    <i data-lucide="clock" class="w-8 h-8"></i>
                                </div>
                                <div>
                                    <div class="font-black text-white text-xl uppercase tracking-tight italic mb-1">${apt.service_name}</div>
                                    <div class="flex items-center gap-3 text-xs text-gray-400">
                                        <div class="flex items-center gap-1.5"><i data-lucide="building-2" class="w-3.5 h-3.5 text-blue-500/50"></i> <span class="font-bold uppercase tracking-widest text-blue-400">${apt.enterprises?.name || 'Inconnue'}</span></div>
                                        <span class="w-1 h-1 bg-gray-700 rounded-full"></span>
                                        <div class="flex items-center gap-1.5 font-mono text-gray-500">${new Date(apt.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-6 w-full md:w-auto">
                                <div class="text-left md:text-right shrink-0">
                                    <div class="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-1">Status Requête</div>
                                    <div class="font-black text-sm ${apt.status === 'pending' ? 'text-orange-400' : 'text-emerald-500'} uppercase tracking-widest flex items-center gap-2">
                                        ${apt.status === 'pending' ? '<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>' : ''}
                                        ${apt.status === 'pending' ? 'EN ATTENTE' : apt.status.toUpperCase()}
                                    </div>
                                </div>
                                ${apt.status === 'pending' ? `
                                    <button onclick="actions.cancelClientAppointment('${apt.id}')" class="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 transition-all shadow-lg" title="Révoquer Demande">
                                        <i data-lucide="trash" class="w-5 h-5"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};
