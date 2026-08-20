#!/usr/bin/env node
/*
 * Calcola la griglia degli incroci portieri dal calendario ufficiale.
 *
 * L'indice fra due squadre A e B e' il numero di giornate in cui giocano
 * ENTRAMBE in trasferta: e' quello il caso in cui nessuno dei due portieri
 * jolla in casa. Indice 0 = alternanza perfetta (succede per le coppie di
 * derby cittadini, che il calendario obbliga ad alternarsi).
 *
 * Input: un CSV con intestazione, una riga per partita.
 *        giornata,casa,ospite
 *        1,Inter,Monza
 *        1,Udinese,Como
 *   I nomi possono essere per esteso o in codice a tre lettere.
 *
 * Uso:  node tools/build-grid.js calendario.csv
 *
 * Il calendario NON viene indovinato: se il file non passa tutti i controlli
 * di coerenza lo script fallisce invece di produrre una griglia sbagliata.
 */

const fs = require('fs');

const CODICI = {
  Atalanta: 'ATA', Bologna: 'BOL', Cagliari: 'CAG', Como: 'COM', Fiorentina: 'FIO',
  Frosinone: 'FRO', Genoa: 'GEN', Inter: 'INT', Juventus: 'JUV', Lazio: 'LAZ',
  Lecce: 'LEC', Milan: 'MIL', Monza: 'MON', Napoli: 'NAP', Parma: 'PAR',
  Roma: 'ROM', Sassuolo: 'SAS', Torino: 'TOR', Udinese: 'UDI', Venezia: 'VEN'
};
const SQUADRE = Object.values(CODICI);

function codice(nome) {
  const n = nome.trim();
  if (SQUADRE.includes(n.toUpperCase())) return n.toUpperCase();
  const chiave = Object.keys(CODICI).find(k => k.toLowerCase() === n.toLowerCase());
  if (!chiave) throw new Error(`squadra non riconosciuta: "${n}"`);
  return CODICI[chiave];
}

function leggiCalendario(file) {
  const righe = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const intestazione = righe[0].toLowerCase();
  if (!/giornata/.test(intestazione)) throw new Error('manca la riga di intestazione "giornata,casa,ospite"');
  return righe.slice(1).filter(r => r.trim()).map((r, i) => {
    const [g, casa, ospite] = r.split(',');
    if (!g || !casa || !ospite) throw new Error(`riga ${i + 2} malformata: "${r}"`);
    return { giornata: Number(g), casa: codice(casa), ospite: codice(ospite) };
  });
}

function verifica(partite) {
  const errori = [];

  if (partite.length !== 380) errori.push(`partite totali: ${partite.length}, attese 380`);

  const perGiornata = new Map();
  for (const p of partite) {
    if (!perGiornata.has(p.giornata)) perGiornata.set(p.giornata, []);
    perGiornata.get(p.giornata).push(p);
  }
  if (perGiornata.size !== 38) errori.push(`giornate: ${perGiornata.size}, attese 38`);

  for (const [g, ps] of [...perGiornata].sort((a, b) => a[0] - b[0])) {
    if (ps.length !== 10) errori.push(`giornata ${g}: ${ps.length} partite, attese 10`);
    const viste = new Set();
    for (const p of ps) {
      for (const s of [p.casa, p.ospite]) {
        if (viste.has(s)) errori.push(`giornata ${g}: ${s} compare due volte`);
        viste.add(s);
      }
    }
    if (viste.size !== 20 && ps.length === 10) errori.push(`giornata ${g}: ${viste.size} squadre, attese 20`);
  }

  // Ogni accoppiamento orientato (A in casa contro B) esiste esattamente una
  // volta: e' il controllo che smaschera una partita invertita casa/trasferta.
  const conteggio = new Map();
  for (const p of partite) {
    const k = `${p.casa}-${p.ospite}`;
    conteggio.set(k, (conteggio.get(k) ?? 0) + 1);
  }
  for (const a of SQUADRE) {
    for (const b of SQUADRE) {
      if (a === b) continue;
      const n = conteggio.get(`${a}-${b}`) ?? 0;
      if (n !== 1) errori.push(`${a} in casa con ${b}: ${n} volte, attesa 1`);
    }
  }

  for (const s of SQUADRE) {
    const casa = partite.filter(p => p.casa === s).length;
    const fuori = partite.filter(p => p.ospite === s).length;
    if (casa !== 19 || fuori !== 19) errori.push(`${s}: ${casa} in casa / ${fuori} in trasferta, attese 19 e 19`);
  }

  return errori;
}

function costruisciGriglia(partite) {
  // trasferte[squadra] = insieme delle giornate giocate fuori casa
  const trasferte = Object.fromEntries(SQUADRE.map(s => [s, new Set()]));
  for (const p of partite) trasferte[p.ospite].add(p.giornata);

  const griglia = {};
  for (const a of SQUADRE) {
    griglia[a] = {};
    for (const b of SQUADRE) {
      griglia[a][b] = a === b ? 0 : [...trasferte[a]].filter(g => trasferte[b].has(g)).length;
    }
  }
  return griglia;
}

const file = process.argv[2];
if (!file) {
  console.error('uso: node tools/build-grid.js <calendario.csv>');
  process.exit(2);
}

const partite = leggiCalendario(file);
const errori = verifica(partite);
if (errori.length) {
  console.error(`calendario non valido (${errori.length} problemi):`);
  for (const e of errori.slice(0, 20)) console.error('  - ' + e);
  if (errori.length > 20) console.error(`  ... e altri ${errori.length - 20}`);
  process.exit(1);
}

const griglia = costruisciGriglia(partite);

const righe = SQUADRE.map(a =>
  `  ${a}: { ` + SQUADRE.map(b => `${b}:${griglia[a][b]}`).join(', ') + ' }'
).join(',\n');

process.stdout.write(`const GRIGLIA = {\n${righe}\n};\n`);

const perfette = [];
for (let i = 0; i < SQUADRE.length; i++) {
  for (let j = i + 1; j < SQUADRE.length; j++) {
    if (griglia[SQUADRE[i]][SQUADRE[j]] === 0) perfette.push(`${SQUADRE[i]}/${SQUADRE[j]}`);
  }
}
process.stderr.write(`calendario valido: 380 partite, 38 giornate\n`);
process.stderr.write(`coppie a indice 0: ${perfette.join(', ') || 'nessuna'}\n`);
