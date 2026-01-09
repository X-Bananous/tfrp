
import { state } from '../../state.js';
import { hasPermission } from '../../utils.js';

export const StaffEconomyView = () => {
    const { totalMoney, totalCash, totalBank, totalGang, totalEnterprise } = state.serverStats;
    const totalMoneyVal = totalBank + totalCash + totalGang + totalEnterprise;

    const bankPercent = totalMoneyVal > 0 ? (totalBank / totalMoneyVal) * 100 : 0;
    const cashPercent = totalMoneyVal > 0 ? (totalCash / totalMoneyVal) * 100 : 0;
    const gangPercent = totalMoneyVal > 0 ? (totalGang / totalMoneyVal) * 100 : 0;
    const entPercent = totalMoneyVal > 0 ? (totalEnterprise / totalMoneyVal) * 100 : 0;

    const subTab = state.activeEconomySubTab || 'players';
    const canManageEco = hasPermission('can_manage_economy');
    
    let subContent = '';
    
    if (subTab === 'players') {
        if (!canManageEco) {
            subContent = `<div class="p-20 text-center text-gray-600 italic uppercase font-black tracking-[0.3em] opacity-40">Audit financier restreint.</div>`;
        } else {
            let allChars = state.allCharactersAdmin || [];
            if (state.staffSearchQuery) {
               const q = state.staffSearchQuery.toLowerCase();
               allChars = allChars.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.discord_username.toLowerCase().includes(q));
            }
            subContent = `
               <div class="mb-6 flex flex-col md:flex-row justify-between items-center bg-emerald-500/5 p-5 rounded-[28px] border border-emerald-500/10 shrink-0 gap-4">
                   <div><h3 class="font-black text-white uppercase italic tracking-tight">Régulation Globale</h3><p class="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Action corrective sur l'ensemble de la masse monétaire</p></div>
                   <button onclick="actions.openEconomyModal('ALL')" class="glass-btn-secondary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all"><i data-lucide="globe" class="w-4 h-4"></i> AJUSTEMENT GÉNÉRAL</button>
               </div>
               <div class="mb-6 relative shrink-0">
                   <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                   <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher porteur de compte..." class="glass-input pl-10 pr-4 py-3 rounded-2xl w-full text-sm bg-black/20 border-white/5">
               </div>
               <div class="flex-1 overflow-y-auto custom-scrollbar rounded-[32px] border border-white/5 shadow-2xl bg-white/[0.01]">
                    <table class="w-full text-left border-separate border-spacing-0">
                       <thead class="text-[9px] uppercase text-gray-500 font-black tracking-widest bg-black/40 sticky top-0 z-10">
                           <tr>
                               <th class="p-5 border-b border-white/5">Détenteur</th>
                               <th class="p-5 border-b border-white/5 text-right text-emerald-400">Compte Bancaire</th>
                               <th class="p-5 border-b border-white/5 text-right text-blue-400">Fonds Liquides</th>
                               <th class="p-5 border-b border-white/5 text-right">Opérations</th>
                           </tr>
                       </thead>
                       <tbody class="text-sm divide-y divide-white/5">
                           ${allChars.filter(c => c.status === 'accepted').map(c => `
                               <tr class="hover:bg-white/[0.03] transition-colors group">
                                   <td class="p-5"><div class="font-black text-white italic uppercase tracking-tight group-hover:text-emerald-400 transition-colors">${c.first_name} ${c.last_name}</div><div class="text-[9px] text-blue-300 font-mono mt-0.5">@${c.discord_username}</div></td>
                                   <td class="p-5 text-right font-mono font-bold">$${(c.bank_balance||0).toLocaleString()}</td>
                                   <td class="p-5 text-right font-mono text-gray-400 font-medium">$${(c.cash_balance||0).toLocaleString()}</td>
                                   <td class="p-5 text-right"><button onclick="actions.openEconomyModal('${c.id}', '${c.first_name} ${c.last_name}')" class="glass-btn-secondary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-emerald-400 border-white/10 transition-all flex items-center gap-2 ml-auto"><i data-lucide="edit" class="w-3 h-3"></i> Ajuster</button></td>
                               </tr>
                           `).join('')}
                       </tbody>
                   </table>
               </div>
            `;
        }
    } else if (subTab === 'gangs' || subTab === 'enterprises') {
        const isGang = subTab === 'gangs';
        const list = isGang ? state.gangs : state.enterprises;
        const color = isGang ? 'purple' : 'blue';

        subContent = `
           <div class="flex-1 overflow-y-auto custom-scrollbar rounded-[32px] border border-white/5 bg-black/20 shadow-2xl">
               <table class="w-full text-left border-separate border-spacing-0">
                   <thead class="bg-black/40 text-[9px] uppercase text-gray-600 font-black tracking-widest sticky top-0 z-10">
                       <tr>
                           <th class="p-5 border-b border-white/5">Nom de l'entité</th>
                           <th class="p-5 border-b border-white/5">Haut Commandement</th>
                           <th class="p-5 border-b border-white/5 text-right">Solde du Coffre</th>
                           <th class="p-5 border-b border-white/5 text-right">Intervention</th>
                       </tr>
                   </thead>
                   <tbody class="divide-y divide-white/5 text-sm">
                       ${list.map(g => `
                           <tr class="hover:bg-white/[0.03] transition-colors group">
                               <td class="p-5 font-black text-white uppercase italic group-hover:text-${color}-400 transition-colors">${g.name}</td>
                               <td class="p-5 text-gray-500 text-[10px] font-bold uppercase">${g.leader ? g.leader.first_name + ' ' + g.leader.last_name : 'N/A'}</td>
                               <td class="p-5 text-right font-mono font-bold text-emerald-400 text-lg">$${(g.balance || 0).toLocaleString()}</td>
                               <td class="p-5 text-right flex justify-end gap-2">
                                   <button onclick="${isGang ? `actions.adminManageGangBalance('${g.id}', 'add')` : `actions.adminManageEnterpriseBalance('${g.id}', 'add')`}" class="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 transition-all border border-emerald-500/20 hover:text-white" title="Ajouter"><i data-lucide="plus" class="w-4 h-4"></i></button>
                                   <button onclick="${isGang ? `actions.adminManageGangBalance('${g.id}', 'remove')` : `actions.adminManageEnterpriseBalance('${g.id}', 'remove')`}" class="p-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-600 transition-all border border-red-500/20 hover:text-white" title="Retirer"><i data-lucide="minus" class="w-4 h-4"></i></button>
                               </td>
                           </tr>
                       `).join('')}
                   </tbody>
               </table>
           </div>
        `;
    } else if (subTab === 'stats') {
        subContent = `
               <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden h-full">
                   <div class="glass-panel p-8 rounded-[40px] lg:col-span-2 border border-white/5 bg-[#0a0a0a] shadow-2xl flex flex-col min-h-0">
                       <h3 class="font-black text-white text-sm uppercase tracking-widest mb-6 shrink-0">Registre des Mouvements (50)</h3>
                       <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                           <table class="w-full text-left text-[11px] border-separate border-spacing-0">
                               <thead class="text-gray-600 uppercase font-black tracking-widest sticky top-0 bg-[#0a0a0a] z-10 shadow-lg">
                                   <tr><th class="pb-4 border-b border-white/5">Heure</th><th class="pb-4 border-b border-white/5">Emetteur</th><th class="pb-4 border-b border-white/5">Cible</th><th class="pb-4 border-b border-white/5 text-right">Somme</th><th class="pb-4 border-b border-white/5">Canal</th></tr>
                               </thead>
                               <tbody class="divide-y divide-white/5">
                                   ${state.globalTransactions.map(t => `
                                       <tr class="hover:bg-white/5 group transition-colors"><td class="py-3 text-gray-600 font-mono">${new Date(t.created_at).toLocaleTimeString()}</td><td class="py-3 text-white font-bold uppercase">${t.sender ? t.sender.first_name + ' ' + t.sender.last_name : 'Admin'}</td><td class="py-3 text-white font-bold uppercase">${t.receiver ? t.receiver.first_name + ' ' + t.receiver.last_name : 'Atm'}</td><td class="py-3 text-right font-mono font-black text-emerald-400">$${Math.abs(t.amount).toLocaleString()}</td><td class="py-3"><span class="px-2 py-0.5 rounded-lg bg-white/5 text-gray-500 uppercase text-[8px] font-black border border-white/5">${t.type}</span></td></tr>
                                   `).join('')}
                               </tbody>
                           </table>
                       </div>
                   </div>
                   <div class="glass-panel p-8 rounded-[40px] border border-white/5 bg-[#0a0a0a] shadow-2xl flex flex-col min-h-0">
                       <h3 class="font-black text-white text-sm uppercase tracking-widest mb-6 shrink-0">Activité Journalière</h3>
                       <div class="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                           ${state.dailyEconomyStats.slice(0, 10).map(d => `
                               <div class="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                                   <span class="text-gray-500 font-mono font-bold text-xs">${d.date}</span>
                                   <span class="text-emerald-400 font-mono font-black text-base">$${d.amount.toLocaleString()}</span>
                               </div>
                           `).join('')}
                       </div>
                   </div>
               </div>
            `;
    }

    return `
        <div class="h-full flex flex-col gap-8 animate-fade-in overflow-hidden">
            <!-- PIE CHART ANALYSIS (Shrink-0) -->
            <div class="glass-panel p-8 rounded-[40px] bg-[#0a0a0a] border border-white/5 relative overflow-hidden shrink-0 shadow-2xl">
                <div class="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div class="text-center md:text-left">
                        <div class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-3">Auditeur Central Économique</div>
                        <h3 class="text-4xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">$${totalMoneyVal.toLocaleString()}</h3>
                    </div>
                    <div class="flex-1 w-full max-w-2xl">
                        <div class="h-8 w-full bg-black/40 rounded-xl overflow-hidden flex border border-white/10 group">
                            <div style="width: ${bankPercent}%" class="h-full bg-emerald-500 transition-all duration-1000" title="Banque"></div>
                            <div style="width: ${cashPercent}%" class="h-full bg-blue-500 transition-all duration-1000" title="Espèces"></div>
                            <div style="width: ${gangPercent}%" class="h-full bg-purple-500 transition-all duration-1000" title="Gangs"></div>
                            <div style="width: ${entPercent}%" class="h-full bg-indigo-600 transition-all duration-1000" title="Entreprises"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SUB NAVIGATION (Shrink-0) -->
            <div class="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit shrink-0">
                ${canManageEco ? `<button onclick="actions.setEconomySubTab('players')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'players' ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'}">Comptes Civils</button>` : ''}
                <button onclick="actions.setEconomySubTab('gangs')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'gangs' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40' : 'text-gray-500 hover:text-white'}">Coffres Gangs</button>
                <button onclick="actions.setEconomySubTab('enterprises')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'enterprises' ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' : 'text-gray-500 hover:text-white'}">Corporations</button>
                ${canManageEco ? `<button onclick="actions.setEconomySubTab('stats')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'stats' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40' : 'text-gray-500 hover:text-white'}">Statistiques</button>` : ''}
            </div>

            <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
                ${subContent}
            </div>
        </div>
    `;
};
