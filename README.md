# FantaStrategy Pro

Assistente per l'asta del fantacalcio, **Serie A 2026/27**.
Budget 500 crediti, rosa da 24 slot (2 blocchi portiere, 8 difensori, 8 centrocampisti, 6 attaccanti).

## Come si usa

`index.html` e' l'applicazione: una pagina sola, HTML + Tailwind + JavaScript, nessun
passaggio di compilazione. Si apre con un doppio clic oppure si pubblica su GitHub Pages
cosi' com'e'. Lo stato dell'asta viene salvato nel browser.

## Come funziona

L'app e' un tabellone d'asta per tutta la lega, non solo per la tua rosa. Registri ogni
giocatore che viene aggiudicato — tuo o di un avversario — e da li' derivano crediti residui,
slot occupati e capienza di ognuno.

E' quello che serve davvero in asta: il vincolo non e' quanto puoi spendere tu, ma quanto puo'
ancora rilanciare chi ti sta contro. Ogni riga del listone dice quanti avversari possono
ancora contendere quel ruolo e fino a che cifra puo' spingersi il piu' ricco fra loro. Chi ha
riempito un reparto sparisce dal conteggio, e il pulsante che lo assegna si disattiva.

Tre viste: **Asta** (tabellone e listone), **Formazioni tipo** (i titolari delle 20 squadre con
lo stato in asta di ciascuno) e **Griglia portieri** (incroci e migliori coppie ancora libere).

## Il motore del budget

Il piano di spesa assegna a ogni reparto una percentuale del budget (di partenza:
5% portieri, 15% difensori, 30% centrocampisti, 50% attaccanti) ed e' modificabile
dall'interfaccia.

Dopo ogni acquisto la quota ancora disponibile per reparto e' *il piano meno quanto quel
reparto ha gia' speso*, rinormalizzata sui crediti effettivamente rimasti. Ne segue che
ogni scostamento dal preventivo si redistribuisce da solo sugli altri reparti, nelle due
direzioni: pagare un portiere 30 crediti invece di 1 abbassa subito il massimo consigliato
per gli attaccanti, chiudere il reparto portieri sotto budget lo alza.

Il prezzo consigliato per il singolo giocatore parte dal prezzo di mercato e viene poi
limitato da due tetti: quanto il piano concede oggi a un giocatore di quel reparto, e la
capienza massima. Non e' una divisione della quota di reparto fra i migliori: nessuno compra
i sei attaccanti piu' cari, e spalmare il budget su di loro produceva cifre irreali.

Sopra a tutto sta la salvaguardia: nessuna offerta puo' scendere sotto 1 credito residuo
per ciascuno slot ancora vuoto, e la capienza massima e' mostrata sempre in chiaro.

## Fasce e prezzo di mercato

La **fascia** viene dalla quotazione ufficiale, secondo la lettura classica del listone:
1ª da 30 crediti in su, 2ª da 15 a 29, 3ª da 6 a 14, 4ª da 1 a 5.

Il **prezzo di mercato** e' una stima costruita su due dati pubblici, non un prezzo rilevato:
i crediti **ancora in mano a tutti** si dividono per reparto secondo la ripartizione mediana
misurata sulle aste reali 2026/27 (7% portieri, 19% difesa, 32% centrocampo, 42% attacco),
ripesata sugli slot che restano davvero da riempire, e dentro ogni reparto si distribuiscono
sui giocatori ancora liberi in proporzione al FVM ufficiale.

Ricalcolandosi a ogni assegnazione segue l'asta vera: se gli avversari hanno gia' bruciato i
crediti, i big rimasti costano meno.

L'intervallo mostrato e' la stima centrale meno 20% e piu' 25%, per tenere conto di quanto le
aste vere si discostano dalla mediana.

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
