import { _supabase } from './core.js';

export function getHTML() {
    return `
    <section id="view-members" class="view-section">
        <header class="mb-10">
            <h3 class="text-xl font-bold uppercase italic tracking-tight text-magenta">Personnel_Module</h3>
            <p id="form-status" class="text-[9px] text-gray-500 uppercase">Mode: Création_Nouvel_Agent</p>
        </header>
        <form id="member-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-id" value="">
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="m-nickname" placeholder="PSEUDO" class="admin-input" required>
                <input type="text" id="m-slug" placeholder="SLUG" class="admin-input" required>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <select id="m-category" class="admin-input">
                    <option value="staff">CATÉGORIE: STAFF</option>
                    <option value="high_roster">CATÉGORIE: HIGH_ROSTER</option>
                </select>
                <input type="text" id="m-role" placeholder="RÔLE PRINCIPAL" class="admin-input" required>
                <input type="number" id="m-priority" placeholder="PRIORITÉ" class="admin-input" value="0">
            </div>
            <div class="grid grid-cols-3 gap-4">
                <input type="text" id="m-number" placeholder="N° MAILLOT" class="admin-input">
                <input type="text" id="m-roster" placeholder="ROSTER" class="admin-input">
                <input type="text" id="m-additional" placeholder="RÔLES SECONDAIRES (VIRGULES)" class="admin-input">
            </div>
            <div class="grid grid-cols-3 gap-4">
                <input type="text" id="m-twitch" placeholder="TWITCH USER" class="admin-input">
                <input type="text" id="m-twitter" placeholder="TWITTER USER" class="admin-input">
                <input type="text" id="m-instagram" placeholder="INSTA USER" class="admin-input">
            </div>
            <input type="url" id="m-photo" placeholder="URL PHOTO PROFIL" class="admin-input">
            <input type="url" id="m-tracker" placeholder="URL TRACKER.GG" class="admin-input">
            <input type="text" id="m-quote" placeholder="CITATION D'HONNEUR" class="admin-input italic">
            <textarea id="m-description" rows="5" placeholder="BIO..." class="admin-input text-xs"></textarea>
            <div class="flex gap-4">
                <button type="submit" id="submit-btn" class="btn-pub flex-1">Enregistrer_Membre</button>
                <button type="button" id="cancel-btn" class="btn-cancel hidden" onclick="window.resetForm()">Annuler_Edition</button>
            </div>
        </form>
        <div class="mt-20">
            <h4 class="text-magenta text-[10px] uppercase tracking-widest mb-6 border-b border-magenta/20 pb-2">// LISTE_DU_PERSONNEL</h4>
            <div id="members-list" class="space-y-2"></div>
        </div>
    </section>
    `;
}

export function init() {
    window.loadMembersList = async function() {
        const { data: members } = await _supabase.from('members').select('*').order('priority_level', { ascending: false });
        const list = document.getElementById('members-list');
        list.innerHTML = '';
        if (members) {
            members.forEach(m => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5 hover:border-magenta/30 transition group";
                div.innerHTML = `<div class="cursor-pointer flex-1" onclick="window.editMember('${m.id}')"><span class="text-xs font-bold text-white group-hover:text-magenta">${m.nickname}</span></div><button onclick="window.deleteMember('${m.id}')" class="text-[8px] text-red-500 font-bold uppercase">[ Supprimer ]</button>`;
                list.appendChild(div);
            });
        }
    };

    window.editMember = async function(id) {
        const { data: m } = await _supabase.from('members').select('*').eq('id', id).single();
        if (m) {
            document.getElementById('editing-id').value = m.id;
            document.getElementById('m-nickname').value = m.nickname;
            document.getElementById('m-slug').value = m.slug;
            document.getElementById('m-category').value = m.category;
            document.getElementById('m-role').value = m.main_role;
            document.getElementById('m-priority').value = m.priority_level;
            document.getElementById('m-number').value = m.team_number || '';
            document.getElementById('m-roster').value = m.roster || '';
            document.getElementById('m-additional').value = (m.additional_roles || []).join(', ');
            document.getElementById('m-twitch').value = m.social_twitch || '';
            document.getElementById('m-twitter').value = m.social_twitter || '';
            document.getElementById('m-instagram').value = m.social_instagram || '';
            document.getElementById('m-photo').value = m.photo_url || '';
            document.getElementById('m-tracker').value = m.tracker_url || '';
            document.getElementById('m-quote').value = m.quote || '';
            document.getElementById('m-description').value = m.description || '';
            document.getElementById('submit-btn').innerText = "Mettre_à_jour_Agent";
            document.getElementById('cancel-btn').classList.remove('hidden');
        }
    };

    window.resetForm = function() {
        document.getElementById('member-form').reset();
        document.getElementById('editing-id').value = '';
        document.getElementById('submit-btn').innerText = "Enregistrer_Membre";
        document.getElementById('cancel-btn').classList.add('hidden');
    };

    window.deleteMember = async function(id) {
        if (confirm("Supprimer membre ?")) { await _supabase.from('members').delete().eq('id', id); window.loadMembersList(); }
    };

    document.getElementById('member-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-id').value;
        const payload = {
            nickname: document.getElementById('m-nickname').value,
            slug: document.getElementById('m-slug').value,
            category: document.getElementById('m-category').value,
            main_role: document.getElementById('m-role').value,
            roster: document.getElementById('m-roster').value,
            team_number: document.getElementById('m-number').value,
            priority_level: parseInt(document.getElementById('m-priority').value),
            photo_url: document.getElementById('m-photo').value,
            tracker_url: document.getElementById('m-tracker').value,
            quote: document.getElementById('m-quote').value,
            description: document.getElementById('m-description').value,
            additional_roles: document.getElementById('m-additional').value.split(',').map(t => t.trim()),
            social_twitch: document.getElementById('m-twitch').value,
            social_twitter: document.getElementById('m-twitter').value,
            social_instagram: document.getElementById('m-instagram').value
        };
        const res = id ? await _supabase.from('members').update(payload).eq('id', id) : await _supabase.from('members').insert([payload]);
        if (res.error) alert(res.error.message); else { window.resetForm(); window.loadMembersList(); }
    });

    window.loadMembersList();
}