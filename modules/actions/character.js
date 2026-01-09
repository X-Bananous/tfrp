
import { state } from '../state.js';
import { render, router } from '../utils.js';
import { ui, toggleBtnLoading } from '../ui.js';
import { loadCharacters, adminCreateCharacter } from '../services.js';

export const startEditCharacter = (charId) => {
    const char = state.characters.find(c => c.id === charId);
    if (char) {
        state.editingCharacter = char;
        router('create');
    }
};

export const submitCharacter = async (e) => {
    e.preventDefault();
    const btn = e.submitter;
    toggleBtnLoading(btn, true);

    const data = Object.fromEntries(new FormData(e.target));
    const today = new Date();
    const birthDate = new Date(data.birth_date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    if (age < 13) { 
        ui.showToast('Personnage trop jeune (13 ans minimum).', 'error');
        toggleBtnLoading(btn, false);
        return; 
    }

    // Determine User ID (Self or Admin Target)
    const targetUserId = state.isAdminEditing ? state.adminTargetUserId : state.user.id;

    // Logic for Status and Job preservation
    let status = state.isAdminEditing ? 'accepted' : 'pending';
    let job = 'unemployed';
    let isNotified = false;
    let verifiedBy = null;

    if (state.editingCharacter) {
        const oldChar = state.editingCharacter;
        status = oldChar.status;
        job = oldChar.job;
        isNotified = oldChar.is_notified;
        verifiedBy = oldChar.verifiedby;

        // Reset to pending and clear validator if names changed (Player edit)
        if (!state.isAdminEditing && (data.first_name !== oldChar.first_name || data.last_name !== oldChar.last_name)) {
            status = 'pending';
            isNotified = false;
            verifiedBy = null;
        }

        // Reset job only if alignment changed
        if (data.alignment !== oldChar.alignment) {
            job = 'unemployed';
        }
    }

    const charData = {
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date,
        birth_place: data.birth_place,
        age: age,
        status: status,
        user_id: targetUserId,
        alignment: data.alignment,
        job: job,
        is_notified: state.isAdminEditing ? true : isNotified,
        verifiedby: state.isAdminEditing ? state.user.id : verifiedBy
    };

    let error = null;

    if (state.editingCharacter) {
        // Update existing
        const { error: updateError } = await state.supabase
            .from('characters')
            .update(charData)
            .eq('id', state.editingCharacter.id);
        error = updateError;
    } else {
        // Create new
        const { error: insertError } = await state.supabase
            .from('characters')
            .insert([charData]);
        error = insertError;
    }
    
    toggleBtnLoading(btn, false);

    if (!error) {
        if(state.isAdminEditing) {
            ui.showToast("Personnage créé/modifié avec succès (Admin).", 'success');
            // Reset Admin State
            state.isAdminEditing = false;
            state.adminTargetUserId = null;
            state.editingCharacter = null;
            if(window.actions && window.actions.setHubPanel) window.actions.setHubPanel('staff'); // Return to staff panel
            router('hub');
        } else {
            const msg = state.editingCharacter && status !== 'pending' 
                ? "Dossier mis à jour." 
                : "Dossier transmis pour validation.";
            ui.showToast(msg, 'success');
            state.editingCharacter = null;
            await loadCharacters();
            router('select');
        }
    } else {
        ui.showToast("Erreur lors de l'enregistrement.", 'error');
        console.error(error);
    }
};

export const setAlignment = async (alignment) => {
    const charId = state.activeCharacter.id;
    const updates = { alignment: alignment };
    if(alignment === 'illegal') updates.job = 'unemployed';
    
    await state.supabase.from('characters').update(updates).eq('id', charId);
    state.activeCharacter.alignment = alignment;
    if(alignment === 'illegal') state.activeCharacter.job = 'unemployed';
    
    ui.closeModal();
    render(); 
};

export const deleteCharacter = async (charId) => {
    ui.showModal({
        title: "Suppression Personnage",
        content: "Cette action est irréversible. Toutes les données seront perdues.",
        confirmText: "Supprimer Définitivement",
        type: "danger",
        onConfirm: async () => {
            const { error } = await state.supabase.from('characters').delete().eq('id', charId).eq('user_id', state.user.id);
            if (!error) { 
                ui.showToast("Personnage supprimé.", 'info');
                await loadCharacters(); 
                router('select'); 
            } else {
                ui.showToast("Erreur suppression.", 'error');
            }
        }
    });
};
