
import { state } from '../../state.js';

export const JusticeView = () => {
    const job = state.activeCharacter?.job;
    const isJudge = job === 'juge';
    const isProc = job === 'procureur';
    const reports = state.globalReports || [];

    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <div class="glass-panel p-5 rounded-2xl bg-gradient-to-br from-purple-900/20 to-black border-purple-500/20">
                    <div class="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Magistrature</div>
                    <div class="text-xl font-bold text-white uppercase italic">${job === 'juge' ? 'Juge de Siège' : 'Parquet / Procureur'}</div>
                </div>
                <div class="glass-panel p-5 rounded-2xl border-white/5 flex items-center justify-between">
                    <div>
                        <div class="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Dossiers Ouverts</div>
                        <div class="text-2xl font-mono font-bold text-white">${reports.filter(r => !r.is_closed).length}</div>
                    </div>
                    <i data-lucide="folder-open" class="w-8 h-8 text-gray-700"></i>
                </div>
                <div class="glass-panel p-5 rounded-2xl border-white/5 flex items-center justify-between">
                    <div>
                        <div class="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Dossiers Scellés</div>
                        <div class="text-2xl font-mono font-bold text-emerald-500">${reports.filter(r => r.is_closed).length}</div>
                    </div>
                    <i data-lucide="lock" class="w-8 h-8 text-emerald-900/50"></i>
                </div>
            </div>

            <div class="flex-1 bg-white/5 border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                <div class="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                    <h3 class="font-black text-white uppercase tracking-tighter text-lg flex items-center gap-3">
                        <i data-lucide="scale" class="w-6 h-6 text-purple-400"></i> Rôle d'Audience & Dossiers
                    </h3>
                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Contrôle de Légalité</div>
                </div>
                
                <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                    ${reports.length > 0 ? reports.map(r => {
                        const suspects = r.police_report_suspects || [];
                        const suspectsNames = suspects.map(s => s.suspect_name).join(', ');
                        const isClosed = r.is_closed;

                        return `
                        <div class="p-6 bg-black/40 border ${isClosed ? 'border-emerald-500/20 opacity-75' : 'border-white/5 hover:border-purple-500/30'} rounded-2xl transition-all group relative">
                            ${isClosed ? `
                                <div class="absolute top-4 right-4 flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                                    <i data-lucide="shield-check" class="w-3 h-3"></i> Affaire Classée / Scellée
                                </div>
                            ` : ''}
                            
                            <div class="flex justify-between items-start mb-4 pr-32">
                                <div>
                                    <div class="font-black text-white text-lg group-hover:text-purple-400 transition-colors uppercase tracking-tight">${r.title}</div>
                                    <div class="text-[10px] text-gray-500 font-mono mt-0.5">Officier d'origine: <span class="text-blue-400">${r.author_id}</span> • ${new Date(r.created_at).toLocaleString()}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-red-400 font-black text-lg font-mono">$${r.fine_amount.toLocaleString()}</div>
                                    <div class="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Total Amendes</div>
                                </div>
                            </div>

                            <div class="text-sm text-gray-400 leading-relaxed italic mb-6 bg-white/5 p-4 rounded-xl border border-white/5 border-l-4 border-l-gray-600">
                                "${r.description}"
                            </div>

                            <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 pt-4 border-t border-white/5">
                                <div class="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-2">
                                    <i data-lucide="users" class="w-4 h-4 text-purple-400"></i> 
                                    Prévenu(s) : <span class="text-purple-300">${suspectsNames || 'Non identifié'}</span>
                                </div>
                                
                                <div class="flex gap-2">
                                    ${!isClosed ? `
                                        <button onclick="actions.startEditReport('${r.id}')" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2">
                                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Réviser
                                        </button>
                                        ${isJudge ? `
                                            <button onclick="actions.sealCase('${r.id}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2">
                                                <i data-lucide="lock" class="w-3.5 h-3.5"></i> Sceller
                                            </button>
                                        ` : ''}
                                    ` : `
                                        <button onclick="actions.openFullReports()" class="px-4 py-2 bg-white/5 text-gray-500 text-[10px] font-black uppercase rounded-lg cursor-not-allowed">Archives</button>
                                    `}
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('') : `<div class="p-20 text-center text-gray-600 italic text-sm">Aucun dossier dans la base.</div>`}
                </div>
            </div>
        </div>
    `;
};
