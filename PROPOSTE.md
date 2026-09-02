# Proposte: cosa prendere da fishertiger, cosa semplificare

Confronto fra questo repo e [Zannael/fishertiger](https://github.com/Zannael/fishertiger),
piu' le semplificazioni che emergono leggendo il codice. Ogni voce e' verificata sul
codice, non dedotta dai README.

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

### 1.1 La disponibilita' dentro il modificatore di difesa — alto valore, ~30 righe

`calcolaModificatoreSquadra` prende i 3 difensori con MV piu' alta e li media col
portiere. `tit` (la probabilita' di giocare, che gia' calcoliamo in
`VALUTAZIONI_CACHE`) non compare mai. Un difensore al 15% di titolarita' pesa quanto
uno al 95%: e' proprio il caso in cui il modificatore ti tradisce.

fishertiger (`web/src/defense-modifier.js`) marginalizza in modo esatto: enumera i
2^n scenari di presenza, e in ognuno calcola il bonus con i difensori effettivamente
in campo.

Da noi si innesta senza toccare altro: enumerare i sottoinsiemi dei primi ~6
difensori, pesare per `tit`, prendere i 3 migliori presenti, e passare la media alla
gaussiana che gia' abbiamo. Costo trascurabile (64 combinazioni), e il numero in testa
smette di essere ottimista sulle rose fragili.

### 1.2 Dire *a cosa serve* un giocatore, non solo quanto vale — alto valore, ~40 righe

fishertiger classifica ogni candidato in `STARTER` / `ROTATION` / `HANDCUFF` /
`COVERAGE` / `DEPTH`, confrontando l'utilita' della rosa con e senza di lui.

Noi quel confronto **lo facciamo gia'**, ed e' pure esatto invece che euristico:
`calcolaPianoCompletamento` calcola `valoreBaseline` e `vantaggioAlMercato` con una DP.
Manca solo tradurre il numero in una frase. Con i valori gia' in mano:

- `vantaggioAlMercato <= 0` → «non migliora il piano rosa»
- primo del suo ruolo → «titolare»
- ruolo gia' coperto ma vantaggio positivo → «copertura»

E' il cambiamento con il miglior rapporto fra utilita' e righe: rende leggibile un
calcolo che gia' paghiamo.

Nota: sui portieri la **griglia degli incroci** che abbiamo e' piu' forte del loro
`HANDCUFF`/`ROTATION`, perche' modella la regola dei tre portieri da squadre diverse
che loro non hanno. Quella resta com'e'.

### 1.3 Una fascia di prezzo al posto del semaforo — medio valore, ~20 righe

Loro mostrano una barra con `idealMin … idealMax … maxBid` e il prezzo corrente
sopra. Noi mostriamo un semaforo `COMPRA/ATTENDI/LASCIA` piu' due tetti diversi
(vedi §2.3). Con `mkt.min`, `mkt.atteso` e il `maxBid` del piano — numeri che gia'
calcoliamo — la barra e' piu' informativa del semaforo e rende superfluo tararne le
soglie.

### 1.4 Test unitari sulla matematica — medio valore

`npm test` (Playwright su `dist/artifact.html`) e' una buona suite end-to-end: 26
verifiche, tutte verdi, incluse quelle sull'igiene della pagina. Ma non riesce a
fissare le proprieta' del modello, perche' deve passare dal DOM.

fishertiger tiene la matematica in moduli puri e li verifica con `node --test`
(`web/tests/lineup-utility.test.js`, `auction-state.test.js`, …). Se estraiamo le
funzioni pure (§2.1 lo rende naturale) possiamo asserire cose come:

- il max bid non supera mai `st.capienza`;
- a economia chiusa la somma dei `valorePuro` sta dentro il monte crediti della lega;
- MVAR e' monotona nella fascia.

### 1.5 Licenza e attribuzione dei dati — basso costo, va fatto

fishertiger ha `LICENSE` (MIT), `DATA_LICENSE.md` (CC BY 4.0) e `DATA_SOURCES.md`.
Noi pubblichiamo su GitHub Pages una trascrizione del listone Fantacalcio.it **senza
nessun file di licenza**. Il README cita gia' le fonti: basta formalizzarle.

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

### 2.5 `package-lock.json` e' in `.gitignore`

Con `playwright: ^1.48.0` non pinnato, due cloni possono installare due Playwright
diversi e ottenere due risultati diversi da `npm test`. Il lock va committato.

### 2.6 Sette pannelli di consiglio in tre viste

Segnali sintetici, allarmi asta, andamento prezzi, avversari live, nomination alert,
indice di scarsita', matrice necessita' avversari, radar rilanci. Durante una chiamata
si hanno circa cinque secondi per decidere. Non propongo tagli a scatola chiusa perche'
dipende da come la usi davvero, ma vale la domanda: quali di questi hai guardato
nell'ultima asta? Quelli mai guardati sono le prime «cose che non servono».

---

## 3. Difetti confermati

### 3.1 Modificatore di difesa concesso a un modulo da 3 difensori — corretto in questo ramo

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
com'e' giusto. La correzione sposta il controllo **dentro** `calcolaModificatoreSquadra`,
cosi' nessun chiamante puo' piu' aggirarlo. `npm test`: 26 verifiche verdi.

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

| # | Intervento | § | Effetto |
| --- | --- | --- | --- |
| 1 | Cancellare `test-matematico-8punti.js` | 2.4 | toglie fiducia falsa |
| 2 | Committare `package-lock.json` | 2.5 | test riproducibili |
| 3 | `LICENSE` + attribuzione dati | 1.5 | dovuto, siamo pubblici |
| 4 | Invertire `build-app.js` → `index.html` sorgente | 2.1 | −2413 righe, codice modificabile |
| 5 | Estrarre la matematica e testarla con `node --test` | 1.4 | abilitato dal 4 |
| 6 | Frontiera in cache → un solo MAX BID esatto | 2.3 | −5 fattori euristici |
| 7 | Disponibilita' nel modificatore di difesa | 1.1 | numero onesto sulle rose fragili |
| 8 | «A cosa serve» il giocatore | 1.2 | rende leggibile la DP |
| 9 | Fascia di prezzo al posto del semaforo | 1.3 | dipende dal 6 |

I primi tre sono manutenzione e si fanno in mezz'ora. Il 4 e' il vero spartiacque:
finche' l'app vive in una stringa con l'escape, ogni modifica successiva costa il
doppio.
