
import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffLogsView = () => {
    const subTab = state.activeStaffLogTab || 'commands';
    const q = state.erlcLogSearch ? state.erlcLogSearch.toLowerCase() : '';
    const canExecute = hasPermission('can_execute_commands');
    
    let tableContent = '';
    let headers = '';

    if (subTab === 'commands') {
        headers = '<tr><th class="p-5 border-b border-white/5">Opérateur</th><th class="p-5 border-b border-white/5">Instruction Exécutée</th><th class="p-5 border-b border-white/5 text-right">Horodatage</th></tr>';
        let logs = state.erlcData.commandLogs || [];
        if (q) logs = logs.filter(l => l.Command.toLowerCase().includes(q) || l.Player.toLowerCase().includes(q));
        
        tableContent = logs.length > 0 ? logs.map(l => `
            <tr class="hover:bg-white/[0.03] transition-colors font-mono text-xs group">
                <td class="p-5 text-blue-400 font-black uppercase tracking-tight group-hover:text-white transition-colors">${l.Player}</td>
                <td class="p-5 text-gray-300 bg-white/5 rounded-lg my-1 inline-block border border-white/5 shadow-inner select-all">${l.Command}</td>
                <td class="p-5 text-right text-gray-600 font-bold">${new Date(l.Timestamp * 1000).toLocaleTimeString()}</td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="p-20 text-center text-gray-700 italic uppercase font-black tracking-widest opacity-40">Registre de commande vide</td></tr>';
    
    } else if (subTab === 'kills') {
        headers = '<tr><th class="p-5 border-b border-white/5">Agresseur</th><th class="p-5 border-b border-white/5">Cible</th><th class="p-5 border-b border-white/5">Armement</th><th class="p-5 border-b border-white/5 text-right">Horodatage</th></tr>';
        let logs = state.erlcData.killLogs || [];
        if (q) logs = logs.filter(l => l.Killer.toLowerCase().includes(q) || l.Victim.toLowerCase().includes(q));
        
        tableContent = logs.length > 0 ? logs.map(l => `
            <tr class="hover:bg-white/[0.03] transition-colors font-mono text-xs group">
                <td class="p-5 text-red-500 font-black uppercase tracking-tight group-hover:text-white transition-colors">${l.Killer}</td>
                <td class="p-5 text-gray-200 font-black uppercase tracking-tight">${l.Victim}</td>
                <td class="p-5 text-gray-600 uppercase font-black tracking-widest">${l.Weapon || 'Non répertoriée'}</td>
                <td class="p-5 text-right text-gray-600 font-bold">${new Date(l.Timestamp * 1000).toLocaleTimeString()}</td>
            </tr>
        `).join('') : '<tr><td colspan="4" class="p-20 text-center text-gray-700 italic uppercase font-black tracking-widest opacity-40">Aucun incident létal enregistré</td></tr>';

    } else if (subTab === 'modcalls') {
        headers = '<tr><th class="p-5 border-b border-white/5">Citoyen</th><th class="p-5 border-b border-white/5">Nature du Signalement</th><th class="p-5 border-b border-white/5 text-right">Horodatage</th></tr>';
        let logs = state.erlcData.modCalls || [];
        if (q) logs = logs.filter(l => l.Caller.toLowerCase().includes(q));
        
        tableContent = logs.length > 0 ? logs.map(l => `
            <tr class="hover:bg-white/[0.03] transition-colors font-mono text-xs group">
                <td class="p-5 text-orange-400 font-black uppercase tracking-tight group-hover:text-white transition-colors">${l.Caller}</td>
                <td class="p-5 text-gray-400 italic font-medium leading-relaxed">"${l.Reason}"</td>
                <td class="p-5 text-right text-gray-600 font-bold">${new Date(l.Timestamp * 1000).toLocaleTimeString()}</td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="p-20 text-center text-gray-700 italic uppercase font-black tracking-widest opacity-40">Fréquence modération calme</td></tr>';

    } else if (subTab === 'players') {
        headers = '<tr><th class="p-5 border-b border-white/5">Identifiant</th><th class="p-5 border-b border-white/5">Affectation</th><th class="p-5 border-b border-white/5 text-right">Accréditation</th></tr>';
        let list = state.erlcData.players || [];
        if (q) list = list.filter(p => p.Name.toLowerCase().includes(q));
        
        tableContent = list.length > 0 ? list.map(p => `
            <tr class="hover:bg-white/[0.03] transition-colors font-mono text-xs group">
                <td class="p-5 text-white font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors">${p.Name}</td>
                <td class="p-5 text-gray-500 uppercase font-black tracking-widest">${p.Team}</td>
                <td class="p-5 text-right"><span class="text-gray-600 font-black uppercase border border-white/5 px-2 py-0.5 rounded-lg text-[10px]">${p.Permission}</span></td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="p-20 text-center text-gray-700 italic uppercase font-black tracking-widest opacity-40">Secteur Désert</td></tr>';

    } else if (subTab === 'vehicles') {
        headers = '<tr><th class="p-5 border-b border-white/5">Propriétaire</th><th class="p-5 border-b border-white/5">Modèle & Châssis</th><th class="p-5 border-b border-white/5 text-right">Configuration</th></tr>';
        let list = state.erlcData.vehicles || [];
        if (q) list = list.filter(v => v.Owner.toLowerCase().includes(q) || v.Name.toLowerCase().includes(q));
        
        tableContent = list.length > 0 ? list.map(v => `
            <tr class="hover:bg-white/[0.03] transition-colors font-mono text-xs group">
                <td class="p-5 text-blue-300 font-black uppercase tracking-tight group-hover:text-white transition-colors">${v.Owner}</td>
                <td class="p-5 text-white font-black uppercase italic">${v.Name}</td>
                <td class="p-5 text-right text-gray-600 uppercase font-black tracking-widest text-[9px]">${v.Texture || 'Stock'}</td>
            </tr>
        `).join('') : '<tr><td colspan="3" class="p-20 text-center text-gray-700 italic uppercase font-black tracking-widest opacity-40">Aucun moteur détecté</td></tr>';
    }

    return `
        <div class="flex flex-col h-full overflow-hidden animate-fade-in">
            <div class="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2 shrink-0 no-scrollbar">
                <button onclick="actions.setStaffLogTab('commands')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${subTab === 'commands' ? 'bg-purple-600 text-white border-purple-500 shadow-xl shadow-purple-900/40' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'}">Commandes</button>
                <button onclick="actions.setStaffLogTab('kills')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${subTab === 'kills' ? 'bg-red-600 text-white border-red-500 shadow-xl shadow-red-900/40' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'}">Kill Logs</button>
                <button onclick="actions.setStaffLogTab('modcalls')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${subTab === 'modcalls' ? 'bg-orange-600 text-white border-orange-500 shadow-xl shadow-orange-900/40' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'}">Mod Calls</button>
                <button onclick="actions.setStaffLogTab('players')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${subTab === 'players' ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-900/40' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'}">Live Players</button>
                <button onclick="actions.setStaffLogTab('vehicles')" class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${subTab === 'vehicles' ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-900/40' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'}">Véhicules</button>
            </div>

            <div class="flex flex-col lg:flex-row gap-4 mb-6 shrink-0">
                <div class="relative flex-1">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                    <input type="text" oninput="actions.searchCommandLogs(this.value)" value="${state.erlcLogSearch}" placeholder="Filtrer le registre ${subTab}..." class="glass-input pl-10 pr-4 py-3 rounded-2xl w-full text-sm bg-white/5 border-white/10 focus:border-purple-500/50">
                </div>
                ${subTab === 'commands' && canExecute ? `
                    <form onsubmit="actions.executeCommand(event)" class="flex gap-3 lg:w-1/2">
                        <div class="relative flex-1">
                            <i data-lucide="terminal" class="w-4 h-4 absolute left-4 top-3.5 text-purple-400"></i>
                            <input type="text" name="command" placeholder="Prompt Console (ex: :m Message)" class="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-mono border-purple-500/40 bg-purple-900/10 focus:bg-purple-900/20 shadow-2xl" required>
                        </div>
                        <button type="submit" class="glass-btn px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-900/30 transition-all active:scale-95"><i data-lucide="send" class="w-5 h-5"></i></button>
                    </form>
                ` : ''}
            </div>

            <div class="flex-1 overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.01] flex flex-col shadow-2xl">
                <div class="overflow-y-auto custom-scrollbar flex-1">
                    <table class="w-full text-left text-sm border-separate border-spacing-0">
                        <thead class="bg-[#101012] text-[10px] uppercase text-gray-600 font-black tracking-widest sticky top-0 z-10 shadow-lg">
                            ${headers}
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            ${tableContent}
                        </tbody>
                    </table>
                </div>
                <div class="p-3 bg-black/40 border-t border-white/5 text-center shrink-0">
                     <p class="text-[8px] text-gray-700 font-black uppercase tracking-[0.5em]">Synchronisation Radio-Fréquence ERLC • Flux Sécurisé</p>
                </div>
            </div>
        </div>
    `;
};
