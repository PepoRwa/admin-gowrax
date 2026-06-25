import { build } from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { minify as minifyHtml } from 'html-minifier-terser';
import CleanCSS from 'clean-css';
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const srcJs = join(root, 'src', 'js', 'core.js');
const outJsDir = join(root, 'js');
const bundlePath = join(outJsDir, '.bundle.tmp.js');
const outJs = join(outJsDir, 'hq.js');

const RESERVED = [
  'Core', 'StorageModule', '_G_TK', 'toggleMobileMenu', 'toggleMobileMenuIfOpen',
  'loadNewsList', 'editNews', 'resetNewsForm', 'deleteNews',
  'loadBroadcastList', 'editBroadcast', 'resetBroadcastForm', 'deleteBroadcast',
  'loadPartnersList', 'editPartner', 'resetPartnerForm', 'deletePartner',
  'supabase'
];

const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.15,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  identifiersPrefix: '_0x',
  numbersToExpressions: true,
  renameGlobals: false,
  reservedNames: RESERVED,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 4,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 1,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 3,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 1,
  transformObjectKeys: true,
  unicodeEscapeSequence: true
};

mkdirSync(outJsDir, { recursive: true });

console.log('[1/4] Bundle esbuild...');
await build({
  entryPoints: [srcJs],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: bundlePath,
  minify: true,
  legalComments: 'none',
  drop: ['console']
});

console.log('[2/4] Obfuscation...');
const bundled = readFileSync(bundlePath, 'utf8');
const obfuscated = JavaScriptObfuscator.obfuscate(bundled, OBFUSCATOR_OPTIONS).getObfuscatedCode();
writeFileSync(outJs, obfuscated);
rmSync(bundlePath);

console.log('[3/4] Nettoyage js/ legacy...');
for (const f of readdirSync(outJsDir)) {
  if (f !== 'hq.js') rmSync(join(outJsDir, f));
}

console.log('[4/4] Minification index.html...');
let html = readFileSync(join(root, 'src', 'index.html'), 'utf8');

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
console.log(`Done. src/js ~${rawSize} chars → js/hq.js ${outSize} chars (obfusqué)`);
