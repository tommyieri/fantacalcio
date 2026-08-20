# FantaStrategy Pro

Assistente per l'asta del fantacalcio, **Serie A 2026/27**.
Budget 500 crediti, rosa da 24 slot (2 blocchi portiere, 8 difensori, 8 centrocampisti, 6 attaccanti).

## Come si usa

`index.html` e' l'applicazione: una pagina sola, HTML + Tailwind + JavaScript, nessun
passaggio di compilazione. Si apre con un doppio clic oppure si pubblica su GitHub Pages
cosi' com'e'. La rosa viene salvata nel browser.

## Il motore del budget

Il piano di spesa assegna a ogni reparto una percentuale del budget (di partenza:
5% portieri, 15% difensori, 30% centrocampisti, 50% attaccanti) ed e' modificabile
dall'interfaccia.

Dopo ogni acquisto la quota ancora disponibile per reparto e' *il piano meno quanto quel
reparto ha gia' speso*, rinormalizzata sui crediti effettivamente rimasti. Ne segue che
ogni scostamento dal preventivo si redistribuisce da solo sugli altri reparti, nelle due
direzioni: pagare un portiere 30 crediti invece di 1 abbassa subito il massimo consigliato
per gli attaccanti, chiudere il reparto portieri sotto budget lo alza.

Sopra a tutto sta la salvaguardia: nessuna offerta puo' scendere sotto 1 credito residuo
per ciascuno slot ancora vuoto, e la capienza massima e' mostrata sempre in chiaro.

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `npm run build` | Genera `dist/artifact.html`, la stessa app senza richieste di rete (Tailwind compilato inline, icone in SVG), per la pubblicazione come Artifact |
| `npm test` | Verifiche funzionali su `dist/artifact.html` con un browser headless |
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
raggruppando i portieri in blocchi squadra.

La trascrizione e' stata verificata su tre fronti: numerazione per squadra contigua
senza salti, coerenza fra ruolo Classic e Mantra, e confronto di FVM e quotazioni con
gli 88 giocatori gia' presenti nella versione precedente dell'app, con zero divergenze.

La griglia degli incroci e' quella ufficiale della stessa fonte, trascritta e verificata
per simmetria su tutte le 400 caselle; le uniche tre coppie a indice 0 sono i derby
cittadini, come il calendario impone.

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
