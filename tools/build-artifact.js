#!/usr/bin/env node
/*
 * Costruisce dist/artifact.html: la stessa app di `index`, ma completamente
 * autonoma (nessuna richiesta di rete), pronta per essere pubblicata come
 * Artifact su claude.ai.
 *
 * Cosa cambia rispetto a `index`:
 *   1. Tailwind dalla CDN  -> CSS compilato e messo inline
 *   2. Font Awesome da CDN -> icone SVG inline
 *   3. <html>/<head>/<body> -> rimossi (li fornisce l'host dell'Artifact);
 *      le classi del <body> passano su un wrapper <div>
 *
 * Uso:  npm install && npm run build
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'index.html');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(DIST, 'artifact.html');
const TMP = path.join(DIST, '.build');
const FA = path.join(ROOT, 'node_modules/@fortawesome/fontawesome-free/svgs/solid');

fs.mkdirSync(TMP, { recursive: true });

let html = fs.readFileSync(SRC, 'utf8');

/* --- 1. Icone Font Awesome -> SVG inline ---------------------------------- */

const cache = {};
function icon(name) {
  if (!cache[name]) {
    const svg = fs.readFileSync(path.join(FA, `${name}.svg`), 'utf8');
    const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
    const d = svg.match(/<path d="([^"]+)"/)[1];
    const [, , w, h] = viewBox.split(' ').map(Number);
    cache[name] = { viewBox, d, width: (w / h).toFixed(4) };
  }
  return cache[name];
}

// Un'icona costruita per interpolazione non e' riscrivibile con una
// sostituzione testuale: meglio dirlo qui che fallire poi su un file mancante.
const interpolata = html.match(/fa-[a-z-]*\$\{|fa-solid[^"]*\$\{/);
if (interpolata) {
  throw new Error(`icona costruita per interpolazione vicino a "${interpolata[0]}": rendila markup letterale`);
}

let icons = 0;
html = html.replace(/<i class="fa-solid fa-([a-z-]+)([^"]*)"><\/i>/g, (_, name, rest) => {
  const ic = icon(name);
  icons++;
  return `<svg class="${`fa-svg ${rest.trim()}`.trim()}" style="width:${ic.width}em" `
    + `viewBox="${ic.viewBox}" fill="currentColor" aria-hidden="true"><path d="${ic.d}"/></svg>`;
});
if (/fa-solid/.test(html)) throw new Error('rimaste icone Font Awesome non convertite');

/* --- 2. Estrae il contenuto del body -------------------------------------- */

const bodyTag = html.match(/<body class="([^"]*)">/);
if (!bodyTag) throw new Error('tag <body> non trovato in index');
const bodyClasses = bodyTag[1];

let body = html.slice(html.indexOf(bodyTag[0]) + bodyTag[0].length);
body = body.slice(0, body.lastIndexOf('</body>')).trim();

/* --- 3. Verifica che l'app gestisca da sola lo storage negato ------------- */

// L'iframe dell'Artifact puo' negare localStorage: index.html incapsula gia'
// l'accesso in `store` con fallback in memoria. Qui si controlla soltanto che
// quella protezione non sia stata rimossa per sbaglio.
if (!/const store = \(\(\) => \{/.test(body) || /\blocalStorage\.(getItem|setItem)\('fantastrategy/.test(body)) {
  throw new Error('index.html deve accedere allo storage tramite lo shim `store`');
}

const wrapped = `<div class="${bodyClasses}">\n${body}\n</div>\n`;
const scanFile = path.join(TMP, 'scan.html');
fs.writeFileSync(scanFile, wrapped);

/* --- 4. Compila Tailwind sulle classi effettivamente usate ---------------- */

fs.writeFileSync(path.join(TMP, 'tailwind.config.js'),
  `module.exports = { content: ['${scanFile}'], theme: { extend: {} }, plugins: [] };\n`);
fs.writeFileSync(path.join(TMP, 'input.css'),
  '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');

execFileSync(path.join(ROOT, 'node_modules/.bin/tailwindcss'), [
  '-c', path.join(TMP, 'tailwind.config.js'),
  '-i', path.join(TMP, 'input.css'),
  '-o', path.join(TMP, 'tailwind.css'),
  '--minify'
], { stdio: ['ignore', 'ignore', 'inherit'] });

const tailwindCss = fs.readFileSync(path.join(TMP, 'tailwind.css'), 'utf8');

/* --- 5. Assembla la pagina finale ----------------------------------------- */

const page = `<title>FantaStrategy Pro</title>
<style>
${tailwindCss}
</style>
<style>
  /* Interfaccia volutamente a tema unico (scuro): i colori sono dichiarati
     esplicitamente perche' l'host dell'Artifact dipinge il proprio sfondo. */
  :root { color-scheme: dark; }
  html, body { background: #020617; color: #f1f5f9; }

  /* Sostituto delle icone <i> di Font Awesome: si dimensiona sul font. */
  .fa-svg { display: inline-block; height: 1em; vertical-align: -0.125em; flex-shrink: 0; }

  :where(button, input, select, a):focus-visible {
    outline: 2px solid #818cf8;
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
  }
</style>
${wrapped}`;

fs.writeFileSync(OUT, page);
fs.rmSync(TMP, { recursive: true, force: true });

console.log(`icone inline:      ${icons}`);
console.log(`tailwind css:      ${(tailwindCss.length / 1024).toFixed(1)} KB`);
console.log(`scritto:           ${path.relative(ROOT, OUT)} (${(page.length / 1024).toFixed(1)} KB)`);
