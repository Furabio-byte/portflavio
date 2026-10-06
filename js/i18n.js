window.PortflavioApp = window.PortflavioApp || {};

// Italiano e inglese. I contenuti delle stazioni hanno la traduzione nell'HTML (data-en),
// i testi dell'interfaccia generati dal JavaScript sono in questo dizionario.
(function registerLinguaModule(app) {
  const EN = {
    // mappa e pannello
    'Portfolio personale di Flavio': "Flavio's personal portfolio",
    'Tabellone delle linee': 'Line departure board',
    'Stato del servizio': 'Service status',
    'Servizio regolare': 'Good service',
    'Lavori in corso': 'Works in progress',
    'In arrivo': 'Coming soon',
    'Disponibile': 'Available',
    'Orari': 'Timetable',
    'Esplorazione': 'Exploration',
    'Stazioni visitate': 'Stations visited',
    'Hai visitato tutte le stazioni.': 'You have visited every station.',
    'Visitate di recente': 'Recently visited',
    'Competenze': 'Skills',
    'Ogni linea è una sezione. Tocca una stazione per aprirla, isola una linea dalla legenda, cerca una competenza o calcola un percorso tra due stazioni.': 'Each line is a section. Tap a station to open it, isolate a line from the legend, search for a skill or plan a route between two stations.',
    'Il tuo biglietto': 'Your ticket',
    'Scarica il poster': 'Download the poster',
    'Stazione precedente': 'Previous station',
    'Stazione successiva': 'Next station',
    'Caso di studio': 'Case study',
    'Uscite': 'Exits',
    'Coincidenze': 'Connections',
    'Parti da qui': 'Start from here',
    'Condividi stazione': 'Share station',
    'Link alla stazione copiato': 'Station link copied',
    'Nessuna stazione': 'No stations found',
    'Linea': 'Line',
    // comandi
    'Viaggio guidato': 'Guided tour',
    'Riprendi il viaggio': 'Resume the tour',
    'Metti in pausa il viaggio': 'Pause the tour',
    'Il tuo biglietto (CV da stampare)': 'Your ticket (printable CV)',
    'Scarica il poster della mappa': 'Download the map poster',
    'Calcola percorso': 'Plan a route',
    'Torna alla mappa': 'Back to the map',
    'Vista elenco': 'List view',
    'Tema chiaro': 'Light theme',
    'Tema scuro': 'Dark theme',
    'Tema automatico (scuro di notte)': 'Automatic theme (dark at night)',
    'Tema automatico: scuro dalle 20 alle 7': 'Automatic theme: dark from 8 pm to 7 am',
    'Attiva suoni': 'Turn sounds on',
    'Disattiva suoni': 'Turn sounds off',
    'Suoni attivati': 'Sounds on',
    'Suoni disattivati': 'Sounds off',
    'Mappa intera': 'Whole map',
    'Schermo intero': 'Full screen',
    'Esci da schermo intero': 'Exit full screen',
    'Azzera stazioni visitate': 'Reset visited stations',
    'Esplorazione azzerata': 'Exploration reset',
    'Torna a PORT': 'Back to PORT',
    'Scorciatoie': 'Shortcuts',
    // percorso
    'Percorso': 'Route',
    'DA': 'FROM',
    'A': 'TO',
    'Inverti partenza e arrivo': 'Swap start and destination',
    'Scegli due stazioni diverse.': 'Choose two different stations.',
    'fermata': 'stop',
    'fermate': 'stops',
    'cambio a PORT': 'change at PORT',
    'nessun cambio': 'no changes',
    'Cambio:': 'Change:',
    // viaggio
    'Prossima:': 'Next:',
    'Riprendi': 'Resume',
    'Pausa': 'Pause',
    'Viaggio in pausa: premi ▶ per riprendere': 'Tour paused: press ▶ to resume',
    // biglietto e poster
    'Biglietto': 'Ticket',
    'Passeggero': 'Passenger',
    'Linee': 'Lines',
    'Stazioni': 'Stations',
    'Validità': 'Valid',
    'Esperienze': 'Experience',
    'Certificazioni': 'Certifications',
    'Progetti': 'Projects',
    'Contatti': 'Contacts',
    'Email': 'Email',
    'Mappa': 'Map',
    'In costruzione': 'Under construction',
    'Inquadra per aprire la mappa': 'Scan to open the map',
    'Valido su tutte le linee': 'Valid on all lines',
    'Preparo il poster...': 'Preparing the poster...',
    'Poster scaricato': 'Poster downloaded',
    'Il poster non è disponibile su questo browser': 'The poster is not available in this browser',
    // modulo contatti
    'Inserisci la tua email prima di inviare.': 'Enter your email before sending.',
    'Inserisci un indirizzo email valido.': 'Enter a valid email address.',
    'Scrivi un messaggio prima di inviare.': 'Write a message before sending.',
    "Scrivi un messaggio un po' più dettagliato.": 'Write a slightly more detailed message.',
    'Scrivi un messaggio più dettagliato.': 'Write a more detailed message.',
    'Il servizio di contatto non è disponibile in questo momento.': 'The contact service is not available right now.',
    'Invio in corso...': 'Sending...',
    'Invio...': 'Sending...',
    'Invia': 'Send',
    'Scrivi prima la parte iniziale della tua email.': 'Type the first part of your email first.',
    'Portfolio condiviso.': 'Portfolio shared.',
    'Link copiato negli appunti.': 'Link copied to the clipboard.',
    'La condivisione non è disponibile su questo browser.': 'Sharing is not available in this browser.',
    'La condivisione non è riuscita.': 'Sharing failed.',
    'Messaggio inviato. Ti risponderò al più presto.': "Message sent. I'll get back to you as soon as possible.",
    'Non è stato possibile inviare il messaggio. Riprova.': 'The message could not be sent. Please try again.',
    'Invio non consentito da questa pagina.': 'Sending is not allowed from this page.',
    'Hai effettuato troppi tentativi. Riprova più tardi.': 'Too many attempts. Please try again later.',
    "C'è stato un problema temporaneo nell'invio. Riprova tra poco.": 'There was a temporary problem sending. Please try again shortly.',
    'Qualcosa è andato storto. Riprova tra qualche istante.': 'Something went wrong. Please try again in a moment.'
  };

  let lingua = null;
  try { lingua = localStorage.getItem('pf-lingua'); } catch (error) { lingua = null; }
  if (lingua !== 'it' && lingua !== 'en') {
    lingua = (navigator.language || 'it').toLowerCase().startsWith('it') ? 'it' : 'en';
  }

  const ATTRIBUTI = ['placeholder', 'title', 'aria-label'];

  // ogni elemento con data-en ricorda il suo testo italiano e lo scambia con quello inglese
  function applicaLingua() {
    document.documentElement.lang = lingua;
    document.querySelectorAll('[data-en]').forEach((el) => {
      if (!('it' in el.dataset)) el.dataset.it = el.textContent;
      el.textContent = lingua === 'en' ? el.dataset.en : el.dataset.it;
    });
    ATTRIBUTI.forEach((attributo) => {
      document.querySelectorAll(`[data-en-${attributo}]`).forEach((el) => {
        const salvato = `data-it-${attributo}`;
        if (!el.hasAttribute(salvato)) el.setAttribute(salvato, el.getAttribute(attributo) || '');
        el.setAttribute(attributo, lingua === 'en' ? el.getAttribute(`data-en-${attributo}`) : el.getAttribute(salvato));
      });
    });
  }

  app.lingua = () => lingua;
  app.t = (testo) => (lingua === 'en' && EN[testo] ? EN[testo] : testo);
  app.applicaLingua = applicaLingua;
  app.impostaLingua = (nuova) => {
    lingua = nuova === 'en' ? 'en' : 'it';
    try { localStorage.setItem('pf-lingua', lingua); } catch (error) { /* solo per questa visita */ }
    applicaLingua();
    document.dispatchEvent(new CustomEvent('pf:lingua', { detail: lingua }));
  };
}(window.PortflavioApp));
