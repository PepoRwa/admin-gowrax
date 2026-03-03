import { _supabase } from './core.js';

export function getHTML() {
    return `
    <section id="view-events" class="view-section">
        <header class="mb-10">
            <h3 class="text-xl font-bold uppercase italic tracking-tight text-magenta">Calendar_Module</h3>
            <p id="event-form-status" class="text-[9px] text-gray-500 uppercase">Mode: Planification_Match</p>
        </header>
        <form id="event-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-event-id" value="">
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="e-game" placeholder="JEU (EX: VALORANT, CS2)" class="admin-input" required>
                <input type="text" id="e-tournament" placeholder="NOM DU TOURNOI" class="admin-input" required>
            </div>
            <div class="flex items-center gap-4 bg-[#0f101a] border border-magenta/20 p-3">
                <input type="checkbox" id="e-internal" class="w-4 h-4 accent-magenta">
                <label for="e-internal" class="text-xs text-magenta font-bold uppercase tracking-widest cursor-pointer">Cocher si Tournoi Interne</label>
            </div>
            <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <input type="text" id="e-grx-name" placeholder="NOM GOWRAX" class="admin-input" value="GOWRAX">
                <input type="text" id="e-opp-name" placeholder="NOM ADVERSAIRE" class="admin-input" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <input type="number" id="e-grx-score" placeholder="SCORE GOWRAX" class="admin-input">
                <input type="number" id="e-opp-score" placeholder="SCORE ADVERSAIRE" class="admin-input">
            </div>
            <input type="text" id="e-grx-roster" placeholder="JOUEURS DÉPLOYÉS" class="admin-input">
            <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <input type="datetime-local" id="e-date" class="admin-input" required>
                <select id="e-status" class="admin-input text-white">
                    <option value="UPCOMING">STATUT: À VENIR</option>
                    <option value="LIVE">STATUT: LIVE</option>
                    <option value="FINISHED">STATUT: TERMINÉ</option>
                    <option value="POSTPONED">STATUT: REPORTÉ</option>
                    <option value="CANCELED">STATUT: ANNULÉ</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="e-tier" placeholder="TYPE (Ex: VCT)" class="admin-input uppercase">
                <input type="url" id="e-tournament-logo" placeholder="URL LOGO TOURNOI" class="admin-input">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <input type="url" id="e-opp-logo" placeholder="URL LOGO ADVERSAIRE" class="admin-input">
                <input type="url" id="e-stream" placeholder="URL STREAM" class="admin-input">
            </div>
            <div class="flex gap-4 mt-6">
                <button type="submit" id="event-submit-btn" class="btn-pub flex-1">Déployer_Match</button>
                <button type="button" id="event-cancel-btn" class="btn-cancel hidden" onclick="window.resetEventForm()">Annuler</button>
            </div>
        </form>
        <div class="mt-20">
            <h4 class="text-magenta text-[10px] uppercase tracking-widest mb-6 border-b border-magenta/20 pb-2">// HISTORIQUE_DES_DÉPLOIEMENTS</h4>
            <div id="events-list" class="space-y-2"></div>
        </div>
    </section>
    `;
}

export function init() {
    window.loadEventsList = async function() {
        const { data: events } = await _supabase.from('events').select('*').order('date', { ascending: false });
        const list = document.getElementById('events-list');
        list.innerHTML = '';
        if (events) {
            events.forEach(ev => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5 hover:border-magenta/30 transition group";
                div.innerHTML = `<div class="cursor-pointer flex-1" onclick="window.editEvent('${ev.id}')"><span class="text-xs font-bold text-white group-hover:text-magenta">${ev.team_grx_name} VS ${ev.opponent_name}</span></div><button onclick="window.deleteEvent('${ev.id}')" class="text-[8px] text-red-500 font-bold uppercase">[ Supprimer ]</button>`;
                list.appendChild(div);
            });
        }
    };

    window.editEvent = async function(id) {
        const { data: ev } = await _supabase.from('events').select('*').eq('id', id).single();
        if (ev) {
            document.getElementById('editing-event-id').value = ev.id;
            document.getElementById('e-game').value = ev.game;
            document.getElementById('e-tournament').value = ev.tournament_name;
            document.getElementById('e-internal').checked = ev.is_internal;
            document.getElementById('e-grx-name').value = ev.team_grx_name;
            document.getElementById('e-opp-name').value = ev.opponent_name;
            document.getElementById('e-grx-score').value = ev.team_grx_score || '';
            document.getElementById('e-opp-score').value = ev.opponent_score || '';
            document.getElementById('e-status').value = ev.status;
            document.getElementById('e-tier').value = ev.tournament_tier;
            document.getElementById('e-date').value = new Date(ev.date).toISOString().slice(0, 16);
            document.getElementById('event-submit-btn').innerText = "Mettre_à_jour_Match";
            document.getElementById('event-cancel-btn').classList.remove('hidden');
        }
    };

    window.resetEventForm = function() {
        document.getElementById('event-form').reset();
        document.getElementById('editing-event-id').value = '';
        document.getElementById('event-submit-btn').innerText = "Déployer_Match";
        document.getElementById('event-cancel-btn').classList.add('hidden');
    };

    window.deleteEvent = async function(id) {
        if (confirm("Effacer match ?")) { await _supabase.from('events').delete().eq('id', id); window.loadEventsList(); }
    };

    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-event-id').value;
        const payload = {
            game: document.getElementById('e-game').value,
            tournament_name: document.getElementById('e-tournament').value,
            is_internal: document.getElementById('e-internal').checked,
            team_grx_name: document.getElementById('e-grx-name').value,
            opponent_name: document.getElementById('e-opp-name').value,
            team_grx_score: document.getElementById('e-grx-score').value ? parseInt(document.getElementById('e-grx-score').value) : null,
            opponent_score: document.getElementById('e-opp-score').value ? parseInt(document.getElementById('e-opp-score').value) : null,
            status: document.getElementById('e-status').value,
            date: document.getElementById('e-date').value,
            tournament_tier: document.getElementById('e-tier').value
        };
        const res = id ? await _supabase.from('events').update(payload).eq('id', id) : await _supabase.from('events').insert([payload]);
        if (res.error) alert(res.error.message); else { window.resetEventForm(); window.loadEventsList(); }
    });

    window.loadEventsList();
}