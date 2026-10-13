# Centocelle's Arcade

Gioco arcade in pixel art: Centocelle's contro Aston Pippa. Un bottone, premi quando
la barra passa sul verde. Classifica condivisa per il gruppo del fanta street.

## Cosa c'è dentro

```
index.html       il gioco intero (HTML + Canvas 2D, zero dipendenze)
api/scores.js    la classifica: GET legge la top 20, POST salva un punteggio
icon.png         da aggiungere: icona 512x512 (vedi sotto)
og.png           da aggiungere: anteprima social 1200x630 (facoltativa)
```

Niente build, niente npm install, niente framework. Vercel pubblica i file così come
sono e trasforma `api/scores.js` in una funzione serverless.

## Deploy in 4 passi

**1. Carica il progetto**
Vai su [vercel.com/new](https://vercel.com/new). Puoi trascinare direttamente questa
cartella, oppure collegare un repo GitHub dove l'hai messa. Non cambiare nessuna
impostazione: framework "Other", nessun comando di build.

**2. Aggiungi il database**
Nel progetto appena creato: **Storage → Create Database → Upstash Redis**. Scegli il
piano gratuito e la region europea (Frankfurt). Collegalo al progetto: Vercel scrive
da sola le variabili d'ambiente che servono.

**3. Rilancia il deploy**
**Deployments → ⋯ → Redeploy**. Serve perché le variabili arrivano dopo il primo
deploy.

**4. Manda il link nella chat**
Il gioco funziona anche senza database: in quel caso la classifica resta salvata solo
sul telefono di chi gioca, e lo scrive in chiaro sotto la classifica.

## Come funziona la classifica

Un sorted set di Redis. Ogni nome tiene solo il suo punteggio migliore: `ZADD` con
l'opzione `GT` sovrascrive solo se il nuovo punteggio è più alto.

I punteggi arrivano dal browser, quindi uno che ci mette mano può inventarseli. Per
una chat di amici va bene così; se qualcuno bara, si vede.

## Punteggio

| Azione | Punti |
|---|---|
| GOL (dentro il verde) | 100 |
| CANNONATA (centro pieno) | 250 |
| Vittoria | 500 + 10 per ogni HP rimasto |

La barra accelera e la zona verde si stringe a ogni colpo andato a segno, quindi le
partite lunghe diventano difficili.

## Le immagini da aggiungere

Due file da mettere nella cartella principale, accanto a `index.html`:

- `icon.png` — 512x512, l'icona che si vede nella scheda del browser e quando
  qualcuno salva il sito sulla home del telefono
- `og.png` — 1200x630, l'anteprima che compare quando mandi il link in chat.
  Aggiungi anche `<meta property="og:image" content="/og.png">` nell'head di
  `index.html`

## Modifiche rapide

Tutto è in `index.html`:

- **nome dell'avversario**: cerca `ASTON PIPPA` (compare nell'HTML e nei testi finali)
- **difficoltà**: in `shoot()`, `G.speed` e `G.zone` controllano velocità e ampiezza
  della zona verde
- **colori**: il blocco `:root` in cima al CSS e l'oggetto `C` in cima al JavaScript
