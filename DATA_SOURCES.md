# Fonti dei dati

Il **codice** di questo repository e' distribuito con licenza [MIT](LICENSE).

I **dati** in `data/` no: non sono nostri e non vengono rilicenziati. Sono la
trascrizione di materiale pubblicato da terzi, raccolto per uso personale in
preparazione di una singola asta di lega. Questo file dice da dove viene ogni
cosa, cosi' che l'attribuzione sia esplicita e non affidata al README.

Questa distinzione conta perche' l'app e' pubblicata su GitHub Pages: il sito e'
raggiungibile da chiunque anche se il repository e' privato.

## Da dove viene ogni file

| File | Origine | Natura |
| --- | --- | --- |
| `data/listone.tsv` | Listone ufficiale Fantacalcio.it 2026/27 | trascrizione manuale: ruolo Classic, ruoli Mantra, FVM e quotazione dei 496 calciatori delle 20 squadre |
| `data/griglia.json` | Calendario ufficiale Serie A 2026/27, stessa fonte | derivato: numero di giornate in cui due squadre giocano entrambe in trasferta |
| `data/squadre.tsv` | Rose ufficiali Serie A | trascrizione |
| `data/sosfanta/titolari.csv` | SOS Fanta | trascrizione dello stato di titolarita' |
| `data/sosfanta/piazzati.csv` | SOS Fanta | trascrizione dell'ordine di rigoristi e battitori |
| `data/fonti/formazioni-fantacalcio.json` | Fantacalcio.it — Probabili formazioni Serie A | estratto strutturato da `npm run fonti`: modulo, nomi, ruoli e percentuali, **mai** il testo degli articoli |
| `data/analisi.tsv` | vedi sotto | note redazionali con la fonte citata riga per riga |
| `data/ricerca/*.md` | idem | appunti grezzi della ricognizione |
| `data/aggiunte.tsv`, `data/trasferimenti.tsv` | compilazione propria | colma le lacune del listone; dove la quotazione o il FVM sono una stima, l'app lo segnala in arancione con una tilde |
| `data/fantalgoritmo.tsv` | Fantalgoritmo (Giovanni Curcio), versione 500 FM del 02/09/2026 | **prodotto a pagamento**: prezzo medio delle aste reali, prezzo consigliato, indice di appetibilita', fascia, accoppiata portieri |
| `data/storico.tsv` | Fantalgoritmo, versione PRO del 02/09/2026 | **prodotto a pagamento**: due stagioni di presenze, media voto, fantamedia, gol, assist, cartellini |
| `data/players.generated.js` | generato | prodotto da `npm run data` a partire dai file qui sopra: non va modificato a mano |

## Fonti consultate per `data/analisi.tsv`

Sky Sport, SOS Fanta, Goal, Sisal, SNAI, FantaMaster, Fantacalcio.it,
TuttoMercatoWeb, CalcioD'Angolo, DAZN, Tuttosport.

Ogni riga del file porta la propria colonna `fonti`, e il build fallisce se una
riga cita un giocatore che nel listone non esiste o usa un tag non previsto: un
refuso sul nome non puo' far sparire l'annotazione in silenzio.

## Attenzione: i dati Fantalgoritmo sono un prodotto a pagamento

`data/fantalgoritmo.tsv` e `data/storico.tsv` vengono da file venduti da
[Fantalgoritmo](https://www.Fantalgoritmo.it) (Giovanni Curcio). Sono la parte
piu' preziosa dei dati di questo repository ed e' anche l'unica che qualcuno ha
pagato per produrre.

I file sorgente `.xlsx` e `.xlsb` **non sono nel repository** ed e' giusto cosi'.
`tools/import-fantalgoritmo.py` li converte, ma va lanciato passando i percorsi
dei file che possiedi:

```
python3 tools/import-fantalgoritmo.py Fantalgoritmo_500_FM.xlsx FantaAlgoritmo_PRO.xlsb
```

Resta pero' un fatto da decidere consapevolmente: **l'app e' pubblicata su
GitHub Pages, quindi i numeri estratti sono pubblici**, anche se il repository
fosse privato. Se non e' quello che si vuole, le strade sono tre:

1. spegnere GitHub Pages e usare l'app aprendo `index.html` in locale;
2. tenere `data/fantalgoritmo.tsv` fuori dal build pubblico e caricarlo a mano
   il giorno dell'asta;
3. lasciare tutto com'e', consapevoli che si sta ridistribuendo il lavoro di
   qualcun altro.

Finche' la scelta non e' fatta, il valore di questi due file resta quello di un
uso personale in preparazione della propria asta.

## Cosa questo repository non fa

- **Non fa scraping continuo.** `npm run fonti` e' l'unico strumento che tocca
  la rete, si lancia a mano e salva solo campi strutturati. L'app pubblicata non
  fa nessuna richiesta esterna: e' una verifica di `npm test`.
- **Non rilicenzia i dati di terzi.** Se riusi questo repository per un'altra
  stagione o un'altra lega, sostituisci i file in `data/` con materiale di cui
  hai diritto e aggiorna questa tabella.
- **Non redistribuisce dati personali.** Le rose dell'asta restano nel browser
  di chi usa l'app e non vengono caricate da nessuna parte.

## Limiti noti

Il listone e' una fotografia. Il mercato chiude il 1° settembre e alcune
operazioni sono successive: la piu' pesante e' Vicario alla Juventus, ufficiale
il 18 agosto. L'app elenca queste lacune in apertura invece di nasconderle.
