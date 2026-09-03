#!/usr/bin/env python3
"""
Estrae da Fantalgoritmo i due dati che non avevamo: il prezzo medio delle aste
reali e le statistiche vere delle ultime due stagioni.

I file sorgente sono un prodotto a pagamento e NON stanno nel repository: vanno
passati come argomenti. Lo script produce due TSV in data/, che sono gli unici
file versionati.

Uso:
    python3 tools/import-fantalgoritmo.py \
        "Fantalgoritmo_500_FM.xlsx" "FantaAlgoritmo_PRO.xlsb"

Dipendenze:  pip install openpyxl pyxlsb
"""

import sys
import os
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PREZZI = os.path.join(ROOT, 'data', 'fantalgoritmo.tsv')
OUT_STORICO = os.path.join(ROOT, 'data', 'storico.tsv')

# Le quattro schede hanno intestazioni quasi uguali ma non identiche: il prezzo
# suggerito si chiama "P. stat. Max" per portieri e difensori e "P. stat. A"
# per centrocampisti e attaccanti, e la colonna delle note editoriali cambia
# nome ("Scelta" / "Valore"). Qui vengono ricondotte a un nome solo.
ALIAS = {
    'P. stat. Max': 'prezzoStat',
    'P. stat. A': 'prezzoStat',
    'P. Med. Aste': 'prezzoMedioAste',
    'P. Gol M.': 'prezzoGolMax',
    'Qt. Fanta': 'qt',
    'IA': 'ia',
    'Fascia': 'fascia',
    'SOS': 'sos',
    'Note': 'note',
    'Scelta': 'valore',
    'Valore': 'valore',
    'FV': 'fv',
    'PG': 'pg',
    'Media': 'media',
    'F.Med': 'fmedia',
    'Gol': 'gol',
    'Ass.': 'assist',
    'Amm.': 'amm',
    'Gol subiti': 'golSubiti',
    'Accoppiata squadra migliore': 'accoppiata',
    'Accoppiata Sq. F.-D.': 'accoppiata',
}

CAMPI = ['nome', 'squadra', 'ruolo', 'qt', 'ia', 'fascia', 'note', 'valore', 'sos',
         'prezzoMedioAste', 'prezzoStat', 'prezzoGolMax', 'fv', 'pg', 'media',
         'fmedia', 'gol', 'assist', 'amm', 'golSubiti', 'accoppiata']

RUOLO_SCHEDA = {'Portieri': 'P', 'Difensori': 'D', 'Centrocampisti': 'C', 'Attaccanti': 'A'}


def pulisci(v):
    """Un valore da mettere in un TSV: niente tab, niente a capo, niente rumore."""
    if v is None:
        return ''
    if isinstance(v, float):
        # I numeri arrivano con la coda binaria di Excel: due decimali bastano
        # e basta a tutto quello che ci facciamo.
        if v != v or v in (float('inf'), float('-inf')):
            return ''
        return f'{v:.2f}'.rstrip('0').rstrip('.')
    s = str(v).strip().replace('\t', ' ').replace('\n', ' ')
    # "In aggiorn." e "ND" sono buchi dichiarati, non dati.
    return '' if s in ('ND', 'In aggiorn.', '0. N.D', '-') else s


def normalizza(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return ''.join(c for c in s.lower() if c.isalnum())


def leggi_prezzi(percorso):
    import openpyxl
    wb = openpyxl.load_workbook(percorso, read_only=True, data_only=True)
    righe = []
    for scheda, ruolo_default in RUOLO_SCHEDA.items():
        ws = wb[scheda]
        tutte = list(ws.iter_rows(values_only=True))
        intestazione = [str(c).strip() if c is not None else '' for c in tutte[0]]
        for r in tutte[1:]:
            if not r[1]:
                continue
            voce = {c: '' for c in CAMPI}
            voce['ruolo'] = ruolo_default
            for col, valore in zip(intestazione, r):
                if col == 'Nome':
                    voce['nome'] = pulisci(valore)
                elif col == 'Squadra':
                    voce['squadra'] = pulisci(valore)
                elif col in ALIAS:
                    voce[ALIAS[col]] = pulisci(valore)
            if voce['nome']:
                righe.append(voce)
    return righe


def leggi_storico(percorso):
    """
    Le due schede storiche portano due stagioni per giocatore: le colonne senza
    suffisso sono la piu' recente, quelle con suffisso numerico la precedente.
    Teniamo solo cio' che serve a stimare rendimento e presenze.
    """
    from pyxlsb import open_workbook
    righe = []
    with open_workbook(percorso) as wb:
        for scheda in ('Storico Gioc.', 'Storico Portieri'):
            with wb.get_sheet(scheda) as ws:
                intestazione = None
                for riga in ws.rows():
                    celle = {c.c: c.v for c in riga}
                    valori = [celle.get(i) for i in range(max(celle) + 1)] if celle else []
                    if intestazione is None:
                        intestazione = [str(v).strip() if v is not None else '' for v in valori]
                        continue
                    d = dict(zip(intestazione, valori))
                    nome = pulisci(d.get('Nome'))
                    if not nome:
                        continue
                    righe.append({
                        'nome': nome,
                        'squadra': pulisci(d.get('Squadra')),
                        'ruolo': pulisci(d.get('R')),
                        'pg1': pulisci(d.get('Pg 2020')),
                        'mv1': pulisci(d.get('Mv')),
                        'fm1': pulisci(d.get('Mf')),
                        'gol1': pulisci(d.get('Gf')),
                        'assist1': pulisci(d.get('Ass')),
                        'amm1': pulisci(d.get('Amm')),
                        'gs1': pulisci(d.get('Gs')),
                        'pg2': pulisci(d.get('Pg 2019')),
                        'mv2': pulisci(d.get('Mv2')),
                        'fm2': pulisci(d.get('Mf3')),
                        'gol2': pulisci(d.get('Gf4')),
                        'gs2': pulisci(d.get('Gs5')),
                    })
    # Le due schede si sovrappongono sui portieri: teniamo la voce piu' ricca.
    per_chiave = {}
    for r in righe:
        k = (normalizza(r['nome']), normalizza(r['squadra']))
        vecchia = per_chiave.get(k)
        if vecchia is None or sum(1 for v in r.values() if v) > sum(1 for v in vecchia.values() if v):
            per_chiave[k] = r
    return list(per_chiave.values())


def scrivi(percorso, campi, righe):
    with open(percorso, 'w', encoding='utf-8') as f:
        f.write('\t'.join(campi) + '\n')
        for r in righe:
            f.write('\t'.join(str(r.get(c, '')) for c in campi) + '\n')
    print(f'{os.path.relpath(percorso, ROOT)}: {len(righe)} righe')


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    prezzi = leggi_prezzi(sys.argv[1])
    conta = {}
    for r in prezzi:
        conta[r['ruolo']] = conta.get(r['ruolo'], 0) + 1
    scrivi(OUT_PREZZI, CAMPI, prezzi)
    print('   per ruolo: ' + ', '.join(f'{k}:{v}' for k, v in sorted(conta.items())))
    con_prezzo = sum(1 for r in prezzi if r['prezzoMedioAste'])
    print(f'   con prezzo medio aste: {con_prezzo}/{len(prezzi)}')

    storico = leggi_storico(sys.argv[2])
    campi_storico = ['nome', 'squadra', 'ruolo', 'pg1', 'mv1', 'fm1', 'gol1',
                     'assist1', 'amm1', 'gs1', 'pg2', 'mv2', 'fm2', 'gol2', 'gs2']
    scrivi(OUT_STORICO, campi_storico, storico)


if __name__ == '__main__':
    main()
