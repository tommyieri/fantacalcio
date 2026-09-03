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
const INDISPONIBILI = path.join(ROOT, 'data/indisponibili.tsv');
const FANTALGORITMO = path.join(ROOT, 'data/fantalgoritmo.tsv');
const STORICO = path.join(ROOT, 'data/storico.tsv');
const SOS_TITOLARI = path.join(ROOT, 'data/sosfanta/titolari.csv');
const SOS_PIAZZATI = path.join(ROOT, 'data/sosfanta/piazzati.csv');
const FORMAZIONI_FANTACALCIO = path.join(ROOT, 'data/fonti/formazioni-fantacalcio.json');

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

/* --- Contesto SOS Fanta da FisherTiger ----------------------------------- */

// Questi file non alimentano mai il listone: aggiungono soltanto segnali di
// titolarita' e piazzati ai giocatori gia' presenti nel PDF ufficiale. Il match
// richiede nome e squadra normalizzati, per evitare di creare voci estranee.
function parseCsv(testo) {
  const righeCsv = [];
  let riga = [], campo = '', traVirgolette = false;
  for (let i = 0; i < testo.length; i++) {
    const ch = testo[i];
    if (ch === '"') {
      if (traVirgolette && testo[i + 1] === '"') { campo += '"'; i++; }
      else traVirgolette = !traVirgolette;
    } else if (ch === ',' && !traVirgolette) {
      riga.push(campo); campo = '';
    } else if ((ch === '\n' || ch === '\r') && !traVirgolette) {
      if (ch === '\r' && testo[i + 1] === '\n') i++;
      riga.push(campo); campo = '';
      if (riga.some(c => c.length)) righeCsv.push(riga);
      riga = [];
    } else campo += ch;
  }
  if (campo.length || riga.length) { riga.push(campo); righeCsv.push(riga); }
  const [header, ...corpo] = righeCsv;
  return corpo.map(celle => Object.fromEntries(header.map((nome, i) => [nome, celle[i] ?? ''])));
}

function chiaveIdentita(nome, squadra) {
  const pulisci = valore => String(valore ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${pulisci(nome)}||${pulisci(squadra)}`;
}

const perIdentita = new Map(giocatori.map(g => [chiaveIdentita(g.nome, g.squadra), g]));
let sosTitolariAgganciati = 0;
let sosPiazzatiAgganciati = 0;
for (const riga of parseCsv(fs.readFileSync(SOS_TITOLARI, 'utf8'))) {
  const g = perIdentita.get(chiaveIdentita(riga.nome, riga.squadra));
  if (!g) continue;
  const status = String(riga.status).trim().toUpperCase();
  if (!['TITOLARE', 'BALLOTTAGGIO', 'RISERVA'].includes(status)) continue;
  g.sos = { ...(g.sos ?? {}), status, gerarchiaPortiere: String(riga.gerarchia_portiere ?? '').trim().toUpperCase() || undefined };
  sosTitolariAgganciati++;
}
for (const riga of parseCsv(fs.readFileSync(SOS_PIAZZATI, 'utf8'))) {
  const g = perIdentita.get(chiaveIdentita(riga.nome, riga.squadra));
  if (!g) continue;
  const tipo = String(riga.tipo).trim().toUpperCase();
  const priorita = Number(riga.priorita);
  if (!['RIGORI', 'PUNIZIONI', 'CORNER'].includes(tipo) || !Number.isInteger(priorita) || priorita < 1) continue;
  g.sos = { ...(g.sos ?? {}), piazzati: { ...(g.sos?.piazzati ?? {}), [tipo]: Math.min(g.sos?.piazzati?.[tipo] ?? Infinity, priorita) } };
  sosPiazzatiAgganciati++;
}

/* --- Probabili formazioni aggiornate ------------------------------------- */

if (!fs.existsSync(FORMAZIONI_FANTACALCIO)) {
  throw new Error('manca data/fonti/formazioni-fantacalcio.json: esegui prima "npm run fonti"');
}
const fonteFormazioni = JSON.parse(fs.readFileSync(FORMAZIONI_FANTACALCIO, 'utf8'));
if (!Array.isArray(fonteFormazioni.squadre) || fonteFormazioni.squadre.length !== 20) {
  throw new Error('formazioni-fantacalcio.json non contiene 20 squadre');
}
const formazioniProbabili = {};
let formazioneXIagganciati = 0;
let formazioneAlternativeAgganciate = 0;
for (const squadraFonte of fonteFormazioni.squadre) {
  const cod = CODICI[squadraFonte.squadra];
  if (!cod) throw new Error(`formazioni-fantacalcio.json: squadra sconosciuta ${squadraFonte.squadra}`);
  const abbina = giocatore => perIdentita.get(chiaveIdentita(giocatore.nome, squadraFonte.squadra));
  const titolari = [];
  const alternative = [];
  for (const giocatore of squadraFonte.titolari) {
    const g = abbina(giocatore);
    if (!g) continue;
    g.formazione = { probabilita: giocatore.probabilita, gruppo: 'XI' };
    titolari.push({ id: g.id, probabilita: giocatore.probabilita });
    formazioneXIagganciati++;
  }
  for (const giocatore of squadraFonte.panchina) {
    const g = abbina(giocatore);
    if (!g || giocatore.probabilita < 30 || titolari.some(t => t.id === g.id)) continue;
    g.formazione = g.formazione ?? { probabilita: giocatore.probabilita, gruppo: 'ALTERNATIVA' };
    alternative.push({ id: g.id, probabilita: giocatore.probabilita });
    formazioneAlternativeAgganciate++;
  }
  formazioniProbabili[cod] = {
    modulo: squadraFonte.modulo,
    titolari,
    alternative: alternative.slice(0, 8)
  };
}

/* --- Fantalgoritmo: prezzi reali d'asta e statistiche vere ------------------ */

// I due dati che il listone ufficiale non ha.
//
// `prezzoMedioAste` e' quanto un giocatore viene pagato davvero, misurato su
// molte aste: la somma dei contesi fa il 98% del monte crediti di una lega da
// dieci partecipanti e 500 crediti, quindi e' un'economia chiusa gia' calibrata
// e non va riscalata. `prezzoStat` e' invece il prezzo *consigliato*, che somma
// al 74%: e' volutamente piu' basso di quanto le aste pagano, ed e' la stessa
// cosa che il nostro prezzo di indifferenza cerca di dire.
//
// `storico.tsv` porta due stagioni di media voto, fantamedia e presenze reali.
// Chi non compare non ha storico recente in Serie A: e' un'informazione, non un
// buco, e l'app la mostra.
function leggiTsv(percorso) {
  const [intestazione, ...righe] = fs.readFileSync(percorso, 'utf8').trim().split('\n');
  const colonne = intestazione.split('\t');
  return righe.filter(r => r.trim()).map(riga => {
    const celle = riga.split('\t');
    return Object.fromEntries(colonne.map((c, i) => [c, celle[i] ?? '']));
  });
}

const numero = v => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) && String(v).trim() !== '' ? n : undefined;
};

let prezziAgganciati = 0;
const prezziMancanti = [];
for (const riga of leggiTsv(FANTALGORITMO)) {
  const g = perIdentita.get(chiaveIdentita(riga.nome, riga.squadra));
  if (!g) { prezziMancanti.push(`${riga.nome} (${riga.squadra})`); continue; }
  const dati = {
    mercato: numero(riga.prezzoMedioAste),
    consigliato: numero(riga.prezzoStat),
    golMax: numero(riga.prezzoGolMax),
    ia: numero(riga.ia),
    fascia: riga.fascia || undefined,
    accoppiata: riga.accoppiata || undefined
  };
  for (const k of Object.keys(dati)) if (dati[k] === undefined) delete dati[k];
  if (Object.keys(dati).length) { g.fanta = dati; prezziAgganciati++; }
}

let storicoAgganciati = 0;
const perSoloNome = new Map();
for (const g of giocatori) {
  const k = chiaveIdentita(g.nome, '');
  perSoloNome.set(k, (perSoloNome.get(k) ?? []).concat(g));
}
for (const riga of leggiTsv(STORICO)) {
  // Molte righe storiche non portano la squadra: quando il cognome nel listone
  // e' unico l'aggancio resta sicuro, altrimenti si lascia perdere.
  let g = riga.squadra ? perIdentita.get(chiaveIdentita(riga.nome, riga.squadra)) : undefined;
  if (!g) {
    const candidati = perSoloNome.get(chiaveIdentita(riga.nome, '')) ?? [];
    if (candidati.length === 1) g = candidati[0];
  }
  if (!g) continue;
  const stagioni = [
    { pg: numero(riga.pg1), mv: numero(riga.mv1), fm: numero(riga.fm1), gol: numero(riga.gol1), assist: numero(riga.assist1), amm: numero(riga.amm1), gs: numero(riga.gs1) },
    { pg: numero(riga.pg2), mv: numero(riga.mv2), fm: numero(riga.fm2), gol: numero(riga.gol2), gs: numero(riga.gs2) }
  ].filter(s => s.pg !== undefined && s.mv !== undefined);
  if (!stagioni.length) continue;
  for (const st of stagioni) for (const k of Object.keys(st)) if (st[k] === undefined) delete st[k];
  g.storico = stagioni;
  storicoAgganciati++;
}

if (prezziMancanti.length) {
  console.log(`fantalgoritmo non nel listone: ${prezziMancanti.join(', ')}`);
}

/* --- Indisponibili: infortuni e squalifiche note al momento dell'asta ------ */

// Il listone e' una fotografia di fine mercato: gli infortuni successivi non ci
// sono, e un giocatore fermo fino a novembre quotato come se giocasse tutto
// l'anno e' il modo piu' rapido per buttare crediti. Qui la quotazione non si
// tocca: si annota quante giornate salta, e l'app abbassa di conseguenza la
// probabilita' di scendere in campo.
const INIZIO_STAGIONE = Date.parse('2026-08-23T00:00:00Z');
const GIORNATE_TOT = 38;

let indisponibiliAgganciati = 0;
const indisponibiliMancanti = [];
for (const riga of fs.readFileSync(INDISPONIBILI, 'utf8').trim().split('\n').slice(1)) {
  if (!riga.trim()) continue;
  const [nome, squadra, rientro, problema, fonti] = riga.split('\t');
  const g = perIdentita.get(chiaveIdentita(nome, squadra));
  if (!g) { indisponibiliMancanti.push(`${nome} (${squadra})`); continue; }

  const quando = Date.parse(`${String(rientro).trim()}T00:00:00Z`);
  if (!Number.isFinite(quando)) {
    throw new Error(`indisponibili.tsv: data di rientro non valida per ${nome}: "${rientro}"`);
  }
  // Una giornata a settimana: e' l'approssimazione giusta per decidere un
  // prezzo d'asta, non per compilare la formazione di una giornata precisa.
  const saltate = Math.max(0, Math.min(GIORNATE_TOT,
    Math.ceil((quando - INIZIO_STAGIONE) / (7 * 24 * 3600 * 1000))));

  g.indisponibile = { rientro: String(rientro).trim(), giornateSaltate: saltate, problema: String(problema).trim() };
  if (!g.tag.includes('RISCHIO')) g.tag.push('RISCHIO');
  g.nota = g.nota ? `${g.nota} ${problema}` : problema;
  g.fonti = [...new Set([...(g.fonti ?? []), ...String(fonti).split(';')])];
  indisponibiliAgganciati++;
}
// Un nome che non aggancia nessuno non deve far fallire il build: la lista
// arriva da fuori e puo' citare giocatori che nel nostro listone non ci sono.
if (indisponibiliMancanti.length) {
  console.log(`indisponibili non nel listone: ${indisponibiliMancanti.join(', ')}`);
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
  + `const FORMAZIONI_PROBABILI = ${JSON.stringify({
    fonte: fonteFormazioni.fonte,
    url: fonteFormazioni.url,
    aggiornatoIl: fonteFormazioni.aggiornatoIl,
    squadre: formazioniProbabili
  })};\n\n`
  + `const GRIGLIA = ${JSON.stringify(griglia)};\n`;
fs.writeFileSync(path.join(ROOT, 'data/players.generated.js'), out);

const conteggi = {};
for (const p of giocatori) conteggi[p.ruolo] = (conteggi[p.ruolo] ?? 0) + 1;
console.log(`righe listone:   ${dati.length}`);
console.log(`voci generate:   ${giocatori.length} (${Object.entries(conteggi).map(([k, v]) => k + ':' + v).join(', ')})`);
console.log(`annotati:        ${annotati}`);
console.log(`SOS Fanta:       ${sosTitolariAgganciati} titolarita', ${sosPiazzatiAgganciati} piazzati agganciati al listone ufficiale`);
console.log(`indisponibili:   ${indisponibiliAgganciati} agganciati da data/indisponibili.tsv`);
console.log(`Fantalgoritmo:   ${prezziAgganciati} prezzi d'asta reali, ${storicoAgganciati} con storico Serie A`);
console.log(`Formazioni:      ${formazioneXIagganciati}/220 XI e ${formazioneAlternativeAgganciate} alternative agganciate (Fantacalcio.it)`);
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
