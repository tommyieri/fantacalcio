#!/usr/bin/env node
/*
 * Converte il vecchio `playersDB` (contenuto in `index`) nello schema nuovo,
 * pensato per ricevere l'export ufficiale delle quotazioni.
 *
 * Il campo `baseMax` sparisce: il prezzo consigliato non e' piu' un numero
 * scritto a mano ma viene calcolato dal motore budget a partire dal FVM.
 *
 * Uso:  node tools/migrate-data.js > dist/players.js
 */

const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '../index'), 'utf8');
const raw = eval('[' + src.match(/const playersDB = \[([\s\S]*?)\n    \];/)[1] + ']');

// I blocchi portiere portano il codice squadra: da li' si ricava la mappa
// nome squadra -> codice, che serve per collegare i giocatori alla griglia.
const codiciSquadra = {};
for (const p of raw) if (p.teamCode) codiciSquadra[p.team] = p.teamCode;

const mancanti = [...new Set(raw.filter(p => !codiciSquadra[p.team]).map(p => p.team))];
if (mancanti.length) throw new Error('squadre senza codice: ' + mancanti.join(', '));

const TAG = { TOP: 'TOP', RIGORISTA: 'RIGORISTA', SCOMMESSA: 'SCOMMESSA', '1 CR': 'LOWCOST', RISCHIO: 'RISCHIO' };

function tagsDi(p) {
  const t = [];
  if (TAG[p.tag]) t.push(TAG[p.tag]);
  if (/MODIFICATORE/.test(p.status)) t.push('MODIFICATORE');
  if (/RIGORI/.test(p.status) && !t.includes('RIGORISTA')) t.push('RIGORISTA');
  return t;
}

const out = raw.map(p => ({
  id: p.id,
  nome: p.name,
  squadra: p.team,
  cod: codiciSquadra[p.team],
  ruolo: p.role,
  blocco: p.role === 'P',
  mantra: [],          // in attesa dell'export ufficiale
  fvm: p.fvm,
  quot: p.quot,
  mv: null,            // media voto: in attesa dei dati storici
  tag: tagsDi(p),
  titolo: p.status,
  nota: p.note,
  conf: 'bassa'        // nessuna riga e' ancora stata verificata su 5 fonti
}));

const righe = out.map(p => '  ' + JSON.stringify(p) + ',').join('\n');
process.stdout.write(`const PLAYERS = [\n${righe}\n];\n`);

process.stderr.write(`convertiti ${out.length} giocatori, ${Object.keys(codiciSquadra).length} squadre\n`);
