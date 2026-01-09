
import { CONFIG } from '../config.js';
import { state } from '../state.js';

export const CharacterCreateView = () => {
    const isEdit = !!state.editingCharacter;
    const char = state.editingCharacter || {};

    return `
    <div class="flex-1 flex items-center justify-center p-6 animate-fade-in h-full overflow-y-auto custom-scrollbar bg-[#030303] relative overflow-hidden">
        <!-- High Tech Background Elements -->
        <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.1),transparent_70%)] pointer-events-none"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute top-40 right-10 w-px h-64 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent hidden lg:block"></div>

        <div class="glass-panel w-full max-w-3xl p-10 rounded-[48px] relative my-auto border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div class="flex justify-between items-start mb-12 border-b border-white/5 pb-8">
                <div>
                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] border border-blue-500/20 mb-3 rounded-lg">
                        <i data-lucide="file-text" class="w-3 h-3"></i> Immigration v2.4
                    </div>
                    <h2 class="text-4xl font-black text-white uppercase italic tracking-tighter">${isEdit ? 'Dossier de Révision' : 'Dossier d\'Immigration'}</h2>
                    <p class="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Los Angeles Port Authority • Enregistrement Citoyen</p>
                </div>
                <button onclick="actions.cancelCreate()" class="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white border border-white/5 transition-all group">
                    <i data-lucide="x" class="w-6 h-6 group-hover:rotate-90 transition-transform duration-500"></i>
                </button>
            </div>

            <form onsubmit="actions.submitCharacter(event)" class="space-y-10">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-3">
                        <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 block">Prénom(s)</label>
                        <input type="text" name="first_name" value="${char.first_name || ''}" required placeholder="Ex: John" 
                            class="glass-input w-full p-4 rounded-2xl text-base font-bold bg-black/40 border-white/10 focus:border-blue-500/50 uppercase tracking-tight">
                    </div>
                    <div class="space-y-3">
                        <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 block">Nom de famille</label>
                        <input type="text" name="last_name" value="${char.last_name || ''}" required placeholder="Ex: Wick" 
                            class="glass-input w-full p-4 rounded-2xl text-base font-bold bg-black/40 border-white/10 focus:border-blue-500/50 uppercase tracking-tight">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-3">
                        <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 block">Date de naissance</label>
                        <input type="date" name="birth_date" value="${char.birth_date || ''}" required 
                            class="glass-input w-full p-4 rounded-2xl text-sm font-mono bg-black/40 border-white/10 text-gray-300">
                    </div>
                    <div class="space-y-3">
                        <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 block">Lieu de naissance</label>
                        <input type="text" name="birth_place" value="${char.birth_place || 'Los Angeles'}" required placeholder="Ville, Pays" 
                            class="glass-input w-full p-4 rounded-2xl text-sm font-bold bg-black/40 border-white/10 italic">
                    </div>
                </div>

                <!-- ALIGNMENT SELECTION -->
                <div class="space-y-4">
                    <label class="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1 block text-center">Orientation Sociale & Judiciaire</label>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <label class="cursor-pointer group relative">
                            <input type="radio" name="alignment" value="legal" class="peer sr-only" required ${char.alignment !== 'illegal' ? 'checked' : ''}>
                            <div class="p-8 rounded-[32px] bg-black/40 border border-white/5 peer-checked:bg-blue-600/10 peer-checked:border-blue-500 peer-checked:shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:bg-white/5 transition-all text-center h-full relative overflow-hidden">
                                <div class="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl transition-all"></div>
                                <div class="w-16 h-16 mx-auto bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                    <i data-lucide="briefcase" class="w-8 h-8"></i>
                                </div>
                                <div class="font-black text-white text-lg uppercase italic tracking-tight mb-2">Civil / Légal</div>
                                <div class="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">Boulot régulier • Respect des lois • Vie paisible</div>
                            </div>
                        </label>
                        <label class="cursor-pointer group relative">
                            <input type="radio" name="alignment" value="illegal" class="peer sr-only" ${char.alignment === 'illegal' ? 'checked' : ''}>
                            <div class="p-8 rounded-[32px] bg-black/40 border border-white/5 peer-checked:bg-red-600/10 peer-checked:border-red-500 peer-checked:shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:bg-white/5 transition-all text-center h-full relative overflow-hidden">
                                <div class="absolute -right-6 -top-6 w-20 h-20 bg-red-500/5 rounded-full blur-2xl transition-all"></div>
                                <div class="w-16 h-16 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mb-6 border border-red-500/20 group-hover:scale-110 transition-transform">
                                    <i data-lucide="skull" class="w-8 h-8"></i>
                                </div>
                                <div class="font-black text-white text-lg uppercase italic tracking-tight mb-2">Clandestinité</div>
                                <div class="text-[10px] text-gray-500 leading-relaxed font-bold uppercase tracking-widest">Affiliation Gang • Risque élevé • Marché Noir</div>
                            </div>
                        </label>
                    </div>
                </div>
                
                ${isEdit ? `
                    <div class="bg-orange-600/10 border border-orange-500/30 p-6 rounded-3xl flex gap-5 items-center">
                        <div class="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 shrink-0 border border-orange-500/20 shadow-lg">
                            <i data-lucide="alert-triangle" class="w-6 h-6"></i>
                        </div>
                        <p class="text-[11px] text-orange-200 font-bold uppercase tracking-wide leading-relaxed">Attention: Toute modification d'état civil (Nom/Prénom) réinitialisera votre statut de validation staff pour vérification.</p>
                    </div>
                ` : `
                    <div class="bg-blue-600/5 border border-blue-500/20 p-6 rounded-3xl flex gap-5 items-start">
                        <div class="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20 shadow-lg">
                            <i data-lucide="info" class="w-6 h-6"></i>
                        </div>
                        <p class="text-[11px] text-blue-100/80 font-bold uppercase tracking-wide leading-relaxed">
                            Ce dossier est confidentiel. Une fois validé par les autorités municipales, vous recevrez vos titres de transport et l'accès à votre compte bancaire national.
                        </p>
                    </div>
                `}

                <div class="pt-6 border-t border-white/5 flex justify-end gap-6 items-center">
                    <button type="button" onclick="actions.cancelCreate()" class="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] hover:text-white transition-colors">Annuler le processus</button>
                    <button type="submit" class="glass-btn px-12 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-900/30 transition-all transform hover:scale-[1.02] active:scale-95">
                        <i data-lucide="save" class="w-5 h-5"></i> ${isEdit ? 'RATIFIER LES MODIFICATIONS' : 'TRANSMETTRE LE DOSSIER'}
                    </button>
                </div>
            </form>
        </div>
    </div>
`;
};
