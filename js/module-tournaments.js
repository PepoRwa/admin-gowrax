import { _supabase } from './core.js';

export function getHTML() {
    return `
    <section id="view-tournaments" class="view-section">
        <header class="mb-10">
            <h3 class="text-xl font-bold uppercase italic tracking-tight text-magenta">Tournaments_Module</h3>
            <p id="tourney-form-status" class="text-[9px] text-gray-500 uppercase">Mode: Enregistrement_Circuit</p>
        </header>
        <form id="tourney-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-tourney-id" value="">
            
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="t-game" placeholder="JEU (EX: MULTIGAMING, VALORANT)" class="admin-input" required>
                <input type="text" id="t-name" placeholder="NOM DU TOURNOI" class="admin-input" required>
            </div>

            <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                     <label class="block text-[10px] text-gray-400 uppercase mb-2">Date début</label>
                     <input type="date" id="t-start" class="admin-input" required>
                </div>
                <div>
                     <label class="block text-[10px] text-gray-400 uppercase mb-2">Date fin (optionnel)</label>
                     <input type="date" id="t-end" class="admin-input">
                </div>
            </div>

            <select id="t-status" class="admin-input uppercase" required>
                <option value="upcoming">À VENIR (Upcoming)</option>
                <option value="ongoing">EN COURS (Ongoing)</option>
                <option value="completed">TERMINÉ (Completed)</option>
                <option value="canceled">ANNULÉ (Canceled)</option>
            </select>

            <div class="space-y-4">
                <input type="text" id="t-bracket" placeholder="URL BRACKET PUBLIC / I-FRAME EMBED" class="admin-input">
            </div>

            <div class="flex gap-4 pt-6">
                <button type="submit" id="tourney-submit-btn" class="btn-pub flex-1 text-xs">Déployer_Circuit</button>
                <button type="button" id="tourney-cancel-btn" class="btn-cancel hidden" onclick="window.resetTourneyForm()">Annuler</button>
            </div>
        </form>

        <div class="mt-12">
            <h4 class="text-sm font-bold uppercase text-white mb-6 border-b border-white/10 pb-2">Circuits Actifs & Archives (DB)</h4>
            <div id="tourneys-list" class="space-y-2 max-w-3xl max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div class="text-gray-600 text-[10px] mono animate-pulse">Scanning circuits...</div>
            </div>
        </div>
    </section>
    `;
}

export function init() {
    console.log("Tournaments_Module_Init");

    window.loadTourneysList = async function() {
        const { data: tourneys } = await _supabase.from('tournaments').select('*').order('start_date', { ascending: false });
        const list = document.getElementById('tourneys-list');
        list.innerHTML = '';
        if (tourneys) {
            tourneys.forEach(t => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5 hover:border-magenta/30 transition group";
                let statusLabel = t.status.toUpperCase();
                let statusColor = 'text-gray-400';
                if(statusLabel === 'ONGOING') statusColor = 'text-green-500';
                if(statusLabel === 'UPCOMING') statusColor = 'text-magenta';

                div.innerHTML = `
                    <div class="cursor-pointer flex-1 flex flex-col" onclick="window.editTourney('${t.id}')">
                        <span class="text-xs font-bold text-white group-hover:text-magenta">${t.name}</span>
                        <div class="text-[10px] ${statusColor} mono mt-1">[ ${t.game} // ${statusLabel} ]</div>
                    </div>
                    <button onclick="window.deleteTourney('${t.id}')" class="text-[8px] text-red-500 font-bold uppercase ml-4">[ Supprimer ]</button>
                `;
                list.appendChild(div);
            });
        }
    };

    window.editTourney = async function(id) {
        const { data: t } = await _supabase.from('tournaments').select('*').eq('id', id).single();
        if (t) {
            document.getElementById('editing-tourney-id').value = t.id;
            document.getElementById('t-game').value = t.game;
            document.getElementById('t-name').value = t.name;
            document.getElementById('t-start').value = t.start_date || '';
            document.getElementById('t-end').value = t.end_date || '';
            document.getElementById('t-status').value = (t.status || 'upcoming').toLowerCase();
            document.getElementById('t-bracket').value = t.bracket_url || '';

            document.getElementById('tourney-submit-btn').innerText = "Mettre_à_jour_Circuit";
            document.getElementById('tourney-cancel-btn').classList.remove('hidden');
            document.getElementById('tourney-form-status').innerText = "Mode: Édition_Cible";
            document.getElementById('tourney-form-status').classList.replace('text-gray-500', 'text-[#00F0FF]');
        }
    };

    window.resetTourneyForm = function() {
        document.getElementById('tourney-form').reset();
        document.getElementById('editing-tourney-id').value = '';
        document.getElementById('tourney-submit-btn').innerText = "Déployer_Circuit";
        document.getElementById('tourney-cancel-btn').classList.add('hidden');
        document.getElementById('tourney-form-status').innerText = "Mode: Enregistrement_Circuit";
        document.getElementById('tourney-form-status').classList.replace('text-[#00F0FF]', 'text-gray-500');
    };

    window.deleteTourney = async function(id) {
        if (confirm("Effacer définitivement ce circuit des archives ?")) { 
            await _supabase.from('tournaments').delete().eq('id', id); 
            window.loadTourneysList(); 
        }
    };

    document.getElementById('tourney-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-tourney-id').value;
        const startDateRaw = document.getElementById('t-start').value;
        const endDateRaw = document.getElementById('t-end').value || null;
        
        const payload = {
            game: document.getElementById('t-game').value,
            name: document.getElementById('t-name').value,
            start_date: startDateRaw,
            end_date: endDateRaw,
            status: document.getElementById('t-status').value,
            bracket_url: document.getElementById('t-bracket').value || null
        };

        const res = id ? await _supabase.from('tournaments').update(payload).eq('id', id) : await _supabase.from('tournaments').insert([payload]);
        if (res.error) {
            alert("Erreur système : " + res.error.message);
        } else { 
            window.resetTourneyForm(); 
            window.loadTourneysList(); 
        }
    });

    window.loadTourneysList();
}
