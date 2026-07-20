import { build } from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { minify as minifyHtml } from 'html-minifier-terser';
import CleanCSS from 'clean-css';
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcJs = join(root, 'src', 'js', 'core.js');
const outJsDir = join(root, 'js');
const vendorDir = join(outJsDir, 'vendor');
const bundlePath = join(outJsDir, '.bundle.tmp.js');
const outJs = join(outJsDir, 'hq.js');

const RESERVED = [
  'Core', 'StorageModule', 'toggleMobileMenu', 'toggleMobileMenuIfOpen',
  'loadNewsList', 'editNews', 'resetNewsForm', 'deleteNews',
  'loadBroadcastList', 'editBroadcast', 'resetBroadcastForm', 'deleteBroadcast',
  'loadPartnersList', 'editPartner', 'resetPartnerForm', 'deletePartner'
];

// Light obfuscation — app code only (never run this on @supabase/supabase-js)
const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  identifiersPrefix: '_0x',
  numbersToExpressions: false,
  renameGlobals: false,
  reservedNames: RESERVED,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayCallsTransform: false,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
};

mkdirSync(outJsDir, { recursive: true });
mkdirSync(vendorDir, { recursive: true });

console.log('[1/5] Vendor supabase (pinned npm, no obfuscation)...');
const supabaseEntry = require.resolve('@supabase/supabase-js');
// Prefer UMD/browser build if present; else bundle the package once via esbuild
const supabaseOut = join(vendorDir, 'supabase.min.js');
await build({
  entryPoints: [supabaseEntry],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: supabaseOut,
  minify: true,
  legalComments: 'none'
});

console.log('[2/5] Bundle app (external supabase)...');
await build({
  entryPoints: [srcJs],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: bundlePath,
  minify: true,
  legalComments: 'none',
  drop: ['console'],
  external: ['@supabase/supabase-js']
});

console.log('[3/5] Obfuscation (app only)...');
const bundled = readFileSync(bundlePath, 'utf8');
const obfuscated = JavaScriptObfuscator.obfuscate(bundled, OBFUSCATOR_OPTIONS).getObfuscatedCode();
writeFileSync(outJs, obfuscated);
rmSync(bundlePath, { force: true });

console.log('[4/5] Nettoyage js/ legacy...');
for (const f of readdirSync(outJsDir)) {
  if (f === 'hq.js' || f === 'vendor') continue;
  rmSync(join(outJsDir, f), { recursive: true, force: true });
}

console.log('[5/5] Minification index.html...');
let html = readFileSync(join(root, 'src', 'index.html'), 'utf8');

const importMap = `<script type="importmap">{"imports":{"@supabase/supabase-js":"./js/vendor/supabase.min.js"}}</script>`;
if (!html.includes('type="importmap"')) {
  html = html.replace('<script type="module" src="./js/core.js"></script>', `${importMap}\n    <script type="module" src="./js/core.js"></script>`);
}
html = html.replace(/<script type="module" src="\.\/js\/core\.js"><\/script>/, '<script type="module" src="./js/hq.js"></script>');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  const minifiedCss = new CleanCSS({ level: 2 }).minify(styleMatch[1]).styles;
  html = html.replace(styleMatch[0], `<style>${minifiedCss}</style>`);
}

const minified = await minifyHtml(html, {
  collapseWhitespace: true,
  removeComments: true,
  removeAttributeQuotes: true,
  removeRedundantAttributes: true,
  minifyCSS: true,
  minifyJS: true,
  sortAttributes: true,
  sortClassName: true
});

writeFileSync(join(root, 'index.html'), minified);

const rawSize = readdirSync(join(root, 'src', 'js')).reduce((n, f) => n + readFileSync(join(root, 'src', 'js', f), 'utf8').length, 0);
const outSize = readFileSync(outJs, 'utf8').length;
const vendorSize = readFileSync(supabaseOut, 'utf8').length;
console.log(`Done. src/js ~${rawSize} chars → hq.js ${outSize} + vendor ${vendorSize} chars`);
