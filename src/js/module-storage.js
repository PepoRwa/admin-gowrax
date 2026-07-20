import { _supabase } from './core.js';
import { validateUploadFile } from './security-utils.js';

export function getHTML() {
    return `
    <section id="view-storage" class="view-section">
        <header class="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
                <h3 class="text-xl font-bold uppercase italic tracking-tight text-[#22c55e]">Cloud_Storage</h3>
                <p class="text-[9px] text-gray-500 uppercase">Gowrax Assets / Documents & Images</p>
                <div class="mt-2 flex items-center gap-2 text-xs font-mono text-gray-300">
                    <span class="text-[#22c55e]">Chemin : </span> 
                    <span id="storage-breadcrumb" class="bg-gray-800 px-2 py-1 rounded">/</span>
                    <button onclick="window.StorageModule.goUp()" id="storage-up-btn" class="hidden text-gray-400 hover:text-white transition-colors bg-gray-800 px-2 py-1">⬅️ Retour</button>
                </div>
            </div>
            <button onclick="window.StorageModule.openUploadModal()" class="btn-pub !bg-[#22c55e] text-black">Uploader Fichier</button>
        </header>

        <div id="storage-container" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        </div>
    </section>

    <div id="storage-upload-modal" class="fixed inset-0 bg-black/90 z-[200] hidden items-center justify-center p-4">
        <div class="bg-[#0a0a0f] border border-[#22c55e]/30 p-6 max-w-lg w-full relative">
            <h3 class="text-[#22c55e] uppercase tracking-widest mb-4">Uploader Document</h3>
            <p class="text-[9px] text-gray-500 mb-3 uppercase">jpg / png / webp / gif / svg / pdf — max 5 Mo</p>
            <input type="file" id="storage-file-input" accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf" class="w-full mb-4 text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-bold file:bg-[#22c55e]/20 file:text-[#22c55e] hover:file:bg-[#22c55e]/30">
            <div class="flex gap-4">
                <button onclick="window.StorageModule.uploadFile()" id="storage-upload-btn" class="btn-pub !bg-[#22c55e] text-black flex-1">Envoyer</button>
                <button onclick="window.StorageModule.closeUploadModal()" class="btn-cancel">Annuler</button>
            </div>
        </div>
    </div>

    <div id="storage-picker-modal" class="fixed inset-0 bg-black/80 z-[300] hidden items-center justify-center p-4 md:p-10 backdrop-blur-sm">
        <div class="bg-[#0a0a0f] border border-[#22c55e]/40 w-full max-w-7xl max-h-[90vh] flex flex-col p-6 relative shadow-2xl">
            <div class="flex justify-between items-center mb-6 border-b border-[#22c55e]/20 pb-4">
                <h2 class="text-[#22c55e] text-xl uppercase font-bold tracking-widest">// SELECTRIX_ASSET</h2>
                <button onclick="window.StorageModule.closePicker()" class="text-gray-500 hover:text-red-500 text-3xl leading-none">&times;</button>
            </div>
            <div class="flex justify-end mb-4">
                <input type="file" id="storage-picker-upload" accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.pdf,image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf" class="hidden" onchange="window.StorageModule.uploadFromPicker(event)">
                <button onclick="document.getElementById('storage-picker-upload').click()" class="border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-colors text-[10px] px-3 py-1 uppercase font-bold">Dépôt Rapide</button>
            </div>
            <div id="storage-picker-grid" class="flex-1 overflow-y-auto grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-3 pb-8 pr-2 custom-scrollbar">
            </div>
        </div>
    </div>
    `;
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function buildFileCard({ name, isFolder, isImg, pubUrl, fullPath, onOpenFolder, onCopy, onDl, onRename, onDel }) {
    const card = el('div', isFolder
        ? 'bg-[#0f101a] border border-gray-800 p-2 group hover:border-[#22c55e] transition-colors relative cursor-pointer flex flex-col items-center justify-center'
        : 'bg-[#0f101a] border border-gray-800 p-2 group hover:border-[#22c55e] transition-colors relative flex flex-col');

    if (isFolder) {
        card.addEventListener('click', onOpenFolder);
        const icon = el('div', 'aspect-square w-full bg-black mb-2 flex items-center justify-center text-4xl', '📁');
        const label = el('p', 'text-[10px] text-[#22c55e] truncate mb-2 w-full text-center font-bold');
        label.textContent = name;
        label.title = name;
        card.append(icon, label);
        return card;
    }

    const preview = el('div', 'aspect-square bg-black mb-2 overflow-hidden flex items-center justify-center');
    if (isImg && pubUrl) {
        const img = document.createElement('img');
        img.src = pubUrl;
        img.alt = '';
        img.className = 'w-full h-full object-cover';
        preview.appendChild(img);
    } else {
        preview.appendChild(el('div', 'text-xs text-gray-500 uppercase', '📄 Doc'));
    }

    const label = el('p', 'text-[10px] text-gray-400 truncate mb-2');
    label.textContent = name;
    label.title = name;

    const actions = el('div', 'grid grid-cols-2 gap-1 mt-auto text-[8px] uppercase');
    const mkBtn = (labelText, handler, hover) => {
        const b = el('button', `bg-gray-800 ${hover} text-white py-1 truncate`, labelText);
        b.addEventListener('click', handler);
        return b;
    };
    actions.append(
        mkBtn('Copier', onCopy, 'hover:bg-[#22c55e] hover:text-black'),
        mkBtn('DL', onDl, 'hover:bg-blue-400 hover:text-black'),
        mkBtn('Move', onRename, 'hover:bg-yellow-500 hover:text-black'),
        mkBtn('Del', onDel, 'hover:bg-red-500')
    );

    card.append(preview, label, actions);
    return card;
}

export function init() {
    window.StorageModule = {
        bucket: 'public_assets',
        pickerCallback: null,
        currentPath: '',

        async fetchFiles(path = '') {
            this.currentPath = path;
            this.updateBreadcrumb();

            try {
                const { data, error } = await _supabase.storage.from(this.bucket).list(this.currentPath);
                if (error) throw error;
                this.renderFiles(data || []);
            } catch (err) {
                const msg = err?.message || '';
                if (msg.includes('bucket not found') || msg.includes('The resource was not found')) {
                    const p = el('p', 'text-red-500 col-span-full');
                    p.textContent = '⚠️ Le bucket "public_assets" n\'existe pas sur Supabase.';
                    document.getElementById('storage-container').replaceChildren(p);
                } else {
                    console.error('Storage error:', err);
                }
            }
        },

        updateBreadcrumb() {
            const breadcrumb = document.getElementById('storage-breadcrumb');
            const upBtn = document.getElementById('storage-up-btn');
            breadcrumb.textContent = '/' + this.currentPath;
            upBtn.classList.toggle('hidden', this.currentPath === '');
        },

        goUp() {
            if (this.currentPath === '') return;
            const parts = this.currentPath.split('/');
            parts.pop();
            this.fetchFiles(parts.join('/'));
        },

        openFolder(folderName) {
            const newPath = this.currentPath === '' ? folderName : `${this.currentPath}/${folderName}`;
            this.fetchFiles(newPath);
        },

        renderFiles(files) {
            const container = document.getElementById('storage-container');
            const validFiles = files.filter((f) => f.name !== '.emptyFolderPlaceholder');

            if (validFiles.length === 0) {
                container.replaceChildren(el('p', 'text-gray-600 text-xs', 'Dossier vide.'));
                return;
            }

            container.replaceChildren(
                ...validFiles.map((f) => {
                    const isFolder = f.id === null;
                    if (isFolder) {
                        return buildFileCard({
                            name: f.name,
                            isFolder: true,
                            onOpenFolder: () => this.openFolder(f.name),
                        });
                    }
                    const fullPath = this.currentPath === '' ? f.name : `${this.currentPath}/${f.name}`;
                    const pubUrl = _supabase.storage.from(this.bucket).getPublicUrl(fullPath).data.publicUrl;
                    const isImg = f.metadata?.mimetype?.startsWith('image/');
                    return buildFileCard({
                        name: f.name,
                        isFolder: false,
                        isImg,
                        pubUrl,
                        fullPath,
                        onCopy: () => this.copyLink(pubUrl),
                        onDl: () => this.downloadFile(fullPath, f.name),
                        onRename: () => this.renameFile(fullPath),
                        onDel: () => this.deleteFile(fullPath),
                    });
                })
            );
        },

        async uploadFile() {
            const input = document.getElementById('storage-file-input');
            const file = input.files[0];
            const validationError = validateUploadFile(file);
            if (validationError) return alert(validationError);

            const btn = document.getElementById('storage-upload-btn');
            btn.textContent = 'ENVOI...';
            btn.disabled = true;

            const fileExt = file.name.split('.').pop().toLowerCase();
            const cleanOriginalName = file.name
                .replace(new RegExp(`\\.${fileExt}$`, 'i'), '')
                .replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${cleanOriginalName}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const fullPath = this.currentPath === '' ? fileName : `${this.currentPath}/${fileName}`;

            const { error } = await _supabase.storage.from(this.bucket).upload(fullPath, file, {
                contentType: file.type || undefined,
            });

            btn.textContent = 'Envoyer';
            btn.disabled = false;

            if (error) alert('Erreur upload: ' + error.message);
            else {
                this.closeUploadModal();
                this.fetchFiles(this.currentPath);
            }
        },

        async copyLink(url) {
            await navigator.clipboard.writeText(url);
            alert('Lien copié dans le presse-papier !');
        },

        async deleteFile(name) {
            if (!confirm(`Supprimer définitivement ${name} ?`)) return;
            const { error } = await _supabase.storage.from(this.bucket).remove([name]);
            if (error) alert('Erreur: ' + error.message);
            else this.fetchFiles(this.currentPath);
        },

        async renameFile(oldPath) {
            const newPath = prompt('Modifier le nom ou le chemin du fichier (ex: Dossier/nom.png) :', oldPath);
            if (!newPath || newPath === oldPath) return;
            const { error } = await _supabase.storage.from(this.bucket).move(oldPath, newPath);
            if (error) alert('Erreur lors du déplacement : ' + error.message);
            else this.fetchFiles(this.currentPath);
        },

        async downloadFile(path, fileName) {
            const { data, error } = await _supabase.storage.from(this.bucket).download(path);
            if (error) {
                alert('Erreur de téléchargement: ' + error.message);
                return;
            }
            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        openUploadModal() {
            document.getElementById('storage-upload-modal').classList.remove('hidden');
            document.getElementById('storage-upload-modal').classList.add('flex');
        },
        closeUploadModal() {
            document.getElementById('storage-upload-modal').classList.add('hidden');
            document.getElementById('storage-upload-modal').classList.remove('flex');
            document.getElementById('storage-file-input').value = '';
        },

        openPicker(callback) {
            this.pickerCallback = callback;
            document.getElementById('storage-picker-modal').classList.remove('hidden');
            document.getElementById('storage-picker-modal').classList.add('flex');
            this.loadPickerFiles(this.currentPath);
        },

        closePicker() {
            document.getElementById('storage-picker-modal').classList.add('hidden');
            document.getElementById('storage-picker-modal').classList.remove('flex');
            this.pickerCallback = null;
        },

        async loadPickerFiles(path = '') {
            const grid = document.getElementById('storage-picker-grid');
            grid.replaceChildren(el('p', 'text-gray-500', 'Chargement...'));
            try {
                const { data, error } = await _supabase.storage.from(this.bucket).list(path);
                if (error) throw error;
                const validFiles = (data || []).filter((f) => f.name !== '.emptyFolderPlaceholder');

                grid.replaceChildren();

                if (path !== '') {
                    const upBtn = el('div', 'col-span-full mb-4');
                    const parentPath = path.split('/').slice(0, -1).join('/');
                    const btn = el('button', 'bg-gray-800 text-white px-3 py-1 text-xs hover:bg-[#22c55e] hover:text-black transition-colors', '⬅️ Dossier Parent');
                    btn.addEventListener('click', () => this.loadPickerFiles(parentPath));
                    upBtn.appendChild(btn);
                    grid.appendChild(upBtn);
                }

                if (validFiles.length === 0) {
                    grid.appendChild(el('p', 'text-gray-500 text-xs', 'Dossier vide.'));
                    return;
                }

                validFiles.forEach((f) => {
                    const isFolder = f.id === null;
                    if (isFolder) {
                        const card = el(
                            'div',
                            'bg-[#0f101a] border border-gray-800 p-1 md:p-2 cursor-pointer hover:border-[#22c55e] transition-colors relative flex flex-col items-center justify-center rounded overflow-hidden'
                        );
                        card.addEventListener('click', () =>
                            this.loadPickerFiles(path === '' ? f.name : `${path}/${f.name}`)
                        );
                        card.append(
                            el('div', 'aspect-square w-full bg-black mb-1 flex items-center justify-center text-xl md:text-3xl', '📁')
                        );
                        const label = el('p', 'text-[8px] md:text-[9px] text-[#22c55e] font-bold w-full text-center truncate');
                        label.textContent = f.name;
                        label.title = f.name;
                        card.appendChild(label);
                        grid.appendChild(card);
                        return;
                    }

                    const fullPath = path === '' ? f.name : `${path}/${f.name}`;
                    const pubUrl = _supabase.storage.from(this.bucket).getPublicUrl(fullPath).data.publicUrl;
                    const isImg = f.metadata?.mimetype?.startsWith('image/');
                    const card = el(
                        'div',
                        'bg-[#0f101a] border border-gray-800 p-1 md:p-2 cursor-pointer hover:border-[#22c55e] transition-colors relative rounded overflow-hidden group'
                    );
                    card.addEventListener('click', () => this.selectFromPicker(pubUrl));
                    const preview = el('div', 'aspect-square bg-black mb-1 overflow-hidden flex items-center justify-center relative');
                    if (isImg) {
                        const img = document.createElement('img');
                        img.src = pubUrl;
                        img.alt = '';
                        img.className = 'w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity';
                        preview.appendChild(img);
                    } else {
                        preview.appendChild(el('div', 'text-[9px] text-gray-500 uppercase', '📄 Doc'));
                    }
                    const label = el('p', 'text-[8px] md:text-[9px] text-gray-400 text-center truncate');
                    label.textContent = f.name;
                    label.title = f.name;
                    card.append(preview, label);
                    grid.appendChild(card);
                });
            } catch (e) {
                grid.replaceChildren(el('p', 'text-red-500 text-xs', 'Erreur ou bucket inexistant.'));
            }
        },

        selectFromPicker(url) {
            if (this.pickerCallback) this.pickerCallback(url);
            this.closePicker();
        },

        async uploadFromPicker(event) {
            const file = event.target.files[0];
            const validationError = validateUploadFile(file);
            if (validationError) {
                alert(validationError);
                event.target.value = '';
                return;
            }
            const fileExt = file.name.split('.').pop().toLowerCase();
            const cleanOriginalName = file.name
                .replace(new RegExp(`\\.${fileExt}$`, 'i'), '')
                .replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${cleanOriginalName}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const fullPath = this.currentPath === '' ? fileName : `${this.currentPath}/${fileName}`;

            const btnTag = event.target.nextElementSibling;
            const oldText = btnTag.innerText;
            btnTag.innerText = 'UPLOAD EN COURS...';

            const { error } = await _supabase.storage.from(this.bucket).upload(fullPath, file, {
                contentType: file.type || undefined,
            });

            btnTag.innerText = oldText;
            event.target.value = '';

            if (error) alert('Erreur upload: ' + error.message);
            else {
                const pubUrl = _supabase.storage.from(this.bucket).getPublicUrl(fullPath).data.publicUrl;
                this.selectFromPicker(pubUrl);
                this.fetchFiles(this.currentPath);
            }
        },

        injectStorageButtonsInForms() {
            const urlInputs = document.querySelectorAll(
                'input[type="url"], input[id*="image"], input[id*="img"], input[id*="logo"], input[id*="banner"], input[placeholder*="URL"], input[placeholder*="IMAGE"]'
            );

            urlInputs.forEach((input) => {
                if (input.nextElementSibling?.classList.contains('storage-injector-btn')) return;

                input.style.flex = '1';

                const wrapper = document.createElement('div');
                wrapper.className = 'flex gap-2 items-center w-full';
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className =
                    'storage-injector-btn border border-[#22c55e] text-[#22c55e] px-3 py-2 text-[10px] uppercase font-bold hover:bg-[#22c55e] hover:text-black transition-colors min-w-max';
                btn.textContent = '📁 SUPABASE';
                btn.onclick = (e) => {
                    e.preventDefault();
                    window.StorageModule.openPicker((url) => {
                        input.value = url;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                };

                wrapper.appendChild(btn);
            });
        },
    };

    const obs = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
            if (m.attributeName === 'class') {
                const elView = document.getElementById('view-storage');
                if (elView?.classList.contains('active')) {
                    window.StorageModule.fetchFiles();
                }
            }
        });
    });
    obs.observe(document.getElementById('view-storage'), { attributes: true });

    setTimeout(() => {
        window.StorageModule.injectStorageButtonsInForms();
    }, 1000);
}
