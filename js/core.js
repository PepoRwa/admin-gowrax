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
    static init() {
        // Bloque le clic droit
        document.addEventListener('contextmenu', e => e.preventDefault());

        // Bloque les raccourcis clavier DevTools (F12, Ctrl+Shift+I, Ctrl+U)
        document.addEventListener('keydown', e => {
            if (e.key === 'F12' || 
               (e.ctrlKey && e.shiftKey && e.key === 'I') || 
               (e.ctrlKey && e.shiftKey && e.key === 'J') || 
               (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                console.warn("GOWRAX SECURITY: ACCÈS REFUSÉ.");
                return false;
            }
        });
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
            this.buildDashboard();
        }
    }

    static setupLogin() {
        document.getElementById('login-button').addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-button');
            const err = document.getElementById('login-error');
            
            btn.innerText = "AUTHENTIFICATION...";
            err.classList.add('hidden');

            const { error } = await _supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                btn.innerText = "INITIALISER_LIAISON";
                err.innerText = "ÉCHEC : " + error.message;
                err.classList.remove('hidden');
            } else {
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