document.addEventListener('DOMContentLoaded', () => {
  // Quando il DOM è completamente caricato, iniziare ad applicare le funzionalità

  /**
   * Gestione Smooth Scroll
   */

  // Funzione di easing: accelera e decelera lo scorrimento per un effetto fluido
  const easeInOutSextuple = (t) => 
    t < 0.5 ? 32 * t ** 6 : 1 - (-2 * t + 2) ** 6 / 2;

  // Funzione per gestire lo scorrimento fluido verso un elemento di destinazione
  const smoothScroll = (targetElement) => {
    const startPosition = window.pageYOffset; // Posizione corrente dello scroll
    const targetPosition = targetElement.getBoundingClientRect().top + startPosition; // Posizione finale dello scroll
    const distance = targetPosition - startPosition; // Distanza da percorrere
    
    // Definizione delle durate di base per l'animazione
    const baseDuration = 2500;
    const minDuration = 2000;
    const maxDuration = 3000;
    
    // Calcola la durata in base alla distanza
    const adjustedDuration = Math.min(
      maxDuration,
      Math.max(minDuration, (Math.abs(distance) / 500) * baseDuration)
    );

    let start = null; // Timestamp di inizio dell'animazione

    // Funzione di aggiornamento del frame per l'animazione dello scorrimento
    const step = (timestamp) => {
      if (!start) start = timestamp; // Inizializza il tempo di inizio
      const progress = timestamp - start; // Calcola il progresso corrente
      const percentage = Math.min(progress / adjustedDuration, 1); // Normalizza il progresso
      
      // Calcola la posizione attuale usando la funzione di easing
      window.scrollTo({
        top: startPosition + (distance * easeInOutSextuple(percentage)),
        behavior: 'auto'
      });

      // Continua l'animazione fino al completamento
      if (progress < adjustedDuration) {
        window.requestAnimationFrame(step);
      } else {
        // Assicura che l'elemento arrivi alla posizione finale
        window.scrollTo({
          top: targetPosition,
          behavior: 'auto'
        });
      }
    };

    // Avvia l'animazione
    window.requestAnimationFrame(step);
  };

  /**
   * Gestione Contatori
   */

  class ContatoreSchede {
    constructor() {
      // Prefissi e chiavi usate per il localStorage
      this.STORAGE_PREFIX = 'portflavio_';
      this.STORAGE_KEY_NUMBERS = `${this.STORAGE_PREFIX}numeri`;
      this.STORAGE_KEY_YEAR = `${this.STORAGE_PREFIX}anno`;
      
      // Seleziona gli elementi con la classe .numero dentro le schede
      this.numeriElements = document.querySelectorAll('.scheda .numero');
      
      // Se non ci sono elementi .numero, mostra un avviso e interrompi
      if (!this.numeriElements.length) {
        console.warn('Nessun elemento con classe .numero trovato nelle schede');
        return;
      }

      // Inizializza i contatori
      this.init();
    }

    // Funzione per inizializzare i dati
    init() {
      const savedData = this.getSavedData(); // Recupera i dati salvati
      const currentYear = new Date().getFullYear(); // Anno corrente
      
      if (!savedData) {
        // Prima inizializzazione se non ci sono dati salvati
        const initialData = {
          year: currentYear,
          numbers: Array.from(this.numeriElements).map(el => ({
            initial: parseInt(el.textContent, 10) || 0, // Numero iniziale dal DOM
            current: parseInt(el.textContent, 10) || 0  // Numero attuale, inizialmente uguale a quello iniziale
          }))
        };
        
        this.saveData(initialData); // Salva i dati iniziali
        this.updateDOM(initialData.numbers); // Aggiorna il DOM con i numeri iniziali
      } else {
        // Incremento annuale dei contatori
        if (currentYear > savedData.year) {
          // Se l'anno è cambiato, incrementa i numeri
          const updatedNumbers = savedData.numbers.map(num => ({
            initial: num.initial,
            current: num.current + 1
          }));
          
          const updatedData = {
            year: currentYear,
            numbers: updatedNumbers
          };
          
          this.saveData(updatedData); // Salva i dati aggiornati
          this.updateDOM(updatedNumbers); // Aggiorna il DOM con i nuovi valori
        } else {
          // Altrimenti, mostra semplicemente i dati salvati
          this.updateDOM(savedData.numbers);
        }
      }
    }

    // Recupera i dati salvati da localStorage
    getSavedData() {
      try {
        const savedNumbers = localStorage.getItem(this.STORAGE_KEY_NUMBERS);
        const savedYear = localStorage.getItem(this.STORAGE_KEY_YEAR);
        
        if (savedNumbers && savedYear) {
          return {
            year: parseInt(savedYear, 10),
            numbers: JSON.parse(savedNumbers)
          };
        }
        return null; // Nessun dato salvato
      } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
        return null;
      }
    }

    // Salva i dati nel localStorage
    saveData(data) {
      try {
        localStorage.setItem(this.STORAGE_KEY_NUMBERS, JSON.stringify(data.numbers));
        localStorage.setItem(this.STORAGE_KEY_YEAR, data.year.toString());
      } catch (error) {
        console.error('Errore nel salvataggio dei dati:', error);
      }
    }

    // Aggiorna i numeri visibili nel DOM
    updateDOM(numbers) {
      this.numeriElements.forEach((element, index) => {
        if (numbers[index]) {
          element.textContent = numbers[index].current; // Aggiorna il contenuto del numero
        }
      });
    }

    // Resetta tutti i dati relativi ai contatori
    static reset() {
      Object.keys(localStorage)
        .filter(key => key.startsWith('portflavio_'))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Gestione degli Eventi UI
   */

  class UIHandler {
    constructor() {
      this.schedaLinks = document.querySelectorAll('.scheda-link'); // Seleziona i link alle schede
      this.isScrolling = false; // Flag per evitare scorrimenti multipli
      this.activeScheda = null; // Scheda attiva
      this.lastTap = 0; // Tempo dell'ultimo tap
      
      this.init(); // Inizializza i listener
    }

    init() {
      if (window.matchMedia('(hover: none)').matches) {
        // Dispositivi touch
        this.initializeTouchDevice();
      } else {
        // Dispositivi desktop
        this.initializeDesktopDevice();
      }
    }

    // Gestisce il click sui dispositivi desktop
    handleClick(e) {
      e.preventDefault(); // Previene il comportamento predefinito del link
      if (this.isScrolling) return; // Evita di avviare uno scroll mentre è in corso
      
      const targetId = e.currentTarget.getAttribute('href'); // ID della destinazione
      const targetElement = document.querySelector(targetId); // Elemento di destinazione
      
      if (targetElement) {
        this.isScrolling = true; // Imposta il flag di scorrimento attivo
        smoothScroll(targetElement); // Avvia lo scroll fluido
        history.pushState(null, '', targetId); // Aggiorna l'URL senza ricaricare la pagina
        
        setTimeout(() => {
          this.isScrolling = false; // Reset del flag dopo il completamento
        }, 3500);
      }
    }

    // Altre funzioni non incluse per brevità...
  }

  // Inizializzazione delle classi
  new ContatoreSchede(); // Inizializza il gestore dei contatori
  new UIHandler(); // Inizializza il gestore UI
});