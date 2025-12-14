
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
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => modal.remove(), 300);
    }
    state.ui.modal.isOpen = false;
};

export const showModal = ({ title, content, confirmText, cancelText, onConfirm, onCancel, type = 'default' }) => {
    const existing = document.getElementById('global-modal');
    if(existing) existing.remove();

    const isConfirm = !!onConfirm;
    
    // Improved mobile responsiveness: max-h-[85vh], flex-col, overflow-y-auto for content
    const html = `
        <div id="global-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 opacity-0">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="ui.closeModal()"></div>
            <div class="glass-panel w-full max-w-md max-h-[85vh] flex flex-col p-6 rounded-2xl relative z-10 transform transition-all scale-95 shadow-2xl">
                <div class="shrink-0 mb-4">
                    <h3 class="text-xl font-bold text-white mb-1">${title || 'Notification'}</h3>
                </div>
                
                <div class="text-gray-300 text-sm leading-relaxed overflow-y-auto custom-scrollbar flex-1 mb-6 pr-2">
                    ${content}
                </div>
                
                <div class="flex justify-end gap-3 shrink-0 pt-2 border-t border-white/5">
                    ${isConfirm || cancelText ? `
                        <button id="modal-cancel" class="glass-btn-secondary px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10">
                            ${cancelText || 'Annuler'}
                        </button>
                    ` : ''}
                    <button id="modal-confirm" class="glass-btn px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${type === 'danger' ? 'bg-red-600 hover:bg-red-500' : ''}">
                        ${confirmText || 'OK'}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    
    requestAnimationFrame(() => {
        const el = document.getElementById('global-modal');
        el.classList.remove('opacity-0');
        el.classList.add('opacity-100');
        el.querySelector('.glass-panel').classList.remove('scale-95');
        el.querySelector('.glass-panel').classList.add('scale-100');
    });

    document.getElementById('modal-confirm').onclick = () => {
        if (onConfirm) onConfirm();
        closeModal();
    };

    if(document.getElementById('modal-cancel')) {
        document.getElementById('modal-cancel').onclick = () => {
            if (onCancel) onCancel();
            closeModal();
        };
    }
};

export const ui = {
    toggleBtnLoading,
    showToast,
    showModal,
    closeModal
};

window.ui = ui;
