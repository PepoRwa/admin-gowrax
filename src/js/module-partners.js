import { _supabase, triggerSiteDeploy } from './core.js';
import { safeHttpsUrl } from './security-utils.js';

export function getHTML() {
    return `
    <section id="view-partners" class="view-section">
        <header class="panel-header">
            <p class="panel-kicker">Réseau</p>
            <h3 class="panel-title">Partenaires</h3>
            <p id="partner-form-status" class="panel-desc">Nouveau partenaire</p>
        </header>
        
        <form id="partner-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-partner-id" value="">
            
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <input type="text" id="p-name" placeholder="Nom du partenaire" class="admin-input" required>
                <select id="p-tier" class="admin-input">
                    <option value="PRIME">Tier 1 — Sponsor majeur</option>
                    <option value="OFFICIAL">Tier 2 — Partenaire officiel</option>
                    <option value="AFFILIATE" selected>Tier 3 — Affiliation</option>
                    <option value="PATRON">Tier 4 — Mécène</option>
                </select>
                <select id="p-status" class="admin-input">
                    <option value="true">Contrat actif</option>
                    <option value="false">Contrat suspendu</option>
                </select>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input type="url" id="p-logo" placeholder="URL du logo (PNG/SVG transparent)" class="admin-input" required>
                <input type="url" id="p-website" placeholder="Site web (optionnel)" class="admin-input">
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 border-t border-line pt-4">
                <input type="text" id="p-promo" placeholder="Code promo (ex. GOWRAX10)" class="admin-input">
                <input type="text" id="p-perk" placeholder="Avantage (ex. −10% boutique)" class="admin-input">
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="flex flex-col">
                    <label class="mb-1.5 font-heading text-xs font-semibold text-content-muted">Priorité (plus haut = affiché en premier)</label>
                    <input type="number" id="p-priority" placeholder="ex. 10" value="0" class="admin-input">
                </div>
                <div class="flex flex-col">
                    <label class="mb-1.5 font-heading text-xs font-semibold text-content-muted">Fin de contrat (privé)</label>
                    <input type="date" id="p-contract-end" class="admin-input">
                </div>
            </div>

            <textarea id="p-description" rows="4" placeholder="Description courte du partenariat…" class="admin-input text-sm"></textarea>
            
            <div class="flex gap-4 mt-6">
                <button type="submit" id="partner-submit-btn" class="btn-pub flex-1">Enregistrer</button>
                <button type="button" id="partner-cancel-btn" class="btn-cancel hidden" onclick="window.resetPartnerForm()">Annuler</button>
            </div>
        </form>

        <div class="mt-16 max-w-3xl">
            <h4 class="section-label">Liste</h4>
            <div id="partners-list" class="space-y-2"></div>
        </div>
    </section>
    `;
}

export function init() {
    window.loadPartnersList = async function () {
        const { data: partners } = await _supabase
            .from('partners')
            .select('*')
            .order('priority_level', { ascending: false })
            .order('created_at', { ascending: false });
        const list = document.getElementById('partners-list');
        list.replaceChildren();

        if (!partners) return;

        const today = new Date();

        partners.forEach((p) => {
            const div = document.createElement('div');
            div.className =
                'flex justify-between items-center rounded-xl border border-line bg-surface-elevated p-3 transition group hover:border-gold/40';

            const left = document.createElement('div');
            left.className = 'flex flex-1 cursor-pointer items-center';
            left.addEventListener('click', () => window.editPartner(p.id));

            const logoWrap = document.createElement('div');
            logoWrap.className =
                'mr-4 flex h-8 w-8 items-center justify-center border border-line bg-black/30 p-1';
            const logoUrl = safeHttpsUrl(p.logo_url);
            if (logoUrl) {
                const img = document.createElement('img');
                img.src = logoUrl;
                img.alt = '';
                img.className = 'max-h-full max-w-full object-contain';
                img.onerror = () => {
                    img.style.display = 'none';
                };
                logoWrap.appendChild(img);
            }

            const meta = document.createElement('div');
            const name = document.createElement('span');
            name.className = 'font-heading text-sm font-semibold text-content group-hover:text-gold';
            name.textContent = p.name;

            const tier = document.createElement('span');
            tier.className = 'ml-2 rounded-md border border-line px-1.5 py-0.5 font-sans text-[11px] text-content-muted';
            tier.textContent = p.tier;

            const status = document.createElement('span');
            status.className = `ml-2 rounded-full px-2 py-0.5 font-sans text-[11px] ${p.is_active ? 'bg-mint/15 text-mint-dark' : 'bg-white/5 text-content-muted'}`;
            status.textContent = p.is_active ? 'Actif' : 'Inactif';

            meta.append(name, tier, status);

            if (p.contract_end) {
                const endDate = new Date(p.contract_end);
                const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                const warn = document.createElement('span');
                if (diffDays < 0) {
                    warn.className =
                        'ml-3 rounded-full border border-rose/30 bg-rose/10 px-2 py-0.5 font-sans text-[11px] text-rose';
                    warn.textContent = 'Expiré';
                    meta.appendChild(warn);
                } else if (diffDays <= 30) {
                    warn.className =
                        'ml-3 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-sans text-[11px] text-gold';
                    warn.textContent = `J−${diffDays}`;
                    meta.appendChild(warn);
                }
            }

            left.append(logoWrap, meta);

            const del = document.createElement('button');
            del.className = 'btn-ghost-danger';
            del.textContent = 'Retirer';
            del.addEventListener('click', () => window.deletePartner(p.id));

            div.append(left, del);
            list.appendChild(div);
        });
    };

    window.editPartner = async function (id) {
        const { data: p } = await _supabase.from('partners').select('*').eq('id', id).single();
        if (p) {
            document.getElementById('editing-partner-id').value = p.id;
            document.getElementById('p-name').value = p.name;
            document.getElementById('p-tier').value = p.tier;
            document.getElementById('p-status').value = p.is_active.toString();
            document.getElementById('p-logo').value = p.logo_url;
            document.getElementById('p-website').value = p.website_url || '';
            document.getElementById('p-promo').value = p.promo_code || '';
            document.getElementById('p-perk').value = p.perk_desc || '';
            document.getElementById('p-priority').value = p.priority_level || 0;
            document.getElementById('p-contract-end').value = p.contract_end || '';
            document.getElementById('p-description').value = p.description || '';

            document.getElementById('partner-submit-btn').innerText = 'Mettre_à_jour_Contrat';
            document.getElementById('partner-cancel-btn').classList.remove('hidden');
        }
    };

    window.resetPartnerForm = function () {
        document.getElementById('partner-form').reset();
        document.getElementById('editing-partner-id').value = '';
        document.getElementById('partner-submit-btn').innerText = 'Signer_Contrat';
        document.getElementById('partner-cancel-btn').classList.add('hidden');
    };

    window.deletePartner = async function (id) {
        if (confirm('Rompre définitivement ce contrat de partenariat ?')) {
            const statusEl = document.getElementById('partner-form-status');
            const { error } = await _supabase.from('partners').delete().eq('id', id);
            if (error) {
                alert(error.message);
                return;
            }
            window.loadPartnersList();
            if (statusEl) statusEl.textContent = 'Deploy en cours…';
            const deploy = await triggerSiteDeploy();
            if (statusEl) {
                statusEl.textContent = deploy.ok
                    ? 'Contrat rompu — site en rebuild (~2 min)'
                    : 'Contrat rompu — deploy non déclenché (partenaires visibles quand même côté site dynamique)';
            }
        }
    };

    document.getElementById('partner-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-partner-id').value;
        const payload = {
            name: document.getElementById('p-name').value,
            tier: document.getElementById('p-tier').value,
            is_active: document.getElementById('p-status').value === 'true',
            logo_url: document.getElementById('p-logo').value,
            website_url: document.getElementById('p-website').value || null,
            promo_code: document.getElementById('p-promo').value.toUpperCase() || null,
            perk_desc: document.getElementById('p-perk').value || null,
            priority_level: parseInt(document.getElementById('p-priority').value) || 0,
            contract_end: document.getElementById('p-contract-end').value || null,
            description: document.getElementById('p-description').value || null,
        };

        const statusEl = document.getElementById('partner-form-status');
        const res = id
            ? await _supabase.from('partners').update(payload).eq('id', id)
            : await _supabase.from('partners').insert([payload]);

        if (res.error) {
            alert(res.error.message);
        } else {
            window.resetPartnerForm();
            window.loadPartnersList();
            if (statusEl) statusEl.textContent = 'Deploy en cours…';
            const deploy = await triggerSiteDeploy();
            if (statusEl) {
                statusEl.textContent = deploy.ok
                    ? 'Contrat enregistré — site en rebuild (~2 min)'
                    : 'Contrat enregistré — visible immédiatement sur le site (fetch dynamique)';
            }
        }
    });

    window.loadPartnersList();
}
