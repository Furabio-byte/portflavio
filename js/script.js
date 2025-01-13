// Seleziona l'elemento del numero
const numeroElement = document.getElementById('numero-text');

// Ottieni il numero iniziale dal contenuto HTML
let numero = parseInt(numeroElement.textContent);

// Funzione per calcolare il tempo fino al prossimo 1 gennaio
function calcolaTempoAlProssimoAnno() {
  const oggi = new Date(); // Data corrente
  const prossimoAnno = oggi.getFullYear() + 1; // Anno successivo
  const primoGennaio = new Date(prossimoAnno, 0, 1, 0, 0, 0); // 1 gennaio ore 00:00

  return primoGennaio - oggi; // Tempo in millisecondi fino al 1 gennaio
}

// Funzione per incrementare il numero
function incrementaContatore() {
  numero++; // Incrementa il numero
  numeroElement.textContent = numero; // Aggiorna il numero nell'HTML
}

// Calcola il tempo fino al prossimo primo dell'anno
const tempoRimanente = 5000;

// Imposta un timer per incrementare il numero a mezzanotte del prossimo 1 gennaio
setTimeout(() => {
  incrementaContatore();

  // Dopo il primo incremento, imposta un intervallo di 1 anno per i successivi
  setInterval(incrementaContatore, 365 * 24 * 60 * 60 * 1000); // 365 giorni in millisecondi
}, tempoRimanente);