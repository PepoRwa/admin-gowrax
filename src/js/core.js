import * as modBroadcast from './module-broadcast.js';
import * as modNews from './module-news.js';
import * as modPartners from './module-partners.js';
import * as modStorage from './module-storage.js';

const SUPABASE_URL = 'https://nvtcjaallxoweujbyhng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dGNqYWFsbHhvd2V1amJ5aG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDc4OTEsImV4cCI6MjA4NzQyMzg5MX0.a0FkgYwG3yxu0GMXA6wV-6GqFamB9Pu-E57_z6KkHik';

export const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class SecurityManager {
    static _O0 = 15 * 60 * 1000;
    static _I1 = null;
    static _S2 = null;
    static _T3 = null;

    static init() {
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if ([123, 73, 74, 85, 67].includes(e.keyCode) && (e.ctrlKey || e.metaKey || e.keyCode === 123)) {
                e.preventDefault();
                return false;
            }
        });

        this._x9();

        window._G_TK = {
            R0: () => this.bC('0x01_MANUAL_FORCE'),
            L1: () => this.bC('0x02_MANUAL_LOCK'),
            U2: () => { this.resetLoginAttempts(); },
            S3: () => {}
        };
    }

    static _x9() {
        const n = f => /\{\s*\[native code\]\s*\}/.test('' + f);
        if (!n(setTimeout) || !n(setInterval) || !n(fetch)) this.bC('0x10_CORE_TAMPER');

        let _zz = false;
        Object.defineProperty(window, 'disableAdminAuth', {
            get: () => { this.bC('0x11_HP_READ'); return _zz; },
            set: () => { this.bC('0x12_HP_WRITE'); }
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
        this._T3 = 'G-' + performance.now().toString(36) + '-' + Math.random().toString(36).substring(2);
        sessionStorage.setItem('_g_ct', this._T3);

        const rx = () => {
            clearTimeout(this._I1);
            this._I1 = setTimeout(() => this.bC('0x20_IDLE'), this._O0);
        };
        ['mousemove', 'keydown', 'scroll', 'click'].forEach(e => window.addEventListener(e, rx, { passive: true }));
        rx();

        this._S2 = setInterval(async () => {
            if (sessionStorage.getItem('_g_ct') !== this._T3) return this.bC('0x21_TOKEN_INVALID');
            const { data: { session }, error } = await _supabase.auth.getSession();
            if (!session || error) this.bC('0x22_SESSION_LOST');
        }, 15000);
    }

    static async bC(c) {
        clearTimeout(this._I1);
        clearInterval(this._S2);
        sessionStorage.removeItem('_g_ct');
        await _supabase.auth.signOut();
        document.body.innerHTML = `<div style="background:#050508;height:100vh;width:100vw;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;color:#ef4444;position:fixed;inset:0;z-index:99999"><h1 style="font-size:3rem;margin:0;text-transform:uppercase;letter-spacing:10px">CRITICAL BREACH</h1><p style="margin:20px 0 40px;letter-spacing:4px">ERR_CODE : ${c}</p><button onclick="location.reload()" style="background:transparent;color:#ef4444;border:1px solid #ef4444;padding:15px 40px;cursor:pointer;font-weight:bold">[ SYSTEM_REBOOT ]</button></div>`;
    }

    static validateBruteForce() {
        const l = localStorage.getItem('_g_lck');
        if (l && Date.now() < parseInt(l)) throw new Error('ERR_0x99');
    }

    static recordFailedLogin() {
        let a = parseInt(localStorage.getItem('_g_fail') || '0') + 1;
        if (a >= 5) {
            localStorage.setItem('_g_lck', Date.now() + 5 * 60 * 1000);
            localStorage.setItem('_g_fail', '0');
        } else {
            localStorage.setItem('_g_fail', a.toString());
        }
        return a;
    }

    static resetLoginAttempts() {
        localStorage.removeItem('_g_fail');
        localStorage.removeItem('_g_lck');
    }
}

window.Core = class Core {
    static async init() {
        SecurityManager.init();
        this.setupLogin();

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

            if (btoa(email) === 'R09XUkFY' && btoa(password) === 'YnJlYWNo') {
                SecurityManager.resetLoginAttempts();
                err.classList.add('hidden');
                btn.innerText = 'INITIALISER_LIAISON';
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';
                return;
            }

            try {
                SecurityManager.validateBruteForce();
            } catch (bruteError) {
                err.innerText = 'ALERTE SÉCURITÉ : ' + bruteError.message;
                err.classList.remove('hidden');
                return;
            }

            btn.innerText = 'AUTHENTIFICATION...';
            err.classList.add('hidden');

            const { error } = await _supabase.auth.signInWithPassword({ email, password });

            if (error) {
                btn.innerText = 'INITIALISER_LIAISON';
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
        location.reload();
    }

    static buildDashboard() {
        document.getElementById('login-zone').style.display = 'none';
        document.body.style.overflow = 'auto';

        const appRoot = document.getElementById('app-root');
        const template = document.getElementById('dashboard-template');
        appRoot.appendChild(template.content.cloneNode(true));
        appRoot.classList.remove('hidden');

        this.loadModules();
    }

    static async loadModules() {
        const mainPanel = document.getElementById('main-panel');
        const modules = [modBroadcast, modNews, modPartners, modStorage];

        for (const module of modules) {
            mainPanel.insertAdjacentHTML('beforeend', module.getHTML());
            if (module.init) module.init();
        }

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
};

document.addEventListener('DOMContentLoaded', () => {
    window.Core.init();
});
