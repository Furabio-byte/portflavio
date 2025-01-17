document.addEventListener('DOMContentLoaded', () => {
  // Gestione smooth scroll
  const easeInOutSextuple = (t) => {
    return t < 0.5
      ? 32 * t * t * t * t * t * t
      : 1 - Math.pow(-2 * t + 2, 6) / 2;
  };

  const smoothScroll = (targetElement) => {
    const startPosition = window.pageYOffset;
    const targetPosition = targetElement.getBoundingClientRect().top + startPosition;
    const distance = targetPosition - startPosition;
    
    const baseDuration = 2500;
    const minDuration = 2000;
    const maxDuration = 3000;
    
    let start = null;

    const adjustedDuration = Math.min(
      maxDuration,
      Math.max(
        minDuration,
        Math.abs(distance) / 500 * baseDuration
      )
    );

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / adjustedDuration, 1);
      
      const easing = easeInOutSextuple(percentage);
      const currentPosition = startPosition + (distance * easing);
      
      window.scrollTo({
        top: currentPosition,
        behavior: 'auto'
      });

      if (progress < adjustedDuration) {
        window.requestAnimationFrame(step);
      } else {
        window.scrollTo({
          top: targetPosition,
          behavior: 'auto'
        });
      }
    };

    window.requestAnimationFrame(step);
  };

  // Gestione incremento annuale dei numeri
  class ContatoreSchede {
    constructor() {
      this.numeriElements = document.querySelectorAll('.scheda .numero');
      
      if (!this.numeriElements.length) {
        console.warn('Nessun elemento con classe .numero trovato nelle schede');
        return;
      }

      this.numeri = {};
      this.inizializzaContatori();
    }

    getNumeroIniziale(element) {
      const numero = parseInt(element.textContent, 10);
      return isNaN(numero) ? 0 : numero;
    }

    calcolaTempoAlProssimoAnno() {
      const oggi = new Date();
      const prossimoAnno = new Date(oggi.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      return prossimoAnno - oggi;
    }

    incrementaContatori() {
      this.numeriElements.forEach((element, index) => {
        const numeroAttuale = this.getNumeroIniziale(element);
        const nuovoNumero = numeroAttuale + 1;
        element.textContent = nuovoNumero;
        localStorage.setItem(`numero_scheda_${index}`, nuovoNumero);
      });
    }

    inizializzaContatori() {
      this.numeriElements.forEach((element, index) => {
        const valoreSalvato = localStorage.getItem(`numero_scheda_${index}`);
        if (valoreSalvato !== null) {
          element.textContent = valoreSalvato;
        }
      });

      const tempoRimanente = this.calcolaTempoAlProssimoAnno();

      setTimeout(() => {
        this.incrementaContatori();
        setInterval(() => {
          this.incrementaContatori();
        }, 365 * 24 * 60 * 60 * 1000);
      }, tempoRimanente);
    }
  }

  // Gestione scroll per desktop
  let isScrolling = false;
  
  // Handler per dispositivi con hover
  const handleClick = function(e) {
    e.preventDefault();
    
    if (isScrolling) return;
    
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      isScrolling = true;
      smoothScroll(targetElement);
      history.pushState(null, '', targetId);
      
      setTimeout(() => {
        isScrolling = false;
      }, 3500);
    }
  };

  // Gestione touch per mobile con sequenza
  let activeScheda = null;
  const schedaLinks = document.querySelectorAll('.scheda-link');

  const handleTouch = (e) => {
    e.preventDefault();
    const currentScheda = e.currentTarget;
    
    // Se la scheda non è attiva, mostra solo la parola
    if (!currentScheda.classList.contains('active')) {
      // Disattiva qualsiasi altra scheda attiva
      if (activeScheda) {
        activeScheda.classList.remove('active');
      }
      currentScheda.classList.add('active');
      activeScheda = currentScheda;
    } else {
      // Se la scheda è già attiva, esegui lo scroll
      const targetId = currentScheda.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement && !isScrolling) {
        isScrolling = true;
        smoothScroll(targetElement);
        history.pushState(null, '', targetId);
        
        setTimeout(() => {
          isScrolling = false;
          // Rimuovi active dopo lo scroll
          currentScheda.classList.remove('active');
          activeScheda = null;
        }, 3500);
      }
    }
  };

  // Applica i listener appropriati in base al dispositivo
  if (window.matchMedia('(hover: none)').matches) {
    // Dispositivi touch
    schedaLinks.forEach(link => {
      link.addEventListener('touchstart', handleTouch);
    });

    // Chiudi la scheda attiva quando si tocca fuori
    document.addEventListener('touchstart', (e) => {
      if (activeScheda && !activeScheda.contains(e.target)) {
        activeScheda.classList.remove('active');
        activeScheda = null;
      }
    }, { passive: true });
  } else {
    // Dispositivi desktop
    schedaLinks.forEach(link => {
      link.addEventListener('click', handleClick);
    });
  }

  // Inizializza i contatori
  new ContatoreSchede();
});