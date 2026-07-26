/** Escape text for safe insertion into HTML. */
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Safe attribute value (quotes escaped). */
export function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

const ALLOWED_BROADCAST_TAGS = new Set([
    'B', 'I', 'EM', 'STRONG', 'BR', 'P', 'A', 'UL', 'OL', 'LI', 'SPAN', 'DIV'
]);

/**
 * Sanitize broadcast HTML: allowlist tags, strip scripts/handlers,
 * keep only safe http(s)/relative hrefs on anchors.
 */
export function sanitizeBroadcastHtml(dirty) {
    const doc = new DOMParser().parseFromString(String(dirty ?? ''), 'text/html');
    const walk = (node) => {
        const children = [...node.childNodes];
        for (const child of children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName;
                if (!ALLOWED_BROADCAST_TAGS.has(tag)) {
                    child.replaceWith(...child.childNodes);
                    continue;
                }
                [...child.attributes].forEach((attr) => {
                    const name = attr.name.toLowerCase();
                    if (name.startsWith('on') || name === 'style') {
                        child.removeAttribute(attr.name);
                        return;
                    }
                    if (tag === 'A' && name === 'href') {
                        const href = attr.value.trim();
                        const ok =
                            href.startsWith('https://') ||
                            href.startsWith('http://') ||
                            href.startsWith('/') ||
                            href.startsWith('#');
                        if (!ok) child.removeAttribute('href');
                        else {
                            child.setAttribute('rel', 'noopener noreferrer');
                            child.setAttribute('target', '_blank');
                        }
                        return;
                    }
                    if (tag !== 'A' || name !== 'href') {
                        child.removeAttribute(attr.name);
                    }
                });
                walk(child);
            } else if (child.nodeType === Node.COMMENT_NODE) {
                child.remove();
            }
        }
    };
    walk(doc.body);
    return doc.body.innerHTML;
}

const ALLOWED_UPLOAD_EXT = new Set([
    'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf'
]);
const ALLOWED_UPLOAD_MIME = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/svg+xml', 'application/pdf'
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateUploadFile(file) {
    if (!file) return 'Choisis un fichier.';
    if (file.size > MAX_UPLOAD_BYTES) return 'Fichier trop volumineux (max 5 Mo).';
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_UPLOAD_EXT.has(ext)) {
        return 'Extension non autorisée (jpg, png, webp, gif, svg, pdf).';
    }
    if (file.type && !ALLOWED_UPLOAD_MIME.has(file.type)) {
        return 'Type MIME non autorisé.';
    }
    return null;
}

export function safeHttpsUrl(url) {
    try {
        const u = new URL(String(url || ''), window.location.origin);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
        return u.href;
    } catch {
        return '';
    }
}

/** Relative `/path` or http(s) — blocks `//`, javascript:, data: */
export function safeSiteHref(url) {
    const t = String(url || '').trim();
    if (!t) return '';
    if (t.startsWith('/') && !t.startsWith('//')) return t;
    return safeHttpsUrl(t);
}
