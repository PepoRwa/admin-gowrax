import { _supabase, triggerSiteDeploy } from './core.js';

export function getHTML() {
    return `
    <section id="view-news" class="view-section">
        <header class="panel-header">
            <p class="panel-kicker">Contenu</p>
            <h3 class="panel-title">Actualités</h3>
            <p id="news-form-status" class="panel-desc">Nouveau rapport</p>
        </header>
        <form id="news-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-news-id" value="">
            <input type="text" id="n-title" placeholder="Titre du rapport" class="admin-input text-lg" required>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input type="text" id="n-slug" placeholder="Slug URL" class="admin-input" required>
                <input type="text" id="n-tags" placeholder="Tags (séparés par des virgules)" class="admin-input">
            </div>
            <input type="url" id="n-image" placeholder="URL image bannière" class="admin-input">
            <textarea id="n-content" rows="10" placeholder="Contenu Markdown…" class="admin-input font-mono text-xs" required></textarea>
            <div class="flex gap-4">
                <button type="submit" id="news-submit-btn" class="btn-pub flex-1">Publier</button>
                <button type="button" id="news-cancel-btn" class="btn-cancel hidden" onclick="window.resetNewsForm()">Annuler</button>
            </div>
        </form>
        <div class="mt-16 max-w-3xl">
            <h4 class="section-label">Archives</h4>
            <div id="news-list" class="space-y-2"></div>
        </div>
    </section>
    `;
}

export function init() {
    window.loadNewsList = async function () {
        const { data: posts } = await _supabase.from('posts').select('id, title, slug').order('created_at', { ascending: false });
        const list = document.getElementById('news-list');
        list.replaceChildren();
        if (!posts) return;

        posts.forEach((p) => {
            const div = document.createElement('div');
            div.className =
                'flex justify-between items-center rounded-xl border border-line bg-surface-elevated p-3 transition group hover:border-lavender/40';

            const edit = document.createElement('div');
            edit.className = 'cursor-pointer flex-1';
            edit.addEventListener('click', () => window.editNews(p.id));
            const title = document.createElement('span');
            title.className = 'font-heading text-xs font-semibold text-content group-hover:text-lavender';
            title.textContent = p.title;
            edit.appendChild(title);

            const del = document.createElement('button');
            del.className = 'btn-ghost-danger';
            del.textContent = 'Supprimer';
            del.addEventListener('click', () => window.deleteNews(p.id));

            div.append(edit, del);
            list.appendChild(div);
        });
    };

    window.editNews = async function (id) {
        const { data: p } = await _supabase.from('posts').select('*').eq('id', id).single();
        if (p) {
            document.getElementById('editing-news-id').value = p.id;
            document.getElementById('n-title').value = p.title;
            document.getElementById('n-slug').value = p.slug;
            document.getElementById('n-tags').value = (p.tags || []).join(', ');
            document.getElementById('n-image').value = p.image_url || '';
            document.getElementById('n-content').value = p.content;
            document.getElementById('news-submit-btn').innerText = 'Mettre à jour';
            document.getElementById('news-cancel-btn').classList.remove('hidden');
        }
    };

    window.resetNewsForm = function () {
        document.getElementById('news-form').reset();
        document.getElementById('editing-news-id').value = '';
        document.getElementById('news-submit-btn').innerText = 'Publier';
        document.getElementById('news-cancel-btn').classList.add('hidden');
    };

    window.deleteNews = async function (id) {
        if (confirm('Supprimer news ?')) {
            const { error } = await _supabase.from('posts').delete().eq('id', id);
            if (error) {
                alert(error.message);
                return;
            }
            window.loadNewsList();
            triggerSiteDeploy().then((r) => {
                if (r.ok) document.getElementById('news-form-status').textContent = 'Deploy site lancé (~2 min)';
            });
        }
    };

    document.getElementById('news-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusEl = document.getElementById('news-form-status');
        const id = document.getElementById('editing-news-id').value;
        const payload = {
            title: document.getElementById('n-title').value,
            slug: document.getElementById('n-slug').value,
            image_url: document.getElementById('n-image').value,
            tags: document.getElementById('n-tags').value.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean),
            content: document.getElementById('n-content').value,
        };
        const res = id
            ? await _supabase.from('posts').update(payload).eq('id', id)
            : await _supabase.from('posts').insert([payload]);
        if (res.error) {
            alert(res.error.message);
            return;
        }
        window.resetNewsForm();
        window.loadNewsList();
        statusEl.textContent = 'Deploy en cours…';
        const deploy = await triggerSiteDeploy();
        statusEl.textContent = deploy.ok
            ? 'Rapport enregistré — site en rebuild (~2 min)'
            : 'Rapport OK — deploy non déclenché (voir config Supabase/GitHub)';
    });

    window.loadNewsList();
}
