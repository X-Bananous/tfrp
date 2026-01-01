import { state } from '../state.js';
import { render } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';
import { BAR_QUESTIONS } from '../views/services/lawyer_exam.js';

export const startBarExam = () => {
    const shuffled = [...BAR_QUESTIONS].sort(() => 0.5 - Math.random());
    state.activeExam = {
        questions: shuffled.slice(0, 15),
        currentIndex: 0,
        score: 0,
        timeLeft: 30, 
        timer: null
    };
    
    window.onbeforeunload = () => "Examen en cours. Quitter entraînera un échec immédiat.";
    
    startExamTimer();
    render();
};

const startExamTimer = () => {
    if (state.activeExam.timer) clearInterval(state.activeExam.timer);
    
    state.activeExam.timeLeft = 30; 
    state.activeExam.timer = setInterval(() => {
        state.activeExam.timeLeft--;
        
        if (state.activeExam.timeLeft <= 0) {
            answerExamQuestion(-1);
        } else {
            const timerEl = document.getElementById('exam-timer-bar');
            if (timerEl) {
                timerEl.style.width = `${(state.activeExam.timeLeft / 30) * 100}%`;
                if (state.activeExam.timeLeft <= 5) timerEl.classList.add('bg-red-500');
                else timerEl.classList.remove('bg-red-500');
            }
            const timerSecs = document.getElementById('exam-timer-seconds');
            if (timerSecs) timerSecs.textContent = state.activeExam.timeLeft + 's';
        }
    }, 1000);
};

export const answerExamQuestion = async (answerIdx) => {
    const exam = state.activeExam;
    if (!exam) return;

    if (exam.timer) clearInterval(exam.timer);
    
    const currentQ = exam.questions[exam.currentIndex];
    if (answerIdx === currentQ.r) {
        exam.score++;
    }
    
    if (exam.currentIndex < 14) {
        exam.currentIndex++;
        startExamTimer();
        render();
    } else {
        await finishBarExam();
    }
};

const finishBarExam = async (forcedFailure = false) => {
    const exam = state.activeExam;
    if (!exam && !forcedFailure) return;

    if (exam?.timer) clearInterval(exam.timer);
    window.onbeforeunload = null;

    const finalScore = forcedFailure ? 0 : exam.score;
    const passed = !forcedFailure && finalScore >= 13;
    const char = state.activeCharacter;
    
    state.activeExam = null;
    const now = new Date().toISOString();

    try {
        const { error } = await state.supabase
            .from('characters')
            .update({ 
                bar_passed: passed, 
                last_bar_attempt: now 
            })
            .eq('id', char.id);

        if (error) throw error;

        char.bar_passed = passed;
        char.last_bar_attempt = now;

        if (passed) {
            ui.showModal({
                title: "Admis au Barreau",
                content: `<div class="text-center"><div class="text-4xl mb-4">⚖️</div><p>Félicitations <b>Maître ${char.last_name}</b> ! Vous avez obtenu <b>${finalScore}/15</b>. Vous êtes officiellement accrédité.</p></div>`,
                confirmText: "Accéder au Panel"
            });
        } else {
            ui.showModal({
                title: forcedFailure ? "Abandon Sanctionné" : "Échec au Barreau",
                content: `<div class="text-center"><div class="text-4xl mb-4">❌</div><p>${forcedFailure ? "Vous avez tenté d'esquiver l'épreuve." : `Score : <b>${finalScore}/15</b>. Vous avez échoué.`} Le barreau pour <b>${char.first_name}</b> est suspendu pour 2 heures.</p></div>`,
                confirmText: "Compris"
            });
        }
    } catch (err) {
        console.error("Exam save error:", err);
        ui.showToast("Erreur lors de la sauvegarde du résultat.", "error");
    }
    render();
};

export const checkExamAborted = async () => {
    if (state.activeExam) {
        await finishBarExam(true);
    }
};

export const paySalariesAction = async (e) => {
    if (e) e.preventDefault();
    const job = state.activeCharacter?.job;
    if (job !== 'maire' && job !== 'adjoint') {
        ui.showToast("Accès refusé. Seul le Maire ou ses Adjoints peuvent verser les salaires.", "error");
        return;
    }
    if (state.lastSalaryPayment) {
        const lastPayment = new Date(state.lastSalaryPayment);
        const now = new Date();
        const diffTime = Math.abs(now - lastPayment);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
            const nextDate = new Date(lastPayment.getTime() + (7 * 24 * 60 * 60 * 1000));
            ui.showToast(`Impossible : Les salaires ont déjà été versés cette semaine. Prochaine éligibilité le ${nextDate.toLocaleDateString()}.`, "warning");
            return;
        }
    }
    ui.showModal({
        title: "Versement des Salaires Consolidés",
        content: `
            <div class="text-center space-y-4">
                <div class="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto"><i data-lucide="banknote" class="w-8 h-8"></i></div>
                <p class="text-sm text-gray-300">Confirmez-vous le versement des salaires pour l'ensemble de l'administration publique ?</p>
                <div class="bg-black/20 p-4 rounded-xl border border-white/5 text-[10px] text-gray-500 uppercase font-bold text-left space-y-2">
                    <p class="text-blue-400">POLITIQUE :</p><p>• Maire : 10,000$ | Adjoint : 7,500$</p>
                    <p class="text-purple-400 mt-1">JUSTICE :</p><p>• Procureur : 6,500$ | Juge : 5,000$ | Avocat : 4,750$</p>
                    <p class="text-emerald-400 mt-1">SERVICES :</p><p>• LEO / LAFD / DOT : 2,500$ + Primes d'activité</p>
                </div>
                <p class="text-xs text-orange-400 italic">Prélèvement automatique sur la Trésorerie d'État.</p>
            </div>
        `,
        confirmText: "Ratifier et Payer",
        cancelText: "Annuler",
        onConfirm: async () => { await services.processSalaries(); render(); }
    });
};

export const setAdvisorMode = (mode) => {
    state.advisorMode = mode;
    ui.showToast(`Mode de l'assistant réglé sur : ${mode.toUpperCase()}`, 'info');
    render();
};

export const openIdCard = async (targetId = null, docType = 'id_card') => {
    if(targetId) {
         let char = state.allCharactersAdmin.find(c => c.id === targetId);
         if(!char) {
             const { data } = await state.supabase.from('characters').select('*').eq('id', targetId).single();
             if(data) {
                 const { data: profile } = await state.supabase.from('profiles').select('avatar_url').eq('id', data.user_id).single();
                 char = { ...data, discord_avatar: profile?.avatar_url };
             }
         }
         if(char) state.idCardTarget = char; 
    } else { state.idCardTarget = null; }
    state.activeDocumentType = docType;
    state.idCardModalOpen = true;
    render();
};

export const closeIdCard = () => { state.idCardModalOpen = false; state.idCardTarget = null; state.activeDocumentType = 'id_card'; render(); };
export const openMyRecord = async () => {
    ui.showToast("Récupération du casier...", "info");
    await services.fetchCharacterReports(state.activeCharacter.id);
    state.criminalRecordReports = state.policeReports;
    state.criminalRecordTarget = state.activeCharacter;
    render();
};
export const closeMyRecord = () => { state.criminalRecordTarget = null; state.criminalRecordReports = []; render(); };
export const openCriminalRecord = async (charId) => {
    const char = state.allCharactersAdmin.find(c => c.id === charId);
    if (!char) return;
    ui.showToast("Récupération du casier...", "info");
    await services.fetchCharacterReports(charId);
    state.criminalRecordReports = state.policeReports;
    state.criminalRecordTarget = char;
    render();
};
export const closeCriminalRecord = () => { state.criminalRecordTarget = null; state.criminalRecordReports = []; render(); };

export const performPoliceSearch = async (targetId, targetName) => {
    if (!state.activeGameSession) {
         ui.showModal({ title: "Erreur", content: "On dirait que n'est pas présent actuellement.", confirmText: "Fermer" });
         return;
    }
    ui.showToast("Fouille en cours...", "info");
    const { data: inv } = await state.supabase.from('inventory').select('*').eq('character_id', targetId);
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', targetId).single();
    
    await services.createPoliceReport({
        character_id: state.activeCharacter.id, 
        author_id: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`,
        title: "Fouille de Police",
        description: `Controle et fouille reglementaire de ${targetName}.`,
        fine_amount: 0,
        jail_time: 0
    }, [{ id: targetId, name: targetName }]);

    state.policeSearchTarget = { targetName, items: inv || [], cash: bank ? bank.cash_balance : 0 };
    render();
};

export const closePoliceSearch = () => { state.policeSearchTarget = null; render(); };
export const searchVehicles = (query) => {
    state.vehicleSearchQuery = query;
    render();
    setTimeout(() => {
         const input = document.querySelector('input[placeholder*="Plaque"]');
         if(input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }, 0);
};

export const setServicesTab = async (tab) => {
    await checkExamAborted(); 
    state.activeServicesTab = tab;
    state.isPanelLoading = true;
    if (tab !== 'reports') state.editingReport = null; 
    render();
    try {
        if (tab === 'map') await services.fetchERLCData();
        if (tab === 'justice_docket' || tab.startsWith('gov_') || tab === 'full_reports' || tab === 'directory') {
            await Promise.all([
                services.fetchAllReports(),
                services.fetchAllCharacters(),
                services.fetchEnterprises(),
                services.fetchDailyEconomyStats(), 
                services.fetchServerStats(),
                services.fetchSecureConfig()
            ]);
        }
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

export const openSummonModal = (charId, charName) => {
    ui.showModal({
        title: "Délivrer une Convocation",
        content: `
            <div class="space-y-4">
                <p class="text-sm text-gray-400">Citoyen : <span class="text-white font-bold">${charName}</span></p>
                <div>
                    <label class="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Lieu de l'audience</label>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="cursor-pointer">
                            <input type="radio" name="loc" value="Palais de Justice" checked class="peer sr-only">
                            <div class="p-3 bg-white/5 border border-white/10 rounded-xl text-center text-xs font-bold peer-checked:bg-purple-600/20 peer-checked:border-purple-500 peer-checked:text-purple-300">Audience Palais</div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="loc" value="Poste de Police" class="peer sr-only">
                            <div class="p-3 bg-white/5 border border-white/10 rounded-xl text-center text-xs font-bold peer-checked:bg-blue-600/20 peer-checked:border-blue-500 peer-checked:text-blue-300">Poste de Police</div>
                        </label>
                    </div>
                </div>
                <textarea id="summon-reason" placeholder="Motif de la convocation..." class="glass-input w-full p-3 rounded-xl text-sm h-24"></textarea>
            </div>
        `,
        confirmText: "Envoyer l'huissier",
        onConfirm: async () => {
            const loc = document.querySelector('input[name="loc"]:checked').value;
            const reason = document.getElementById('summon-reason').value || "Audience Judiciaire";
            const char = state.allCharactersAdmin.find(c => c.id === charId);
            if(char && char.user_id) {
                await services.createNotification(
                    "CONVOCATION JUDICIAIRE",
                    `Vous êtes convoqué par le ${state.activeCharacter.job} au ${loc.toUpperCase()}. Motif : ${reason}. La non-présentation est un délit grave.`,
                    "warning",
                    true,
                    char.user_id
                );
                ui.showToast(`Convocation envoyée à ${charName}.`, 'success');
            }
        }
    });
    if(window.lucide) lucide.createIcons();
};

export const sealCase = async (reportId) => {
    ui.showModal({
        title: "SCELLER LE DOSSIER",
        content: `
            <div class="text-center space-y-4">
                <div class="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                    <i data-lucide="lock" class="w-8 h-8"></i>
                </div>
                <p class="text-sm text-gray-300">Cette action clôturera définitivement l'affaire. <b>Plus aucune modification ne sera possible.</b></p>
                <p class="text-[10px] text-orange-400 font-bold uppercase">Action irréversible</p>
            </div>
        `,
        confirmText: "Sceller l'affaire",
        onConfirm: async () => {
            // MISE À JOUR BOOLÉENNE STRICTE
            const { error } = await state.supabase
                .from('police_reports')
                .update({ is_closed: true })
                .eq('id', reportId);

            if(!error) {
                ui.showToast("Dossier scellé et archivé.", 'success');
                
                // SYNCHRONISATION DU STATE LOCAL IMMÉDIATE
                const syncLocal = (list) => {
                    const idx = list.findIndex(r => r.id === reportId);
                    if (idx !== -1) list[idx].is_closed = true;
                };

                if (state.globalReports) syncLocal(state.globalReports);
                if (state.policeReports) syncLocal(state.policeReports);
                if (state.criminalRecordReports) syncLocal(state.criminalRecordReports);

                // Rafraîchissement complet
                await services.fetchAllReports();
                if (state.dossierTarget) {
                    await services.fetchCharacterReports(state.dossierTarget.id);
                    state.criminalRecordReports = state.policeReports;
                }
                render();
            } else {
                console.error("Seal Error:", error);
                ui.showToast("Échec du scellage. Erreur serveur.", 'error');
            }
        }
    });
};

export const searchGovCitizens = (query) => {
    const container = document.getElementById('gov-search-results');
    if(!container) return;
    if(!query || query.length < 2) { container.classList.add('hidden'); return; }
    const lower = query.toLowerCase();
    const filtered = state.allCharactersAdmin.filter(c => 
        c.status === 'accepted' && 
        (!c.job || c.job === 'unemployed' || c.job === 'pdg') && 
        (`${c.first_name} ${c.last_name}`.toLowerCase().includes(lower)) &&
        !['maire', 'adjoint', 'juge', 'procureur'].includes(c.job)
    );
    if(filtered.length > 0) {
        container.innerHTML = filtered.map(c => `
            <div onclick="actions.assignJob('${c.id}', 'adjoint'); document.getElementById('gov-search-results').classList.add('hidden');" class="p-3 border-b border-white/5 hover:bg-white/10 cursor-pointer text-xs text-white">
                <span class="font-bold">${c.first_name} ${c.last_name}</span>
                <span class="text-[9px] text-gray-500 ml-2 uppercase font-black tracking-widest">${c.job || 'Civil'}</span>
            </div>
        `).join('');
        container.classList.remove('hidden');
    } else {
        container.innerHTML = '<div class="p-3 text-xs text-gray-500 italic">Aucun citoyen éligible.</div>';
        container.classList.remove('hidden');
    }
};

export const submitGovEconomy = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const formData = new FormData(e.target);
    const itemTax = parseFloat(formData.get('create_item_ent_tax'));
    if (isNaN(itemTax) || itemTax < 5) { ui.showToast("La Taxe Rayon ne peut pas être inférieure à 5%.", "error"); return; }
    toggleBtnLoading(btn, true, "Signature...");
    
    const updates = [
        { k: 'tva_tax', v: formData.get('tva_tax') }, 
        { k: 'create_item_ent_tax', v: itemTax.toString() }, 
        { k: 'driver_license_price', v: formData.get('driver_license_price') }, 
        { k: 'driver_stage_price', v: formData.get('driver_stage_price') },
        { k: 'taux_bank', v: formData.get('taux_bank') }
    ];
    
    try {
        for (const item of updates) {
            if (item.v === null || item.v === undefined || item.v === "") continue;
            await state.supabase.from('keys_data').upsert({ key: item.k, value: item.v.toString() }, { onConflict: 'key' });
        }
        ui.showToast("Décrets économiques synchronisés.", "success");
        await services.fetchSecureConfig(); 
    } catch (err) { 
        console.error(err);
        ui.showToast("Erreur lors de la signature des décrets.", "error"); 
    } finally { 
        toggleBtnLoading(btn, false); 
        render(); 
    }
};

export const toggleDirectoryMode = async (mode) => {
    state.servicesDirectoryMode = mode;
    if(mode === 'reports') { state.isPanelLoading = true; render(); await services.fetchAllReports(); state.isPanelLoading = false; }
    render();
};

export const openFullReports = async () => {
    state.isPanelLoading = true;
    render();
    await services.fetchAllReports();
    state.activeServicesTab = 'full_reports';
    state.isPanelLoading = false;
    render();
};

export const openCallPage = () => { if(window.actions) window.actions.setHubPanel('emergency_call'); };
export const createEmergencyCall = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);
    const data = new FormData(e.target);
    await services.createEmergencyCall(data.get('service'), data.get('location'), data.get('description'));
    toggleBtnLoading(btn, false);
    if(window.actions) window.actions.setHubPanel('main');
};

export const joinCall = async (callId) => {
    if (!state.activeGameSession) return ui.showToast("Session fermée.", "error");
    await services.joinEmergencyCall(callId);
    ui.showToast("Vous avez rejoint l'intervention.", "success");
    render();
};

export const searchServices = (query) => {
    state.servicesSearchQuery = query;
    render();
    setTimeout(() => {
         const input = document.querySelector('input[placeholder*="Recherche"]');
         if(input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }, 0);
};

export const addSuspectToReport = async (charId) => {
    if(state.editingReport && state.activeCharacter.job !== 'juge' && state.activeCharacter.job !== 'procureur') return ui.showToast("Impossible d'ajouter des suspects en mode édition.", "warning");
    const char = state.allCharactersAdmin.find(c => c.id === charId) || state.dossierTarget;
    if(char && char.id === charId) {
        if(!state.reportSuspects.some(s => s.id === charId)) {
            const { data: license } = await state.supabase.from('inventory').select('id').eq('character_id', charId).eq('name', 'Permis de conduire').maybeSingle();
            state.reportSuspects.push({ id: char.id, name: `${char.first_name} ${char.last_name}`, fine: 0, jail: 0, points: 0, has_license: !!license, points_limit: (char.driver_license_points !== undefined && char.driver_license_points !== null) ? char.driver_license_points : 12, user_id: char.user_id });
            ui.showToast(`${char.first_name} ajouté au rapport actuel.`, 'info');
        } else { ui.showToast(`Déjà présent dans le rapport.`, 'warning'); }
        state.activeServicesTab = 'reports'; 
        render();
    }
};

export const startEditReport = (reportId) => {
    const report = state.globalReports.find(r => r.id === reportId) || state.policeReports.find(r => r.id === reportId);
    if (!report) return ui.showToast("Rapport introuvable.", "error");
    if (report.is_closed) return ui.showToast("Ce dossier est scellé. Toute modification est interdite.", "error");

    state.editingReport = report;
    state.activeServicesTab = 'reports';
    const suspects = report.police_report_suspects || [];
    state.reportSuspects = suspects.map(s => ({ id: s.character_id, name: s.suspect_name, fine: 0, jail: 0, points: 0, is_locked: true }));
    render();
};

export const updateSuspectSanction = (index, field, value) => {
    if (state.reportSuspects[index]) { state.reportSuspects[index][field] = parseInt(value) || 0; }
};

export const removeSuspectFromReport = (index) => {
    if (state.editingReport && state.activeCharacter.job !== 'juge' && state.activeCharacter.job !== 'procureur') return ui.showToast("Impossible de retirer des suspects en mode édition.", "warning");
    state.reportSuspects.splice(index, 1);
    render();
};

export const submitPoliceReport = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    const job = state.activeCharacter.job;
    const isJustice = job === 'juge' || job === 'procureur';

    if (state.reportSuspects.length === 0) { ui.showToast('Ajoutez au moins un citoyen au rapport.', 'error'); return; }
    toggleBtnLoading(btn, true, state.editingReport ? "Mise à jour..." : "Signature...");
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const description = formData.get('description');
    if (title.length > 60) { ui.showToast("Titre trop long.", 'error'); toggleBtnLoading(btn, false); return; }

    try {
        if (state.editingReport) {
            const updates = { title, description };
            if (isJustice) {
                updates.fine_amount = state.reportSuspects.reduce((sum, s) => sum + s.fine, 0);
                updates.jail_time = state.reportSuspects.reduce((sum, s) => sum + s.jail, 0);
            }
            const { error } = await state.supabase.from('police_reports').update(updates).eq('id', state.editingReport.id);
            if (error) throw error;
            ui.showToast("Rapport judiciaire mis à jour.", "success");
            state.editingReport = null;
            state.reportSuspects = [];
            e.target.reset();
            await services.fetchAllReports();
            state.activeServicesTab = isJustice ? 'justice_docket' : 'full_reports';
        } else {
            const totalFine = state.reportSuspects.reduce((sum, s) => sum + s.fine, 0);
            const totalJail = state.reportSuspects.reduce((sum, s) => sum + s.jail, 0);
            const reportData = { character_id: state.activeCharacter.id, author_id: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`, title, description, fine_amount: totalFine, jail_time: totalJail };
            const success = await services.createPoliceReport(reportData, state.reportSuspects);
            if (success) {
                let treasuryUpdateNeeded = false;
                let currentTreasury = Number(state.gouvBank) || 0;
                for (const suspect of state.reportSuspects) {
                    let notifMsg = `Vous avez été cité dans un rapport : "${title}".`;
                    let hasPenalty = false;
                    if (suspect.fine > 0) {
                         const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', suspect.id).maybeSingle();
                         if (bank) {
                             const finalFine = Math.min(bank.bank_balance, suspect.fine);
                             await state.supabase.from('bank_accounts').update({ bank_balance: bank.bank_balance - finalFine }).eq('character_id', suspect.id);
                             await state.supabase.from('transactions').insert({ sender_id: suspect.id, amount: finalFine, type: 'withdraw', description: `Sanction Justice: ${title}` });
                             await state.supabase.from('invoices').insert({ buyer_id: suspect.id, enterprise_id: null, item_name: `CONTRAVENTION - ${title.toUpperCase()}`, quantity: 1, total_price: finalFine, promo_code: `OFFICIER ${reportData.author_id.split(' ')[1]}` });
                             currentTreasury += finalFine; treasuryUpdateNeeded = true; notifMsg += ` Amende prélevée : $${finalFine.toLocaleString()}.`; hasPenalty = true;
                         }
                    }
                    if (suspect.jail > 0) { notifMsg += ` Peine de prison : ${Math.round(suspect.jail / 60)} min.`; hasPenalty = true; }
                    if (suspect.points > 0 && suspect.has_license) {
                        const { data: char } = await state.supabase.from('characters').select('driver_license_points').eq('id', suspect.id).single();
                        if (char) {
                            const currentPoints = (char.driver_license_points !== null) ? char.driver_license_points : 12;
                            const newPoints = Math.max(0, currentPoints - suspect.points);
                            await state.supabase.from('characters').update({ driver_license_points: newPoints }).eq('id', suspect.id);
                            notifMsg += ` Retrait de points : -${suspect.points} pts (Nouveau solde: ${newPoints}/12).`; hasPenalty = true;
                            if (newPoints === 0) await services.createNotification("Permis Suspendu", "Votre permis de conduire a été suspendu par les services de police (0 points).", "warning", true, suspect.user_id);
                        }
                    }
                    if (suspect.user_id) await services.createNotification(hasPenalty ? "Sanction Judiciaire" : "Rapport Administratif", notifMsg, hasPenalty ? "warning" : "info", false, suspect.user_id);
                }
                if (treasuryUpdateNeeded) { await state.supabase.from('keys_data').upsert({ key: 'gouv_bank', value: currentTreasury.toString() }, { onConflict: 'key' }); state.gouvBank = currentTreasury; }
                ui.showToast("Rapport archivé et sanctions appliquées.", "success");
                state.reportSuspects = []; e.target.reset();
            }
        }
    } catch (err) { ui.showToast("Erreur lors de l'opération.", "error"); } finally { toggleBtnLoading(btn, false); render(); }
};

export const openDossier = async (charId) => {
    state.isPanelLoading = true; render();
    try {
        const { data: char } = await state.supabase.from('characters').select('*').eq('id', charId).single();
        if(!char) throw new Error("Citoyen introuvable.");
        const [reportsRes, licenseRes] = await Promise.all([services.fetchCharacterReports(charId), state.supabase.from('inventory').select('id').eq('character_id', charId).eq('name', 'Permis de conduire').maybeSingle()]);
        state.criminalRecordReports = state.policeReports;
        state.dossierTarget = { ...char, has_physical_license: !!licenseRes.data };
        state.activeServicesTab = 'dossier_detail';
    } catch(e) { ui.showToast("Erreur lors de l'ouverture du dossier.", "error"); } finally { state.isPanelLoading = false; render(); }
};

export const closeDossierPage = () => { state.dossierTarget = null; state.criminalRecordReports = []; state.activeServicesTab = 'directory'; render(); };
export const updateLicensePoints = async (charId, amountToRemove) => {
    const char = state.dossierTarget; if(!char || char.id !== charId) return;
    if (!char.has_physical_license) return ui.showToast("Action impossible : Le citoyen n'a pas de permis.", "error");
    let currentPoints = char.driver_license_points; if (currentPoints === null || currentPoints === undefined) currentPoints = 12;
    if (currentPoints <= 0) return ui.showToast("Le permis est déjà suspendu.", "error");
    let newPoints = Math.max(0, currentPoints - amountToRemove);
    await state.supabase.from('characters').update({ driver_license_points: newPoints }).eq('id', charId);
    state.dossierTarget.driver_license_points = newPoints;
    if (char.user_id) {
        await services.createNotification("Retrait de points", `Un officier a retiré ${amountToRemove} points de votre permis. Nouveau solde : ${newPoints}/12.`, "warning", false, char.user_id);
        if (newPoints === 0) await services.createNotification("Permis Suspendu", "Votre permis de conduire a été suspendu (solde nul).", "warning", true, char.user_id);
    }
    await services.createPoliceReport({ character_id: state.activeCharacter.id, author_id: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`, title: "SANCTION : RETRAIT DE POINTS", description: `Infraction routière constatée. Retrait de ${amountToRemove} points sur le permis. Nouveau solde : ${newPoints}/12.`, fine_amount: 0, jail_time: 0 }, [{ id: charId, name: `${char.first_name} ${char.last_name}` }]);
    await services.fetchCharacterReports(charId); state.criminalRecordReports = state.policeReports;
    ui.showToast(`Points retirés (${newPoints}/12).`, 'warning'); render();
};