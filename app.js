
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

import { setupRealtimeListener, fetchERLCData, fetchActiveHeistLobby, fetchDrugLab, fetchGlobalHeists, fetchOnDutyStaff, loadCharacters, fetchPublicLandingData, fetchActiveSession, fetchMaintenanceStatus, fetchSecureConfig, fetchActiveGang } from './modules/services.js';

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

window.router = router;

// --- Core Renderer ---
const appRenderer = () => {
    const app = document.getElementById('app');
    if (!app) return;

    let htmlContent = '';
    
    const isAdmin = state.user && state.adminIds.includes(state.user.id);
    const isMaintenance = state.maintenance.isActive;
    
    if (isMaintenance && !isAdmin) {
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

// --- AUTO REFRESH LOOP ---
const startPolling = () => {
    setInterval(() => {
        updateActiveTimers();
    }, 1000); 

    setInterval(async () => {
        await fetchMaintenanceStatus(); 
        
        if (state.maintenance.isActive && state.user && !state.adminIds.includes(state.user.id)) {
            render();
            return;
        }

        if (!state.user) return;
        
        const prevSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        await fetchActiveSession();
        const newSessionId = state.activeGameSession ? state.activeGameSession.id : null;
        
        if (prevSessionId !== newSessionId) {
            render();
        }

        await fetchERLCData();
        
        if (state.activeHubPanel === 'main' || state.activeHubPanel === 'services' || state.activeHubPanel === 'staff') {
             await fetchGlobalHeists();
             await fetchOnDutyStaff();
        }
        
        if (state.activeHubPanel === 'illicit' && state.activeCharacter) {
             await fetchActiveHeistLobby(state.activeCharacter.id);
             await fetchActiveGang(state.activeCharacter.id);
             if (state.activeGang) {
                 await fetchDrugLab(state.activeGang.id);
             }
        }
        
        const qEl = document.querySelector('.erlc-queue-count');
        if(qEl && state.erlcData.queue) qEl.textContent = state.erlcData.queue.length;
        
    }, 15000);
};

const updateActiveTimers = () => {
    const maintenanceDisplay = document.getElementById('maintenance-timer');
    if (maintenanceDisplay && state.maintenance.isActive && state.maintenance.endTime) {
        const now = Date.now();
        const end = new Date(state.maintenance.endTime).getTime();
        const diff = end - now;
        
        if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            maintenanceDisplay.textContent = `${h}h ${m}m ${s}s`;
        } else {
            maintenanceDisplay.textContent = "Finalisation...";
        }
    }

    if (!state.user || !state.activeCharacter) return;

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

    const drugDisplay = document.getElementById('drug-timer-display');
    if (drugDisplay && state.drugLab && state.drugLab.current_batch) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.drugLab.current_batch.end_time - now) / 1000));
        if (remaining <= 0) {
             if(drugDisplay.textContent !== "00:00") {
                 drugDisplay.textContent = "00:00";
                 render(); 
             }
        } else {
             drugDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }
};

document.addEventListener('render-view', appRenderer);

const initApp = async () => {
    initSecurity();
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    setTimeout(() => {
        if(loadingScreen && loadingScreen.parentNode) {
            console.warn("Safety Timeout: Forcing loading screen removal.");
            loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen.remove(), 700);
        }
    }, 12000);
    
    if (window.supabase) {
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        try {
            await fetchMaintenanceStatus();
            if (state.maintenance.isActive) {
                const { data: { session } } = await state.supabase.auth.getSession();
                let isAdmin = false;
                if (session) {
                    try {
                        await fetchSecureConfig(); 
                        if (state.adminIds.includes(session.user.id)) {
                            isAdmin = true;
                        }
                    } catch(e) { console.warn("Admin check failed during maintenance init"); }
                }
                if (!isAdmin) {
                    if(appEl) {
                        appEl.innerHTML = MaintenanceView();
                        appEl.classList.remove('opacity-0');
                        if(window.lucide) lucide.createIcons();
                    }
                    if(loadingScreen) loadingScreen.remove();
                    setInterval(() => updateActiveTimers(), 1000);
                    return; 
                }
            }
        } catch (err) { console.error("Maintenance Check Failed:", err); }
        await fetchSecureConfig();
        setupRealtimeListener();
    }

    const hasDevAccess = sessionStorage.getItem('tfrp_dev_access') === 'true';

    if (window.location.href.includes("x-bananous.github.io/TFRP-TEST/") && !hasDevAccess) {
        const checkDevCode = () => {
            const input = document.getElementById('dev-code-input');
            if (input && input.value === state.devKey) {
                sessionStorage.setItem('tfrp_dev_access', 'true');
                document.getElementById('dev-protection-layer').remove();
                proceedInit();
            } else {
                if(input) { input.classList.add('border-red-500', 'text-red-500'); input.value = ''; input.placeholder = 'Code Invalide'; }
            }
        };

        const protectionHtml = `
            <div id="dev-protection-layer" class="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center">
                <div class="glass-panel p-8 rounded-2xl max-w-sm w-full text-center border-yellow-500/20 shadow-2xl">
                    <div class="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-500 animate-pulse">
                        <i data-lucide="flask-conical" class="w-8 h-8"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">Version Développeur</h2>
                    <p class="text-gray-400 text-sm mb-6">Environnement de test restreint.</p>
                    <input type="password" id="dev-code-input" class="glass-input w-full p-3 rounded-xl text-center tracking-widest mb-4 font-mono text-lg" placeholder="ACCESS CODE" autofocus>
                    <button id="dev-submit-btn" class="glass-btn w-full py-3 rounded-xl font-bold text-sm">Valider</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', protectionHtml);
        if(window.lucide) lucide.createIcons();
        document.getElementById('dev-submit-btn').onclick = checkDevCode;
        document.getElementById('dev-code-input').onkeydown = (e) => { if(e.key === 'Enter') checkDevCode(); };
        if(loadingScreen) loadingScreen.style.opacity = '0';
        return; 
    } else { proceedInit(); }

    async function proceedInit() {
        await fetchPublicLandingData();
        if(state.currentView === 'login') render();
        if (window.location.hash && window.location.hash.includes('access_token')) {
            const params = new URLSearchParams(window.location.hash.substring(1));
            const legacyToken = params.get('access_token');
            if (legacyToken) {
                await handleLegacySession(legacyToken);
                startPolling();
                return;
            }
        }
        let session = null;
        try {
            const result = await state.supabase.auth.getSession();
            session = result.data.session;
        } catch(err) { console.error("Session check failed", err); }
        state.supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (event === 'SIGNED_IN' && currentSession && !state.user) {
                 await handleAuthenticatedSession(currentSession);
            } else if (event === 'SIGNED_OUT') {
                 state.user = null;
                 router('login');
            }
        });
        if (session) { await handleAuthenticatedSession(session); } else {
            if(loadingScreen && loadingScreen.parentNode) {
                loadingScreen.style.opacity = '0';
                appEl.classList.remove('opacity-0');
                setTimeout(() => loadingScreen.remove(), 700);
            }
            router('login');
        }
        startPolling();
    }
};

const handleLegacySession = async (token) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    try {
        state.accessToken = token;
        const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } });
        if (!userRes.ok) throw new Error('Discord User Fetch Failed (Legacy)');
        const discordUser = await userRes.json();
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` } });
        const guilds = await guildsRes.json();
        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) { router('access_denied'); clearLoad(); return; }
        let isFounder = state.adminIds.includes(discordUser.id);
        await state.supabase.from('profiles').upsert({ id: discordUser.id, username: discordUser.username, avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, updated_at: new Date() });
        const { data: profile } = await state.supabase.from('profiles').select('permissions, advent_calendar').eq('id', discordUser.id).maybeSingle();
        state.user = { id: discordUser.id, username: discordUser.global_name || discordUser.username, avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null, permissions: profile?.permissions || {}, advent_calendar: profile?.advent_calendar || [], isFounder: isFounder, guilds: guilds.map(g => g.id) };
        window.history.replaceState({}, document.title, window.location.pathname);
        await finalizeLoginLogic();
    } catch(e) { console.error("Legacy Auth Error", e); ui.showToast("Erreur connexion Legacy.", 'error'); router('login'); }
    clearLoad();
    function clearLoad() { if(loadingScreen && loadingScreen.parentNode) { loadingScreen.style.opacity = '0'; appEl.classList.remove('opacity-0'); setTimeout(() => loadingScreen.remove(), 700); } }
};

const handleAuthenticatedSession = async (session) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    try {
        const token = session.provider_token;
        if (!token) { await state.supabase.auth.signOut(); return; }
        state.accessToken = token;
        const userRes = await fetch('https://discord.com/api/users/@me', { headers: { Authorization: `Bearer ${token}` } });
        if (userRes.status === 401) { throw new Error("Token expired"); }
        if (!userRes.ok) throw new Error('Discord User Fetch Failed');
        const discordUser = await userRes.json();
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` } });
        const guilds = await guildsRes.json();
        if (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) {
            router('access_denied');
            if(loadingScreen && loadingScreen.parentNode) { loadingScreen.style.opacity = '0'; appEl.classList.remove('opacity-0'); setTimeout(() => loadingScreen.remove(), 700); }
            return;
        }
        let isFounder = state.adminIds.includes(discordUser.id);
        await state.supabase.from('profiles').upsert({ id: discordUser.id, username: discordUser.username, avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, updated_at: new Date() });
        const { data: profile } = await state.supabase.from('profiles').select('permissions, advent_calendar').eq('id', discordUser.id).maybeSingle();
        state.user = { id: discordUser.id, username: discordUser.global_name || discordUser.username, avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, avatar_decoration: discordUser.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${discordUser.avatar_decoration_data.asset}.png?size=160` : null, permissions: profile?.permissions || {}, advent_calendar: profile?.advent_calendar || [], isFounder: isFounder, guilds: guilds.map(g => g.id) };
        await finalizeLoginLogic();
    } catch (e) { console.error("Auth Error:", e); await window.actions.logout(); }
    if(loadingScreen && loadingScreen.parentNode) { loadingScreen.style.opacity = '0'; appEl.classList.remove('opacity-0'); setTimeout(() => loadingScreen.remove(), 700); }
};

const finalizeLoginLogic = async () => {
    await loadCharacters();
    await fetchActiveSession();
    await fetchMaintenanceStatus();
    const savedView = sessionStorage.getItem('tfrp_current_view');
    const savedCharId = sessionStorage.getItem('tfrp_active_char');
    const savedPanel = sessionStorage.getItem('tfrp_hub_panel');
    if (savedView === 'hub' && savedCharId) {
        const char = state.characters.find(c => c.id === savedCharId);
        if (char) {
            state.activeCharacter = char;
            state.alignmentModalShown = true; 
            if (savedPanel) { await window.actions.setHubPanel(savedPanel); } else { router('hub'); }
        } else { router(state.characters.length > 0 ? 'select' : 'create'); }
    } else { router(state.characters.length > 0 ? 'select' : 'create'); }
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initApp); } else { initApp(); }
