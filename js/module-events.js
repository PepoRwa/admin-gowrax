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

            <div class="flex items-center gap-6 bg-[#0f101a] border border-magenta/20 p-3">
                <label class="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" id="e-internal" class="w-4 h-4 accent-magenta">
                    <span class="text-xs text-magenta font-bold uppercase tracking-widest">Tournoi Interne</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer border-l border-white/10 pl-4">
                    <input type="checkbox" id="e-featured" class="w-4 h-4 accent-[#00F0FF]">
                    <span class="text-xs text-[#00F0FF] font-bold uppercase tracking-widest">Mettre en avant (Bannière HERO)</span>
                </label>
            </div>

            <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <input type="text" id="e-format" placeholder="FORMAT (EX: BO1, BO3)" class="admin-input uppercase">
                <input type="text" id="e-phase" placeholder="PHASE (EX: GROUPES, FINALE)" class="admin-input uppercase">
            </div>

            <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <input type="text" id="e-grx-name" placeholder="NOM GOWRAX" class="admin-input" value="GOWRAX">
                <input type="text" id="e-opp-name" placeholder="NOM ADVERSAIRE" class="admin-input" required>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <input type="number" id="e-grx-score" placeholder="SCORE GOWRAX" class="admin-input">
                <input type="number" id="e-opp-score" placeholder="SCORE ADVERSAIRE" class="admin-input">
            </div>
            
            <input type="text" id="e-maps" placeholder="RÉSULTATS MAPS (EX: Haven 13-5, Ascent 11-13)" class="admin-input">
            <input type="text" id="e-grx-roster" placeholder="JOUEURS DÉPLOYÉS (Séparés par des virgules)" class="admin-input">
            
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
                <input type="text" id="e-tier" placeholder="TYPE (Ex: OPEN, VCT)" class="admin-input uppercase">
                <input type="url" id="e-tournament-logo" placeholder="URL LOGO TOURNOI" class="admin-input">
            </div>

            <div class="grid grid-cols-3 gap-4">
                <input type="url" id="e-opp-logo" placeholder="URL LOGO ADVERSAIRE" class="admin-input">
                <input type="url" id="e-stream" placeholder="URL STREAM (Twitch/YT)" class="admin-input">
                <input type="url" id="e-toornament" placeholder="URL TOORNAMENT (Fiche)" class="admin-input">
            </div>

            <div class="flex gap-4 mt-6">
                <button type="submit" id="event-submit-btn" class="btn-pub flex-1 border border-magenta bg-magenta/10 hover:bg-magenta text-white font-bold uppercase tracking-widest py-3 transition">Déployer_Match</button>
                <button type="button" id="event-cancel-btn" class="btn-cancel hidden border border-gray-600 text-gray-400 hover:text-white px-6 uppercase tracking-widest text-xs transition" onclick="window.resetEventForm()">Annuler</button>
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
                const isFeatured = ev.is_featured ? `<span class="text-[#00F0FF] text-[8px] border border-[#00F0FF]/30 px-1 ml-2">HERO</span>` : '';
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5 hover:border-magenta/30 transition group";
                div.innerHTML = `
                    <div class="cursor-pointer flex-1 flex items-center" onclick="window.editEvent('${ev.id}')">
                        <span class="text-xs font-bold text-white group-hover:text-magenta">${ev.team_grx_name} VS ${ev.opponent_name}</span>
                        ${isFeatured}
                    </div>
                    <button onclick="window.deleteEvent('${ev.id}')" class="text-[8px] text-red-500 font-bold uppercase">[ Supprimer ]</button>
                `;
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
            document.getElementById('e-featured').checked = ev.is_featured || false;
            document.getElementById('e-format').value = ev.format || '';
            document.getElementById('e-phase').value = ev.phase || '';
            document.getElementById('e-maps').value = ev.maps_results || '';
            document.getElementById('e-grx-name').value = ev.team_grx_name;
            document.getElementById('e-opp-name').value = ev.opponent_name;
            document.getElementById('e-grx-score').value = ev.team_grx_score ?? '';
            document.getElementById('e-opp-score').value = ev.opponent_score ?? '';
            document.getElementById('e-grx-roster').value = ev.team_grx_roster || '';
            document.getElementById('e-status').value = ev.status;
            document.getElementById('e-tier').value = ev.tournament_tier;
            document.getElementById('e-date').value = new Date(ev.date).toISOString().slice(0, 16);
            document.getElementById('e-tournament-logo').value = ev.tournament_logo || '';
            document.getElementById('e-opp-logo').value = ev.opponent_logo || '';
            document.getElementById('e-stream').value = ev.stream_url || '';
            document.getElementById('e-toornament').value = ev.toornament_url || '';

            document.getElementById('event-submit-btn').innerText = "Mettre_à_jour_Match";
            document.getElementById('event-cancel-btn').classList.remove('hidden');
            document.getElementById('event-form-status').innerText = "Mode: Édition_Cible";
            document.getElementById('event-form-status').classList.replace('text-gray-500', 'text-[#00F0FF]');
        }
    };

    window.resetEventForm = function() {
        document.getElementById('event-form').reset();
        document.getElementById('editing-event-id').value = '';
        document.getElementById('event-submit-btn').innerText = "Déployer_Match";
        document.getElementById('event-cancel-btn').classList.add('hidden');
        document.getElementById('event-form-status').innerText = "Mode: Planification_Match";
        document.getElementById('event-form-status').classList.replace('text-[#00F0FF]', 'text-gray-500');
    };

    window.deleteEvent = async function(id) {
        if (confirm("Effacer définitivement ce déploiement des archives ?")) { 
            await _supabase.from('events').delete().eq('id', id); 
            window.loadEventsList(); 
        }
    };

    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-event-id').value;
        
        const payload = {
            game: document.getElementById('e-game').value,
            tournament_name: document.getElementById('e-tournament').value,
            is_internal: document.getElementById('e-internal').checked,
            is_featured: document.getElementById('e-featured').checked,
            format: document.getElementById('e-format').value || null,
            phase: document.getElementById('e-phase').value || null,
            maps_results: document.getElementById('e-maps').value || null,
            team_grx_name: document.getElementById('e-grx-name').value,
            opponent_name: document.getElementById('e-opp-name').value,
            team_grx_score: document.getElementById('e-grx-score').value ? parseInt(document.getElementById('e-grx-score').value) : null,
            opponent_score: document.getElementById('e-opp-score').value ? parseInt(document.getElementById('e-opp-score').value) : null,
            team_grx_roster: document.getElementById('e-grx-roster').value || null,
            status: document.getElementById('e-status').value,
            date: document.getElementById('e-date').value,
            tournament_tier: document.getElementById('e-tier').value,
            tournament_logo: document.getElementById('e-tournament-logo').value || null,
            opponent_logo: document.getElementById('e-opp-logo').value || null,
            stream_url: document.getElementById('e-stream').value || null,
            toornament_url: document.getElementById('e-toornament').value || null
        };

        const res = id ? await _supabase.from('events').update(payload).eq('id', id) : await _supabase.from('events').insert([payload]);
        
        if (res.error) {
            alert("Erreur système : " + res.error.message);
        } else { 
            window.resetEventForm(); 
            window.loadEventsList(); 
        }
    });

    window.loadEventsList();
}