#!/usr/bin/env node
/*
 * Scarica il quadro aggiornato delle probabili formazioni da Fantacalcio.it e
 * salva soltanto dati strutturati (modulo, nomi, ruoli e percentuali), non il
 * testo dell'articolo. Il listone resta sempre data/listone.tsv.
 *
 * Uso: npm run fonti
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const URL = 'https://www.fantacalcio.it/probabili-formazioni-serie-a';
const OUT = path.join(ROOT, 'data/fonti/formazioni-fantacalcio.json');

async function main() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const squadre = await page.evaluate(() => {
      const leggiGiocatori = ul => [...ul.querySelectorAll('li.player-item')].map(li => ({
        nome: li.querySelector('.player-name span')?.textContent.trim() ?? '',
        ruolo: li.querySelector('.role')?.dataset.value?.toUpperCase() ?? '',
        probabilita: Number((li.querySelector('.progress-value')?.textContent ?? '0').replace('%', '').trim()) || 0
      })).filter(p => p.nome);

      return [...document.querySelectorAll('.team-card')].map(card => ({
        squadra: card.querySelector('.team-name')?.textContent.trim() ?? '',
        modulo: card.querySelector('.team-formation')?.textContent.trim() ?? '',
        titolari: leggiGiocatori(card.querySelector('.player-list.starters')),
        panchina: leggiGiocatori(card.querySelector('.player-list.reserves'))
      })).filter(s => s.squadra && s.titolari.length === 11);
    });
    if (squadre.length !== 20) throw new Error(`attese 20 squadre, ricevute ${squadre.length}`);

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify({
      fonte: 'Fantacalcio.it — Probabili formazioni Serie A',
      url: URL,
      aggiornatoIl: new Date().toISOString(),
      squadre
    }, null, 2) + '\n');
    console.log(`formazioni aggiornate: ${squadre.length} squadre -> ${OUT}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
