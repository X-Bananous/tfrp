/**
 * TFRP Core Application
 * Entry Point & Aggregator
 */

import { CONFIG } from './modules/config.js';
import { state } from './modules/state.js';
import { router, render } from './modules/utils.js';
import { ui } from './modules/ui.js'; 
import { initSecurity } from './modules/security.js';

// Import Actions
import * as AuthActions from './modules/actions/auth.js';
import * as NavActions from './modules/actions/navigation.js';
import * as CharacterActions from './modules/actions/character.js';
import * as EconomyActions from './modules/actions/economy.js';
import * as IllicitActions from './modules/actions/illicit.js';
import * as ServicesActions from './modules/actions/services.js';
import * as EnterpriseActions from './modules/actions/enterprise.js'; 
import * as StaffActions from './modules/actions/staff.js';
import * as ProfileActions from './modules/actions/profile.js';
import * as WheelActions from './modules/actions/wheel.js';

import { setupRealtimeListener, fetchERLCData, fetchActiveHeistLobby, fetchDrugLab, fetchGlobalHeists, fetchOnDutyStaff, loadCharacters, fetchPublicLandingData, fetchActiveSession, fetchSecureConfig, fetchActiveGang, checkAndCompleteDrugBatch, fetchBankData } from './modules/services.js';

// Views
import { LoginView, AccessDeniedView, DeletionPendingView } from './modules/views/login.js';
import { CharacterSelectView } from './modules/views/select.js';
import { CharacterCreateView } from './modules/views/create.js';
import { HubView } from './modules/views/hub.js';
import { TermsView, PrivacyView } from './modules/views/legal.js';
import { WheelView } from './modules/views/wheel.js';

// --- Combine Actions into Window ---
window.actions = {
    ...AuthActions,
    ...NavActions,
    ...CharacterActions,
    ...EconomyActions,
    ...IllicitActions,
    ...ServicesActions,
    ...StaffActions,
    ...EnterpriseActions,
    ...ProfileActions,
    ...WheelActions
};

window.router = router;

/**
 * Cinematic Intro Sequence Improved
 */
const startIntro = async () => {
    if (sessionStorage.getItem('tfrp_intro_played')) return;

    const intro = document.getElementById('intro-screen');
    const phases = [
        document.getElementById('intro-phase-1'),
        document.getElementById('intro-phase-2'),
        document.getElementById('intro-phase-3'),
        document.getElementById('intro-phase-4')
    ];

    if (!intro) return;

    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    const appEl = document.getElementById('app');
    appEl.classList.add('opacity-0', 'pointer-events-none');
    
    intro.classList.remove('opacity-0', 'pointer-events-none');
    intro.style.opacity = '1';
    intro.style.pointerEvents = 'auto';

    await wait(800);

    // Sequence
    for (let i = 0; i < phases.length; i++) {
        if (!phases[i]) continue;
        
        phases[i].classList.add('active');
        await wait(3000); 
        phases[i].classList.remove('active');
        phases[i].style.opacity = '0';
        phases[i].style.filter = 'blur(20px)';
        phases[i].style.transform = 'scale(1.1)';
        await wait(800); 
    }

    // Sortie de l'intro
    intro.style.transition = 'opacity 1.5s ease-out, filter 2s ease-out';
    intro.style.opacity = '0';
    intro.style.filter = 'blur(50px)';
    sessionStorage.setItem('tfrp_intro_played', 'true');
    await wait(1500);
    if (intro.parentNode) intro.remove();
};

/**
 * Update Loading Screen Status
 */
const updateLoadStatus = (msg) => {
    state.loadingStatus = msg;
    const el = document.getElementById('loading-status');
    if (el) el.textContent = msg;
    console.log(`[Boot] ${msg}`);
};

// --- Core Renderer ---
const appRenderer = () => {
    const app = document.getElementById('app');
    if (!app) return;

    let htmlContent = '';
    
    // FORCE DELETION VIEW IF ACCOUNT IS MARKED FOR DELETION
    let effectiveView = state.currentView;
    if (state.user?.deletion_requested_at && effectiveView !== 'login') {
        effectiveView = 'deletion_pending';
    }

    // CHECK FOR BAN
    if (state.user?.isBanned && effectiveView !== 'login') {
        effectiveView = 'banned';
    }

    switch (effectiveView) {
        case 'login': htmlContent = LoginView(); break;
        case 'deletion_pending': htmlContent = DeletionPendingView(); break;
        case 'access_denied': htmlContent = AccessDeniedView(); break;
        case 'select': htmlContent = CharacterSelectView(); break;
        case 'create': htmlContent = CharacterCreateView(); break;
        case 'hub': htmlContent = HubView(); break;
        case 'terms': htmlContent = TermsView(); break;
        case 'privacy': htmlContent = PrivacyView(); break;
        case 'wheel': htmlContent = WheelView(); break;
        case 'banned': htmlContent = `
            <div class="flex-1 flex items-center justify-center bg-black p-10 text-center h-full">
                <div class="glass-panel p-12 rounded-[48px] border-red-500/30 max-w-lg shadow-2xl animate-fade-in">
                    <div class="w-24 h-24 bg-red-600/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/30">
                        <i data-lucide="shield-off" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Accès Bloqué</h2>
                    <p class="text-gray-400 mb-8 font-medium">Votre accès à la plateforme a été suspendu par le Commandement pour violation grave des règles communautaires.</p>
                    <button onclick="actions.logout()" class="glass-btn-secondary px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 border-red-500/20 hover:bg-red-500/10 transition-all">Quitter le Terminal</button>
                </div>
            </div>
        `; break;
        default: htmlContent = LoginView();
    }

    app.innerHTML = htmlContent;
    
    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
};

// --- AUTO REFRESH LOOP ---
const startPolling = () => {
    setInterval(() => {
        updateActiveTimers();
    }, 1000); 

    setInterval(async () => {
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
                 await checkAndCompleteDrugBatch(state.activeGang.id); 
                 await fetchDrugLab(state.activeGang.id);
             }
        }
        
    }, 15000);
};

const updateActiveTimers = () => {
    if (!state.user || !state.activeCharacter) return;

    const heistDisplay = document.getElementById('heist-timer-display');
    if (heistDisplay && state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.activeHeistLobby.end_time - now) / 1000));
        
        if (remaining <= 0) {
             if(heistDisplay.textContent !== "00:00") heistDisplay.textContent = "00:00";
        } else {
            heistDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }

    const savingsTimer = document.getElementById('bank-savings-timer');
    if (savingsTimer && state.bankAccount) {
        if (!state.bankAccount.taux_int_delivery) {
            savingsTimer.textContent = "Calcul...";
            if (!state._fetchingBank) {
                state._fetchingBank = true;
                fetchBankData(state.activeCharacter.id).finally(() => state._fetchingBank = false);
            }
            return;
        }

        const now = new Date();
        const delivery = new Date(state.bankAccount.taux_int_delivery);
        const diff = delivery - now;

        if (diff <= 0) {
            savingsTimer.textContent = "PRET !";
            savingsTimer.classList.remove('text-blue-400');
            savingsTimer.classList.add('text-emerald-400', 'animate-pulse');
        } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            savingsTimer.textContent = `${days}j ${hours}h`;
            savingsTimer.classList.add('text-blue-400');
            savingsTimer.classList.remove('text-emerald-400', 'animate-pulse');
        }
    }
};

document.addEventListener('render-view', appRenderer);

const initApp = async () => {
    updateLoadStatus("Protocoles de sécurité...");
    initSecurity();
    
    if (window.supabase) {
        updateLoadStatus("Liaison base de données...");
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        await fetchSecureConfig();
        setupRealtimeListener();
    }

    const hasDevAccess = sessionStorage.getItem('tfrp_dev_access') === 'true';

    // Protection par code pour le site de test
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
        return; 
    } else { proceedInit(); }

    async function proceedInit() {
        updateLoadStatus("Synchronisation monde...");
        await fetchPublicLandingData();
        
        // Gestion du jeton Legacy (URL fragment)
        if (window.location.hash && window.location.hash.includes('access_token')) {
            updateLoadStatus("Validation jeton Discord...");
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
                 document.getElementById('app').classList.remove('opacity-0');
            }
        });
        
        if (session) { 
            await handleAuthenticatedSession(session); 
        } else {
            const appEl = document.getElementById('app');
            appEl.classList.remove('opacity-0', 'pointer-events-none');
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
        
        updateLoadStatus(`Bienvenue ${discordUser.global_name || discordUser.username}...`);
        
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${token}` } });
        const guilds = await guildsRes.json();
        
        // On récupère le profil
        const { data: profile } = await state.supabase.from('profiles').select('*').eq('id', discordUser.id).maybeSingle();
        
        const isFounder = state.adminIds.includes(discordUser.id);

        if (!isFounder && (!Array.isArray(guilds) || !guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID))) { 
            router('access_denied'); 
            appEl.classList.remove('opacity-0', 'pointer-events-none'); 
            return; 
        }
        
        await state.supabase.from('profiles').upsert({ id: discordUser.id, username: discordUser.username, avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, updated_at: new Date() });
        
        // CHECK BANS
        let isBanned = false;
        try {
            const { data: bans } = await state.supabase.from('sanctions').select('id').eq('user_id', discordUser.id).eq('type', 'ban').or('expires_at.is.null,expires_at.gt.now()');
            isBanned = bans && bans.length > 0;
        } catch(e) {}

        state.user = { 
            id: discordUser.id, 
            username: discordUser.global_name || discordUser.username, 
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`, 
            permissions: profile?.permissions || {}, 
            deletion_requested_at: profile?.deletion_requested_at || null, 
            whell_turn: profile?.whell_turn || 0,
            isFounder: isFounder, 
            isBanned: isBanned, 
            guilds: Array.isArray(guilds) ? guilds.map(g => g.id) : []
        };
        window.history.replaceState({}, document.title, window.location.pathname);
        
        appEl.classList.add('opacity-0'); 
        await startIntro();
        
        loadingScreen.classList.remove('pointer-events-none');
        loadingScreen.style.opacity = '1';
        await finalizeLoginLogic();
        
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => loadingScreen.remove(), 700);
    } catch(e) { 
        console.error("Legacy Auth Error", e); 
        router('login'); 
        appEl.classList.remove('opacity-0', 'pointer-events-none'); 
    }
};

const handleAuthenticatedSession = async (session) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    try {
        const token = session.provider_token || session.access_token;
        if (!token) { await state.supabase.auth.signOut(); return; }
        state.accessToken = token;
        
        const { data: { user: supabaseUser } } = await state.supabase.auth.getUser();
        if (!supabaseUser) throw new Error("Supabase user not found");

        const discordUser = supabaseUser.user_metadata;
        const discordId = discordUser.provider_id || discordUser.sub;
        
        if (!discordId) throw new Error("Impossible de résoudre l'ID Discord.");

        updateLoadStatus(`Vérification des droits de ${discordUser.full_name || discordUser.username}...`);
        
        // Profiles upsert avec l'ID Discord correct
        await state.supabase.from('profiles').upsert({ 
            id: discordId, 
            username: discordUser.full_name || discordUser.username, 
            avatar_url: discordUser.avatar_url, 
            updated_at: new Date() 
        });

        const { data: profile } = await state.supabase.from('profiles').select('*').eq('id', discordId).maybeSingle();
        const isFounder = state.adminIds.includes(discordId);

        // CHECK BANS
        let isBanned = false;
        try {
            const { data: bans } = await state.supabase.from('sanctions').select('id').eq('user_id', discordId).eq('type', 'ban').or('expires_at.is.null,expires_at.gt.now()');
            isBanned = bans && bans.length > 0;
        } catch(e) {}

        state.user = { 
            id: discordId, 
            username: discordUser.full_name || discordUser.username, 
            avatar: discordUser.avatar_url, 
            permissions: profile?.permissions || {}, 
            deletion_requested_at: profile?.deletion_requested_at || null, 
            whell_turn: profile?.whell_turn || 0,
            isFounder: isFounder, 
            isBanned: isBanned,
            guilds: [] // Guilds will be fetched if needed, or founders bypass
        };
        
        appEl.classList.add('opacity-0', 'pointer-events-none');
        await startIntro();
        
        loadingScreen.classList.remove('pointer-events-none');
        loadingScreen.style.opacity = '1';
        await finalizeLoginLogic();
        
        loadingScreen.style.opacity = '0';
        appEl.classList.remove('opacity-0', 'pointer-events-none');
        appEl.classList.remove('scale-[0.98]');
        setTimeout(() => loadingScreen.remove(), 700);
    } catch (e) { 
        console.error("Auth Error:", e); 
        await window.actions.logout(); 
        appEl.classList.remove('opacity-0', 'pointer-events-none');
    }
};

const finalizeLoginLogic = async () => {
    updateLoadStatus("Lecture des dossiers citoyens...");
    await loadCharacters();
    await fetchActiveSession();
    
    // CHARGER LES SANCTIONS DU JOUEUR
    if (window.actions.loadUserSanctions) {
        try { await window.actions.loadUserSanctions(); } catch(e) {}
    }

    if (state.user.isBanned) {
        state.currentView = 'banned';
        render();
        return;
    }

    if (state.user.deletion_requested_at) {
        state.currentView = 'deletion_pending';
        render();
        return;
    }

    const savedView = sessionStorage.getItem('tfrp_current_view');
    const savedCharId = sessionStorage.getItem('tfrp_active_char');
    const savedPanel = sessionStorage.getItem('tfrp_hub_panel');
    
    if (savedView === 'hub' && savedCharId) {
        const char = state.characters.find(c => c.id === savedCharId);
        if (char && !char.deletion_requested_at) {
            state.activeCharacter = char;
            if (savedPanel) { await window.actions.setHubPanel(savedPanel); } else { router('hub'); }
        } else { router(state.characters.length > 0 ? 'select' : 'create'); }
    } else { 
        router(state.characters.length > 0 ? 'select' : 'create'); 
    }
};

if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', initApp); 
} else { 
    initApp(); 
}