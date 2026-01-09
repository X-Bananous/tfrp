
import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { router, render } from '../utils.js';
import { ui } from '../ui.js';
import { loadCharacters } from '../services.js';

export const login = async () => {
    state.isLoggingIn = true;
    render();

    // Sécurité: Si la redirection échoue ou prend trop de temps, on réactive le bouton après 8 secondes
    // pour éviter que l'utilisateur ne soit bloqué sur "Authentification...".
    const safetyTimeout = setTimeout(() => {
        if (state.isLoggingIn) {
            state.isLoggingIn = false;
            ui.showToast("Délai d'attente dépassé ou redirection bloquée.", 'warning');
            render();
        }
    }, 8000);

    // --- SPECIFIC CONDITION FOR GITHUB TEST PAGE ---
    // Utilisation de l'ancienne méthode (Discord Direct) pour cette URL
    if (window.location.href.includes("x-bananous.github.io/TFRP-TEST/")) {
        try {
            const redirectUri = encodeURIComponent(CONFIG.REDIRECT_URI);
            const clientId = CONFIG.DISCORD_CLIENT_ID;
            const scope = encodeURIComponent('identify guilds');
            // Direct Discord OAuth2 URL (Implicit Grant)
            const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
            
            console.log("Redirection Legacy vers:", url); // Debug
            
            // Force redirection
            window.location.assign(url);
            return;
        } catch (e) {
            clearTimeout(safetyTimeout);
            console.error("Legacy Login Error:", e);
            state.isLoggingIn = false;
            ui.showToast("Erreur redirection Legacy.", 'error');
            render();
            return;
        }
    }

    // --- STANDARD SUPABASE FLOW FOR OTHER ENVIRONMENTS ---
    try {
        if (!state.supabase) {
            throw new Error("Service d'authentification non initialisé.");
        }

        // On laisse le SDK gérer la redirection automatiquement
        const { error } = await state.supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                scopes: 'identify guilds',
                redirectTo: CONFIG.REDIRECT_URI
            }
        });
        
        if (error) throw error;
        
        // La redirection est gérée par Supabase, on attend.
        
    } catch (e) {
        clearTimeout(safetyTimeout);
        console.error("Login Error:", e);
        state.isLoggingIn = false;
        ui.showToast("Erreur connexion: " + (e.message || "Inconnue"), 'error');
        render();
    }
};

export const openFoundationModal = () => {
    if (!state.user || !state.adminIds.includes(state.user.id)) return;

    ui.showModal({
        title: "Accès Fondation",
        content: `
            <div class="text-center">
                <div class="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
                    <i data-lucide="shield-alert" class="w-8 h-8"></i>
                </div>
                <p class="mb-4">Vous êtes sur le point d'utiliser un accès administrateur critique.</p>
                <p class="text-xs text-gray-500 mb-2">Cela chargera le profil 'Fondation'.</p>
            </div>
        `,
        confirmText: "Confirmer l'accès",
        onConfirm: () => bypassLogin()
    });
};

export const bypassLogin = async () => {
    if (!state.user || !state.adminIds.includes(state.user.id)) return;
    
    state.activeCharacter = {
        id: 'STAFF_BYPASS',
        user_id: state.user.id,
        first_name: 'Administrateur',
        last_name: 'Fondation',
        status: 'accepted',
        alignment: 'legal',
        job: 'leo'
    };
    // Naviguer via l'objet window.actions une fois initialisé
    if(window.actions && window.actions.setHubPanel) {
        window.actions.setHubPanel('staff');
    }
    router('hub');
};

export const backToLanding = () => {
    // Clear session state but keep auth
    state.activeCharacter = null;
    state.activeHubPanel = 'main';
    state.currentView = 'login';
    
    // Clear persistence
    sessionStorage.removeItem('tfrp_active_char');
    sessionStorage.removeItem('tfrp_hub_panel');
    sessionStorage.setItem('tfrp_current_view', 'login');
    
    render();
};

export const confirmLogout = () => {
    ui.showModal({
        title: "Retour à l'accueil",
        content: "Voulez-vous retourner à la page d'accueil ou vous déconnecter complètement ?",
        confirmText: "Accueil",
        cancelText: "Déconnexion Totale",
        onConfirm: () => backToLanding(),
        onCancel: () => logout()
    });
};

export const logout = async () => {
    if(state.supabase) await state.supabase.auth.signOut();
    
    state.user = null;
    state.accessToken = null;
    state.characters = [];
    
    // Clear Session
    sessionStorage.clear();
    localStorage.removeItem('tfrp_access_token'); // Cleanup legacy
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    router('login');
};
