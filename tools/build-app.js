const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLAYERS_FILE = path.join(ROOT, 'data/players.generated.js');
const playersData = fs.readFileSync(PLAYERS_FILE, 'utf8');

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
            Serie A 2026/27 • 500 crediti • <span id="intestazione-lega"></span>
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
          <div id="m-top-nomination" class="hidden sm:inline-flex items-center gap-1.5 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded-md text-indigo-300">
            <i class="fa-solid fa-bolt text-amber-400"></i>
            <span>Chiamata consigliata: <strong class="text-white font-bold" id="m-top-nom-nome">-</strong> (<span id="m-top-nom-dettaglio" class="text-emerald-400 font-semibold">+0 cr</span>)</span>
          </div>
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
      </div>
    </header>

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
                Solo raccomandati (🟢 COMPRA)
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
                  <th scope="col" class="p-2.5 text-center">Valutazione & Consiglio</th>
                  <th scope="col" class="p-2.5 text-center">Prezzi & Margine</th>
                  <th scope="col" class="p-2.5 text-right">Assegna</th>
                </tr>
              </thead>
              <tbody id="tabella" class="divide-y divide-slate-800/60"></tbody>
            </table>
          </div>
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
                <span class="text-xs text-slate-400">Probabilita' 11 a Voto:</span>
                <span id="sim-copertura-pct" class="text-base font-black text-emerald-400 tabular-nums">100%</span>
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
${playersData}

    /* ====================== COSTANTI & MAPPE ====================== */

    const BUDGET = 500;
    const RUOLI = ['P', 'D', 'C', 'A'];
    const TARGET = { P: 3, D: 8, C: 8, A: 6 };
    const SLOT_TOT = Object.values(TARGET).reduce((s, n) => s + n, 0);
    const NOMI_RUOLO = { P: 'Portieri', D: 'Difensori', C: 'Centrocampisti', A: 'Attaccanti' };
    const PRIORI = { P: 7, D: 19, C: 32, A: 42 };
    const N_SQUADRE_DEFAULT = 8;

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

    function caricaStato() {
      let s;
      try { s = JSON.parse(store.getItem(CHIAVE)); } catch (e) { s = null; }
      if (!s || !Array.isArray(s.squadre) || !s.squadre.length) return nuoveSquadre(N_SQUADRE_DEFAULT);
      for (const sq of s.squadre) sq.rosa = (sq.rosa ?? []).filter(a => PER_ID.has(a.id));
      return s.squadre;
    }

    let squadre = caricaStato();
    let filtroRuolo = 'ALL';
    let filtroTag = 'ALL';
    let soloLiberi = true;
    let soloAffari = false;
    let vista = 'asta';
    let apertaSquadra = null;
    let apertaRiga = null;
    let moduloScelto = '3-4-3';

    function salva() {
      store.setItem(CHIAVE, JSON.stringify({ squadre }));
    }

    /* ====================== MOTORE MATEMATICO DEL VALORE ====================== */

    const VALUTAZIONI_CACHE = new Map();

    function inizializzaValutazioni() {
      VALUTAZIONI_CACHE.clear();
      for (const p of PLAYERS) {
        let tit = 0.50;
        if (p.tag.includes('TITOLARE')) tit = 0.90;
        else if (p.tag.includes('SCOMMESSA')) tit = 0.65;
        else if (p.tag.includes('LOWCOST')) tit = 0.25;
        if (p.tag.includes('RISCHIO')) tit *= 0.65;

        let mv = 6.00;
        let bonusGol = 0;
        let bonusAssist = 0;
        let malus = 0;

        if (p.ruolo === 'P') {
          mv = p.tag.includes('TOP') ? 6.22 : p.fascia === 2 ? 6.10 : p.fascia === 3 ? 5.95 : 5.80;
          const golSubiti = p.tag.includes('TOP') ? 0.90 : p.fascia <= 3 ? 1.35 : 1.75;
          malus = golSubiti;
          bonusGol = p.tag.includes('RIGORISTA') ? 0.05 : 0;
        } else if (p.ruolo === 'D') {
          if (p.tag.includes('MODIFICATORE')) mv = 6.25 + (p.fvm / 200) * 0.20;
          else if (p.tag.includes('TOP')) mv = 6.15 + (p.fvm / 200) * 0.15;
          else if (p.tag.includes('TITOLARE')) mv = 5.98 + (p.quot / 20) * 0.10;
          else mv = 5.75 + (p.quot / 20) * 0.10;

          if (p.fvm >= 80) { bonusGol = 0.12; bonusAssist = 0.15; }
          else if (p.fvm >= 40) { bonusGol = 0.06; bonusAssist = 0.08; }
          else if (p.tag.includes('RIGORISTA')) { bonusGol = 0.08; bonusAssist = 0.03; }
          else if (p.fascia <= 3) { bonusGol = 0.03; bonusAssist = 0.04; }
          else { bonusGol = 0.01; bonusAssist = 0.01; }
        } else if (p.ruolo === 'C') {
          mv = p.tag.includes('TOP') ? 6.28 : p.tag.includes('TITOLARE') ? 6.05 : 5.85;
          if (p.fvm >= 100) { bonusGol = 0.26; bonusAssist = 0.16; }
          else if (p.fvm >= 45) { bonusGol = 0.14; bonusAssist = 0.10; }
          else if (p.fascia <= 3) { bonusGol = 0.06; bonusAssist = 0.05; }
          else { bonusGol = 0.02; bonusAssist = 0.02; }
          if (p.tag.includes('RIGORISTA')) bonusGol += 0.08;
        } else if (p.ruolo === 'A') {
          mv = p.tag.includes('TOP') ? 6.30 : p.tag.includes('TITOLARE') ? 6.02 : 5.80;
          if (p.fvm >= 150) { bonusGol = 0.52; bonusAssist = 0.14; }
          else if (p.fvm >= 80) { bonusGol = 0.34; bonusAssist = 0.10; }
          else if (p.fvm >= 40) { bonusGol = 0.20; bonusAssist = 0.06; }
          else if (p.fascia <= 3) { bonusGol = 0.10; bonusAssist = 0.04; }
          else { bonusGol = 0.04; bonusAssist = 0.02; }
          if (p.tag.includes('RIGORISTA')) bonusGol += 0.10;
        }

        const fma = Number((mv + (bonusGol * 3) + (bonusAssist * 1) - malus).toFixed(2));
        const puntiMatch = fma;
        const presenzeAttese = Math.round(38 * tit);
        const puntiStagione = Number((presenzeAttese * fma).toFixed(1));

        let baseCrediti = 1;
        if (p.ruolo === 'A') {
          baseCrediti = p.fvm >= 150 ? 110 + (p.fvm - 150) * 0.45 : p.fvm >= 80 ? 55 + (p.fvm - 80) * 0.70 : p.fvm >= 30 ? 20 + (p.fvm - 30) * 0.70 : Math.max(1, Math.round(p.fvm * 0.6));
        } else if (p.ruolo === 'C') {
          baseCrediti = p.fvm >= 100 ? 60 + (p.fvm - 100) * 0.35 : p.fvm >= 45 ? 25 + (p.fvm - 45) * 0.60 : p.fvm >= 20 ? 10 + (p.fvm - 20) * 0.60 : Math.max(1, Math.round(p.fvm * 0.45));
        } else if (p.ruolo === 'D') {
          baseCrediti = p.fvm >= 100 ? 50 + (p.fvm - 100) * 0.25 : p.fvm >= 45 ? 24 + (p.fvm - 45) * 0.50 : p.fvm >= 20 ? 10 + (p.fvm - 20) * 0.50 : Math.max(1, Math.round(p.fvm * 0.45));
        } else if (p.ruolo === 'P') {
          baseCrediti = p.fvm >= 50 ? 25 + (p.fvm - 50) * 0.40 : p.fvm >= 25 ? 12 + (p.fvm - 25) * 0.50 : Math.max(1, Math.round(p.fvm * 0.40));
        }

        const valorePuro = Math.max(1, Math.round(baseCrediti));

        VALUTAZIONI_CACHE.set(p.id, {
          tit, mv: Number(mv.toFixed(2)), fma, puntiMatch, presenzeAttese, puntiStagione, valorePuro
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
      for (const [id, a] of asseg) {
        const r = PER_ID.get(id).ruolo;
        speso[r] += a.pagato;
        quanti[r]++;
      }

      const budgetLega = BUDGET * squadre.length;
      const out = {};
      for (const r of RUOLI) {
        const slotTotali = TARGET[r] * squadre.length;
        const priori = (budgetLega * PRIORI[r] / 100) / slotTotali;
        const osservato = quanti[r] ? speso[r] / quanti[r] : null;
        const w = Math.min(1, quanti[r] / Math.max(4, slotTotali * 0.25));
        out[r] = {
          medio: osservato === null ? priori : w * osservato + (1 - w) * priori,
          osservato, quanti: quanti[r], speso: speso[r], priori
        };
      }
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

    function tettoAvversari(ruolo) {
      const migliore = { cr: 0, nome: null, quanti: 0 };
      for (let i = 1; i < squadre.length; i++) {
        const c = capienzaRuolo(statoSquadra(squadre[i]), ruolo);
        if (c <= 0) continue;
        migliore.quanti++;
        if (c > migliore.cr) { migliore.cr = c; migliore.nome = squadre[i].nome; }
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

        for (const p of liberi) {
          const atteso = contesi.has(p.id) ? 1 + (p.fvm / somma) * monte : 1;
          mercato.set(p.id, {
            atteso: Math.max(1, Math.round(atteso)),
            min: Math.max(1, Math.round(atteso * 0.8)),
            max: Math.max(1, Math.round(atteso * 1.25))
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

      for (const r of RUOLI) {
        const liberi = PLAYERS.filter(p => p.ruolo === r && !asseg.has(p.id)).sort((a, b) => b.fvm - a.fvm);
        const slots = slotRimasti[r];
        const validi = liberi.filter(p => p.fascia <= 3 || p.tag.includes('TITOLARE')).length;
        
        const sc = slots === 0 ? 0 : Math.min(100, Math.max(0, Math.round(100 * (1 - (validi - slots) / Math.max(1, slots)))));
        scarsita[r] = { score: sc, slots, validi, totLiberi: liberi.length };

        const baseIndex = Math.min(liberi.length - 1, Math.max(0, slots - 1));
        const basePlayer = liberi[baseIndex];
        const baseVal = basePlayer ? (VALUTAZIONI_CACHE.get(basePlayer.id)?.puntiMatch ?? 5.5) : 5.0;
        baselinePunti[r] = baseVal;

        for (const p of liberi) {
          const val = VALUTAZIONI_CACHE.get(p.id);
          const diffMatch = Math.max(0, (val?.puntiMatch ?? 5.5) - baseVal);
          const diffSeason = Number((diffMatch * (val?.presenzeAttese ?? 30)).toFixed(1));
          mvarMap.set(p.id, { diffMatch: Number(diffMatch.toFixed(2)), diffSeason });
        }
      }

      return { scarsita, mvarMap, baselinePunti };
    }

    function calcolaPrezziEMioMax(st, mercato, asseg, and) {
      const prezzi = new Map();
      const mioMaxMap = new Map();
      const marginiMap = new Map();
      const semaforiMap = new Map();

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

        const q = quantoPosso(st, r, and);
        const prezzoConsigliato = Math.max(1, Math.min(mkt.atteso, st.capienza));
        prezzi.set(p.id, prezzoConsigliato);

        const pesoBudget = Math.min(1.5, Math.max(0.6, (st.residuo / BUDGET) * (SLOT_TOT / Math.max(1, st.mancantiTot))));
        let rawMax = trueVal * pesoBudget;
        if (p.tag.includes('TOP') && st.mancanti[r] >= 1) rawMax *= 1.15;
        const mioMax = Math.max(1, Math.min(st.capienza, Math.round(rawMax)));
        mioMaxMap.set(p.id, mioMax);

        const margine = trueVal - mkt.atteso;
        marginiMap.set(p.id, margine);

        let sem = 'ATTENDI';
        if (mkt.atteso > st.capienza || (p.tag.includes('RISCHIO') && margine < 0)) {
          sem = 'LASCIA';
        } else if (margine >= 4 && mioMax >= mkt.atteso) {
          sem = 'COMPRA';
        } else if (margine <= -5) {
          sem = 'LASCIA';
        }
        semaforiMap.set(p.id, sem);
      }

      return { prezzi, mioMaxMap, marginiMap, semaforiMap };
    }

    function calcolaModificatoreSquadra(giocatoriDettaglio) {
      const portieri = giocatoriDettaglio.filter(p => p.ruolo === 'P');
      const difensori = giocatoriDettaglio.filter(p => p.ruolo === 'D').sort((a, b) => {
        const va = VALUTAZIONI_CACHE.get(a.id)?.mv ?? 6.0;
        const vb = VALUTAZIONI_CACHE.get(b.id)?.mv ?? 6.0;
        return vb - va;
      });

      if (difensori.length < 3 || !portieri.length) {
        return { bonusAtteso: 0, mvMedia: 0, stagionale: 0, topDif: difensori.slice(0, 3) };
      }

      const gkMv = VALUTAZIONI_CACHE.get(portieri[0].id)?.mv ?? 6.0;
      const top3Mv = difensori.slice(0, 3).map(d => VALUTAZIONI_CACHE.get(d.id)?.mv ?? 6.0);
      const media = (gkMv + top3Mv.reduce((s, v) => s + v, 0)) / 4;

      let bonus = 0;
      if (media >= 7.00) bonus = 6.0;
      else if (media >= 6.75) bonus = 4.0;
      else if (media >= 6.50) bonus = 3.0;
      else if (media >= 6.25) bonus = 2.0;
      else if (media >= 6.00) bonus = 1.0;

      let bonusContinuo = 0;
      if (media >= 6.40) bonusContinuo = 2.2 + (media - 6.40) * 4.5;
      else if (media >= 6.15) bonusContinuo = 1.1 + (media - 6.15) * 4.4;
      else if (media >= 5.90) bonusContinuo = 0.35 + (media - 5.90) * 3.0;
      else bonusContinuo = Math.max(0, (media - 5.5) * 0.8);

      const bonusFinale = Number(bonusContinuo.toFixed(2));
      return {
        bonusAtteso: bonusFinale,
        mvMedia: Number(media.toFixed(2)),
        stagionale: Math.round(bonusFinale * 38),
        topDif: difensori.slice(0, 3)
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

      let modBonus = 0;
      if (nStrD >= 4) {
        const modRes = calcolaModificatoreSquadra(titolari);
        modBonus = modRes.bonusAtteso;
      }

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

      for (let i = 1; i < squadre.length; i++) {
        const sq = squadre[i];
        const st = statoSquadra(sq);
        const cap = capienzaRuolo(st, ruolo);
        if (cap >= prezzoOfferta + 1 && st.mancanti[ruolo] > 0) {
          inCorsa.push({ idx: i, nome: sq.nome, maxBid: cap, residuo: st.residuo, mancanti: st.mancanti[ruolo] });
        } else {
          eliminati.push({ idx: i, nome: sq.nome, maxBid: cap, residuo: st.residuo, motivo: st.mancanti[ruolo] === 0 ? 'reparto pieno' : \`budget max \${cap} cr\` });
        }
      }

      inCorsa.sort((a, b) => b.maxBid - a.maxBid);
      return { inCorsa, eliminati, count: inCorsa.length };
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
      const { prezzi, mioMaxMap, marginiMap, semaforiMap } = calcolaPrezziEMioMax(st, mercato, asseg, and);
      const { scarsita, mvarMap } = calcolaMVAR_e_Scarsita(asseg);

      const miaRosaPlayers = squadre[0].rosa.map(a => PER_ID.get(a.id)).filter(Boolean);
      const bestXI = trovaBestXI(miaRosaPlayers);
      const modRes = calcolaModificatoreSquadra(miaRosaPlayers);
      const nomine = generaSuggerimentiNomine(asseg, st, mercato, semaforiMap, marginiMap);

      renderMetriche(st, and, bestXI, modRes, nomine);
      renderAndamento(st, and);
      renderImpostazioni();
      renderTabellone();
      renderTabella(st, mercato, prezzi, mioMaxMap, marginiMap, semaforiMap, scarsita, mvarMap, asseg, and);
      renderRosa();
      renderSimulatore(miaRosaPlayers, bestXI, modRes);
      renderStrategia(asseg, st, mercato, scarsita, mvarMap, nomine, semaforiMap, marginiMap);
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

      document.getElementById('m-best-xi-score').textContent = bestXI.puntiTotali > 0 ? bestXI.puntiTotali : '0.0';
      document.getElementById('m-best-xi-modulo').textContent = bestXI.modulo;
      document.getElementById('m-mod-expected').textContent = (modRes.bonusAtteso > 0 ? '+' : '') + modRes.bonusAtteso.toFixed(2);

      const nomChip = document.getElementById('m-top-nomination');
      if (nomine.targetFurtivo) {
        nomChip.classList.remove('hidden');
        document.getElementById('m-top-nom-nome').textContent = nomine.targetFurtivo.nome;
        const val = VALUTAZIONI_CACHE.get(nomine.targetFurtivo.id);
        const marg = val ? val.valorePuro - (nomine.targetFurtivo.fvm) : 0;
        document.getElementById('m-top-nom-dettaglio').textContent = (marg >= 0 ? '+' : '') + marg + ' cr';
      } else {
        nomChip.classList.add('hidden');
      }

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
                : \`<span class="block text-slate-600 tabular-nums">osservato \${Math.round(a.osservato)} su \${a.quanti}</span>\`}
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

    function renderImpostazioni() {
      const nSq = document.getElementById('n-squadre');
      if (document.activeElement !== nSq) nSq.value = squadre.length;

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
      { k: 'TOP', et: 'Top 1° Slot', i: '<i class="fa-solid fa-crown mr-1"></i>', c: 'text-amber-300' },
      { k: 'TITOLARE', et: 'Titolari', i: '<i class="fa-solid fa-check mr-1"></i>', c: 'text-slate-300' },
      { k: 'NUOVO', et: 'Nuovi arrivi', i: '<i class="fa-solid fa-plane-arrival mr-1"></i>', c: 'text-violet-300' },
      { k: 'RIGORISTA', et: 'Rigoristi', i: '<i class="fa-solid fa-bullseye mr-1"></i>', c: 'text-emerald-300' },
      { k: 'MODIFICATORE', et: 'Modificatore Difesa', i: '<i class="fa-solid fa-shield-halved mr-1"></i>', c: 'text-sky-300' },
      { k: 'SCOMMESSA', et: 'Scommesse', i: '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i>', c: 'text-indigo-300' },
      { k: 'LOWCOST', et: 'Low Cost 1 cr', i: '<i class="fa-solid fa-coins mr-1"></i>', c: 'text-teal-300' },
      { k: 'RISCHIO', et: 'A Rischio', i: '<i class="fa-solid fa-triangle-exclamation mr-1"></i>', c: 'text-rose-300' }
    ];

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

    function renderTabella(st, mercato, prezzi, mioMaxMap, marginiMap, semaforiMap, scarsita, mvarMap, asseg, and) {
      const q = document.getElementById('ricerca').value.trim().toLowerCase();
      const tetti = Object.fromEntries(RUOLI.map(r => [r, tettoAvversari(r)]));

      const righe = PLAYERS.filter(p => {
        if (soloLiberi && asseg.has(p.id)) return false;
        if (soloAffari && semaforiMap.get(p.id) !== 'COMPRA') return false;
        if (filtroRuolo !== 'ALL' && p.ruolo !== filtroRuolo) return false;
        if (filtroTag !== 'ALL' && !p.tag.includes(filtroTag)) return false;
        if (!q) return true;
        return [p.nome, p.squadra, p.nota ?? '', ...(p.blocco ?? []), ...p.mantra, ...p.tag]
          .join(' ').toLowerCase().includes(q);
      });

      document.getElementById('tabella').innerHTML = righe.map(p => {
        const preso = asseg.get(p.id);
        const qCap = quantoPosso(st, p.ruolo, and);
        const avv = tetti[p.ruolo];
        const mkt = mercato.get(p.id) ?? { atteso: 1, min: 1, max: 1 };
        const prezzo = prezzi.get(p.id) ?? 0;
        const val = VALUTAZIONI_CACHE.get(p.id) ?? { valorePuro: p.fvm, mv: 6.0, fma: 6.0 };
        const mioMax = mioMaxMap.get(p.id) ?? 0;
        const margine = marginiMap.get(p.id) ?? 0;
        const semaforo = semaforiMap.get(p.id) ?? 'ATTENDI';
        const mvar = mvarMap.get(p.id) ?? { diffMatch: 0, diffSeason: 0 };
        const scInfo = scarsita[p.ruolo] ?? { score: 50 };

        const mantra = p.mantra.map(m =>
          \`<span class="text-[10px] px-1 py-px rounded bg-slate-800/80 text-slate-400 border border-slate-700/50" title="\${NOMI_MANTRA[m] ?? m}">\${m}</span>\`).join(' ');

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
               <div class="text-[10px] text-slate-400 tabular-nums">
                 <span>Valore: <strong class="text-white font-bold">\${val.valorePuro}</strong></span> •
                 <span>Mio max: <strong class="\${mioMax >= mkt.atteso ? 'text-emerald-400' : 'text-rose-400'} font-bold">\${mioMax}</strong></span>
               </div>
               <div class="flex items-center justify-center gap-2 text-[9px] text-slate-500 tabular-nums">
                 <span title="Marginal Value Above Replacement: fantapunti stagionali rispetto al rimpiazzo">MVAR +\${mvar.diffSeason}pt</span>
                 <span>•</span>
                 <span class="\${scInfo.score >= 75 ? 'text-rose-400 font-bold' : ''}" title="Scarsita del ruolo">Scarsita \${scInfo.score}%</span>
               </div>
             </td>
             <td class="p-2.5 text-center align-top">
               <span class="font-black text-amber-300 text-sm tabular-nums" title="Quanto ti conviene offrire">\${prezzo} cr</span>
               <span class="block text-[10px] text-slate-500 mt-0.5 tabular-nums">mercato \${mkt.min}–\${mkt.max}</span>
               <span class="block text-[10px] font-bold tabular-nums mt-0.5 \${margine >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                 Margine \${margine >= 0 ? '+' : ''}\${margine} cr
               </span>
               \${mkt.min > qCap.tetto
                 ? '<span class="block text-[10px] text-rose-400 mt-0.5">fuori portata</span>'
                 : mkt.min > qCap.medio
                   ? '<span class="block text-[10px] text-amber-400 mt-0.5">dovrai risparmiare altrove</span>'
                   : ''}
               <span class="block text-[9px] text-slate-600 mt-0.5 tabular-nums">\${
                 avv.cr > 0
                   ? \`\${avv.quanti} in corsa, fino a \${avv.cr} (\${esc(avv.nome)})\`
                   : 'nessun rivale puo\\' piu\\' prenderlo'}</span>
             </td>
             <td class="p-2.5 text-right align-top">
               <button type="button" data-apri="\${p.id}" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md transition">Assegna</button>
             </td>\`;

        let radarHtml = '';
        if (apertaRiga === p.id && !preso) {
          const radar = chiPuoRilanciare(p.ruolo, prezzo);
          radarHtml = \`
            <div class="w-full mt-3 pt-2.5 border-t border-slate-800 flex flex-col gap-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-300 flex items-center gap-1.5">
                  <i class="fa-solid fa-crosshairs text-indigo-400"></i> Radar Rilanci a quota <span id="radar-quota" class="text-amber-300 font-black">\${prezzo}</span> cr:
                </span>
                <span id="radar-messaggio" class="text-[11px] \${radar.count <= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}">
                  \${radar.count === 0 ? 'Nessun rivale puo\\' piu\\' rilanciare!' : \`\${radar.count} avversari capaci di rilanciare\`}
                </span>
              </div>
              <div id="radar-rivali-list" class="flex flex-wrap gap-1.5">
                \${radar.inCorsa.map(r => \`<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-300">\${esc(r.nome)}: <strong class="text-white font-bold">\${r.maxBid}</strong> max</span>\`).join('')}
                \${radar.eliminati.map(r => \`<span class="px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-[10px] text-slate-600 line-through" title="\${r.motivo}">\${esc(r.nome)}</span>\`).join('')}
              </div>
            </div>\`;
        }

        const pannello = apertaRiga === p.id && !preso ? \`
          <tr class="bg-slate-950">
            <td colspan="7" class="p-3.5 border border-indigo-900/50 rounded-xl">
              <div class="flex flex-wrap items-end gap-3">
                <label class="text-[10px] uppercase font-semibold text-slate-400">Prezzo pagato
                  <input type="number" id="prezzo-input" min="1" value="\${prezzo}" class="mt-1 block w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-slate-100 tabular-nums focus:outline-none focus:border-indigo-500">
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
                      title="\${puo ? \`capienza \${s.capienza} cr\` : \`ha gia' tutti gli slot \${p.ruolo}\`}">\${esc(sq.nome)}</button>\`;
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
              <p class="flex flex-wrap gap-1">\${p.tag.map(t => \`<span class="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider border \${STILE_TAG[t]}">\${ETICHETTA_TAG[t]}</span>\`).join('')}</p>
              \${p.nota ? \`<p class="text-[11px] text-slate-300 mt-1.5 leading-relaxed">\${esc(p.nota)}</p>\` : ''}
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
          if (pCur) {
            const r = chiPuoRilanciare(pCur.ruolo, val);
            const qEl = document.getElementById('radar-quota');
            const msgEl = document.getElementById('radar-messaggio');
            const listEl = document.getElementById('radar-rivali-list');
            if (qEl) qEl.textContent = val;
            if (msgEl) {
              msgEl.textContent = r.count === 0 ? 'Nessun rivale puo\\' piu\\' rilanciare!' : \`\${r.count} avversari capaci di rilanciare\`;
              msgEl.className = \`text-[11px] \${r.count <= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-400'}\`;
            }
            if (listEl) {
              listEl.innerHTML = r.inCorsa.map(x => \`<span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-slate-300">\${esc(x.nome)}: <strong class="text-white font-bold">\${x.maxBid}</strong> max</span>\`).join('')
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
        return \`
          <div class="flex flex-col items-center p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md min-w-[76px] sm:min-w-[90px] text-center backdrop-blur-sm">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black \${BG_RUOLO[p.ruolo]} \${COLORE_RUOLO[p.ruolo]} mb-0.5">\${p.ruolo}</span>
            <span class="text-[11px] font-bold text-white truncate max-w-[80px] sm:max-w-[95px]">\${esc(p.nome)}</span>
            <span class="text-[9px] text-emerald-400 font-black tabular-nums">\${val.puntiMatch} pt</span>
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
      document.getElementById('sim-mod-mv').textContent = modRes.mvMedia > 0 ? modRes.mvMedia.toFixed(2) : '0.00';
      document.getElementById('sim-mod-tot-stagione').textContent = \`~\${Math.round(simCorrente.modBonus * 38)} pt totali\`;

      const modConsiglio = document.getElementById('sim-mod-consiglio');
      if (nD < 4) {
        modConsiglio.innerHTML = \`<span class="text-amber-400 font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Modificatore disattivato:</span> il modulo \${moduloScelto} schiera solo \${nD} difensori. Passa a un modulo a 4 difensori (es. 4-3-3 o 4-4-2) per sbloccare fino a +6 punti a giornata.\`;
      } else if (modRes.bonusAtteso >= 1.5) {
        modConsiglio.innerHTML = \`<span class="text-emerald-400 font-bold"><i class="fa-solid fa-circle-check mr-1"></i> Difesa Top da Modificatore:</span> stai producendo +\${modRes.bonusAtteso} pt medi a giornata (~+\${modRes.stagionale} pt all'anno, pari a 12 gol di un bomber!).\`;
      } else {
        modConsiglio.innerHTML = \`<span class="text-sky-400 font-bold"><i class="fa-solid fa-circle-info mr-1"></i> Potenziale di crescita:</span> la tua difesa genera +\${modRes.bonusAtteso} pt/giornata. Investire su 1 centrale da 6.3+ di MV puo' raddoppiare il bonus a +1.40 pt.\`;
      }

      document.getElementById('sim-copertura-pct').textContent = \`\${simCorrente.coperturaPct}%\`;
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

    function renderStrategia(asseg, st, mercato, scarsita, mvarMap, nomine, semaforiMap, marginiMap) {
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
          if (r === 'A' && m >= 3) return \`<span class="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-950 text-rose-400 border border-rose-800/60">\${m} 🔴</span>\`;
          if (m >= 4) return \`<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800/60">\${m} 🟡</span>\`;
          return \`<span class="text-[10px] font-semibold text-slate-400">\${m} 🟢</span>\`;
        };

        const statoStrategico = s.mancantiTot === 0
          ? '<span class="text-slate-600">Rosa Completa</span>'
          : s.residuo < s.mancantiTot * 3
            ? '<span class="text-rose-400 font-bold">In Emergenza Crediti</span>'
            : s.mancanti.A >= 3
              ? '<span class="text-amber-400 font-semibold">Cerca Bomber</span>'
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
      const ordine = { P: 0, D: 1, C: 2, A: 3 };

      const carte = Object.entries(SQUADRE_INFO).map(([cod, info]) => {
        const titolari = PLAYERS
          .filter(p => p.cod === cod && p.tag.includes('TITOLARE'))
          .sort((a, b) => ordine[a.ruolo] - ordine[b.ruolo] || b.fvm - a.fvm);

        if (q && !info.squadra.toLowerCase().includes(q) && !titolari.some(p => p.nome.toLowerCase().includes(q))) return '';

        const liberi = titolari.filter(p => !asseg.has(p.id)).length;

        return \`
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div class="flex justify-between items-start gap-2 mb-1">
              <h3 class="font-bold text-white">\${esc(info.squadra)}</h3>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 shrink-0">\${esc(info.modulo)}</span>
            </div>
            <p class="text-[11px] text-slate-400">\${esc(info.allenatore)}</p>
            <p class="text-[11px] text-slate-500 mt-1 leading-relaxed">\${esc(info.nota)}</p>
            <p class="text-[10px] mt-2 \${liberi ? 'text-emerald-400' : 'text-slate-600'}">\${liberi} titolari ancora liberi su \${titolari.length}</p>
            <div class="mt-2 space-y-1">
              \${titolari.length ? titolari.map(p => {
                const preso = asseg.get(p.id);
                return \`<div class="flex justify-between items-center gap-2 text-[11px] \${preso ? 'opacity-50' : ''}">
                  <span class="truncate"><span class="font-black \${COLORE_RUOLO[p.ruolo]}">\${p.ruolo}</span> \${esc(p.nome)}</span>
                  <span class="shrink-0 \${preso ? 'text-slate-500' : 'text-emerald-400'}">\${preso ? esc(squadre[preso.squadra].nome) + ' · ' + preso.pagato : 'libero'}</span>
                </div>\`;
              }).join('')
                : '<p class="text-[11px] text-slate-600 italic">Formazione tipo non ancora raccolta per questa squadra.</p>'}
            </div>
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
      render();
    });

    render();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'index.html'), htmlContent);
console.log('index.html generato con successo.');
