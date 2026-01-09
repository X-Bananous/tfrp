import { state } from './state.js';

// --- BUTTON LOADER HELPER ---
export const toggleBtnLoading = (btnElement, isLoading, loadingText = 'Chargement...') => {
    if (!btnElement) return;
    
    if (isLoading) {
        btnElement.dataset.originalText = btnElement.innerHTML;
        btnElement.disabled = true;
        btnElement.innerHTML = `
            <div class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            ${loadingText}
        `;
        btnElement.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btnElement.disabled = false;
        btnElement.innerHTML = btnElement.dataset.originalText || 'Action';
        btnElement.classList.remove('opacity-75', 'cursor-not-allowed');
    }
};

// --- TOAST NOTIFICATIONS ---
export const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container') || createToastContainer();
    const id = Date.now();
    
    const colors = {
        info: 'bg-blue-500/20 border-blue-500 text-blue-100',
        success: 'bg-emerald-500/20 border-emerald-500 text-emerald-100',
        error: 'bg-red-500/20 border-red-500 text-red-100',
        warning: 'bg-orange-500/20 border-orange-500 text-orange-100'
    };

    const icon = {
        info: 'info',
        success: 'check-circle',
        error: 'alert-triangle',
        warning: 'alert-circle'
    };

    const toastHtml = `
        <div id="toast-${id}" class="glass-panel p-4 rounded-xl border ${colors[type]} flex items-center gap-3 animate-toast shadow-2xl min-w-[300px]">
            <i data-lucide="${icon[type]}" class="w-5 h-5"></i>
            <span class="text-sm font-medium">${message}</span>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    if(window.lucide) lucide.createIcons();

    setTimeout(() => {
        const el = document.getElementById(`toast-${id}`);
        if(el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            el.style.transition = 'all 0.3s ease';
            setTimeout(() => el.remove(), 300);
        }
    }, 4000);
};

const createToastContainer = () => {
    const div = document.createElement('div');
    div.id = 'toast-container';
    document.body.appendChild(div);
    return div;
};

// --- GENERIC MODAL SYSTEM ---
export const closeModal = () => {
    const modal = document.getElementById('global-modal');
    if(modal) {
        // Sécurité : On ne ferme pas si la modal est marquée comme non-closable
        if (modal.dataset.closable === 'false') return;

        modal.classList.add('opacity-0');
        const panel = modal.querySelector('.glass-panel');
        if(panel) {
            panel.style.transform = 'scale(0.9) translateY(20px)';
            panel.style.opacity = '0';
        }
        setTimeout(() => modal.remove(), 300);
    }
    state.ui.modal.isOpen = false;
};

// Fonction forcée pour les récompenses
export const forceCloseModal = () => {
    const modal = document.getElementById('global-modal');
    if(modal) {
        modal.dataset.closable = 'true';
        closeModal();
    }
};

/**
 * showModal
 * @param {string} title - Titre du modal
 * @param {string} content - Contenu HTML ou texte
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} cancelText - Texte du bouton d'annulation
 * @param {function} onConfirm - Callback de confirmation
 * @param {function} onCancel - Callback d'annulation
 * @param {string} type - 'default', 'danger', 'success', 'warning'
 * @param {boolean} isClosable - Permet de forcer l'affichage sans fermeture possible
 */
export const showModal = ({ title, content, confirmText = 'OK', cancelText = 'Annuler', onConfirm, onCancel, type = 'default', isClosable = true }) => {
    const existing = document.getElementById('global-modal');
    if(existing) existing.remove();

    const themes = {
        default: { icon: 'info', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', btn: 'bg-blue-600 hover:bg-blue-500' },
        danger: { icon: 'shield-alert', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', btn: 'bg-red-600 hover:bg-red-500' },
        success: { icon: 'check-circle', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', btn: 'bg-emerald-600 hover:bg-emerald-500' },
        warning: { icon: 'alert-triangle', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', btn: 'bg-orange-600 hover:bg-orange-500' }
    };

    const theme = themes[type] || themes.default;
    const isConfirmOnly = !onConfirm && !onCancel;

    const html = `
        <div id="global-modal" data-closable="${isClosable}" class="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-enter" style="background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);">
            <div class="absolute inset-0" onclick="${isClosable ? 'ui.closeModal()' : ''}"></div>
            
            <div class="glass-panel w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl modal-enter relative z-10 flex flex-col border ${theme.border}">
                
                <!-- Header Decorative -->
                <div class="h-1.5 w-full ${theme.btn}"></div>

                <div class="p-8">
                    <div class="flex items-start gap-6 mb-6">
                        <div class="w-14 h-14 rounded-2xl ${theme.bg} flex items-center justify-center ${theme.color} shrink-0 border ${theme.border} shadow-inner">
                            <i data-lucide="${theme.icon}" class="w-8 h-8"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <h3 class="text-2xl font-bold text-white mb-1 tracking-tight leading-tight">${title}</h3>
                            <div class="text-xs font-bold uppercase tracking-widest ${theme.color} opacity-80">Notification Système</div>
                        </div>
                        ${isClosable ? `
                            <button onclick="ui.closeModal()" class="text-gray-500 hover:text-white transition-colors p-1">
                                <i data-lucide="x" class="w-6 h-6"></i>
                            </button>
                        ` : ''}
                    </div>

                    <div class="text-gray-300 text-sm leading-relaxed max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 mb-8 font-medium">
                        ${content}
                    </div>

                    <div class="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                        ${(onConfirm || cancelText) && !isConfirmOnly && isClosable ? `
                            <button id="modal-cancel" class="glass-btn-secondary px-8 py-3.5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">
                                ${cancelText}
                            </button>
                        ` : ''}
                        
                        ${confirmText ? `
                            <button id="modal-confirm" class="px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all shadow-lg ${theme.btn} transform active:scale-95">
                                ${confirmText}
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Footer Decorative -->
                <div class="bg-white/5 py-2 px-8 flex justify-between items-center border-t border-white/5">
                    <span class="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Team French Roleplay • Secured</span>
                    <i data-lucide="shield-check" class="w-3 h-3 text-gray-700"></i>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    if(window.lucide) lucide.createIcons();

    const confirmBtn = document.getElementById('modal-confirm');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (onConfirm) onConfirm();
            // On bypass la sécurité pour fermer via le bouton de confirmation interne
            const modal = document.getElementById('global-modal');
            if(modal) modal.dataset.closable = 'true';
            closeModal();
        };
    }

    const cancelBtn = document.getElementById('modal-cancel');
    if (cancelBtn && isClosable) {
        cancelBtn.onclick = () => {
            if (onCancel) onCancel();
            closeModal();
        };
    }

    const handleEsc = (e) => {
        if(e.key === 'Escape' && isClosable) {
            closeModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    if (isClosable) document.addEventListener('keydown', handleEsc);
};

export const ui = {
    toggleBtnLoading,
    showToast,
    showModal,
    closeModal,
    forceCloseModal
};

window.ui = ui;