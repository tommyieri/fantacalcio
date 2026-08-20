#!/usr/bin/env node
/*
 * Converte il listone ufficiale (data/listone.tsv, trascritto dal PDF
 * Fantacalcio.it 2026/27) nell'array PLAYERS usato da index.html.
 *
 * I portieri sono singoli: la lega assegna tre slot di portiere e possono
 * venire da tre squadre diverse.
 *
 * I tag ricavabili dai numeri (TOP, LOWCOST) vengono calcolati qui dal FVM.
 * Quelli che dipendono da valutazioni esterne (RIGORISTA, RISCHIO, TITOLARE,
 * SCOMMESSA, MODIFICATORE, NUOVO) arrivano da data/analisi.tsv, dove ogni
 * riga porta con se' la nota e le fonti da cui e' stata ricavata.
 *
 * Uso:  node tools/build-data.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'data/listone.tsv');
const ANALISI = path.join(ROOT, 'data/analisi.tsv');
const SQUADRE = path.join(ROOT, 'data/squadre.tsv');
const AGGIUNTE = path.join(ROOT, 'data/aggiunte.tsv');
const TRASFERIMENTI = path.join(ROOT, 'data/trasferimenti.tsv');
const GRIGLIA = path.join(ROOT, 'data/griglia.json');

const CODICI = {
  Atalanta: 'ATA', Bologna: 'BOL', Cagliari: 'CAG', Como: 'COM', Fiorentina: 'FIO',
  Frosinone: 'FRO', Genoa: 'GEN', Inter: 'INT', Juventus: 'JUV', Lazio: 'LAZ',
  Lecce: 'LEC', Milan: 'MIL', Monza: 'MON', Napoli: 'NAP', Parma: 'PAR',
  Roma: 'ROM', Sassuolo: 'SAS', Torino: 'TOR', Udinese: 'UDI', Venezia: 'VEN'
};

const righe = fs.readFileSync(SRC, 'utf8').trim().split('\n');
const intestazione = righe[0].split('\t');
const dati = righe.slice(1).map(r => {
  const c = r.split('\t');
  return Object.fromEntries(intestazione.map((k, i) => [k, c[i]]));
});

for (const r of dati) {
  if (!CODICI[r.squadra]) throw new Error(`squadra sconosciuta: ${r.squadra}`);
  r.fvm = Number(r.fvm); r.fvm_m = Number(r.fvm_m);
  r.quot = Number(r.quot); r.quot_m = Number(r.quot_m);
  if (![r.fvm, r.fvm_m, r.quot, r.quot_m].every(n => Number.isInteger(n) && n >= 1)) {
    throw new Error(`valori non validi per ${r.nome}`);
  }
}

/* --- Giocatori ------------------------------------------------------------ */

const giocatori = [];
let id = 1;

function voce(r, squadra) {
  return {
    id: id++,
    nome: r.nome,
    squadra,
    cod: CODICI[squadra],
    ruolo: r.ruolo,
    mantra: typeof r.mantra === 'string' ? r.mantra.split(';') : r.mantra,
    fvm: r.fvm, fvmM: r.fvm_m ?? r.fvm,
    quot: r.quot, quotM: r.quot_m ?? r.quot,
    tag: []
  };
}

for (const r of dati) giocatori.push(voce(r, r.squadra));

/* --- Trasferimenti non ancora recepiti dal listone ------------------------ */

let spostati = 0;
for (const riga of fs.readFileSync(TRASFERIMENTI, 'utf8').trim().split('\n').slice(1)) {
  const [nome, da, a, nota, fonti] = riga.split('\t');
  const g = giocatori.find(x => x.nome === nome && x.squadra === da);
  if (!g) throw new Error(`trasferimenti.tsv: "${nome}" non risulta al ${da}`);
  if (!CODICI[a]) throw new Error(`trasferimenti.tsv: squadra sconosciuta "${a}"`);
  g.squadra = a;
  g.cod = CODICI[a];
  g.fuoriListone = 'squadra';
  g.nota = nota;
  g.fonti = fonti.split(';');
  spostati++;
}

/* --- Giocatori non ancora presenti nel listone ---------------------------- */

let aggiunti = 0;
for (const riga of fs.readFileSync(AGGIUNTE, 'utf8').trim().split('\n').slice(1)) {
  const [nome, squadra, ruolo, mantra, fvm, quot, stimato, nota, fonti] = riga.split('\t');
  if (!CODICI[squadra]) throw new Error(`aggiunte.tsv: squadra sconosciuta "${squadra}"`);
  if (giocatori.some(x => x.nome === nome && x.squadra === squadra)) {
    throw new Error(`aggiunte.tsv: "${nome}" e' gia' nel listone`);
  }
  const g = voce({ nome, ruolo, mantra, fvm: Number(fvm), quot: Number(quot) }, squadra);
  g.fuoriListone = 'voce';
  g.stimato = stimato.split(';');   // quali numeri sono una stima, non ufficiali
  g.nota = nota;
  g.fonti = fonti.split(';');
  giocatori.push(g);
  aggiunti++;
}

/* --- Analisi dalle fonti -------------------------------------------------- */

const TAG_VALIDI = new Set(['RIGORISTA', 'RISCHIO', 'TITOLARE', 'SCOMMESSA', 'MODIFICATORE', 'NUOVO']);

const perNome = new Map(giocatori.map(g => [`${g.nome}||${g.squadra}`, g]));

const analisi = fs.readFileSync(ANALISI, 'utf8').trim().split('\n').slice(1);
let annotati = 0;
for (const riga of analisi) {
  const [nome, squadra, tag, nota, fonti] = riga.split('\t');
  const g = perNome.get(`${nome}||${squadra}`);
  // Una riga che non aggancia nessun giocatore e' quasi sempre un nome
  // sbagliato: meglio fallire il build che perdere l'annotazione in silenzio.
  if (!g) throw new Error(`analisi.tsv: "${nome}" (${squadra}) non esiste nel listone`);
  for (const t of tag.split(';')) {
    if (!TAG_VALIDI.has(t)) throw new Error(`analisi.tsv: tag sconosciuto "${t}" per ${nome}`);
    if (!g.tag.includes(t)) g.tag.push(t);
  }
  if (!nota || !fonti) throw new Error(`analisi.tsv: nota o fonti mancanti per ${nome}`);
  g.nota = g.nota ? `${g.nota} ${nota}` : nota;
  g.fonti = [...new Set([...(g.fonti ?? []), ...fonti.split(';')])];
  annotati++;
}

/* --- Tag ricavabili dai numeri ------------------------------------------- */

const SLOT = { P: 3, D: 8, C: 8, A: 6 };

for (const ruolo of ['P', 'D', 'C', 'A']) {
  const delRuolo = giocatori.filter(p => p.ruolo === ruolo).sort((a, b) => b.fvm - a.fvm);

  // TOP = i primi per FVM, tanti quanti servono a coprire il primo slot di
  // ogni partecipante in una lega da 10: sono i nomi contesi davvero.
  const nTop = SLOT[ruolo] * 2;
  delRuolo.slice(0, nTop).forEach(p => p.tag.push('TOP'));

  // LOWCOST = i tappabuchi da 1-2 crediti.
  for (const p of delRuolo) if (p.quot <= 2) p.tag.push('LOWCOST');

  // Fascia secondo la lettura classica delle quotazioni ufficiali:
  // Top da 30 crediti in su, Semitop 15-29, terza fascia 6-14, scommesse 1-5.
  for (const p of delRuolo) {
    p.fascia = p.quot >= 30 ? 1 : p.quot >= 15 ? 2 : p.quot >= 6 ? 3 : 4;
  }

  delRuolo.forEach((p, i) => { p.rank = i + 1; p.rankTot = delRuolo.length; });
}

/* --- Squadre: allenatore e modulo ----------------------------------------- */

const squadre = {};
for (const riga of fs.readFileSync(SQUADRE, 'utf8').trim().split('\n').slice(1)) {
  const [squadra, allenatore, modulo, nota] = riga.split('\t');
  if (!CODICI[squadra]) throw new Error(`squadre.tsv: squadra sconosciuta "${squadra}"`);
  squadre[CODICI[squadra]] = { squadra, allenatore, modulo, nota };
}
if (Object.keys(squadre).length !== 20) throw new Error('squadre.tsv: servono tutte e 20 le squadre');

/* --- Scrittura ------------------------------------------------------------ */

const ordine = { P: 0, D: 1, C: 2, A: 3 };
giocatori.sort((a, b) => ordine[a.ruolo] - ordine[b.ruolo] || b.fvm - a.fvm);

const righeJs = giocatori.map(p => '  ' + JSON.stringify(p) + ',').join('\n');
// La griglia ufficiale degli incroci portieri: l'indice fra due squadre e' il
// numero di giornate in cui giocano entrambe in trasferta.
const griglia = JSON.parse(fs.readFileSync(GRIGLIA, 'utf8'));
const codici = Object.values(CODICI);
for (const a of codici) {
  for (const b of codici) {
    if (griglia[a]?.[b] === undefined) throw new Error(`griglia.json: manca ${a}/${b}`);
    if (griglia[a][b] !== griglia[b][a]) throw new Error(`griglia.json: asimmetria ${a}/${b}`);
  }
}

const out = `const PLAYERS = [\n${righeJs}\n];\n\n`
  + `const SQUADRE_INFO = ${JSON.stringify(squadre, null, 2)};\n\n`
  + `const SQUADRE_LISTA = ${JSON.stringify(codici)};\n\n`
  + `const GRIGLIA = ${JSON.stringify(griglia)};\n`;
fs.writeFileSync(path.join(ROOT, 'data/players.generated.js'), out);

const conteggi = {};
for (const p of giocatori) conteggi[p.ruolo] = (conteggi[p.ruolo] ?? 0) + 1;
console.log(`righe listone:   ${dati.length}`);
console.log(`voci generate:   ${giocatori.length} (${Object.entries(conteggi).map(([k, v]) => k + ':' + v).join(', ')})`);
console.log(`annotati:        ${annotati}`);
console.log(`fuori listone:   ${aggiunti} aggiunti, ${spostati} spostati di squadra`);
for (const t of ['TOP', 'TITOLARE', 'RIGORISTA', 'MODIFICATORE', 'SCOMMESSA', 'NUOVO', 'RISCHIO', 'LOWCOST']) {
  console.log(`  ${t.padEnd(13)}${giocatori.filter(p => p.tag.includes(t)).length}`);
}
console.log('fasce (dalla quotazione ufficiale):');
for (const f of [1, 2, 3, 4]) {
  console.log(`  ${String(f).padEnd(13)}${giocatori.filter(p => p.fascia === f).length}`);
}

try {
  require('./build-app.js');
} catch (e) {
  console.error('Attenzione: impossibile sincronizzare index.html:', e.message);
}
