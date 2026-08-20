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

## Griglia degli incroci portieri

L'indice fra due squadre e' il numero di giornate in cui giocano **entrambe in trasferta**:
indice 0 significa che una delle due e' sempre in casa. `tools/build-grid.js` lo calcola da
un CSV `giornata,casa,ospite` e rifiuta il file se non e' coerente (380 partite, 38 giornate,
19 gare interne a testa, ogni accoppiamento orientato una volta sola). Basta una partita
invertita casa/trasferta perche' la validazione fallisca invece di produrre una griglia
sbagliata.

## Stato dei dati

I dati sul listone sono **provvisori** e l'interfaccia lo dichiara. Restano da fare:

- quotazioni, FVM e ruoli Mantra dall'export ufficiale;
- consigli, gerarchie, rigoristi e giocatori a rischio verificati sulle cinque fonti;
- griglia ricalcolata sul calendario ufficiale 2026/27.
