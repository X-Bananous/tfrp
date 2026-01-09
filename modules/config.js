

export const CONFIG = {
    SUPABASE_URL: 'https://nitlrwmgoddqabasavrg.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGxyd21nb2RkcWFiYXNhdnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzg3NTIsImV4cCI6MjA3OTMxNDc1Mn0.Y5BFeTuv-dxLpf9ocqyhaWMLLCwlKf-bPDgpWq0o8oU',
    
    // Discord Configuration
    DISCORD_CLIENT_ID: '1448414660343890083',
    // Dynamic Redirect URI based on current location
    get REDIRECT_URI() {
        return window.location.href.split('#')[0].split('?')[0];
    },
    
    REQUIRED_GUILD_ID: '1279455759414857759', // Main Server
    INVITE_URL: 'https://discord.gg/eBU7KKKGD5',
    
    // Panel Specific Guilds
    GUILD_SERVICES: '1347175880958677033',
    INVITE_SERVICES: 'https://discord.gg/3VgMHakdpG',
    
    GUILD_ILLEGAL: '1445066668018499820',
    INVITE_ILLEGAL: 'https://discord.gg/hGQFkKDQbM',
    
    GUILD_STAFF: '1443636329471672547',
    INVITE_STAFF: 'https://discord.gg/PA3aXTYaB6',
    
    // ERLC Configuration
    ERLC_API_URL: 'https://api.policeroleplay.community/v1/server',
    // KEY removed -> Fetched via Supabase RPC
    
    // Game Rules
    MAX_SLOTS: 42,
    MAX_CHARS: 1, 
    MAX_ENTERPRISES: 2,
    HEIST_COOLDOWN_MINUTES: 5,
    
    // ADMIN_IDS removed -> Fetched via Supabase RPC

    // ERLC Map Street Names
    STREET_NAMES: [
        "Academy Place", "Arbor Lane", "Cedar Street", "Cline Street", "Colonial Drive",
        "Cross Street", "Durham Road", "Elm Street", "Emerson Road", "Fairfax Road",
        "Franklin Court", "Freedom Avenue", "Georgia Avenue", "Gibson Lane", "Grand Avenue",
        "Grant Street", "Highway 55", "Hillview Road", "Independence Parkway", "Industrial Road",
        "Iron Road", "Joyner Road", "Lakeview Court", "Lee Street", "Liberty Way",
        "Madison Court", "Main Street", "Maple Street", "Medical Way", "Northern Way",
        "Oak Valley Drive", "Orchard Boulevard", "Park Street", "Pineview Circle",
        "Riverside Drive", "Sandstone Road", "Southern Avenue", "Spring Creek Road",
        "Terrace Drive", "Valley Drive", "Vine Street", "Wooden Bridge"
    ],
    
};