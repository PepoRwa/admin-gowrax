import { _supabase, markSiteDirty } from './core.js';
import { safeHttpsUrl, safeSiteHref } from './security-utils.js';
import { AGENT_OPTIONS, agentName, agentPortraitUrl } from './agents-catalog.js';

function agentSelectHtml(selected) {
  const opts = ['<option value="">— Aucun —</option>']
    .concat(
      AGENT_OPTIONS.map(
        (a) =>
          `<option value="${a.id}" ${a.id === selected ? 'selected' : ''}>${a.name}</option>`,
      ),
    )
    .join('');
  return `<select class="admin-input r-agent">${opts}</select>`;
}

function staffRow(s = {}) {
  return `<div class="r-staff-row grid gap-2 rounded-xl border border-line bg-surface-elevated/50 p-3 md:grid-cols-4">
    <input class="admin-input r-staff-name" placeholder="Nom" value="${esc(s.name || '')}">
    <input class="admin-input r-staff-role" placeholder="Rôle" value="${esc(s.role || '')}">
    <input class="admin-input r-staff-flag" placeholder="Drapeau (fr)" value="${esc(s.flag || '')}">
    <input class="admin-input r-staff-twitch" placeholder="URL Twitch" value="${esc(s.socials?.twitch || '')}">
    <input class="admin-input r-staff-twitter md:col-span-3" placeholder="URL Twitter / X" value="${esc(s.socials?.twitter || '')}">
    <button type="button" class="btn-ghost-danger justify-self-start" data-remove-staff>Retirer</button>
  </div>`;
}

function playerRow(p = {}) {
  const preview = p.agentId
    ? `<button type="button" class="r-agent-preview-btn shrink-0 rounded-lg border border-line bg-black/20 p-1 transition hover:border-lavender/50" data-agent-id="${esc(p.agentId)}" title="Agrandir l’aperçu">
        <img src="${agentPortraitUrl(p.agentId)}" alt="" class="r-agent-preview h-12 w-10 object-contain pointer-events-none">
      </button>`
    : '<span class="r-agent-preview text-xs text-content-muted">—</span>';
  return `<div class="r-player-row space-y-2 rounded-xl border border-line bg-surface-elevated/50 p-3">
    <div class="grid gap-2 md:grid-cols-4">
      <input class="admin-input r-player-pseudo" placeholder="Pseudo" value="${esc(p.pseudo || '')}">
      <input class="admin-input r-player-role" placeholder="Rôle" value="${esc(p.role || '')}">
      <input class="admin-input r-player-flag" placeholder="Drapeau" value="${esc(p.flag || '')}">
      <div class="flex items-center gap-2">${agentSelectHtml(p.agentId || '')}${preview}</div>
    </div>
    <div class="grid gap-2 md:grid-cols-3">
      <input class="admin-input r-player-twitter" placeholder="URL Twitter / X" value="${esc(p.socials?.twitter || '')}">
      <input class="admin-input r-player-twitch" placeholder="URL Twitch" value="${esc(p.socials?.twitch || '')}">
      <input class="admin-input r-player-img" placeholder="Image custom (optionnel)" value="${esc(p.agentImg || '')}">
    </div>
    <button type="button" class="btn-ghost-danger" data-remove-player>Retirer le joueur</button>
  </div>`;
}

function achRow(a = {}) {
  const labels = { played: 'Joué', win: 'Victoire', upcoming: 'À venir', ongoing: 'En cours' };
  return `<div class="r-ach-row grid gap-2 rounded-xl border border-line bg-surface-elevated/50 p-3 md:grid-cols-4">
    <input class="admin-input r-ach-name md:col-span-2" placeholder="Compétition" value="${esc(a.name || '')}">
    <input class="admin-input r-ach-result" placeholder="Résultat" value="${esc(a.result || '')}">
    <select class="admin-input r-ach-status">
      ${['played', 'win', 'upcoming', 'ongoing']
        .map((s) => `<option value="${s}" ${a.status === s ? 'selected' : ''}>${labels[s]}</option>`)
        .join('')}
    </select>
    <button type="button" class="btn-ghost-danger justify-self-start" data-remove-ach>Retirer</button>
  </div>`;
}

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

export function getHTML() {
  return `
  <section id="view-roster" class="view-section">
    <header class="panel-header">
      <p class="panel-kicker">Contenu</p>
      <h3 class="panel-title">Rosters</h3>
      <p id="roster-form-status" class="panel-desc">Enregistrer en DB, puis Publier sur le site</p>
    </header>
    <div id="roster-list" class="mb-10 max-w-3xl space-y-2"></div>
    <div id="agent-preview-modal" class="fixed inset-0 z-[250] hidden items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="agent-preview-title">
      <div class="relative w-full max-w-sm rounded-2xl border border-line bg-surface-elevated p-6 text-center">
        <button type="button" id="agent-preview-close" class="absolute right-3 top-3 min-h-11 min-w-11 text-2xl leading-none text-content-muted hover:text-rose" aria-label="Fermer">&times;</button>
        <h3 id="agent-preview-title" class="mb-4 font-heading text-lg font-bold text-content">Agent</h3>
        <img id="agent-preview-img" src="" alt="" class="mx-auto max-h-72 w-auto object-contain">
        <p id="agent-preview-error" class="mt-4 hidden font-sans text-sm text-rose">Image indisponible</p>
      </div>
    </div>
    <form id="roster-form" class="hidden max-w-4xl space-y-4">
      <input type="hidden" id="r-slug" value="">
      <div class="grid gap-4 md:grid-cols-2">
        <input id="r-title" class="admin-input" placeholder="Titre (ex. VALORANT)" required>
        <input id="r-subtitle" class="admin-input" placeholder="Sous-titre" required>
        <input id="r-hub-name" class="admin-input" placeholder="Nom hub" required>
        <input id="r-hub-game" class="admin-input" placeholder="Jeu hub" required>
        <input id="r-hub-status" class="admin-input" placeholder="Statut hub">
        <select id="r-hub-badge" class="admin-input">
          <option value="lavender">Badge lavande</option>
          <option value="mint">Badge menthe</option>
          <option value="gold">Badge or</option>
          <option value="rose">Badge rose</option>
        </select>
        <input id="r-hub-href" class="admin-input" placeholder="/roster/…/" required>
        <label class="flex items-center gap-2 font-sans text-sm text-content-muted">
          <input type="checkbox" id="r-locked"> Roster verrouillé
        </label>
        <label class="flex items-center gap-2 font-sans text-sm text-content-muted">
          <input type="checkbox" id="r-published" checked> Publié
        </label>
      </div>
      <textarea id="r-description" rows="4" class="admin-input" placeholder="Description"></textarea>
      <div>
        <div class="mb-2 flex items-center justify-between">
          <h4 class="section-label mb-0 border-0 pb-0">Staff</h4>
          <button type="button" id="r-add-staff" class="font-heading text-sm font-semibold text-mint hover:underline">+ Staff</button>
        </div>
        <div id="r-staff-list" class="space-y-2"></div>
      </div>
      <div>
        <div class="mb-2 flex items-center justify-between">
          <h4 class="section-label mb-0 border-0 pb-0">Joueurs</h4>
          <button type="button" id="r-add-player" class="font-heading text-sm font-semibold text-mint hover:underline">+ Joueur</button>
        </div>
        <div id="r-player-list" class="space-y-2"></div>
      </div>
      <div>
        <div class="mb-2 flex items-center justify-between">
          <h4 class="section-label mb-0 border-0 pb-0">Palmarès</h4>
          <button type="button" id="r-add-ach" class="font-heading text-sm font-semibold text-mint hover:underline">+ Résultat</button>
        </div>
        <div id="r-ach-list" class="space-y-2"></div>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        <input id="r-recruit-label" class="admin-input" placeholder="Bandeau recrutement (label)">
        <input id="r-recruit-detail" class="admin-input" placeholder="Détail recrutement">
        <input id="r-recruit-url" class="admin-input" placeholder="URL candidature (/recrutements/)">
        <input id="r-recruit-slots" class="admin-input" type="number" min="0" placeholder="Places ouvertes">
      </div>
      <div class="flex gap-4">
        <button type="submit" class="btn-pub flex-1">Enregistrer la division</button>
        <button type="button" id="roster-cancel-btn" class="btn-cancel">Annuler</button>
      </div>
    </form>
  </section>`;
}

function collectStaff() {
  return [...document.querySelectorAll('.r-staff-row')].map((row) => {
    const socials = {};
    const twitch = safeHttpsUrl(row.querySelector('.r-staff-twitch')?.value);
    const twitter = safeHttpsUrl(row.querySelector('.r-staff-twitter')?.value);
    if (twitch) socials.twitch = twitch;
    if (twitter) socials.twitter = twitter;
    return {
      name: row.querySelector('.r-staff-name')?.value.trim() || '',
      role: row.querySelector('.r-staff-role')?.value.trim() || '',
      flag: row.querySelector('.r-staff-flag')?.value.trim() || undefined,
      socials,
    };
  }).filter((s) => s.name);
}

function collectPlayers() {
  return [...document.querySelectorAll('.r-player-row')].map((row) => {
    const socials = {};
    const twitch = safeHttpsUrl(row.querySelector('.r-player-twitch')?.value);
    const twitter = safeHttpsUrl(row.querySelector('.r-player-twitter')?.value);
    if (twitch) socials.twitch = twitch;
    if (twitter) socials.twitter = twitter;
    const agentId = row.querySelector('.r-agent')?.value || undefined;
    const agentImg = safeHttpsUrl(row.querySelector('.r-player-img')?.value) || undefined;
    return {
      pseudo: row.querySelector('.r-player-pseudo')?.value.trim() || '',
      role: row.querySelector('.r-player-role')?.value.trim() || '',
      flag: row.querySelector('.r-player-flag')?.value.trim() || undefined,
      socials,
      agentId: agentId || undefined,
      agentImg: agentId ? undefined : agentImg,
    };
  }).filter((p) => p.pseudo);
}

function collectAchievements() {
  return [...document.querySelectorAll('.r-ach-row')].map((row) => ({
    name: row.querySelector('.r-ach-name')?.value.trim() || '',
    result: row.querySelector('.r-ach-result')?.value.trim() || '',
    status: row.querySelector('.r-ach-status')?.value || 'played',
  })).filter((a) => a.name);
}

export function init() {
  const form = document.getElementById('roster-form');
  const statusEl = document.getElementById('roster-form-status');

  window.loadRosterList = async function () {
    const { data, error } = await _supabase
      .from('roster_divisions')
      .select('slug, hub_name, hub_game, is_published, sort_order')
      .order('sort_order', { ascending: true });
    const list = document.getElementById('roster-list');
    list.replaceChildren();
    if (error) {
      statusEl.textContent = error.message;
      return;
    }
    (data || []).forEach((d) => {
      const div = document.createElement('div');
      div.className =
        'flex justify-between items-center rounded-xl border border-line bg-surface-elevated p-3';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flex-1 text-left font-heading text-sm font-semibold text-content hover:text-lavender';
      btn.textContent = `${d.hub_name} · ${d.hub_game}${d.is_published ? '' : ' (brouillon)'}`;
      btn.addEventListener('click', () => window.editRoster(d.slug));
      div.appendChild(btn);
      list.appendChild(div);
    });
  };

  window.editRoster = async function (slug) {
    const { data: d, error } = await _supabase.from('roster_divisions').select('*').eq('slug', slug).single();
    if (error || !d) {
      alert(error?.message || 'Introuvable');
      return;
    }
    form.classList.remove('hidden');
    document.getElementById('r-slug').value = d.slug;
    document.getElementById('r-title').value = d.title || '';
    document.getElementById('r-subtitle').value = d.subtitle || '';
    document.getElementById('r-hub-name').value = d.hub_name || '';
    document.getElementById('r-hub-game').value = d.hub_game || '';
    document.getElementById('r-hub-status').value = d.hub_status || '';
    document.getElementById('r-hub-badge').value = d.hub_badge || 'lavender';
    document.getElementById('r-hub-href').value = d.hub_href || '';
    document.getElementById('r-locked').checked = !!d.roster_locked;
    document.getElementById('r-published').checked = d.is_published !== false;
    document.getElementById('r-description').value = d.description || '';
    document.getElementById('r-recruit-label').value = d.recruitment?.label || '';
    document.getElementById('r-recruit-detail').value = d.recruitment?.detail || '';
    document.getElementById('r-recruit-url').value = d.recruitment?.applyUrl || '';
    document.getElementById('r-recruit-slots').value = d.recruitment?.openSlots ?? '';

    const staffList = document.getElementById('r-staff-list');
    staffList.innerHTML = (d.staff || []).map(staffRow).join('') || staffRow();
    const playerList = document.getElementById('r-player-list');
    playerList.innerHTML = (d.roster || []).map(playerRow).join('') || '';
    const achList = document.getElementById('r-ach-list');
    achList.innerHTML = (d.achievements || []).map(achRow).join('') || '';
    statusEl.textContent = `Édition · ${d.slug}`;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  document.getElementById('r-add-staff')?.addEventListener('click', () => {
    document.getElementById('r-staff-list').insertAdjacentHTML('beforeend', staffRow());
  });
  document.getElementById('r-add-player')?.addEventListener('click', () => {
    document.getElementById('r-player-list').insertAdjacentHTML('beforeend', playerRow());
  });
  document.getElementById('r-add-ach')?.addEventListener('click', () => {
    document.getElementById('r-ach-list').insertAdjacentHTML('beforeend', achRow());
  });

  form?.addEventListener('click', (e) => {
    const t = e.target;
    if (t?.matches?.('[data-remove-staff]')) t.closest('.r-staff-row')?.remove();
    if (t?.matches?.('[data-remove-player]')) t.closest('.r-player-row')?.remove();
    if (t?.matches?.('[data-remove-ach]')) t.closest('.r-ach-row')?.remove();
    const previewBtn = t?.closest?.('[data-agent-id]');
    if (previewBtn) openAgentPreview(previewBtn.getAttribute('data-agent-id'));
  });

  form?.addEventListener('change', (e) => {
    if (!e.target.classList.contains('r-agent')) return;
    const wrap = e.target.parentElement;
    const id = e.target.value;
    const existing = wrap?.querySelector('.r-agent-preview-btn, .r-agent-preview');
    existing?.remove();
    if (!wrap) return;
    if (id) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'r-agent-preview-btn shrink-0 rounded-lg border border-line bg-black/20 p-1 transition hover:border-lavender/50';
      btn.dataset.agentId = id;
      btn.title = 'Agrandir l’aperçu';
      btn.innerHTML = `<img src="${agentPortraitUrl(id)}" alt="" class="r-agent-preview h-12 w-10 object-contain pointer-events-none">`;
      wrap.appendChild(btn);
    } else {
      const span = document.createElement('span');
      span.className = 'r-agent-preview text-xs text-content-muted';
      span.textContent = '—';
      wrap.appendChild(span);
    }
  });

  document.getElementById('roster-cancel-btn')?.addEventListener('click', () => {
    form.classList.add('hidden');
    form.reset();
    statusEl.textContent = 'Enregistrer en DB, puis Publier sur le site';
  });

  function openAgentPreview(agentId) {
    const modal = document.getElementById('agent-preview-modal');
    const img = document.getElementById('agent-preview-img');
    const title = document.getElementById('agent-preview-title');
    const err = document.getElementById('agent-preview-error');
    if (!modal || !img || !agentId) return;
    title.textContent = agentName(agentId) || 'Agent';
    err.classList.add('hidden');
    img.classList.remove('hidden');
    img.onerror = () => {
      img.classList.add('hidden');
      err.classList.remove('hidden');
    };
    img.onload = () => {
      img.classList.remove('hidden');
      err.classList.add('hidden');
    };
    img.src = agentPortraitUrl(agentId);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeAgentPreview() {
    const modal = document.getElementById('agent-preview-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  document.getElementById('agent-preview-close')?.addEventListener('click', closeAgentPreview);
  document.getElementById('agent-preview-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'agent-preview-modal') closeAgentPreview();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const slug = document.getElementById('r-slug').value;
    const hubHref = safeSiteHref(document.getElementById('r-hub-href').value);
    if (!hubHref) {
      alert('Hub href invalide');
      return;
    }
    const label = document.getElementById('r-recruit-label').value.trim();
    const detail = document.getElementById('r-recruit-detail').value.trim();
    const applyUrl = safeSiteHref(document.getElementById('r-recruit-url').value);
    const slotsRaw = document.getElementById('r-recruit-slots').value;
    const recruitment =
      label || detail || applyUrl || slotsRaw
        ? {
            label: label || undefined,
            detail: detail || undefined,
            applyUrl: applyUrl || undefined,
            openSlots: slotsRaw === '' ? undefined : Number(slotsRaw),
          }
        : null;

    const payload = {
      title: document.getElementById('r-title').value.trim(),
      subtitle: document.getElementById('r-subtitle').value.trim(),
      description: document.getElementById('r-description').value.trim(),
      description_html: false,
      hub_name: document.getElementById('r-hub-name').value.trim(),
      hub_game: document.getElementById('r-hub-game').value.trim(),
      hub_status: document.getElementById('r-hub-status').value.trim(),
      hub_badge: document.getElementById('r-hub-badge').value,
      hub_href: hubHref,
      roster_locked: document.getElementById('r-locked').checked,
      is_published: document.getElementById('r-published').checked,
      staff: collectStaff(),
      roster: collectPlayers(),
      achievements: collectAchievements(),
      recruitment,
      updated_at: new Date().toISOString(),
    };

    statusEl.textContent = 'Enregistrement…';
    const { error } = await _supabase.from('roster_divisions').update(payload).eq('slug', slug);
    if (error) {
      alert(error.message);
      statusEl.textContent = 'Erreur';
      return;
    }
    window.loadRosterList();
    await markSiteDirty();
    statusEl.textContent = 'Enregistré — pas encore publié sur le site';
  });

  window.loadRosterList();
}
