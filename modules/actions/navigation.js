
import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui } from '../ui.js';
import { 
    loadCharacters, fetchBankData, fetchInventory, fetchActiveHeistLobby, 
    fetchGangs, fetchActiveGang, fetchBounties, fetchDrugLab, 
    fetchGlobalHeists, fetchEmergencyCalls, fetchAllCharacters, fetchERLCData, 
    fetchPendingApplications, fetchStaffProfiles, fetchOnDutyStaff, 
    fetchServerStats, fetchPendingHeistReviews, fetchAvailableLobbies,
    fetchActiveSession, fetchSessionHistory, fetchEnterpriseMarket, fetchMyEnterprises, fetchEnterpriseDetails,
    fetchDailyEconomyStats, fetchPlayerInvoices
} from '../services.js';
import { hasPermission } from '../utils.js';

export const backToSelect = async () => {
    state.activeCharacter = null;
    state.bankAccount = null;
    
    // Clean Session Storage for character
    sessionStorage.removeItem('tfrp_active_char');
    sessionStorage.removeItem('tfrp_hub_panel');
    
    if(state.heistTimerInterval) clearInterval(state.heistTimerInterval);
    state.activeHeist = null;
    state.activeHeistLobby = null; 
    await loadCharacters();
    router('select');
};

export const selectCharacter = async (charId) => {
    const char = state.characters.find(c => c.id === charId);
    if (char && char.status === 'accepted') {
        state.activeCharacter = char;
        state.activeHubPanel = 'main';
        state.alignmentModalShown = false; 
        
        // Save to Session
        sessionStorage.setItem('tfrp_active_char', charId);
        
        // Trigger initial data fetch for the Hub before rendering
        state.isPanelLoading = true;
        router('hub'); // Switch view to Hub (will show loader)
        
        try {
             await Promise.all([
                fetchActiveSession(), // Ensure session status is known immediately
                fetchGlobalHeists(),
                fetchERLCData(),
                fetchOnDutyStaff()
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
    // Contextual Back Navigation
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
    state.activeHubPanel = panel;
    
    // Save Panel State
    sessionStorage.setItem('tfrp_hub_panel', panel);
    
    state.isPanelLoading = true; // Show loader
    render(); 
    
    try {
        // --- LAZY DATA LOADING ---
        if (panel === 'main') {
            await Promise.all([
                fetchActiveSession(),
                fetchGlobalHeists(),
                fetchERLCData(),
                fetchOnDutyStaff()
            ]);
        } else if (panel === 'bank' && state.activeCharacter) {
            state.selectedRecipient = null;
            state.filteredRecipients = [];
            await fetchBankData(state.activeCharacter.id);
        } else if (panel === 'assets' && state.activeCharacter) {
            state.inventoryFilter = '';
            // Fetch Inventory AND Invoices immediately
            await Promise.all([
                fetchInventory(state.activeCharacter.id),
                fetchPlayerInvoices(state.activeCharacter.id)
            ]);
        } else if (panel === 'enterprise') {
            // Fetch Market & Economy Stats for the new design
            const promises = [fetchDailyEconomyStats()];
            
            // Ensure Bank Data is fetched for display
            if (state.activeCharacter) {
                promises.push(fetchBankData(state.activeCharacter.id));
            }

            if(state.activeEnterpriseTab === 'market') promises.push(fetchEnterpriseMarket());
            else if(state.activeEnterpriseTab === 'my_companies' && state.activeCharacter) promises.push(fetchMyEnterprises(state.activeCharacter.id));
            
            await Promise.all(promises);

        } else if (panel === 'illicit' && state.activeCharacter) {
            state.activeIllicitTab = 'dashboard'; 
            state.blackMarketSearch = ''; 
            await Promise.all([
                fetchBankData(state.activeCharacter.id),
                fetchActiveGang(state.activeCharacter.id),
                fetchGangs(),
                fetchBounties(),
                fetchActiveHeistLobby(state.activeCharacter.id),
                fetchDrugLab(state.activeCharacter.id),
                fetchAllCharacters() // Needed for Bounty Search suggestions
            ]);
        } else if (panel === 'services' && state.activeCharacter) {
            state.activeServicesTab = 'directory'; // Default to directory for lawyers/police
            // If police, maybe default to dispatch? Keep logic simple.
            if(state.activeCharacter.job === 'leo') state.activeServicesTab = 'dispatch';
            
            state.servicesSearchQuery = '';
            state.reportSuspects = [];
            
            const promises = [
                fetchGlobalHeists(),
                fetchEmergencyCalls()
            ];
            
            // FIX: Load characters for Lawyers too so the directory works
            if(state.activeCharacter.job === 'leo' || state.activeCharacter.job === 'lawyer') {
                promises.push(fetchAllCharacters());
                promises.push(fetchERLCData());
            }
            await Promise.all(promises);
            
        } else if (panel === 'staff_list') {
            await fetchActiveSession();
            await fetchStaffProfiles();
            await fetchOnDutyStaff();
        } else if (panel === 'advent' && state.activeCharacter) {
            await fetchInventory(state.activeCharacter.id);
        } else if (panel === 'staff') {
            state.staffSearchQuery = ''; 
            // Set Default Tab based on Perms
            if (hasPermission('can_approve_characters')) state.activeStaffTab = 'applications';
            else if (hasPermission('can_manage_economy') || hasPermission('can_manage_illegal')) state.activeStaffTab = 'economy';
            else if (hasPermission('can_manage_staff')) state.activeStaffTab = 'permissions';
            else state.activeStaffTab = 'database'; 
            
            // Staff Data Fetch
            const promises = [
                fetchActiveSession(),
                fetchPendingApplications(), 
                fetchAllCharacters(),
                fetchStaffProfiles(),
                fetchOnDutyStaff()
            ];
            if(hasPermission('can_manage_economy') || hasPermission('can_manage_illegal')) {
                promises.push(fetchServerStats());
            }
            if(hasPermission('can_manage_illegal')) {
                promises.push(fetchPendingHeistReviews());
                promises.push(fetchGangs());
            }
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

export const refreshCurrentView = async () => {
    const btn = document.getElementById('refresh-data-btn');
    if(btn) {
        const icon = btn.querySelector('i');
        if(icon) icon.classList.add('animate-spin');
        btn.disabled = true;
    }

    const charId = state.activeCharacter?.id;

    try {
        if (state.activeHubPanel === 'assets') {
            await fetchInventory(charId);
            await fetchPlayerInvoices(charId);
        }
        else if (state.activeHubPanel === 'illicit') {
            if (state.activeIllicitTab === 'heists') await fetchAvailableLobbies(charId);
            if (state.activeIllicitTab === 'gangs') { await fetchGangs(); await fetchActiveGang(charId); }
            if (state.activeIllicitTab === 'bounties') await fetchBounties();
            if (state.activeIllicitTab === 'market') await fetchBankData(charId);
        }
        else if (state.activeHubPanel === 'services') {
            if (state.activeServicesTab === 'directory' || state.activeServicesTab === 'full_reports') await fetchAllCharacters();
            if (state.activeServicesTab === 'map') await fetchERLCData();
            if (state.activeServicesTab === 'dispatch') { await fetchEmergencyCalls(); await fetchGlobalHeists(); }
        }
        else if (state.activeHubPanel === 'staff_list') {
            await fetchStaffProfiles();
            await fetchOnDutyStaff();
        }
        else if (state.activeHubPanel === 'enterprise') {
             await fetchDailyEconomyStats();
             if(charId) await fetchBankData(charId); // Refresh bank too
             if (state.activeEnterpriseTab === 'market') await fetchEnterpriseMarket();
             if (state.activeEnterpriseTab === 'my_companies' && charId) await fetchMyEnterprises(charId);
             if (state.activeEnterpriseTab === 'manage' && state.activeEnterpriseManagement) await fetchEnterpriseDetails(state.activeEnterpriseManagement.id);
        }
        else if (state.activeHubPanel === 'staff') {
            if (state.activeStaffTab === 'applications') await fetchPendingApplications();
            if (state.activeStaffTab === 'database') await fetchAllCharacters();
            if (state.activeStaffTab === 'economy') { await fetchAllCharacters(); await fetchServerStats(); }
            if (state.activeStaffTab === 'illegal') { await fetchGangs(); await fetchPendingHeistReviews(); await fetchServerStats(); }
            if (state.activeStaffTab === 'sessions' || state.activeStaffTab === 'logs') { await fetchActiveSession(); await fetchERLCData(); await fetchSessionHistory(); }
        }
        ui.showToast("Données actualisées.", 'success');
    } catch(e) {
        ui.showToast("Erreur lors de l'actualisation.", 'error');
    }

    render();
};

export const toggleSidebar = () => {
    state.ui.sidebarOpen = !state.ui.sidebarOpen;
    render();
};
