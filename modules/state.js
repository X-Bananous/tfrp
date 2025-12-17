

export const state = {
    user: null, 
    accessToken: null,
    
    // SECURE CONFIG FROM DB
    adminIds: [], // Populated from DB keys_data
    erlcKey: null, // Populated from DB keys_data
    devKey: null, // Populated from DB keys_data (Dev Access Code)

    // UI Loading States
    isLoggingIn: false,
    isPanelLoading: false, 
    
    // Maintenance State
    maintenance: {
        isActive: false,
        endTime: null,
        reason: '',
        activatedBy: ''
    },
    
    // Character Data
    characters: [],
    activeCharacter: null, 
    editingCharacter: null, 
    
    // Staff Data
    pendingApplications: [],
    allCharactersAdmin: [],
    staffMembers: [], 
    onDutyStaff: [], 
    discordStatuses: {}, // Map of Discord ID -> Status (online, idle, dnd, offline)
    
    // Game Session Data
    activeGameSession: null,
    sessionHistory: [],

    // Landing Page Data
    landingStaff: [],
    landingStats: {},
    
    // Stats & Monitoring
    serverStats: {
        totalMoney: 0,
        totalCash: 0,
        totalBank: 0,
        totalCoke: 0,
        totalWeed: 0,
        heistWinRate: 100
    },
    globalTransactions: [], // Staff Economy Log
    dailyEconomyStats: [], // Aggregated stats
    pendingHeistReviews: [], 
    
    // ERLC Server Data
    erlcData: {
        players: [],
        queue: [],
        maxPlayers: 42,
        currentPlayers: 0,
        joinKey: '?????',
        bans: [], 
        modCalls: [], 
        vehicles: [], 
        killLogs: [], 
        commandLogs: [] 
    },
    emergencyCalls: [], 
    policeReports: [], 
    
    // Search States
    staffSearchQuery: '', 
    staffPermissionSearchResults: [], 
    activePermissionUserId: null, 
    adminDbSort: { field: 'name', direction: 'asc' }, 
    erlcLogSearch: '', 
    vehicleSearchQuery: '', 
    activeStaffLogTab: 'commands', // commands, kills, modcalls, players, vehicles
    
    // Gang Creation & Editing
    gangCreation: {
        leaderQuery: '',
        coLeaderQuery: '',
        leaderResult: null, 
        coLeaderResult: null, 
        searchResults: [],
        draftName: '' 
    },
    editingGang: null, 

    // Modals & UI
    ui: {
        modal: { isOpen: false, type: null, data: null }, 
        toasts: [],
        sidebarOpen: false // Mobile Sidebar State
    },

    economyModal: { 
        isOpen: false,
        targetId: null, 
        targetName: null
    },

    inventoryModal: {
        isOpen: false,
        targetId: null,
        targetName: null,
        items: []
    },
    
    // Economy
    bankAccount: null,
    transactions: [],
    recipientList: [], 
    filteredRecipients: [], 
    selectedRecipient: null,
    activeBankTab: 'overview', 
    
    // Assets
    inventory: [],
    patrimonyTotal: 0,
    inventoryFilter: '', 
    idCardModalOpen: false, 
    activeDocumentType: 'id_card', // id_card, driver_license, credit_card
    idCardTarget: null,
    activeAssetsTab: 'overview', 
    invoices: [], // Player invoices
    
    // Illicit
    activeIllicitTab: 'dashboard', 
    activeHeistLobby: null, 
    heistMembers: [], 
    availableHeistLobbies: [], 
    blackMarketSearch: '', 
    drugLab: null, 
    
    // Gangs & Bounties
    gangs: [], 
    activeGang: null, 
    bounties: [],
    bountySearchQuery: '',
    bountyTarget: null,
    bountyWinnerSearch: {
        query: '',
        results: [],
        selected: null,
        bountyId: null
    },
    
    // Enterprises (NEW)
    activeEnterpriseTab: 'market', // market, my_companies, manage, appointments
    activeEnterpriseManageTab: 'dashboard', // dashboard, staff, stock, appointments (NEW)
    enterprises: [],
    myEnterprises: [], // Companies I am part of
    enterpriseMarket: [], // Items for sale (public)
    topSellers: [], // Best selling items
    pendingEnterpriseItems: [], // Staff moderation
    activeEnterpriseManagement: null, // The specific company being managed in UI
    marketEnterpriseFilter: 'all', // Filter for market view
    clientAppointments: [], // Appointments where I am the client
    
    // Enterprise Item Creation
    iconPickerOpen: false,
    selectedCreateIcon: 'package',
    iconSearchQuery: '',

    // Services Publics
    activeServicesTab: 'directory', 
    filteredStreets: [], 
    servicesSearchQuery: '', 
    reportsSearchQuery: '', 
    reportSuspects: [],
    criminalRecordTarget: null, 
    criminalRecordReports: [],
    policeSearchTarget: null,
    dossierTarget: null, // For LEO Citizen Dossier
    
    // Global News
    globalActiveHeists: [], 
    
    // App Navigation
    currentView: 'login', 
    activeHubPanel: 'main', 
    activeStaffTab: 'applications',
    activeEconomySubTab: 'players', // New sub-tab for economy
    alignmentModalShown: false, 
    
    supabase: null,
    queueCount: 0
};