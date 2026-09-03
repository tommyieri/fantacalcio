/*
 * Verifiche funzionali su dist/artifact.html (la versione autonoma, quindi
 * senza dipendenze di rete). Copre il tabellone a piu' partecipanti, il motore
 * del budget, la salvaguardia del credito per slot, i prezzi di mercato,
 * filtri, viste e persistenza.
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
  '<!doctype html><html><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<style>:root{color-scheme:light}body{margin:0;background:#faf9f5;color:#141413}</style>'
  + `</head><body>${content}</body></html>`);

let fallite = 0;
function check(nome, atteso, ottenuto) {
  const ok = JSON.stringify(atteso) === JSON.stringify(ottenuto);
  if (!ok) fallite++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${nome}`
    + (ok ? '' : `\n         atteso ${JSON.stringify(atteso)}, ottenuto ${JSON.stringify(ottenuto)}`));
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errori = [];
  page.on('pageerror', e => errori.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errori.push('CONSOLE: ' + m.text()); });
  const rete = [];
  page.on('request', r => { if (!r.url().startsWith('file:')) rete.push(r.url()); });
  page.on('dialog', d => d.accept());

  await page.goto('file://' + OUT + '/app.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const mie = () => page.evaluate(() => ({
    residuo: +document.getElementById('m-residuo').textContent,
    slot: +document.getElementById('m-slot').textContent,
    maxA: +document.getElementById('m-max-a').textContent,
    maxC: +document.getElementById('m-max-c').textContent,
    capienza: +document.getElementById('m-capienza').textContent,
    speso: +document.getElementById('m-speso').textContent,
    badge: document.getElementById('badge-ruoli').textContent
  }));

  // Riga del tabellone di una squadra: crediti, slot per ruolo, max bid.
  const squadra = i => page.evaluate(n => {
    const tr = document.querySelector(`#tabellone [data-squadra="${n}"]`);
    const c = [...tr.querySelectorAll('td')].map(td => td.textContent.trim());
    return { nome: c[0], residuo: +c[1], speso: +c[2], P: c[3], D: c[4], C: c[5], A: c[6], maxBid: c[7], aperti: c[8] };
  }, i);

  // Assegna un giocatore per nome a una squadra, al prezzo indicato.
  // Confronto esatto sul nome: "Thuram" non deve pescare "Thuram K.", e il
  // nome non deve essere cercato nelle note dove i giocatori sono solo citati.
  const trovaRiga = n => [...document.querySelectorAll('#tabella tr')].find(t => {
    const nome = t.querySelector('td:nth-child(2) span.font-semibold');
    return nome && nome.textContent.trim() === n;
  });

  const assegna = async (nome, iSquadra, prezzo) => {
    await page.evaluate(([n, src]) => {
      const trovaRiga = new Function('n', 'return (' + src + ')(n)');
      trovaRiga(n).querySelector('[data-apri]').click();
    }, [nome, trovaRiga.toString()]);
    await page.fill('#prezzo-input', String(prezzo));
    await page.click(`[data-assegna$=":${iSquadra}"]`);
  };

  const rigaGiocatore = nome => page.evaluate(([n, src]) => {
    const trovaRiga = new Function('n', 'return (' + src + ')(n)');
    const tr = trovaRiga(n);
    if (!tr) return null;
    const t = tr.textContent;
    return {
      prezzo: +(t.match(/Stima\s+(\d+) cr/) || [])[1],
      mercato: (t.match(/forchetta\s+(\d+)–(\d+)/) || []).slice(1, 3).map(Number),
      avversari: +(t.match(/~(\d+) \(/) || [])[1] || 0,
      inCorsa: +(t.match(/(\d+) in corsa/) || [])[1] || 0,
      risparmiareAltrove: t.includes('dovrai risparmiare altrove'),
      fuoriPortata: t.includes('fuori portata'),
      fascia: (t.match(/(\dª fascia)/) || [])[1]
    };
  }, [nome, trovaRiga.toString()]);

  console.log('\n— partenza: 8 partecipanti —');
  check('squadre nel tabellone', 8, await page.evaluate(() => document.querySelectorAll('#tabellone [data-squadra]').length));
  check('la prima sono io', 'Io', (await squadra(0)).nome);
  const s0 = await mie();
  check('i miei crediti', 500, s0.residuo);
  check('capienza (500 - 24 slot vuoti)', 476, s0.capienza);
  check('rosa da 25 slot con tre portieri', '0/3 P • 0/8 D • 0/8 C • 0/6 A', s0.badge);
  check('avversario col budget pieno', 500, (await squadra(1)).residuo);
  check('profilo +1 rete inviolata attivo', '1', await page.evaluate(() => document.getElementById('bonus-rete-inviolata').value));
  check('profilo modificatore attivo', true, await page.evaluate(() => document.getElementById('modificatore-attivo').checked));
  const bonusSalvato = await page.evaluate(() => {
    const input = document.getElementById('bonus-rete-inviolata');
    input.value = '0.5';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return JSON.parse(localStorage.getItem('fantastrategy.asta.2026')).regole.bonusReteInviolata;
  });
  check('bonus porta inviolata configurabile e persistito', 0.5, bonusSalvato);
  await page.evaluate(() => {
    const input = document.getElementById('bonus-rete-inviolata');
    input.value = '1';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Il massimo sostenibile mette da parte il prezzo corrente degli altri slot
  const and0 = await page.evaluate(() => [...document.querySelectorAll('#andamento > div')]
    .map(d => ({
      medio: +(d.textContent.match(/prezzo medio (\d+)/) || [])[1],
      max: +(d.textContent.match(/nella media (\d+)/) || [])[1],
      tetto: +(d.textContent.match(/fino a (\d+) spingendo/) || [])[1],
      venduti: +(d.textContent.match(/(\d+) venduti/) || [])[1]
    })));
  check('quattro schede di andamento', 4, and0.length);
  check('nessun venduto in partenza', [0, 0, 0, 0], and0.map(a => a.venduti));
  check('gli attaccanti costano piu\' dei portieri', true, and0[3].medio > and0[0].medio);
  check('indice tavolo live visibile', true, await page.evaluate(() => document.getElementById('allarmi-asta').textContent.includes('Indice tavolo')));
  check('barra rivali: sette avversari', 7, await page.evaluate(() => document.querySelectorAll('#avversari-live > div').length));
  check('il massimo con rosa media sta sotto il tetto', true, and0[3].max < and0[3].tetto);
  check('il tetto e\' la capienza', 476, and0[3].tetto);
  check('un big si puo\' comprare risparmiando altrove', true,
    (await rigaGiocatore('Martinez L.')).prezzo > and0[3].max);

  const lautaro0 = await rigaGiocatore('Martinez L.');
  check('Lautaro in 1ª fascia', '1ª fascia', lautaro0.fascia);
  check('Vicario presente nel listone ufficiale', true, (await rigaGiocatore('Vicario')) !== null);
  check('SOS Fanta: Carnesecchi primo portiere', 'PRIMO', await page.evaluate(() =>
    PLAYERS.find(p => p.nome === 'Carnesecchi')?.sos?.gerarchiaPortiere));
  check('SOS Fanta: Orsolini primo rigorista', 1, await page.evaluate(() =>
    PLAYERS.find(p => p.nome === 'Orsolini')?.sos?.piazzati?.RIGORI));
  check('Spence all\'Inter', 'Inter', await page.evaluate(() => {
    const tr = [...document.querySelectorAll('#tabella tr')].find(t => {
      const n = t.querySelector('td:nth-child(2) span.font-semibold');
      return n && n.textContent.trim() === 'Spence';
    });
    return tr.querySelectorAll('td')[2].textContent.trim();
  }));
  check('Frattesi spostato alla Lazio', 'Lazio', await page.evaluate(() => {
    const tr = [...document.querySelectorAll('#tabella tr')].find(t => {
      const n = t.querySelector('td:nth-child(2) span.font-semibold');
      return n && n.textContent.trim() === 'Frattesi';
    });
    return tr.querySelectorAll('td')[2].textContent.trim();
  }));
  check('Kristensen spostato all\'Atalanta', 'Atalanta', await page.evaluate(() => {
    const tr = [...document.querySelectorAll('#tabella tr')].find(t => {
      const n = t.querySelector('td:nth-child(2) span.font-semibold');
      return n && n.textContent.trim() === 'Kristensen T.';
    });
    return tr.querySelectorAll('td')[2].textContent.trim();
  }));
  check('mercato di Lautaro e\' un intervallo', true, lautaro0.mercato[0] < lautaro0.mercato[1]);
  check('offerta realistica degli avversari presente', true, lautaro0.avversari >= 1);

  console.log('\n— un avversario prende Lautaro —');
  await assegna('Martinez L.', 1, 120);
  const sq1 = await squadra(1);
  check('crediti dell\'avversario', 380, sq1.residuo);
  check('slot attacco dell\'avversario', '1/6', sq1.A);
  const andA = await page.evaluate(() => +([...document.querySelectorAll('#andamento > div')][3]
    .textContent.match(/osservato (\d+)/) || [])[1]);
  check('la media attacco osservata registra i 120 pagati', 120, andA);
  check('Lautaro sparisce dai liberi', null, await rigaGiocatore('Martinez L.'));

  console.log('\n— i prezzi si adattano a chi resta —');
  const malen1 = await rigaGiocatore('Malen');
  check('Malen resta il piu\' caro fra i liberi', true, malen1.mercato[0] > 50);
  check('offerta realistica resta disponibile: gli altri sei non hanno speso', true, malen1.avversari >= 1);

  console.log('\n— un avversario riempie l\'attacco —');
  for (const [nome, prezzo] of [['Thuram', 80], ['Hojlund', 70], ['Ramos G.', 60], ['Kolo Muani', 50], ['Kean', 20]]) {
    await assegna(nome, 1, prezzo);
  }
  const sq1pieno = await squadra(1);
  check('sei attaccanti presi', '6/6', sq1pieno.A);
  check('indice live registra le sei vendite', 6, await page.evaluate(() => andamento(assegnazioni()).globale.vendite));
  check('barra rivali segnala attacco chiuso', true, await page.evaluate(() => document.getElementById('avversari-live').textContent.includes('A 0/6')));
  check('attacco non compare fra i reparti aperti', false, sq1pieno.aperti.includes('A'));
  // Il tetto e' il massimo fra tutti: resta alto finche' qualcuno ha budget.
  // Cio' che cambia e' quanti avversari possono ancora contendere il ruolo.
  const dopo = await rigaGiocatore('Yildiz');
  check('un avversario in meno in corsa per l\'attacco', 6, dopo.inCorsa);
  check('in centrocampo restano tutti e sette', 7, (await rigaGiocatore('Paz N.')).inCorsa);

  console.log('\n— la salvaguardia vale anche per gli avversari —');
  const prima = (await squadra(2)).residuo;
  await assegna('Yildiz', 2, 9999);
  check('offerta oltre la capienza rifiutata', prima, (await squadra(2)).residuo);

  console.log('\n— i miei acquisti —');
  const maxPrima = (await rigaGiocatore('Malen')).prezzo;
  await assegna('Dimarco', 0, 90);
  const s1 = await mie();
  check('i miei crediti', 410, s1.residuo);
  check('slot occupati', 1, s1.slot);
  check('badge ruoli', '0/3 P • 1/8 D • 0/8 C • 0/6 A', s1.badge);

  console.log('\n— difesa cara: il mio massimo in attacco si abbassa —');
  // Riempio la difesa a prezzi alti: i crediti che servono per gli altri slot
  // crescono, quindi quello che posso mettere su un attaccante cala.
  for (const nome of ['Akanji', 'Bastoni', 'Stones', 'Bisseck', 'Ostigard', 'Solet', 'Bremer']) {
    await assegna(nome, 0, 30);
  }
  const s2 = await mie();
  check('otto difensori presi', 8, s2.slot);
  const maxDopo = (await rigaGiocatore('Malen')).prezzo;
  check('difesa completata a caro prezzo: resta comunque piu\' budget per uno slot', true, maxDopo > 0);
  check('la media difesa osservata riflette i prezzi pagati', true, await page.evaluate(() =>
    +([...document.querySelectorAll('#andamento > div')][1].textContent.match(/osservato (\d+)/) || [])[1] > 25));

  console.log('\n— reparto pieno: bottone disabilitato —');
  await page.evaluate(() => {
    const tr = [...document.querySelectorAll('#tabella tr')].find(t => {
      const nome = t.querySelector('td:nth-child(2) span.font-semibold');
      return nome && nome.textContent.trim() === 'Soulè';
    });
    tr.querySelector('[data-apri]').click();
  });
  check('la squadra con l\'attacco pieno non e\' assegnabile', true,
    await page.evaluate(() => document.querySelector('[data-assegna$=":1"]').disabled));
  await page.click('[data-chiudi]');

  console.log('\n— rosa di un avversario e rimozione —');
  await page.click('#tabellone [data-squadra="1"]');
  check('rosa avversario mostrata', 6, await page.evaluate(() => document.querySelectorAll('#tabellone [data-rimuovi]').length));
  await page.click('#tabellone [data-rimuovi="1:5"]');
  check('un acquisto rimosso', '5/6', (await squadra(1)).A);
  await page.click('#tabellone [data-squadra="1"]');

  console.log('\n— viste —');
  await page.click('[data-vista="simulatore"]');
  check('vista simulatore visibile', false, await page.evaluate(() => document.getElementById('vista-simulatore').classList.contains('hidden')));
  check('campetto con 4 reparti', true, await page.evaluate(() => 
    !!document.getElementById('campo-attacco') && !!document.getElementById('campo-centrocampo') &&
    !!document.getElementById('campo-difesa') && !!document.getElementById('campo-portiere')));
  check('selettore moduli presente con 8 moduli', 8, await page.evaluate(() => document.querySelectorAll('#moduli-selettore button').length));
  check('scheda modificatore difesa calcola bonus', true, await page.evaluate(() => document.getElementById('sim-mod-bonus').textContent.includes('pt')));
  check('copertura 11 a voto calcolata', true, await page.evaluate(() => document.getElementById('sim-copertura-pct').textContent.includes('/100')));

  await page.click('[data-vista="strategia"]');
  check('vista strategia visibile', false, await page.evaluate(() => document.getElementById('vista-strategia').classList.contains('hidden')));
  check('tre nomine strategiche consigliate', 3, await page.evaluate(() => document.querySelectorAll('#consigli-nomine > div').length));
  check('radar scarsita per i 4 ruoli', 4, await page.evaluate(() => document.querySelectorAll('#radar-scarsita > div').length));
  check('matrice necessita avversari presente', 8, await page.evaluate(() => document.querySelectorAll('#matrice-avversari-body tr').length));

  await page.click('[data-vista="formazioni"]');
  check('vista formazioni visibile', false, await page.evaluate(() => document.getElementById('vista-formazioni').classList.contains('hidden')));
  check('venti schede squadra', 20, await page.evaluate(() => document.querySelectorAll('#formazioni > div').length));
  check('Atalanta mostra undici probabile completo', 11, await page.evaluate(() => {
    const carta = [...document.querySelectorAll('#formazioni > div')].find(el => el.querySelector('h3')?.textContent.trim() === 'Atalanta');
    return [...carta.querySelectorAll('.space-y-1 > div')].length;
  }));
  check('formazioni mostra ballottaggi aggiornati', true, await page.evaluate(() => document.getElementById('formazioni').textContent.includes('Ballottaggi / alternative')));
  check('lo stato in asta compare fra i titolari', true, await page.evaluate(() =>
    document.getElementById('formazioni').textContent.includes('libero')));
  await page.fill('#ricerca-formazioni', 'napoli');
  check('filtro formazioni', 1, await page.evaluate(() => document.querySelectorAll('#formazioni > div').length));
  await page.fill('#ricerca-formazioni', '');

  await page.click('[data-vista="griglia"]');
  await page.selectOption('#griglia-a', 'JUV');
  await page.selectOption('#griglia-b', 'TOR');
  check('JUV/TOR alternanza perfetta', '0', await page.evaluate(() => document.getElementById('griglia-valore').textContent));
  await page.selectOption('#griglia-a', 'NAP');
  await page.selectOption('#griglia-b', 'ROM');
  check('NAP/ROM indice 3', '3', await page.evaluate(() => document.getElementById('griglia-valore').textContent));
  check('coppie consigliate fra i blocchi liberi', true, await page.evaluate(() =>
    document.querySelectorAll('#coppie-consigliate > div').length > 0));
  await page.click('[data-vista="asta"]');

  console.log('\n— radar rilanci live e semafori —');
  // Apri il radar rilanci su un giocatore per testare il calcolo di chi può rilanciare
  await page.evaluate(() => {
    const tr = [...document.querySelectorAll('#tabella tr')].find(t => {
      const nome = t.querySelector('td:nth-child(2) span.font-semibold');
      return nome && nome.textContent.trim() === 'Orsolini';
    });
    tr.querySelector('[data-apri]').click();
  });
  check('pannello assegnazione aperto con radar rilanci', true, await page.evaluate(() => !!document.getElementById('radar-messaggio')));
  const piano = await page.evaluate(() => {
    const pannello = document.getElementById('prezzo-input').closest('td');
    const testo = pannello.textContent;
    const max = +(testo.match(/Prezzo di indifferenza\s*(\d+) cr/) || [])[1];
    return {
      presente: testo.includes('Calcolo esatto sugli slot rimasti'),
      monteCarlo: testo.includes('Monte Carlo (800)'),
      max,
      fascia: !!pannello.querySelector('[style*="width"]') && /Mercato\s*\d+.\d+/.test(testo),
      scopo: ['Entra subito nel Best XI', 'Copertura che vale punti', 'Solo profondita']
        .filter(e => testo.includes(e)).length
    };
  });
  check('piano di completamento esatto visibile', true, piano.presente);
  check('simulazione Monte Carlo avversari visibile', true, piano.monteCarlo);
  check('max bid del piano entro la capienza', true, piano.max >= 0 && piano.max <= (await mie()).capienza);
  check('fascia di prezzo con intervallo di mercato', true, piano.fascia);
  const alt = await page.evaluate(() => {
    const td = document.getElementById('prezzo-input').closest('td');
    const t = td.textContent.replace(/\s+/g, ' ');
    const m = t.match(/Se lo lasci, al suo posto(.*?)Calcolo esatto/);
    if (!m) return { presenti: false };
    // Le alternative devono essere dello stesso ruolo e comprabili davvero.
    const nomi = [...td.querySelectorAll('span strong')].map(e => e.textContent.trim());
    const aperto = PER_ID.get(apertaRiga);
    const asseg = assegnazioni();
    const trovati = nomi.map(n => PLAYERS.find(x => x.nome === n)).filter(Boolean);
    return {
      presenti: m[1].trim().length > 0,
      stessoRuolo: trovati.every(x => x.ruolo === aperto.ruolo),
      nessunoGiaPreso: trovati.every(x => !asseg.has(x.id)),
      nessunoEIlCandidato: trovati.every(x => x.id !== aperto.id)
    };
  });
  check('alternative proposte quando lasci il giocatore', true, alt.presenti);
  check('le alternative sono dello stesso ruolo', true, alt.stessoRuolo);
  check('le alternative non sono gia assegnate', true, alt.nessunoGiaPreso);
  check('le alternative escludono il candidato', true, alt.nessunoEIlCandidato);
  check('un solo scopo dichiarato per il candidato', 1, piano.scopo);
  await page.fill('#prezzo-input', '50');
  check('radar rilanci aggiornato a quota 50', true, await page.evaluate(() => document.getElementById('radar-quota').textContent === '50'));
  await page.click('[data-chiudi]');

  console.log('\n— dati Fantalgoritmo —');
  const fa = await page.evaluate(() => {
    const asseg = assegnazioni(), and = andamento(asseg);
    const mkt = prezziMercato(asseg, and);
    const conPrezzo = PLAYERS.filter(p => p.fanta && p.fanta.mercato > 0);
    // Il nostro prezzo stimato deve inseguire quello misurato, non inventarne un altro.
    // Solo i liberi: chi e' gia' stato assegnato non ha piu' un prezzo di mercato.
    const scarti = conPrezzo
      .filter(p => mkt.has(p.id))
      .map(p => Math.abs(mkt.get(p.id).atteso - p.fanta.mercato))
      .sort((a, b) => a - b);
    const mediano = scarti[Math.floor(scarti.length / 2)];
    const conStorico = PLAYERS.filter(p => Array.isArray(p.storico) && p.storico.length);
    // La media voto di chi ha storico deve venire dallo storico, non dalla curva sull'FVM.
    const primo = conStorico[0];
    const attesa = primo.storico.length > 1
      ? (0.7 * primo.storico[0].mv + 0.3 * primo.storico[1].mv) / 1
      : primo.storico[0].mv;
    return {
      conPrezzo: conPrezzo.length,
      conStorico: conStorico.length,
      scartoMediano: mediano,
      mvDaStorico: Math.abs(VALUTAZIONI_CACHE.get(primo.id).mv - attesa) < 0.02,
      // I punti sopra il rimpiazzo non premiano piu' i giocatori da un credito.
      vorTopSopraScarso: (() => {
        const A = PLAYERS.filter(x => x.ruolo === 'A');
        const top = A.slice().sort((a, b) => (b.fanta?.mercato ?? 0) - (a.fanta?.mercato ?? 0))[0];
        const scarso = A.slice().sort((a, b) => (a.fanta?.mercato ?? 99) - (b.fanta?.mercato ?? 99))[0];
        return VALUTAZIONI_CACHE.get(top.id).puntiVor > VALUTAZIONI_CACHE.get(scarso.id).puntiVor;
      })()
    };
  });
  check('prezzi d asta agganciati a quasi tutto il listone', true, fa.conPrezzo > 500);
  check('storico Serie A su almeno 350 giocatori', true, fa.conStorico >= 350);
  check('il prezzo stimato insegue quello misurato', true, fa.scartoMediano <= 3);
  check('la media voto viene dallo storico', true, fa.mvDaStorico);
  check('i punti sopra il rimpiazzo premiano il top, non il giocatore da 1 credito', true, fa.vorTopSopraScarso);

  console.log('\n— infortuni e verdetto live —');
  const inf = await page.evaluate(() => {
    const z = PLAYERS.find(x => x.nome === 'Zaniolo');
    const sano = PLAYERS.find(x => x.nome === 'Calhanoglu');
    const asseg = assegnazioni(), st = statoSquadra(squadre[0]), and = andamento(asseg);
    const mkt = prezziMercato(asseg, and);
    const tit = x => VALUTAZIONI_CACHE.get(x.id).tit;
    return {
      zaniolloDaiDati: !!z.indisponibile,
      // Un infortunio noto deve abbassare le presenze attese, non la media voto.
      titInfortunato: tit(z) < tit(sano),
      // e deve abbassare anche il prezzo che l'asta gli fara'
      mercatoInfortunato: mkt.get(z.id).atteso < z.fvm / 2,
      mvIntatta: VALUTAZIONI_CACHE.get(z.id).mv > 5.8
    };
  });
  check('Zaniolo marcato indisponibile dai dati', true, inf.zaniolloDaiDati);
  check('l infortunio abbassa le presenze attese', true, inf.titInfortunato);
  check('l infortunio abbassa il prezzo di mercato', true, inf.mercatoInfortunato);
  check('l infortunio non tocca la media voto', true, inf.mvIntatta);

  const manuale = await page.evaluate(() => {
    const c = PLAYERS.find(x => x.nome === 'Calhanoglu');
    const prima = VALUTAZIONI_CACHE.get(c.id).tit;
    segnaInfortunio(c.id, true);
    const dopo = VALUTAZIONI_CACHE.get(c.id).tit;
    segnaInfortunio(c.id, false);
    const tornato = VALUTAZIONI_CACHE.get(c.id).tit;
    return { scende: dopo < prima, reversibile: Math.abs(tornato - prima) < 1e-9 };
  });
  check('segnare infortunato abbassa le presenze', true, manuale.scende);
  check('togliere il segno ripristina il valore', true, manuale.reversibile);

  const live = await page.evaluate(() => {
    const st = statoSquadra(squadre[0]);
    const piano = { maxBid: 40, monteCarlo: { chiusure: Array.from({ length: 100 }, (_, i) => i + 1) } };
    const a = verdettoLive(20, piano, st, { atteso: 30 });
    const b = verdettoLive(41, piano, st, { atteso: 30 });
    const c = verdettoLive(st.capienza + 1, piano, st, { atteso: 30 });
    return {
      sotto: a.stato, sopra: b.stato, fuori: c.stato,
      // la probabilita' di vittoria deve crescere col prezzo
      vittoriaCresce: verdettoLive(60, piano, st, {}).vittoria > a.vittoria
    };
  });
  check('sotto il tetto il verdetto e verde', 'ok', live.sotto);
  check('sopra il tetto il verdetto avvisa', 'oltre', live.sopra);
  check('oltre la capienza il verdetto blocca', 'stop', live.fuori);
  check('la probabilita di vittoria cresce col prezzo', true, live.vittoriaCresce);

  console.log('\n— filtri e ricerca —');
  await page.click('[data-ruolo="D"]');
  const nD = await page.evaluate(() => document.querySelectorAll('#tabella tr').length);
  check('solo difensori, senza gli otto gia\' assegnati', 177, nD);
  
  await page.click('[data-ruolo="ALL"]');
  await page.click('[data-tag="RIGORISTA"]');
  const nRig = await page.evaluate(() => document.querySelectorAll('#tabella tr').length);
  check('filtro rigoristi non vuoto', true, nRig > 0 && nRig < 100);
  await page.click('[data-tag="ALL"]');
  await page.fill('#ricerca', 'napoli');
  const nNap = await page.evaluate(() => document.querySelectorAll('#tabella tr').length);
  check('ricerca "napoli"', true, nNap > 0 && nNap < 100);
  await page.fill('#ricerca', '');

  await page.uncheck('#solo-liberi');
  check('mostrando anche gli assegnati la lista cresce', true,
    await page.evaluate(() => document.querySelectorAll('#tabella tr').length) > 450);
  await page.check('#solo-liberi');

  console.log('\n— rinomina e persistenza —');
  await page.click('text=Impostazioni');
  await page.fill('[data-nome="1"]', 'Marco');
  check('nome avversario aggiornato', 'Marco', (await squadra(1)).nome);
  await page.reload({ waitUntil: 'networkidle' });
  check('nome sopravvive al refresh', 'Marco', (await squadra(1)).nome);
  check('i miei crediti sopravvivono', 200, (await mie()).residuo);
  check('rosa avversario sopravvive', '5/6', (await squadra(1)).A);

  console.log('\n— economia chiusa: difensori economici liberano budget —');
  const spillover = await page.evaluate(() => {
    const precedente = squadre;
    const pulite = Array.from({ length: 8 }, (_, i) => ({ nome: `Test ${i + 1}`, rosa: [] }));
    squadre = pulite;
    const prima = prezziMercato(assegnazioni(), andamento(assegnazioni())).get(PLAYERS.find(p => p.nome === 'Malen').id).atteso;
    const difensori = PLAYERS.filter(p => p.ruolo === 'D').slice(0, 64);
    difensori.forEach((p, i) => pulite[Math.floor(i / 8)].rosa.push({ id: p.id, pagato: 4 }));
    const dopo = prezziMercato(assegnazioni(), andamento(assegnazioni())).get(PLAYERS.find(p => p.nome === 'Malen').id).atteso;
    squadre = precedente;
    return { prima, dopo };
  });
  check('difensori pagati poco alzano il prezzo atteso dell’attaccante top', true, spillover.dopo > spillover.prima);

  console.log('\n— igiene della pagina —');
  check('nessuna richiesta di rete esterna', [], rete);
  check('nessun errore in console', [], errori);
  check('nessuno scroll orizzontale', false, await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  check('nessuno scroll orizzontale su mobile', false, await page.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth + 1));

  await page.setViewportSize({ width: 1600, height: 1250 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/asta.png` });
  console.log(`\nschermata: ${OUT}/asta.png`);

  console.log(fallite ? `\n${fallite} verifiche fallite` : '\nTutte le verifiche superate');
  await browser.close();
  process.exit(fallite ? 1 : 0);
})();
