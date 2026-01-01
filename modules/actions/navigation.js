
import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';
import { 
    loadCharacters, fetchBankData, fetchInventory, fetchActiveHeistLobby, 
    fetchGangs, fetchActiveGang, fetchBounties, fetchDrugLab, 
    fetchGlobalHeists, fetchEmergencyCalls, fetchAllCharacters, fetchAllReports, fetchEnterprises,
    fetchERLCData, fetchPendingApplications, fetchStaffProfiles, fetchOnDutyStaff, 
    fetchServerStats, fetchPendingHeistReviews, fetchDailyEconomyStats, fetchPlayerInvoices, 
    fetchTopSellers, fetchNotifications, fetchSecureConfig, fetchLawyers, fetchActiveSession, fetchSessionHistory,
    fetchEnterpriseMarket, fetchMyEnterprises, fetchEnterpriseDetails, fetchClientAppointments
} from '../services.js';
import { hasPermission } from '../utils.js';

export const backToSelect = async () => {
    if (state.activeExam) {
        ui.showToast("Action impossible durant l'examen.", "error");
        return;
    }
    
    state.activeCharacter = null;
    state.bankAccount = null;
    
    sessionStorage.removeItem('tfrp_active_char');
    sessionStorage.removeItem('tfrp_hub_panel');
    
    if(state.heistTimerInterval) clearInterval(state.heistTimerInterval);
    state.activeHeist = null;
    state.activeHeistLobby = null; 
    await loadCharacters();
    router('select');
};

export const toggleSidebarSection = (sectionId) => {
    const idx = state.ui.sidebarCollapsedSections.indexOf(sectionId);
    if (idx === -1) {
        state.ui.sidebarCollapsedSections.push(sectionId);
    } else {
        state.ui.sidebarCollapsedSections.splice(idx, 1);
    }
    render();
};

export const selectCharacter = async (charId) => {
    const char = state.characters.find(c => c.id === charId);
    if (char && char.status === 'accepted') {
        if (char.deletion_requested_at) {
            ui.showToast("Ce personnage est verrouillé pour suppression.", "error");
            return;
        }

        state.activeCharacter = char;
        state.activeHubPanel = 'main';
        state.alignmentModalShown = false; 
        
        sessionStorage.setItem('tfrp_active_char', charId);
        
        state.isPanelLoading = true;
        router('hub'); 
        
        try {
             await Promise.all([
                fetchActiveSession(), 
                fetchGlobalHeists(),
                fetchERLCData(),
                fetchOnDutyStaff(),
                fetchNotifications(),
                fetchSecureConfig() 
            ]);
        } catch(e) {
            console.warn("Initial hub fetch failed", e);
        } finally {
            state.isPanelLoading = false;
            render();
        }
    }
};

export const goToCreate = () => {
    router('create');
};

export const cancelCreate = () => router('select');

export const goBackFromLegal = () => {
    if (state.user) {
        if (state.activeCharacter) {
            router('hub');
        } else {
            router('select');
        }
    } else {
        router('login');
    }
};

export const setHubPanel = async (panel) => {
    if (state.activeExam) {
        ui.showToast("Concentrez-vous sur vos questions !", "warning");
        return;
    }

    state.activeHubPanel = panel;
    sessionStorage.setItem('tfrp_hub_panel', panel);
    
    state.isPanelLoading = true;
    render(); 
    
    try {
        if (panel === 'main') {
            await Promise.all([
                fetchActiveSession(),
                fetchGlobalHeists(),
                fetchERLCData(),
                fetchOnDutyStaff(),
                fetchNotifications(),
                fetchSecureConfig()
            ]);
        } else if (panel === 'notifications') {
            await fetchNotifications();
        } else if (panel === 'jobs') {
            await fetchEnterprises();
        } else if (panel === 'bank' && state.activeCharacter) {
            state.selectedRecipient = null;
            state.filteredRecipients = [];
            await fetchBankData(state.activeCharacter.id);
        } else if (panel === 'assets' && state.activeCharacter) {
            state.inventoryFilter = '';
            await Promise.all([
                fetchInventory(state.activeCharacter.id),
                fetchPlayerInvoices(state.activeCharacter.id)
            ]);
        } else if (panel === 'enterprise') {
            const promises = [fetchDailyEconomyStats(), fetchSecureConfig()];
            if (state.activeCharacter) promises.push(fetchBankData(state.activeCharacter.id));
            if(state.activeEnterpriseTab === 'market') {
                promises.push(fetchEnterpriseMarket());
                promises.push(fetchTopSellers()); 
            }
            else if(state.activeEnterpriseTab === 'my_companies' && state.activeCharacter) {
                promises.push(fetchMyEnterprises(state.activeCharacter.id));
            }
            await Promise.all(promises);
        } else if (panel === 'illicit' && state.activeCharacter) {
            state.activeIllicitTab = 'dashboard'; 
            await fetchActiveGang(state.activeCharacter.id);
            const illicitPromises = [
                fetchBankData(state.activeCharacter.id),
                fetchGangs(),
                fetchBounties(),
                fetchActiveHeistLobby(state.activeCharacter.id),
                fetchAllCharacters(),
                fetchSecureConfig(),
                fetchAllReports()
            ];
            if (state.activeGang) illicitPromises.push(fetchDrugLab(state.activeGang.id));
            await Promise.all(illicitPromises);
        } else if (panel === 'services' && state.activeCharacter) {
            const job = state.activeCharacter.job;
            if (job === 'maire' || job === 'adjoint') state.activeServicesTab = 'gov';
            else if (job === 'leo') state.activeServicesTab = 'dispatch';
            else state.activeServicesTab = 'directory';
            
            const promises = [
                fetchGlobalHeists(), 
                fetchEmergencyCalls(), 
                fetchSecureConfig(),
                fetchAllCharacters(),
                fetchAllReports(),
                fetchEnterprises(),
                fetchServerStats(),
                fetchDailyEconomyStats()
            ];
            if(job === 'leo' || job === 'lawyer' || job === 'lafd' || job === 'ladot') promises.push(fetchERLCData());
            await Promise.all(promises);
        } else if (panel === 'staff_list') {
            await Promise.all([fetchActiveSession(), fetchStaffProfiles(), fetchOnDutyStaff()]);
        } else if (panel === 'lawyers_list') {
            await Promise.all([fetchActiveSession(), fetchLawyers()]);
        } else if (panel === 'staff') {
            // Tab par défaut fusionnée : Citizens
            state.activeStaffTab = 'citizens';
            
            const promises = [
                fetchActiveSession(), 
                fetchPendingApplications(), 
                fetchAllCharacters(), 
                fetchStaffProfiles(), 
                fetchOnDutyStaff(), 
                fetchSecureConfig(),
                fetchEnterprises()
            ];
            
            if(hasPermission('can_manage_economy') || hasPermission('can_manage_illegal')) promises.push(fetchServerStats());
            if(hasPermission('can_manage_illegal')) { promises.push(fetchPendingHeistReviews(), fetchGangs()); }
            await Promise.all(promises);
            await fetchERLCData(); 
        }
    } catch (e) {
        console.error("Panel load error:", e);
        ui.showToast("Erreur de chargement des données.", 'error');
    } finally {
        state.isPanelLoading = false;
        render();
    }
};

export const clearNotifications = async () => {
    if (!state.user || !state.supabase) return;
    ui.showModal({
        title: "Nettoyage du Centre",
        content: "Voulez-vous effacer toutes vos notifications personnelles ? Les annonces globales ne seront pas affectées.",
        confirmText: "Tout effacer",
        type: "danger",
        onConfirm: async () => {
            const { error } = await state.supabase.from('notifications').delete().eq('user_id', state.user.id);
            if (!error) {
                ui.showToast("Flux personnel réinitialisé.", "success");
                await fetchNotifications();
                render();
            } else ui.showToast("Erreur lors de la suppression.", "error");
        }
    });
};

export const deleteNotification = async (id) => {
    if (!state.user || !state.supabase) return;
    const { error = null } = await state.supabase.from('notifications').delete().eq('id', id).eq('user_id', state.user.id);
    if (!error) { await fetchNotifications(); render(); } else ui.showToast("Impossible de supprimer cette entrée.", "error");
};

export const refreshCurrentView = async () => {
    const btn = document.getElementById('refresh-data-btn');
    if(btn) {
        const icon = btn.querySelector('i');
        if(icon) icon.classList.add('animate-spin');
        btn.disabled = true;
    }

    const charId = state.activeCharacter?.id;
    try {
        await fetchSecureConfig();
        if (state.activeHubPanel === 'notifications') await fetchNotifications();
        else if (state.activeHubPanel === 'jobs') await fetchEnterprises();
        else if (state.activeHubPanel === 'assets') { await fetchInventory(charId); await fetchPlayerInvoices(charId); }
        else if (state.activeHubPanel === 'illicit') {
            await fetchActiveGang(charId);
            if (state.activeIllicitTab === 'heists') await fetchAvailableLobbies(charId);
            if (state.activeIllicitTab === 'gangs') await fetchGangs();
            if (state.activeIllicitTab === 'bounties') await fetchBounties();
            if (state.activeIllicitTab === 'market') await fetchBankData(charId);
            if (state.activeIllicitTab === 'drugs' && state.activeGang) await fetchDrugLab(state.activeGang.id);
            await fetchAllReports();
        }
        else if (state.activeHubPanel === 'services') {
            await Promise.all([fetchAllCharacters(), fetchEnterprises(), fetchAllReports(), fetchServerStats(), fetchDailyEconomyStats()]);
            if (state.activeServicesTab === 'map') await fetchERLCData();
            if (state.activeServicesTab === 'dispatch') { await fetchEmergencyCalls(); await fetchGlobalHeists(); }
        }
        else if (state.activeHubPanel === 'staff_list') { await fetchStaffProfiles(); await fetchOnDutyStaff(); }
        else if (state.activeHubPanel === 'lawyers_list') await fetchLawyers();
        else if (state.activeHubPanel === 'enterprise') {
             await fetchDailyEconomyStats();
             if(charId) await fetchBankData(charId); 
             if (state.activeEnterpriseTab === 'market') { await fetchEnterpriseMarket(); await fetchTopSellers(); }
             if (state.activeEnterpriseTab === 'my_companies' && charId) await fetchMyEnterprises(charId);
             if (state.activeEnterpriseTab === 'manage' && state.activeEnterpriseManagement) await fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
        }
        else if (state.activeHubPanel === 'staff') {
            if (state.activeStaffTab === 'citizens') { await fetchPendingApplications(); await fetchAllCharacters(); await fetchEnterprises(); }
            if (state.activeStaffTab === 'economy') { await fetchAllCharacters(); await fetchServerStats(); }
            if (state.activeStaffTab === 'illegal') { await fetchGangs(); await fetchPendingHeistReviews(); await fetchServerStats(); }
            if (state.activeStaffTab === 'sessions' || state.activeStaffTab === 'logs') { await fetchActiveSession(); await fetchERLCData(); await fetchSessionHistory(); }
        }
        ui.showToast("Données actualisées.", 'success');
    } catch(e) { ui.showToast("Erreur lors de l'actualisation.", 'error'); }
    render();
};

export const toggleSidebar = () => {
    state.ui.sidebarOpen = !state.ui.sidebarOpen;
    render();
};
