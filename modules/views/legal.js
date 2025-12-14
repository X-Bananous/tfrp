
import { state } from '../state.js';
import { router } from '../utils.js';

// Global variables for Modal access
window.LEGAL_TERMS = `
<div class="text-justify space-y-4">
    <p>En accédant au panel de gestion TFRP, vous acceptez les présentes Conditions Générales d'Utilisation. TFRP est un service tiers lié au jeu Emergency Response: Liberty County sur Roblox.</p>
    
    <h4 class="font-bold text-white mt-4">1. Respect des Règles du Serveur</h4>
    <p>L'utilisation de ce panel doit se faire en stricte conformité avec le règlement intérieur du serveur disponible sur Discord. Tout usage abusif (méta-gaming via les informations du panel, exploitation de bugs, etc.) entraînera un bannissement définitif.</p>

    <h4 class="font-bold text-white mt-4">2. Propriété Intellectuelle</h4>
    <p>Ce panel est la propriété exclusive de l'équipe de développement de TFRP. Toute tentative de copie, de reverse engineering ou d'aspiration de données est interdite.</p>

    <h4 class="font-bold text-white mt-4">3. Achats et Monnaie Virtuelle</h4>
    <p>Toutes les transactions effectuées sur ce site utilisent une monnaie virtuelle fictive sans aucune valeur réelle. Aucun remboursement en argent réel n'est possible.</p>

    <h4 class="font-bold text-white mt-4">4. Responsabilité</h4>
    <p>L'équipe TFRP ne saurait être tenue responsable des pertes de données liées à des pannes, des maintenances ou des suppressions de compte suite à des sanctions administratives.</p>
</div>
`;

window.LEGAL_PRIVACY = `
<div class="text-justify space-y-4">
    <p>Nous accordons une importance capitale à la confidentialité de vos données.</p>

    <h4 class="font-bold text-white mt-4">1. Données Collectées</h4>
    <ul class="list-disc pl-5 space-y-1">
        <li>Identifiant Discord (ID, Pseudo, Avatar) pour l'authentification.</li>
        <li>Données de jeu (Personnages, Inventaire, Banque).</li>
        <li>Logs d'activité (Transactions, Actions Staff) à des fins de modération.</li>
    </ul>

    <h4 class="font-bold text-white mt-4">2. Stockage et Sécurité</h4>
    <p>Vos données sont stockées sur des serveurs sécurisés (Supabase). Nous ne partageons vos informations avec aucun tiers commercial.</p>

    <h4 class="font-bold text-white mt-4">3. Droits de l'Utilisateur</h4>
    <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit (suppression complète de vos fiches personnages et logs), veuillez ouvrir un ticket sur notre Discord.</p>
</div>
`;

const goBack = () => {
    if (state.user) {
        // If logged in, go back to Hub or Select depending on context
        if (state.activeCharacter) {
            if(window.actions) window.actions.setHubPanel('main');
            router('hub');
        } else {
            router('select');
        }
    } else {
        router('login');
    }
};

export const TermsView = () => `
    <div class="flex flex-col h-full bg-[#050505] overflow-hidden animate-fade-in">
        <div class="p-6 flex justify-between items-center border-b border-white/10">
            <h1 class="text-2xl font-bold text-white">Conditions d'Utilisation</h1>
            <button onclick="actions.backToLanding()" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm">Retour</button>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 max-w-4xl mx-auto text-gray-300 text-sm leading-relaxed">
            ${window.LEGAL_TERMS}
        </div>
    </div>
`;

export const PrivacyView = () => `
    <div class="flex flex-col h-full bg-[#050505] overflow-hidden animate-fade-in">
        <div class="p-6 flex justify-between items-center border-b border-white/10">
            <h1 class="text-2xl font-bold text-white">Politique de Confidentialité</h1>
            <button onclick="actions.backToLanding()" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm">Retour</button>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 max-w-4xl mx-auto text-gray-300 text-sm leading-relaxed">
            ${window.LEGAL_PRIVACY}
        </div>
    </div>
`;
