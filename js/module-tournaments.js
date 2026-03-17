import { _supabase } from './core.js';

export function getHTML() {
    return `
    <section id="view-tournaments" class="view-section">
        <header class="mb-10">
            <h3 class="text-xl font-bold uppercase italic tracking-tight text-magenta">League_Manager</h3>
            <p id="tourney-form-status" class="text-[9px] text-gray-500 uppercase">GESTION DU CLASSEMENT ET DES RÉSULTATS</p>
        </header>

        <!-- Navigation Interne (Sous-onglets) -->
        <div class="flex gap-4 border-b border-white/10 pb-2 mb-8 mono text-[10px] uppercase font-bold tracking-widest">
            <button type="button" class="league-tab-btn active text-magenta hover:text-white transition" onclick="window.switchLeagueTab('teams')">[ GÉRER ÉQUIPES ]</button>
            <button type="button" class="league-tab-btn text-gray-500 hover:text-white transition" onclick="window.switchLeagueTab('tournaments')">[ GÉRER TOURNOIS ]</button>
            <button type="button" class="league-tab-btn text-gray-500 hover:text-white transition" onclick="window.switchLeagueTab('results')">[ RÉSULTATS PAR TOURNOI ]</button>
        </div>

        <!-- ONGLET 1: EQUIPES -->
        <div id="league-tab-teams" class="league-tab">
            <h4 class="text-sm font-bold uppercase text-white mb-4">Ajouter / Éditer une équipe</h4>
            <form id="team-form" class="space-y-4 max-w-3xl mb-8">
                <input type="hidden" id="t-id" value="">
                
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="t-name" placeholder="NOM DE L'ÉQUIPE" class="admin-input" required>
                    <input type="text" id="t-tag" placeholder="TAG (ex: GWX)" class="admin-input" required>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <input type="text" id="t-logo" placeholder="URL LOGO (optionnel)" class="admin-input col-span-2">
                </div>

                <div class="flex gap-4 pt-4">
                    <button type="submit" id="team-submit-btn" class="btn-pub flex-1 text-xs">Sauvegarder_Equipe</button>
                    <button type="button" id="team-cancel-btn" class="btn-cancel hidden" onclick="window.resetTeamForm()">Annuler</button>
                </div>
            </form>

            <h4 class="text-sm font-bold uppercase text-white mb-4 border-t border-white/10 pt-6">Roster d'Équipes</h4>
            <div id="teams-list" class="space-y-2 max-w-3xl max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"></div>
        </div>

        <!-- ONGLET 2: TOURNOIS -->
        <div id="league-tab-tournaments" class="league-tab hidden">
            <h4 class="text-sm font-bold uppercase text-white mb-4">Ajouter un nouveau Tournoi</h4>
            <form id="tourney-form" class="space-y-4 max-w-3xl mb-8">
                <div class="grid grid-cols-1 gap-4">
                    <input type="text" id="tourney-name" placeholder="NOM DU TOURNOI (ex: Opération Alpha)" class="admin-input" required>
                </div>
                <div class="flex gap-4 pt-4">
                    <button type="submit" class="btn-pub flex-1 text-xs">Créer_Circuit</button>
                </div>
            </form>

            <h4 class="text-sm font-bold uppercase text-white mb-4 border-t border-white/10 pt-6">Circuits Enregistrés</h4>
            <div id="tourneys-list" class="space-y-2 max-w-3xl max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"></div>
        </div>

        <!-- ONGLET 3: RÉSULTATS -->
        <div id="league-tab-results" class="league-tab hidden">
            <div class="mb-6 flex gap-4 items-center">
                <label class="text-[10px] mono text-gray-400 uppercase">Sélectionner un Circuit :</label>
                <select id="results-tourney-select" class="admin-input bg-[#0f101a] py-2 px-3 border border-white/10 cursor-pointer flex-1" onchange="window.loadResultsForSelectedTourney()">
                    <option value="">Chargement des tournois...</option>
                </select>
            </div>

            <div id="results-workspace" class="hidden border border-white/10 p-4 bg-[#0a0a0f]">
                <h4 class="text-sm font-bold uppercase text-magenta mb-4">Ajouter un résultat pour ce circuit</h4>
                <form id="result-form" class="space-y-4">
                    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <select id="r-team" class="admin-input text-xs col-span-2 lg:col-span-1" required>
                            <!-- Rempli en JS -->
                        </select>
                        <input type="text" id="r-grouprank" placeholder="Rang Grp" class="admin-input text-xs">
                        <input type="text" id="r-bracketrank" placeholder="Rang Brk" class="admin-input text-xs">
                        <input type="number" id="r-points" placeholder="Points (ex: 10)" class="admin-input text-xs" required>
                        <input type="number" id="r-penalty" placeholder="Pénalité (-)" class="admin-input text-xs text-red-400" value="0">
                    </div>
                    <button type="submit" class="btn-pub w-full text-xs py-2">Attribuer_Score</button>
                </form>

                <h4 class="text-sm font-bold uppercase text-white mt-8 mb-4 border-t border-white/5 pt-4">Résultats Actuels</h4>
                <div id="results-list" class="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"></div>
            </div>
        </div>
    </section>
    `;
}

export function init() {
    console.log("League_Manager_Module_Init");

    // ===============================
    // NAVIGATION ONGLETS
    // ===============================
    window.switchLeagueTab = function(tabName) {
        document.querySelectorAll('.league-tab').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.league-tab-btn').forEach(btn => {
            btn.classList.remove('text-magenta', 'active');
            btn.classList.add('text-gray-500');
        });

        document.getElementById('league-tab-' + tabName).classList.remove('hidden');
        event.currentTarget.classList.remove('text-gray-500');
        event.currentTarget.classList.add('text-magenta', 'active');

        if(tabName === 'teams') loadTeamsList();
        if(tabName === 'tournaments') loadTourneysList();
        if(tabName === 'results') loadResultsSetup();
    };

    // ===============================
    // GESTION DES EQUIPES
    // ===============================
    window.loadTeamsList = async function() {
        const { data: teams } = await _supabase.from('league_teams').select('*').order('name');
        const list = document.getElementById('teams-list');
        list.innerHTML = '';
        if (teams) {
            teams.forEach(t => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5 hover:border-magenta/30 transition group";
                div.innerHTML = `
                    <div class="cursor-pointer flex-1 flex flex-col" onclick="window.editTeam('${t.id}')">
                        <span class="text-xs font-bold text-white group-hover:text-magenta">${t.name} <span class="text-gray-500 mono ml-2">[${t.tag}]</span></span>
                        <div class="text-[10px] text-gray-400 mono mt-1">Logo: ${t.logo ? 'Oui' : 'Non'}</div>
                    </div>
                    <button onclick="window.deleteTeam('${t.id}')" class="text-[8px] text-red-500 font-bold uppercase ml-4 hover:text-red-400">[ Supprimer ]</button>
                `;
                list.appendChild(div);
            });
        }
    };

    window.editTeam = async function(id) {
        const { data: t } = await _supabase.from('league_teams').select('*').eq('id', id).single();
        if(t) {
            document.getElementById('t-id').value = t.id;
            document.getElementById('t-name').value = t.name;
            document.getElementById('t-tag').value = t.tag;
            document.getElementById('t-logo').value = t.logo || '';
            
            document.getElementById('team-submit-btn').innerText = "Mettre_à_jour";
            document.getElementById('team-cancel-btn').classList.remove('hidden');
        }
    };

    window.resetTeamForm = function() {
        document.getElementById('team-form').reset();
        document.getElementById('t-id').value = '';
        document.getElementById('team-submit-btn').innerText = "Sauvegarder_Equipe";
        document.getElementById('team-cancel-btn').classList.add('hidden');
    };

    window.deleteTeam = async function(id) {
        if(confirm("ATTENTION: Supprimer l'équipe supprimera TOUS ses résultats ! Continuer ?")) {
            await _supabase.from('league_teams').delete().eq('id', id);
            loadTeamsList();
        }
    };

    document.getElementById('team-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('t-id').value;
        const name = document.getElementById('t-name').value;
        // Basic slugify for ID if new
        const newId = id || 'team_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 10) + '_' + Math.floor(Math.random()*1000);
        
        const payload = {
            id: id || newId,
            name: name,
            tag: document.getElementById('t-tag').value,
            logo: document.getElementById('t-logo').value || null
        };

        const res = id ? await _supabase.from('league_teams').update(payload).eq('id', id) : await _supabase.from('league_teams').insert([payload]);
        if(res.error) alert(res.error.message);
        else { resetTeamForm(); loadTeamsList(); }
    });


    // ===============================
    // GESTION DES TOURNOIS
    // ===============================
    window.loadTourneysList = async function() {
        const { data: tourneys } = await _supabase.from('league_tournaments').select('*').order('created_at', { ascending: false });
        const list = document.getElementById('tourneys-list');
        list.innerHTML = '';
        if (tourneys) {
            tourneys.forEach(t => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5";
                div.innerHTML = `
                    <div class="flex-1 flex flex-col">
                        <span class="text-xs font-bold text-cyan">${t.name}</span>
                        <div class="text-[9px] text-gray-500 mono mt-1">ID: ${t.id}</div>
                    </div>
                    <button onclick="window.deleteTourney('${t.id}')" class="text-[8px] text-red-500 font-bold uppercase ml-4 hover:text-red-400">[ Supprimer ]</button>
                `;
                list.appendChild(div);
            });
        }
    };

    document.getElementById('tourney-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('tourney-name').value;
        const newId = 't_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 10) + '_' + Math.floor(Math.random()*1000);
        
        const res = await _supabase.from('league_tournaments').insert([{ id: newId, name: name }]);
        if(res.error) alert(res.error.message);
        else { 
            document.getElementById('tourney-form').reset();
            loadTourneysList(); 
        }
    });

    window.deleteTourney = async function(id) {
        if(confirm("ATTENTION: Supprimer ce circuit supprimera TOUS les résultats associés. Continuer ?")) {
            await _supabase.from('league_tournaments').delete().eq('id', id);
            loadTourneysList();
            if(document.getElementById('results-tourney-select').value === id) loadResultsSetup(); // Refresh select
        }
    };


    // ===============================
    // GESTION DES RÉSULTATS PAR TOURNOI
    // ===============================
    window.loadResultsSetup = async function() {
        // Load Tourneys in select
        const { data: tourneys } = await _supabase.from('league_tournaments').select('*').order('created_at', { ascending: false });
        const select = document.getElementById('results-tourney-select');
        select.innerHTML = '<option value="">-- CHOISISSEZ UN CIRCUIT --</option>';
        if(tourneys) {
            tourneys.forEach(t => { select.innerHTML += `<option value="${t.id}">${t.name}</option>`; });
        }

        // Load Teams for the result form select
        const { data: teams } = await _supabase.from('league_teams').select('*').order('name');
        const teamSelect = document.getElementById('r-team');
        teamSelect.innerHTML = '<option value="">-- EQUIPE --</option>';
        if(teams) {
            teams.forEach(t => { teamSelect.innerHTML += `<option value="${t.id}">[${t.tag}] ${t.name}</option>`; });
        }

        document.getElementById('results-workspace').classList.add('hidden');
    };

    window.loadResultsForSelectedTourney = async function() {
        const tourneyId = document.getElementById('results-tourney-select').value;
        if(!tourneyId) {
            document.getElementById('results-workspace').classList.add('hidden');
            return;
        }
        
        document.getElementById('results-workspace').classList.remove('hidden');
        
        // Fetch results for this exact tourney, with team names joined manually for display
        const { data: results, error } = await _supabase.from('league_results').select('*, league_teams:team_id (name, tag)').eq('tournament_id', tourneyId);
        
        const list = document.getElementById('results-list');
        list.innerHTML = '';
        
        if (results && results.length > 0) {
            // Sort by points descending
            results.sort((a,b) => b.points - a.points);
            
            results.forEach(r => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#151623] p-3 border border-white/5";
                const teamName = r.league_teams ? r.league_teams.name : "Équipe inconnue";
                const teamTag = r.league_teams ? r.league_teams.tag : "???";

                div.innerHTML = `
                    <div class="flex-1 flex gap-4 items-center">
                        <span class="text-xs font-bold text-starlight w-1/4">${teamName} <span class="text-gray-500 text-[10px]">(${teamTag})</span></span>
                        <div class="text-[9px] mono text-gray-400 w-1/4">
                            <span class="text-magenta">Grp:</span> ${r.group_rank || '-'}<br>
                            <span class="text-purple">Brk:</span> <span class="text-white">${r.bracket_rank || '-'}</span>
                        </div>
                        <div class="text-xs font-black italic text-cyan w-1/4">+${r.points} PTS</div>
                        <div class="text-xs font-black italic ${r.penalty_points < 0 ? 'text-red-500' : 'text-gray-500'} w-1/4">${r.penalty_points || 0} PEN</div>
                    </div>
                    <button onclick="window.deleteResult('${r.id}', '${tourneyId}')" class="text-[10px] text-red-500 font-bold uppercase ml-2 hover:text-red-400">X</button>
                `;
                list.appendChild(div);
            });
        } else {
             list.innerHTML = '<div class="text-[10px] text-gray-500 mono italic">Aucun résultat enregistré pour ce circuit.</div>';
        }
    };

    document.getElementById('result-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tourneyId = document.getElementById('results-tourney-select').value;
        const teamId = document.getElementById('r-team').value;
        
        if(!tourneyId || !teamId) return alert("Sélectionnez Circuit et Equipe.");

        const payload = {
            tournament_id: tourneyId,
            team_id: teamId,
            group_rank: document.getElementById('r-grouprank').value || null,
            bracket_rank: document.getElementById('r-bracketrank').value || null,
            points: parseInt(document.getElementById('r-points').value) || 0,
            penalty_points: parseInt(document.getElementById('r-penalty').value) || 0
        };

        // Check if result already exists for this team in this tournament
        const { data: existing } = await _supabase.from('league_results').select('*').eq('tournament_id', tourneyId).eq('team_id', teamId).single();

        if (existing) {
            // Update
            const res = await _supabase.from('league_results').update(payload).eq('id', existing.id);
            if(res.error) alert(res.error.message);
        } else {
            // Insert
            const res = await _supabase.from('league_results').insert([payload]);
            if(res.error) alert(res.error.message);
        }

        document.getElementById('result-form').reset();
        window.loadResultsForSelectedTourney();
    });

    window.deleteResult = async function(resultId, tourneyId) {
        if(confirm("Retirer le score de cette équipe pour ce tournoi ?")) {
            await _supabase.from('league_results').delete().eq('id', resultId);
            window.loadResultsForSelectedTourney();
        }
    };

    // Auto-load teams list as it's the active tab on launch
    loadTeamsList();
}
