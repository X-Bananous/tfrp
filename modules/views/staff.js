import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { hasPermission } from '../utils.js';

// Sous-vues segmentées
import { StaffCitizensView } from './staff/citizens.js';
import { StaffEconomyView } from './staff/economy.js';
import { StaffIllegalView } from './staff/illegal.js';
import { StaffEnterpriseView } from './staff/enterprise.js';
import { StaffPermissionsView } from './staff/permissions.js';
import { StaffSessionsView } from './staff/sessions.js';
import { StaffLogsView } from './staff/logs.js';
import { StaffSanctionsView } from './staff/sanctions.js';

const refreshBanner = `
    <div class="flex flex-col md:flex-row items-center justify-between px-6 py-3 bg-purple-900/10 border-b border-purple-500/10 gap-3 shrink-0 z-20 relative">
        <div class="text-[10px] text-purple-200 flex items-center gap-2 font-black uppercase tracking-[0.2em]">
             <div class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </div>
            <span><span class="font-bold">Protocol Terminal</span> • Unified Control v4.6.5</span>
        </div>
        <button onclick="actions.refreshCurrentView()" id="refresh-data-btn" class="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-white flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap">
            <i data-lucide="refresh-cw" class="w-3 h-3"></i> Synchroniser Monde
        </button>
    </div>
`;

export const StaffView = () => {
    const isFounder = state.user?.isFounder || state.adminIds.includes(state.user?.id);
    const isInStaffGuild = state.user?.guilds?.includes(CONFIG.GUILD_STAFF);

    // Un fondateur a toujours accès, un staff doit être dans la guild
    if (!isFounder && !isInStaffGuild) {
         return `
            <div class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in bg-[#050505]">
                <div class="glass-panel max-w-md w-full p-10 rounded-[48px] border-purple-500/30 shadow-[0_0_80px_rgba(168,85,247,0.1)] relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent"></div>
                    <div class="w-24 h-24 bg-purple-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-purple-500 border border-purple-500/20 shadow-2xl relative">
                        <i data-lucide="shield-alert" class="w-12 h-12"></i>
                    </div>
                    <h2 class="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Secteur Verrouillé</h2>
                    <p class="text-gray-400 mb-10 leading-relaxed font-medium">L'accès à la console de commandement nécessite une accréditation staff de niveau 4.</p>
                    <a href="${CONFIG.INVITE_STAFF}" target="_blank" class="glass-btn w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-900/40 uppercase tracking-widest italic">
                        <i data-lucide="external-link" class="w-5 h-5"></i>
                        Rejoindre le Réseau Staff
                    </a>
                </div>
            </div>
         `;
    }

    const hasAnyPerm = Object.keys(state.user.permissions || {}).length > 0 || isFounder;
    if (!hasAnyPerm) return `<div class="p-20 text-center text-red-500 font-black uppercase tracking-widest italic animate-pulse">Accès refusé • Violation du protocole d'accréditation</div>`;

    const isOnDuty = state.onDutyStaff?.some(s => s.id === state.user.id);
    const activeTabId = state.activeStaffTab || 'citizens';
    
    const tabMap = {
        citizens: StaffCitizensView,
        economy: StaffEconomyView,
        illegal: StaffIllegalView,
        enterprise: StaffEnterpriseView,
        permissions: StaffPermissionsView,
        sessions: StaffSessionsView,
        logs: StaffLogsView,
        sanctions: StaffSanctionsView
    };

    const content = (tabMap[activeTabId] || StaffCitizensView)();

    const allTabs = [
        { id: 'citizens', label: 'Citoyens', icon: 'users', perm: 'can_manage_characters' },
        { id: 'economy', label: 'Éco', icon: 'coins', perm: 'can_manage_economy' },
        { id: 'illegal', label: 'Illégal', icon: 'skull', perm: 'can_manage_illegal' },
        { id: 'enterprise', label: 'Corp', icon: 'building-2', perm: 'can_manage_enterprises' },
        { id: 'sanctions', label: 'Sanctions', icon: 'shield-alert', perm: 'can_warn' },
        { id: 'permissions', label: 'Perms', icon: 'lock', perm: 'can_manage_staff' },
        { id: 'sessions', label: 'Sessions', icon: 'server', perm: 'can_launch_session' },
        { id: 'logs', label: 'Logs', icon: 'scroll-text', perm: 'can_execute_commands' }
    ].filter(t => hasPermission(t.perm) || isFounder || t.id === 'citizens');

    const MAX_VISIBLE_TABS = 5;
    const visibleTabs = allTabs.slice(0, MAX_VISIBLE_TABS);
    const hiddenTabs = allTabs.slice(MAX_VISIBLE_TABS);
    const isCurrentInHidden = hiddenTabs.some(t => t.id === activeTabId);

    const renderTab = (t) => `
        <button onclick="actions.setStaffTab('${t.id}')" 
            class="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all whitespace-nowrap shrink-0 ${activeTabId === t.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/30 border-purple-500/30 border' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
        </button>
    `;

    return `
        <div class="h-full flex flex-col bg-[#050505] overflow-hidden animate-fade-in relative no-overflow-clipping">
            ${refreshBanner}
            
            <div class="px-8 pb-4 pt-6 flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 bg-[#050505] shrink-0 relative z-30">
                <div>
                    <h2 class="text-3xl font-black text-white flex items-center gap-4 uppercase italic tracking-tighter">
                        <i data-lucide="shield-alert" class="w-8 h-8 text-purple-500"></i>
                        Console Staff
                    </h2>
                    <div class="flex items-center gap-3 mt-1">
                         <span class="text-[10px] text-purple-500/60 font-black uppercase tracking-widest">Protocol OS v4.6.5</span>
                         <span class="w-1.5 h-1.5 bg-gray-800 rounded-full"></span>
                         <span class="text-[10px] text-gray-600 font-black uppercase tracking-widest">${isOnDuty ? 'En Service Actif' : 'Mode Consultation'}</span>
                    </div>
                </div>
                <div class="flex flex-nowrap items-center gap-2 bg-white/5 p-1.5 rounded-2xl max-w-full border border-white/5 shadow-inner">
                    <div class="flex gap-2 items-center">
                        ${visibleTabs.map(t => renderTab(t)).join('')}
                        
                        ${hiddenTabs.length > 0 ? `
                            <div class="relative group h-full flex items-center">
                                <button class="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${isCurrentInHidden ? 'bg-purple-900/40 text-purple-400 border border-purple-500/30' : 'text-gray-500 hover:text-white'}">
                                    <i data-lucide="more-horizontal" class="w-4 h-4"></i> Voir Plus
                                </button>
                                <div class="absolute right-0 top-full pt-2 w-48 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all z-[100]">
                                    <div class="glass-panel border border-white/10 rounded-2xl shadow-2xl flex flex-col p-2 overflow-hidden bg-[#0a0a0c]">
                                        ${hiddenTabs.map(t => `
                                            <button onclick="actions.setStaffTab('${t.id}')" 
                                                class="w-full text-left px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTabId === t.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}">
                                                <i data-lucide="${t.icon}" class="w-3.5 h-3.5"></i> ${t.label}
                                            </button>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="w-px h-6 bg-white/10 mx-2 self-center"></div>
                    
                    ${isOnDuty ? 
                        `<button onclick="actions.confirmToggleDuty(true)" class="px-6 py-2.5 rounded-xl text-[10px] font-black bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-3 uppercase tracking-widest italic shadow-xl"><i data-lucide="user-check" class="w-4 h-4"></i> Live</button>` : 
                        `<button onclick="actions.confirmToggleDuty(false)" class="px-6 py-2.5 rounded-xl text-[10px] font-black bg-white/5 text-gray-500 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center gap-3 uppercase tracking-widest italic"><i data-lucide="user-x" class="w-4 h-4"></i> Offline</button>`
                    }
                </div>
            </div>

            <div class="flex-1 p-8 overflow-y-auto custom-scrollbar relative min-h-0 no-overflow-clipping">
                <div class="h-full">
                    ${content}
                </div>
            </div>
        </div>
    `;
};