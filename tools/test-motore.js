/*
 * Verifiche sulle funzioni pure di src/motore.js. Niente browser, niente DOM:
 * girano in millisecondi e fissano le proprieta' del modello che la suite
 * end-to-end su dist/artifact.html non riesce a esprimere.
 *
 * Uso:  npm run test:unit
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalCdf, quantile, generatoreCasuale, bonusGaussiano,
  modificatoreDifesaAtteso, IMPOSSIBILE,
  frontieraRuolo, frontieraCompletamento,
  bloccoPortieri, gerarchiaBlocco, DISPONIBILITA_RISERVA
} = require('../src/motore.js');

/* --- Statistica ----------------------------------------------------------- */

test('normalCdf: mediana, code e monotonia', () => {
  assert.ok(Math.abs(normalCdf(6, 6, 0.28) - 0.5) < 1e-6, 'la mediana sta sulla media');
  assert.ok(normalCdf(4, 6, 0.28) < 1e-6, 'coda sinistra schiacciata a zero');
  assert.ok(normalCdf(8, 6, 0.28) > 1 - 1e-6, 'coda destra schiacciata a uno');
  let precedente = -1;
  for (let x = 5; x <= 7; x += 0.1) {
    const v = normalCdf(x, 6, 0.28);
    assert.ok(v >= precedente, `non monotona in ${x}`);
    precedente = v;
  }
});

test('quantile: estremi e ordine', () => {
  const valori = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(quantile(valori, 0), 1);
  assert.equal(quantile(valori, 1), 10);
  assert.equal(quantile(valori, 0.5), 5);
  assert.ok(quantile(valori, 0.75) >= quantile(valori, 0.5));
  assert.equal(quantile([], 0.5), 0, 'un elenco vuoto non deve esplodere');
});

test('generatoreCasuale: riproducibile a parita di seme, diverso altrimenti', () => {
  const a = generatoreCasuale(1234);
  const b = generatoreCasuale(1234);
  const c = generatoreCasuale(1235);
  const seqA = Array.from({ length: 20 }, () => a());
  const seqB = Array.from({ length: 20 }, () => b());
  const seqC = Array.from({ length: 20 }, () => c());
  assert.deepEqual(seqA, seqB, 'lo stesso seme deve dare la stessa sequenza');
  assert.notDeepEqual(seqA, seqC);
  assert.ok(seqA.every(v => v >= 0 && v < 1), 'valori fuori da [0,1)');
});

/* --- Modificatore di difesa ---------------------------------------------- */

const SCAGLIONI = [
  { soglia: 7.00, bonus: 6 }, { soglia: 6.75, bonus: 4 }, { soglia: 6.50, bonus: 3 },
  { soglia: 6.25, bonus: 2 }, { soglia: 6.00, bonus: 1 }
];
const dif = (mv, p) => ({ mv, p });
const base = {
  portieri: [dif(6.1, 0.95)],
  scaglioni: SCAGLIONI,
  sigma: 0.28,
  difensoriMinimi: 4,
  difensoriSchierati: 4
};
const quattroSicuri = [dif(6.3, 0.95), dif(6.2, 0.95), dif(6.2, 0.95), dif(6.1, 0.95)];

test('nessun modificatore sotto il numero di difensori richiesto dalla lega', () => {
  const tre = modificatoreDifesaAtteso({ ...base, difensori: quattroSicuri, difensoriSchierati: 3 });
  assert.equal(tre.bonusAtteso, 0, 'un modulo a tre difensori non prende il bonus');
  assert.equal(tre.probAttivo, 0);

  const rosaCorta = modificatoreDifesaAtteso({ ...base, difensori: quattroSicuri.slice(0, 3) });
  assert.equal(rosaCorta.bonusAtteso, 0, 'con tre difensori in rosa il bonus non puo scattare');
});

test('senza portiere disponibile non ce modificatore', () => {
  const res = modificatoreDifesaAtteso({ ...base, portieri: [], difensori: quattroSicuri });
  assert.equal(res.bonusAtteso, 0);
});

test('la disponibilita conta: un difensore fragile abbatte il bonus', () => {
  const sicuri = modificatoreDifesaAtteso({ ...base, difensori: quattroSicuri });
  const fragile = modificatoreDifesaAtteso({
    ...base,
    difensori: [dif(6.3, 0.95), dif(6.2, 0.95), dif(6.2, 0.95), dif(6.1, 0.15)]
  });

  // E' la regressione che protegge questa modifica: con la vecchia formula i
  // due casi erano identici, perche' la MV e' la stessa e `tit` non entrava.
  assert.ok(fragile.bonusAtteso < sicuri.bonusAtteso * 0.5,
    `atteso un crollo, ottenuto ${fragile.bonusAtteso} contro ${sicuri.bonusAtteso}`);
  assert.ok(fragile.probAttivo < sicuri.probAttivo);
});

test('la panchina protegge il modificatore', () => {
  const fragile = [dif(6.3, 0.95), dif(6.2, 0.95), dif(6.2, 0.95), dif(6.1, 0.15)];
  const senzaRiserva = modificatoreDifesaAtteso({ ...base, difensori: fragile });
  const conRiserva = modificatoreDifesaAtteso({ ...base, difensori: [...fragile, dif(6.0, 0.90)] });
  assert.ok(conRiserva.bonusAtteso > senzaRiserva.bonusAtteso * 3,
    'un quinto difensore affidabile deve rimettere in piedi il bonus');
});

test('bonus e probabilita crescono con la disponibilita', () => {
  let precedenteBonus = -1;
  let precedenteProb = -1;
  for (const p of [0.2, 0.4, 0.6, 0.8, 0.95]) {
    const res = modificatoreDifesaAtteso({
      ...base,
      difensori: quattroSicuri.map(d => ({ ...d, p }))
    });
    assert.ok(res.bonusAtteso >= precedenteBonus, `bonus non monotono a p=${p}`);
    assert.ok(res.probAttivo >= precedenteProb, `probabilita non monotona a p=${p}`);
    precedenteBonus = res.bonusAtteso;
    precedenteProb = res.probAttivo;
  }
});

test('probAttivo e una probabilita, e con presenze certe vale 1', () => {
  const certo = modificatoreDifesaAtteso({
    ...base,
    portieri: [dif(6.1, 1)],
    difensori: quattroSicuri.map(d => ({ ...d, p: 1 }))
  });
  assert.ok(Math.abs(certo.probAttivo - 1) < 1e-9, `probAttivo = ${certo.probAttivo}`);

  // Con tutti presenti il risultato deve coincidere con la formula secca:
  // media di portiere e tre difensori migliori, spalmata sugli scaglioni.
  const media = (6.1 + 6.3 + 6.2 + 6.2) / 4;
  assert.ok(Math.abs(certo.bonusAtteso - bonusGaussiano(media, SCAGLIONI, 0.28)) < 0.005);
  assert.equal(certo.mvMedia, Number(media.toFixed(2)));
});

test('una difesa piu forte non vale meno di una piu debole', () => {
  const debole = modificatoreDifesaAtteso({
    ...base, difensori: [dif(6.0, 0.9), dif(5.9, 0.9), dif(5.9, 0.9), dif(5.8, 0.9)]
  });
  const forte = modificatoreDifesaAtteso({
    ...base, difensori: [dif(6.6, 0.9), dif(6.5, 0.9), dif(6.5, 0.9), dif(6.4, 0.9)]
  });
  assert.ok(forte.bonusAtteso > debole.bonusAtteso);
  assert.ok(forte.mvMedia > debole.mvMedia);
});

/* --- Frontiera di completamento ------------------------------------------ */

const costo = p => p.costo;
const valore = p => p.valore;

test('frontieraRuolo: sceglie la combinazione migliore che entra nel budget', () => {
  const giocatori = [
    { costo: 10, valore: 100 },
    { costo: 6, valore: 70 },
    { costo: 5, valore: 50 },
    { costo: 1, valore: 5 }
  ];
  const f = frontieraRuolo(giocatori, 2, 20, costo, valore);
  // Con 20 crediti i due migliori (10+6 = 16 cr) danno 170.
  assert.equal(f[20], 170);
  // Con 11 crediti la coppia migliore e' 6+5 = 11 cr -> 120.
  assert.equal(f[11], 120);
  // Con 5 crediti nessuna coppia e' acquistabile: 5+1 = 6 > 5.
  assert.ok(f[5] <= IMPOSSIBILE / 2, 'sotto il costo minimo la coppia non esiste');
});

test('frontieraRuolo: monotona nel budget', () => {
  const giocatori = Array.from({ length: 30 }, (_, i) => ({ costo: i + 1, valore: (i + 1) * 3 + (i % 7) }));
  const f = frontieraRuolo(giocatori, 3, 60, costo, valore);
  for (let c = 1; c <= 60; c++) {
    if (f[c - 1] <= IMPOSSIBILE / 2) continue;
    assert.ok(f[c] >= f[c - 1], `piu budget non puo peggiorare il piano (crediti ${c})`);
  }
});

test('frontieraRuolo: rispetta esattamente il numero di slot', () => {
  // Un solo giocatore in elenco: due slot non sono riempibili a nessun budget.
  const f = frontieraRuolo([{ costo: 1, valore: 99 }], 2, 50, costo, valore);
  assert.ok(f[50] <= IMPOSSIBILE / 2);
});

test('frontieraCompletamento: somma i ruoli e resta monotona', () => {
  const pool = [
    { ruolo: 'D', costo: 4, valore: 40 }, { ruolo: 'D', costo: 3, valore: 25 },
    { ruolo: 'D', costo: 1, valore: 5 },
    { ruolo: 'A', costo: 9, valore: 120 }, { ruolo: 'A', costo: 2, valore: 20 }
  ];
  const f = frontieraCompletamento(pool, { D: 1, A: 1 }, 20, costo, valore);
  assert.equal(f[20], 160, 'il miglior difensore piu il miglior attaccante');
  assert.equal(f[6], 60, 'con 6 crediti: D da 4 (40) piu A da 2 (20)');
  for (let c = 1; c <= 20; c++) {
    if (f[c - 1] <= IMPOSSIBILE / 2) continue;
    assert.ok(f[c] >= f[c - 1], `non monotona in ${c}`);
  }
});

test('frontieraCompletamento: un ruolo senza candidati rende il piano infattibile', () => {
  const pool = [{ ruolo: 'D', costo: 1, valore: 10 }];
  const f = frontieraCompletamento(pool, { D: 1, A: 1 }, 30, costo, valore);
  assert.ok(f[30] <= IMPOSSIBILE / 2);
});

test('frontieraCompletamento: nessun bisogno significa nessun vincolo', () => {
  const f = frontieraCompletamento([], {}, 10, costo, valore);
  assert.equal(f[10], 0);
});

/* --- Blocco portieri ------------------------------------------------------ */

const gk = (p, mv, fma) => ({ p, mv, fma });

test('bloccoPortieri: un blocco copre il posto quasi sempre', () => {
  const solo = bloccoPortieri([gk(0.95, 6.1, 6.3)]);
  const blocco = bloccoPortieri([gk(0.95, 6.1, 6.3), gk(0.05, 5.9, 6.0), gk(0.05, 5.8, 5.9)]);

  assert.ok(Math.abs(solo.disponibilita - 0.95) < 1e-6, 'un portiere solo vale la sua titolarita');
  assert.ok(blocco.disponibilita > 0.99, `il blocco copre il posto: ${blocco.disponibilita}`);
  assert.ok(blocco.presenzeAttese > solo.presenzeAttese);
  assert.ok(blocco.puntiStagione > solo.puntiStagione, 'le giornate coperte in piu valgono punti');
});

test('bloccoPortieri: la riserva non usa la propria titolarita ma la condizionata', () => {
  // Se la riserva pesasse 0,05 il posto resterebbe scoperto nel 95% delle
  // giornate senza il titolare: e' proprio l'errore che il blocco corregge.
  const g = gerarchiaBlocco([gk(0.90, 6.1, 6.3), gk(0.05, 5.9, 6.0)]);
  assert.equal(g[0].p, 0.90, 'il titolare tiene la sua titolarita');
  assert.equal(g[1].p, DISPONIBILITA_RISERVA);

  const blocco = bloccoPortieri([gk(0.90, 6.1, 6.3), gk(0.05, 5.9, 6.0)]);
  assert.ok(blocco.disponibilita > 0.98, `atteso >0,98, ottenuto ${blocco.disponibilita}`);
});

test('bloccoPortieri: la fantamedia resta quella di chi gioca davvero', () => {
  const blocco = bloccoPortieri([gk(1, 6.5, 7.0), gk(1, 5.0, 5.0)]);
  // Il titolare c'e' sempre: la riserva non deve abbassare la media.
  assert.equal(blocco.fma, 7.0);
  assert.equal(blocco.mv, 6.5);
  assert.equal(blocco.disponibilita, 1);
});

test('bloccoPortieri: piu forte non vale meno, e un blocco vuoto non esplode', () => {
  const debole = bloccoPortieri([gk(0.9, 5.8, 5.7), gk(0.05, 5.6, 5.5)]);
  const forte = bloccoPortieri([gk(0.9, 6.4, 6.8), gk(0.05, 6.0, 6.1)]);
  assert.ok(forte.puntiStagione > debole.puntiStagione);

  const vuoto = bloccoPortieri([]);
  assert.equal(vuoto.puntiStagione, 0);
  assert.equal(vuoto.disponibilita, 0);
});

test('bloccoPortieri: il modificatore vede la stessa disponibilita del blocco', () => {
  const portieri = [gk(0.90, 6.1, 6.3), gk(0.05, 5.9, 6.0), gk(0.05, 5.8, 5.9)];
  const blocco = bloccoPortieri(portieri);
  const difensori = [dif(6.3, 1), dif(6.2, 1), dif(6.2, 1), dif(6.1, 1)];

  const conBlocco = modificatoreDifesaAtteso({
    ...base, portieri: blocco.gerarchia, difensori
  });
  const soloTitolare = modificatoreDifesaAtteso({
    ...base, portieri: [portieri[0]], difensori
  });

  assert.ok(conBlocco.probAttivo > soloTitolare.probAttivo,
    'il blocco tiene acceso il modificatore anche quando il titolare non c e');
  assert.ok(conBlocco.bonusAtteso > soloTitolare.bonusAtteso);
});
