import { state } from '../state.js';
import { render } from '../utils.js';
import { ui } from '../ui.js';
import { loadCharacters } from '../services.js';

export const loadUserSanctions = async () => {
    if (!state.user || !state.supabase) return;
    const { data } = await state.supabase.from('sanctions').select('*').eq('user_id', state.user.id).order('created_at', { ascending: false });
    state.userSanctions = data || [];
    render();
};

export const submitSanctionAppeal = async (sanctionId, text) => {
    if (!state.supabase || text.length > 350) return;
    
    const { data: sanction } = await state.supabase.from('sanctions').select('appeal_at').eq('id', sanctionId).single();
    
    // Règle 1 fois par an
    if (sanction?.appeal_at) {
        const lastAppeal = new Date(sanction.appeal_at);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (lastAppeal > oneYearAgo) {
            ui.showToast("Vous ne pouvez contester qu'une fois par an.", "error");
            return;
        }
    }

    const { error } = await state.supabase.from('sanctions').update({
        appeal_text: text,
        appeal_at: new Date().toISOString()
    }).eq('id', sanctionId);

    if (!error) {
        ui.showToast("Contestation envoyée au Conseil.", "success");
        await loadUserSanctions();
    } else {
        ui.showToast("Erreur lors de l'envoi de l'appel.", "error");
    }
};

export const openAppealModal = (sanctionId) => {
    ui.showModal({
        title: "Contester la Sanction",
        content: `
            <div class="space-y-4">
                <p class="text-xs text-gray-400">Exposez vos arguments de façon concise (Max 350 caractères). Cette action est limitée à une fois par an par sanction.</p>
                <textarea id="appeal-text" maxlength="350" class="glass-input w-full p-4 rounded-2xl h-40 text-sm italic" placeholder="Votre défense..."></textarea>
                <div id="char-count" class="text-right text-[10px] text-gray-600 font-mono">0 / 350</div>
            </div>
        `,
        confirmText: "Envoyer l'appel",
        onConfirm: async () => {
            const text = document.getElementById('appeal-text').value;
            if (text.trim().length > 0) {
                await submitSanctionAppeal(sanctionId, text);
            }
        }
    });
    
    setTimeout(() => {
        const area = document.getElementById('appeal-text');
        const counter = document.getElementById('char-count');
        if(area && counter) {
            area.oninput = () => { counter.textContent = `${area.value.length} / 350`; };
        }
    }, 100);
};

export const requestDataDeletion = async () => {
    ui.showModal({
      title: "⚠️ Suppression Définitive",
      content: `
        <div class="space-y-4">
          <p class="text-red-400 font-bold">Cette action supprimera l'intégralité de votre existence sur TFRP.</p>
          <div class="bg-white/5 p-4 rounded-xl border border-white/10 text-xs space-y-2 text-gray-300">
            <p>• <b>Compte :</b> Votre profil et vos accès.</p>
            <p>• <b>Personnages :</b> Toutes vos fiches citoyennes et leur progression.</p>
            <p>• <b>Économie :</b> Vos comptes bancaires, cash et historique de transactions.</p>
            <p>• <b>Social :</b> Vos appartenances aux gangs et entreprises.</p>
            <p>• <b>Inventaire :</b> Tous vos objets possédés.</p>
          </div>
          <p class="text-sm text-gray-400">Conformément au RGPD, vos données seront marquées pour suppression et <b>définitivement effacées dans 3 jours</b>. Vous pouvez annuler cette demande à tout moment avant ce délai.</p>
        </div>
      `,
      confirmText: "Confirmer la demande",
      type: "danger",
      onConfirm: async () => {
        const now = new Date().toISOString();
        const { error } = await state.supabase
          .from('profiles')
          .update({ deletion_requested_at: now })
          .eq('id', state.user.id);
          
        if (!error) {
          state.user.deletion_requested_at = now;
          ui.showToast("Demande de suppression enregistrée.", "warning");
          render();
        } else {
          ui.showToast("Erreur lors de la demande.", "error");
        }
      }
    });
};

export const cancelDataDeletion = async () => {
    const { error } = await state.supabase
      .from('profiles')
      .update({ deletion_requested_at: null })
      .eq('id', state.user.id);
      
    if (!error) {
      state.user.deletion_requested_at = null;
      ui.showToast("Suppression annulée. Vos données sont en sécurité.", "success");
      render();
    } else {
      ui.showToast("Erreur lors de l'annulation.", "error");
    }
};

export const requestCharacterDeletion = async (charId) => {
    const char = state.characters.find(c => c.id === charId);
    if (!char) return;

    ui.showModal({
        title: "Purger l'Identité",
        content: `
            <div class="space-y-4">
                <p class="text-sm text-gray-300">Voulez-vous marquer le dossier de <b>${char.first_name} ${char.last_name}</b> pour suppression ?</p>
                <div class="bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-[10px] text-red-400 uppercase font-black leading-relaxed">
                    Cette action effacera définitivement l'inventaire, le compte en banque et les affiliations de ce personnage dans 3 jours.
                </div>
            </div>
        `,
        confirmText: "Confirmer la purge",
        type: "danger",
        onConfirm: async () => {
            const now = new Date().toISOString();
            const { error } = await state.supabase
                .from('characters')
                .update({ deletion_requested_at: now })
                .eq('id', charId)
                .eq('user_id', state.user.id);

            if (!error) {
                ui.showToast("Demande de suppression envoyée.", "warning");
                await loadCharacters();
                render();
            } else {
                ui.showToast("Erreur système lors de la requête.", "error");
            }
        }
    });
};

export const cancelCharacterDeletion = async (charId) => {
    const { error } = await state.supabase
        .from('characters')
        .update({ deletion_requested_at: null })
        .eq('id', charId)
        .eq('user_id', state.user.id);

    if (!error) {
        ui.showToast("Suppression du personnage annulée.", "success");
        await loadCharacters();
        render();
    } else {
        ui.showToast("Erreur lors de l'annulation.", "error");
    }
};