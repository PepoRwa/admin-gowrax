import { _supabase } from './core.js';

export function getHTML() {
    return `
    <section id="view-partners" class="view-section">
        <header class="mb-10">
            <h3 class="text-xl font-bold uppercase italic tracking-tight" style="color: #D4AF37;">Business_Module</h3>
            <p id="partner-form-status" class="text-[9px] text-gray-500 uppercase">Mode: Enregistrement_Nouveau_Partenaire</p>
        </header>
        
        <form id="partner-form" class="space-y-4 max-w-3xl">
            <input type="hidden" id="editing-partner-id" value="">
            
            <div class="grid grid-cols-3 gap-4">
                <input type="text" id="p-name" placeholder="NOM DU PARTENAIRE / MÉCÈNE" class="admin-input" required>
                <select id="p-tier" class="admin-input font-bold" style="color: #D4AF37;">
                    <option value="PRIME">TIER 1 : PRIME_OPERATOR (Sponsor Majeur)</option>
                    <option value="OFFICIAL">TIER 2 : OFFICIAL_LINK (Partenaire)</option>
                    <option value="AFFILIATE" selected>TIER 3 : AFFILIATE (Affiliation)</option>
                    <option value="PATRON">TIER 4 : PATRON (Mécène / Donateur)</option>
                </select>
                <select id="p-status" class="admin-input font-bold">
                    <option value="true" class="text-green-500">CONTRAT ACTIF</option>
                    <option value="false" class="text-gray-500">CONTRAT SUSPENDU</option>
                </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <input type="url" id="p-logo" placeholder="URL DU LOGO (PNG/SVG transparent recommandé)" class="admin-input" required>
                <input type="url" id="p-website" placeholder="LIEN VERS LE SITE WEB (Optionnel)" class="admin-input">
            </div>

            <div class="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <input type="text" id="p-promo" placeholder="CODE PROMO (Optionnel, ex: GOWRAX10)" class="admin-input uppercase">
                <input type="text" id="p-perk" placeholder="AVANTAGE (Optionnel, ex: -10% sur la boutique)" class="admin-input">
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col">
                    <label class="text-[8px] text-gray-500 uppercase mb-1">Niveau de priorité (Plus élevé = Affiché en 1er)</label>
                    <input type="number" id="p-priority" placeholder="Priorité (ex: 10)" value="0" class="admin-input">
                </div>
                <div class="flex flex-col">
                    <label class="text-[8px] text-gray-500 uppercase mb-1">Fin du contrat (Invisible au public)</label>
                    <input type="date" id="p-contract-end" class="admin-input" style="color: #888;">
                </div>
            </div>

            <textarea id="p-description" rows="4" placeholder="DESCRIPTION COURTE DU PARTENARIAT..." class="admin-input text-xs"></textarea>
            
            <div class="flex gap-4 mt-6">
                <button type="submit" id="partner-submit-btn" class="btn-pub flex-1 !bg-[#D4AF37] hover:!bg-white hover:!text-[#D4AF37]">Signer_Contrat</button>
                <button type="button" id="partner-cancel-btn" class="btn-cancel hidden" onclick="window.resetPartnerForm()">Annuler</button>
            </div>
        </form>

        <div class="mt-20">
            <h4 class="text-[10px] uppercase tracking-widest mb-6 border-b pb-2" style="color: #D4AF37; border-color: rgba(212, 175, 55, 0.2);">// RÉSEAU_DE_PARTENAIRES_ACTIFS</h4>
            <div id="partners-list" class="space-y-2"></div>
        </div>
    </section>
    `;
}

export function init() {
    window.loadPartnersList = async function() {
        const { data: partners } = await _supabase.from('partners').select('*').order('priority_level', { ascending: false }).order('created_at', { ascending: false });
        const list = document.getElementById('partners-list');
        list.innerHTML = '';
        
        if (partners) {
            const today = new Date();
            
            partners.forEach(p => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center bg-[#0f101a] p-3 border border-white/5 hover:border-[#D4AF37]/50 transition group";
                
                const statusColor = p.is_active ? "text-green-500" : "text-gray-600";
                
                // Calcul pour l'alerte de fin de contrat
                let warningHtml = "";
                if (p.contract_end) {
                    const endDate = new Date(p.contract_end);
                    const diffTime = endDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) {
                        warningHtml = `<span class="text-[9px] text-red-500 font-bold ml-3 bg-red-500/10 px-2 py-0.5 border border-red-500/30 animate-pulse">! EXIPRÉ</span>`;
                    } else if (diffDays <= 30) {
                        warningHtml = `<span class="text-[9px] text-[#D4AF37] font-bold ml-3 bg-[#D4AF37]/10 px-2 py-0.5 border border-[#D4AF37]/30">J-${diffDays}</span>`;
                    }
                }

                div.innerHTML = `
                    <div class="cursor-pointer flex-1 flex items-center" onclick="window.editPartner('${p.id}')">
                        <div class="w-8 h-8 bg-black/50 border border-white/10 flex items-center justify-center mr-4 p-1">
                            <img src="${p.logo_url}" class="max-w-full max-h-full object-contain" alt="logo" onerror="this.style.display='none'">
                        </div>
                        <div>
                            <span class="text-xs font-bold text-white group-hover:text-[#D4AF37] uppercase">${p.name}</span>
                            <span class="text-[9px] text-gray-500 ml-2 font-mono border border-gray-600/30 px-1">${p.tier}</span>
                            <span class="text-[9px] ${statusColor} ml-2 font-bold uppercase">[${p.is_active ? 'ACTIF' : 'INACTIF'}]</span>
                            ${warningHtml}
                        </div>
                    </div>
                    <button onclick="window.deletePartner('${p.id}')" class="text-[8px] text-red-500 hover:text-white uppercase font-bold">[ Rompre ]</button>
                `;
                list.appendChild(div);
            });
        }
    };

    window.editPartner = async function(id) {
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
            
            document.getElementById('partner-submit-btn').innerText = "Mettre_à_jour_Contrat";
            document.getElementById('partner-cancel-btn').classList.remove('hidden');
        }
    };

    window.resetPartnerForm = function() {
        document.getElementById('partner-form').reset();
        document.getElementById('editing-partner-id').value = '';
        document.getElementById('partner-submit-btn').innerText = "Signer_Contrat";
        document.getElementById('partner-cancel-btn').classList.add('hidden');
    };

    window.deletePartner = async function(id) {
        if (confirm("Rompre définitivement ce contrat de partenariat ?")) { 
            await _supabase.from('partners').delete().eq('id', id); 
            window.loadPartnersList(); 
        }
    };

    document.getElementById('partner-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editing-partner-id').value;
        const payload = {
            name: document.getElementById('p-name').value,
            tier: document.getElementById('p-tier').value,
            is_active: document.getElementById('p-status').value === "true",
            logo_url: document.getElementById('p-logo').value,
            website_url: document.getElementById('p-website').value || null,
            promo_code: document.getElementById('p-promo').value.toUpperCase() || null,
            perk_desc: document.getElementById('p-perk').value || null,
            priority_level: parseInt(document.getElementById('p-priority').value) || 0,
            contract_end: document.getElementById('p-contract-end').value || null,
            description: document.getElementById('p-description').value || null,
        };
        
        const res = id ? await _supabase.from('partners').update(payload).eq('id', id) : await _supabase.from('partners').insert([payload]);
        
        if (res.error) {
            alert(res.error.message);
        } else { 
            window.resetPartnerForm(); 
            window.loadPartnersList(); 
        }
    });

    // Chargement initial
    window.loadPartnersList();
}