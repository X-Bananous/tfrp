
import { state } from '../state.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-4 py-3 mb-4 bg-emerald-900/10 border-y border-emerald-500/10 gap-3 shrink-0">
        <div class="text-xs text-emerald-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span><span class="font-bold">Banque Nationale</span> • Transactions Chiffrées</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-xs text-emerald-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser
        </button>
    </div>
`;

export const BankView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full"><div class="loader-spinner mb-4"></div>Chargement de la banque...</div>';
    
    // TAB NAVIGATION
    const tabs = [
        { id: 'overview', label: 'Comptes', icon: 'wallet-cards' },
        { id: 'operations', label: 'Virements', icon: 'arrow-left-right' },
        { id: 'history', label: 'Relevé', icon: 'file-text' }
    ];

    let content = '';

    // --- TAB: OVERVIEW ---
    if (state.activeBankTab === 'overview') {
        content = `
            <div class="space-y-8">
                 <!-- Cards Grid -->
                 <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    <!-- Bank Card Visual -->
                    <div class="relative group perspective-1000">
                        <div class="glass-panel p-8 rounded-[24px] bg-gradient-to-br from-emerald-900 via-[#0a2f20] to-black border-emerald-500/30 relative overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                            <!-- Shine Effect -->
                            <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <div class="flex justify-between items-start mb-8 relative z-10">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                        <i data-lucide="landmark" class="w-6 h-6"></i>
                                    </div>
                                    <div>
                                        <div class="text-sm font-bold text-white tracking-wider uppercase">Compte Courant</div>
                                        <div class="text-[10px] text-emerald-400 font-mono tracking-widest">TFRP-${state.activeCharacter.id.substring(0,4).toUpperCase()}</div>
                                    </div>
                                </div>
                                <span class="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] text-white font-bold uppercase tracking-widest">Actif</span>
                            </div>
                            
                            <div class="text-4xl lg:text-5xl font-mono font-bold text-white tracking-tighter mb-8 drop-shadow-lg">$ ${state.bankAccount.bank_balance.toLocaleString()}</div>
                            
                            <div class="flex justify-between items-end relative z-10">
                                <div>
                                    <div class="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Titulaire</div>
                                    <div class="text-sm font-bold text-white uppercase tracking-wide">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</div>
                                </div>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" class="h-8 opacity-75 grayscale group-hover:grayscale-0 transition-all">
                            </div>
                        </div>
                    </div>

                    <!-- Cash Wallet Visual -->
                    <div class="relative group">
                        <div class="glass-panel p-8 rounded-[24px] bg-[#111] border-white/10 relative overflow-hidden shadow-xl transition-transform duration-500 hover:scale-[1.02]">
                            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-50"></div>
                            
                            <div class="flex justify-between items-start mb-8 relative z-10">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 border border-white/10">
                                        <i data-lucide="wallet" class="w-6 h-6"></i>
                                    </div>
                                    <div>
                                        <div class="text-sm font-bold text-white tracking-wider uppercase">Argent Liquide</div>
                                        <div class="text-[10px] text-gray-500 font-mono tracking-widest">Non traçable</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-4xl lg:text-5xl font-mono font-bold text-gray-200 tracking-tighter mb-8">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                            
                            <div class="text-xs text-gray-500 italic bg-black/30 p-2 rounded relative z-10">
                                "Attention aux vols. Déposez votre argent en lieu sûr."
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Bar -->
                <div class="glass-panel p-6 rounded-2xl">
                    <h3 class="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2"><i data-lucide="zap" class="w-4 h-4 text-yellow-400"></i> Opérations Rapides (ATM)</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Deposit Form -->
                        <form onsubmit="actions.bankDeposit(event)" class="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                                <i data-lucide="arrow-down" class="w-5 h-5"></i>
                            </div>
                            <input type="number" name="amount" placeholder="Montant Dépôt" min="1" max="${state.bankAccount.cash_balance}" class="bg-transparent text-white text-sm w-full outline-none font-mono" required>
                            <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Valider</button>
                        </form>

                        <!-- Withdraw Form -->
                        <form onsubmit="actions.bankWithdraw(event)" class="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/5 focus-within:border-red-500/50 transition-colors">
                            <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                                <i data-lucide="arrow-up" class="w-5 h-5"></i>
                            </div>
                            <input type="number" name="amount" placeholder="Montant Retrait" min="1" max="${state.bankAccount.bank_balance}" class="bg-transparent text-white text-sm w-full outline-none font-mono" required>
                            <button type="submit" class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">Valider</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // --- TAB: OPERATIONS (TRANSFER) ---
    else if (state.activeBankTab === 'operations') {
        const filteredList = state.filteredRecipients;
        
        content = `
             <div class="flex items-center justify-center h-full">
                 <div class="glass-panel p-8 rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl relative">
                    <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-blue-500 rounded-full blur-[50px] opacity-40"></div>
                    
                    <div class="text-center mb-8 relative z-10">
                        <div class="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto mb-4 border border-blue-500/20">
                            <i data-lucide="send" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white">Virement Instantané</h3>
                        <p class="text-gray-400 text-sm mt-2">Transférez des fonds à n'importe quel citoyen.</p>
                    </div>

                    <form onsubmit="actions.bankTransfer(event)" class="space-y-6 relative z-10" autocomplete="off">
                        <div class="relative">
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Bénéficiaire</label>
                            <input type="hidden" name="target_id" value="${state.selectedRecipient ? state.selectedRecipient.id : ''}" required>
                            <div class="relative group">
                                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500 group-focus-within:text-blue-400 transition-colors"></i>
                                <input type="text" 
                                        id="recipient_search"
                                        placeholder="Commencez à taper un nom..." 
                                        value="${state.selectedRecipient ? state.selectedRecipient.name : ''}"
                                        oninput="actions.searchRecipients(this.value)"
                                        class="glass-input p-3 pl-10 rounded-xl w-full text-sm placeholder-gray-600 ${state.selectedRecipient ? 'text-blue-400 font-bold border-blue-500/50 bg-blue-500/5' : ''}" 
                                        autocomplete="off"
                                        ${state.selectedRecipient ? 'readonly' : ''}
                                >
                                ${state.selectedRecipient ? `
                                    <button type="button" onclick="actions.clearRecipient()" class="absolute right-3 top-3 text-gray-500 hover:text-white p-1 bg-white/10 rounded-full hover:bg-white/20 transition-all"><i data-lucide="x" class="w-3 h-3"></i></button>
                                ` : ''}
                            </div>
                            
                            <div id="search-results-container" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl custom-scrollbar hidden z-50"></div>
                        </div>

                        <div>
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Montant ($)</label>
                            <div class="relative">
                                <span class="absolute left-4 top-3 text-gray-500 font-mono text-lg">$</span>
                                <input type="number" name="amount" placeholder="0.00" min="1" max="${state.bankAccount.bank_balance}" class="glass-input p-3 pl-8 rounded-xl w-full font-mono text-lg font-bold tracking-wider" required>
                            </div>
                            <div class="text-right text-[10px] text-gray-500 mt-1 uppercase tracking-wide">Solde dispo: <span class="text-emerald-400 font-bold">$${state.bankAccount.bank_balance.toLocaleString()}</span></div>
                        </div>

                        <div>
                            <label class="text-xs text-gray-500 uppercase font-bold ml-1 mb-1 block">Motif</label>
                            <input type="text" name="description" placeholder="Ex: Paiement facture..." maxlength="50" class="glass-input p-3 rounded-xl w-full text-sm">
                        </div>

                        <button type="submit" class="glass-btn w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-4 transform hover:scale-[1.02] transition-all">
                            Envoyer les fonds <i data-lucide="arrow-right" class="w-4 h-4"></i>
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
            let icon, color, label, sign, bgIcon;
            
            if (t.type === 'deposit') {
                icon = 'arrow-down-left'; color = 'text-emerald-400'; label = 'Dépôt Espèces'; sign = '+'; bgIcon = 'bg-emerald-500/10 text-emerald-500';
            } else if (t.type === 'withdraw') {
                icon = 'arrow-up-right'; color = 'text-gray-300'; label = 'Retrait Espèces'; sign = '-'; bgIcon = 'bg-white/10 text-white';
            } else if (t.type === 'transfer') {
                if (t.receiver_id === state.activeCharacter.id) {
                    icon = 'arrow-down-left'; color = 'text-emerald-400'; label = 'Virement Reçu'; sign = '+'; bgIcon = 'bg-blue-500/10 text-blue-400';
                } else {
                    icon = 'send'; color = 'text-gray-300'; label = 'Virement Envoyé'; sign = '-'; bgIcon = 'bg-indigo-500/10 text-indigo-400';
                }
            } else if (t.type === 'admin_adjustment') {
                icon = 'shield'; label = 'Ajustement Admin'; bgIcon = 'bg-purple-500/10 text-purple-400';
                if (t.amount >= 0) { color = 'text-emerald-400'; sign = '+'; } else { color = 'text-red-400'; sign = '-'; }
            }

            return `
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full ${bgIcon} flex items-center justify-center border border-white/5">
                            <i data-lucide="${icon}" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white text-sm">${label}</div>
                            <div class="text-[10px] text-gray-500 font-mono mt-0.5">${new Date(t.created_at).toLocaleString()}</div>
                            ${t.description ? `<div class="text-[10px] text-gray-400 italic mt-1 bg-black/20 px-2 py-0.5 rounded w-fit">"${t.description}"</div>` : ''}
                        </div>
                    </div>
                    <div class="font-mono font-bold text-lg ${color}">
                        ${sign} $${Math.abs(t.amount).toLocaleString()}
                    </div>
                </div>
            `;
        }).join('') 
        : '<div class="text-center text-gray-500 py-20 flex flex-col items-center border border-dashed border-white/10 rounded-2xl"><i data-lucide="history" class="w-12 h-12 mb-4 opacity-20"></i>Aucune transaction récente.</div>';

        content = `
            <div class="flex flex-col h-full">
                <div class="flex justify-between items-center mb-6 px-1">
                    <h3 class="font-bold text-white flex items-center gap-2 uppercase text-sm tracking-widest opacity-80">
                        <i data-lucide="list" class="w-4 h-4"></i> Dernières Transactions
                    </h3>
                    <div class="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-400">20 derniers</div>
                </div>
                <div class="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
                    ${historyHtml}
                </div>
            </div>
        `;
    }

    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative">
            <!-- FIXED BANNER -->
            ${refreshBanner}
            
            <!-- FIXED HEADER NAV -->
            <div class="px-6 pb-4 flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 shrink-0">
                <div>
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i data-lucide="landmark" class="w-6 h-6 text-emerald-500"></i>
                        Banque Nationale
                    </h2>
                    <p class="text-gray-400 text-sm">Services financiers sécurisés</p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
                    ${tabs.map(t => `
                        <button onclick="actions.setBankTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${state.activeBankTab === t.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- MAIN SCROLLABLE CONTENT AREA -->
            <div class="flex-1 p-6 overflow-hidden relative min-h-0">
                ${content}
            </div>
        </div>
    `;
};
