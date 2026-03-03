import { _supabase } from './core.js';

export function getHTML() {
    return `
    <section id="view-broadcast" class="view-section">
        <header class="mb-10">
            <h3 class="text-xl font-bold uppercase italic tracking-tight text-magenta">Broadcast_Module</h3>
            <p id="broadcast-form-status" class="text-[9px] text-gray-500 uppercase">Mode: Création_Nouvelle_Alerte</p>
        </header>
        <form id="broadcast-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-broadcast-id" value="">
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="b-tag" placeholder="VERSION TAG (Ex: v1-tournoi)" class="admin-input" required>
                <select id="b-status" class="admin-input font-bold">
                    <option value="false" class="text-gray-500">DÉSACTIVÉ (Caché)</option>
                    <option value="true" class="text-green-500">ACTIF (En ligne)</option>
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="b-title" placeholder="TITRE (Ex: Mise à jour Système)" class="admin-input" required>
                <select id="b-target" class="admin-input">
                    <option value="ALL">CIBLE: TOUTES LES PAGES</option>
                    <option value="/contact/">CIBLE: PAGE CONTACT</option>
                    <option value="/roster/">CIBLE: PAGES ROSTERS</option>
                    <option value="/join/">CIBLE: RECRUTEMENT</option>
                </select>
            </div>
            <p class="text-[10px] text-magenta mt-2">HTML simple supporté. Les sauts de ligne sont conservés.</p>
            <textarea id="b-content" rows="6" placeholder="Message du pop-up..." class="admin-input" required></textarea>
            <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <input type="text" id="b-btn-text" placeholder="TEXTE DU BOUTON (Optionnel)" class="admin-input">
                <input type="text" id="b-btn-link" placeholder="LIEN DU BOUTON (Optionnel)" class="admin-input">
            </div>
            <div class="flex gap-4 mt-6">
                <button type="submit" id="broadcast-submit-btn" class="btn-pub flex-1">Publier_Alerte</button>
                <button type="button" id="broadcast-cancel-btn" class="btn-cancel hidden" onclick="window.resetBroadcastForm()">Annuler</button>
            </div>
        </form>
        <div class="mt-20">
            <h4 class="text-magenta text-[10px] uppercase tracking-widest mb-6 border-b border-magenta/20 pb-2">// ALERTES_ENREGISTRÉES</h4>
            <div id="broadcast-list" class="space-y-2"></div>
        </div>
    </section>
    `;
}

export function init() {
    window.loadBroadcastList = async function() {
        const { data: notifs } = await _supabase.from('notifications').select('*').order('created_at', { ascending: false });
        const list = document.getElementById('broadcast-list');
        list.innerHTML = '';
        if (notifs) {
            notifs.forEach(n => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5 hover:border-magenta/30 transition group";
                const statusColor = n.is_active ? "text-green-500" : "text-gray-600";
                div.innerHTML = `
                    <div class="cursor-pointer flex-1" onclick="window.editBroadcast('${n.id}')">
                        <span class="text-xs font-bold text-white group-hover:text-magenta">${n.title}</span>
                        <span class="text-[9px] ${statusColor} ml-2 font-bold uppercase">[${n.is_active ? 'ACTIF' : 'INACTIF'}]</span>
                        <span class="text-[9px] text-gray-500 ml-2 font-mono">TAG: ${n.version_tag}</span>
                    </div>
                    <button onclick="window.deleteBroadcast('${n.id}')" class="text-[8px] text-red-500 hover:text-white uppercase font-bold">[ Supprimer ]</button>
                `;
                list.appendChild(div);
            });
        }
    };

    window.editBroadcast = async function(id) {
        const { data: n } = await _supabase.from('notifications').select('*').eq('id', id).single();
        if (n) {
            document.getElementById('editing-broadcast-id').value = n.id;
            document.getElementById('b-tag').value = n.version_tag;
            document.getElementById('b-status').value = n.is_active.toString();
            document.getElementById('b-title').value = n.title;
            document.getElementById('b-target').value = n.target_page;
            document.getElementById('b-content').value = n.content;
            document.getElementById('b-btn-text').value = n.button_text || '';
            document.getElementById('b-btn-link').value = n.button_link || '';
            document.getElementById('broadcast-submit-btn').innerText = "Mettre_à_jour_Alerte";
            document.getElementById('broadcast-cancel-btn').classList.remove('hidden');
        }
    };

    window.resetBroadcastForm = function() {
        document.getElementById('broadcast-form').reset();
        document.getElementById('editing-broadcast-id').value = '';
        document.getElementById('broadcast-submit-btn').innerText = "Publier_Alerte";
        document.getElementById('broadcast-cancel-btn').classList.add('hidden');
    };

    window.deleteBroadcast = async function(id) {
        if (confirm("Supprimer l'alerte ?")) { await _supabase.from('notifications').delete().eq('id', id); window.loadBroadcastList(); }
    };

    document.getElementById('broadcast-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-broadcast-id').value;
        const isActive = document.getElementById('b-status').value === "true";
        if (isActive) await _supabase.from('notifications').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
        const payload = {
            version_tag: document.getElementById('b-tag').value,
            is_active: isActive,
            title: document.getElementById('b-title').value,
            target_page: document.getElementById('b-target').value,
            content: document.getElementById('b-content').value,
            button_text: document.getElementById('b-btn-text').value || null,
            button_link: document.getElementById('b-btn-link').value || null,
        };
        const res = id ? await _supabase.from('notifications').update(payload).eq('id', id) : await _supabase.from('notifications').insert([payload]);
        if (res.error) alert(res.error.message); else { window.resetBroadcastForm(); window.loadBroadcastList(); }
    });

    // Chargement initial
    window.loadBroadcastList();
}