import { state } from '../state.js';
import { router } from '../utils.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-blue-900/10 border-b border-blue-500/10 gap-3 shrink-0 relative">
        <div class="text-xs text-blue-200 flex items-center gap-2">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </div>
            <span><span class="font-bold">CAD SYSTEM</span> • Protection des Données Certifiée</span>
        </div>
        <button onclick="window.location.reload()" class="text-xs text-blue-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser
        </button>
    </div>
`;

const TERMS_CONTENT = `
    <div class="space-y-8 text-gray-300 leading-relaxed">
        <section>
            <h3 class="text-xl font-bold text-white mb-3">1. Préambule</h3>
            <p>Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'utilisation de la plateforme web "TFRP Panel" (ci-après "le Site"), mise à disposition de la communauté Team French RolePlay évoluant sur le jeu Emergency Response: Liberty County (Roblox). En accédant à ce Site, vous acceptez sans réserve les présentes conditions.</p>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">2. Accès au Service</h3>
            <p>L'accès au Site est réservé aux membres du serveur Discord officiel TFRP. L'authentification s'effectue via le protocole OAuth2 de Discord. Tout utilisateur ne disposant pas des rôles requis ou ayant été banni de la communauté se verra refuser l'accès.</p>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">3. Règles de Conduite (Roleplay)</h3>
            <p>L'utilisation du Site est indissociable de l'expérience de jeu. Les utilisateurs s'engagent à :</p>
            <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                <li>Ne pas utiliser les informations du Site (Soldes, Emplacements, Casier) pour faire du "Meta-Gaming" en jeu sans justification RP valable.</li>
                <li>Respecter la cohérence de leur personnage lors des transactions bancaires ou de la gestion d'entreprise.</li>
                <li>Ne pas exploiter d'éventuels bugs (duplication d'argent, items) sous peine de bannissement définitif et irrévocable.</li>
            </ul>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">4. Monnaie Virtuelle et Transactions</h3>
            <p>Le Site gère une économie purement virtuelle. L'argent affiché ($) n'a aucune valeur réelle, ne peut être échangé contre des devises réelles (Euros, Dollars, Robux) et reste la propriété exclusive de TFRP dans le cadre du jeu de rôle. L'administration se réserve le droit de réinitialiser (Wipe) l'économie à tout moment pour des raisons d'équilibrage.</p>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">5. Propriété Intellectuelle</h3>
            <p>L'ensemble des éléments graphiques, du code source et des fonctionnalités du Site sont la propriété de l'équipe de développement TFRP. Toute reproduction, modification ou distribution non autorisée est strictement interdite.</p>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">6. Responsabilité</h3>
            <p>TFRP ne saurait être tenu responsable des interruptions de service, des pertes de données accidentelles ou des conséquences d'une mauvaise utilisation du compte par l'utilisateur. L'utilisateur est seul responsable de la confidentialité de ses accès Discord.</p>
        </section>
    </div>
`;

const PRIVACY_CONTENT = `
    <div class="space-y-8 text-gray-300 leading-relaxed">
        <section>
            <h3 class="text-xl font-bold text-white mb-3">1. Collecte des Données</h3>
            <p>Dans le cadre de votre utilisation du Panel TFRP, nous collectons les informations suivantes via l'API Discord et nos bases de données internes :</p>
            <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                <li><strong>Identité Discord :</strong> ID unique, Nom d'utilisateur, Avatar, Appartenance au serveur (Guilds).</li>
                <li><strong>Données de Jeu :</strong> Personnages créés (Nom, Prénom, Age), Inventaires, Comptes bancaires, Historique des transactions.</li>
                <li><strong>Journaux d'activité :</strong> Logs de connexion, actions administratives, rapports de police.</li>
            </ul>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">2. Finalité du Traitement</h3>
            <p>Ces données sont collectées uniquement pour :</p>
            <ul class="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                <li>Permettre votre authentification et sécuriser l'accès.</li>
                <li>Gérer la persistance de vos données de jeu (Roleplay).</li>
                <li>Assurer la modération et la sécurité de la communauté (lutte contre la triche).</li>
            </ul>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">3. Partage des Données</h3>
            <p>Vos données sont strictement confidentielles et ne sont jamais vendues, louées ou partagées à des tiers commerciaux. Elles sont accessibles uniquement par l'équipe d'administration technique de TFRP dans le cadre strict de la maintenance et de la modération.</p>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">4. Sécurité</h3>
            <p>Nous mettons en œuvre des mesures de sécurité techniques (chiffrement SSL, bases de données sécurisées Supabase) pour protéger vos informations contre tout accès non autorisé.</p>
        </section>

        <section>
            <h3 class="text-xl font-bold text-white mb-3">5. Vos Droits (RGPD)</h3>
            <p>Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification et d'effacement de vos données ("Droit à l'oubli"). Pour exercer ce droit et demander la suppression complète de votre compte joueur, veuillez ouvrir un ticket "Support Technique" sur notre serveur Discord.</p>
        </section>
    </div>
`;

export const TermsView = () => `
    <div class="flex flex-col h-full bg-[#050505] overflow-hidden animate-fade-in relative">
        <!-- Header Block -->
        <div class="flex flex-col shrink-0">
            ${refreshBanner}
            
            <div class="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-[#050505] relative">
                <div>
                    <h1 class="text-2xl font-bold text-white flex items-center gap-3">
                        <i data-lucide="scale" class="w-6 h-6 text-blue-500"></i>
                        Conditions Générales
                    </h1>
                    <p class="text-gray-500 text-xs mt-1 uppercase tracking-widest">Dernière mise à jour : 15/12/2025</p>
                </div>
                <button onclick="actions.goBackFromLegal()" class="glass-btn-secondary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-colors">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 md:px-16 lg:px-32">
            <div class="max-w-4xl mx-auto pb-20">
                ${TERMS_CONTENT}
            </div>
        </div>
    </div>
`;

export const PrivacyView = () => `
    <div class="flex flex-col h-full bg-[#050505] overflow-hidden animate-fade-in relative">
        <!-- Header Block -->
        <div class="flex flex-col shrink-0">
            ${refreshBanner}
            
            <div class="px-8 py-6 flex justify-between items-center border-b border-white/5 bg-[#050505] relative">
                <div>
                    <h1 class="text-2xl font-bold text-white flex items-center gap-3">
                        <i data-lucide="shield-check" class="w-6 h-6 text-emerald-500"></i>
                        Politique de Confidentialité
                    </h1>
                    <p class="text-gray-500 text-xs mt-1 uppercase tracking-widest">Protection des données & RGPD</p>
                </div>
                <button onclick="actions.goBackFromLegal()" class="glass-btn-secondary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-colors">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                </button>
            </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-8 md:px-16 lg:px-32">
            <div class="max-w-4xl mx-auto pb-20">
                ${PRIVACY_CONTENT}
            </div>
        </div>
    </div>
`;