const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLAYERS_FILE = path.join(ROOT, 'data/players.generated.js');
const playersData = fs.readFileSync(PLAYERS_FILE, 'utf8');

// Il motore matematico e' un file .js vero, verificabile con `node --test`.
// Viene interpolato alla lettera: essendo scritto senza template literal non
// ha bisogno di nessun escape, al contrario del resto di questo file.
const MOTORE_FILE = path.join(ROOT, 'src/motore.js');
const motoreSource = fs.readFileSync(MOTORE_FILE, 'utf8');
if (motoreSource.includes('</scr' + 'ipt>')) {
  throw new Error('src/motore.js non puo\' contenere una chiusura di script');
}

const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FantaStrategy Pro — Asta Serie A 2026/27</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-3 md:p-5 font-sans">
  <div class="max-w-[1600px] mx-auto space-y-4">

    <!-- Intestazione e metriche personali -->
    <header class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div>
          <h1 class="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <i class="fa-solid fa-trophy text-amber-400"></i> FantaStrategy Pro
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">
            Serie A 2026/27 • <span id="intestazione-budget">500</span> crediti • <span id="intestazione-lega"></span>
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full lg:w-auto">
          <div class="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
            <span class="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">I miei crediti</span>
            <span id="m-residuo" class="text-xl md:text-2xl font-black text-emerald-400 tabular-nums">500</span>
            <span class="text-[10px] text-slate-500">/ 500</span>
          </div>
          <div class="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
            <span class="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Slot rosa</span>
            <span id="m-slot" class="text-xl md:text-2xl font-black text-indigo-400 tabular-nums">0</span>
            <span class="text-[10px] text-slate-500">/ <span id="m-slot-tot">25</span></span>
          </div>
          <div class="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
            <span class="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Best XI Atteso</span>
            <span id="m-best-xi-score" class="text-xl md:text-2xl font-black text-amber-400 tabular-nums">0.0</span>
            <span id="m-best-xi-modulo" class="text-[10px] text-slate-500 block">3-4-3</span>
          </div>
          <div class="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
            <span class="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Mod Difesa</span>
            <span id="m-mod-expected" class="text-xl md:text-2xl font-black text-sky-400 tabular-nums">+0.0</span>
            <span class="text-[10px] text-slate-500 block">pt/giornata</span>
          </div>
          <div class="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
            <span class="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Max bid attacco</span>
            <span id="m-max-a" class="text-xl md:text-2xl font-black text-rose-400 tabular-nums">245</span>
          </div>
          <div class="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
            <span class="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Max bid centrocampo</span>
            <span id="m-max-c" class="text-xl md:text-2xl font-black text-amber-400 tabular-nums">143</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-800 text-[11px]">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p class="text-slate-400">
            <i class="fa-solid fa-lock text-slate-500 mr-1"></i>
            Capienza massima: <span id="m-capienza" class="text-white font-black tabular-nums">477</span> cr
            <span class="text-slate-500">(1 cr riservato per gli altri <span id="m-slot-vuoti" class="tabular-nums">23</span> slot)</span>
          </p>
        </div>
        <div class="flex gap-4 shrink-0">
          <button type="button" onclick="mostraPannello('pannello-impostazioni')" class="text-indigo-400 hover:text-indigo-300 font-semibold transition">
            <i class="fa-solid fa-sliders mr-1"></i>Impostazioni
          </button>
          <button type="button" onclick="mostraPannello('pannello-fonti')" class="text-slate-400 hover:text-slate-200 font-semibold transition">
            <i class="fa-solid fa-circle-info mr-1"></i>Fonti e avvertenze
          </button>
        </div>
      </div>

      <!-- Impostazioni della lega -->
      <div id="pannello-impostazioni" class="hidden pt-3 border-t border-slate-800 space-y-4">
        <div class="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
          <p class="text-[10px] uppercase tracking-wider font-bold text-indigo-300 mb-2">Regolamento attivo</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-300">
            <div><span class="text-slate-500">Asta</span><br><strong>A chiamata</strong></div>
            <div><span class="text-slate-500">Rosa</span><br><strong>3P · 8D · 8C · 6A</strong></div>
            <label><span class="text-slate-500">Rete inviolata P</span><br>
              <input type="number" id="bonus-rete-inviolata" min="0" max="3" step="0.25" class="mt-1 w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-emerald-300 font-bold tabular-nums focus:outline-none focus:border-indigo-500"> pt
            </label>
            <label class="flex items-end gap-2 pb-0.5 cursor-pointer"><input id="modificatore-attivo" type="checkbox" class="accent-indigo-500"> <span>Modificatore: P + top 3 D<br><span class="text-slate-500">attivo da 4 difensori</span></span></label>
          </div>
          <p class="text-[10px] text-slate-500 mt-2">Soglie modificatore: 6,00 → +1 · 6,25 → +2 · 6,50 → +3 · 6,75 → +4 · 7,00 → +6.</p>
        </div>
        <div class="pt-3 border-t border-slate-800">
          <p class="text-[11px] text-slate-400 mb-2">
            Partecipanti alla lega. Il primo sei tu: i nomi servono a registrare chi si prende cosa.
          </p>
          <div class="flex items-end gap-3 mb-3">
            <label class="text-[10px] uppercase font-semibold text-slate-400">Quanti siete
              <input type="number" id="n-squadre" min="2" max="20" class="mt-1 block w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-slate-200 tabular-nums focus:outline-none focus:border-indigo-500">
            </label>
            <button type="button" onclick="azzeraAsta()" class="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition pb-1.5">Azzera tutta l'asta</button>
          </div>
          <div id="nomi-squadre" class="grid grid-cols-2 sm:grid-cols-4 gap-2"></div>
        </div>
      </div>

      <!-- Provenienza dei dati -->
      <div id="pannello-fonti" class="hidden pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-3 leading-relaxed">
        <p>
          Ruoli Classic e Mantra, FVM e quotazioni vengono dal <strong class="text-slate-200">listone ufficiale
          Fantacalcio.it 2026/27</strong>; la griglia portieri e' quella ufficiale della stessa fonte.
          Il motore matematico integra calcolo di <strong class="text-indigo-300">True Player Value</strong> (media voto, bonus attesi, rigori, titolarita', rischio infortunio),
          <strong class="text-sky-300">Modificatore Difesa Matematico</strong> (rendimento punti differenziale), <strong class="text-amber-300">MVAR & Indice di Scarsita'</strong> e
          <strong class="text-emerald-300">Radar Rilanci Avversari</strong>.
        </p>
        <p>Titolarita' e gerarchie di rigori, punizioni e corner sono integrate dai dataset SOS Fanta presenti in FisherTiger, aggiornati al 31/08/2026: vengono usati solo dopo il match con nome e squadra del listone ufficiale (334 segnali di disponibilita', 110 sui piazzati). Il +1 per rete inviolata resta una probabilita' stimata dal valore FVM finche' non colleghiamo proiezioni squadra/calendario.</p>
      </div>
    </header>

    <!-- Segnali sintetici da leggere durante la chiamata -->
    <div id="allarmi-asta" class="hidden bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 shadow-xl"></div>

    <!-- Prezzo che l'asta sta facendo, ruolo per ruolo -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <h2 class="text-sm font-bold text-white flex items-center gap-2">
          <i class="fa-solid fa-chart-line text-emerald-400"></i> Come sta andando l'asta
        </h2>
        <span class="text-[11px] text-slate-500">Nessuna percentuale prefissata: il tuo massimo esce dal prezzo che i ruoli stanno facendo adesso</span>
      </div>
      <div id="andamento" class="grid grid-cols-2 lg:grid-cols-4 gap-3"></div>
    </div>

    <!-- Navigazione fra le viste -->
    <nav class="flex flex-wrap gap-2" id="navigazione"></nav>

    <!-- ============ VISTA ASTA ============ -->
    <section id="vista-asta" class="space-y-4">

      <!-- Tabellone dei partecipanti -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-users-line text-indigo-400"></i> Tabellone partecipanti
          </h2>
          <span class="text-[11px] text-slate-500">Clicca una squadra per vederne la rosa e le necessita'</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" class="py-2 pr-3">Squadra</th>
                <th scope="col" class="py-2 px-2 text-right">Crediti</th>
                <th scope="col" class="py-2 px-2 text-right">Spesi</th>
                <th scope="col" class="py-2 px-2 text-center">P</th>
                <th scope="col" class="py-2 px-2 text-center">D</th>
                <th scope="col" class="py-2 px-2 text-center">C</th>
                <th scope="col" class="py-2 px-2 text-center">A</th>
                <th scope="col" class="py-2 px-2 text-right">Max bid</th>
                <th scope="col" class="py-2 pl-2">Reparti ancora aperti</th>
              </tr>
            </thead>
            <tbody id="tabellone" class="divide-y divide-slate-800/60"></tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <!-- Listone -->
        <div class="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div class="relative w-full sm:w-80">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500 text-xs"></i>
              <label for="ricerca" class="sr-only">Cerca calciatore</label>
              <input type="text" id="ricerca" placeholder="Cerca calciatore, squadra o tag..." class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200">
            </div>
            <div id="filtri-ruolo" class="flex flex-wrap gap-1.5 w-full sm:w-auto"></div>
          </div>

          <div id="filtri-tag" class="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80 text-[11px]"></div>

          <div class="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" id="solo-liberi" checked class="accent-indigo-500">
                Nascondi i giocatori gia' assegnati
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-emerald-400 font-semibold">
                <input type="checkbox" id="solo-affari" class="accent-emerald-500">
                Solo entro stima
              </label>
            </div>
            <span id="conteggio" class="text-slate-500"></span>
          </div>

          <div class="overflow-x-auto max-h-[65vh] rounded-xl border border-slate-800/80">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th scope="col" class="p-2.5">R</th>
                  <th scope="col" class="p-2.5">Calciatore & Profilo</th>
                  <th scope="col" class="p-2.5">Team</th>
                  <th scope="col" class="p-2.5 text-center">FVM / Q.</th>
                  <th scope="col" class="p-2.5 text-center">Profilo d'asta</th>
                  <th scope="col" class="p-2.5 text-center">Mercato live</th>
                  <th scope="col" class="p-2.5 text-right">Piano</th>
                </tr>
              </thead>
              <tbody id="tabella" class="divide-y divide-slate-800/60"></tbody>
            </table>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Avversari: lettura rapida per i testa a testa -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div class="flex justify-between items-center mb-1">
              <h2 class="text-sm font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-crosshairs text-amber-400"></i> Rivali live
              </h2>
              <span class="text-[10px] text-slate-500">attacco aperto</span>
            </div>
            <p class="text-[10px] text-slate-500 mb-3">Chi puo' ancora contenderti il prossimo attaccante.</p>
            <div id="avversari-live" class="space-y-1.5"></div>
          </div>

          <!-- La mia rosa -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
          <div class="flex justify-between items-center mb-3">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-users-viewfinder text-indigo-400"></i> La mia rosa
            </h2>
            <span id="badge-ruoli" class="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 tabular-nums"></span>
          </div>
          <div id="riepilogo-reparti" class="grid grid-cols-4 gap-1.5 mb-3"></div>
          <div id="rosa" class="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1"></div>
          <div class="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-[11px]">
            <span class="text-slate-500">Spesa totale: <span id="m-speso" class="text-slate-300 font-bold tabular-nums">0</span> cr</span>
            <button type="button" onclick="vaiAllaVista('simulatore')" class="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
              Simula XI <i class="fa-solid fa-chevron-right text-[9px]"></i>
            </button>
          </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ VISTA SIMULATORE & BEST XI ============ -->
    <section id="vista-simulatore" class="hidden space-y-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div>
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-futbol text-indigo-400"></i> Simulatore di Formazione & Best XI
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Calcola la miglior formazione schierabile con la tua rosa, stima i fantapunti attesi, il rendimento del modificatore difesa e la probabilita' di giocare in 11.
            </p>
          </div>
          <div id="moduli-selettore" class="flex flex-wrap gap-1.5"></div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <!-- Campo Tattico Visivo -->
        <div class="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-shield-halved text-emerald-400"></i> Schieramento Tattico (<span id="sim-modulo-nome" class="text-white">3-4-3</span>)
            </h3>
            <span class="text-xs font-black text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 tabular-nums" id="sim-punti-totali">0.0 pt attesi</span>
          </div>

          <!-- Il Campetto -->
          <div class="relative bg-gradient-to-b from-emerald-950/70 via-slate-950/90 to-emerald-950/70 border border-emerald-900/40 rounded-2xl p-4 min-h-[420px] flex flex-col justify-between shadow-inner">
            <div class="absolute inset-x-8 top-1/2 -translate-y-1/2 border-t border-dashed border-emerald-800/30"></div>
            <div class="absolute w-24 h-24 rounded-full border border-emerald-800/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            <div id="campo-attacco" class="flex justify-around items-center z-10 py-1"></div>
            <div id="campo-centrocampo" class="flex justify-around items-center z-10 py-1"></div>
            <div id="campo-difesa" class="flex justify-around items-center z-10 py-1"></div>
            <div id="campo-portiere" class="flex justify-around items-center z-10 py-1"></div>
          </div>

          <!-- Panchina -->
          <div class="mt-4 pt-3 border-t border-slate-800">
            <span class="text-[10px] uppercase font-bold text-slate-500 block mb-2">Panchina Ordinata per Reparto</span>
            <div id="sim-panchina" class="grid grid-cols-2 sm:grid-cols-4 gap-2"></div>
          </div>
        </div>

        <!-- Analisi Rendimento, Modificatore e Copertura -->
        <div class="space-y-4">
          <!-- Scheda Modificatore Difesa Matematico -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 class="text-xs uppercase font-bold text-sky-400 tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-shield-halved"></i> Modificatore Difesa Matematico
            </h3>
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-400">Rendimento Atteso:</span>
                <span id="sim-mod-bonus" class="text-base font-black text-sky-300 tabular-nums">+0.00 pt</span>
              </div>
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-500">Media Voto Difesa (P + Top 3 D):</span>
                <span id="sim-mod-mv" class="text-slate-300 font-bold tabular-nums">0.00</span>
              </div>
              <div class="flex justify-between items-center text-[11px]">
                <span class="text-slate-500">Punti su 38 giornate:</span>
                <span id="sim-mod-tot-stagione" class="text-emerald-400 font-bold tabular-nums">~0 pt</span>
              </div>
            </div>
            <div id="sim-mod-consiglio" class="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed"></div>
          </div>

          <!-- Copertura e Rischio 10/11 -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 class="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-2">
              <i class="fa-solid fa-crosshairs"></i> Copertura & Rischio SV (11/11)
            </h3>
            <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-400">Indice Copertura Rosa:</span>
                <span id="sim-copertura-pct" class="text-base font-black text-emerald-400 tabular-nums">100/100 (Alta)</span>
              </div>
              <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div id="sim-copertura-bar" class="bg-emerald-500 h-full transition-all duration-500" style="width: 100%"></div>
              </div>
              <p id="sim-copertura-nota" class="text-[10px] text-slate-500 mt-1"></p>
            </div>
          </div>

          <!-- Confronto Rapido Moduli -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
            <h3 class="text-xs uppercase font-bold text-slate-400 tracking-wider">Confronto Moduli Possibili</h3>
            <div id="sim-confronto-moduli" class="space-y-1.5"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ VISTA STRATEGIA & AVVERSARI ============ -->
    <section id="vista-strategia" class="hidden space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Nomination Alert: Chi Chiamare al tuo turno -->
        <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <i class="fa-solid fa-bolt text-amber-400"></i> Assistente Chiamate: "Chi devo nominare?"
            </h2>
            <span class="text-[11px] text-slate-500">Strategia avanzata per il tuo turno d'asta</span>
          </div>
          <p class="text-xs text-slate-400">
            Chiamare il giocatore giusto cambia l'asta: prendi i tuoi bersagli sottotraccia o forza i rivali a bruciare budget sui reparti dove sono disperati.
          </p>

          <div id="consigli-nomine" class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2"></div>
        </div>

        <!-- Indice di Scarsita per Ruolo -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-gauge-high text-rose-400"></i> Tensione & Scarsita' (0-100)
          </h2>
          <p class="text-[11px] text-slate-400">
            Rapporto tra slot ancora aperti nella lega e giocatori di qualita' rimasti disponibili.
          </p>
          <div id="radar-scarsita" class="space-y-2.5 pt-1"></div>
        </div>
      </div>

      <!-- Matrice di Necessita Avversari -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-crosshairs text-indigo-400"></i> Matrice Necessita' & Potere d'Acquisto Avversari
          </h2>
          <span class="text-[11px] text-slate-500">Chi e' costretto a spendere e dove</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" class="py-2.5 pr-3">Partecipante</th>
                <th scope="col" class="py-2.5 px-2 text-right">Crediti</th>
                <th scope="col" class="py-2.5 px-2 text-right">Slot Liberi</th>
                <th scope="col" class="py-2.5 px-2 text-center">Urgenza P</th>
                <th scope="col" class="py-2.5 px-2 text-center">Urgenza D</th>
                <th scope="col" class="py-2.5 px-2 text-center">Urgenza C</th>
                <th scope="col" class="py-2.5 px-2 text-center">Urgenza A</th>
                <th scope="col" class="py-2.5 px-2 text-right">Max Bid Assoluto</th>
                <th scope="col" class="py-2.5 pl-2">Stato Strategico</th>
              </tr>
            </thead>
            <tbody id="matrice-avversari-body" class="divide-y divide-slate-800/60"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ============ VISTA FORMAZIONI ============ -->
    <section id="vista-formazioni" class="hidden space-y-4">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-clipboard-list text-emerald-400"></i> Formazioni tipo e disponibilita'
          </h2>
          <div class="relative w-full sm:w-72">
            <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-500 text-xs"></i>
            <label for="ricerca-formazioni" class="sr-only">Filtra squadra o calciatore</label>
            <input type="text" id="ricerca-formazioni" placeholder="Filtra per squadra o calciatore..." class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200">
          </div>
        </div>
        <p class="text-[11px] text-slate-500 mt-2">
          I titolari indicati dalle formazioni tipo delle fonti, con lo stato in asta: chi e' ancora
          libero e chi se l'e' gia' preso.
        </p>
      </div>
      <div id="formazioni" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>
    </section>

    <!-- ============ VISTA GRIGLIA ============ -->
    <section id="vista-griglia" class="hidden">
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-shield-halved text-amber-400"></i> Calcolatore coppia portieri
          </h2>
          <span class="text-[11px] text-slate-400">Indice = giornate in cui entrambe giocano fuori casa</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label for="griglia-a" class="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Squadra 1</label>
            <select id="griglia-a" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"></select>
          </div>
          <div>
            <label for="griglia-b" class="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Squadra 2</label>
            <select id="griglia-b" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"></select>
          </div>
          <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Incrocio trasferte</span>
              <span id="griglia-testo" class="text-xs text-slate-300">Seleziona 2 squadre</span>
            </div>
            <span id="griglia-valore" class="text-lg font-black text-amber-400 tabular-nums">-</span>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800">
          <p class="text-[11px] text-slate-400 mb-2">Le coppie migliori fra i blocchi ancora liberi:</p>
          <div id="coppie-consigliate" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"></div>
        </div>
      </div>
    </section>
  </div>

  <script>
${motoreSource}
  </script>

  <script>
${playersData}

    const {
      normalCdf, quantile, generatoreCasuale,
      modificatoreDifesaAtteso, IMPOSSIBILE,
      frontieraRuolo, frontieraCompletamento, tettoDaFrontiera
    } = MOTORE;

    /* ====================== COSTANTI & MAPPE ====================== */

    const PROFILO_LEGA = Object.freeze({
      budget: 500,
      partecipanti: 8,
      rosa: { P: 3, D: 8, C: 8, A: 6 },
      asta: 'A chiamata',
      modificatore: {
        difensoriMinimi: 4,
        scaglioni: [
          { soglia: 7.00, bonus: 6 }, { soglia: 6.75, bonus: 4 }, { soglia: 6.50, bonus: 3 },
          { soglia: 6.25, bonus: 2 }, { soglia: 6.00, bonus: 1 }
        ]
      }
    });
    const BUDGET = PROFILO_LEGA.budget;
    const RUOLI = ['P', 'D', 'C', 'A'];
    const TARGET = PROFILO_LEGA.rosa;
    const SLOT_TOT = Object.values(TARGET).reduce((s, n) => s + n, 0);
    const NOMI_RUOLO = { P: 'Portieri', D: 'Difensori', C: 'Centrocampisti', A: 'Attaccanti' };
    const PRIORI = { P: 7, D: 19, C: 32, A: 42 };
    const N_SQUADRE_DEFAULT = PROFILO_LEGA.partecipanti;

    const COLORE_RUOLO = { P: 'text-amber-400', D: 'text-emerald-400', C: 'text-blue-400', A: 'text-rose-400' };
    const BG_RUOLO = { P: 'bg-amber-950/80 border-amber-800/60', D: 'bg-emerald-950/80 border-emerald-800/60', C: 'bg-blue-950/80 border-blue-800/60', A: 'bg-rose-950/80 border-rose-800/60' };
    const NOMI_FASCIA = { 1: '1ª fascia', 2: '2ª fascia', 3: '3ª fascia', 4: '4ª fascia' };
    const STILE_FASCIA = {
      1: 'bg-amber-950 text-amber-300 border-amber-800/60 font-bold',
      2: 'bg-indigo-950 text-indigo-300 border-indigo-800/60',
      3: 'bg-slate-800 text-slate-400 border-slate-700/60',
      4: 'bg-slate-900 text-slate-500 border-slate-800'
    };
    const ETICHETTA_TAG = {
      TOP: 'Top 1° slot', TITOLARE: 'Titolare', RIGORISTA: 'Rigorista',
      MODIFICATORE: 'Modificatore', SCOMMESSA: 'Scommessa', NUOVO: 'Nuovo arrivo',
      LOWCOST: 'Low cost', RISCHIO: 'A rischio'
    };
    const STILE_TAG = {
      TOP: 'bg-amber-950 text-amber-300 border-amber-800/60 font-bold',
      TITOLARE: 'bg-slate-800 text-slate-300 border-slate-700/60',
      RIGORISTA: 'bg-emerald-950 text-emerald-300 border-emerald-800/60 font-bold',
      MODIFICATORE: 'bg-sky-950 text-sky-300 border-sky-800/60 font-bold',
      SCOMMESSA: 'bg-indigo-950 text-indigo-300 border-indigo-800/60',
      NUOVO: 'bg-violet-950 text-violet-300 border-violet-800/60',
      LOWCOST: 'bg-teal-950 text-teal-300 border-teal-800/60',
      RISCHIO: 'bg-rose-950 text-rose-300 border-rose-800/60'
    };
    const NOMI_MANTRA = {
      Por: 'Portiere', Dd: 'Difensore destro', Ds: 'Difensore sinistro', Dc: 'Difensore centrale',
      B: 'Braccetto', E: 'Esterno', M: 'Mediano', C: 'Centrale', W: 'Ala',
      T: 'Trequartista', A: 'Attaccante', Pc: 'Punta centrale'
    };

    const MODULI_SUPPORTATI = ['3-4-3', '3-5-2', '4-3-3', '4-4-2', '4-5-1', '5-3-2', '3-4-2-1', '5-4-1'];

    const PER_ID = new Map(PLAYERS.map(p => [p.id, p]));

    // Benchmark fisso dell'asta: distribuisce il budget di ogni reparto sui
    // giocatori che servono davvero alla lega. Non cambia con le vendite, cosi'
    // l'indice tavolo confronta prezzo reale e valore teorico sulla stessa base.
    function prezziTeoriciBase() {
      const valori = new Map();
      const budgetLega = BUDGET * squadre.length;
      for (const r of RUOLI) {
        const necessari = TARGET[r] * squadre.length;
        const profili = PLAYERS.filter(p => p.ruolo === r).sort((a, b) => b.fvm - a.fvm);
        const contendibili = profili.slice(0, necessari);
        const fvmTotale = contendibili.reduce((somma, p) => somma + Math.max(1, p.fvm), 0);
        const budgetQualita = Math.max(0, budgetLega * PRIORI[r] / 100 - necessari);
        contendibili.forEach(p => valori.set(p.id,
          Math.max(1, 1 + Math.round((Math.max(1, p.fvm) / Math.max(1, fvmTotale)) * budgetQualita))));
        profili.slice(necessari).forEach(p => valori.set(p.id, 1));
      }
      return valori;
    }

    // Tier relativo al numero di partecipanti: Tier 1 = un primo slot per
    // squadra, Tier 2 = i due giri successivi. E' piu' utile della sola Q.
    // ufficiale quando occorre capire se la fascia sta davvero finendo.
    function tiersAsta() {
      const tiers = new Map();
      const ampiezza = Math.max(1, squadre.length);
      for (const r of RUOLI) {
        PLAYERS.filter(p => p.ruolo === r).sort((a, b) => b.fvm - a.fvm)
          .forEach((p, indice) => tiers.set(p.id, indice < ampiezza ? 1 : indice < ampiezza * 3 ? 2 : 3));
      }
      return tiers;
    }

    /* ====================== STATO ====================== */

    const store = (() => {
      try {
        localStorage.setItem('__probe__', '1');
        localStorage.removeItem('__probe__');
        return localStorage;
      } catch (e) {
        const mem = {};
        return {
          getItem: k => (k in mem ? mem[k] : null),
          setItem: (k, v) => { mem[k] = String(v); },
          removeItem: k => { delete mem[k]; }
        };
      }
    })();

    const CHIAVE = 'fantastrategy.asta.2026';

    function nuoveSquadre(n) {
      return Array.from({ length: n }, (_, i) => ({
        nome: i === 0 ? 'Io' : \`Squadra \${i + 1}\`,
        rosa: []
      }));
    }

    function normalizzaRegole(input) {
      return {
        bonusReteInviolata: Math.max(0, Math.min(3, Number(input?.bonusReteInviolata ?? 1))),
        modificatoreAttivo: input?.modificatoreAttivo !== false
      };
    }

    function caricaStato() {
      let s;
      try { s = JSON.parse(store.getItem(CHIAVE)); } catch (e) { s = null; }
      if (!s || !Array.isArray(s.squadre) || !s.squadre.length) return { squadre: nuoveSquadre(N_SQUADRE_DEFAULT), regole: normalizzaRegole() };
      for (const sq of s.squadre) sq.rosa = (sq.rosa ?? []).filter(a => PER_ID.has(a.id));
      return { squadre: s.squadre, regole: normalizzaRegole(s.regole) };
    }

    const statoIniziale = caricaStato();
    let squadre = statoIniziale.squadre;
    let regole = statoIniziale.regole;
    let filtroRuolo = 'ALL';
    let filtroTag = 'ALL';
    let soloLiberi = true;
    let soloAffari = false;
    let vista = 'asta';
    let apertaSquadra = null;
    let apertaRiga = null;
    let moduloScelto = '3-4-3';
    // Riferimenti all'ultimo render, usati dal verdetto live sul campo prezzo.
    let pianoLive = null;
    let mercatoLive = null;

    function salva() {
      store.setItem(CHIAVE, JSON.stringify({ squadre, regole }));
    }

    /* ====================== MOTORE MATEMATICO DEL VALORE ====================== */

    const VALUTAZIONI_CACHE = new Map();
    let VALUTAZIONI_VERSIONE = 0;

    function inizializzaValutazioni() {
      VALUTAZIONI_CACHE.clear();
      VALUTAZIONI_VERSIONE++;

      // Raggruppamento per ruolo per determinare la baseline di rimpiazzo e il monte crediti chiuso (Nessun double counting)
      const perRuolo = { P: [], D: [], C: [], A: [] };
      for (const p of PLAYERS) perRuolo[p.ruolo].push(p);
      for (const r of RUOLI) perRuolo[r].sort((a, b) => b.fvm - a.fvm);

      const nSquadreBase = squadre.length;
      const budgetTotLega = nSquadreBase * BUDGET; // 4000 cr

      const roleStats = {};
      for (const r of RUOLI) {
        const nDrafted = nSquadreBase * TARGET[r];
        const drafted = perRuolo[r].slice(0, nDrafted);
        const baselineFvm = drafted.length ? drafted[drafted.length - 1].fvm : 1;
        const roleBudget = (budgetTotLega * PRIORI[r]) / 100;
        
        let excessSum = 0;
        for (const p of drafted) {
          excessSum += Math.max(0, p.fvm - baselineFvm);
        }
        excessSum = Math.max(1, excessSum);
        const excessPool = Math.max(0, roleBudget - nDrafted);

        roleStats[r] = { nDrafted, baselineFvm, maxFvm: perRuolo[r][0]?.fvm ?? 1, roleBudget, excessSum, excessPool };
      }

      for (const p of PLAYERS) {
        const r = p.ruolo;
        const stRole = roleStats[r];
        
        let tit = 0.50;
        const statusSos = p.sos?.status;
        if (statusSos === 'TITOLARE') tit = 0.88;
        else if (statusSos === 'BALLOTTAGGIO') tit = 0.58;
        else if (statusSos === 'RISERVA') tit = 0.15;
        else if (p.tag.includes('TITOLARE')) tit = 0.90;
        else if (p.tag.includes('SCOMMESSA')) tit = 0.65;
        else if (p.tag.includes('LOWCOST')) tit = 0.30;
        if (p.formazione?.gruppo === 'XI') {
          tit = 0.25 + 0.75 * (p.formazione.probabilita / 100);
        } else if (p.formazione?.gruppo === 'ALTERNATIVA') {
          tit = Math.min(tit, 0.25 + 0.55 * (p.formazione.probabilita / 100));
        }
        if (r === 'P' && p.sos?.gerarchiaPortiere === 'PRIMO') tit = Math.max(tit, 0.95);
        if (p.tag.includes('RISCHIO')) tit *= 0.70;

        // Media Voto base e Bonus attesi modellati con continuita' monotonicamente dal listone
        let mv = 6.00;
        let bonusNet = 0;
        if (r === 'P') {
          mv = 5.85 + 0.35 * Math.min(1, p.fvm / 60);
          bonusNet = -(1.60 - 0.70 * Math.min(1, p.fvm / 60)); // malus gol subiti tra -0.90 e -1.60
        } else if (r === 'D') {
          mv = 5.80 + 0.50 * Math.min(1, p.fvm / 150);
          bonusNet = 0.05 + 0.55 * Math.min(1, p.fvm / 200);
        } else if (r === 'C') {
          mv = 5.85 + 0.50 * Math.min(1, p.fvm / 150);
          bonusNet = 0.08 + 0.95 * Math.min(1, p.fvm / 180);
        } else if (r === 'A') {
          mv = 5.85 + 0.55 * Math.min(1, p.fvm / 200);
          bonusNet = 0.15 + 1.85 * Math.min(1, p.fvm / 260);
        }

        // Piazzati SOS Fanta: primo rigorista e battitori principali aumentano
        // l'atteso; le priorita' successive pesano meno e non sovrascrivono FVM.
        const piazzati = p.sos?.piazzati ?? {};
        if (piazzati.RIGORI === 1) bonusNet += r === 'A' || r === 'C' ? 0.32 : 0.18;
        else if (piazzati.RIGORI === 2) bonusNet += r === 'A' || r === 'C' ? 0.12 : 0.06;
        if (piazzati.PUNIZIONI === 1) bonusNet += 0.08;
        else if (piazzati.PUNIZIONI === 2) bonusNet += 0.03;
        if (piazzati.CORNER === 1) bonusNet += 0.04;
        else if (piazzati.CORNER === 2) bonusNet += 0.015;

        // Il listone non contiene una proiezione di squadra/calendario: per ora rendiamo esplicita
        // una proxy conservativa (16%-36%) ricavata dalla fascia FVM del portiere.
        const probReteInviolata = r === 'P'
          ? 0.16 + 0.20 * Math.min(1, p.fvm / Math.max(1, stRole.maxFvm))
          : 0;
        const puntiReteInviolata = regole.bonusReteInviolata * probReteInviolata;
        const fma = Number((mv + bonusNet + puntiReteInviolata).toFixed(2));
        const puntiMatch = fma;
        const presenzeAttese = Math.round(38 * tit);
        const puntiStagione = Number((presenzeAttese * fma).toFixed(1));

        // Valore puro a economia chiusa (Value Over Replacement)
        const excess = Math.max(0, p.fvm - stRole.baselineFvm);
        let rawVal = 1;
        if (excess > 0) {
          rawVal = 1 + (excess / stRole.excessSum) * stRole.excessPool;
        }
        if (p.tag.includes('RISCHIO')) rawVal *= 0.80;
        const valorePuro = Math.max(1, Math.round(rawVal));

        VALUTAZIONI_CACHE.set(p.id, {
          tit, mv: Number(mv.toFixed(2)), fma, puntiMatch, presenzeAttese, puntiStagione, valorePuro,
          probReteInviolata: Number(probReteInviolata.toFixed(2)), puntiReteInviolata: Number(puntiReteInviolata.toFixed(2))
        });
      }
    }

    inizializzaValutazioni();

    function assegnazioni() {
      const m = new Map();
      squadre.forEach((sq, i) => {
        for (const a of sq.rosa) m.set(a.id, { squadra: i, pagato: a.pagato });
      });
      return m;
    }

    function statoSquadra(sq) {
      const speso = sq.rosa.reduce((s, a) => s + a.pagato, 0);
      const residuo = BUDGET - speso;

      const presi = { P: 0, D: 0, C: 0, A: 0 };
      const spesoRuolo = { P: 0, D: 0, C: 0, A: 0 };
      for (const a of sq.rosa) {
        const p = PER_ID.get(a.id);
        presi[p.ruolo]++;
        spesoRuolo[p.ruolo] += a.pagato;
      }

      const mancanti = {};
      let mancantiTot = 0;
      for (const r of RUOLI) {
        mancanti[r] = Math.max(0, TARGET[r] - presi[r]);
        mancantiTot += mancanti[r];
      }

      const capienza = mancantiTot > 0 ? Math.max(1, residuo - (mancantiTot - 1)) : 0;
      return { speso, residuo, presi, spesoRuolo, mancanti, mancantiTot, capienza };
    }

    function capienzaRuolo(st, ruolo) {
      return st.mancanti[ruolo] > 0 ? st.capienza : 0;
    }

    function andamento(asseg) {
      const speso = { P: 0, D: 0, C: 0, A: 0 };
      const quanti = { P: 0, D: 0, C: 0, A: 0 };
      const vendutiPerRuoloEFascia = {
        P: { 1: [], 2: [], 3: [], 4: [] },
        D: { 1: [], 2: [], 3: [], 4: [] },
        C: { 1: [], 2: [], 3: [], 4: [] },
        A: { 1: [], 2: [], 3: [], 4: [] }
      };

      for (const [id, a] of asseg) {
        const p = PER_ID.get(id);
        const r = p.ruolo;
        speso[r] += a.pagato;
        quanti[r]++;
        vendutiPerRuoloEFascia[r][p.fascia].push(a.pagato);
      }

      const budgetLega = BUDGET * squadre.length;
      const prioriPerRuolo = Object.fromEntries(RUOLI.map(r => [
        r, (budgetLega * PRIORI[r] / 100) / (TARGET[r] * squadre.length)
      ]));

      // Il prezzo assoluto varia fra leghe con budget diversi. Per imparare
      // dall'asta confrontiamo quindi ogni vendita con il suo prezzo-base e
      // usiamo la mediana: un singolo rilancio folle non riscrive il mercato.
      const mediana = valori => {
        if (!valori.length) return 1;
        const ordinati = valori.slice().sort((a, b) => a - b);
        const m = Math.floor(ordinati.length / 2);
        return ordinati.length % 2 ? ordinati[m] : (ordinati[m - 1] + ordinati[m]) / 2;
      };
      const rapporti = [];
      const rapportiRuolo = { P: [], D: [], C: [], A: [] };
      for (const [id, a] of asseg) {
        const r = PER_ID.get(id).ruolo;
        const rapporto = Math.max(0.25, Math.min(4, a.pagato / Math.max(1, prioriPerRuolo[r])));
        rapporti.push(rapporto);
        rapportiRuolo[r].push(rapporto);
      }
      const inflazioneGlobale = mediana(rapporti);
      const benchmark = prezziTeoriciBase();
      let pagatoTeorico = 0;
      let pagatoReale = 0;
      for (const [id, a] of asseg) {
        pagatoReale += a.pagato;
        pagatoTeorico += benchmark.get(id) ?? 1;
      }
      const out = {};
      for (const r of RUOLI) {
        const slotTotali = TARGET[r] * squadre.length;
        const priori = prioriPerRuolo[r];

        // Calcolo per fascia con media winsorizzata (evita distorsioni da singoli outlier)
        const fasceStats = {};
        for (let f = 1; f <= 4; f++) {
          const list = vendutiPerRuoloEFascia[r][f].slice().sort((a, b) => a - b);
          let meanFascia = null;
          if (list.length >= 3) {
            const trimmed = list.slice(1, list.length - 1);
            meanFascia = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
          } else if (list.length > 0) {
            meanFascia = list.reduce((s, v) => s + v, 0) / list.length;
          }
          fasceStats[f] = { count: list.length, mean: meanFascia };
        }

        const osservato = quanti[r] ? speso[r] / quanti[r] : null;
        // Shrinkage bayesiano: le prime poche vendite orientano la stima, ma
        // non la fanno oscillare. Dopo cinque osservazioni del ruolo il dato
        // live pesa gia' quanto il mercato complessivo; continua a crescere.
        const inflazioneOsservata = mediana(rapportiRuolo[r]);
        const w = quanti[r] / (quanti[r] + 5);
        const inflazioneRuolo = inflazioneGlobale + (inflazioneOsservata - inflazioneGlobale) * w;
        out[r] = {
          medio: Math.max(1, priori * inflazioneRuolo),
          osservato, quanti: quanti[r], speso: speso[r], priori, fasceStats,
          inflazione: inflazioneRuolo,
          confidenza: Math.min(0.90, 0.35 + Math.min(0.30, rapporti.length / 40) + Math.min(0.25, quanti[r] / 20))
        };
      }
      out.globale = {
        indice: pagatoTeorico > 0 ? pagatoReale / pagatoTeorico : 1,
        pagatoReale, pagatoTeorico, vendite: rapporti.length
      };
      return out;
    }

    function quantoPosso(st, ruolo, and) {
      if (st.mancanti[ruolo] <= 0) return { medio: 0, tetto: 0 };
      let riserva = 0;
      for (const r of RUOLI) riserva += and[r].medio * (st.mancanti[r] - (r === ruolo ? 1 : 0));
      return {
        medio: Math.max(1, Math.min(st.capienza, Math.round(st.residuo - riserva))),
        tetto: st.capienza
      };
    }

    function tettoAvversari(ruolo, and) {
      const migliore = { cr: 0, realistico: 0, nome: null, quanti: 0 };
      for (let i = 1; i < squadre.length; i++) {
        const stato = statoSquadra(squadre[i]);
        const c = capienzaRuolo(stato, ruolo);
        if (c <= 0) continue;
        migliore.quanti++;
        migliore.cr = Math.max(migliore.cr, c);
        const realistico = quantoPosso(stato, ruolo, and).medio;
        if (realistico > migliore.realistico) {
          migliore.realistico = realistico;
          migliore.nome = squadre[i].nome;
        }
      }
      return migliore;
    }

    function prezziMercato(asseg, and) {
      const stati = squadre.map(statoSquadra);
      const residuoLega = stati.reduce((s, st) => s + st.residuo, 0);

      const slotRimasti = {};
      for (const r of RUOLI) slotRimasti[r] = stati.reduce((s, st) => s + st.mancanti[r], 0);

      const grezzo = {};
      let grezzoTot = 0;
      for (const r of RUOLI) {
        grezzo[r] = and[r].medio * slotRimasti[r];
        grezzoTot += grezzo[r];
      }
      const scala = grezzoTot > 0 ? residuoLega / grezzoTot : 0;

      const mercato = new Map();
      for (const r of RUOLI) {
        const liberi = PLAYERS.filter(p => p.ruolo === r && !asseg.has(p.id)).sort((a, b) => b.fvm - a.fvm);
        const n = slotRimasti[r];
        const contesi = new Set(liberi.slice(0, n).map(p => p.id));
        const somma = liberi.slice(0, n).reduce((s, p) => s + p.fvm, 0) || 1;
        const monte = Math.max(0, grezzo[r] * scala - n);
        const acquirenti = stati.filter(st => st.mancanti[r] > 0).length;
        const confidenza = and[r].confidenza;

        for (const p of liberi) {
          const atteso = contesi.has(p.id) ? 1 + (p.fvm / somma) * monte : 1;
          const ampiezza = 0.12 + (1 - confidenza) * 0.18 + Math.min(0.08, acquirenti * 0.01);
          mercato.set(p.id, {
            atteso: Math.max(1, Math.round(atteso)),
            min: Math.max(1, Math.round(atteso * (1 - ampiezza))),
            max: Math.max(1, Math.round(atteso * (1 + ampiezza))),
            acquirenti,
            confidenza
          });
        }
      }
      return mercato;
    }

    function calcolaMVAR_e_Scarsita(asseg) {
      const stati = squadre.map(statoSquadra);
      const slotRimasti = {};
      for (const r of RUOLI) slotRimasti[r] = stati.reduce((s, st) => s + st.mancanti[r], 0);

      const scarsita = {};
      const baselinePunti = {};
      const mvarMap = new Map();
      const tierMap = new Map();

      for (const r of RUOLI) {
        const liberi = PLAYERS.filter(p => p.ruolo === r && !asseg.has(p.id)).sort((a, b) => b.fvm - a.fvm);
        const slots = slotRimasti[r];
        const validi = liberi.filter(p => p.fascia <= 3 || p.tag.includes('TITOLARE')).length;
        const slotTitolari = { P: 1, D: 4, C: 4, A: 3 }[r];
        const sogliaFascia = { 1: 1, 2: Math.max(1, Math.ceil(slotTitolari / 2)), 3: slotTitolari, 4: TARGET[r] };
        const domandaFascia = Object.fromEntries([1, 2, 3, 4].map(fascia => [fascia,
          stati.reduce((somma, stato) => somma + Math.max(0, sogliaFascia[fascia] - stato.presi[r]), 0)
        ]));
        
        const sc = slots === 0 ? 0 : Math.min(100, Math.max(0, Math.round(100 * (1 - (validi - slots) / Math.max(1, slots)))));
        scarsita[r] = { score: sc, slots, validi, totLiberi: liberi.length };

        // Rimpiazzo: il primo profilo immediatamente fuori dagli slot ancora necessari.
        // Asta in corso: quando i top spariscono, la baseline sale/scende con il pool reale.
        const realisticIndex = Math.min(liberi.length - 1, Math.max(0, slots - 1));
        const basePlayer = liberi[realisticIndex] ?? liberi[liberi.length - 1];
        const baseVal = basePlayer ? (VALUTAZIONI_CACHE.get(basePlayer.id)?.puntiMatch ?? 5.5) : 5.0;
        baselinePunti[r] = baseVal;

        for (let indice = 0; indice < liberi.length; indice++) {
          const p = liberi[indice];
          const val = VALUTAZIONI_CACHE.get(p.id);
          const diffMatch = Math.max(0, (val?.puntiMatch ?? 5.5) - baseVal);
          const diffSeason = Number((diffMatch * (val?.presenzeAttese ?? 30)).toFixed(1));
          mvarMap.set(p.id, { diffMatch: Number(diffMatch.toFixed(2)), diffSeason });

          // Scarsita' della fascia, non solo del reparto: per un top contiamo quanti
          // giocatori della sua fascia (o migliore) sono ancora realmente disponibili.
          const disponibiliFascia = liberi.filter(q => q.fascia <= p.fascia).length;
          const domandaQualita = domandaFascia[p.fascia];
          const scoreFascia = domandaQualita === 0 ? 0 : Math.round(100 * domandaQualita / Math.max(1, domandaQualita + disponibiliFascia));
          const alternativa = liberi[Math.min(liberi.length - 1, Math.max(indice + 1, domandaQualita))];
          const puntiAlternativa = alternativa ? (VALUTAZIONI_CACHE.get(alternativa.id)?.puntiStagione ?? 0) : 0;
          const saltoPunti = Number(Math.max(0, (val?.puntiStagione ?? 0) - puntiAlternativa).toFixed(1));
          const premioSalto = Math.min(0.12, saltoPunti / 250);
          tierMap.set(p.id, { score: scoreFascia, disponibili: disponibiliFascia, domanda: domandaQualita, saltoPunti, premioSalto });
        }
      }

      return { scarsita, mvarMap, baselinePunti, tierMap };
    }

    // Simulazione Monte Carlo dei soli rilanci avversari: il piano rosa rimane
    // deterministico/esatto, mentre qui rendiamo esplicita l'incertezza di mercato.
    function simulaConcorrenza(candidato, st, asseg, mercato, and, tierInfo, maxBid) {
      const mkt = mercato.get(candidato.id) ?? { atteso: 1, min: 1, max: 1, confidenza: 0.35 };
      const concorrenti = squadre.slice(1).map(sq => statoSquadra(sq)).filter(stato => stato.mancanti[candidato.ruolo] > 0);
      const scenari = 800;
      const volatilita = 0.10 + (1 - (mkt.confidenza ?? 0.35)) * 0.18;
      const pressioneTier = (tierInfo?.score ?? 50) / 100 * 0.12;
      const seme = candidato.id * 1009 + asseg.size * 7919 + st.residuo;

      // Un giro di scenari con una data propensione media. Il prezzo di
      // chiusura e' il massimo fra i rilanci dei rivali che possono ancora
      // permetterselo: ognuno e' limitato dalla propria capienza reale.
      function giro(media) {
        const random = generatoreCasuale(seme);
        const chiusure = [];
        for (let s = 0; s < scenari; s++) {
          let chiusura = 1;
          for (const avversario of concorrenti) {
            // Box-Muller: propensione diversa per rivale ma riproducibile.
            const u1 = Math.max(1e-9, random());
            const u2 = random();
            const rumore = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const necessita = 0.04 + 0.10 * (avversario.mancanti[candidato.ruolo] / TARGET[candidato.ruolo]);
            const propensione = media * (1 + pressioneTier + necessita + rumore * volatilita);
            const cap = Math.min(avversario.capienza, quantoPosso(avversario, candidato.ruolo, and).tetto);
            chiusura = Math.max(chiusura, Math.max(1, Math.min(cap, Math.round(propensione))));
          }
          chiusure.push(chiusura);
        }
        chiusure.sort((a, b) => a - b);
        return chiusure;
      }

      /*
       * Calibrazione. Il prezzo di mercato e' gia' la stima di quanto va il giocatore
       * adesso: e' ricavata dai crediti ancora in circolazione e dagli slot
       * ancora da riempire. Far partire ogni rivale da quella cifra e poi
       * prendere il massimo fra nove rivali la gonfia di parecchio — il massimo
       * di nove estrazioni sta molto sopra la loro media — ed e' il motivo per
       * cui i prezzi simulati uscivano sistematicamente troppo alti.
       *
       * Quindi il primo giro serve solo a misurare quel fattore, e il secondo
       * gira con la propensione corretta perche' la mediana di chiusura torni
       * sul prezzo di mercato. La simulazione cosi' non ridecide il livello:
       * dice la dispersione e chi puo' ancora permetterselo.
       */
      let chiusure;
      if (!concorrenti.length) {
        chiusure = new Array(scenari).fill(1);
      } else {
        const prova = giro(mkt.atteso);
        const medianaProva = quantile(prova, 0.50);
        const fattore = medianaProva > 0 ? mkt.atteso / medianaProva : 1;
        // Se la correzione e' trascurabile evitiamo il secondo giro.
        chiusure = Math.abs(fattore - 1) < 0.02 ? prova : giro(mkt.atteso * fattore);
      }

      let vittorie = 0;
      for (let i = 0; i < chiusure.length; i++) if (maxBid >= chiusure[i]) vittorie++;

      return {
        scenari,
        chiusure,
        p50: quantile(chiusure, 0.50),
        p75: quantile(chiusure, 0.75),
        probabilitaVittoria: Math.round(100 * vittorie / scenari)
      };
    }

    function calcolaPianoCompletamento(st, candidato, asseg, mercato, and, tierMap) {
      if (!candidato || st.mancanti[candidato.ruolo] <= 0) return null;
      // Stesse frontiere della tabella: il numero nella riga e quello nel
      // pannello sono lo stesso calcolo, non due stime che possono divergere.
      const fr = frontiere(st, mercato, asseg);
      const budget = fr.budget;
      const valoreBaseline = fr.valoreBaseline;
      if (valoreBaseline <= IMPOSSIBILE / 2) return { nonFattibile: true };

      const conCandidato = fr.senzaSlot[candidato.ruolo];
      if (!conCandidato) return { nonFattibile: true };
      const valoreCandidato = fr.valorePer(candidato);
      const maxBid = tettoDaFrontiera(valoreCandidato, conCandidato, valoreBaseline, budget, st.capienza);

      const stimaMercato = mercato.get(candidato.id)?.atteso ?? 1;
      const completamentoAlMercato = stimaMercato <= budget ? conCandidato[budget - stimaMercato] : IMPOSSIBILE;
      const vantaggioAlMercato = completamentoAlMercato > IMPOSSIBILE / 2
        ? valoreCandidato + completamentoAlMercato - valoreBaseline
        : null;
      const monteCarlo = simulaConcorrenza(candidato, st, asseg, mercato, and, tierMap?.get(candidato.id), maxBid);
      return {
        id: candidato.id,
        maxBid,
        valoreBaseline: Number(valoreBaseline.toFixed(1)),
        vantaggioAlMercato: vantaggioAlMercato === null ? null : Number(vantaggioAlMercato.toFixed(1)),
        fattibileAlMercato: stimaMercato <= maxBid,
        scopo: classificaCandidato(candidato, st),
        monteCarlo
      };
    }

    // A cosa ti serve, non solo quanto vale. Il confronto lo facciamo gia' con
    // la frontiera esatta: qui lo traduciamo in una frase, riusando il Best XI
    // per distinguere chi entra subito in campo da chi resta una copertura.
    function classificaCandidato(candidato, st) {
      const rosaOra = squadre[0].rosa.map(a => PER_ID.get(a.id)).filter(Boolean);
      const prima = trovaBestXI(rosaOra);
      const dopo = trovaBestXI([...rosaOra, candidato]);
      const entra = dopo.titolari.some(g => g.id === candidato.id);
      const guadagnoXI = Number((dopo.puntiTotali - prima.puntiTotali).toFixed(1));
      const guadagnoMod = Number((dopo.mod.bonusAtteso - prima.mod.bonusAtteso).toFixed(2));

      // Lo scopo non guarda il prezzo: quello lo dice la fascia. Qui conta solo
      // cosa aggiunge alla rosa, cioe' la stessa utilita' marginale che usa
      // fishertiger per distinguere STARTER da COVERAGE e DEPTH. Un difensore
      // che non entra in formazione puo' comunque valere punti, perche' e' la
      // panchina a proteggere il modificatore.
      let codice = 'PROFONDITA';
      if (entra) codice = 'TITOLARE';
      else if (guadagnoXI > 0.05) codice = 'COPERTURA';

      return {
        codice,
        entra,
        guadagnoXI,
        guadagnoMod,
        moduloDopo: dopo.modulo,
        slotRimasti: st.mancanti[candidato.ruolo]
      };
    }

    /*
     * Verdetto a un prezzo preciso. Gira a ogni battuta di freccia mentre segui
     * il rilancio, quindi non ricalcola niente di pesante: usa il tetto gia'
     * calcolato per la riga aperta e la distribuzione di chiusura del Monte
     * Carlo, che e' un semplice conteggio.
     */
    function verdettoLive(prezzo, piano, st, mkt) {
      const tetto = piano?.maxBid ?? 0;
      const chiusure = piano?.monteCarlo?.chiusure ?? [];
      // Quota di scenari in cui questa offerta basta a portarlo a casa.
      let vinti = 0;
      for (let i = 0; i < chiusure.length; i++) if (prezzo >= chiusure[i]) vinti++;
      const vittoria = chiusure.length ? Math.round(100 * vinti / chiusure.length) : null;

      const residuoDopo = st.residuo - prezzo;
      const slotDopo = st.mancantiTot - 1;
      const perSlot = slotDopo > 0 ? (residuoDopo / slotDopo) : 0;

      let stato, testo, nota;
      if (prezzo < 1) {
        stato = 'neutro'; testo = 'Imposta un prezzo'; nota = '';
      } else if (prezzo > st.capienza) {
        stato = 'stop';
        testo = 'Non puoi arrivarci';
        nota = \`sforerebbe la capienza di \${st.capienza} cr: non resterebbe 1 credito per ognuno degli altri \${slotDopo} slot\`;
      } else if (tetto < 1) {
        stato = 'stop';
        testo = 'Lascialo andare';
        nota = 'nemmeno 1 credito e giustificato: i crediti rendono di piu sul resto della rosa';
      } else if (prezzo <= tetto) {
        stato = 'ok';
        testo = \`Puoi salire, ancora \${tetto - prezzo} cr\`;
        nota = \`resti sotto il prezzo di indifferenza (\${tetto} cr)\`;
      } else {
        stato = 'oltre';
        testo = \`Sopra il tetto di \${prezzo - tetto} cr\`;
        nota = \`prezzo di indifferenza \${tetto} cr: da qui in su stai scegliendo di risparmiare altrove\`;
      }

      return {
        stato, testo, nota, vittoria, tetto,
        residuoDopo, slotDopo,
        perSlot: Number(perSlot.toFixed(1)),
        mercato: mkt?.atteso ?? null
      };
    }

    const STILE_VERDETTO = {
      ok:     { barra: 'bg-emerald-500', testo: 'text-emerald-300', bordo: 'border-emerald-700/60 bg-emerald-950/30' },
      oltre:  { barra: 'bg-amber-500',   testo: 'text-amber-300',   bordo: 'border-amber-700/60 bg-amber-950/30' },
      stop:   { barra: 'bg-rose-500',    testo: 'text-rose-300',    bordo: 'border-rose-800/60 bg-rose-950/30' },
      neutro: { barra: 'bg-slate-600',   testo: 'text-slate-300',   bordo: 'border-slate-700 bg-slate-900/40' }
    };

    function verdettoHtml(v) {
      const st = STILE_VERDETTO[v.stato];
      const scala = Math.max(v.tetto, v.mercato ?? 0, 1) * 1.6;
      const pct = x => Math.max(0, Math.min(100, (x / scala) * 100));
      const prezzo = v.residuoDopo === null ? 0 : 0;
      return \`
        <div class="rounded-xl border \${st.bordo} px-3 py-2 space-y-1.5">
          <div class="flex items-baseline justify-between gap-3 flex-wrap">
            <strong class="\${st.testo} text-base leading-tight">\${esc(v.testo)}</strong>
            \${v.vittoria === null ? '' : \`<span class="text-[11px] text-slate-400">lo vinci nel <strong class="text-white tabular-nums">\${v.vittoria}%</strong> degli scenari</span>\`}
          </div>
          <p class="text-[10px] text-slate-400">\${esc(v.nota)}</p>
          <div class="relative h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <span class="absolute inset-y-0 left-0 \${st.barra} opacity-30" style="width:\${pct(v.tetto)}%"></span>
            <span class="absolute inset-y-0 w-0.5 bg-indigo-300" style="left:\${pct(v.tetto)}%" title="prezzo di indifferenza"></span>
            \${v.mercato === null ? '' : \`<span class="absolute inset-y-0 w-0.5 bg-amber-300" style="left:\${pct(v.mercato)}%" title="prezzo di mercato"></span>\`}
          </div>
          <p class="text-[10px] text-slate-500 tabular-nums">
            Se lo prendi: \${v.residuoDopo} cr per \${v.slotDopo} slot = <strong class="text-slate-300">\${v.perSlot} cr/slot</strong>
          </p>
        </div>\`;
    }

    function scopoDettaglio(scopo) {
      const pezzi = [];
      if (scopo.codice === 'TITOLARE') {
        pezzi.push(\`+\${scopo.guadagnoXI} pt/giornata, modulo \${scopo.moduloDopo}\`);
      } else if (scopo.codice === 'COPERTURA') {
        pezzi.push(\`+\${scopo.guadagnoXI} pt/giornata restando in panchina\`);
      } else {
        pezzi.push(\`riempie uno slot senza cambiare XI: ne restano \${scopo.slotRimasti} nel ruolo\`);
      }
      if (scopo.guadagnoMod >= 0.05) pezzi.push(\`+\${scopo.guadagnoMod.toFixed(2)} di modificatore\`);
      return esc(pezzi.join(' • '));
    }

    // Fascia di prezzo: dove sta il mercato rispetto al tetto esatto del piano
    // rosa. Sostituisce un numero secco con l'intervallo in cui la decisione
    // e' ancora reversibile, che e' l'informazione che serve durante il rilancio.
    function fasciaPrezzo(piano, mkt) {
      const max = Math.max(1, piano.maxBid);
      if (!mkt) return '';
      const scala = Math.max(max, mkt.max ?? max) * 1.15;
      const pct = v => Math.max(0, Math.min(100, (v / scala) * 100));
      const inizio = pct(mkt.min ?? 1);
      const largh = Math.max(1.5, pct(mkt.max ?? max) - inizio);
      const tono = piano.fattibileAlMercato ? 'bg-emerald-500' : 'bg-rose-500';
      return \`
        <div>
          <div class="flex items-baseline justify-between text-[10px] text-slate-400 mb-1">
            <span title="Prezzo oltre il quale la rosa migliore che riesci ancora a chiudere vale meno di quella che chiudi senza di lui">Prezzo di indifferenza <strong class="text-indigo-200 text-sm tabular-nums">\${max} cr</strong></span>
            <span>Mercato <strong class="text-slate-200 tabular-nums">\${mkt.min}–\${mkt.max}</strong> (atteso \${mkt.atteso})</span>
          </div>
          <div class="relative h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <span class="absolute inset-y-0 left-0 \${tono} opacity-25" style="width:\${pct(max)}%"></span>
            <span class="absolute inset-y-0 bg-slate-500/50 border-x border-slate-400/60" style="left:\${inizio}%;width:\${largh}%"></span>
            <span class="absolute inset-y-0 w-0.5 bg-indigo-300" style="left:\${pct(max)}%"></span>
            <span class="absolute inset-y-0 w-0.5 bg-amber-300" style="left:\${pct(mkt.atteso)}%"></span>
          </div>
          <p class="text-[10px] mt-1 \${piano.fattibileAlMercato ? 'text-emerald-300' : 'text-amber-300'}">
            \${piano.fattibileAlMercato
              ? \`Il mercato sta sotto il prezzo di indifferenza: fino a \${max} cr resta l'acquisto migliore che puoi fare con questi crediti.\`
              : \`Prezzo di indifferenza \${max} cr, mercato \${mkt.atteso}: sopra quella soglia gli stessi crediti rendono di piu' sul resto della rosa. Pagarlo comunque significa scegliere di risparmiare altrove.\`}
          </p>
        </div>\`;
    }

    const ETICHETTA_SCOPO = {
      TITOLARE: { testo: 'Entra subito nel Best XI', classe: 'text-emerald-300' },
      COPERTURA: { testo: 'Copertura che vale punti', classe: 'text-amber-300' },
      PROFONDITA: { testo: 'Solo profondita', classe: 'text-slate-300' }
    };

    /*
     * Tetto esatto per ogni giocatore libero, non piu' un'euristica.
     *
     * La frontiera dipende solo dallo stato della rosa e dai prezzi stimati,
     * non dai filtri: basta ricalcolarla quando cambia qualcosa. Servono cinque
     * DP (la baseline piu' una per ruolo, con uno slot in meno), non una per
     * giocatore, quindi il costo e' quello di una manciata di millisecondi per
     * assegnazione invece che per riga.
     */
    const FRONTIERE_CACHE = { firma: null, dati: null };

    function frontiere(st, mercato, asseg) {
      // La firma deve contenere tutto cio' da cui la frontiera dipende: i costi
      // stimati cambiano col numero di partecipanti, e i valori cambiano ogni
      // volta che le regole vengono ritarate. Senza, cambiare lega dava un
      // colpo di cache con i numeri della lega precedente.
      const firma = [
        VALUTAZIONI_VERSIONE, squadre.length, st.residuo,
        RUOLI.map(r => st.mancanti[r]).join('-'), asseg.size
      ].join('|');
      if (FRONTIERE_CACHE.firma === firma) return FRONTIERE_CACHE.dati;

      const budget = st.residuo;
      const pool = PLAYERS.filter(p => !asseg.has(p.id));
      const costoPer = p => mercato.get(p.id)?.atteso ?? 1;
      const valorePer = p => VALUTAZIONI_CACHE.get(p.id)?.puntiStagione ?? 0;

      const baseline = frontieraCompletamento(pool, st.mancanti, budget, costoPer, valorePer);
      const senzaSlot = {};
      for (const r of RUOLI) {
        if (st.mancanti[r] <= 0) continue;
        senzaSlot[r] = frontieraCompletamento(
          pool, { ...st.mancanti, [r]: st.mancanti[r] - 1 }, budget, costoPer, valorePer
        );
      }

      const dati = { budget, baseline, valoreBaseline: baseline[budget], senzaSlot, valorePer };
      FRONTIERE_CACHE.firma = firma;
      FRONTIERE_CACHE.dati = dati;
      return dati;
    }

    function calcolaPrezziEMioMax(st, mercato, asseg, and, scarsita, mvarMap, tierMap) {
      const prezzi = new Map();
      const mioMaxMap = new Map();
      const marginiMap = new Map();
      const semaforiMap = new Map();
      const fr = frontiere(st, mercato, asseg);

      for (const p of PLAYERS) {
        if (asseg.has(p.id)) continue;
        const r = p.ruolo;
        const mkt = mercato.get(p.id) ?? { atteso: 1, min: 1, max: 1 };
        const val = VALUTAZIONI_CACHE.get(p.id);
        const trueVal = val?.valorePuro ?? p.fvm;

        if (st.mancanti[r] <= 0) {
          prezzi.set(p.id, 0);
          mioMaxMap.set(p.id, 0);
          marginiMap.set(p.id, 0);
          semaforiMap.set(p.id, 'LASCIA');
          continue;
        }

        const prezzoConsigliato = Math.max(1, Math.min(mkt.atteso, st.capienza));
        prezzi.set(p.id, prezzoConsigliato);

        // Prezzo di indifferenza esatto: la soglia oltre la quale gli stessi
        // crediti rendono di piu' sul resto della rosa. Sostituisce il vecchio
        // "tetto rapido", che moltiplicava cinque fattori tarati a mano e
        // consigliava COMPRA a 56 crediti su un portiere da 30-40.
        const mioMax = fr.senzaSlot[r]
          ? tettoDaFrontiera(fr.valorePer(p), fr.senzaSlot[r], fr.valoreBaseline, fr.budget, st.capienza)
          : 0;
        mioMaxMap.set(p.id, mioMax);

        const margine = mioMax - mkt.atteso;
        marginiMap.set(p.id, margine);

        let sem = 'ATTENDI';
        if (mioMax < 1 || mkt.atteso > st.capienza) {
          sem = 'LASCIA';
        } else if (mkt.atteso <= mioMax) {
          // Il mercato sta sotto il tuo tetto: e' un affare vero.
          sem = 'COMPRA';
        } else if (mkt.min <= mioMax) {
          // Ci arrivi solo se l'asta resta nella parte bassa della forbice.
          sem = 'ATTENDI';
        } else {
          sem = 'LASCIA';
        }
        semaforiMap.set(p.id, sem);
      }

      return { prezzi, mioMaxMap, marginiMap, semaforiMap };
    }

    const SIGMA_MODIFICATORE = 0.28;

    // Il modificatore si calcola sulla rosa intera, non sui soli titolari: la
    // panchina e' proprio cio' che lo protegge, perche' se un difensore non
    // gioca il suo posto lo prende il primo disponibile. difensoriSchierati
    // e' quanti ne prevede il modulo, e sotto la soglia di lega il bonus non
    // scatta comunque.
    function calcolaModificatoreSquadra(rosaGiocatori, difensoriSchierati) {
      const perMv = (a, b) => (VALUTAZIONI_CACHE.get(b.id)?.mv ?? 6.0) - (VALUTAZIONI_CACHE.get(a.id)?.mv ?? 6.0);
      const difensori = rosaGiocatori.filter(p => p.ruolo === 'D').sort(perMv);
      const portieri = rosaGiocatori.filter(p => p.ruolo === 'P').sort(perMv);
      const inattivo = {
        bonusAtteso: 0, scaglioneBase: 0, mvMedia: 0, stagionale: 0,
        probAttivo: 0, topDif: difensori.slice(0, 3), attivo: false
      };
      if (!regole.modificatoreAttivo) return { ...inattivo, topDif: [] };

      const disponibile = p => ({
        p: VALUTAZIONI_CACHE.get(p.id)?.tit ?? 0.5,
        mv: VALUTAZIONI_CACHE.get(p.id)?.mv ?? 6.0
      });
      const res = modificatoreDifesaAtteso({
        portieri: portieri.map(disponibile),
        difensori: difensori.map(disponibile),
        difensoriSchierati,
        scaglioni: PROFILO_LEGA.modificatore.scaglioni,
        sigma: SIGMA_MODIFICATORE,
        difensoriMinimi: PROFILO_LEGA.modificatore.difensoriMinimi
      });

      return {
        bonusAtteso: Number(res.bonusAtteso.toFixed(2)),
        scaglioneBase: res.scaglioneBase,
        mvMedia: res.mvMedia,
        stagionale: Math.round(res.bonusAtteso * 38),
        probAttivo: res.probAttivo,
        topDif: difensori.slice(0, 3),
        attivo: true
      };
    }

    function simulaFormazione(rosaGiocatori, modulo) {
      const [nStrD, nStrC, nStrA] = modulo.split('-').map(Number);
      const perRuolo = {
        P: rosaGiocatori.filter(p => p.ruolo === 'P').sort((a, b) => (VALUTAZIONI_CACHE.get(b.id)?.puntiMatch ?? 0) - (VALUTAZIONI_CACHE.get(a.id)?.puntiMatch ?? 0)),
        D: rosaGiocatori.filter(p => p.ruolo === 'D').sort((a, b) => (VALUTAZIONI_CACHE.get(b.id)?.puntiMatch ?? 0) - (VALUTAZIONI_CACHE.get(a.id)?.puntiMatch ?? 0)),
        C: rosaGiocatori.filter(p => p.ruolo === 'C').sort((a, b) => (VALUTAZIONI_CACHE.get(b.id)?.puntiMatch ?? 0) - (VALUTAZIONI_CACHE.get(a.id)?.puntiMatch ?? 0)),
        A: rosaGiocatori.filter(p => p.ruolo === 'A').sort((a, b) => (VALUTAZIONI_CACHE.get(b.id)?.puntiMatch ?? 0) - (VALUTAZIONI_CACHE.get(a.id)?.puntiMatch ?? 0))
      };

      const titolari = [];
      const panchina = [];

      const pTitolare = perRuolo.P[0];
      if (pTitolare) titolari.push(pTitolare);
      panchina.push(...perRuolo.P.slice(1));

      const dTit = perRuolo.D.slice(0, nStrD);
      titolari.push(...dTit);
      panchina.push(...perRuolo.D.slice(nStrD));

      const cTit = perRuolo.C.slice(0, nStrC);
      titolari.push(...cTit);
      panchina.push(...perRuolo.C.slice(nStrC));

      const aTit = perRuolo.A.slice(0, nStrA);
      titolari.push(...aTit);
      panchina.push(...perRuolo.A.slice(nStrA));

      let puntiTitolari = titolari.reduce((s, p) => s + (VALUTAZIONI_CACHE.get(p.id)?.puntiMatch ?? 5.5), 0);

      // Unico punto in cui il modificatore viene calcolato: cosi' il numero in
      // testa, quello del simulatore e quello che decide il Best XI sono per
      // costruzione lo stesso, e nessun chiamante puo' saltare i vincoli.
      const mod = calcolaModificatoreSquadra(rosaGiocatori, nStrD);
      const modBonus = mod.bonusAtteso;

      const puntiTotali = Number((puntiTitolari + modBonus).toFixed(1));

      const titolariCompleti = titolari.length === 11;
      let probCopertura = 1.0;
      for (const p of titolari) {
        const tit = VALUTAZIONI_CACHE.get(p.id)?.tit ?? 0.8;
        probCopertura *= (0.7 + tit * 0.3);
      }
      if (!titolariCompleti) probCopertura *= (titolari.length / 11);

      return {
        modulo,
        titolari,
        panchina,
        mod,
        titolariCompleti,
        puntiTitolari: Number(puntiTitolari.toFixed(1)),
        modBonus,
        puntiTotali,
        coperturaPct: Math.round(probCopertura * 100),
        dettaglioRuoli: { P: pTitolare ? [pTitolare] : [], D: dTit, C: cTit, A: aTit }
      };
    }

    function trovaBestXI(rosaGiocatori) {
      if (!rosaGiocatori.length) {
        return simulaFormazione([], '3-4-3');
      }
      let migliore = null;
      for (const m of MODULI_SUPPORTATI) {
        const sim = simulaFormazione(rosaGiocatori, m);
        if (!migliore || sim.puntiTotali > migliore.puntiTotali) {
          migliore = sim;
        }
      }
      return migliore;
    }

    function chiPuoRilanciare(ruolo, prezzoOfferta) {
      const inCorsa = [];
      const eliminati = [];
      const asseg = assegnazioni();
      const and = andamento(asseg);

      for (let i = 1; i < squadre.length; i++) {
        const sq = squadre[i];
        const st = statoSquadra(sq);
        const cap = capienzaRuolo(st, ruolo);
        const mancRuolo = st.mancanti[ruolo];

        if (mancRuolo > 0 && cap >= prezzoOfferta + 1) {
          // Non basta che il rivale possa tecnicamente bruciare tutti i suoi
          // crediti: gli riserviamo i prezzi che l'asta sta facendo per gli
          // altri slot. Questo e' il suo rilancio plausibile, non il limite
          // teorico di emergenza che gli lascerebbe solo giocatori da 1.
          const maxRealistico = quantoPosso(st, ruolo, and).medio;

          // Pressione d'acquisto specifica per ruolo
          const quotaSpesaRuolo = (mancRuolo * and[ruolo].medio) / Math.max(1, st.residuo);
          let pressureScore = Math.min(100, Math.max(15, Math.round(100 * quotaSpesaRuolo * (mancRuolo / TARGET[ruolo]))));
          if (st.residuo >= 100 && mancRuolo >= 2) pressureScore = Math.min(100, pressureScore + 20);

          let pressureBadge = '🟢 Bassa';
          let pressureClass = 'text-emerald-400';
          if (pressureScore >= 70) {
            pressureBadge = '🔥🔥🔥 Alta';
            pressureClass = 'text-rose-400 font-black';
          } else if (pressureScore >= 35) {
            pressureBadge = '🟡 Media';
            pressureClass = 'text-amber-400 font-bold';
          }

          inCorsa.push({
            idx: i,
            nome: sq.nome,
            maxBid: cap,
            maxRealistico,
            residuo: st.residuo,
            mancanti: mancRuolo,
            pressureScore,
            pressureBadge,
            pressureClass
          });
        } else {
          eliminati.push({
            idx: i,
            nome: sq.nome,
            maxBid: cap,
            residuo: st.residuo,
            motivo: mancRuolo === 0 ? 'reparto pieno' : \`budget max \${cap} cr\`
          });
        }
      }

      inCorsa.sort((a, b) => b.pressureScore - a.pressureScore || b.maxBid - a.maxBid);
      const topRival = inCorsa[0] ?? null;

      return { inCorsa, eliminati, count: inCorsa.length, topRival };
    }

    function generaSuggerimentiNomine(asseg, st, mercato, semaforiMap, marginiMap) {
      const liberi = PLAYERS.filter(p => !asseg.has(p.id));

      const perMe = liberi
        .filter(p => st.mancanti[p.ruolo] > 0 && semaforiMap.get(p.id) === 'COMPRA')
        .sort((a, b) => (marginiMap.get(b.id) ?? 0) - (marginiMap.get(a.id) ?? 0));
      const targetFurtivo = perMe[0] ?? liberi.find(p => st.mancanti[p.ruolo] > 0 && p.tag.includes('TOP')) ?? liberi[0];

      const trappole = liberi
        .filter(p => p.fvm >= 35 && (st.mancanti[p.ruolo] === 0 || (st.presi[p.ruolo] >= 1 && p.fascia <= 2)))
        .sort((a, b) => b.fvm - a.fvm);
      const targetTrappola = trappole[0] ?? liberi.filter(p => p.ruolo === 'A').sort((a, b) => b.fvm - a.fvm)[0] ?? liberi[1];

      const sgonfia = liberi
        .filter(p => p.fascia === 2 && !p.tag.includes('RISCHIO') && p.id !== targetFurtivo?.id && p.id !== targetTrappola?.id)
        .sort((a, b) => b.fvm - a.fvm);
      const targetSgonfia = sgonfia[0] ?? liberi[2];

      return { targetFurtivo, targetTrappola, targetSgonfia };
    }

    function esc(s) {
      return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function render() {
      const asseg = assegnazioni();
      const st = statoSquadra(squadre[0]);
      const and = andamento(asseg);
      const mercato = prezziMercato(asseg, and);
      const { scarsita, mvarMap, tierMap } = calcolaMVAR_e_Scarsita(asseg);
      const { prezzi, mioMaxMap, marginiMap, semaforiMap } = calcolaPrezziEMioMax(st, mercato, asseg, and, scarsita, mvarMap, tierMap);
      const candidatoAperto = apertaRiga ? PER_ID.get(apertaRiga) : null;
      const pianoAperto = candidatoAperto && !asseg.has(candidatoAperto.id)
        ? calcolaPianoCompletamento(st, candidatoAperto, asseg, mercato, and, tierMap)
        : null;

      pianoLive = pianoAperto;
      mercatoLive = mercato;

      const miaRosaPlayers = squadre[0].rosa.map(a => PER_ID.get(a.id)).filter(Boolean);
      const bestXI = trovaBestXI(miaRosaPlayers);
      const modRes = bestXI.mod;
      const nomine = generaSuggerimentiNomine(asseg, st, mercato, semaforiMap, marginiMap);

      renderMetriche(st, and, bestXI, modRes, nomine);
      renderAndamento(st, and);
      renderAllarmiAsta(asseg, and);
      renderImpostazioni();
      renderTabellone();
      renderAvversariLive(and);
      renderTabella(st, mercato, prezzi, mioMaxMap, marginiMap, semaforiMap, scarsita, mvarMap, tierMap, asseg, and, pianoAperto);
      renderRosa();
      renderSimulatore(miaRosaPlayers, bestXI, modRes);
      renderStrategia(asseg, st, mercato, scarsita, mvarMap, nomine, semaforiMap, marginiMap, and);
      renderFormazioni(asseg);
      renderCoppie(asseg);
      aggiornaFiltriAttivi();
      salva();
    }

    function renderMetriche(st, and, bestXI, modRes, nomine) {
      document.getElementById('m-residuo').textContent = st.residuo;
      document.getElementById('m-slot').textContent = squadre[0].rosa.length;
      document.getElementById('m-speso').textContent = st.speso;
      document.getElementById('m-max-a').textContent = quantoPosso(st, 'A', and).medio;
      document.getElementById('m-max-c').textContent = quantoPosso(st, 'C', and).medio;
      document.getElementById('m-capienza').textContent = st.capienza;
      document.getElementById('m-slot-vuoti').textContent = Math.max(0, st.mancantiTot - 1);
      document.getElementById('badge-ruoli').textContent =
        RUOLI.map(r => \`\${st.presi[r]}/\${TARGET[r]} \${r}\`).join(' • ');
      document.getElementById('m-slot-tot').textContent = SLOT_TOT;
      document.getElementById('intestazione-lega').textContent =
        \`\${RUOLI.map(r => TARGET[r] + r).join(' ')} • \${squadre.length} partecipanti • \${squadre[0].nome}\`;
      document.getElementById('intestazione-budget').textContent = BUDGET;

      document.getElementById('m-best-xi-score').textContent = bestXI.puntiTotali > 0 ? bestXI.puntiTotali : '0.0';
      document.getElementById('m-best-xi-modulo').textContent = bestXI.modulo;
      document.getElementById('m-mod-expected').textContent = (modRes.bonusAtteso > 0 ? '+' : '') + modRes.bonusAtteso.toFixed(2);

      document.getElementById('riepilogo-reparti').innerHTML = RUOLI.map(r => \`
          <div class="bg-slate-950/80 border border-slate-800 rounded-lg p-1.5 text-center" title="\${NOMI_RUOLO[r]}: \${st.presi[r]} presi su \${TARGET[r]}">
            <span class="text-[9px] uppercase font-bold \${COLORE_RUOLO[r]} block">\${r}</span>
            <span class="text-[11px] font-black tabular-nums text-slate-200">\${st.spesoRuolo[r]}</span>
            <span class="text-[9px] text-slate-500 block tabular-nums">\${st.presi[r]}/\${TARGET[r]}</span>
          </div>\`).join('');
    }

    function renderAndamento(st, and) {
      document.getElementById('andamento').innerHTML = RUOLI.map(r => {
        const a = and[r];
        const q = quantoPosso(st, r, and);
        const chiuso = st.mancanti[r] <= 0;
        return \`
          <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div class="flex justify-between items-baseline gap-2">
              <span class="text-[11px] font-bold uppercase tracking-wider \${COLORE_RUOLO[r]}">\${NOMI_RUOLO[r]}</span>
              <span class="text-[10px] text-slate-500 tabular-nums">\${a.quanti} venduti</span>
            </div>
            <p class="mt-1.5 text-[10px] text-slate-400">
              prezzo medio <span class="text-slate-200 font-black tabular-nums text-sm">\${Math.round(a.medio)}</span> cr
              \${a.osservato === null
                ? '<span class="block text-slate-600">stima iniziale, nessun acquisto</span>'
                : \`<span class="block text-slate-600 tabular-nums">osservato \${Math.round(a.osservato)} su \${a.quanti} • mercato \${a.inflazione.toFixed(2)}x</span>\`}
            </p>
            <p class="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
              \${chiuso
                ? '<span class="text-slate-600">reparto completo</span>'
                : \`con una rosa nella media <span class="font-black tabular-nums text-base \${COLORE_RUOLO[r]}">\${q.medio}</span> cr
                   <span class="block text-slate-600 tabular-nums">fino a \${q.tetto} spingendo, ti mancano \${st.mancanti[r]} slot</span>\`}
            </p>
          </div>\`;
      }).join('');
    }

    function renderAllarmiAsta(asseg, and) {
      const el = document.getElementById('allarmi-asta');
      const globale = and.globale;
      const venditeSufficienti = globale.vendite >= 3;
      const indice = globale.indice;
      let stato = { etichetta: 'In osservazione', classe: 'text-slate-300', dettaglio: 'L’indice diventa affidabile dalla terza vendita.' };
      if (venditeSufficienti && indice > 1.15) {
        stato = { etichetta: 'Tavolo aggressivo', classe: 'text-rose-300', dettaglio: 'I massimali restano prudenti: i crediti residui valgono di più.' };
      } else if (venditeSufficienti && indice < 0.85) {
        stato = { etichetta: 'Tavolo a sconto', classe: 'text-emerald-300', dettaglio: 'C’è spazio per spingere sui profili che ti servono davvero.' };
      } else if (venditeSufficienti) {
        stato = { etichetta: 'Tavolo in linea', classe: 'text-sky-300', dettaglio: 'Prezzi reali e valori teorici sono allineati.' };
      }

      const tier = tiersAsta();
      const avvisi = [];
      for (const r of RUOLI) {
        for (const fascia of [1, 2]) {
          const iniziali = PLAYERS.filter(p => p.ruolo === r && tier.get(p.id) === fascia);
          const rimasti = iniziali.filter(p => !asseg.has(p.id));
          if (rimasti.length <= 2) {
            const livello = fascia === 1 ? 'Tier 1' : 'Tier 2';
            const nomi = rimasti.length ? rimasti.map(p => esc(p.nome)).join(', ') : 'fascia esaurita';
            avvisi.push({
              priorita: fascia === 1 ? 0 : 1,
              html: \`<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border \${fascia === 1 ? 'bg-rose-950/50 border-rose-800/60 text-rose-200' : 'bg-amber-950/50 border-amber-800/60 text-amber-200'}"><i class="fa-solid fa-triangle-exclamation"></i><strong>\${r} · \${livello}</strong> \${rimasti.length ? \`\${rimasti.length} rimast\${rimasti.length === 1 ? 'o' : 'i'}: \${nomi}\` : nomi}</span>\`
            });
          }
        }
      }
      avvisi.sort((a, b) => a.priorita - b.priorita);
      const altri = avvisi.length - 4;

      el.innerHTML = \`
        <div class="flex flex-col lg:flex-row lg:items-center gap-3">
          <div class="shrink-0 flex items-center gap-2 text-xs">
            <i class="fa-solid fa-gauge-high text-indigo-400"></i>
            <span class="text-slate-400">Indice tavolo</span>
            <strong class="tabular-nums text-base \${stato.classe}">\${indice.toFixed(2)}×</strong>
            <span class="font-bold \${stato.classe}">\${stato.etichetta}</span>
          </div>
          <p class="text-[11px] text-slate-500 flex-1">\${stato.dettaglio} <span class="tabular-nums">(\${globale.vendite} vendite, \${Math.round(globale.pagatoReale)}/\${Math.round(globale.pagatoTeorico)} cr)</span></p>
          \${avvisi.length ? \`<div class="flex flex-wrap gap-1.5 text-[10px] lg:justify-end">\${avvisi.slice(0, 4).map(a => a.html).join('')}\${altri > 0 ? \`<span class="px-2 py-1 text-slate-500">+\${altri} avvisi</span>\` : ''}</div>\` : ''}
        </div>\`;
      el.classList.remove('hidden');
    }

    function renderAvversariLive(and) {
      const el = document.getElementById('avversari-live');
      const avversari = squadre.slice(1).map(sq => {
        const stato = statoSquadra(sq);
        const attacco = quantoPosso(stato, 'A', and);
        return { nome: sq.nome, stato, attacco };
      }).sort((a, b) => b.attacco.medio - a.attacco.medio || b.stato.residuo - a.stato.residuo);

      if (!avversari.length) {
        el.innerHTML = '<p class="text-xs text-slate-500">Aggiungi almeno un avversario.</p>';
        return;
      }
      el.innerHTML = avversari.map(({ nome, stato, attacco }) => {
        const aperto = stato.mancanti.A > 0;
        return \`<div class="flex items-center justify-between gap-2 text-[11px] bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-2">
          <span class="font-semibold text-slate-300 truncate">\${esc(nome)}</span>
          <span class="shrink-0 text-right tabular-nums">
            <strong class="text-slate-100">\${stato.residuo}</strong><span class="text-slate-500"> cr</span>
            <span class="mx-1.5 text-slate-700">·</span>
            <span class="\${aperto ? 'text-rose-300' : 'text-slate-600'}">A \${stato.mancanti.A}/\${TARGET.A}</span>
            <span class="block text-[9px] \${aperto ? 'text-amber-400' : 'text-slate-600'}">max realistico \${aperto ? attacco.medio : '—'} cr</span>
          </span>
        </div>\`;
      }).join('');
    }

    function renderImpostazioni() {
      const nSq = document.getElementById('n-squadre');
      if (document.activeElement !== nSq) nSq.value = squadre.length;
      const cleanSheet = document.getElementById('bonus-rete-inviolata');
      if (document.activeElement !== cleanSheet) cleanSheet.value = regole.bonusReteInviolata;
      document.getElementById('modificatore-attivo').checked = regole.modificatoreAttivo;

      const nomi = document.getElementById('nomi-squadre');
      if (Number(nomi.dataset.n) !== squadre.length) {
        nomi.dataset.n = squadre.length;
        nomi.innerHTML = squadre.map((sq, i) => \`
          <input type="text" data-nome="\${i}" value="\${esc(sq.nome)}" maxlength="24"
            class="bg-slate-950 border \${i === 0 ? 'border-indigo-700' : 'border-slate-800'} rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">\`).join('');
        for (const input of nomi.querySelectorAll('[data-nome]')) {
          input.addEventListener('input', () => {
            const i = Number(input.dataset.nome);
            squadre[i].nome = input.value.trim() || (i === 0 ? 'Io' : \`Squadra \${i + 1}\`);
            render();
          });
        }
      }
    }

    function renderTabellone() {
      document.getElementById('tabellone').innerHTML = squadre.map((sq, i) => {
        const st = statoSquadra(sq);
        const aperti = RUOLI.filter(r => st.mancanti[r] > 0);
        const io = i === 0;
        const completa = st.mancantiTot === 0;

        const cella = r => \`<td class="py-2 px-2 text-center tabular-nums \${st.mancanti[r] === 0 ? 'text-slate-600' : COLORE_RUOLO[r]}">\${st.presi[r]}/\${TARGET[r]}</td>\`;

        const dettaglio = apertaSquadra === i ? \`
          <tr class="bg-slate-950/60">
            <td colspan="9" class="p-3">
              \${sq.rosa.length ? \`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">\${
                sq.rosa.map((a, j) => {
                  const p = PER_ID.get(a.id);
                  return \`<div class="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 gap-2">
                    <span class="truncate"><span class="font-black \${COLORE_RUOLO[p.ruolo]}">\${p.ruolo}</span> \${esc(p.nome)}</span>
                    <span class="flex items-center gap-2 shrink-0">
                      <button type="button" data-correggi="\${i}:\${j}" class="text-emerald-400 font-black tabular-nums hover:text-emerald-300" title="Correggi il prezzo">\${a.pagato}</button>
                      <button type="button" data-rimuovi="\${i}:\${j}" class="text-slate-500 hover:text-rose-400" title="Rimuovi" aria-label="Rimuovi \${esc(p.nome)}"><i class="fa-solid fa-trash-can"></i></button>
                    </span>
                  </div>\`;
                }).join('')}</div>\`
                : '<p class="text-slate-500 italic text-[11px]">Nessun giocatore assegnato.</p>'}
            </td>
          </tr>\` : '';

        return \`
          <tr data-squadra="\${i}" class="cursor-pointer transition \${io ? 'bg-indigo-950/30' : ''} \${apertaSquadra === i ? 'bg-slate-800/40' : 'hover:bg-slate-800/30'}">
            <td class="py-2 pr-3 font-semibold \${io ? 'text-indigo-300' : 'text-slate-200'}">
              \${apertaSquadra === i
                ? '<i class="fa-solid fa-chevron-down text-[9px] text-slate-600 mr-1.5"></i>'
                : '<i class="fa-solid fa-chevron-right text-[9px] text-slate-600 mr-1.5"></i>'}\${esc(sq.nome)}
            </td>
            <td class="py-2 px-2 text-right font-black tabular-nums \${st.residuo <= 20 ? 'text-rose-400' : 'text-emerald-400'}">\${st.residuo}</td>
            <td class="py-2 px-2 text-right tabular-nums text-slate-500">\${st.speso}</td>
            \${RUOLI.map(cella).join('')}
            <td class="py-2 px-2 text-right font-black tabular-nums text-white">\${completa ? '—' : st.capienza}</td>
            <td class="py-2 pl-2 text-[11px] \${completa ? 'text-slate-600' : 'text-slate-400'}">\${completa ? 'rosa completa' : aperti.join(' ')}</td>
          </tr>\${dettaglio}\`;
      }).join('');

      for (const tr of document.querySelectorAll('#tabellone [data-squadra]')) {
        tr.addEventListener('click', e => {
          if (e.target.closest('button')) return;
          const i = Number(tr.dataset.squadra);
          apertaSquadra = apertaSquadra === i ? null : i;
          render();
        });
      }
      for (const b of document.querySelectorAll('#tabellone [data-rimuovi]')) {
        b.addEventListener('click', () => {
          const [i, j] = b.dataset.rimuovi.split(':').map(Number);
          squadre[i].rosa.splice(j, 1);
          render();
        });
      }
      for (const b of document.querySelectorAll('#tabellone [data-correggi]')) {
        b.addEventListener('click', () => {
          const [i, j] = b.dataset.correggi.split(':').map(Number);
          correggi(i, j);
        });
      }
    }

    const RUOLI_FILTRO = [
      { k: 'ALL', et: 'TUTTI', c: '' },
      { k: 'P', et: 'P (Blocchi)', c: 'text-amber-400' },
      { k: 'D', et: 'D', c: 'text-emerald-400' },
      { k: 'C', et: 'C', c: 'text-blue-400' },
      { k: 'A', et: 'A', c: 'text-rose-400' }
    ];

    const TAG_FILTRO = [
      { k: 'ALL', et: 'Tutti', i: '', c: 'text-slate-300' },
      { k: 'FASCIA_ALTA', et: 'Fascia alta', i: '<i class="fa-solid fa-crown mr-1"></i>', c: 'text-amber-300' },
      { k: 'XI', et: 'Probabili titolari', i: '<i class="fa-solid fa-check mr-1"></i>', c: 'text-emerald-300' },
      { k: 'BALLOTTAGGIO', et: 'Ballottaggi', i: '<i class="fa-solid fa-code-compare mr-1"></i>', c: 'text-amber-300' },
      { k: 'RIGORISTA', et: 'Primi rigoristi', i: '<i class="fa-solid fa-bullseye mr-1"></i>', c: 'text-emerald-300' },
      { k: 'PIAZZATI', et: 'Piazzati', i: '<i class="fa-solid fa-crosshairs mr-1"></i>', c: 'text-sky-300' },
      { k: 'LOWCOST', et: 'Low cost (Q. ≤5)', i: '<i class="fa-solid fa-coins mr-1"></i>', c: 'text-teal-300' },
      { k: 'RISCHIO', et: 'A rischio', i: '<i class="fa-solid fa-triangle-exclamation mr-1"></i>', c: 'text-rose-300' }
    ];

    function corrispondeFiltro(p, filtro) {
      if (filtro === 'ALL') return true;
      if (filtro === 'FASCIA_ALTA') return p.fascia <= 2;
      if (filtro === 'XI') return p.formazione?.gruppo === 'XI' && p.formazione.probabilita >= 70;
      if (filtro === 'BALLOTTAGGIO') return (p.formazione?.gruppo === 'XI' && p.formazione.probabilita < 70) || p.formazione?.gruppo === 'ALTERNATIVA';
      if (filtro === 'RIGORISTA') return p.sos?.piazzati?.RIGORI === 1 || p.tag.includes('RIGORISTA');
      if (filtro === 'PIAZZATI') return Boolean(p.sos?.piazzati && Object.keys(p.sos.piazzati).length);
      if (filtro === 'LOWCOST') return p.quot <= 5;
      if (filtro === 'RISCHIO') return p.tag.includes('RISCHIO');
      return false;
    }

    function initFiltri() {
      document.getElementById('filtri-ruolo').innerHTML = RUOLI_FILTRO.map(r =>
        \`<button type="button" data-ruolo="\${r.k}" class="btn-ruolo px-3 py-1.5 rounded-lg text-xs font-bold \${r.c}">\${r.et}</button>\`
      ).join('');

      document.getElementById('filtri-tag').innerHTML =
        '<span class="text-slate-500 self-center font-semibold">Filtri:</span>' +
        TAG_FILTRO.map(t =>
          \`<button type="button" data-tag="\${t.k}" class="btn-tag px-2.5 py-1 rounded font-semibold \${t.c}">\${t.i}\${t.et}</button>\`
        ).join('');

      for (const b of document.querySelectorAll('.btn-ruolo')) {
        b.addEventListener('click', () => { filtroRuolo = b.dataset.ruolo; render(); });
      }
      for (const b of document.querySelectorAll('.btn-tag')) {
        b.addEventListener('click', () => { filtroTag = b.dataset.tag; render(); });
      }
    }

    function aggiornaFiltriAttivi() {
      for (const b of document.querySelectorAll('.btn-ruolo')) {
        const attivo = b.dataset.ruolo === filtroRuolo;
        b.classList.toggle('bg-indigo-600', attivo);
        b.classList.toggle('text-white', attivo);
        b.classList.toggle('bg-slate-800', !attivo);
      }
      for (const b of document.querySelectorAll('.btn-tag')) {
        const attivo = b.dataset.tag === filtroTag;
        b.classList.toggle('ring-2', attivo);
        b.classList.toggle('ring-indigo-500', attivo);
        b.classList.toggle('bg-slate-700', attivo);
        b.classList.toggle('bg-slate-800', !attivo);
      }
    }

    function renderTabella(st, mercato, prezzi, mioMaxMap, marginiMap, semaforiMap, scarsita, mvarMap, tierMap, asseg, and, pianoAperto) {
      const q = document.getElementById('ricerca').value.trim().toLowerCase();
      const tetti = Object.fromEntries(RUOLI.map(r => [r, tettoAvversari(r, and)]));

      const righe = PLAYERS.filter(p => {
        if (soloLiberi && asseg.has(p.id)) return false;
        if (soloAffari && semaforiMap.get(p.id) !== 'COMPRA') return false;
        if (filtroRuolo !== 'ALL' && p.ruolo !== filtroRuolo) return false;
        if (!corrispondeFiltro(p, filtroTag)) return false;
        if (!q) return true;
        return [p.nome, p.squadra, p.nota ?? '', ...(p.blocco ?? []), ...p.mantra, ...p.tag]
          .join(' ').toLowerCase().includes(q);
      });

      document.getElementById('tabella').innerHTML = righe.map(p => {
        const preso = asseg.get(p.id);
        const avv = tetti[p.ruolo];
        const mkt = mercato.get(p.id) ?? { atteso: 1, min: 1, max: 1 };
        const prezzo = prezzi.get(p.id) ?? 0;
        const val = VALUTAZIONI_CACHE.get(p.id) ?? { valorePuro: p.fvm, mv: 6.0, fma: 6.0 };
        const mioMax = mioMaxMap.get(p.id) ?? 0;
        const margine = marginiMap.get(p.id) ?? 0;
        const semaforo = semaforiMap.get(p.id) ?? 'ATTENDI';
        const mvar = mvarMap.get(p.id) ?? { diffMatch: 0, diffSeason: 0 };
        const scInfo = scarsita[p.ruolo] ?? { score: 50 };
        const tierInfo = tierMap.get(p.id) ?? { score: 50, disponibili: 0, domanda: 0, saltoPunti: 0 };
        const segnaliSos = [];
        if (p.formazione?.gruppo === 'XI') segnaliSos.push('XI ' + p.formazione.probabilita + '%');
        else if (p.formazione?.gruppo === 'ALTERNATIVA') segnaliSos.push('ballottaggio ' + p.formazione.probabilita + '%');
        if (p.sos?.status) segnaliSos.push(p.sos.status.toLowerCase());
        if (p.sos?.gerarchiaPortiere) segnaliSos.push('portiere ' + p.sos.gerarchiaPortiere.toLowerCase());
        if (p.sos?.piazzati?.RIGORI) segnaliSos.push('rigori #' + p.sos.piazzati.RIGORI);
        if (p.sos?.piazzati?.PUNIZIONI) segnaliSos.push('punizioni #' + p.sos.piazzati.PUNIZIONI);
        if (p.sos?.piazzati?.CORNER) segnaliSos.push('corner #' + p.sos.piazzati.CORNER);

        const mantra = p.mantra.map(m =>
          \`<span class="text-[10px] px-1 py-px rounded bg-slate-800/80 text-slate-400 border border-slate-700/50" title="\${NOMI_MANTRA[m] ?? m}">\${m}</span>\`).join(' ');
        const etichetteProfilo = [
          p.formazione?.gruppo === 'XI' ? '<span class="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border bg-emerald-950 text-emerald-300 border-emerald-800/60 font-bold">Probabile XI</span>' : '',
          p.formazione?.gruppo === 'ALTERNATIVA' ? '<span class="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border bg-amber-950 text-amber-300 border-amber-800/60">Ballottaggio</span>' : '',
          p.sos?.piazzati?.RIGORI === 1 ? '<span class="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border bg-emerald-950 text-emerald-300 border-emerald-800/60 font-bold">1° rigorista</span>' : '',
          p.tag.includes('RISCHIO') ? '<span class="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border bg-rose-950 text-rose-300 border-rose-800/60">Rischio</span>' : '',
          p.quot <= 5 ? '<span class="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border bg-teal-950 text-teal-300 border-teal-800/60">Low cost</span>' : ''
        ].filter(Boolean).join('');

        const semaforoBadge = semaforo === 'COMPRA'
          ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-700"><i class="fa-solid fa-circle-check text-emerald-400"></i> COMPRA</span>'
          : semaforo === 'ATTENDI'
            ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60"><i class="fa-solid fa-dice text-amber-400"></i> ATTENDI</span>'
            : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60"><i class="fa-solid fa-circle-xmark text-rose-400"></i> LASCIA</span>';

        const celle = preso
          ? \`<td class="p-2.5 text-center text-[11px] text-slate-500">—</td>
             <td class="p-2.5 text-right">
               <span class="text-[11px] font-bold text-slate-400">\${esc(squadre[preso.squadra].nome)}</span>
               <span class="block text-[11px] text-emerald-500 tabular-nums">\${preso.pagato} cr</span>
             </td>\`
          : \`<td class="p-2.5 text-center align-top space-y-1">
               \${semaforoBadge}
               <div class="text-[10px] text-slate-400 tabular-nums">Tetto rapido <strong class="\${mioMax >= mkt.atteso ? 'text-emerald-400' : 'text-rose-400'} font-bold">\${mioMax} cr</strong></div>
               <div class="flex items-center justify-center gap-2 text-[9px] text-slate-500 tabular-nums">
                 <span title="Fantapunti stagionali sopra il rimpiazzo del ruolo">+\${mvar.diffSeason} pt vs rimpiazzo</span>
                 <span>•</span>
                 <span class="\${tierInfo.score >= 75 ? 'text-rose-400 font-bold' : 'text-indigo-400'}" title="Scarsita della fascia: \${tierInfo.domanda} slot qualitativi ancora richiesti contro \${tierInfo.disponibili} profili di questa fascia o migliore; salto verso il rimpiazzo: \${tierInfo.saltoPunti} pt stagionali">Tier \${tierInfo.score}%</span>
               </div>
             </td>
             <td class="p-2.5 text-center align-top">
               <span class="font-black text-amber-300 text-sm tabular-nums" title="Stima di chiusura live">Stima \${prezzo} cr</span>
               <span class="block text-[10px] text-slate-500 mt-0.5 tabular-nums">forchetta \${mkt.min}–\${mkt.max} • conf. \${Math.round((mkt.confidenza ?? 0.35) * 100)}%</span>
                <span class="block text-[9px] text-slate-600 mt-1 tabular-nums">\${
                  avv.cr > 0
                    ? \`\${avv.quanti} in corsa, ~\${avv.realistico} (\${esc(avv.nome)})\`
                    : "nessun rivale puo' piu' prenderlo"}</span>
              </td>
              <td class="p-2.5 text-right align-top">
                <button type="button" data-apri="\${p.id}" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md transition">Valuta</button>
              </td>\`;

        let radarHtml = '';
        if (apertaRiga === p.id && !preso) {
          const radar = chiPuoRilanciare(p.ruolo, prezzo);
          radarHtml = \`
            <div class="w-full mt-3 pt-2.5 border-t border-slate-800 flex flex-col gap-2 text-xs">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span class="font-bold text-slate-300 flex items-center gap-1.5">
                  <i class="fa-solid fa-crosshairs text-indigo-400"></i> Radar Rilanci a quota <span id="radar-quota" class="text-amber-300 font-black">\${prezzo}</span> cr:
                </span>
                <span id="radar-messaggio" class="text-[11px] \${radar.count <= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}">
                  \${radar.count === 0 ? "Nessun rivale puo' piu' rilanciare!" : \`\${radar.count} avversari con capienza sufficiente\`}
                </span>
              </div>
              \${radar.topRival ? \`
                <div class="bg-slate-900/90 border border-indigo-900/50 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px]">
                  <span class="text-indigo-300"><i class="fa-solid fa-fire text-rose-400 mr-1"></i> Principale minaccia: <strong>\${esc(radar.topRival.nome)}</strong> (Pressione \${radar.topRival.pressureBadge})</span>
                  <span class="text-slate-400">Capienza: <strong class="text-white">\${radar.topRival.maxBid}</strong> cr • Realistico: <strong class="text-amber-300">\${radar.topRival.maxRealistico}</strong> cr</span>
                </div>\` : ''}
              <div id="radar-rivali-list" class="flex flex-wrap gap-1.5">
                \${radar.inCorsa.map(r => \`<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1" title="Capienza max: \${r.maxBid} cr | Rilancio stimato: ~\${r.maxRealistico} cr">
                  \${esc(r.nome)}: <strong class="text-white font-bold" title="Max possibile">\${r.maxBid}</strong> max
                  <span class="text-[9px] text-amber-300 font-semibold" title="Max probabile / Rilancio stimato">(~\${r.maxRealistico})</span>
                  <span class="text-[9px] \${r.pressureClass}">(\${r.pressureBadge})</span>
                </span>\`).join('')}
                \${radar.eliminati.map(r => \`<span class="px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-600 line-through" title="\${r.motivo}">\${esc(r.nome)}</span>\`).join('')}
              </div>
            </div>\`;
        }

        const pannello = apertaRiga === p.id && !preso ? \`
          <tr class="bg-slate-950">
            <td colspan="7" class="p-3.5 border border-indigo-900/50 rounded-xl">
              \${pianoAperto?.id === p.id ? (pianoAperto.nonFattibile
                ? '<div class="mb-3 text-[11px] text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-lg px-3 py-2">Piano di completamento non fattibile con le stime di mercato correnti: conserva crediti o cerca alternative low-cost.</div>'
                : \`<div class="mb-3 bg-indigo-950/35 border border-indigo-900/60 rounded-xl p-2.5 space-y-2.5">
                    \${fasciaPrezzo(pianoAperto, mercato.get(p.id))}
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div><span class="text-slate-500 block">A cosa ti serve</span><strong class="\${ETICHETTA_SCOPO[pianoAperto.scopo.codice].classe}">\${ETICHETTA_SCOPO[pianoAperto.scopo.codice].testo}</strong><span class="block text-[10px] text-slate-400">\${scopoDettaglio(pianoAperto.scopo)}</span></div>
                      <div><span class="text-slate-500 block">Vantaggio al prezzo mercato</span><strong class="\${(pianoAperto.vantaggioAlMercato ?? -1) >= 0 ? 'text-emerald-300' : 'text-rose-300'} text-base tabular-nums">\${pianoAperto.vantaggioAlMercato === null ? 'non fattibile' : (pianoAperto.vantaggioAlMercato >= 0 ? '+' : '') + pianoAperto.vantaggioAlMercato + ' pt'}</strong></div>
                      <div><span class="text-slate-500 block">Monte Carlo (\${pianoAperto.monteCarlo.scenari})</span><strong class="text-amber-300 tabular-nums">P50 \${pianoAperto.monteCarlo.p50} · P75 \${pianoAperto.monteCarlo.p75}</strong><span class="block text-[10px] text-slate-400">\${pianoAperto.monteCarlo.probabilitaVittoria}% entro il tuo max</span></div>
                    </div>
                    <p class="text-[10px] text-slate-400">Calcolo esatto sugli slot rimasti: confronta questo acquisto con il miglior completamento della rosa ai prezzi live stimati. Monte Carlo simula l'incertezza dei rilanci avversari; i fantapunti sono una proxy finche' non importiamo proiezioni storiche/calendario.</p>
                  </div>\`)
                : ''}
              \${pianoAperto?.id === p.id && !pianoAperto.nonFattibile
                ? \`<div id="verdetto-live" class="mb-3">\${verdettoHtml(verdettoLive(prezzo, pianoAperto, st, mkt))}</div>\`
                : ''}
              <div class="flex flex-wrap items-end gap-3">
                <label class="text-[10px] uppercase font-semibold text-slate-400">Prezzo in asta
                  <input type="number" id="prezzo-input" min="1" value="\${prezzo}" class="mt-1 block w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-lg font-bold text-slate-100 tabular-nums focus:outline-none focus:border-indigo-500">
                </label>
                <div class="flex flex-wrap gap-1.5">
                  \${squadre.map((sq, i) => {
                    const s = statoSquadra(sq);
                    const puo = s.mancanti[p.ruolo] > 0;
                    return \`<button type="button" data-assegna="\${p.id}:\${i}" \${puo ? '' : 'disabled'}
                      class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition \${
                        !puo ? 'bg-slate-900 text-slate-700 cursor-not-allowed'
                        : i === 0 ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}"
                      title="\${puo ? \`capienza \${s.capienza} cr\` : \`ha gia tutti gli slot \${p.ruolo}\`}">\${esc(sq.nome)}</button>\`;
                  }).join('')}
                </div>
                <button type="button" data-chiudi="1" class="text-[11px] text-slate-500 hover:text-slate-300 pb-2 ml-auto">Annulla</button>
              </div>
              \${radarHtml}
            </td>
          </tr>\` : '';

        return \`
          <tr class="\${preso ? 'opacity-40 bg-slate-950/60' : 'hover:bg-slate-800/40 transition'}">
            <td class="p-2.5 font-black \${COLORE_RUOLO[p.ruolo]} align-top">\${p.ruolo}</td>
            <td class="p-2.5 align-top">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-semibold text-white">\${esc(p.nome)}</span>
                \${p.fuoriListone ? \`<span class="text-[9px] px-1.5 py-px rounded bg-orange-950 text-orange-300 border border-orange-800/60" title="\${
                  p.fuoriListone === 'voce'
                    ? 'Non presente nel listone in mio possesso: aggiunto a mano'
                    : 'Trasferimento non ancora recepito dal listone in mio possesso'
                }">fuori listone</span>\` : ''}
              </div>
              <p class="mt-1 flex flex-wrap gap-1">\${mantra}</p>
            </td>
            <td class="p-2.5 text-slate-400 align-top">\${esc(p.squadra)}</td>
            <td class="p-2.5 text-center align-top">
              <span class="inline-block px-2 py-0.5 rounded text-[11px] font-bold tabular-nums border \${
                p.stimato ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' : 'bg-slate-800/60 text-slate-300 border-slate-700/50'
              }" title="\${p.stimato ? 'Stimati da me, non ufficiali: ' + p.stimato.join(', ') : \`Mantra: FVM \${p.fvmM}, quotazione \${p.quotM}\`}">\${p.fvm} / \${p.quot}\${p.stimato ? ' ~' : ''}</span>
              <span class="block mt-1 text-[10px] px-1.5 py-px rounded border \${STILE_FASCIA[p.fascia]}" title="Fascia dalla quotazione ufficiale: 1ª da 30 crediti in su, 2ª 15-29, 3ª 6-14, 4ª 1-5">\${NOMI_FASCIA[p.fascia]}</span>
            </td>
            <td class="p-2.5 align-top max-w-xs">
              <p class="flex flex-wrap gap-1">\${etichetteProfilo}</p>
              \${p.nota ? \`<p class="text-[11px] text-slate-300 mt-1.5 leading-relaxed">\${esc(p.nota)}</p>\` : ''}
              \${segnaliSos.length ? \`<p class="text-[10px] text-violet-300 mt-1 leading-relaxed" title="Segnale SOS Fanta/FisherTiger del 31/08/2026, abbinato per nome e squadra al listone ufficiale">SOS: \${esc(segnaliSos.join(' • '))}</p>\` : ''}
              <p class="text-[10px] text-slate-500 mt-1 tabular-nums">\${p.rank}° per FVM fra i \${NOMI_RUOLO[p.ruolo].toLowerCase()}\${p.fonti ? ' • fonti: ' + esc(p.fonti.join(', ')) : ''}</p>
            </td>
            \${celle}
          </tr>\${pannello}\`;
      }).join('') || '<tr><td colspan="7" class="p-8 text-center text-xs text-slate-500">Nessun calciatore corrisponde ai filtri.</td></tr>';

      document.getElementById('conteggio').textContent =
        \`\${righe.length} mostrati • \${PLAYERS.length - asseg.size} ancora liberi su \${PLAYERS.length}\`;

      for (const b of document.querySelectorAll('[data-apri]')) {
        b.addEventListener('click', () => { apertaRiga = Number(b.dataset.apri); render(); focalizzaPrezzo(); });
      }
      for (const b of document.querySelectorAll('[data-chiudi]')) {
        b.addEventListener('click', () => { apertaRiga = null; render(); });
      }
      for (const b of document.querySelectorAll('[data-assegna]')) {
        b.addEventListener('click', () => {
          const [id, i] = b.dataset.assegna.split(':').map(Number);
          assegna(id, i);
        });
      }

      const input = document.getElementById('prezzo-input');
      if (input && apertaRiga) {
        const pCur = PER_ID.get(apertaRiga);
        input.addEventListener('input', () => {
          const val = Number(input.value) || 0;
          // Il verdetto si aggiorna a ogni freccia: nessun ricalcolo pesante,
          // il tetto e la distribuzione dei rilanci sono gia' calcolati.
          const box = document.getElementById('verdetto-live');
          if (box && pianoLive && !pianoLive.nonFattibile) {
            box.innerHTML = verdettoHtml(
              verdettoLive(val, pianoLive, statoSquadra(squadre[0]), mercatoLive?.get(apertaRiga))
            );
          }
          if (pCur) {
            const r = chiPuoRilanciare(pCur.ruolo, val);
            const qEl = document.getElementById('radar-quota');
            const msgEl = document.getElementById('radar-messaggio');
            const listEl = document.getElementById('radar-rivali-list');
            if (qEl) qEl.textContent = val;
            if (msgEl) {
              msgEl.textContent = r.count === 0 ? "Nessun rivale puo' piu' rilanciare!" : \`\${r.count} avversari capaci di rilanciare\`;
              msgEl.className = \`text-[11px] \${r.count <= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}\`;
            }
            if (listEl) {
              listEl.innerHTML = r.inCorsa.map(x => \`<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1">
                \${esc(x.nome)}: <strong class="text-white font-bold">\${x.maxBid}</strong> max
                <span class="text-[9px] \${x.pressureClass}">(\${x.pressureBadge})</span>
              </span>\`).join('')
                + r.eliminati.map(x => \`<span class="px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-600 line-through" title="\${x.motivo}">\${esc(x.nome)}</span>\`).join('');
            }
          }
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); assegna(apertaRiga, 0); }
          if (e.key === 'Escape') { apertaRiga = null; render(); }
        });
      }
    }

    function focalizzaPrezzo() {
      const input = document.getElementById('prezzo-input');
      if (input) { input.focus(); input.select(); }
    }

    function renderRosa() {
      const el = document.getElementById('rosa');
      const rosa = squadre[0].rosa;
      if (!rosa.length) {
        el.innerHTML = '<div class="text-center py-8 text-slate-500 text-xs italic">Nessun calciatore in rosa.</div>';
        return;
      }
      const ordine = { P: 0, D: 1, C: 2, A: 3 };
      const indicizzata = rosa.map((a, j) => ({ ...a, j, p: PER_ID.get(a.id) }))
        .sort((x, y) => ordine[x.p.ruolo] - ordine[y.p.ruolo] || y.pagato - x.pagato);

      el.innerHTML = indicizzata.map(({ p, pagato, j }) => \`
        <div class="flex justify-between items-center bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-xs gap-2">
          <div class="flex items-center gap-2 truncate">
            <span class="font-black \${COLORE_RUOLO[p.ruolo]}">\${p.ruolo}</span>
            <span class="font-semibold text-slate-200 truncate">\${esc(p.nome)}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" data-mia-correggi="\${j}" class="text-emerald-400 font-black tabular-nums hover:text-emerald-300" title="Correggi il prezzo">\${pagato} cr</button>
            <button type="button" data-mia-rimuovi="\${j}" class="text-slate-500 hover:text-rose-400" title="Rimuovi" aria-label="Rimuovi \${esc(p.nome)}"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </div>\`).join('');

      for (const b of document.querySelectorAll('[data-mia-rimuovi]')) {
        b.addEventListener('click', () => { squadre[0].rosa.splice(Number(b.dataset.miaRimuovi), 1); render(); });
      }
      for (const b of document.querySelectorAll('[data-mia-correggi]')) {
        b.addEventListener('click', () => correggi(0, Number(b.dataset.miaCorreggi)));
      }
    }

    function renderSimulatore(miaRosaPlayers, bestXI, modRes) {
      const selettore = document.getElementById('moduli-selettore');
      selettore.innerHTML = MODULI_SUPPORTATI.map(m => {
        const sim = simulaFormazione(miaRosaPlayers, m);
        const attivo = m === moduloScelto;
        return \`
          <button type="button" data-sel-modulo="\${m}" class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border \${
            attivo ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'}">
            <span>\${m}</span>
            <span class="text-[10px] tabular-nums \${attivo ? 'text-indigo-200' : 'text-slate-500'}">\${sim.puntiTotali}</span>
          </button>\`;
      }).join('');

      for (const b of selettore.querySelectorAll('[data-sel-modulo]')) {
        b.addEventListener('click', () => {
          moduloScelto = b.dataset.selModulo;
          render();
        });
      }

      const simCorrente = simulaFormazione(miaRosaPlayers, moduloScelto);
      document.getElementById('sim-modulo-nome').textContent = moduloScelto;
      document.getElementById('sim-punti-totali').textContent = \`\${simCorrente.puntiTotali} pt attesi\`;

      const renderCartaGiocatore = p => {
        const val = VALUTAZIONI_CACHE.get(p.id) ?? { puntiMatch: 5.5 };
        const bonusPortaInviolata = p.ruolo === 'P' && val.puntiReteInviolata > 0
          ? \`<span class="text-[8px] text-sky-400 tabular-nums">RI +\${val.puntiReteInviolata}</span>\`
          : '';
        return \`
          <div class="flex flex-col items-center p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md min-w-[76px] sm:min-w-[90px] text-center backdrop-blur-sm">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black \${BG_RUOLO[p.ruolo]} \${COLORE_RUOLO[p.ruolo]} mb-0.5">\${p.ruolo}</span>
            <span class="text-[11px] font-bold text-white truncate max-w-[80px] sm:max-w-[95px]">\${esc(p.nome)}</span>
            <span class="text-[9px] text-emerald-400 font-black tabular-nums">\${val.puntiMatch} pt</span>
            \${bonusPortaInviolata}
          </div>\`;
      };

      const renderVuoto = r => \`
        <div class="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 min-w-[76px] sm:min-w-[90px] text-center">
          <span class="text-[10px] font-bold text-slate-600">\${r} vuoto</span>
        </div>\`;

      const [nD, nC, nA] = moduloScelto.split('-').map(Number);
      const fillSlot = (arr, targetCount, r) => {
        const out = [...arr.map(renderCartaGiocatore)];
        while (out.length < targetCount) out.push(renderVuoto(r));
        return out.join('');
      };

      document.getElementById('campo-attacco').innerHTML = fillSlot(simCorrente.dettaglioRuoli.A, nA, 'A');
      document.getElementById('campo-centrocampo').innerHTML = fillSlot(simCorrente.dettaglioRuoli.C, nC, 'C');
      document.getElementById('campo-difesa').innerHTML = fillSlot(simCorrente.dettaglioRuoli.D, nD, 'D');
      document.getElementById('campo-portiere').innerHTML = fillSlot(simCorrente.dettaglioRuoli.P, 1, 'P');

      const panchinaEl = document.getElementById('sim-panchina');
      if (simCorrente.panchina.length) {
        panchinaEl.innerHTML = simCorrente.panchina.map((p, idx) => {
          const val = VALUTAZIONI_CACHE.get(p.id) ?? { puntiMatch: 5.5 };
          return \`
            <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-[9px] text-slate-500 font-bold">\${idx + 1}°</span>
                <span class="font-black \${COLORE_RUOLO[p.ruolo]} text-[10px]">\${p.ruolo}</span>
                <span class="text-slate-300 font-semibold truncate">\${esc(p.nome)}</span>
              </div>
              <span class="text-[10px] text-emerald-400 font-bold tabular-nums">\${val.puntiMatch}</span>
            </div>\`;
        }).join('');
      } else {
        panchinaEl.innerHTML = '<p class="text-[11px] text-slate-500 col-span-full italic">Nessun cambio disponibile in panchina.</p>';
      }

      document.getElementById('sim-mod-bonus').textContent = (simCorrente.modBonus > 0 ? '+' : '') + simCorrente.modBonus.toFixed(2) + ' pt';
      const modCorrente = simCorrente.mod;
      document.getElementById('sim-mod-mv').textContent = modCorrente.mvMedia > 0 ? \`\${modCorrente.mvMedia.toFixed(2)} (Scaglione +\${modCorrente.scaglioneBase} pt)\` : '0.00';
      document.getElementById('sim-mod-tot-stagione').textContent = \`~\${Math.round(simCorrente.modBonus * 38)} pt totali\`;

      const modConsiglio = document.getElementById('sim-mod-consiglio');
      if (!regole.modificatoreAttivo) {
        modConsiglio.innerHTML = '<span class="text-slate-400 font-bold"><i class="fa-solid fa-toggle-off mr-1"></i> Modificatore non previsto:</span> attivalo dalle Impostazioni se il regolamento della lega lo applica.';
      } else if (nD < PROFILO_LEGA.modificatore.difensoriMinimi) {
        modConsiglio.innerHTML = \`<span class="text-amber-400 font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Modificatore disattivato:</span> il modulo \${moduloScelto} schiera solo \${nD} difensori. Passa a un modulo a \${PROFILO_LEGA.modificatore.difensoriMinimi} difensori (es. 4-3-3 o 4-4-2) per sbloccare fino a +6 punti a giornata.\`;
      } else if (modCorrente.bonusAtteso >= 1.5) {
        modConsiglio.innerHTML = \`<span class="text-emerald-400 font-bold"><i class="fa-solid fa-circle-check mr-1"></i> Difesa Top da Modificatore:</span> stai producendo +\${modCorrente.bonusAtteso} pt medi a giornata (~+\${modCorrente.stagionale} pt all'anno).\`;
      } else {
        modConsiglio.innerHTML = \`<span class="text-sky-400 font-bold"><i class="fa-solid fa-circle-info mr-1"></i> Potenziale di crescita:</span> la tua difesa genera +\${modCorrente.bonusAtteso} pt/giornata. Investire su un centrale affidabile aumenta la probabilita' di scaglioni alti.\`;
      }

      const livelloCop = simCorrente.coperturaPct >= 85 ? 'Alta' : simCorrente.coperturaPct >= 65 ? 'Media' : 'Bassa';
      document.getElementById('sim-copertura-pct').textContent = \`\${simCorrente.coperturaPct}/100 (\${livelloCop})\`;
      document.getElementById('sim-copertura-bar').style.width = \`\${simCorrente.coperturaPct}%\`;
      document.getElementById('sim-copertura-nota').textContent = simCorrente.titolariCompleti
        ? 'Rosa completa per questo modulo con rischio voto minimo.'
        : \`Attenzione: ti mancano \${11 - simCorrente.titolari.length} titolari per completare l'undici.\`;

      document.getElementById('sim-confronto-moduli').innerHTML = MODULI_SUPPORTATI.map(m => {
        const s = simulaFormazione(miaRosaPlayers, m);
        const isBest = s.puntiTotali === bestXI.puntiTotali;
        return \`
          <div class="flex justify-between items-center bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
            <span class="font-bold \${isBest ? 'text-amber-400' : 'text-slate-300'}">\${m} \${isBest ? '<span class="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded ml-1">BEST</span>' : ''}</span>
            <span class="text-slate-400 tabular-nums">\${s.puntiTotali} pt <span class="text-[10px] text-slate-500">(\${s.modBonus > 0 ? '+' + s.modBonus + ' mod' : 'no mod'})</span></span>
          </div>\`;
      }).join('');
    }

    function renderStrategia(asseg, st, mercato, scarsita, mvarMap, nomine, semaforiMap, marginiMap, and) {
      const formatNomina = (p, tipo, titolo, icona, badgeClass) => {
        if (!p) return '<div class="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-500 text-xs">Nessun suggerimento.</div>';
        const val = VALUTAZIONI_CACHE.get(p.id);
        const mkt = mercato.get(p.id) ?? { atteso: 1 };
        const marg = (val?.valorePuro ?? p.fvm) - mkt.atteso;
        return \`
          <div class="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2 flex flex-col justify-between">
            <div>
              <span class="text-[10px] uppercase font-black px-2 py-0.5 rounded \${badgeClass} inline-flex items-center gap-1">
                \${icona} \${titolo}
              </span>
              <div class="mt-2 flex items-baseline justify-between">
                <h4 class="font-bold text-white text-sm truncate">\${esc(p.nome)}</h4>
                <span class="font-black \${COLORE_RUOLO[p.ruolo]} text-xs">\${p.ruolo}</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5">\${esc(p.squadra)} • \${NOMI_FASCIA[p.fascia]}</p>
            </div>
            <div class="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
              <div class="flex justify-between text-slate-400">
                <span>Valore reale: <strong class="text-white">\${val?.valorePuro}</strong></span>
                <span>Stima asta: <strong class="text-slate-300">\${mkt.atteso}</strong></span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Margine: <strong class="\${marg >= 0 ? 'text-emerald-400' : 'text-rose-400'}">\${marg >= 0 ? '+' : ''}\${marg} cr</strong></span>
                <span class="text-slate-500">MVAR +\${mvarMap.get(p.id)?.diffSeason ?? 0}pt</span>
              </div>
              <button type="button" onclick="apriAstaGiocatore(\${p.id})" class="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-2 rounded-lg text-xs transition">
                Chiama ora
              </button>
            </div>
          </div>\`;
      };

      document.getElementById('consigli-nomine').innerHTML = [
        formatNomina(nomine.targetFurtivo, 'target', 'Target per Te', '<i class="fa-solid fa-crosshairs"></i>', 'bg-emerald-950 text-emerald-300 border border-emerald-700'),
        formatNomina(nomine.targetTrappola, 'trappola', 'Drena-Budget', '<i class="fa-solid fa-bomb"></i>', 'bg-rose-950 text-rose-300 border border-rose-700'),
        formatNomina(nomine.targetSgonfia, 'sgonfia', 'Sgonfia-Tier', '<i class="fa-solid fa-hourglass-half"></i>', 'bg-amber-950 text-amber-300 border border-amber-700')
      ].join('');

      document.getElementById('radar-scarsita').innerHTML = RUOLI.map(r => {
        const sc = scarsita[r] ?? { score: 50, slots: 0, validi: 0 };
        const coloreBarra = sc.score >= 75 ? 'bg-rose-500' : sc.score >= 50 ? 'bg-amber-500' : 'bg-emerald-500';
        return \`
          <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold \${COLORE_RUOLO[r]}">\${NOMI_RUOLO[r]} (\${r})</span>
              <span class="font-black text-white tabular-nums">\${sc.score}%</span>
            </div>
            <div class="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
              <div class="\${coloreBarra} h-full transition-all duration-500" style="width: \${sc.score}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-slate-500 tabular-nums">
              <span>\${sc.slots} slot da coprire</span>
              <span>\${sc.validi} titolari disponibili</span>
            </div>
          </div>\`;
      }).join('');

      document.getElementById('matrice-avversari-body').innerHTML = squadre.map((sq, idx) => {
        const s = statoSquadra(sq);
        const io = idx === 0;

        const urgenza = r => {
          const m = s.mancanti[r];
          if (m === 0) return '<span class="text-[10px] font-bold text-slate-600">0</span>';
          const quota = (m * and[r].medio) / Math.max(1, s.residuo);
          const pScore = Math.min(100, Math.max(10, Math.round(100 * quota * (m / TARGET[r]))));
          if (pScore >= 60 || (r === 'A' && m >= 3)) return \`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-400 border border-rose-800/60" title="Pressione alta: \${pScore}%">\${m} 🔥</span>\`;
          if (pScore >= 35 || m >= 4) return \`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60" title="Pressione media: \${pScore}%">\${m} 🟡</span>\`;
          return \`<span class="text-[10px] font-semibold text-slate-400" title="Pressione bassa: \${pScore}%">\${m} 🟢</span>\`;
        };

        const statoStrategico = s.mancantiTot === 0
          ? '<span class="text-slate-600">Rosa Completa</span>'
          : s.residuo < s.mancantiTot * 3
            ? '<span class="text-rose-400 font-bold">In Emergenza Crediti</span>'
            : s.mancanti.A >= 3
              ? '<span class="text-amber-400 font-semibold">Cerca Bomber (Alta Pressione)</span>'
              : '<span class="text-emerald-400">In Piena Corsa</span>';

        return \`
          <tr class="\${io ? 'bg-indigo-950/30' : 'hover:bg-slate-800/30 transition'}">
            <td class="py-2.5 pr-3 font-semibold \${io ? 'text-indigo-300' : 'text-slate-200'}">\${esc(sq.nome)}</td>
            <td class="py-2.5 px-2 text-right font-black tabular-nums \${s.residuo <= 20 ? 'text-rose-400' : 'text-emerald-400'}">\${s.residuo}</td>
            <td class="py-2.5 px-2 text-right tabular-nums text-slate-400">\${s.mancantiTot}</td>
            <td class="py-2.5 px-2 text-center tabular-nums">\${urgenza('P')}</td>
            <td class="py-2.5 px-2 text-center tabular-nums">\${urgenza('D')}</td>
            <td class="py-2.5 px-2 text-center tabular-nums">\${urgenza('C')}</td>
            <td class="py-2.5 px-2 text-center tabular-nums">\${urgenza('A')}</td>
            <td class="py-2.5 px-2 text-right font-black tabular-nums text-white">\${s.capienza}</td>
            <td class="py-2.5 pl-2 text-[11px]">\${statoStrategico}</td>
          </tr>\`;
      }).join('');
    }

    function renderFormazioni(asseg) {
      const q = document.getElementById('ricerca-formazioni').value.trim().toLowerCase();

      const carte = Object.entries(SQUADRE_INFO).map(([cod, info]) => {
        const fonte = FORMAZIONI_PROBABILI.squadre[cod];
        const titolari = (fonte?.titolari ?? []).map(voce => ({ p: PER_ID.get(voce.id), probabilita: voce.probabilita })).filter(voce => voce.p);
        const alternative = (fonte?.alternative ?? []).map(voce => ({ p: PER_ID.get(voce.id), probabilita: voce.probabilita })).filter(voce => voce.p);

        if (q && !info.squadra.toLowerCase().includes(q) && ![...titolari, ...alternative].some(voce => voce.p.nome.toLowerCase().includes(q))) return '';

        const liberi = titolari.filter(voce => !asseg.has(voce.p.id)).length;
        const dataFonte = FORMAZIONI_PROBABILI.aggiornatoIl ? new Date(FORMAZIONI_PROBABILI.aggiornatoIl).toLocaleDateString('it-IT') : 'oggi';

        return \`
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div class="flex justify-between items-start gap-2 mb-1">
              <h3 class="font-bold text-white">\${esc(info.squadra)}</h3>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 shrink-0">\${esc(fonte?.modulo || info.modulo)}</span>
            </div>
            <p class="text-[11px] text-slate-400">\${esc(info.allenatore)}</p>
            <p class="text-[10px] text-violet-300 mt-1">Probabile XI Fantacalcio.it · \${dataFonte}</p>
            <p class="text-[10px] mt-2 \${liberi ? 'text-emerald-400' : 'text-slate-600'}">\${liberi} titolari ancora liberi su \${titolari.length}</p>
            <div class="mt-2 space-y-1">
              \${titolari.length ? titolari.map(({ p, probabilita }) => {
                const preso = asseg.get(p.id);
                return \`<div class="flex justify-between items-center gap-2 text-[11px] \${preso ? 'opacity-50' : ''}">
                  <span class="truncate"><span class="font-black \${COLORE_RUOLO[p.ruolo]}">\${p.ruolo}</span> \${esc(p.nome)}</span>
                  <span class="shrink-0 \${preso ? 'text-slate-500' : probabilita >= 80 ? 'text-emerald-400' : 'text-amber-300'}">\${probabilita}% · \${preso ? esc(squadre[preso.squadra].nome) : 'libero'}</span>
                </div>\`;
              }).join('')
                : '<p class="text-[11px] text-slate-600 italic">Formazione tipo non ancora raccolta per questa squadra.</p>'}
            </div>
            \${alternative.length ? \`<div class="mt-3 pt-2 border-t border-slate-800"><p class="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Ballottaggi / alternative</p><p class="text-[11px] text-slate-300 leading-relaxed">\${alternative.map(({ p, probabilita }) => \`<span class="inline-block mr-2 \${probabilita >= 50 ? 'text-amber-300' : 'text-slate-400'}">\${esc(p.nome)} \${probabilita}%</span>\`).join('')}</p></div>\` : ''}
          </div>\`;
      }).join('');

      document.getElementById('formazioni').innerHTML =
        carte || '<p class="text-xs text-slate-500 col-span-full">Nessuna squadra corrisponde alla ricerca.</p>';
    }

    function initGriglia() {
      const opzioni = SQUADRE_LISTA.map(s => \`<option value="\${s}">\${s}</option>\`).join('');
      for (const id of ['griglia-a', 'griglia-b']) {
        const sel = document.getElementById(id);
        sel.innerHTML = opzioni;
        sel.addEventListener('change', calcolaGriglia);
      }
      document.getElementById('griglia-a').value = 'INT';
      document.getElementById('griglia-b').value = 'MIL';
      calcolaGriglia();
    }

    function giudizioIncrocio(v) {
      if (v === 0) return 'Alternanza perfetta: mai entrambe fuori casa';
      if (v <= 5) return 'Incrocio eccellente';
      if (v <= 7) return 'Incrocio buono';
      return 'Incrocio sconsigliato';
    }

    function calcolaGriglia() {
      const a = document.getElementById('griglia-a').value;
      const b = document.getElementById('griglia-b').value;
      const valore = document.getElementById('griglia-valore');
      const testo = document.getElementById('griglia-testo');

      if (a === b) {
        valore.textContent = '—';
        testo.textContent = 'Seleziona due squadre diverse';
        return;
      }
      const v = GRIGLIA[a]?.[b];
      valore.textContent = v ?? '—';
      testo.textContent = giudizioIncrocio(v);
    }

    function renderCoppie(asseg) {
      const blocchi = PLAYERS.filter(p => p.ruolo === 'P' && !asseg.has(p.id));
      const coppie = [];
      for (let i = 0; i < blocchi.length; i++) {
        for (let j = i + 1; j < blocchi.length; j++) {
          const v = GRIGLIA[blocchi[i].cod]?.[blocchi[j].cod];
          if (v === undefined) continue;
          coppie.push({ a: blocchi[i], b: blocchi[j], v, valore: blocchi[i].fvm + blocchi[j].fvm });
        }
      }
      coppie.sort((x, y) => x.v - y.v || x.valore - y.valore);

      document.getElementById('coppie-consigliate').innerHTML = coppie.slice(0, 6).map(c => \`
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex justify-between items-center gap-2">
          <span class="text-[11px] text-slate-300 truncate">\${c.a.cod} + \${c.b.cod}
            <span class="block text-[10px] text-slate-500">\${giudizioIncrocio(c.v)}</span>
          </span>
          <span class="text-lg font-black tabular-nums \${c.v === 0 ? 'text-emerald-400' : c.v <= 5 ? 'text-amber-400' : 'text-slate-400'}">\${c.v}</span>
        </div>\`).join('') || '<p class="text-[11px] text-slate-500">Nessun blocco ancora libero.</p>';
    }

    function assegna(id, iSquadra) {
      const p = PER_ID.get(id);
      const sq = squadre[iSquadra];
      if (!p || !sq) return;

      const st = statoSquadra(sq);
      if (st.mancanti[p.ruolo] <= 0) {
        alert(\`\${sq.nome} ha gia' tutti e \${TARGET[p.ruolo]} gli slot di \${NOMI_RUOLO[p.ruolo].toLowerCase()}.\`);
        return;
      }

      const input = document.getElementById('prezzo-input');
      const pagato = Number.parseInt(input ? input.value : '', 10);
      if (!Number.isFinite(pagato) || pagato < 1) {
        alert('Inserisci un prezzo valido: minimo 1 credito.');
        return;
      }
      if (pagato > st.capienza) {
        alert(\`\${pagato} cr sforano la capienza di \${sq.nome}: \${st.capienza} cr.\\nNon resterebbe 1 credito per ciascuno degli altri \${st.mancantiTot - 1} slot.\`);
        return;
      }

      sq.rosa.push({ id, pagato });
      apertaRiga = null;
      render();
    }

    function correggi(iSquadra, iRosa) {
      const sq = squadre[iSquadra];
      const a = sq?.rosa[iRosa];
      if (!a) return;

      const p = PER_ID.get(a.id);
      const risposta = prompt(\`Prezzo corretto per \${p.nome} (\${sq.nome}):\`, a.pagato);
      if (risposta === null) return;
      const nuovo = Number.parseInt(risposta, 10);
      if (!Number.isFinite(nuovo) || nuovo < 1) {
        alert('Inserisci un prezzo valido: minimo 1 credito.');
        return;
      }

      const precedente = a.pagato;
      a.pagato = 0;
      const capienza = statoSquadra(sq).capienza;
      if (nuovo > capienza) {
        a.pagato = precedente;
        alert(\`\${nuovo} cr sforano la capienza di \${sq.nome}: \${capienza} cr.\`);
        return;
      }
      a.pagato = nuovo;
      render();
    }

    function azzeraAsta() {
      if (!confirm("Vuoi azzerare tutta l'asta? Le rose di tutti i partecipanti tornano vuote.")) return;
      squadre = nuoveSquadre(squadre.length);
      apertaSquadra = null;
      apertaRiga = null;
      document.getElementById('nomi-squadre').dataset.n = '';
      render();
    }

    function mostraPannello(id) {
      document.getElementById(id).classList.toggle('hidden');
    }

    function apriAstaGiocatore(id) {
      vaiAllaVista('asta');
      apertaRiga = id;
      render();
      setTimeout(focalizzaPrezzo, 50);
    }

    const VISTE = [
      { k: 'asta', et: 'Asta', i: '<i class="fa-solid fa-gavel mr-1.5"></i>' },
      { k: 'simulatore', et: 'Simulatore & Best XI', i: '<i class="fa-solid fa-futbol mr-1.5"></i>' },
      { k: 'strategia', et: 'Strategia & Avversari', i: '<i class="fa-solid fa-crosshairs mr-1.5"></i>' },
      { k: 'formazioni', et: 'Formazioni tipo', i: '<i class="fa-solid fa-clipboard-list mr-1.5"></i>' },
      { k: 'griglia', et: 'Griglia portieri', i: '<i class="fa-solid fa-shield-halved mr-1.5"></i>' }
    ];

    function initNavigazione() {
      document.getElementById('navigazione').innerHTML = VISTE.map(v =>
        \`<button type="button" data-vista="\${v.k}" class="btn-vista px-4 py-2 rounded-xl text-xs font-bold border transition">
          \${v.i}\${v.et}
        </button>\`).join('');

      for (const b of document.querySelectorAll('.btn-vista')) {
        b.addEventListener('click', () => { vaiAllaVista(b.dataset.vista); });
      }
      aggiornaVista();
    }

    function vaiAllaVista(v) {
      vista = v;
      aggiornaVista();
    }

    function aggiornaVista() {
      for (const v of VISTE) {
        const el = document.getElementById('vista-' + v.k);
        if (el) el.classList.toggle('hidden', v.k !== vista);
      }
      for (const b of document.querySelectorAll('.btn-vista')) {
        const attivo = b.dataset.vista === vista;
        b.classList.toggle('bg-indigo-600', attivo);
        b.classList.toggle('text-white', attivo);
        b.classList.toggle('border-indigo-500', attivo);
        b.classList.toggle('bg-slate-900', !attivo);
        b.classList.toggle('text-slate-400', !attivo);
        b.classList.toggle('border-slate-800', !attivo);
      }
    }

    initNavigazione();
    initGriglia();
    initFiltri();

    document.getElementById('ricerca').addEventListener('input', render);
    document.getElementById('ricerca-formazioni').addEventListener('input', render);
    document.getElementById('solo-liberi').addEventListener('change', e => {
      soloLiberi = e.target.checked;
      render();
    });
    document.getElementById('solo-affari').addEventListener('change', e => {
      soloAffari = e.target.checked;
      render();
    });

    document.getElementById('n-squadre').addEventListener('input', e => {
      const v = Math.round(Number(e.target.value));
      if (!Number.isFinite(v) || v < 2 || v > 20) return;
      if (v < squadre.length) {
        const perse = squadre.slice(v).reduce((s, sq) => s + sq.rosa.length, 0);
        if (perse && !confirm(\`Riducendo a \${v} partecipanti perdi \${perse} assegnazioni. Procedo?\`)) {
          e.target.value = squadre.length;
          return;
        }
        squadre = squadre.slice(0, v);
      } else {
        while (squadre.length < v) squadre.push({ nome: \`Squadra \${squadre.length + 1}\`, rosa: [] });
      }
      apertaSquadra = null;
      document.getElementById('nomi-squadre').dataset.n = '';
      inizializzaValutazioni();
      render();
    });

    document.getElementById('bonus-rete-inviolata').addEventListener('change', e => {
      const bonus = Number(e.target.value);
      if (!Number.isFinite(bonus) || bonus < 0 || bonus > 3) {
        e.target.value = regole.bonusReteInviolata;
        return;
      }
      regole.bonusReteInviolata = bonus;
      inizializzaValutazioni();
      render();
    });

    document.getElementById('modificatore-attivo').addEventListener('change', e => {
      regole.modificatoreAttivo = e.target.checked;
      render();
    });

    render();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), htmlContent);
console.log('index.html generato con successo.');
