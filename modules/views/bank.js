
import { state } from '../state.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 mb-4 bg-emerald-900/10 border-y border-emerald-500/10 gap-3 shrink-0">
        <div class="text-xs text-emerald-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span><span class="font-bold">Banque Nationale</span> • Connexion Chiffrée AES-256</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-emerald-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser les flux
        </button>
    </div>
`;

export const BankView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full"><div class="loader-spinner mb-4"></div>Chargement sécurisé...</div>';
    
    const tabs = [
        { id: 'overview', label: 'Mes Comptes', icon: 'layout-grid' },
        { id: 'savings', label: 'Livret A', icon: 'piggy-bank' },
        { id: 'operations', label: 'Virements', icon: 'send' },
        { id: 'history', label: 'Registre', icon: 'scroll-text' }
    ];

    let content = '';

    // --- TAB: OVERVIEW ---
    if (state.activeBankTab === 'overview') {
        content = `
            <div class="space-y-8 animate-fade-in">
                 <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Premium Bank Card -->
                    <div class="relative group">
                        <div class="glass-panel p-10 rounded-[40px] bg-gradient-to-br from-emerald-900 via-[#0a2018] to-black border-emerald-500/30 relative overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:border-emerald-500/50">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                            <div class="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
                            
                            <div class="flex justify-between items-start mb-12 relative z-10">
                                <div class="flex items-center gap-4">
                                    <div class="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
                                        <i data-lucide="landmark" class="w-8 h-8"></i>
                                    </div>
                                    <div>
                                        <div class="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Compte Courant</div>
                                        <div class="text-sm font-bold text-white tracking-widest font-mono">**** **** **** ${state.activeCharacter.id.substring(0,4).toUpperCase()}</div>
                                    </div>
                                </div>
                                <div class="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-black uppercase tracking-widest animate-pulse">Online</div>
                            </div>
                            
                            <div class="mb-12 relative z-10">
                                <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Solde Disponible</div>
                                <div class="text-6xl font-mono font-black text-white tracking-tighter drop-shadow-2xl">$ ${state.bankAccount.bank_balance.toLocaleString()}</div>
                            </div>
                            
                            <div class="flex justify-between items-end relative z-10">
                                <div>
                                    <div class="text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1 opacity-60">Titulaire du compte</div>
                                    <div class="text-base font-black text-white uppercase italic tracking-tight">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</div>
                                </div>
                                <div class="flex flex-col items-end">
                                     <div class="w-12 h-8 bg-yellow-500/80 rounded-md mb-2 shadow-lg relative overflow-hidden">
                                        <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                     </div>
                                     <div class="text-[8px] text-gray-600 font-black uppercase tracking-widest">TFRP GOLD PRIVILEGE</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Cash Visual -->
                    <div class="relative group">
                        <div class="glass-panel p-10 rounded-[40px] bg-[#0c0c0e] border-white/5 relative overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:border-white/10">
                            <div class="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-[60px] -mr-10 -mt-10"></div>
                            
                            <div class="flex justify-between items-start mb-12 relative z-10">
                                <div class="flex items-center gap-4">
                                    <div class="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/10">
                                        <i data-lucide="wallet" class="w-8 h-8"></i>
                                    </div>
                                    <div>
                                        <div class="text-[10px] text-gray-500 uppercase font-black tracking-[0.3em] mb-1">Portefeuille</div>
                                        <div class="text-sm font-bold text-gray-400 tracking-widest">ESPÈCES PHYSIQUES</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-12 relative z-10">
                                <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Cash Liquide</div>
                                <div class="text-6xl font-mono font-black text-gray-200 tracking-tighter">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                            </div>
                            
                            <div class="bg-black/40 p-4 rounded-2xl border border-white/5 relative z-10 flex items-center gap-3">
                                <i data-lucide="shield-alert" class="w-4 h-4 text-orange-500"></i>
                                <div class="text-[10px] text-gray-500 font-bold uppercase leading-relaxed tracking-wide">
                                    "Attention : Les espèces ne sont pas garanties contre le vol. Utilisez les guichets ATM."
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ATM OPERATIONS -->
                <div class="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.01]">
                    <h3 class="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                        <span class="flex-1 h-px bg-white/5"></span>
                        TERMINAL LIBRE SERVICE (ATM)
                        <span class="flex-1 h-px bg-white/5"></span>
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Deposit -->
                        <div class="space-y-4">
                            <div class="flex items-center gap-3 text-emerald-400">
                                <i data-lucide="arrow-down-to-line" class="w-5 h-5"></i>
                                <span class="text-xs font-black uppercase tracking-widest">Dépôt sur compte</span>
                            </div>
                            <form onsubmit="actions.bankDeposit(event)" class="flex gap-3">
                                <div class="relative flex-1">
                                    <span class="absolute left-4 top-3.5 text-emerald-500 font-black">$</span>
                                    <input type="number" name="amount" placeholder="Montant..." min="1" max="${state.bankAccount.cash_balance}" class="glass-input w-full p-4 pl-8 rounded-2xl text-lg font-mono font-black bg-black/40 border-white/10 focus:border-emerald-500/50" required>
                                </div>
                                <button type="submit" class="px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all">Valider</button>
                            </form>
                        </div>

                        <!-- Withdraw -->
                        <div class="space-y-4">
                            <div class="flex items-center gap-3 text-red-400">
                                <i data-lucide="arrow-up-from-line" class="w-5 h-5"></i>
                                <span class="text-xs font-black uppercase tracking-widest">Retrait espèces</span>
                            </div>
                            <form onsubmit="actions.bankWithdraw(event)" class="flex gap-3">
                                <div class="relative flex-1">
                                    <span class="absolute left-4 top-3.5 text-red-500 font-black">$</span>
                                    <input type="number" name="amount" placeholder="Montant..." min="1" max="${state.bankAccount.bank_balance}" class="glass-input w-full p-4 pl-8 rounded-2xl text-lg font-mono font-black bg-black/40 border-white/10 focus:border-red-500/50" required>
                                </div>
                                <button type="submit" class="px-8 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/20 transition-all">Valider</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- TAB: SAVINGS ---
    else if (state.activeBankTab === 'savings') {
        const savingsBalance = state.bankAccount.savings_balance || 0;
        const weeklyEstimate = Math.floor(savingsBalance * (state.savingsRate / 100));

        content = `
            <div class="space-y-8 animate-fade-in">
                <div class="glass-panel p-10 rounded-[40px] bg-gradient-to-br from-indigo-900/40 via-black to-black border-indigo-500/30 relative overflow-hidden shadow-2xl">
                    <div class="absolute -right-20 -top-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                    <div class="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                        <div class="text-center md:text-left">
                            <div class="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20 mb-4 rounded-lg">
                                <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Épargne Garantie par l'État
                            </div>
                            <h3 class="text-4xl font-black text-white italic uppercase tracking-tighter mb-1">Livret d'Épargne</h3>
                            <p class="text-indigo-400/60 text-sm font-medium">Fonds bloqués générant des intérêts hebdomadaires.</p>
                        </div>
                        <div class="bg-black/60 backdrop-blur-xl p-8 rounded-[32px] border border-white/10 text-center min-w-[240px] shadow-2xl">
                            <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Capital Épargné</div>
                            <div class="text-5xl font-mono font-black text-white tracking-tighter">$ ${savingsBalance.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center gap-5">
                        <div class="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20"><i data-lucide="trending-up" class="w-7 h-7"></i></div>
                        <div><div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Taux d'Intérêt</div><div class="text-2xl font-black text-white font-mono">${state.savingsRate}%</div></div>
                    </div>
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center gap-5">
                        <div class="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20"><i data-lucide="gift" class="w-7 h-7"></i></div>
                        <div><div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Profit par Cycle</div><div class="text-2xl font-black text-emerald-400 font-mono">+$${weeklyEstimate.toLocaleString()}</div></div>
                    </div>
                    <div class="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center gap-5">
                        <div class="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20"><i data-lucide="clock" class="w-7 h-7"></i></div>
                        <div>
                            <div class="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Versement dans</div>
                            <div class="text-lg font-mono font-black text-blue-400" id="bank-savings-timer">Chargement...</div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.01]">
                        <h4 class="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3"><i data-lucide="plus-circle" class="w-5 h-5 text-indigo-400"></i> Alimenter l'épargne</h4>
                        <form onsubmit="actions.transferToSavings(event)" class="space-y-6">
                            <div>
                                <label class="text-[10px] text-gray-600 font-black uppercase ml-1 block mb-2 tracking-widest">Montant à transférer</label>
                                <div class="relative">
                                    <span class="absolute left-5 top-3.5 text-indigo-500 font-black text-lg">$</span>
                                    <input type="number" name="amount" placeholder="0" min="1" max="${state.bankAccount.bank_balance}" class="glass-input w-full p-4 pl-10 rounded-2xl font-mono text-white text-xl font-black bg-black/40 border-white/10 focus:border-indigo-500/50" required>
                                </div>
                            </div>
                            <button type="submit" class="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-900/20 transform active:scale-95">CONFIRMER LE TRANSFERT</button>
                        </form>
                    </div>

                    <div class="glass-panel p-8 rounded-[32px] border border-white/5 bg-white/[0.01]">
                        <h4 class="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3"><i data-lucide="minus-circle" class="w-5 h-5 text-orange-400"></i> Liquider l'épargne</h4>
                        <form onsubmit="actions.withdrawFromSavings(event)" class="space-y-6">
                            <div>
                                <label class="text-[10px] text-gray-600 font-black uppercase ml-1 block mb-2 tracking-widest">Montant à débloquer</label>
                                <div class="relative">
                                    <span class="absolute left-5 top-3.5 text-orange-500 font-black text-lg">$</span>
                                    <input type="number" name="amount" placeholder="0" min="1" max="${savingsBalance}" class="glass-input w-full p-4 pl-10 rounded-2xl font-mono text-white text-xl font-black bg-black/40 border-white/10 focus:border-orange-500/50" required>
                                </div>
                            </div>
                            <button type="submit" class="w-full py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black text-[10px] uppercase tracking-[0.3em] transition-all transform active:scale-95">RETOUR AU COMPTE COURANT</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // --- TAB: OPERATIONS (TRANSFER) ---
    else if (state.activeBankTab === 'operations') {
        content = `
             <div class="flex items-center justify-center h-full animate-fade-in">
                 <div class="glass-panel p-10 rounded-[48px] w-full max-w-2xl border border-white/10 bg-[#080808] shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <div class="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px]"></div>
                    
                    <div class="text-center mb-10 relative z-10">
                        <div class="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-400 mx-auto mb-6 border border-blue-500/20 shadow-2xl">
                            <i data-lucide="send" class="w-10 h-10"></i>
                        </div>
                        <h3 class="text-3xl font-black text-white uppercase italic tracking-tighter">Virement de Fonds</h3>
                        <p class="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Protocole de transfert sécurisé inter-citoyens</p>
                    </div>

                    <form onsubmit="actions.bankTransfer(event)" class="space-y-8 relative z-10" autocomplete="off">
                        <div class="relative">
                            <label class="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block">Identité du Bénéficiaire</label>
                            <input type="hidden" name="target_id" value="${state.selectedRecipient ? state.selectedRecipient.id : ''}" required>
                            <div class="relative group">
                                <i data-lucide="search" class="w-5 h-5 absolute left-4 top-4 text-gray-500 group-focus-within:text-blue-400 transition-colors"></i>
                                <input type="text" 
                                        id="recipient_search"
                                        placeholder="Commencez à saisir un nom..." 
                                        value="${state.selectedRecipient ? state.selectedRecipient.name : ''}"
                                        oninput="actions.searchRecipients(this.value)"
                                        class="glass-input p-4 pl-12 rounded-2xl w-full text-sm placeholder-gray-700 bg-black/40 border-white/10 ${state.selectedRecipient ? 'text-blue-400 font-black border-blue-500/50 bg-blue-500/5 uppercase italic' : ''}" 
                                        autocomplete="off"
                                        ${state.selectedRecipient ? 'readonly' : ''}
                                >
                                ${state.selectedRecipient ? `
                                    <button type="button" onclick="actions.clearRecipient()" class="absolute right-4 top-4 text-gray-500 hover:text-white p-1 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><i data-lucide="x" class="w-4 h-4"></i></button>
                                ` : ''}
                            </div>
                            <div id="search-results-container" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-2xl mt-2 max-h-48 overflow-y-auto shadow-2xl custom-scrollbar hidden z-50 animate-fade-in"></div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label class="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block">Montant du virement ($)</label>
                                <div class="relative">
                                    <span class="absolute left-5 top-3.5 text-blue-500 font-black text-xl">$</span>
                                    <input type="number" name="amount" placeholder="0.00" min="1" max="${state.bankAccount.bank_balance}" class="glass-input p-4 pl-10 rounded-2xl w-full font-mono text-xl font-black tracking-wider bg-black/40 border-white/10" required>
                                </div>
                                <div class="text-right text-[8px] text-gray-600 mt-2 uppercase font-black tracking-widest">Solde Disponible: <span class="text-emerald-500">$${state.bankAccount.bank_balance.toLocaleString()}</span></div>
                            </div>
                            <div>
                                <label class="text-[10px] text-gray-500 uppercase font-black tracking-widest ml-1 mb-2 block">Motif de la transaction</label>
                                <input type="text" name="description" placeholder="Ex: Paiement facture..." maxlength="50" class="glass-input p-4 rounded-2xl w-full text-sm bg-black/40 border-white/10 italic">
                            </div>
                        </div>

                        <button type="submit" class="glass-btn w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3 mt-4 transform active:scale-95 transition-all">
                            DÉLIVRER LES FONDS <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </form>
                 </div>
             </div>
        `;
    }

    // --- TAB: HISTORY ---
    else if (state.activeBankTab === 'history') {
        const historyHtml = state.transactions.length > 0 
        ? state.transactions.map(t => {
            let icon, color, label, sign, bgIcon, borderColor;
            
            if (t.type === 'deposit') {
                icon = 'arrow-down-left'; color = 'text-emerald-400'; label = 'Crédit (Dépôt)'; sign = '+'; bgIcon = 'bg-emerald-500/10 text-emerald-500'; borderColor='border-emerald-500/20';
            } else if (t.type === 'withdraw') {
                icon = 'arrow-up-right'; color = 'text-gray-400'; label = 'Débit (ATM)'; sign = '-'; bgIcon = 'bg-white/5 text-gray-400'; borderColor='border-white/10';
            } else if (t.type === 'transfer') {
                if (t.receiver_id === state.activeCharacter.id) {
                    icon = 'download'; color = 'text-blue-400'; label = 'Transfert Reçu'; sign = '+'; bgIcon = 'bg-blue-500/10 text-blue-400'; borderColor='border-blue-500/20';
                } else {
                    icon = 'upload'; color = 'text-red-400'; label = 'Transfert Émis'; sign = '-'; bgIcon = 'bg-red-500/10 text-red-400'; borderColor='border-red-500/20';
                }
            } else if (t.type === 'admin_adjustment') {
                icon = 'shield-check'; label = 'Régularisation'; bgIcon = 'bg-purple-500/10 text-purple-400'; borderColor='border-purple-500/20';
                if (t.amount >= 0) { color = 'text-emerald-400'; sign = '+'; } else { color = 'text-red-400'; sign = '-'; }
            }

            return `
                <div class="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border ${borderColor} hover:bg-white/[0.04] transition-all group">
                    <div class="flex items-center gap-6">
                        <div class="w-14 h-14 rounded-2xl ${bgIcon} flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                            <i data-lucide="${icon}" class="w-7 h-7"></i>
                        </div>
                        <div>
                            <div class="font-black text-white text-base uppercase italic tracking-tight mb-1">${label}</div>
                            <div class="flex items-center gap-3">
                                <div class="text-[10px] text-gray-600 font-mono uppercase font-bold">${new Date(t.created_at).toLocaleString()}</div>
                                ${t.description ? `<span class="w-1 h-1 bg-gray-800 rounded-full"></span><div class="text-[11px] text-gray-500 italic font-medium">"${t.description}"</div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-mono font-black text-2xl ${color} tracking-tighter">
                            ${sign} $${Math.abs(t.amount).toLocaleString()}
                        </div>
                        <div class="text-[8px] text-gray-700 font-black uppercase tracking-widest mt-1">Opération validée</div>
                    </div>
                </div>
            `;
        }).join('') 
        : '<div class="text-center text-gray-600 py-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] opacity-40"><i data-lucide="history" class="w-16 h-16 mb-4"></i><span class="text-xs font-black uppercase tracking-[0.4em]">Aucune archive détectée</span></div>';

        content = `
            <div class="flex flex-col h-full animate-fade-in max-w-5xl mx-auto">
                <div class="flex justify-between items-center mb-8 px-2">
                    <h3 class="font-black text-white flex items-center gap-3 uppercase italic tracking-tight text-xl">
                        <i data-lucide="list" class="w-6 h-6 text-gray-500"></i> Historique des Mouvements
                    </h3>
                    <div class="text-[10px] bg-white/5 px-3 py-1 rounded-full text-gray-500 font-black uppercase tracking-widest border border-white/10">Archives Temps Réel</div>
                </div>
                <div class="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12">
                    ${historyHtml}
                    <div class="pt-10 text-center opacity-20">
                         <div class="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400">Certifié par le département du Trésor</div>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            <!-- FIXED BANNER -->
            ${refreshBanner}
            
            <!-- FIXED HEADER NAV -->
            <div class="px-8 pb-4 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 shrink-0 bg-[#050505] relative z-10">
                <div>
                    <h2 class="text-3xl font-black text-white flex items-center gap-3 uppercase italic tracking-tighter">
                        <i data-lucide="landmark" class="w-8 h-8 text-emerald-500"></i>
                        Terminal Bancaire
                    </h2>
                    <div class="flex items-center gap-3 mt-1">
                         <span class="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">Banque Nationale de Los Angeles</span>
                         <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                         <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">Accès Prioritaire</span>
                    </div>
                </div>
                <div class="flex flex-nowrap gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar border border-white/5">
                    ${tabs.map(t => `
                        <button onclick="actions.setBankTab('${t.id}')" 
                            class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${state.activeBankTab === t.id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- MAIN SCROLLABLE CONTENT AREA -->
            <div class="flex-1 p-8 overflow-hidden relative min-h-0">
                <div class="h-full overflow-hidden">
                    ${content}
                </div>
            </div>
        </div>
    `;
};
