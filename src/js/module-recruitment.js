import { _supabase, triggerSiteDeploy } from './core.js';
import { safeSiteHref } from './security-utils.js';

const STATUS = ['open', 'urgent', 'soon', 'closed'];
const ACCENTS = ['ether', 'neon', 'gold', 'lavender'];

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function getHTML() {
  return `
  <section id="view-recruitment" class="view-section">
    <header class="panel-header">
      <p class="panel-kicker">Contenu</p>
      <h3 class="panel-title">Recrutements</h3>
      <p id="recruit-form-status" class="panel-desc">Intro de page et postes ouverts</p>
    </header>

    <form id="recruit-settings-form" class="mb-12 max-w-3xl space-y-4">
      <h4 class="section-label">Intro de la page</h4>
      <textarea id="rec-intro" rows="4" class="admin-input" required></textarea>
      <input id="rec-apply-default" class="admin-input" placeholder="URL candidature par défaut" required>
      <button type="submit" class="btn-pub">Enregistrer l’intro</button>
    </form>

    <div class="mb-8 flex max-w-4xl items-center justify-between">
      <h4 class="section-label mb-0 border-0 pb-0">Catégories & postes</h4>
      <button type="button" id="rec-add-cat" class="font-heading text-sm font-semibold text-mint hover:underline">+ Catégorie</button>
    </div>
    <div id="recruit-cats" class="max-w-4xl space-y-8"></div>

    <form id="recruit-cat-form" class="mt-10 hidden max-w-3xl space-y-3 rounded-2xl border border-line bg-surface-elevated/50 p-5">
      <input type="hidden" id="rec-cat-id" value="">
      <h4 class="font-heading text-base font-semibold text-content" id="rec-cat-form-title">Nouvelle catégorie</h4>
      <div class="grid gap-3 md:grid-cols-2">
        <input id="rec-cat-slug" class="admin-input" placeholder="slug (valorant)" required pattern="[a-z0-9-]+">
        <input id="rec-cat-name" class="admin-input" placeholder="Nom" required>
        <input id="rec-cat-tagline" class="admin-input md:col-span-2" placeholder="Accroche">
        <input id="rec-cat-logo" class="admin-input" placeholder="Logo (/assets/…)">
        <select id="rec-cat-accent" class="admin-input">
          ${ACCENTS.map((a) => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <input id="rec-cat-order" class="admin-input" type="number" value="0" placeholder="Ordre">
        <label class="flex items-center gap-2 font-sans text-sm text-content-muted">
          <input type="checkbox" id="rec-cat-active" checked> Active
        </label>
      </div>
      <div class="flex gap-3">
        <button type="submit" class="btn-pub flex-1">Enregistrer la catégorie</button>
        <button type="button" id="rec-cat-cancel" class="btn-cancel">Annuler</button>
      </div>
    </form>

    <form id="recruit-pos-form" class="mt-8 hidden max-w-3xl space-y-3 rounded-2xl border border-line bg-surface-elevated/50 p-5">
      <input type="hidden" id="rec-pos-id" value="">
      <input type="hidden" id="rec-pos-cat" value="">
      <h4 class="font-heading text-base font-semibold text-content" id="rec-pos-form-title">Nouveau poste</h4>
      <input id="rec-pos-title" class="admin-input" placeholder="Titre du poste" required>
      <div class="grid gap-3 md:grid-cols-3">
        <input id="rec-pos-type" class="admin-input" placeholder="Type (Staff…)" required>
        <select id="rec-pos-status" class="admin-input">
          ${STATUS.map((s) => {
            const labels = { open: 'Ouvert', urgent: 'Urgent', soon: 'Bientôt', closed: 'Fermé' };
            return `<option value="${s}">${labels[s] || s}</option>`;
          }).join('')}
        </select>
        <input id="rec-pos-order" class="admin-input" type="number" value="0" placeholder="Ordre">
      </div>
      <textarea id="rec-pos-desc" rows="3" class="admin-input" placeholder="Description" required></textarea>
      <textarea id="rec-pos-reqs" rows="4" class="admin-input font-mono text-xs" placeholder="Exigences (une par ligne)"></textarea>
      <input id="rec-pos-apply" class="admin-input" placeholder="URL postuler (optionnel)">
      <div class="flex gap-3">
        <button type="submit" class="btn-pub flex-1">Enregistrer le poste</button>
        <button type="button" id="rec-pos-cancel" class="btn-cancel">Annuler</button>
      </div>
    </form>
  </section>`;
}

export function init() {
  const statusEl = document.getElementById('recruit-form-status');
  let categories = [];
  let positions = [];

  async function afterMutate(okMsg) {
    statusEl.textContent = 'Publication…';
    const deploy = await triggerSiteDeploy();
    statusEl.textContent = deploy.ok
      ? `${okMsg} — site en rebuild (~2 min)`
      : `${okMsg} — deploy non déclenché`;
  }

  window.loadRecruitment = async function () {
    const [s, c, p] = await Promise.all([
      _supabase.from('recruitment_settings').select('*').eq('id', 1).maybeSingle(),
      _supabase.from('recruitment_categories').select('*').order('sort_order'),
      _supabase.from('recruitment_positions').select('*').order('sort_order'),
    ]);
    if (s.data) {
      document.getElementById('rec-intro').value = s.data.intro || '';
      document.getElementById('rec-apply-default').value = s.data.apply_default || '/contact/join/';
    }
    categories = c.data || [];
    positions = p.data || [];
    renderCats();
  };

  function renderCats() {
    const root = document.getElementById('recruit-cats');
    root.replaceChildren();
    categories.forEach((cat) => {
      const wrap = document.createElement('div');
      wrap.className = 'space-y-3 rounded-2xl border border-line bg-surface-elevated/40 p-5';
      const head = document.createElement('div');
      head.className = 'flex flex-wrap items-center justify-between gap-2';
      const title = document.createElement('div');
      title.innerHTML = `<p class="font-heading text-base font-semibold text-content">${esc(cat.name)}</p>
        <p class="font-sans text-xs text-content-muted">${esc(cat.slug)} · ${cat.is_active ? 'active' : 'désactivée'}</p>`;
      const actions = document.createElement('div');
      actions.className = 'flex gap-2';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'font-heading text-xs font-semibold text-lavender hover:underline';
      edit.textContent = 'Éditer';
      edit.addEventListener('click', () => window.editRecruitCat(cat.id));
      const addPos = document.createElement('button');
      addPos.type = 'button';
      addPos.className = 'font-heading text-xs font-semibold text-mint hover:underline';
      addPos.textContent = '+ Poste';
      addPos.addEventListener('click', () => window.newRecruitPos(cat.id));
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-ghost-danger';
      del.textContent = 'Suppr. cat.';
      del.addEventListener('click', () => window.deleteRecruitCat(cat.id));
      actions.append(edit, addPos, del);
      head.append(title, actions);
      wrap.appendChild(head);

      const posList = positions.filter((p) => p.category_id === cat.id);
      posList.forEach((pos) => {
        const row = document.createElement('div');
        row.className =
          'flex items-center justify-between gap-2 rounded-xl border border-line/60 bg-surface-elevated px-3 py-2.5';
        const left = document.createElement('div');
        left.innerHTML = `<span class="font-heading text-sm text-content">${esc(pos.title)}</span>
          <span class="ml-2 font-sans text-xs text-content-muted">${esc(pos.type)} · ${esc(pos.status)}</span>`;
        const right = document.createElement('div');
        right.className = 'flex shrink-0 gap-2';
        const eb = document.createElement('button');
        eb.type = 'button';
        eb.className = 'font-heading text-xs font-semibold text-lavender hover:underline';
        eb.textContent = 'Éditer';
        eb.addEventListener('click', () => window.editRecruitPos(pos.id));
        const db = document.createElement('button');
        db.type = 'button';
        db.className = 'btn-ghost-danger';
        db.textContent = 'Suppr.';
        db.addEventListener('click', () => window.deleteRecruitPos(pos.id));
        right.append(eb, db);
        row.append(left, right);
        wrap.appendChild(row);
      });
      if (!posList.length) {
        const empty = document.createElement('p');
        empty.className = 'font-sans text-sm text-content-muted';
        empty.textContent = 'Aucun poste — candidature spontanée sur le site.';
        wrap.appendChild(empty);
      }
      root.appendChild(wrap);
    });
  }

  document.getElementById('recruit-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apply = safeSiteHref(document.getElementById('rec-apply-default').value);
    if (!apply) {
      alert('URL apply invalide');
      return;
    }
    const payload = {
      intro: document.getElementById('rec-intro').value.trim(),
      apply_default: apply,
      updated_at: new Date().toISOString(),
    };
    const { error } = await _supabase.from('recruitment_settings').upsert({ id: 1, ...payload });
    if (error) {
      alert(error.message);
      return;
    }
    await afterMutate('Intro enregistrée');
  });

  document.getElementById('rec-add-cat')?.addEventListener('click', () => {
    document.getElementById('recruit-cat-form').classList.remove('hidden');
    document.getElementById('rec-cat-id').value = '';
    document.getElementById('rec-cat-form-title').textContent = 'Nouvelle catégorie';
    document.getElementById('rec-cat-slug').disabled = false;
    document.getElementById('recruit-cat-form').reset();
    document.getElementById('rec-cat-active').checked = true;
  });

  document.getElementById('rec-cat-cancel')?.addEventListener('click', () => {
    document.getElementById('recruit-cat-form').classList.add('hidden');
  });

  window.editRecruitCat = function (id) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    const form = document.getElementById('recruit-cat-form');
    form.classList.remove('hidden');
    document.getElementById('rec-cat-form-title').textContent = `Éditer · ${cat.slug}`;
    document.getElementById('rec-cat-id').value = cat.id;
    document.getElementById('rec-cat-slug').value = cat.slug;
    document.getElementById('rec-cat-slug').disabled = true;
    document.getElementById('rec-cat-name').value = cat.name;
    document.getElementById('rec-cat-tagline').value = cat.tagline || '';
    document.getElementById('rec-cat-logo').value = cat.logo || '';
    document.getElementById('rec-cat-accent').value = cat.accent || 'lavender';
    document.getElementById('rec-cat-order').value = cat.sort_order ?? 0;
    document.getElementById('rec-cat-active').checked = !!cat.is_active;
    form.scrollIntoView({ behavior: 'smooth' });
  };

  document.getElementById('recruit-cat-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('rec-cat-id').value;
    const logoRaw = document.getElementById('rec-cat-logo').value.trim();
    const logo = logoRaw ? safeSiteHref(logoRaw) : null;
    if (logoRaw && !logo) {
      alert('Logo URL invalide');
      return;
    }
    const payload = {
      slug: document.getElementById('rec-cat-slug').value.trim(),
      name: document.getElementById('rec-cat-name').value.trim(),
      tagline: document.getElementById('rec-cat-tagline').value.trim(),
      logo,
      accent: document.getElementById('rec-cat-accent').value,
      sort_order: Number(document.getElementById('rec-cat-order').value) || 0,
      is_active: document.getElementById('rec-cat-active').checked,
    };
    const res = id
      ? await _supabase.from('recruitment_categories').update(payload).eq('id', id)
      : await _supabase.from('recruitment_categories').insert([payload]);
    if (res.error) {
      alert(res.error.message);
      return;
    }
    document.getElementById('recruit-cat-form').classList.add('hidden');
    await window.loadRecruitment();
    await afterMutate('Catégorie enregistrée');
  });

  window.deleteRecruitCat = async function (id) {
    if (!confirm('Supprimer la catégorie et ses postes ?')) return;
    const { error } = await _supabase.from('recruitment_categories').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    await window.loadRecruitment();
    await afterMutate('Catégorie supprimée');
  };

  window.newRecruitPos = function (catId) {
    const form = document.getElementById('recruit-pos-form');
    form.classList.remove('hidden');
    form.reset();
    document.getElementById('rec-pos-id').value = '';
    document.getElementById('rec-pos-cat').value = catId;
    document.getElementById('rec-pos-form-title').textContent = 'Nouveau poste';
    document.getElementById('rec-pos-status').value = 'urgent';
    form.scrollIntoView({ behavior: 'smooth' });
  };

  window.editRecruitPos = function (id) {
    const pos = positions.find((p) => p.id === id);
    if (!pos) return;
    const form = document.getElementById('recruit-pos-form');
    form.classList.remove('hidden');
    document.getElementById('rec-pos-id').value = pos.id;
    document.getElementById('rec-pos-cat').value = pos.category_id;
    document.getElementById('rec-pos-title').value = pos.title;
    document.getElementById('rec-pos-type').value = pos.type;
    document.getElementById('rec-pos-status').value = pos.status;
    document.getElementById('rec-pos-order').value = pos.sort_order ?? 0;
    document.getElementById('rec-pos-desc').value = pos.description || '';
    document.getElementById('rec-pos-reqs').value = (pos.requirements || []).join('\n');
    document.getElementById('rec-pos-apply').value = pos.apply_url || '';
    document.getElementById('rec-pos-form-title').textContent = 'Éditer poste';
    form.scrollIntoView({ behavior: 'smooth' });
  };

  document.getElementById('rec-pos-cancel')?.addEventListener('click', () => {
    document.getElementById('recruit-pos-form').classList.add('hidden');
  });

  document.getElementById('recruit-pos-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('rec-pos-id').value;
    const applyRaw = document.getElementById('rec-pos-apply').value.trim();
    const apply_url = applyRaw ? safeSiteHref(applyRaw) : null;
    if (applyRaw && !apply_url) {
      alert('URL postuler invalide');
      return;
    }
    const payload = {
      category_id: document.getElementById('rec-pos-cat').value,
      title: document.getElementById('rec-pos-title').value.trim(),
      type: document.getElementById('rec-pos-type').value.trim(),
      status: document.getElementById('rec-pos-status').value,
      description: document.getElementById('rec-pos-desc').value.trim(),
      requirements: document
        .getElementById('rec-pos-reqs')
        .value.split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      apply_url,
      sort_order: Number(document.getElementById('rec-pos-order').value) || 0,
    };
    const res = id
      ? await _supabase.from('recruitment_positions').update(payload).eq('id', id)
      : await _supabase.from('recruitment_positions').insert([payload]);
    if (res.error) {
      alert(res.error.message);
      return;
    }
    document.getElementById('recruit-pos-form').classList.add('hidden');
    await window.loadRecruitment();
    await afterMutate('Poste enregistré');
  });

  window.deleteRecruitPos = async function (id) {
    if (!confirm('Supprimer ce poste ?')) return;
    const { error } = await _supabase.from('recruitment_positions').delete().eq('id', id);
    if (error) {
      alert(error.message);
      return;
    }
    await window.loadRecruitment();
    await afterMutate('Poste supprimé');
  };

  window.loadRecruitment();
}
