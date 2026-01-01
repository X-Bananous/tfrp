
import { state } from '../../state.js';

export const BAR_QUESTIONS = [
    { q: "En cas de mandat de perquisition 'No-Knock', quelle condition est impérative ?", a: ["La présence du Maire", "Un risque imminent de destruction de preuves", "L'accord verbal du Procureur uniquement", "Une plainte de voisinage certifiée"], r: 1 },
    { q: "Un citoyen en GAV demande un avocat. Que dit la procédure de police ?", a: ["L'interrogatoire doit s'arrêter immédiatement", "L'interrogatoire continue jusqu'à l'arrivée", "L'avocat n'a pas accès à la salle de GAV", "La GAV est automatiquement annulée"], r: 0 },
    { q: "Quelle est la hiérarchie correcte des normes en Justice TFRP ?", a: ["Réglement de Police > Décret Maire > Constitution", "Constitution > Code Judiciaire > Directive Police", "Maire > Procureur > Juge > Citoyen", "Code Pénal > Code Civil > Code de la Route"], r: 1 },
    { q: "Une saisie bancaire par l'État nécessite :", a: ["Une signature du Chef de Police", "Une décision exécutoire d'un Magistrat", "Un virement de plus de $100,000", "L'accord de l'utilisateur concerné"], r: 1 },
    { q: "L'acquittement pour vice de forme peut être invoqué si :", a: ["L'avocat n'est pas payé", "Le rapport CAD contient une erreur matérielle grave", "Le suspect a un casier vierge", "Le Procureur est absent"], r: 1 },
    { q: "Une réquisition de force publique par un Juge est :", a: ["Une option facultative", "Un ordre impératif aux LEO", "Un document pour le Maire", "Un mandat de dépôt"], r: 1 },
    { q: "La différence majeure entre Vol (Robbery) et Extorsion est :", a: ["Le montant volé", "L'usage immédiat de la force vs menace future", "L'usage d'une arme à feu", "Le nombre de suspects"], r: 1 },
    { q: "Un avocat peut-il être poursuivi pour complicité s'il :", a: ["Conseille légalement un criminel", "Détruit une preuve remise par son client", "Reçoit des honoraires élevés", "Parle à la presse sans accord"], r: 1 },
    { q: "Quel est le délai maximal (RP) d'une détention provisoire avant jugement ?", a: ["15 minutes", "30 minutes", "1 heure", "Durée de la session"], r: 1 },
    { q: "Un mandat d'amener 'subpoena' force un citoyen à :", a: ["Vendre ses actifs", "Témoigner sous serment", "Rejoindre une entreprise", "Payer une amende immédiatement"], r: 1 },
    { q: "La 'Légitime Défense' est caduque si :", a: ["L'agresseur a une arme factice", "La riposte intervient après la fin de l'attaque", "La victime est membre d'un gang", "Le suspect n'a pas appelé le 911"], r: 1 },
    { q: "Le Procureur peut-il augmenter une amende rédigée par un LEO ?", a: ["Non, c'est impossible", "Oui, s'il juge la sanction disproportionnée", "Seulement si le Maire accepte", "Seulement pour les délits routiers"], r: 1 },
    { q: "Une pièce à conviction 'Inadmissible' est une preuve :", a: ["Trop ancienne", "Obtenue illégalement par la police", "De source anonyme", "Perdue par l'officier"], r: 1 },
    { q: "Le Juge de Siège tranche selon :", a: ["Son intime conviction et le Code Judiciaire", "L'opinion des citoyens sur le Discord", "Les ordres directs de la Fondation", "Le montant des dommages et intérêts"], r: 0 },
    { q: "L'outrage à magistrat se différencie de l'outrage à agent par :", a: ["Le montant de l'amende uniquement", "La portée symbolique envers l'Institution", "La peine de prison obligatoire", "Le lieu de l'incident"], r: 1 }
];

export const LawyerExamView = () => {
    const char = state.activeCharacter;
    const lastAttempt = char.last_bar_attempt ? new Date(char.last_bar_attempt) : null;
    const now = new Date();
    
    // Cooldown de 2 heures
    const cooldownMs = 2 * 60 * 60 * 1000;
    if (lastAttempt && (now - lastAttempt < cooldownMs)) {
        const remaining = cooldownMs - (now - lastAttempt);
        const mins = Math.ceil(remaining / 60000);
        return `
            <div class="h-full flex items-center justify-center p-8 animate-fade-in relative z-50">
                <div class="glass-panel max-w-lg w-full p-10 rounded-[40px] border-orange-500/30 text-center shadow-2xl">
                    <div class="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-orange-500 border border-orange-500/20 shadow-lg">
                        <i data-lucide="clock" class="w-10 h-10 animate-pulse"></i>
                    </div>
                    <h2 class="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Échec de Procédure</h2>
                    <p class="text-gray-400 mb-8 leading-relaxed font-medium">
                        Le Conseil de l'Ordre a gelé le dossier de <b>${char.first_name}</b> suite à une prestation insuffisante. L'accès aux tribunaux est suspendu.
                    </p>
                    <div class="bg-black/30 p-6 rounded-2xl border border-white/5 mb-8">
                        <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Ré-ouverture du registre dans</div>
                        <div class="text-3xl font-mono font-bold text-orange-400">${mins} minutes</div>
                    </div>
                    <button onclick="actions.refreshCurrentView()" class="glass-btn w-full py-4 rounded-2xl font-black uppercase tracking-widest cursor-pointer relative z-[60]">Vérifier Éligibilité</button>
                </div>
            </div>
        `;
    }

    if (state.activeExam) {
        const q = state.activeExam.questions[state.activeExam.currentIndex];
        const progress = ((state.activeExam.currentIndex + 1) / state.activeExam.questions.length) * 100;

        return `
            <div class="h-full flex items-center justify-center p-4 animate-fade-in relative z-50">
                <div class="glass-panel max-w-2xl w-full p-8 rounded-[40px] border-blue-500/30 shadow-2xl relative overflow-hidden">
                    <!-- TIMER BAR -->
                    <div id="exam-timer-bar" class="absolute top-0 left-0 h-1.5 bg-blue-500 transition-all duration-1000 ease-linear shadow-lg" style="width: 100%"></div>
                    
                    <div class="flex justify-between items-center mb-8">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-black text-xs border border-blue-500/30">
                                <i data-lucide="timer" class="w-4 h-4"></i>
                            </div>
                            <span id="exam-timer-seconds" class="font-mono text-xl font-black text-white tracking-tighter">30s</span>
                        </div>
                        <div class="text-xs font-mono text-gray-500 uppercase font-bold tracking-widest">Question ${state.activeExam.currentIndex + 1} / 15</div>
                    </div>

                    <h3 class="text-2xl font-black text-white mb-10 leading-tight italic">"${q.q}"</h3>

                    <div class="grid grid-cols-1 gap-4 mb-10">
                        ${q.a.map((ans, idx) => `
                            <button onclick="actions.answerExamQuestion(${idx})" class="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-blue-600/20 hover:border-blue-500/50 text-left transition-all group flex items-center gap-4 cursor-pointer relative z-[60]">
                                <div class="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-xs font-black text-gray-500 group-hover:text-blue-400 border border-white/5">${String.fromCharCode(65 + idx)}</div>
                                <div class="text-sm font-bold text-gray-300 group-hover:text-white">${ans}</div>
                            </button>
                        `).join('')}
                    </div>

                    <div class="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-center">
                         <p class="text-[9px] text-red-400 font-black uppercase tracking-[0.2em] italic">Ne tentez pas de quitter cette page • Déconnexion = Échec Immédiat</p>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="h-full flex items-center justify-center p-8 animate-fade-in relative z-50">
            <div class="glass-panel max-w-xl w-full p-12 rounded-[48px] border-blue-500/20 text-center relative overflow-hidden shadow-2xl">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.1),transparent_70%)]"></div>
                <div class="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-400 border border-blue-500/20 shadow-2xl rotate-3">
                    <i data-lucide="scale" class="w-12 h-12"></i>
                </div>
                <h2 class="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic drop-shadow-2xl">Le Barreau de L.A.</h2>
                <p class="text-gray-400 mb-10 leading-relaxed font-medium">
                    Citoyen <b>${char.first_name}</b>, vous vous présentez devant le Conseil de l'Ordre. <br>L'accès à la Magistrature est un privilège technique exigeant.
                </p>
                
                <div class="bg-black/30 p-8 rounded-3xl border border-white/5 text-left mb-10 space-y-4">
                    <div class="flex items-center gap-4 text-xs font-bold text-gray-300"><i data-lucide="zap" class="w-5 h-5 text-yellow-500"></i> <span class="uppercase tracking-widest">Chrono : 30 secondes / question</span></div>
                    <div class="flex items-center gap-4 text-xs font-bold text-gray-300"><i data-lucide="target" class="w-5 h-5 text-blue-500"></i> <span class="uppercase tracking-widest">Précision requise : 13 / 15</span></div>
                    <div class="flex items-center gap-4 text-xs font-bold text-gray-300"><i data-lucide="shield-alert" class="w-5 h-5 text-red-500"></i> <span class="uppercase tracking-widest">Sortie de zone = Échec définitif</span></div>
                </div>

                <button onclick="actions.startBarExam()" class="glass-btn w-full py-5 rounded-3xl font-black text-xl uppercase tracking-[0.3em] shadow-blue-900/30 cursor-pointer relative z-[100] hover:scale-[1.02] active:scale-95 transition-all">
                    OUVRIR LE DOSSIER
                </button>
            </div>
        </div>
    `;
};
