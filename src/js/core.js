import { createClient } from '@supabase/supabase-js';
import * as modBroadcast from './module-broadcast.js';
import * as modNews from './module-news.js';
import * as modPartners from './module-partners.js';
import * as modStorage from './module-storage.js';

export const SUPABASE_URL = 'https://nvtcjaallxoweujbyhng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52dGNqYWFsbHhvd2V1amJ5aG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NDc4OTEsImV4cCI6MjA4NzQyMzg5MX0.a0FkgYwG3yxu0GMXA6wV-6GqFamB9Pu-E57_z6KkHik';

export const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function isAdminUser(user) {
    return user?.app_metadata?.role === 'admin';
}

/** Déclenche le rebuild GitHub Pages (après publish news) */
export async function triggerSiteDeploy() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) return { ok: false, error: 'no_session' };

        const res = await fetch(`${SUPABASE_URL}/functions/v1/trigger-site-deploy`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                apikey: SUPABASE_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ source: 'admin-news' }),
        });

        if (!res.ok) {
            const detail = await res.text();
            console.warn('[deploy]', res.status, detail);
            return { ok: false, error: detail };
        }
        return { ok: true, ...(await res.json()) };
    } catch (err) {
        console.warn('[deploy]', err);
        return { ok: false, error: String(err) };
    }
}

/** Session idle timeout + periodic auth re-check (no client-side "security theater"). */
class SessionGuard {
    static IDLE_MS = 15 * 60 * 1000;
    static idleTimer = null;
    static pollTimer = null;

    static start() {
        const resetIdle = () => {
            clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => this.lock('Session expirée (inactivité)'), this.IDLE_MS);
        };
        ['mousemove', 'keydown', 'scroll', 'click'].forEach((e) =>
            window.addEventListener(e, resetIdle, { passive: true })
        );
        resetIdle();

        this.pollTimer = setInterval(async () => {
            const { data: { session }, error } = await _supabase.auth.getSession();
            if (!session || error || !isAdminUser(session.user)) {
                this.lock('Session invalide ou droits insuffisants');
            }
        }, 15000);
    }

    static async lock(message) {
        clearTimeout(this.idleTimer);
        clearInterval(this.pollTimer);
        await _supabase.auth.signOut();
        const root = document.createElement('div');
        root.style.cssText =
            'background:#050508;height:100vh;width:100vw;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;color:#ef4444;position:fixed;inset:0;z-index:99999';
        const h1 = document.createElement('h1');
        h1.style.cssText = 'font-size:1.5rem;margin:0;text-transform:uppercase;letter-spacing:4px';
        h1.textContent = 'Session terminée';
        const p = document.createElement('p');
        p.style.cssText = 'margin:20px 0 40px;letter-spacing:2px;color:#aaa;font-size:12px';
        p.textContent = message;
        const btn = document.createElement('button');
        btn.textContent = 'Recharger';
        btn.style.cssText =
            'background:transparent;color:#ef4444;border:1px solid #ef4444;padding:15px 40px;cursor:pointer;font-weight:bold';
        btn.onclick = () => location.reload();
        root.append(h1, p, btn);
        document.body.replaceChildren(root);
    }
}

window.Core = class Core {
    static async init() {
        this.setupLogin();

        const { data: { session } } = await _supabase.auth.getSession();
        if (session) {
            // Refresh so app_metadata.role from DB is present in JWT after role migrations
            const { data: refreshed } = await _supabase.auth.refreshSession();
            const user = refreshed?.session?.user || session.user;
            if (!isAdminUser(user)) {
                await _supabase.auth.signOut();
                return;
            }
            SessionGuard.start();
            this.buildDashboard();
        }
    }

    static setupLogin() {
        document.getElementById('login-button').addEventListener('click', async () => {
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-button');
            const err = document.getElementById('login-error');

            btn.innerText = 'AUTHENTIFICATION...';
            err.classList.add('hidden');

            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

            if (error) {
                btn.innerText = 'INITIALISER_LIAISON';
                err.innerText = `ÉCHEC : ${error.message}`;
                err.classList.remove('hidden');
                return;
            }

            if (!isAdminUser(data.user)) {
                await _supabase.auth.signOut();
                btn.innerText = 'INITIALISER_LIAISON';
                err.innerText = 'ACCÈS REFUSÉ : compte non administrateur.';
                err.classList.remove('hidden');
                return;
            }

            SessionGuard.start();
            this.buildDashboard();
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
        document.querySelectorAll('.view-section').forEach((s) => s.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));

        const section = document.getElementById(viewId);
        const link = document.getElementById('link-' + viewId.split('-')[1]);

        if (section) section.classList.add('active');
        if (link) link.classList.add('active');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.Core.init();
});
