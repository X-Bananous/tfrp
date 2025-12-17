
import { state } from '../state.js';
import { render } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import * as services from '../services.js';

export const openIdCard = async (targetId = null, docType = 'id_card') => {
    if(targetId) {
         // Try to find in admin list which contains avatar urls
         let char = state.allCharactersAdmin.find(c => c.id === targetId);
         // Fallback if not in memory (e.g. not staff)
         if(!char) {
             const { data } = await state.supabase.from('characters').select('*').eq('id', targetId).single();
             if(data) {
                 // We need to fetch profile for avatar
                 const { data: profile } = await state.supabase.from('profiles').select('avatar_url').eq('id', data.user_id).single();
                 char = { ...data, discord_avatar: profile?.avatar_url };
             }
         }
         if(char) state.idCardTarget = char; 
    } else {
         state.idCardTarget = null;
    }
    state.activeDocumentType = docType;
    state.idCardModalOpen = true;
    render();
};

export const closeIdCard = () => {
    state.idCardModalOpen = false;
    state.idCardTarget = null;
    state.activeDocumentType = 'id_card';
    render();
};

export const openMyRecord = async () => {
    ui.showToast("Récupération du casier...", "info");
    await services.fetchCharacterReports(state.activeCharacter.id);
    state.criminalRecordReports = state.policeReports;
    state.criminalRecordTarget = state.activeCharacter;
    render();
};

export const closeMyRecord = () => {
    state.criminalRecordTarget = null;
    state.criminalRecordReports = [];
    render();
};

export const openCriminalRecord = async (charId) => {
    const char = state.allCharactersAdmin.find(c => c.id === charId);
    if (!char) return;

    ui.showToast("Récupération du casier...", "info");
    
    // Fetch reports where this character is a suspect
    await services.fetchCharacterReports(charId);
    state.criminalRecordReports = state.policeReports; // Store separately to avoid conflict with editor
    state.criminalRecordTarget = char;
    render();
};

export const closeCriminalRecord = () => {
    state.criminalRecordTarget = null;
    state.criminalRecordReports = [];
    render();
};

export const performPoliceSearch = async (targetId, targetName) => {
    if (!state.activeGameSession) {
         ui.showModal({
             title: "Erreur",
             content: "On dirait que le suspect n'est pas présent actuellement.",
             confirmText: "Fermer"
         });
         return;
    }

    ui.showToast("Fouille en cours...", "info");
    
    // 1. Fetch Target Inventory
    const { data: inv } = await state.supabase.from('inventory').select('*').eq('character_id', targetId);
    const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', targetId).single();
    
    // 2. Create automatic report
    // We await to ensure it created successfully before showing results
    const success = await services.createPoliceReport({
        character_id: state.activeCharacter.id, 
        author_id: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`,
        title: "Fouille de Police",
        description: `Contrôle et fouille de ${targetName}.`,
        fine_amount: 0,
        jail_time: 0
    }, [{ id: targetId, name: targetName }]);

    if (!success) {
        ui.showToast("Echec de la création du rapport de fouille.", "error");
    }

    // 3. Show Result Modal
    state.policeSearchTarget = {
        targetName,
        items: inv || [],
        cash: bank ? bank.cash_balance : 0
    };
    render();
};

export const closePoliceSearch = () => {
    state.policeSearchTarget = null;
    render();
};

export const searchVehicles = (query) => {
    state.vehicleSearchQuery = query;
    render();
    setTimeout(() => {
         const input = document.querySelector('input[placeholder*="Plaque"]');
         if(input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    }, 0);
};

export const setServicesTab = async (tab) => {
    state.activeServicesTab = tab;
    state.isPanelLoading = true;
    render();
    try {
        if (tab === 'map') await services.fetchERLCData();
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

export const toggleDirectoryMode = async (mode) => {
    state.servicesDirectoryMode = mode;
    if(mode === 'reports') {
        state.isPanelLoading = true;
        render();
        await services.fetchAllReports();
        state.isPanelLoading = false;
    }
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

export const openCallPage = () => {
    if(window.actions) window.actions.setHubPanel('emergency_call');
};

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

export const addSuspectToReport = (charId) => {
    const char = state.allCharactersAdmin.find(c => c.id === charId);
    if(char) {
        if(!state.reportSuspects.some(s => s.id === charId)) {
            state.reportSuspects.push({ id: char.id, name: `${char.first_name} ${char.last_name}`});
        }
        state.activeServicesTab = 'reports'; 
        render();
    }
};

export const removeSuspectFromReport = (index) => {
    state.reportSuspects.splice(index, 1);
    render();
};

export const submitPoliceReport = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    
    if (state.reportSuspects.length === 0) {
        ui.showToast('Ajoutez au moins un citoyen au rapport.', 'error');
        return;
    }
    toggleBtnLoading(btn, true);

    const data = new FormData(e.target);
    const title = data.get('title');
    const fineAmount = parseInt(data.get('fine_amount') || 0);

    if (title.length > 60) {
        ui.showToast("Titre trop long (Max 60 caractères).", 'error');
        toggleBtnLoading(btn, false);
        return;
    }

    if (fineAmount > 25000) {
         ui.showToast('Amende maximale : 25 000 $.', 'error');
         toggleBtnLoading(btn, false);
         return;
    }

    const reportData = {
        character_id: state.activeCharacter.id, 
        author_id: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`,
        title: title,
        description: data.get('description'),
        fine_amount: fineAmount,
        jail_time: parseInt(data.get('jail_time') || 0)
    };

    const success = await services.createPoliceReport(reportData, state.reportSuspects);
    
    if (success) {
        // AUTOMATIC FINE DEDUCTION + INVOICE CREATION
        if (fineAmount > 0) {
            let finesApplied = 0;
            for (const suspect of state.reportSuspects) {
                // We need the character ID to deduct
                if (suspect.id) {
                     const { data: bank } = await state.supabase.from('bank_accounts').select('bank_balance').eq('character_id', suspect.id).maybeSingle();
                     if (bank) {
                         // 1. Deduct Money (Standard Procedure)
                         await state.supabase.from('bank_accounts').update({ 
                             bank_balance: bank.bank_balance - fineAmount 
                         }).eq('character_id', suspect.id);
                         
                         // 2. Transaction Log
                         await state.supabase.from('transactions').insert({
                             sender_id: suspect.id,
                             amount: fineAmount,
                             type: 'withdraw', 
                             description: `Amende Police: ${reportData.title}`
                         });

                         // 3. CREATE INVOICE (RP Document)
                         // For police fines, enterprise_id is null.
                         await state.supabase.from('invoices').insert({
                            buyer_id: suspect.id,
                            enterprise_id: null, // Null indicates government/police fine
                            item_name: `CONTRAVENTION - ${reportData.title.toUpperCase()}`,
                            quantity: 1,
                            total_price: fineAmount,
                            promo_code: `OFFICIER ${reportData.author_id.split(' ')[1]}` // Store Officer Name here for display
                        });

                         finesApplied++;
                     }
                }
            }
            if (finesApplied > 0) {
                 ui.showToast(`Amendes prélevées et factures envoyées (${finesApplied}).`, 'info');
            }
        }
        
        state.reportSuspects = []; 
        e.target.reset();
    }
    
    toggleBtnLoading(btn, false);
    render();
};

export const openDossier = async (charId) => {
    // 1. Fetch Fresh Data
    const { data: char } = await state.supabase.from('characters').select('*').eq('id', charId).single();
    if(!char) return;

    // 2. Fetch Physical License (Check Inventory)
    // Only fetch if "Permis de conduire" exists in their inventory
    const { data: licenseItem } = await state.supabase
        .from('inventory')
        .select('id')
        .eq('character_id', charId)
        .eq('name', 'Permis de conduire')
        .maybeSingle();

    // Store extended data in state
    state.dossierTarget = {
        ...char,
        has_physical_license: !!licenseItem // Boolean true if they have the item
    };

    // SWITCH TO DOSSIER PAGE instead of Modal
    state.activeServicesTab = 'dossier_detail';
    render();
};

export const closeDossierPage = () => {
    state.dossierTarget = null;
    state.activeServicesTab = 'directory'; // Back to list
    render();
};

// Deprecated (Modal version) - kept for compatibility if needed elsewhere
export const closeDossier = () => {
    state.dossierTarget = null;
    render();
};

export const updateLicensePoints = async (charId, amountToRemove) => {
    const char = state.dossierTarget;
    if(!char || char.id !== charId) return;

    // CHECK 1: DOES HE HAVE THE PHYSICAL LICENSE?
    if (!char.has_physical_license) {
        return ui.showToast("Ce citoyen n'est pas titulaire du permis (Non acheté/Non présent).", "error");
    }

    // CHECK 2: DOES HE HAVE VALID POINTS DATA?
    let currentPoints = char.driver_license_points; // Can be null if never initialized properly in DB
    
    if (currentPoints === null || currentPoints === undefined) {
        return ui.showToast("Erreur dossier : Points non initialisés.", "error");
    }
    
    // CHECK 3: IS IT ALREADY SUSPENDED?
    if (currentPoints <= 0) {
        return ui.showToast("Le permis est déjà suspendu (0 points).", "error");
    }

    let newPoints = Math.max(0, currentPoints - amountToRemove);
    
    await state.supabase.from('characters').update({
        driver_license_points: newPoints
    }).eq('id', charId);
    
    state.dossierTarget.driver_license_points = newPoints;
    
    // Create automatic sanction report if points removed
    await services.createPoliceReport({
        character_id: state.activeCharacter.id, 
        author_id: `${state.activeCharacter.first_name} ${state.activeCharacter.last_name}`,
        title: "Retrait de Points",
        description: `Retrait de ${amountToRemove} points sur le permis de conduire. Solde restant: ${newPoints}/12.`,
        fine_amount: 0,
        jail_time: 0
    }, [{ id: charId, name: `${char.first_name} ${char.last_name}` }]);

    ui.showToast(`Points retirés. Nouveau solde: ${newPoints}`, 'warning');
    render();
};
