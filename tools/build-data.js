#!/usr/bin/env node
/*
 * Converte il listone ufficiale (data/listone.tsv, trascritto dal PDF
 * Fantacalcio.it 2026/27) nell'array PLAYERS usato da index.html.
 *
 * I portieri vengono raggruppati in blocchi squadra, perche' la lega
 * assegna l'intero pacchetto portieri di una squadra a un solo slot.
 *
 * I tag ricavabili dai numeri (TOP, LOWCOST) vengono calcolati qui. Quelli
 * che dipendono da valutazioni esterne (RIGORISTA, RISCHIO, MODIFICATORE)
 * restano vuoti finche' non arrivano dalla verifica sulle cinque fonti:
 * non vengono inventati.
 *
 * Uso:  node tools/build-data.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'data/listone.tsv');

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

  delRuolo.forEach((p, i) => { p.rank = i + 1; p.rankTot = delRuolo.length; });
}

/* --- Scrittura ------------------------------------------------------------ */

const ordine = { P: 0, D: 1, C: 2, A: 3 };
giocatori.sort((a, b) => ordine[a.ruolo] - ordine[b.ruolo] || b.fvm - a.fvm);

const righeJs = giocatori.map(p => '  ' + JSON.stringify(p) + ',').join('\n');
const out = `const PLAYERS = [\n${righeJs}\n];\n`;
fs.writeFileSync(path.join(ROOT, 'data/players.generated.js'), out);

const conteggi = {};
for (const p of giocatori) conteggi[p.ruolo] = (conteggi[p.ruolo] ?? 0) + 1;
console.log(`righe listone:   ${dati.length}`);
console.log(`voci generate:   ${giocatori.length} (${Object.entries(conteggi).map(([k, v]) => k + ':' + v).join(', ')})`);
console.log(`con tag TOP:     ${giocatori.filter(p => p.tag.includes('TOP')).length}`);
console.log(`con tag LOWCOST: ${giocatori.filter(p => p.tag.includes('LOWCOST')).length}`);
