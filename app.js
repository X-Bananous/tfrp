

/**
 * TFRP Core Application
 * Entry Point & Aggregator
 */

import { CONFIG } from './modules/config.js';
import { state } from './modules/state.js';
import { router, render } from './modules/utils.js';
import { ui } from './modules/ui.js'; 
import { initSecurity } from './modules/security.js'; // Import Security

// Import Actions
import * as AuthActions from './modules/actions/auth.js';
import * as NavActions from './modules/actions/navigation.js';
import * as CharacterActions from './modules/actions/character.js';
import * as EconomyActions from './modules/actions/economy.js';
import * as IllicitActions from './modules/actions/illicit.js';
import * as ServicesActions from './modules/actions/services.js';
import * as EnterpriseActions from './modules/actions/enterprise.js'; 
import * as StaffActions from './modules/actions/staff.js';

import { setupRealtimeListener, fetchERLCData, fetchActiveHeistLobby, fetchDrugLab, fetchGlobalHeists, fetchOnDutyStaff, loadCharacters, fetchPublicLandingData, fetchActiveSession, fetchMaintenanceStatus, fetchSecureConfig } from './modules/services.js';

// Views
import { LoginView, AccessDeniedView } from './modules/views/login.js';
import { CharacterSelectView } from './modules/views/select.js';
import { CharacterCreateView } from './modules/views/create.js';
import { HubView } from './modules/views/hub.js';
import { TermsView, PrivacyView } from './modules/views/legal.js';
import { MaintenanceView } from './modules/views/maintenance.js';

// --- Combine Actions into Window ---
window.actions = {
    ...AuthActions,
    ...NavActions,
    ...CharacterActions,
    ...EconomyActions,
    ...IllicitActions,
    ...ServicesActions,
    ...StaffActions,
    ...EnterpriseActions
};

// --- FIX: Expose router globally for HTML onclick events ---
window.router = router;

// --- Core Renderer ---
const appRenderer = () => {
    const app = document.getElementById('app');
    if (!app) return;

    let htmlContent = '';
    
    // MAINTENANCE GUARD
    // If maintenance is active AND user is not one of the admins -> Force Maintenance View
    const isAdmin = state.user && state.adminIds.includes(state.user.id);
    const isMaintenance = state.maintenance.isActive;
    
    if (isMaintenance && !isAdmin && state.currentView !== 'login') {
        htmlContent = MaintenanceView();
    } else {
        switch (state.currentView) {
            case 'login': htmlContent = LoginView(); break;
            case 'access_denied': htmlContent = AccessDeniedView(); break;
            case 'select': htmlContent = CharacterSelectView(); break;
            case 'create': htmlContent = CharacterCreateView(); break;
            case 'hub': htmlContent = HubView(); break;
            case 'terms': htmlContent = TermsView(); break;
            case 'privacy': htmlContent = PrivacyView(); break;
            default: htmlContent = LoginView();
        }
    }

    app.innerHTML = htmlContent;
    
    // Inject Bypass Trigger for Admins (Icon only)
    if (state.currentView === 'select' && state.user && state.adminIds.includes(state.user.id)) {
        const header = app.querySelector('.flex.items-center.gap-4');
        if (header) {
             const btn = document.createElement('button');
             btn.onclick = window.actions.openFoundationModal;
             btn.className = 'w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500/20 hover:scale-110 transition-all';
             btn.innerHTML = '<i data-lucide="key" class="w-4 h-4"></i>';
             btn.title = "Accès Fondation";
             header.prepend(btn);
        }
    }

    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
};

// --- AUTO REFRESH LOOP (Polling) ---
const startPolling = () => {
    // 1. FAST LOOP (Timers) - 1s
    setInterval(() => {
        if (!state.user || !state.activeCharacter) return;
        updateActiveTimers();
    }, 1000); 

    // 2. DATA SYNC LOOP (ERLC / Heists) - 15s (Faster to seem responsive)
    setInterval(async () => {
        await fetchMaintenanceStatus(); // Sync Maintenance
        
        if (!state.user) return;
        
        // Sync Session Status Globally and Check for Changes
        const prevSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        await fetchActiveSession();
        const newSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        
        // Force render if session state changed (e.g. Started/Stopped externally)
        if (prevSessionId !== newSessionId) {
            render();
        }

        // Always sync ERLC Data
        await fetchERLCData();
        
        // Sync Hub Data (if active)
        if (state.activeHubPanel === 'main' || state.activeHubPanel === 'services' || state.activeHubPanel === 'staff') {
             await fetchGlobalHeists();
             await fetchOnDutyStaff();
        }
        
        // Sync Illicit Status (if active)
        if (state.activeHubPanel === 'illicit' && state.activeCharacter) {
             await fetchActiveHeistLobby(state.activeCharacter.id);
             await fetchDrugLab(state.activeCharacter.id);
        }
        
        // Only trigger render if strictly necessary or for Queue updates
        const qEl = document.querySelector('.erlc-queue-count');
        if(qEl && state.erlcData.queue) qEl.textContent = state.erlcData.queue.length;
        
    }, 15000);
};

// DOM Timer Updater (No Re-render)
const updateActiveTimers = () => {
    // Heist
    const heistDisplay = document.getElementById('heist-timer-display');
    if (heistDisplay && state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.activeHeistLobby.end_time - now) / 1000));
        
        if (remaining <= 0) {
             if(heistDisplay.textContent !== "00:00") {
                 heistDisplay.textContent = "00:00";
             }
        } else {
            heistDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }

    // Drug
    const drugDisplay = document.getElementById('drug-timer-display');
    if (drugDisplay && state.drugLab && state.drugLab.current_batch) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.drugLab.current_batch.end_time - now) / 1000));
        if (remaining <= 0) {
             if(drugDisplay.textContent !== "00:00") {
                 drugDisplay.textContent = "00:00";
                 render(); // Keep render here as drug UI changes significantly on finish
             }
        } else {
             drugDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }
};

document.addEventListener('render-view', appRenderer);

// --- INIT ---
const initApp = async () => {
    // SECURITY INIT
    initSecurity();

    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (window.supabase) {
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        // FETCH CONFIG FROM DB IMMEDIATELY
        await fetchSecureConfig();
        setupRealtimeListener();
    }

    // Fetch Public Data for Landing Page (before auth)
    await fetchPublicLandingData();
    // Render initially to show login screen data
    if(state.currentView === 'login') render();

    // --- CHECK FOR LEGACY HASH (Specific Test URL Support) ---
    if (window.location.hash && window.location.hash.includes('access_token')) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const legacyToken = params.get('access_token');
        if (legacyToken) {
            // Found a direct Discord token, handle it via Legacy handler
            await handleLegacySession(legacyToken);
            startPolling();
            return;
        }
    }

    // --- STANDARD SUPABASE CHECK ---
    let session = null;
    try {
        const result = await state.supabase.auth.getSession();
        session = result.data.session;
    } catch(err) {
        console.error("Session check failed", err);
    }

    // Listen for Auth Changes (Sign In / Sign Out) - Only for Supabase Flow
    state.supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'SIGNED_IN' && currentSession && !state.user) {
             await handleAuthenticatedSession(currentSession);
        } else if (event === 'SIGNED_OUT') {
             state.user = null;
             router('login');
        }
    });

    if (session) {
        await handleAuthenticatedSession(session);
    } else {
        // Clear loading and show login if no session
        if(loadingScreen && loadingScreen.parentNode) {
            loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen.remove(), 700);
        }
        router('login');
    }

    startPolling();
};

// --- HANDLER: LEGACY DISCORD DIRECT (No Supabase Session) ---
const handleLegacySession = async (token) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');

    try {
        state.accessToken = token;

        // 1. Fetch Discord User
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!userRes.ok) throw new Error('Discord User Fetch Failed (Legacy)');
        const discordUser = await userRes.json();

        // 2. Fetch Guilds
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
             headers: { Authorization: `Bearer ${token}` }
        });
        const guilds = await guildsRes.json();

        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) {
            router('access_denied');
            clearLoad();
            return;
        }

        let isFounder = state.adminIds.includes(discordUser.id);

        // 3. Upsert Profile (Using Anon Key directly)
        await state.supabase.from('profiles').upsert({
            id: discordUser.id,
            username: discordUser.username,
            avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            updated_at: new Date(),
        });

        const { data: profile } = await state.supabase.from('profiles').select('permissions, advent_calendar').eq('id', discordUser.id).maybeSingle();

        // 4. Set App State
        state.user = {
            id: discordUser.id,
            username: discordUser.global_name || discordUser.username,
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null,
            permissions: profile?.permissions || {},
            advent_calendar: profile?.advent_calendar || [], 
            isFounder: isFounder,
            guilds: guilds.map(g => g.id)
        };

        // Clean URL hash
        window.history.replaceState({}, document.title, window.location.pathname);

        await finalizeLoginLogic();

    } catch(e) {
        console.error("Legacy Auth Error", e);
        ui.showToast("Erreur connexion Legacy.", 'error');
        router('login');
    }
    clearLoad();

    function clearLoad() {
        if(loadingScreen && loadingScreen.parentNode) {
            loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen.remove(), 700);
        }
    }
};

// --- HANDLER: SUPABASE OAUTH SESSION ---
const handleAuthenticatedSession = async (session) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
        // The provider token (Discord Access Token) is critical for Guild Verification
        const token = session.provider_token;
        
        if (!token) {
            console.warn("Session found but no provider token (Possible outdated session or missing scope). Re-authenticating.");
            await state.supabase.auth.signOut();
            return;
        }

        state.accessToken = token;
        
        // 1. Fetch Discord User Profile
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRes.status === 401) {
             throw new Error("Token expired");
        }
        if (!userRes.ok) throw new Error('Discord User Fetch Failed');
        const discordUser = await userRes.json();
        
        // 2. Fetch Guilds (Security Check)
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
             headers: { Authorization: `Bearer ${token}` }
        });
        const guilds = await guildsRes.json();
        
        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) {
            router('access_denied');
            if(loadingScreen && loadingScreen.parentNode) {
                loadingScreen.style.opacity = '0';
                appEl.classList.remove('opacity-0');
                setTimeout(() => loadingScreen.remove(), 700);
            }
            return;
        }

        let isFounder = state.adminIds.includes(discordUser.id);
        
        // 3. Upsert Profile
        await state.supabase.from('profiles').upsert({
            id: discordUser.id,
            username: discordUser.username,
            avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            updated_at: new Date(),
        });

        const { data: profile } = await state.supabase.from('profiles').select('permissions, advent_calendar').eq('id', discordUser.id).maybeSingle();

        // 4. Set App State
        state.user = {
            id: discordUser.id,
            username: discordUser.global_name || discordUser.username,
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null,
            permissions: profile?.permissions || {},
            advent_calendar: profile?.advent_calendar || [], 
            isFounder: isFounder,
            guilds: guilds.map(g => g.id)
        };

        await finalizeLoginLogic();

    } catch (e) {
        console.error("Auth Error:", e);
        // If critical error, force logout to reset state
        await window.actions.logout();
    }
    
    // Remove loading screen
    if(loadingScreen && loadingScreen.parentNode) {
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0');
        setTimeout(() => loadingScreen.remove(), 700);
    }
};

// Shared Logic between Legacy & Supabase Auth Flow
const finalizeLoginLogic = async () => {
    await loadCharacters();
    await fetchActiveSession();
    await fetchMaintenanceStatus(); // Fetch Maintenance State

    // 5. Restore Session View Logic
    const savedView = sessionStorage.getItem('tfrp_current_view');
    const savedCharId = sessionStorage.getItem('tfrp_active_char');
    const savedPanel = sessionStorage.getItem('tfrp_hub_panel');

    // Only auto-login to character if we actually found characters
    if (savedView === 'hub' && savedCharId) {
        const char = state.characters.find(c => c.id === savedCharId);
        if (char) {
            state.activeCharacter = char;
            state.alignmentModalShown = true; 
            
            if (savedPanel) {
                await window.actions.setHubPanel(savedPanel); 
            } else {
                router('hub');
            }
        } else {
            router(state.characters.length > 0 ? 'select' : 'create');
        }
    } else {
        router(state.characters.length > 0 ? 'select' : 'create');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}