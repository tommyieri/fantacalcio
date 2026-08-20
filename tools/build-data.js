#!/usr/bin/env node
/*
 * Converte il listone ufficiale (data/listone.tsv, trascritto dal PDF
 * Fantacalcio.it 2026/27) nell'array PLAYERS usato da index.html.
 *
 * I portieri vengono raggruppati in blocchi squadra, perche' la lega
 * assegna l'intero pacchetto portieri di una squadra a un solo slot.
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

/* --- Portieri: un blocco per squadra ------------------------------------- */

const giocatori = [];
let id = 1;

for (const [squadra, cod] of Object.entries(CODICI)) {
  const portieri = dati.filter(r => r.squadra === squadra && r.ruolo === 'P')
    .sort((a, b) => b.fvm - a.fvm);
  if (!portieri.length) throw new Error(`nessun portiere per ${squadra}`);

  // Il valore del blocco e' quello del titolare: e' lui a prendere i voti.
  const titolare = portieri[0];
  giocatori.push({
    id: id++,
    nome: `Blocco ${squadra}`,
    squadra, cod,
    ruolo: 'P',
    mantra: ['Por'],
    fvm: titolare.fvm, fvmM: titolare.fvm_m,
    quot: portieri.reduce((s, p) => s + p.quot, 0),
    quotM: portieri.reduce((s, p) => s + p.quot_m, 0),
    blocco: portieri.map(p => p.nome),
    tag: []
  });
}

for (const r of dati.filter(r => r.ruolo !== 'P')) {
  giocatori.push({
    id: id++,
    nome: r.nome,
    squadra: r.squadra,
    cod: CODICI[r.squadra],
    ruolo: r.ruolo,
    mantra: r.mantra.split(';'),
    fvm: r.fvm, fvmM: r.fvm_m,
    quot: r.quot, quotM: r.quot_m,
    tag: []
  });
}

/* --- Analisi dalle fonti -------------------------------------------------- */

const TAG_VALIDI = new Set(['RIGORISTA', 'RISCHIO', 'TITOLARE', 'SCOMMESSA', 'MODIFICATORE', 'NUOVO']);

const perNome = new Map();
for (const g of giocatori) {
  perNome.set(`${g.nome}||${g.squadra}`, g);
  // Un'annotazione su un portiere si applica al blocco che lo contiene:
  // e' il blocco a occupare lo slot in asta.
  for (const portiere of g.blocco ?? []) perNome.set(`${portiere}||${g.squadra}`, g);
}

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
  // Un blocco puo' ricevere l'annotazione del titolare: la prima vince, e le
  // successive si accodano invece di sovrascriverla.
  g.nota = g.nota ? `${g.nota} ${nota}` : nota;
  g.fonti = [...new Set([...(g.fonti ?? []), ...fonti.split(';')])];
  annotati++;
}

/* --- Tag ricavabili dai numeri ------------------------------------------- */

const SLOT = { P: 2, D: 8, C: 8, A: 6 };

for (const ruolo of ['P', 'D', 'C', 'A']) {
  const delRuolo = giocatori.filter(p => p.ruolo === ruolo).sort((a, b) => b.fvm - a.fvm);

  // TOP = i primi per FVM, tanti quanti servono a coprire il primo slot di
  // ogni partecipante in una lega da 10: sono i nomi contesi davvero.
  const nTop = SLOT[ruolo] === 2 ? 6 : SLOT[ruolo] * 2;
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
for (const t of ['TOP', 'TITOLARE', 'RIGORISTA', 'MODIFICATORE', 'SCOMMESSA', 'NUOVO', 'RISCHIO', 'LOWCOST']) {
  console.log(`  ${t.padEnd(13)}${giocatori.filter(p => p.tag.includes(t)).length}`);
}
console.log('fasce (dalla quotazione ufficiale):');
for (const f of [1, 2, 3, 4]) {
  console.log(`  ${String(f).padEnd(13)}${giocatori.filter(p => p.fascia === f).length}`);
}
