/*
 * Verifiche funzionali su dist/artifact.html (la versione autonoma, quindi
 * senza dipendenze di rete). Copre il motore del budget caso per caso, la
 * salvaguardia del credito per slot, filtri, persistenza e griglia.
 *
 * Uso:  npm run build && npm test
 *       CHROMIUM_PATH=/percorso/chrome npm test   (se serve un binario preciso)
 */

const { chromium } = require('playwright');
const fs = require('fs');

const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'fantastrategy-'));
const content = fs.readFileSync(path.join(ROOT, 'dist/artifact.html'), 'utf8');
fs.writeFileSync(`${OUT}/app.html`,
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`
  + `<style>:root{color-scheme:light}body{margin:0;background:#faf9f5;color:#141413}</style></head><body>${content}</body></html>`);

let fallite = 0;
function check(nome, atteso, ottenuto) {
  const ok = JSON.stringify(atteso) === JSON.stringify(ottenuto);
  if (!ok) fallite++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${nome}${ok ? '' : `\n         atteso ${JSON.stringify(atteso)}, ottenuto ${JSON.stringify(ottenuto)}`}`);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errori = [];
  page.on('pageerror', e => errori.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errori.push('CONSOLE: ' + m.text()); });
  const rete = [];
  page.on('request', r => { if (!r.url().startsWith('file:')) rete.push(r.url()); });

  await page.goto('file://' + OUT + '/app.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });

  const m = () => page.evaluate(() => ({
    residuo: +document.getElementById('m-residuo').textContent,
    slot: +document.getElementById('m-slot').textContent,
    maxA: +document.getElementById('m-max-a').textContent,
    maxC: +document.getElementById('m-max-c').textContent,
    capienza: +document.getElementById('m-capienza').textContent,
    speso: +document.getElementById('m-speso').textContent,
    badge: document.getElementById('badge-ruoli').textContent
  }));

  console.log('\n— stato iniziale —');
  const s0 = await m();
  check('crediti residui', 500, s0.residuo);
  check('capienza massima (500 - 23 slot vuoti)', 477, s0.capienza);
  check('max attacco (quota A 250 - 5 altri slot A)', 245, s0.maxA);
  check('max centrocampo (quota C 150 - 7 altri slot C)', 143, s0.maxC);
  check('righe in tabella (listone ufficiale)', 457, await page.evaluate(() => document.querySelectorAll('#tabella tr').length));

  // Prezzo consigliato del miglior attaccante: deve stare dentro il max di reparto
  const prezzoTop = await page.evaluate(() => {
    const r = [...document.querySelectorAll('#tabella tr')].find(tr => tr.textContent.includes('Martinez L.'));
    return +r.querySelector('[data-prezzo]').dataset.prezzo;
  });
  check('prezzo consigliato Lautaro <= max attacco', true, prezzoTop > 0 && prezzoTop <= s0.maxA);

  console.log('\n— acquisto portiere a 4 cr (sotto il piano di 25) —');
  page.on('dialog', d => d.accept(String(globalThis.__prezzo ?? 1)));
  await page.evaluate(() => { window.prompt = () => '4'; });
  await page.click('#tabella tr:first-child [data-compra]');
  const s1 = await m();
  check('residuo', 496, s1.residuo);
  check('slot occupati', 1, s1.slot);
  check('capienza (496 - 22)', 474, s1.capienza);
  check('max attacco invariato: il piano P non e\' stato sforato', 245, s1.maxA);

  console.log('\n— correzione dello stesso acquisto a 30 cr (sopra il piano) —');
  await page.evaluate(() => { window.prompt = () => '30'; });
  await page.click('[data-correggi="0"]');
  const s2 = await m();
  check('residuo', 470, s2.residuo);
  check('capienza (470 - 22)', 448, s2.capienza);
  check('max attacco ridotto dal delta', true, s2.maxA < 245);
  const quotaPesaurita = await page.evaluate(() => {
    const r = [...document.querySelectorAll('#tabella tr')].find(tr => tr.textContent.includes('Blocco Bologna'));
    return +r.querySelector('[data-prezzo]').dataset.prezzo;
  });
  check('secondo portiere scende a 1 cr: budget P esaurito', 1, quotaPesaurita);

  console.log('\n— salvaguardia: offerta oltre la capienza —');
  await page.evaluate(() => { window.prompt = () => '9999'; });
  await page.click('#tabella tr:nth-child(2) [data-compra]');
  const s3 = await m();
  check('acquisto rifiutato, slot invariati', 1, s3.slot);
  check('residuo invariato', 470, s3.residuo);

  console.log('\n— reparto completo —');
  await page.evaluate(() => { window.prompt = () => '1'; });
  await page.click('#tabella tr:nth-child(2) [data-compra]');
  check('due portieri presi', 2, (await m()).slot);
  await page.click('#tabella tr:nth-child(3) [data-compra]');
  check('terzo portiere rifiutato', 2, (await m()).slot);
  check('badge ruoli', '2/2 P • 0/8 D • 0/8 C • 0/6 A', (await m()).badge);

  console.log('— reparto chiuso: la quota P era gia\' esaurita, nulla da liberare —');
  const s4 = await m();
  check('max attacco invariato dopo il 2o portiere a 1 cr', s2.maxA, s4.maxA);

  console.log('\n— riallocazione vera: due portieri sotto il piano —');
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => { window.prompt = () => '1'; });
  await page.click('#tabella tr:first-child [data-compra]');
  await page.click('#tabella tr:nth-child(2) [data-compra]');
  const s4b = await m();
  check('2 portieri a 1 cr: speso', 2, s4b.speso);
  check('i 23 cr non spesi sui portieri alzano il max attacco', 257, s4b.maxA);
  check('capienza (498 - 21 slot vuoti)', 477, s4b.capienza);

  console.log('\n— filtri e ricerca —');
  await page.click('[data-ruolo="D"]');
  check('solo difensori', 176, await page.evaluate(() => document.querySelectorAll('#tabella tr').length));
  await page.click('[data-ruolo="ALL"]');
  await page.click('[data-tag="TOP"]');
  const nRig = await page.evaluate(() => document.querySelectorAll('#tabella tr').length);
  check('filtro top non vuoto', true, nRig > 0 && nRig < 457);
  await page.click('[data-tag="ALL"]');
  await page.fill('#ricerca', 'napoli');
  const nNap = await page.evaluate(() => document.querySelectorAll('#tabella tr').length);
  check('ricerca "napoli" non vuota', true, nNap > 0 && nNap < 457);
  await page.fill('#ricerca', '');

  console.log('\n— fasce e prezzo di mercato —');
  const mercato = await page.evaluate(() => {
    const riga = n => [...document.querySelectorAll('#tabella tr')].find(tr => tr.textContent.includes(n));
    const leggi = n => {
      const t = riga(n).textContent;
      return { fascia: (t.match(/(\dª fascia)/) || [])[1], mercato: (t.match(/mercato (\d+)–(\d+)/) || []).slice(1, 3).map(Number) };
    };
    return { lautaro: leggi('Martinez L.'), dimarco: leggi('Dimarco'), gallo: leggi('Gallo') };
  });
  check('Lautaro in 1ª fascia (quotazione 35)', '1ª fascia', mercato.lautaro.fascia);
  check('Dimarco in 1ª fascia (quotazione 32)', '1ª fascia', mercato.dimarco.fascia);
  check('Gallo in 4ª fascia (quotazione 6 -> 3ª)', '3ª fascia', mercato.gallo.fascia);
  check('mercato Lautaro coerente col reparto attacco', true,
    mercato.lautaro.mercato[0] > 50 && mercato.lautaro.mercato[1] < 300);
  check('mercato e\' un intervallo crescente', true, mercato.lautaro.mercato[0] < mercato.lautaro.mercato[1]);

  console.log('\n— il mercato dipende dai partecipanti —');
  await page.click('text=Impostazioni asta');
  await page.fill('#partecipanti', '14');
  const con14 = await page.evaluate(() =>
    Number(([...document.querySelectorAll('#tabella tr')].find(tr => tr.textContent.includes('Martinez L.')).textContent.match(/mercato (\d+)–/) || [])[1]));
  check('con 14 partecipanti il prezzo di mercato sale', true, con14 > mercato.lautaro.mercato[0]);
  await page.fill('#partecipanti', '10');

  console.log('\n— piano di spesa modificabile —');
  await page.fill('#piano-A', '70');
  const s5 = await m();
  check('alzando A al 70% il max attacco cresce', true, s5.maxA > s4.maxA);
  await page.fill('#piano-A', '50');

  console.log('\n— persistenza —');
  await page.reload({ waitUntil: 'networkidle' });
  const s6 = await m();
  check('rosa ricaricata dopo il refresh', 2, s6.slot);

  console.log('\n— rimozione —');
  await page.click('[data-rimuovi="0"]');
  check('slot dopo rimozione', 1, (await m()).slot);

  console.log('\n— griglia portieri —');
  await page.selectOption('#griglia-a', 'JUV');
  await page.selectOption('#griglia-b', 'TOR');
  const g = await page.evaluate(() => document.getElementById('griglia-valore').textContent + ' | ' + document.getElementById('griglia-testo').textContent);
  check('JUV/TOR: alternanza perfetta, dato ufficiale', true, g.startsWith('0') && !g.includes('provvisorio'));
  await page.selectOption('#griglia-a', 'NAP');
  await page.selectOption('#griglia-b', 'ROM');
  check('NAP/ROM indice 3 (era 12 nella griglia sbagliata)', '3', await page.evaluate(() => document.getElementById('griglia-valore').textContent));
  await page.selectOption('#griglia-b', 'NAP');
  check('stessa squadra gestita', true, (await page.evaluate(() => document.getElementById('griglia-testo').textContent)).includes('diverse'));

  console.log('\n— igiene della pagina —');
  check('nessuna richiesta di rete esterna', [], rete);
  check('nessun errore in console', [], errori);
  check('nessuno scroll orizzontale', false,
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  check('nessuno scroll orizzontale su mobile', false,
    await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1));

  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/nuova.png` });

  console.log(fallite ? `\n${fallite} verifiche fallite` : '\nTutte le verifiche superate');
  await browser.close();
  process.exit(fallite ? 1 : 0);
})();
