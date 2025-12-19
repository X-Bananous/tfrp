import { state } from '../state.js';
import { render } from '../utils.js';
import { ui } from '../ui.js';

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