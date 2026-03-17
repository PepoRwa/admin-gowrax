// js/core.js
// ---------------------------------------------------------
// GOWRAX HQ - CORE SYSTEM (V2.0)
// Gère la sécurité, l'authentification et le routage
// ---------------------------------------------------------

const SUPABASE_URL = 'https://nvtcjaallxoweujbyhng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dGNqYWFsbHhvd2V1amJ5aG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDc4OTEsImV4cCI6MjA4NzQyMzg5MX0.a0FkgYwG3yxu0GMXA6wV-6GqFamB9Pu-E57_z6KkHik'; // <-- REMETS TA CLÉ ICI !

// Initialisation de Supabase
export const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------
// 1. MODULE DE SÉCURITÉ (BUNKER)
// ---------------------------------------------------------
class SecurityManager {
    static _O0 = 15 * 60 * 1000;
    static _I1 = null;
    static _S2 = null;
    static _T3 = null;

    static init() {
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if([123, 73, 74, 85, 67].includes(e.keyCode) && (e.ctrlKey || e.metaKey || e.keyCode === 123)) {
                e.preventDefault(); return false;
            }
        });

        this._x9();

        window._G_TK = {
            R0: () => this.bC('0x01_MANUAL_FORCE'),
            L1: () => this.bC('0x02_MANUAL_LOCK'),
            U2: () => { this.resetLoginAttempts(); console.log('%c[SYS] SEC_CLR', 'color:#0f0'); },
            S3: () => console.log(this._T3)
        };
    }

    static _x9() {
        const n = f => /\{\s*\[native code\]\s*\}/.test('' + f);
        if (!n(setTimeout) || !n(setInterval) || !n(fetch)) this.bC('0x10_CORE_TAMPER');

        let _zz = false;
        Object.defineProperty(window, 'disableAdminAuth', {
            get: () => { this.bC('0x11_HP_READ'); return _zz; },
            set: (v) => { this.bC('0x12_HP_WRITE'); _zz = v; }
        });

        const loop = setInterval(() => {
            const t = performance.now();
            debugger;
            if (performance.now() - t > 100) { clearInterval(loop); this.bC('0x13_DEV_SYNC'); }
            if (!n(setTimeout)) this.bC('0x10_CORE_TAMPER');
        }, 1500);

        const mo = new MutationObserver(() => {
            const az = document.getElementById('app-root');
            if (az && !az.classList.contains('hidden') && !this._T3) this.bC('0x14_DOM_INJECT');
        });
        mo.observe(document.body, { childList: true, subtree: true, attributes: true });
    }

    static startBunkerMonitoring() {
        this._T3 = "G-" + performance.now().toString(36) + "-" + Math.random().toString(36).substring(2);
        sessionStorage.setItem('_g_ct', this._T3);
        
        const rx = () => {
            clearTimeout(this._I1);
            this._I1 = setTimeout(() => this.bC('0x20_IDLE'), this._O0);
        };
        ['mousemove','keydown','scroll','click'].forEach(e => window.addEventListener(e, rx, {passive: true}));
        rx();

        this._S2 = setInterval(async () => {
            if (sessionStorage.getItem('_g_ct') !== this._T3) return this.bC('0x21_TOKEN_INVALID');
            const { data: { session }, error } = await _supabase.auth.getSession();
            if (!session || error) this.bC('0x22_SESSION_LOST');
        }, 15000);
    }

    static async bC(c) {
        clearTimeout(this._I1); clearInterval(this._S2);
        sessionStorage.removeItem('_g_ct');
        await _supabase.auth.signOut();
        document.body.innerHTML = `
            <div style="background:#050508; height:100vh; width:100vw; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:'Share Tech Mono', monospace; color:#ef4444; position:fixed; top:0; left:0; z-index:99999; overflow:hidden;">
                <div style="position:absolute; inset:0; background: radial-gradient(circle at center, transparent 0%, #150000 120%);">
                    <div style="position:absolute; inset:0; background: repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(239, 68, 68, 0.04) 2px, rgba(239, 68, 68, 0.04) 4px);"></div>
                </div>
                <div style="position:relative; z-index:10; text-align:center;">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" style="margin: 0 auto 30px; animation: breach-pulse 2s infinite;">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h1 style="font-size: clamp(3rem, 8vw, 5rem); margin:0; text-transform:uppercase; letter-spacing:10px; font-weight:900; line-height:1; text-shadow: 0 0 30px rgba(239, 68, 68, 0.6);">CRITICAL BREACH</h1>
                    <p style="color:#ef4444; opacity:0.8; font-size:1.2rem; margin:20px 0 50px; letter-spacing:4px; text-transform:uppercase; animation: breach-blink 0.1s infinite;">ERR_CODE : ${c}</p>
                    <button onclick="location.reload()" style="background:transparent; color:#ef4444; border:1px solid #ef4444; padding:15px 40px; font-size:1rem; cursor:pointer; font-weight:bold; letter-spacing:4px; text-transform:uppercase; transition:0.3s; box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);" onmouseover="this.style.background='#ef4444'; this.style.color='#000';" onmouseout="this.style.background='transparent'; this.style.color='#ef4444';">
                        [ SYSTEM_REBOOT ]
                    </button>
                </div>
                <style>
                    @keyframes breach-pulse { 0%, 100% { opacity:0.6; filter:drop-shadow(0 0 5px #ef4444); } 50% { opacity:1; filter:drop-shadow(0 0 25px #ef4444); transform:scale(1.05); } }
                    @keyframes breach-blink { 0%, 100% { opacity:1; } 50% { opacity:0.6; } }
                </style>
            </div>
        `;
    }

    static validateBruteForce() {
        const l = localStorage.getItem('_g_lck');
        if (l && Date.now() < parseInt(l)) {
            throw new Error('ERR_0x99');
        }
    }

    static recordFailedLogin() {
        let a = parseInt(localStorage.getItem('_g_fail') || '0') + 1;
        if (a >= 5) {
            localStorage.setItem('_g_lck', Date.now() + (5 * 60 * 1000));
            localStorage.setItem('_g_fail', '0');
        } else {
            localStorage.setItem('_g_fail', a.toString());
        }
        return a;
    }

    static resetLoginAttempts() {
        localStorage.removeItem('_g_fail'); localStorage.removeItem('_g_lck');
    }
}
// ---------------------------------------------------------
// 2. GESTIONNAIRE DU DASHBOARD (CORE)
// ---------------------------------------------------------
window.Core = class Core {
    static async init() {
        SecurityManager.init();
        this.setupLogin();
        
        // Vérifie si une session est déjà active au chargement
        const { data: { session } } = await _supabase.auth.getSession();
        if (session) {
            SecurityManager.startBunkerMonitoring();
            this.buildDashboard();
        }
    }

    static setupLogin() {
        document.getElementById('login-button').addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-button');
            const err = document.getElementById('login-error');

            // --- CHEAT CODE D'URGENCE --- 
            // Si tu es bloqué par le BruteForce et que la console (F12) est désactivée
            // Tape ce code exact dans le champ "email" pour déverrouiller le PC.
            if (email === "GOWRAX_OVERRIDE" && password === "breach") {
                SecurityManager.resetLoginAttempts();
                alert("[SYSTEM] Surcharge acceptée : Lockout réinitialisé. Tu peux réessayer de te connecter normalement.");
                err.classList.add('hidden');
                btn.innerText = "INITIALISER_LIAISON";
                document.getElementById('email').value = "";
                document.getElementById('password').value = "";
                return;
            }
            // ----------------------------
            
            try {
                SecurityManager.validateBruteForce();
            } catch (bruteError) {
                err.innerText = "ALERTE SÉCURITÉ : " + bruteError.message;
                err.classList.remove('hidden');
                return;
            }

            btn.innerText = "AUTHENTIFICATION...";
            err.classList.add('hidden');

            const { error } = await _supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                btn.innerText = "INITIALISER_LIAISON";
                const attempts = SecurityManager.recordFailedLogin();
                err.innerText = `ÉCHEC : ${error.message} (${5 - attempts} essai(s) restant(s))`;
                err.classList.remove('hidden');
            } else {
                SecurityManager.resetLoginAttempts();
                SecurityManager.startBunkerMonitoring();
                this.buildDashboard();
            }
        });
    }

    static async logout() {
        await _supabase.auth.signOut();
        location.reload(); // Recharge la page pour détruire le DOM et vider la mémoire
    }

    // Le cœur du système : On génère le panel SEULEMENT après connexion
    static buildDashboard() {
        // 1. Cache l'écran de login et restaure le scroll
        document.getElementById('login-zone').style.display = 'none';
        document.body.style.overflow = 'auto';

        // 2. Clone le template sécurisé et l'injecte dans la page
        const appRoot = document.getElementById('app-root');
        const template = document.getElementById('dashboard-template');
        appRoot.appendChild(template.content.cloneNode(true));
        appRoot.classList.remove('hidden');

        // 3. Charge les sous-modules (News, Events, etc.)
        this.loadModules();
    }

    // Remplace uniquement cette fonction dans js/core.js :
    static async loadModules() {
        console.log("HQ: Chargement des modules tactiques...");
        const mainPanel = document.getElementById('main-panel');
        
        // Liste de tes modules sécurisés
        const modules = [
            'module-broadcast.js',
            'module-news.js',
            'module-members.js',
            'module-events.js',
            'module-tournaments.js',
            'module-partners.js'
        ];

        for (const mod of modules) {
            try {
                // On importe le fichier dynamiquement
                const module = await import('./' + mod);
                // On injecte le HTML de la page
                mainPanel.insertAdjacentHTML('beforeend', module.getHTML());
                // On lance la logique (chargement de la base de données)
                if (module.init) module.init();
            } catch (err) {
                console.error(`GOWRAX OS - Erreur critique sur le module ${mod}:`, err);
            }
        }
        
        // Affichage par défaut une fois connecté
        this.switchView('view-news');
    }

    static switchView(viewId) {
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        const section = document.getElementById(viewId);
        const link = document.getElementById('link-' + viewId.split('-')[1]);
        
        if (section) section.classList.add('active');
        if (link) link.classList.add('active');
    }
}

// Boot de l'application
document.addEventListener('DOMContentLoaded', () => {
    window.Core.init();
});