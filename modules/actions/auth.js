import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { router, render } from '../utils.js';
import { ui } from '../ui.js';
import { loadCharacters } from '../services.js';

export const login = async () => {
    state.isLoggingIn = true;
    render();

    const safetyTimeout = setTimeout(() => {
        if (state.isLoggingIn) {
            state.isLoggingIn = false;
            ui.showToast("Délai d'attente dépassé ou redirection bloquée.", 'warning');
            render();
        }
    }, 8000);

    if (window.location.href.includes("x-bananous.github.io/TFRP-TEST/")) {
        try {
            const redirectUri = encodeURIComponent(CONFIG.REDIRECT_URI);
            const clientId = CONFIG.DISCORD_CLIENT_ID;
            const scope = encodeURIComponent('identify guilds');
            const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
            window.location.assign(url);
            return;
        } catch (e) {
            clearTimeout(safetyTimeout);
            state.isLoggingIn = false;
            ui.showToast("Erreur redirection Legacy.", 'error');
            render();
            return;
        }
    }

    try {
        if (!state.supabase) throw new Error("Service d'authentification non initialisé.");
        const { error } = await state.supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                scopes: 'identify guilds',
                redirectTo: CONFIG.REDIRECT_URI
            }
        });
        if (error) throw error;
    } catch (e) {
        clearTimeout(safetyTimeout);
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
    const isAdmin = state.adminIds.includes(state.user?.id);
    if (!state.user || !isAdmin) return;
    
    state.user.isFounder = true; // Force fondateur pour le bypass
    state.activeCharacter = {
        id: 'STAFF_BYPASS',
        user_id: state.user.id,
        first_name: 'Administrateur',
        last_name: 'Fondation',
        status: 'accepted',
        alignment: 'legal',
        job: 'leo'
    };
    
    if(window.actions && window.actions.setHubPanel) {
        await window.actions.setHubPanel('staff');
    }
    router('hub');
};

export const backToLanding = () => {
    state.activeCharacter = null;
    state.activeHubPanel = 'main';
    state.currentView = 'login';
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
    sessionStorage.clear();
    window.history.replaceState({}, document.title, window.location.pathname);
    router('login');
};