import { state } from '../../state.js';

export const GovView = (activeTab = 'gov_dashboard') => {
    const job = state.activeCharacter?.job;
    const isMayor = job === 'maire';
    const isDeputy = job === 'adjoint';
    const canManage = isMayor || isDeputy;
    const economy = state.economyConfig;
    const reports = state.globalReports || [];
    const deputies = state.allCharactersAdmin?.filter(c => c.job === 'adjoint' && c.status === 'accepted') || [];
    
    // --- CALCUL DES INDICATEURS ÉCONOMIQUES ---
    const totalMoneySupply = state.serverStats.totalMoney || 0;
    const transactionVolume24h = state.dailyEconomyStats?.[0]?.amount || 0;
    const velocityIndex = totalMoneySupply > 0 ? (transactionVolume24h / totalMoneySupply) * 100 : 0;

    const multipliers = { liberal: 0.7, moderate: 1.0, strict: 1.4 };
    const currentMult = multipliers[state.advisorMode] || 1.0;

    // --- LOGIQUE DE RECOMMANDATION DYNAMIQUE ---
    let rec = {
        title: "Économie Équilibrée", color: "text-indigo-400", bg: "bg-indigo-500/10", icon: "check-circle",
        tva: 10, rayon: 15, desc: "La circulation monétaire est saine. Maintenez des taux modérés."
    };

    if (totalMoneySupply > 0) {
        if (velocityIndex < 4) {
            rec = {
                title: "Stagnation", color: "text-blue-400", bg: "bg-blue-500/10", icon: "snowflake",
                tva: Math.max(2, Math.round(5 * currentMult)), rayon: Math.max(5, Math.round(8 * currentMult)), 
                desc: "L'argent ne circule pas. Une baisse de la fiscalité est conseillée."
            };
        } else if (velocityIndex > 12) {
            rec = {
                title: "Surchauffe", color: "text-orange-400", bg: "bg-orange-500/10", icon: "zap",
                tva: Math.round(18 * currentMult), rayon: Math.round(22 * currentMult),
                desc: "L'économie tourne vite. Augmentez les taxes pour remplir le trésor."
            };
        }
    }

    // --- CONTENU DES ONGLETS ---
    let tabContent = '';

    if (activeTab === 'gov_dashboard') {
        tabContent = `
            <div class="flex flex-col lg:flex-row gap-6 h-full overflow-hidden animate-fade-in">
                <!-- SURVEILLANCE DES RAPPORTS -->
                <div class="flex-1 flex flex-col bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div class="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-blue-600/20 text-blue-400 rounded-xl"><i data-lucide="shield-check" class="w-6 h-6"></i></div>
                            <h3 class="font-black text-white uppercase tracking-tighter text-lg">Surveillance Judiciaire</h3>
                        </div>
                        <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Base de données CAD</div>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        ${reports.length > 0 ? reports.map(r => {
                            const suspects = r.police_report_suspects || [];
                            const suspectsNames = suspects.map(s => s.suspect_name).join(', ');
                            return `
                            <div class="p-5 bg-black/40 border border-white/5 rounded-2xl hover:border-blue-500/30 transition-all group">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <div class="font-black text-white text-base group-hover:text-blue-400 transition-colors uppercase tracking-tight">${r.title}</div>
                                        <div class="text-[10px] text-gray-500 font-mono">${new Date(r.created_at).toLocaleString()}</div>
                                    </div>
                                    <div class="text-red-400 font-black text-sm font-mono">$${r.fine_amount.toLocaleString()}</div>
                                </div>
                                <div class="text-xs text-gray-400 leading-relaxed italic mb-4 bg-white/5 p-3 rounded-xl border border-white/5">"${r.description}"</div>
                                <div class="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 pt-3 border-t border-white/5">
                                    <div class="text-[9px] text-gray-500 font-bold uppercase flex items-center gap-2">
                                        <i data-lucide="users" class="w-3.5 h-3.5 text-blue-400"></i> 
                                        Cité(s) : <span class="text-blue-300">${suspectsNames || 'Non identifié'}</span>
                                    </div>
                                    <div class="text-[9px] bg-white/10 px-2 py-1 rounded text-gray-400 font-bold uppercase tracking-widest border border-white/5">Off: ${r.author_id}</div>
                                </div>
                            </div>
                            `;
                        }).join('') : `<div class="p-20 text-center text-gray-600 italic text-sm">Aucun rapport récent.</div>`}
                    </div>
                </div>

                <!-- CABINET & TRÉSORERIE -->
                <div class="w-full lg:w-80 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
                    <div class="bg-gradient-to-br from-emerald-950/40 to-black border border-emerald-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div class="flex items-center justify-between mb-4 relative z-10">
                            <h3 class="font-black text-emerald-400 text-[10px] uppercase tracking-[0.2em]">Trésorerie État</h3>
                            <i data-lucide="landmark" class="w-4 h-4 text-emerald-500"></i>
                        </div>
                        <div class="text-3xl font-mono font-bold text-white mb-2 relative z-10">$${(state.gouvBank || 0).toLocaleString()}</div>
                        <p class="text-[9px] text-gray-500 leading-relaxed italic opacity-70 uppercase tracking-widest">Fonds consolidés consolidés.</p>
                    </div>

                    <div class="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col">
                        <h3 class="font-black text-white mb-4 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                            <i data-lucide="users" class="w-4 h-4 text-purple-400"></i> Cabinet Municipal (${deputies.length}/2)
                        </h3>
                        
                        <div class="space-y-3 mb-6">
                            ${deputies.length === 0 ? '<div class="text-[9px] text-gray-600 italic py-4 text-center uppercase tracking-widest border border-dashed border-white/5 rounded-xl">Aucun Adjoint nommé</div>' : deputies.map(d => `
                                <div class="flex items-center justify-between p-3 bg-black/40 rounded-2xl border border-white/5">
                                    <div class="min-w-0">
                                        <div class="font-bold text-white text-xs truncate uppercase tracking-tight">${d.first_name} ${d.last_name}</div>
                                        <div class="text-[8px] text-purple-400 font-black uppercase tracking-widest mt-0.5">Adjoint au Maire</div>
                                    </div>
                                    ${isMayor ? `<button onclick="actions.assignJob('${d.id}', 'unemployed')" class="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors" title="Révoquer"><i data-lucide="user-minus" class="w-4 h-4"></i></button>` : ''}
                                </div>
                            `).join('')}
                        </div>

                        ${isMayor && deputies.length < 2 ? `
                            <div class="pt-4 border-t border-white/10 relative">
                                <label class="text-[9px] text-gray-500 font-bold uppercase mb-2 block tracking-widest">Nommer un adjoint</label>
                                <div class="relative">
                                    <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-3 text-gray-500"></i>
                                    <input type="text" 
                                        oninput="actions.searchGovCitizens(this.value)" 
                                        placeholder="Chercher citoyen..." 
                                        class="glass-input w-full pl-9 p-2.5 rounded-xl text-xs bg-black/40 border-white/10 focus:border-purple-500/50">
                                </div>
                                <div id="gov-search-results" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl hidden"></div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    } else if (activeTab === 'gov_economy') {
        tabContent = `
            <div class="h-full overflow-y-auto custom-scrollbar pr-2 animate-fade-in space-y-8">
                <form onsubmit="actions.submitGovEconomy(event)" class="space-y-8">
                    
                    <div class="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit mx-auto">
                        <button type="button" onclick="actions.setAdvisorMode('liberal')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.advisorMode === 'liberal' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:text-gray-300'}">Libéral</button>
                        <button type="button" onclick="actions.setAdvisorMode('moderate')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.advisorMode === 'moderate' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-gray-500 hover:text-gray-300'}">Modéré</button>
                        <button type="button" onclick="actions.setAdvisorMode('strict')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.advisorMode === 'strict' ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-gray-500 hover:text-gray-300'}">Strict</button>
                    </div>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="${rec.bg} border border-white/5 p-6 rounded-[32px] lg:col-span-2 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden group">
                            <div class="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                            <div class="w-20 h-20 rounded-[28px] bg-black/40 flex items-center justify-center ${rec.color} border border-white/10 shrink-0 shadow-2xl">
                                <i data-lucide="bot" class="w-10 h-10"></i>
                            </div>
                            <div class="flex-1 text-center md:text-left relative z-10">
                                <div class="flex items-center gap-2 mb-1 justify-center md:justify-start">
                                    <span class="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Analyse de Conjoncture</span>
                                    <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold uppercase tracking-tighter">Live Data</span>
                                </div>
                                <h3 class="text-white font-black text-xl mb-1 tracking-tight uppercase italic">${rec.title}</h3>
                                <p class="text-gray-400 text-xs leading-relaxed max-w-xl font-medium italic">"${rec.desc}"</p>
                            </div>
                        </div>

                        <div class="glass-panel p-6 rounded-[32px] border border-white/5 bg-white/[0.02] flex flex-col justify-center gap-4">
                            <div>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vitesse de l'argent</span>
                                    <span class="text-xs font-mono font-bold ${velocityIndex > 15 ? 'text-red-400' : velocityIndex < 5 ? 'text-blue-400' : 'text-emerald-400'}">${velocityIndex.toFixed(2)}%</span>
                                </div>
                                <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div class="h-full ${velocityIndex > 15 ? 'bg-red-500' : velocityIndex < 5 ? 'bg-blue-500' : 'bg-emerald-500'} transition-all duration-1000" style="width: ${Math.min(100, velocityIndex * 4)}%"></div>
                                </div>
                            </div>
                            <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-600">
                                <span>Flux 24h: <span class="text-white">$${transactionVolume24h.toLocaleString()}</span></span>
                                <span>Masse: <span class="text-white">$${(totalMoneySupply/1000).toFixed(1)}k</span></span>
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                        <div class="glass-panel p-6 rounded-3xl border border-blue-500/20 bg-blue-500/[0.03]">
                            <div class="flex justify-between items-center mb-4">
                                <div class="text-[10px] text-blue-300 uppercase font-black tracking-widest">TVA Municipale (%)</div>
                                <span class="text-xs font-mono font-bold text-blue-400">Conseil: ${rec.tva}%</span>
                            </div>
                            ${isMayor ? `<input type="number" name="tva_tax" value="${economy.tva_tax}" min="0" max="50" class="bg-transparent border-b border-blue-500/30 text-4xl font-black text-white w-full outline-none focus:border-blue-500 font-mono">` : `<div class="text-4xl font-black text-white font-mono">${economy.tva_tax}%</div>`}
                        </div>

                        <div class="glass-panel p-6 rounded-3xl border border-orange-500/20 bg-orange-500/[0.03]">
                            <div class="flex justify-between items-center mb-4">
                                <div class="text-[10px] text-orange-300 uppercase font-black tracking-widest">Taxe Rayon (%)</div>
                                <span class="text-xs font-mono font-bold text-orange-400">Conseil: ${rec.rayon}%</span>
                            </div>
                            ${isMayor ? `<input type="number" name="create_item_ent_tax" value="${Math.max(5, economy.create_item_ent_tax)}" min="5" max="40" class="bg-transparent border-b border-orange-500/30 text-4xl font-black text-white w-full outline-none focus:border-orange-500 font-mono">` : `<div class="text-4xl font-black text-white font-mono">${economy.create_item_ent_tax}%</div>`}
                        </div>

                        <div class="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.03]">
                            <div class="flex justify-between items-center mb-4">
                                <div class="text-[10px] text-indigo-300 uppercase font-black tracking-widest">Taux Livret A (%)</div>
                                <span class="text-xs font-mono font-bold text-indigo-400">Paiement Auto</span>
                            </div>
                            ${isMayor ? `<input type="number" name="taux_bank" value="${state.savingsRate}" step="0.1" min="0" max="5.0" class="bg-transparent border-b border-indigo-500/30 text-4xl font-black text-white w-full outline-none focus:border-indigo-500 font-mono">` : `<div class="text-4xl font-black text-white font-mono">${state.savingsRate}%</div>`}
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
                            <div class="flex justify-between items-center mb-4">
                                <div class="text-[10px] text-gray-400 uppercase font-black tracking-widest">Prix Permis ($)</div>
                                <i data-lucide="car" class="w-4 h-4 text-gray-600"></i>
                            </div>
                            ${isMayor ? `<input type="number" name="driver_license_price" value="${economy.driver_license_price}" min="0" class="bg-transparent border-b border-white/30 text-3xl font-black text-white w-full outline-none focus:border-white/50 font-mono">` : `<div class="text-3xl font-black text-white font-mono">$${economy.driver_license_price}</div>`}
                        </div>

                        <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
                            <div class="flex justify-between items-center mb-4">
                                <div class="text-[10px] text-gray-400 uppercase font-black tracking-widest">Prix Stage ($)</div>
                                <i data-lucide="graduation-cap" class="w-4 h-4 text-gray-600"></i>
                            </div>
                            ${isMayor ? `<input type="number" name="driver_stage_price" value="${economy.driver_stage_price}" min="0" class="bg-transparent border-b border-white/30 text-3xl font-black text-white w-full outline-none focus:border-white/50 font-mono">` : `<div class="text-3xl font-black text-white font-mono">$${economy.driver_stage_price}</div>`}
                        </div>
                    </div>

                    ${isMayor ? `
                        <div class="flex justify-center pt-6 pb-6">
                            <button type="submit" class="glass-btn px-16 py-5 rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-base font-black uppercase tracking-[0.25em] shadow-2xl flex items-center gap-4 group transition-all">
                                <i data-lucide="file-signature" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                                PUBLIER LES DÉCRETS
                            </button>
                        </div>
                    ` : ''}
                </form>
            </div>
        `;
    } else if (activeTab === 'gov_salaries') {
        // --- GRILLE DES SALAIRES TFRP ---
        const SALARY_GRID = {
            maire: 10000,
            adjoint: 7500,
            procureur: 6500,
            juge: 5000,
            lawyer: 4750,
            leo: 2500,
            lafd: 2500,
            ladot: 2500
        };

        const eligibleRoles = Object.keys(SALARY_GRID);
        const eligibleEmp = state.allCharactersAdmin?.filter(c => eligibleRoles.includes(c.job) && c.status === 'accepted') || [];
        
        let totalCost = 0;
        const payments = [];

        eligibleEmp.forEach(emp => {
            let base = SALARY_GRID[emp.job] || 0;
            let bonus = 0;
            let bonusDetail = "Traitement forfaitaire";

            if (emp.job === 'leo') {
                const charReports = reports.filter(r => r.character_id === emp.id);
                const reportsCount = charReports.length;
                const suspectsCount = charReports.reduce((sum, r) => sum + (r.police_report_suspects?.length || 0), 0);
                bonus = (reportsCount * 100) + (suspectsCount * 75);
                bonusDetail = `Base + Activité CAD ($${bonus})`;
            } else if (emp.job === 'lafd') {
                bonus = 500;
                bonusDetail = "Base + Prime Risque ($500)";
            }

            const amount = base + bonus;
            totalCost += amount;
            payments.push({ emp, amount, bonusDetail, base });
        });

        const lastPay = state.lastSalaryPayment ? new Date(state.lastSalaryPayment) : null;
        const isSalaryLocked = lastPay && (new Date() - lastPay < 7 * 24 * 60 * 60 * 1000);
        
        let salaryTimeMsg = "Disponible immédiatement";
        if (isSalaryLocked) {
             const nextPay = new Date(lastPay.getTime() + 7 * 24 * 60 * 60 * 1000);
             const diff = nextPay - new Date();
             const d = Math.floor(diff / (1000 * 60 * 60 * 24));
             salaryTimeMsg = `Prochain versement dans : ${d} jour(s)`;
        }

        tabContent = `
            <div class="flex flex-col h-full overflow-hidden animate-fade-in space-y-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
                    <div>
                        <h3 class="text-2xl font-black text-white uppercase tracking-tight italic">Paie des Corps Constitués</h3>
                        <p class="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Gouvernement, Justice & Services Publics</p>
                    </div>
                    <div class="bg-black/40 border border-white/10 rounded-2xl px-8 py-4 text-center md:text-right shadow-xl">
                        <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Masse Salariale Prévue</div>
                        <div class="text-3xl font-mono font-bold text-emerald-400 shadow-emerald-500/20">$${totalCost.toLocaleString()}</div>
                    </div>
                </div>

                <div class="flex-1 overflow-hidden rounded-[30px] bg-white/5 border border-white/5 shadow-inner flex flex-col min-h-0">
                    <div class="overflow-y-auto custom-scrollbar flex-1">
                        <table class="w-full text-left text-sm border-separate border-spacing-0">
                            <thead class="bg-black/30 text-gray-500 uppercase text-[10px] font-black tracking-[0.2em] sticky top-0 z-20">
                                <tr>
                                    <th class="p-5 border-b border-white/5">Agent / Magistrat</th>
                                    <th class="p-5 border-b border-white/5">Affectation</th>
                                    <th class="p-5 border-b border-white/5">Calcul (Base + Primes)</th>
                                    <th class="p-5 border-b border-white/5 text-right">Versement Estimé</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                ${payments.map(p => `
                                    <tr class="hover:bg-white/[0.03] transition-colors group">
                                        <td class="p-5">
                                            <div class="font-bold text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">${p.emp.first_name} ${p.emp.last_name}</div>
                                            <div class="text-[9px] text-gray-500 font-mono mt-0.5">ID: ${p.emp.id.substring(0,8).toUpperCase()}</div>
                                        </td>
                                        <td class="p-5">
                                            <span class="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">${p.emp.job}</span>
                                        </td>
                                        <td class="p-5">
                                            <div class="text-xs text-gray-300 font-bold">$${p.base.toLocaleString()} <span class="text-gray-500 font-normal">(${p.bonusDetail})</span></div>
                                        </td>
                                        <td class="p-5 text-right font-mono font-bold text-emerald-400 text-base">$${p.amount.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                                ${payments.length === 0 ? '<tr><td colspan="4" class="p-20 text-center text-gray-600 italic uppercase font-bold tracking-widest opacity-50">Aucun personnel actif détecté dans la base CAD</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-gradient-to-r from-emerald-950/20 via-black to-black p-6 rounded-[32px] border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0 relative overflow-hidden">
                    <div class="flex items-center gap-4 relative z-10">
                        <div class="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-xl"><i data-lucide="banknote" class="w-6 h-6"></i></div>
                        <div>
                            <div class="text-sm font-bold text-white uppercase">Ratifier les Paies Publiques</div>
                            <div class="text-[10px] text-gray-400">Post-débit trésorerie : <span class="text-emerald-400 font-bold">$${(state.gouvBank - totalCost).toLocaleString()}</span></div>
                        </div>
                    </div>
                    <div class="flex flex-col items-center md:items-end gap-1 relative z-10">
                        <button onclick="actions.paySalariesAction()" ${isSalaryLocked || !canManage || payments.length === 0 ? 'disabled' : ''} 
                            class="px-10 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-3">
                            <i data-lucide="send" class="w-4 h-4"></i> SIGNER LA PAIE
                        </button>
                        <p class="text-[8px] ${isSalaryLocked ? 'text-orange-400' : 'text-gray-600'} font-black uppercase tracking-widest">${salaryTimeMsg}</p>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="h-full relative min-h-0">
            ${tabContent}
        </div>
    `;
};