
import { state } from '../../state.js';
import { HEIST_DATA } from '../illicit.js';

export const DispatchView = (job) => {
    const isLawyer = job === 'lawyer';
    const heists = state.globalActiveHeists || [];
    const activeAlerts = heists.filter(h => (Date.now() - new Date(h.start_time).getTime()) > 30000); 
    const allCalls = state.emergencyCalls || [];
    
    const filteredCalls = allCalls.filter(c => {
        if (isLawyer) return false;
        if (job === 'leo') return c.service === 'police';
        if (job === 'lafd') return c.service === 'ems';
        if (job === 'ladot') return c.service === 'dot';
        return false;
    });

    const themeColor = job === 'leo' ? 'blue' : job === 'lafd' ? 'red' : 'yellow';

    return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 shrink-0">
                <div class="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                    <div><div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Code 3</div><div class="text-xl font-bold text-red-500 animate-pulse">${activeAlerts.length}</div></div>
                    <i data-lucide="siren" class="w-5 h-5 text-red-500/50"></i>
                </div>
                <div class="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                    <div><div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Appels 911</div><div class="text-xl font-bold text-white">${filteredCalls.length}</div></div>
                    <i data-lucide="phone-call" class="w-5 h-5 text-gray-500"></i>
                </div>
                <div class="bg-${themeColor}-500/10 border border-${themeColor}-500/20 p-3 rounded-xl flex items-center justify-between">
                    <div><div class="text-[10px] text-${themeColor}-300 uppercase font-bold tracking-widest">Canal</div><div class="text-lg font-bold text-${themeColor}-400 uppercase">${job}</div></div>
                    <i data-lucide="radio" class="w-5 h-5 text-${themeColor}-500"></i>
                </div>
            </div>

            <div class="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                <div class="flex-1 flex flex-col bg-red-950/10 border border-red-500/20 rounded-2xl overflow-hidden relative">
                    <div class="p-4 border-b border-red-500/20 bg-red-500/5 flex justify-between items-center shrink-0">
                        <h3 class="font-bold text-red-400 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <span class="relative flex h-3 w-3"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span> Alertes Prioritaires
                        </h3>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                        ${activeAlerts.length > 0 ? activeAlerts.map(h => {
                            const hData = HEIST_DATA.find(d => d.id === h.heist_type);
                            return `
                                <div class="bg-black/40 border-l-4 border-red-500 p-4 rounded-r-lg relative overflow-hidden group hover:bg-black/60 transition-colors">
                                    <div class="flex justify-between items-start mb-2"><div class="font-bold text-white text-lg">${hData ? hData.name : h.heist_type}</div><i data-lucide="alert-triangle" class="w-5 h-5 text-red-500 animate-pulse"></i></div>
                                    ${h.location ? `<div class="flex items-center gap-2 text-sm text-red-200 mb-2"><i data-lucide="map-pin" class="w-4 h-4"></i> ${h.location}</div>` : ''}
                                    <div class="flex gap-2 mt-3"><button class="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded flex-1 transition-colors">Prendre l'appel</button></div>
                                </div>
                            `;
                        }).join('') : `<div class="h-full flex flex-col items-center justify-center text-gray-600 opacity-50"><i data-lucide="check-circle" class="w-12 h-12 mb-2"></i><p class="text-sm uppercase font-bold tracking-widest">Secteur Calme</p></div>`}
                    </div>
                </div>

                <div class="flex-1 flex flex-col bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                    <div class="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                        <h3 class="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider"><i data-lucide="radio" class="w-4 h-4 text-blue-400"></i> Appels Entrants</h3>
                        <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">911</span>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-0">
                        ${filteredCalls.length > 0 ? filteredCalls.map(c => {
                            const joinedUnits = c.joined_units || [];
                            const hasJoined = joinedUnits.some(u => u.id === state.activeCharacter.id);
                            return `
                            <div class="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                                <div class="flex justify-between items-start mb-1"><div class="flex items-center gap-2"><span class="text-xs font-mono text-gray-500">${new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span><span class="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">${c.caller_id}</span></div><span class="px-2 py-0.5 bg-white/10 rounded text-[10px] text-gray-400 uppercase tracking-wide">${c.service}</span></div>
                                <div class="text-sm text-gray-300 mb-2 pl-6 border-l-2 border-white/10 group-hover:border-blue-500/50 transition-colors">"${c.description}"</div>
                                <div class="flex items-center justify-between pl-6 mt-2">
                                    <div class="flex items-center gap-2"><i data-lucide="map-pin" class="w-3 h-3 text-gray-500"></i><span class="text-xs text-gray-400 font-mono">${c.location}</span></div>
                                    <button onclick="actions.joinCall('${c.id}')" ${hasJoined ? 'disabled' : ''} class="text-[10px] px-2 py-1 rounded border ${hasJoined ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/10'} transition-colors">
                                        ${hasJoined ? 'Sur place' : 'Rejoindre'}
                                    </button>
                                </div>
                                ${joinedUnits.length > 0 ? `
                                    <div class="flex gap-1 flex-wrap mt-2 pl-6">
                                        ${joinedUnits.map(u => `<span class="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">${u.badge} ${u.name.split(' ')[1]}</span>`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `}).join('') : `<div class="p-8 text-center text-gray-600 italic text-sm">Aucun appel en attente.</div>`}
                    </div>
                </div>
            </div>
        </div>
    `;
};
