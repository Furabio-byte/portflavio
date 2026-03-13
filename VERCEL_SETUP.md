# Vercel Contact Setup

## Obiettivo
Il sito resta statico su GitHub Pages. L'invio email passa da un backend Vercel, cosi nessuna chiave segreta finisce nel repository o nel frontend.

## File gia preparati
- `api/contact.js`
- `vercel.json`
- `js/site-config.js`
- aggiornamento del form in `index.html` e `js/script.js`

## Come funziona
1. Il form chiama l'endpoint Vercel `/api/contact`
2. La function serverless valida i dati
3. La function invia la mail tramite Resend
4. Le chiavi restano solo nelle Environment Variables di Vercel

## Passi da fare
1. Crea un account su Vercel
2. Importa questo repository su Vercel
3. Crea un account su Resend
4. Verifica il dominio o il mittente che userai in Resend
5. In Vercel aggiungi queste variabili ambiente:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `ALLOWED_ORIGIN`

## Valori consigliati
- `CONTACT_TO_EMAIL` = `info@portflavio.it`
- `CONTACT_FROM_EMAIL` = un mittente verificato su Resend, per esempio `noreply@portflavio.it`
- `ALLOWED_ORIGIN` = `https://www.portflavio.it`

## Ultimo passaggio importante
Quando Vercel ti da il dominio del progetto, aggiorna:

- `js/site-config.js`

Sostituisci:

- `https://REPLACE_WITH_YOUR_VERCEL_DOMAIN/api/contact`

con qualcosa tipo:

- `https://portflavio-contact.vercel.app/api/contact`

## Sicurezza
- Nessuna chiave va committata su GitHub
- Il frontend non conosce la chiave Resend
- Il destinatario email e fissato lato server
- Il campo honeypot blocca una parte dello spam

## Nota
Finche non inserisci il dominio Vercel reale in `js/site-config.js`, il form mostrera un messaggio di configurazione incompleta invece di inviare.
