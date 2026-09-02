# Proposte: cosa prendere da fishertiger, cosa semplificare

Confronto fra questo repo e [Zannael/fishertiger](https://github.com/Zannael/fishertiger),
piu' le semplificazioni che emergono leggendo il codice. Ogni voce e' verificata sul
codice, non dedotta dai README.

> **Stato.** I punti 1.1, 1.2, 1.4, 1.5 e 2.5 sono stati implementati; il 1.3 e'
> fatto nel pannello del candidato e in tabella resta legato al §2.3. Le voci
> restanti (2.1, 2.2, 2.3, 2.4, 3.2–3.4) sono ancora proposte.

Le due app risolvono lo stesso problema con due filosofie opposte:

| | fantacalcio (questo) | fishertiger |
| --- | --- | --- |
| Forma | un file statico, zero build | API Python + client Vite/React + Docker |
| Avvio | doppio clic su `index.html` | venv, `npm install`, due terminali, upload xlsx |
| Dati | listone trascritto in TSV | pipeline su piu' stagioni storiche |
| Valore giocatore | derivato da FVM/quotazione | proiezione per giornata da statistiche storiche |
| Prezzo | appreso dall'asta in corso | split di ruolo configurato (P7/D18/C25/A50) |

Il vantaggio nostro e' l'attrito zero: si apre il giorno dell'asta e funziona. Non va
barattato. Il vantaggio loro e' che i numeri poggiano su dati veri invece che su una
funzione di FVM. Le proposte sotto prendono il secondo senza perdere il primo.

---

## 1. Cosa conviene prendere

### 1.1 La disponibilita' dentro il modificatore di difesa — FATTO

`calcolaModificatoreSquadra` prende i 3 difensori con MV piu' alta e li media col
portiere. `tit` (la probabilita' di giocare, che gia' calcoliamo in
`VALUTAZIONI_CACHE`) non compare mai. Un difensore al 15% di titolarita' pesa quanto
uno al 95%: e' proprio il caso in cui il modificatore ti tradisce.

fishertiger (`web/src/defense-modifier.js`) marginalizza in modo esatto: enumera i
2^n scenari di presenza, e in ognuno calcola il bonus con i difensori effettivamente
in campo.

Implementato in `src/motore.js` come `modificatoreDifesaAtteso`: enumera gli scenari
di presenza dei difensori in rosa (al piu' 2^8 = 256) incrociati con il primo portiere
disponibile, e pesa ciascuno per `tit`. La panchina entra nel conto, perche' e' proprio
cio' che protegge il modificatore.

Misurato sull'app, a parita' di MV:

| difesa | bonus atteso | probabilita' che il bonus scatti |
| --- | --- | --- |
| quattro difensori al 95% | **+1.05** | 77% |
| stesso reparto, quarto al 15% | **+0.17** | 12% |
| piu' un quinto difensore al 90% in panchina | **+1.04** | 76% |

Prima le tre righe davano lo stesso numero. La seconda e' la rosa che tradisce; la
terza dice perche' un quarto difensore affidabile vale piu' di un terzo difensore
forte ma incerto.

Ricaduta collaterale: il modificatore ora si calcola in un punto solo
(`simulaFormazione`), e le altre due viste leggono quel risultato invece di
ricalcolarlo. E' la stessa classe di bug del §3.1, chiusa per costruzione.

### 1.2 Dire *a cosa serve* un giocatore, non solo quanto vale — FATTO

fishertiger classifica ogni candidato in `STARTER` / `ROTATION` / `HANDCUFF` /
`COVERAGE` / `DEPTH`, confrontando l'utilita' della rosa con e senza di lui.

Implementato come `classificaCandidato`, con tre esiti:

| esito | quando | dettaglio mostrato |
| --- | --- | --- |
| **Entra subito nel Best XI** | il candidato compare nell'XI ricalcolato | guadagno in pt/giornata e modulo risultante |
| **Copertura che vale punti** | resta fuori dall'XI ma la rosa guadagna comunque | quanto, e quanto di quello e' modificatore |
| **Solo profondita'** | riempie uno slot senza cambiare ne' XI ne' modificatore | quanti slot restano nel ruolo |

Una lezione presa strada facendo: la prima versione classificava sul
`vantaggioAlMercato` della DP, e finiva per dire «non migliora il piano rosa» su
**ogni** giocatore. Non era un difetto della DP: la frontiera e' per definizione il
massimo, quindi impegnarsi su un giocatore *preciso* al prezzo di mercato non puo'
che valere meno del paniere ottimo. Come fa fishertiger, lo scopo va tenuto separato
dal prezzo — `purpose` da una parte, `recommendation` dall'altra. Ora lo scopo guarda
solo l'utilita' marginale in rosa; il prezzo lo dice la fascia.

La categoria «copertura» e' interessante proprio grazie al §1.1: con un quarto
difensore al 15%, un quinto difensore affidabile che **non entra in formazione** vale
+0.6 pt/giornata, di cui +0.58 di solo modificatore. Prima il modello non sapeva
nemmeno esprimere quel caso.

Nota: sui portieri la **griglia degli incroci** che abbiamo e' piu' forte del loro
`HANDCUFF`/`ROTATION`, perche' modella la regola dei tre portieri da squadre diverse
che loro non hanno. Quella resta com'e'.

### 1.3 Una fascia di prezzo al posto del semaforo — FATTO nel pannello

Il pannello del candidato ora mostra una barra con l'intervallo di mercato
(`mkt.min`–`mkt.max`), il prezzo atteso e il **prezzo di indifferenza** dato dalla DP.

Rinominare quel numero e' stata la parte che conta. Si chiamava «max bid», e a inizio
asta sta *sotto* il prezzo di mercato per quasi tutti: letto come tetto sembrava dire
«non comprare nessuno». E' invece la soglia oltre la quale gli stessi crediti rendono
di piu' sul resto della rosa — la disciplina del VOR, non un divieto. La frase sotto
la barra ora lo dice: pagare di piu' e' legittimo, significa scegliere di risparmiare
altrove.

**Resta da fare in tabella**: la riga del listone mostra ancora «Tetto rapido» e
semaforo, entrambi euristici. Sostituirli richiede il §2.3, perche' oggi il numero
esatto si calcola solo sulla riga aperta.

### 1.4 Test unitari sulla matematica — FATTO

`npm test` (Playwright su `dist/artifact.html`) e' una buona suite end-to-end: 86
verifiche, tutte verdi, incluse quelle sull'igiene della pagina. Ma non riesce a
fissare le proprieta' del modello, perche' deve passare dal DOM.

Ora `src/motore.js` e' un file `.js` vero — statistica di base, modificatore di difesa,
frontiera di completamento — inlinato dal build per il browser e caricato con `require`
dai test. `npm run test:unit` esegue 16 verifiche in circa 120 ms: monotonia della
frontiera nel budget, rispetto esatto degli slot, riproducibilita' del generatore,
e le proprieta' del modificatore (crolla con un difensore fragile, risale con la
panchina, cresce con la disponibilita', vale 1 a presenze certe).

Controllati per mutazione: forzando `pDif = 1` nel motore — cioe' rimettendo il
comportamento di prima — due test diventano rossi. Non sono test che passano e basta.

E' anche il primo passo concreto verso il §2.1: `src/motore.js` viene interpolato alla
lettera nel build, senza un solo escape, perche' e' scritto senza template literal.

### 1.5 Licenza e attribuzione dei dati — FATTO

Aggiunti `LICENSE` (MIT, per il codice) e `DATA_SOURCES.md`, che elenca file per file
da dove viene ogni dato.

Una differenza voluta rispetto a loro: fishertiger licenzia `data/raw/` come CC BY 4.0.
Noi no, e non possiamo — il listone e' materiale di Fantacalcio.it, trascritto per uso
personale: attribuirlo si', rilicenziarlo no. `DATA_SOURCES.md` lo dice esplicitamente
invece di lasciarlo implicito.

## Cosa invece non conviene prendere

- **Il backend Python e il client React.** Costano l'attrito d'avvio, che e' il nostro
  vantaggio principale. Non c'e' niente in `advisor/` che richieda un server: e'
  lettura di file e calcolo.
- **La pipeline di proiezione storica** (pesi 60/30/10, tassi per 90 minuti, sconto
  rotazione europea). Non e' un problema di codice ma di dati: servono piu' stagioni
  di statistiche che in `data/` non ci sono. Le nostre `mv`/`bonusNet` derivate da FVM
  sono una proxy dichiarata; sostituirle significa aggiungere una fonte.
- **Lo split di budget per ruolo fissato** (P7/D18/C25/A50). Il nostro
  `PRIORI` e' solo un prior che si spegne man mano che l'asta produce prezzi veri, ed
  e' la cosa giusta per una app che gira *durante* l'asta.

---

## 2. Semplificazioni: le cose che non servono

### 2.1 L'app intera vive dentro un template literal — il problema piu' grave

`tools/build-app.js` contiene tutta l'applicazione come una singola stringa backtick e
la scrive in `index.html`. Verificato: rigenerando, `index.html` esce byte per byte
identico. Quindi `index.html` (285 KB, 3058 righe) e' **interamente derivato**, ed e'
committato lo stesso.

Il costo si misura: dentro `build-app.js` ci sono **164 backtick** e **325 `${`**
che vanno scritti con l'escape. Ogni template literal dell'app e' scritto due volte in
due sintassi diverse. Nessun editor sa evidenziarlo, nessun linter sa leggerlo, e un
backtick dimenticato in un commento rompe il build a 900 righe di distanza — mi e'
successo scrivendo la correzione di §3.1, al primo tentativo.

**Proposta: invertire la direzione.**

1. `index.html` diventa la sorgente vera, modificata a mano.
2. `build-data.js` scrive solo `data/players.generated.js` e smette di chiamare
   `build-app.js`.
3. `index.html` carica i dati con `<script src="data/players.generated.js"></script>`
   (script classico: funziona anche via `file://`, quindi il doppio clic resta).
4. `build-artifact.js` continua a fare quello che gia' fa, piu' l'inline dei dati.
5. `tools/build-app.js` si cancella: −132 KB, −2413 righe di duplicato con escape.

Ricaduta: `index.html` scende da 285 KB a ~147 KB (il 49% del file oggi e' il blocco
`PLAYERS`), e aggiornare il listone smette di produrre un diff da 285 KB su un file di
codice.

### 2.2 Due file generati committati

`index.html` (285 KB) e `dist/artifact.html` (334 KB) sono entrambi derivati: 620 KB
di diff ad ogni aggiornamento dati. `index.html` deve restare (serve a Pages), ma dopo
§2.1 e' sottile. `dist/` puo' uscire da git e nascere in CI al momento della
pubblicazione.

### 2.3 Due MAX BID che rispondono alla stessa domanda

Nella riga del listone conviveno:

- **«Tetto rapido»** (`mioMax`, riga 2395): euristico, il prodotto di cinque fattori
  tarati a mano — `budgetRatio`, `roleNeedBoost`, `scarcityMultiplier`, `mvarBoost`,
  piu' `premioSalto`;
- **«Max bid da piano rosa»** (riga 2449): esatto, dalla DP di
  `frontieraCompletamento` — il prezzo massimo oltre il quale la rosa migliore che
  puoi ancora chiudere vale meno di quella senza di lui.

Il secondo e' la risposta giusta; il primo esiste solo perche' il secondo si calcola
soltanto quando apri una riga. Il primo pilota anche il semaforo (riga 1810), quindi
il consiglio in tabella e il consiglio nel pannello possono contraddirsi.

**Il vincolo di costo non regge piu': l'ho misurato.** La frontiera completa nel caso
peggiore (rosa vuota, 500 crediti, 525 giocatori liberi) impiega **59 ms**, e cala
rapidamente man mano che slot e budget si riducono. Le varianti da precalcolare sono
cinque (la baseline piu' una per ruolo), quindi ~300 ms nel caso peggiore — troppo per
ogni `render()`, ma la frontiera dipende solo dallo stato della rosa, non dai filtri:
basta metterla in cache e ricalcolarla sulle assegnazioni.

Fatto questo si cancellano `scarcityMultiplier`, `mvarBoost`, `roleNeedBoost`,
`budgetRatio` e le loro costanti, e resta un solo numero, esatto e spiegabile.

### 2.4 `tools/test-matematico-8punti.js` e' peso morto — cancellare

Non e' in `package.json`, quindi non gira mai in CI. Eseguito a mano:

- chiama `calcolaPrezziEMioMax` con **6 argomenti su 7** (manca `tierMap`, aggiunto
  dopo): il file e' rimasto indietro rispetto alla firma;
- non ignora `CHROMIUM_PATH` come fa `test-app.js`, quindi fallisce con l'errore
  sbagliato in ogni ambiente che non ha i browser nel posto di default;
- contiene **zero assertion** e esce sempre con **0**;
- stampa comunque «✅ TUTTI E GLI 8 TEST MATEMATICI SONO STATI ESEGUITI E VALIDATI CON
  SUCCESSO».

E il TEST 8 e' smentito dal proprio output. Dichiara «con l'uscita dei top, la baseline
si adatta dinamicamente» e stampa `6.27` prima e `6.27` dopo. Non e' un difetto del
modello: in `calcolaMVAR_e_Scarsita` la baseline e' `liberi[slots - 1]`, e vendere i
primi *k* giocatori toglie *k* elementi da `liberi` **e** *k* da `slots`, quindi punta
esattamente allo stesso giocatore. L'invarianza e' una proprieta' voluta del VOR a
slot chiusi — vale la pena scriverla nel README, ma un test non potra' mai
dimostrare il contrario.

Un file che si autoproclama verde senza verificare nulla e' peggio di nessun file: da'
fiducia falsa. Le due o tre verifiche che valgono (semaforo su tag RISCHIO, scaglioni
del modificatore) si spostano in `npm test` come assertion vere.

### 2.5 `package-lock.json` e' in `.gitignore` — FATTO

Con `playwright: ^1.48.0` non pinnato, due cloni potevano installare due Playwright
diversi e ottenere due risultati diversi da `npm test`. Il lock e' ora committato.

Vale la pena aggiungere anche un workflow minimo (`npm ci && npm run build && npm test`):
il repository non ha nessuna CI, ed e' il motivo per cui il file del §2.4 ha potuto
restare rotto senza che nessuno se ne accorgesse.

### 2.6 Sette pannelli di consiglio in tre viste

Segnali sintetici, allarmi asta, andamento prezzi, avversari live, nomination alert,
indice di scarsita', matrice necessita' avversari, radar rilanci. Durante una chiamata
si hanno circa cinque secondi per decidere. Non propongo tagli a scatola chiusa perche'
dipende da come la usi davvero, ma vale la domanda: quali di questi hai guardato
nell'ultima asta? Quelli mai guardati sono le prime «cose che non servono».

---

## 3. Difetti confermati

### 3.1 Modificatore di difesa concesso a un modulo da 3 difensori — CORRETTO

`PROFILO_LEGA.modificatore.difensoriMinimi` vale 4, come la regola di lega.
`simulaFormazione` lo rispetta (riga 1893: `nStrD >= difensoriMinimi`), ma `render()`
chiama `calcolaModificatoreSquadra(bestXI.titolari)` **senza** quel controllo, e la
funzione si accontentava di `difensori.length < 3`.

Riproduzione (rosa da 1 P, 3 D, 4 C, 3 A → Best XI 3-4-3):

| | prima | dopo |
| --- | --- | --- |
| Modulo Best XI | 3-4-3 | 3-4-3 |
| Difensori in campo | 3 | 3 |
| Header «Mod Difesa» | **+1.23** | **0.00** |

Con 5 difensori in rosa il Best XI passa a 4-3-3 e il modificatore torna a +1.23,
com'e' giusto. La correzione ha spostato il controllo **dentro**
`calcolaModificatoreSquadra`; il §1.1 e' poi andato oltre, riducendo a uno solo i punti
in cui il modificatore viene calcolato, cosi' la divergenza non e' piu' esprimibile.

### 3.2 «La mia squadra e' `squadre[0]`» e' una convenzione implicita

`statoSquadra(squadre[0])`, `squadre.slice(1)` in `simulaConcorrenza`,
`for (let i = 1; ...)` in `chiPuoRilanciare`. Funziona, ma e' un invariante non
dichiarato sparso in piu' punti. Una costante `IO = 0` con un commento costa nulla.

### 3.3 Due tetti diversi per lo stesso avversario

`chiPuoRilanciare` usa `quantoPosso(...).medio` come rilancio plausibile;
`simulaConcorrenza` usa `quantoPosso(...).tetto`. Due modelli dello stesso rivale
nella stessa schermata. Va bene se e' voluto (uno realistico, uno di capienza), ma
allora va detto nell'interfaccia.

### 3.4 Il `sigma = 0.28` del modificatore non e' documentato

E' la deviazione standard con cui la gaussiana spalma il bonus fra gli scaglioni: il
parametro che piu' di ogni altro decide quanto vale il modificatore. Il README spiega
il motore del budget nel dettaglio e su questo tace.

---

## 4. Ordine consigliato

| # | Intervento | § | Stato |
| --- | --- | --- | --- |
| 1 | Committare `package-lock.json` | 2.5 | fatto |
| 2 | `LICENSE` + attribuzione dati | 1.5 | fatto |
| 3 | Estrarre la matematica e testarla con `node --test` | 1.4 | fatto (`src/motore.js`) |
| 4 | Disponibilita' nel modificatore di difesa | 1.1 | fatto |
| 5 | «A cosa serve» il giocatore | 1.2 | fatto |
| 6 | Fascia di prezzo | 1.3 | fatto nel pannello; in tabella dipende dal 8 |
| 7 | Cancellare `test-matematico-8punti.js` | 2.4 | da fare |
| 8 | Frontiera in cache → un solo MAX BID esatto | 2.3 | da fare |
| 9 | Invertire `build-app.js` → `index.html` sorgente | 2.1 | da fare |
| 10 | Workflow CI minimo | 2.5 | da fare |

Il 9 resta lo spartiacque. Scrivendo le modifiche di questo giro ho rotto il build
**due volte** con un backtick dentro un commento: finche' l'app vive in una stringa con
l'escape, ogni modifica costa il doppio. `src/motore.js` mostra la direzione — un file
`.js` normale, interpolato alla lettera, senza un solo carattere di escape.
