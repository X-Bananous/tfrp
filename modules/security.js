
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
            blockAccess("EH Petit Malin tu essayes de faire quoi ?");
            return false;
        }
    });

    // Debugger Loop Trick (Freezes inspector if opened)
    setInterval(() => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            blockAccess("EH Petit Malin tu essayes de faire quoi ?");
        }
    }, 1000);

    // 2. VPN DETECTION
    try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
            const data = await res.json();
            if (data.hosting === true || data.proxy === true) {
                blockAccess("EH Petit Malin tu essayes de faire quoi ?");
            }
        }
    } catch (e) {
        console.warn("Security check skipped (Network Error)");
    }
};

const blockAccess = (reason) => {
    document.body.innerHTML = `
        <div style="background-color:#000; color:white; height:100vh; width:100vw; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:'Inter', sans-serif; z-index:99999; position:fixed; top:0; left:0; text-align:center; padding: 20px;">
            <div style="font-size:6rem; margin-bottom:2rem; filter: drop-shadow(0 0 20px rgba(255,0,0,0.5));">🤔</div>
            <h1 style="font-size:2.5rem; font-weight:900; margin-bottom:1.5rem; letter-spacing: -0.05em; text-transform: uppercase; font-style: italic; color: #fff; text-shadow: 0 0 30px rgba(255,255,255,0.2);">
                ${reason}
            </h1>
            <div style="width: 60px; height: 4px; background: #ef4444; border-radius: 10px; margin-bottom: 1.5rem; animation: pulse 2s infinite;"></div>
            <p style="color:#6b7280; font-size:0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em;">Action non autorisée • Terminal Verrouillé</p>
            <style>
                @keyframes pulse {
                    0% { opacity: 0.4; transform: scaleX(0.8); }
                    50% { opacity: 1; transform: scaleX(1.2); }
                    100% { opacity: 0.4; transform: scaleX(0.8); }
                }
            </style>
        </div>
    `;
    throw new Error("Security Block");
};
