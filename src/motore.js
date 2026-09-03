/*
 * Motore matematico dell'app: le funzioni che non toccano ne' il DOM ne' lo
 * stato dell'asta, e che quindi si possono verificare da sole.
 *
 * Il file vive in due mondi:
 *   - nel browser lo inlinea `tools/build-app.js` prima dello script dell'app,
 *     che ne destruttura le voci;
 *   - in Node lo carica `tools/test-motore.js` con `require`.
 *
 * Per questo non usa ne' import/export ne' template literal: cosi' resta
 * interpolabile alla lettera dentro il build, senza nessun escape.
 */
var MOTORE = (function () {
  'use strict';

  /* --- Statistica di base -------------------------------------------------- */

  // Abramowitz & Stegun 7.1.26: errore massimo 1.5e-7, piu' che sufficiente
  // per spalmare un bonus fra gli scaglioni del modificatore.
  function erf(x) {
    var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    var sign = x < 0 ? -1 : 1;
    var absX = Math.abs(x);
    var t = 1.0 / (1.0 + p * absX);
    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    return sign * y;
  }

  function normalCdf(x, mean, std) {
    return 0.5 * (1 + erf((x - mean) / (std * Math.sqrt(2))));
  }

  function quantile(valori, q) {
    var indice = Math.min(valori.length - 1, Math.max(0, Math.ceil(valori.length * q) - 1));
    return valori[indice] !== undefined ? valori[indice] : 0;
  }

  // mulberry32: stessa sequenza a parita' di seme, cosi' due render della
  // stessa schermata mostrano gli stessi numeri.
  function generatoreCasuale(seme) {
    var stato = seme >>> 0;
    return function () {
      stato += 0x6D2B79F5;
      var t = stato;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --- Modificatore di difesa --------------------------------------------- */

  function clamp01(v) {
    var n = Number(v);
    if (!isFinite(n)) return 0;
    return n < 0 ? 0 : (n > 1 ? 1 : n);
  }

  // Il bonus non e' una soglia secca: la media di quattro voti oscilla di
  // giornata in giornata, quindi lo scaglione raggiunto e' una variabile
  // casuale. `sigma` e' la deviazione standard di quella media su una singola
  // giornata (non della MV stagionale): con quattro voti quasi indipendenti
  // vale circa un mezzo della dispersione del singolo voto.
  function bonusGaussiano(media, scaglioni, sigma) {
    var somma = 0;
    for (var i = 0; i < scaglioni.length; i++) {
      var pRaggiunge = 1 - normalCdf(scaglioni[i].soglia, media, sigma);
      var pSuperiore = i === 0 ? 0 : 1 - normalCdf(scaglioni[i - 1].soglia, media, sigma);
      var quota = pRaggiunge - pSuperiore;
      if (quota > 0) somma += scaglioni[i].bonus * quota;
    }
    return somma;
  }

  /*
   * Modificatore atteso marginalizzando sulla disponibilita'.
   *
   * La lega paga il bonus solo a chi porta a referto almeno `difensoriMinimi`
   * difensori, e la media e' quella del portiere piu' i tre difensori migliori
   * fra quelli che hanno davvero giocato. Prendere i tre con la MV piu' alta
   * senza guardare la probabilita' di scendere in campo tratta un difensore al
   * 15% di titolarita' come uno al 95%: e' esattamente il caso in cui il
   * modificatore tradisce, perche' la rosa fragile ottiene lo stesso numero di
   * quella profonda.
   *
   * Qui si enumerano tutti gli scenari di presenza dei difensori in rosa (al
   * piu' 2^8 = 256 su una rosa da otto) incrociati con il primo portiere
   * disponibile. La panchina entra nel conto perche' e' proprio cio' che
   * protegge il modificatore: un quarto difensore affidabile vale piu' di un
   * terzo difensore forte ma incerto.
   *
   *   portieri            [{ p, mv }] ordinati per MV decrescente
   *   difensori           [{ p, mv }] ordinati per MV decrescente
   *   difensoriSchierati  quanti ne prevede il modulo (3, 4 o 5)
   */
  function modificatoreDifesaAtteso(opzioni) {
    var portieri = opzioni.portieri || [];
    var difensori = opzioni.difensori || [];
    var difensoriSchierati = opzioni.difensoriSchierati || 0;
    var scaglioni = opzioni.scaglioni || [];
    var sigma = opzioni.sigma > 0 ? opzioni.sigma : 0.28;
    var difensoriMinimi = opzioni.difensoriMinimi || 4;
    var vuoto = { bonusAtteso: 0, mvMedia: 0, scaglioneBase: 0, probAttivo: 0 };

    // Un modulo a tre difensori non puo' prendere il modificatore, per quanti
    // difensori forti ci siano in rosa.
    if (difensoriSchierati < difensoriMinimi) return vuoto;

    // Portiere: conta il primo che gioca, in ordine di MV.
    var opzioniGk = [];
    var restoGk = 1;
    for (var g = 0; g < portieri.length; g++) {
      var pGk = clamp01(portieri[g].p);
      if (pGk <= 0) continue;
      opzioniGk.push({ mv: Number(portieri[g].mv) || 0, peso: restoGk * pGk });
      restoGk *= 1 - pGk;
    }
    if (!opzioniGk.length) return vuoto;

    var dif = difensori.slice(0, 8);
    if (dif.length < difensoriMinimi) return vuoto;

    var memoBonus = new Map();
    var probAttivo = 0;
    var mediaPesata = 0;
    var bonusAtteso = 0;
    var scenari = 1 << dif.length;

    for (var maschera = 0; maschera < scenari; maschera++) {
      var peso = 1;
      var presenti = [];
      for (var i = 0; i < dif.length && peso > 0; i++) {
        var pDif = clamp01(dif[i].p);
        if (maschera & (1 << i)) {
          peso *= pDif;
          presenti.push(Number(dif[i].mv) || 0);
        } else {
          peso *= 1 - pDif;
        }
      }
      if (peso <= 0) continue;

      // Ne schieri al piu' `difensoriSchierati`, e sono i migliori disponibili:
      // essendo `dif` gia' ordinato per MV, i primi tre presenti sono quelli che
      // finiscono nella media. Sotto la soglia di lega il bonus non scatta.
      if (presenti.length < difensoriMinimi) continue;
      var sommaTop3 = presenti[0] + presenti[1] + presenti[2];

      for (var k = 0; k < opzioniGk.length; k++) {
        var pesoTot = peso * opzioniGk[k].peso;
        if (pesoTot <= 0) continue;
        var media = (opzioniGk[k].mv + sommaTop3) / 4;
        var chiave = media.toFixed(4);
        var bonus = memoBonus.get(chiave);
        if (bonus === undefined) {
          bonus = bonusGaussiano(media, scaglioni, sigma);
          memoBonus.set(chiave, bonus);
        }
        probAttivo += pesoTot;
        mediaPesata += pesoTot * media;
        bonusAtteso += pesoTot * bonus;
      }
    }

    if (probAttivo <= 0) return vuoto;
    var mvMedia = mediaPesata / probAttivo;
    var scaglioneBase = 0;
    for (var s = 0; s < scaglioni.length; s++) {
      if (mvMedia >= scaglioni[s].soglia) { scaglioneBase = scaglioni[s].bonus; break; }
    }
    return {
      bonusAtteso: Number(bonusAtteso.toFixed(3)),
      mvMedia: Number(mvMedia.toFixed(2)),
      scaglioneBase: scaglioneBase,
      probAttivo: Number(probAttivo.toFixed(3))
    };
  }

  /* --- Blocco portieri ----------------------------------------------------- */

  /*
   * In un'asta a blocchi i portieri di una squadra si comprano in un lotto
   * solo: si chiama la squadra, si fa un'offerta, e chi la vince si prende
   * tutti i suoi portieri.
   *
   * Un blocco non vale la somma dei portieri che contiene, perche' in porta ne
   * gioca sempre uno solo: vale quanto rende il posto in porta di quella
   * squadra per una stagione. Il secondo portiere conta unicamente per le
   * giornate in cui il primo non c'e' - ed e' proprio quello il vantaggio del
   * blocco, perche' il posto non resta mai scoperto.
   *
   * Per la stessa ragione la riserva NON va pesata con la sua titolarita': un
   * secondo portiere ha una probabilita' di partire titolare intorno a 0,05, ma
   * quando il titolare manca gioca lui quasi sempre. La probabilita' giusta e'
   * quella condizionata, non quella marginale.
   */
  var DISPONIBILITA_RISERVA = 0.90;

  // portieri: [{ p, mv, fma }] in ordine di gerarchia, il primo e' il titolare.
  // Restituisce le probabilita' da usare nel modificatore e nel valore.
  function gerarchiaBlocco(portieri) {
    var out = [];
    for (var i = 0; i < (portieri || []).length; i++) {
      out.push({
        p: i === 0 ? clamp01(portieri[i].p) : DISPONIBILITA_RISERVA,
        mv: Number(portieri[i].mv) || 0,
        fma: Number(portieri[i].fma) || 0
      });
    }
    return out;
  }

  function bloccoPortieri(portieri, giornate) {
    var g = giornate > 0 ? giornate : 38;
    var lista = gerarchiaBlocco(portieri);
    var vuoto = { disponibilita: 0, presenzeAttese: 0, fma: 0, mv: 0, puntiStagione: 0, gerarchia: lista };
    if (!lista.length) return vuoto;

    // Catena: gioca il primo disponibile. La somma dei pesi e' la probabilita'
    // che il posto sia coperto, e le medie sono condizionate a quel caso.
    var restante = 1, disponibilita = 0, sommaFma = 0, sommaMv = 0;
    for (var i = 0; i < lista.length; i++) {
      var quota = restante * lista[i].p;
      if (quota <= 0) continue;
      disponibilita += quota;
      sommaFma += quota * lista[i].fma;
      sommaMv += quota * lista[i].mv;
      restante -= quota;
    }
    if (disponibilita <= 0) return vuoto;

    return {
      disponibilita: Number(disponibilita.toFixed(4)),
      presenzeAttese: Number((g * disponibilita).toFixed(1)),
      fma: Number((sommaFma / disponibilita).toFixed(2)),
      mv: Number((sommaMv / disponibilita).toFixed(2)),
      // Punti stagionali del posto in porta: giornate coperte per fantamedia
      // di chi le copre.
      puntiStagione: Number((g * sommaFma).toFixed(1)),
      gerarchia: lista
    };
  }

  /* --- Frontiera esatta di completamento rosa ------------------------------ */

  // Per ogni budget disponibile, il miglior totale di fantapunti stagionali
  // ottenibile rispettando esattamente gli slot del ruolo.
  var IMPOSSIBILE = -1e15;

  function frontieraRuolo(giocatori, quanti, budget, costoPer, valorePer) {
    var dp = [];
    for (var r = 0; r <= quanti; r++) {
      var riga = new Float64Array(budget + 1);
      riga.fill(IMPOSSIBILE);
      dp.push(riga);
    }
    dp[0].fill(0);

    for (var g = 0; g < giocatori.length; g++) {
      var costo = Math.max(1, Math.round(costoPer(giocatori[g])));
      if (costo > budget) continue;
      var valore = valorePer(giocatori[g]);
      for (var presi = quanti; presi >= 1; presi--) {
        for (var crediti = budget; crediti >= costo; crediti--) {
          if (dp[presi - 1][crediti - costo] <= IMPOSSIBILE / 2) continue;
          var candidato = dp[presi - 1][crediti - costo] + valore;
          if (candidato > dp[presi][crediti]) dp[presi][crediti] = candidato;
        }
      }
    }

    // "Al massimo questo budget": poter spendere meno non deve peggiorare il piano.
    for (var c = 1; c <= budget; c++) {
      if (dp[quanti][c - 1] > dp[quanti][c]) dp[quanti][c] = dp[quanti][c - 1];
    }
    return dp[quanti];
  }

  function frontieraCompletamento(pool, bisogni, budget, costoPer, valorePer) {
    var combinata = new Float64Array(budget + 1);
    combinata.fill(0);
    var ruoli = Object.keys(bisogni);
    for (var i = 0; i < ruoli.length; i++) {
      var ruolo = ruoli[i];
      var quanti = bisogni[ruolo] || 0;
      if (!quanti) continue;
      var delRuolo = pool.filter(function (p) { return p.ruolo === ruolo; });
      var valoriRuolo = frontieraRuolo(delRuolo, quanti, budget, costoPer, valorePer);
      var successiva = new Float64Array(budget + 1);
      successiva.fill(IMPOSSIBILE);
      for (var crediti = 0; crediti <= budget; crediti++) {
        for (var budgetRuolo = 0; budgetRuolo <= crediti; budgetRuolo++) {
          if (combinata[crediti - budgetRuolo] <= IMPOSSIBILE / 2) continue;
          if (valoriRuolo[budgetRuolo] <= IMPOSSIBILE / 2) continue;
          var somma = combinata[crediti - budgetRuolo] + valoriRuolo[budgetRuolo];
          if (somma > successiva[crediti]) successiva[crediti] = somma;
        }
      }
      combinata = successiva;
    }
    for (var c = 1; c <= budget; c++) {
      if (combinata[c - 1] > combinata[c]) combinata[c] = combinata[c - 1];
    }
    return combinata;
  }

  /*
   * Prezzo di indifferenza: la massima offerta oltre la quale la rosa migliore
   * che riesci ancora a chiudere vale meno di quella che chiuderesti senza di
   * lui. `frontieraSenzaSlot` e' la frontiera calcolata con uno slot in meno
   * nel ruolo del candidato; `valoreBaseline` e' la frontiera intatta.
   *
   * Restituisce 0 quando nemmeno 1 credito e' giustificato.
   */
  function tettoDaFrontiera(valoreCandidato, frontieraSenzaSlot, valoreBaseline, budget, capienza) {
    var massimo = Math.min(capienza, budget);
    var tetto = 0;
    for (var offerta = 1; offerta <= massimo; offerta++) {
      var completamento = frontieraSenzaSlot[budget - offerta];
      if (completamento === undefined || completamento <= IMPOSSIBILE / 2) continue;
      if (valoreCandidato + completamento >= valoreBaseline - 1e-7) tetto = offerta;
    }
    return tetto;
  }

  return {
    erf: erf,
    tettoDaFrontiera: tettoDaFrontiera,
    normalCdf: normalCdf,
    quantile: quantile,
    generatoreCasuale: generatoreCasuale,
    bonusGaussiano: bonusGaussiano,
    modificatoreDifesaAtteso: modificatoreDifesaAtteso,
    DISPONIBILITA_RISERVA: DISPONIBILITA_RISERVA,
    gerarchiaBlocco: gerarchiaBlocco,
    bloccoPortieri: bloccoPortieri,
    IMPOSSIBILE: IMPOSSIBILE,
    frontieraRuolo: frontieraRuolo,
    frontieraCompletamento: frontieraCompletamento
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = MOTORE;
