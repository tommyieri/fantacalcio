# FantaStrategy Pro

Assistente per l'asta del fantacalcio, **Serie A 2026/27**.
Budget 500 crediti, rosa da 25 slot (3 portieri, 8 difensori, 8 centrocampisti, 6 attaccanti).
I portieri sono singoli: possono venire da tre squadre diverse.

## Come si usa

`index.html` e' l'applicazione: una pagina sola, HTML + Tailwind + JavaScript, nessun passaggio
di compilazione. Si apre con un doppio clic oppure si pubblica su GitHub Pages cosi' com'e'.
Tutti i dati dell'asta vengono salvati nel browser di chi la usa.

### Pubblicarla su GitHub Pages

Il repository e' gia' pronto: `index.html` sta nella radice e c'e' un `.nojekyll` che evita
l'elaborazione Jekyll. Serve solo attivare la pubblicazione, una volta sola:

1. **Settings** del repository, voce **Pages** nella colonna di sinistra;
2. in *Build and deployment*, **Source**: `Deploy from a branch`;
3. **Branch**: `main`, cartella `/ (root)`, poi **Save**.

Dopo un paio di minuti il sito e' online su
`https://tommyieri.github.io/fantacalcio/`. Ogni push su `main` lo aggiorna da solo.

Attenzione: con GitHub Pages il sito e' pubblico anche se il repository e' privato. Le rose
dell'asta pero' restano nel browser di ciascuno, non vengono caricate da nessuna parte.

## Il motore del budget

Non c'e' nessuna percentuale prefissata per reparto: quanto vale uno slot lo dice l'asta.
Il prezzo medio di ogni ruolo si ricava dai giocatori appena venduti — finche' gli acquisti
sono pochi si parte da una stima (la ripartizione mediana misurata sulle aste reali) e il peso
dell'osservato cresce con il numero di aggiudicazioni.

Da li' escono due numeri per ogni ruolo, che sono i due estremi della scelta:

- **con una rosa nella media**: mette da parte, per ogni altro slot che ti resta, il prezzo che
  quel ruolo sta facendo adesso. Se i difensori vanno a 20 e te ne mancano otto, quei 160
  crediti sono impegnati; se l'asta e' a buon mercato, il tetto si alza da solo.
- **fino a N spingendo**: la capienza, cioe' il limite oltre il quale la rosa non si chiude piu'
  perche' non resterebbe 1 credito per ogni slot vuoto.

Spendere fra i due significa decidere di stare sotto la media da qualche altra parte, che e'
esattamente il modo in cui si prende un top. La riga del listone lo dice: *dovrai risparmiare
altrove* quando il mercato chiede piu' della media sostenibile, *fuori portata* quando supera
la capienza.

## Il modificatore di difesa

La lega paga il bonus a chi porta a referto almeno quattro difensori, e la media
e' quella del portiere piu' i tre difensori migliori **fra quelli che hanno
davvero giocato**. Per questo il calcolo non prende i tre con la MV piu' alta:
enumera tutti gli scenari di presenza dei difensori in rosa (al piu' 2^8 su una
rosa da otto) incrociati con il primo portiere disponibile, e pesa ogni scenario
per la probabilita' di titolarita'.

La differenza non e' teorica. Quattro difensori affidabili a MV 6.2 valgono circa
+1.05 punti a giornata; sostituendo il quarto con uno di pari MV ma al 15% di
titolarita' si scende a +0.17, e aggiungendo un quinto difensore affidabile in
panchina si risale a +1.04. E' la panchina a proteggere il modificatore, ed e'
per questo che entra nel conto: un quarto difensore sicuro vale piu' di un terzo
difensore forte ma incerto.

Il bonus non e' una soglia secca: la media di quattro voti oscilla di giornata in
giornata, quindi lo scaglione raggiunto e' una variabile casuale. `sigma = 0.28`
e' la deviazione standard di quella media su una singola giornata — con quattro
voti quasi indipendenti, all'incirca meta' della dispersione del singolo voto.

## Il motore matematico

`src/motore.js` contiene le funzioni che non toccano ne' il DOM ne' lo stato
dell'asta: statistica di base, il modificatore di difesa e la frontiera esatta di
completamento rosa. Vive in due mondi — lo inlinea il build per il browser e lo
carica `require` per i test — quindi e' scritto senza `import`/`export` e senza
template literal.

Sono le funzioni che decidono i numeri, ed e' l'unica parte verificabile senza
avviare un browser: `npm run test:unit` le copre in una frazione di secondo.

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `npm run build` | Genera `dist/artifact.html`, la stessa app senza richieste di rete (Tailwind compilato inline, icone in SVG), per la pubblicazione come Artifact |
| `npm run test:unit` | Verifiche sulle funzioni pure di `src/motore.js`, senza browser (~120 ms) |
| `npm test` | Prima `test:unit`, poi le verifiche funzionali su `dist/artifact.html` con un browser headless |
| `npm run grid -- calendario.csv` | Ricalcola la griglia degli incroci portieri dal calendario ufficiale |
| `npm run data` | Rigenera l'elenco giocatori da `data/listone.tsv` |

## Griglia degli incroci portieri

L'indice fra due squadre e' il numero di giornate in cui giocano **entrambe in trasferta**:
indice 0 significa che una delle due e' sempre in casa. `tools/build-grid.js` lo calcola da
un CSV `giornata,casa,ospite` e rifiuta il file se non e' coerente (380 partite, 38 giornate,
19 gare interne a testa, ogni accoppiamento orientato una volta sola). Basta una partita
invertita casa/trasferta perche' la validazione fallisca invece di produrre una griglia
sbagliata.

## Dati

`data/listone.tsv` e' la trascrizione del listone ufficiale Fantacalcio.it 2026/27:
496 calciatori delle 20 squadre, con ruolo Classic, ruoli Mantra, FVM e quotazione
(valori Classic e Mantra). `npm run data` lo converte in `data/players.generated.js`,
con i portieri come voci singole.

La trascrizione e' stata verificata su tre fronti: numerazione per squadra contigua
senza salti, coerenza fra ruolo Classic e Mantra, e confronto di FVM e quotazioni con
gli 88 giocatori gia' presenti nella versione precedente dell'app, con zero divergenze.

La griglia degli incroci e' quella ufficiale della stessa fonte, trascritta e verificata
per simmetria su tutte le 400 caselle; le uniche tre coppie a indice 0 sono i derby
cittadini, come il calendario impone.

### Giocatori fuori listone

`data/aggiunte.tsv` contiene i giocatori non ancora presenti nel listone in mio possesso
(Vicario, Spence, Molina, Moreira) e `data/trasferimenti.tsv` i trasferimenti non ancora
recepiti (Frattesi alla Lazio, Kristensen all'Atalanta). Nell'app sono marcati **fuori listone**,
e dove la quotazione o il FVM sono una mia stima e non un dato ufficiale il numero appare in
arancione con una tilde.

### Analisi dalle fonti

`data/analisi.tsv` contiene 135 giocatori annotati con i tag che non si ricavano dai numeri
— rigoristi, titolari, infortunati, scommesse, nuovi arrivi, profili da modificatore — e per
ciascuno la nota e le fonti da cui viene. Le fonti consultate: Sky Sport, SOS Fanta, Goal,
Sisal, SNAI, FantaMaster, Fantacalcio.it, TuttoMercatoWeb, CalcioD'Angolo, DAZN, Tuttosport.

Il build fallisce se una riga di `analisi.tsv` cita un giocatore che nel listone non esiste,
oppure se usa un tag non previsto: un refuso sul nome non puo' far sparire l'annotazione in
silenzio. Le annotazioni su un portiere vengono applicate al blocco che lo contiene.

`data/ricerca/` conserva gli appunti grezzi della ricognizione (formazioni tipo, rigoristi,
infortuni, allenatori).

### Limiti noti

Il listone e' una fotografia: il mercato chiude il 1° settembre e alcune operazioni sono
successive. La piu' pesante e' Vicario alla Juventus, ufficiale il 18 agosto e nuovo titolare,
che nel listone non compare. L'app elenca queste lacune in apertura invece di nasconderle.

## Licenza

Il codice e' [MIT](LICENSE). I dati in `data/` sono trascritti da fonti di terzi,
attribuiti in [DATA_SOURCES.md](DATA_SOURCES.md) e non rilicenziati.
