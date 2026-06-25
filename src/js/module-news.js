import { _supabase } from './core.js';

export function getHTML() {
    return `
    <section id="view-news" class="view-section">
        <header class="mb-10">
            <h3 class="text-xl font-bold uppercase italic tracking-tight text-magenta">News_Module</h3>
            <p id="news-form-status" class="text-[9px] text-gray-500 uppercase">Mode: Nouveau_Rapport_Tactique</p>
        </header>
        <form id="news-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-news-id" value="">
            <input type="text" id="n-title" placeholder="TITRE DU RAPPORT" class="admin-input text-lg" required>
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="n-slug" placeholder="SLUG" class="admin-input" required>
                <input type="text" id="n-tags" placeholder="TAGS (SÉPARÉS PAR VIRGULES)" class="admin-input">
            </div>
            <input type="url" id="n-image" placeholder="URL IMAGE BANNIÈRE" class="admin-input">
            <textarea id="n-content" rows="10" placeholder="# CONTENU MARKDOWN..." class="admin-input font-mono text-xs" required></textarea>
            <div class="flex gap-4">
                <button type="submit" id="news-submit-btn" class="btn-pub flex-1">Diffuser_News</button>
                <button type="button" id="news-cancel-btn" class="btn-cancel hidden" onclick="window.resetNewsForm()">Annuler</button>
            </div>
        </form>
        <div class="mt-20">
            <h4 class="text-magenta text-[10px] uppercase tracking-widest mb-6 border-b border-magenta/20 pb-2">// ARCHIVES_DES_RAPPORTS</h4>
            <div id="news-list" class="space-y-2"></div>
        </div>
    </section>
    `;
}

export function init() {
    window.loadNewsList = async function() {
        const { data: posts } = await _supabase.from('posts').select('id, title, slug').order('created_at', { ascending: false });
        const list = document.getElementById('news-list');
        list.innerHTML = '';
        if (posts) {
            posts.forEach(p => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5 hover:border-magenta/30 transition group";
                div.innerHTML = `<div class="cursor-pointer flex-1" onclick="window.editNews('${p.id}')"><span class="text-xs font-bold text-white group-hover:text-magenta">${p.title}</span></div><button onclick="window.deleteNews('${p.id}')" class="text-[8px] text-red-500 font-bold uppercase">[ Supprimer ]</button>`;
                list.appendChild(div);
            });
        }
    };

    window.editNews = async function(id) {
        const { data: p } = await _supabase.from('posts').select('*').eq('id', id).single();
        if (p) {
            document.getElementById('editing-news-id').value = p.id;
            document.getElementById('n-title').value = p.title;
            document.getElementById('n-slug').value = p.slug;
            document.getElementById('n-tags').value = (p.tags || []).join(', ');
            document.getElementById('n-image').value = p.image_url || '';
            document.getElementById('n-content').value = p.content;
            document.getElementById('news-submit-btn').innerText = "Mettre_à_jour_Rapport";
            document.getElementById('news-cancel-btn').classList.remove('hidden');
        }
    };

    window.resetNewsForm = function() {
        document.getElementById('news-form').reset();
        document.getElementById('editing-news-id').value = '';
        document.getElementById('news-submit-btn').innerText = "Diffuser_News";
        document.getElementById('news-cancel-btn').classList.add('hidden');
    };

    window.deleteNews = async function(id) {
        if (confirm("Supprimer news ?")) { await _supabase.from('posts').delete().eq('id', id); window.loadNewsList(); }
    };

    document.getElementById('news-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-news-id').value;
        const payload = {
            title: document.getElementById('n-title').value,
            slug: document.getElementById('n-slug').value,
            image_url: document.getElementById('n-image').value,
            tags: document.getElementById('n-tags').value.split(',').map(t => t.trim().toUpperCase()),
            content: document.getElementById('n-content').value
        };
        const res = id ? await _supabase.from('posts').update(payload).eq('id', id) : await _supabase.from('posts').insert([payload]);
        if (res.error) alert(res.error.message); else { window.resetNewsForm(); window.loadNewsList(); }
    });

    window.loadNewsList();
}