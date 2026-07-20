import { _supabase } from './core.js';
import { sanitizeBroadcastHtml } from './security-utils.js';

export function getHTML() {
    return `
    <section id="view-broadcast" class="view-section">
        <header class="mb-10">
            <h3 class="font-heading text-xl font-bold tracking-tight text-lavender">Broadcast</h3>
            <p id="broadcast-form-status" class="font-mono text-[9px] uppercase text-content-muted">Nouvelle alerte</p>
        </header>
        <form id="broadcast-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-broadcast-id" value="">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input type="text" id="b-tag" placeholder="VERSION TAG (Ex: v1-tournoi)" class="admin-input" required>
                <select id="b-status" class="admin-input font-bold">
                    <option value="false" class="text-gray-500">DÉSACTIVÉ (Caché)</option>
                    <option value="true" class="text-green-500">ACTIF (En ligne)</option>
                </select>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input type="text" id="b-title" placeholder="TITRE (Ex: Mise à jour Système)" class="admin-input" required>
                <select id="b-target" class="admin-input">
                    <option value="ALL">CIBLE: TOUTES LES PAGES</option>
                    <option value="/contact/">CIBLE: PAGE CONTACT</option>
                    <option value="/roster/">CIBLE: PAGES ROSTERS</option>
                    <option value="/join/">CIBLE: RECRUTEMENT</option>
                </select>
            </div>
            <p class="mt-2 font-mono text-[10px] text-lavender">HTML simple autorisé (b, i, a, p, ul…). Scripts et handlers retirés à l'enregistrement.</p>
            <textarea id="b-content" rows="6" placeholder="Message du pop-up..." class="admin-input" required></textarea>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 border-t border-white/5 pt-4">
                <input type="text" id="b-btn-text" placeholder="TEXTE DU BOUTON (Optionnel)" class="admin-input">
                <input type="url" id="b-btn-link" placeholder="LIEN DU BOUTON (https://...)" class="admin-input">
            </div>
            <div class="flex gap-4 mt-6">
                <button type="submit" id="broadcast-submit-btn" class="btn-pub flex-1">Publier_Alerte</button>
                <button type="button" id="broadcast-cancel-btn" class="btn-cancel hidden" onclick="window.resetBroadcastForm()">Annuler</button>
            </div>
        </form>
        <div class="mt-20">
            <h4 class="mb-6 border-b border-line pb-2 font-mono text-[10px] uppercase tracking-widest text-lavender">// Alertes</h4>
            <div id="broadcast-list" class="space-y-2"></div>
        </div>
    </section>
    `;
}

export function init() {
    window.loadBroadcastList = async function () {
        const { data: notifs } = await _supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });
        const list = document.getElementById('broadcast-list');
        list.replaceChildren();
        if (!notifs) return;

        notifs.forEach((n) => {
            const div = document.createElement('div');
            div.className =
                'flex justify-between items-center rounded-xl border border-line bg-surface-elevated p-3 transition group hover:border-lavender/40';

            const left = document.createElement('div');
            left.className = 'cursor-pointer flex-1';
            left.addEventListener('click', () => window.editBroadcast(n.id));

            const title = document.createElement('span');
            title.className = 'font-heading text-xs font-semibold text-content group-hover:text-lavender';
            title.textContent = n.title;

            const status = document.createElement('span');
            status.className = `ml-2 font-mono text-[9px] font-bold uppercase ${n.is_active ? 'text-mint-dark' : 'text-content-muted'}`;
            status.textContent = `[${n.is_active ? 'ACTIF' : 'INACTIF'}]`;

            const tag = document.createElement('span');
            tag.className = 'ml-2 font-mono text-[9px] text-content-muted';
            tag.textContent = `TAG: ${n.version_tag}`;

            left.append(title, status, tag);

            const del = document.createElement('button');
            del.className = 'font-mono text-[8px] font-bold uppercase text-rose hover:text-content';
            del.textContent = '[ Supprimer ]';
            del.addEventListener('click', () => window.deleteBroadcast(n.id));

            div.append(left, del);
            list.appendChild(div);
        });
    };

    window.editBroadcast = async function (id) {
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
            document.getElementById('broadcast-submit-btn').innerText = 'Mettre_à_jour_Alerte';
            document.getElementById('broadcast-cancel-btn').classList.remove('hidden');
        }
    };

    window.resetBroadcastForm = function () {
        document.getElementById('broadcast-form').reset();
        document.getElementById('editing-broadcast-id').value = '';
        document.getElementById('broadcast-submit-btn').innerText = 'Publier_Alerte';
        document.getElementById('broadcast-cancel-btn').classList.add('hidden');
    };

    window.deleteBroadcast = async function (id) {
        if (confirm("Supprimer l'alerte ?")) {
            await _supabase.from('notifications').delete().eq('id', id);
            window.loadBroadcastList();
        }
    };

    document.getElementById('broadcast-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-broadcast-id').value;
        const isActive = document.getElementById('b-status').value === 'true';
        if (isActive) {
            await _supabase
                .from('notifications')
                .update({ is_active: false })
                .neq('id', '00000000-0000-0000-0000-000000000000');
        }

        let buttonLink = document.getElementById('b-btn-link').value.trim() || null;
        if (buttonLink) {
            try {
                const u = new URL(buttonLink, window.location.origin);
                if (u.protocol !== 'https:' && u.protocol !== 'http:') buttonLink = null;
                else buttonLink = u.href;
            } catch {
                buttonLink = null;
            }
        }

        const payload = {
            version_tag: document.getElementById('b-tag').value,
            is_active: isActive,
            title: document.getElementById('b-title').value,
            target_page: document.getElementById('b-target').value,
            content: sanitizeBroadcastHtml(document.getElementById('b-content').value),
            button_text: document.getElementById('b-btn-text').value || null,
            button_link: buttonLink,
        };
        const res = id
            ? await _supabase.from('notifications').update(payload).eq('id', id)
            : await _supabase.from('notifications').insert([payload]);
        if (res.error) alert(res.error.message);
        else {
            window.resetBroadcastForm();
            window.loadBroadcastList();
        }
    });

    window.loadBroadcastList();
}
