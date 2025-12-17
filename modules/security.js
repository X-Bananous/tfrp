
import { ui } from './ui.js';

export const initSecurity = async () => {
    // 1. DISABLE INSPECT ELEMENT & RIGHT CLICK
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    document.addEventListener('keydown', (e) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || 
            (e.ctrlKey && e.key === 'U')
        ) {
            e.preventDefault();
            return false;
        }
    });

    // Debugger Loop Trick (Freezes inspector if opened)
    setInterval(() => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            document.body.innerHTML = '<div style="background:black;color:red;height:100vh;display:flex;justify-content:center;align-items:center;font-family:sans-serif;font-weight:bold;">INSPECTION INTERDITE</div>';
        }
    }, 1000);

    // 2. VPN DETECTION
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const data = await res.json();
            // Check for known hosting/proxy ASNs or simple boolean if API provides it
            // Note: ipapi.co free tier has limits. 
            // Logic: If security field exists (paid) or strictly checking known proxy behaviors.
            // Using a simpler heuristic or fallback if field missing.
            
            // Note: Usually requires a paid API for reliable "is_vpn" field. 
            // We will simulate a check or block specific high-risk ISPs if needed.
            // For this implementation, we will trust the user isn't using a VPN 
            // unless we had a specific API key for a service like IPHub or ProxyCheck.
            // HOWEVER, requested feature is "Block if VPN". 
            
            // Let's check typical datacenter fields if available in free response
            // (Many free APIs don't explicitly say "VPN: true" reliably).
            
            // Placeholder for demonstration of blocking logic:
            if (data.hosting === true || data.proxy === true) {
                blockAccess("Connexion VPN/Proxy détectée.");
            }
        }
    } catch (e) {
        console.warn("Security check skipped (Network Error)");
    }
};

const blockAccess = (reason) => {
    document.body.innerHTML = `
        <div style="background-color:#050505; color:white; height:100vh; width:100vw; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; z-index:9999; position:fixed; top:0; left:0;">
            <div style="font-size:3rem; margin-bottom:1rem;">🛡️</div>
            <h1 style="font-size:1.5rem; font-weight:bold; margin-bottom:0.5rem;">Accès Refusé</h1>
            <p style="color:#ef4444;">${reason}</p>
            <p style="color:#6b7280; font-size:0.8rem; margin-top:1rem;">Veuillez désactiver vos outils de contournement.</p>
        </div>
    `;
    throw new Error("Security Block");
};
