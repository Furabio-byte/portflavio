document.addEventListener('DOMContentLoaded', () => {
  /**
   * Gestione Smooth Scroll
   */
  const easeInOutSextuple = (t) => 
    t < 0.5 ? 32 * t ** 6 : 1 - (-2 * t + 2) ** 6 / 2;

  const smoothScroll = (targetElement) => {
    const startPosition = window.pageYOffset;
    const targetPosition = targetElement.getBoundingClientRect().top + startPosition;
    const distance = targetPosition - startPosition;
    
    const baseDuration = 2500;
    const minDuration = 2000;
    const maxDuration = 3000;
    
    const adjustedDuration = Math.min(
      maxDuration,
      Math.max(minDuration, (Math.abs(distance) / 500) * baseDuration)
    );

    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / adjustedDuration, 1);
      
      window.scrollTo({
        top: startPosition + (distance * easeInOutSextuple(percentage)),
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

  /**
   * Gestione Contatori
   */
  class ContatoreSchede {
    constructor() {
      // Costanti e configurazione
      this.STORAGE_PREFIX = 'portflavio_';
      this.STORAGE_KEY_NUMBERS = `${this.STORAGE_PREFIX}numeri`;
      this.STORAGE_KEY_YEAR = `${this.STORAGE_PREFIX}anno`;
      
      // Elementi DOM
      this.numeriElements = document.querySelectorAll('.scheda .numero');
      
      if (!this.numeriElements.length) {
        console.warn('Nessun elemento con classe .numero trovato nelle schede');
        return;
      }

      this.init();
    }

    init() {
      const savedData = this.getSavedData();
      const currentYear = new Date().getFullYear();
      
      if (!savedData) {
        // Prima inizializzazione
        const initialData = {
          year: currentYear,
          numbers: Array.from(this.numeriElements).map(el => ({
            initial: parseInt(el.textContent, 10) || 0,
            current: parseInt(el.textContent, 10) || 0
          }))
        };
        
        this.saveData(initialData);
        this.updateDOM(initialData.numbers);
      } else {
        // Gestione incremento annuale
        if (currentYear > savedData.year) {
          const updatedNumbers = savedData.numbers.map(num => ({
            initial: num.initial,
            current: num.current + 1
          }));
          
          const updatedData = {
            year: currentYear,
            numbers: updatedNumbers
          };
          
          this.saveData(updatedData);
          this.updateDOM(updatedNumbers);
        } else {
          this.updateDOM(savedData.numbers);
        }
      }
    }

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
        return null;
      } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
        return null;
      }
    }

    saveData(data) {
      try {
        localStorage.setItem(this.STORAGE_KEY_NUMBERS, JSON.stringify(data.numbers));
        localStorage.setItem(this.STORAGE_KEY_YEAR, data.year.toString());
      } catch (error) {
        console.error('Errore nel salvataggio dei dati:', error);
      }
    }

    updateDOM(numbers) {
      this.numeriElements.forEach((element, index) => {
        if (numbers[index]) {
          element.textContent = numbers[index].current;
        }
      });
    }

    static reset() {
      Object.keys(localStorage)
        .filter(key => key.startsWith('portflavio_'))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Gestione Eventi UI
   */
  class UIHandler {
    constructor() {
      this.schedaLinks = document.querySelectorAll('.scheda-link');
      this.isScrolling = false;
      this.activeScheda = null;
      this.lastTap = 0;
      
      this.init();
    }

    init() {
      if (window.matchMedia('(hover: none)').matches) {
        this.initializeTouchDevice();
      } else {
        this.initializeDesktopDevice();
      }
    }

    handleClick(e) {
      e.preventDefault();
      if (this.isScrolling) return;
      
      const targetId = e.currentTarget.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        this.isScrolling = true;
        smoothScroll(targetElement);
        history.pushState(null, '', targetId);
        
        setTimeout(() => {
          this.isScrolling = false;
        }, 3500);
      }
    }

    handleTap(e) {
      e.preventDefault();
      const currentScheda = e.currentTarget;
      const currentTime = Date.now();

      if (currentTime - this.lastTap < 300) {
        const targetId = currentScheda.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
          smoothScroll(targetElement);
          history.pushState(null, '', targetId);
        }
      } else {
        if (this.activeScheda) {
          this.activeScheda.classList.remove('active');
        }
        
        if (this.activeScheda !== currentScheda) {
          currentScheda.classList.add('active');
          this.activeScheda = currentScheda;
        } else {
          this.activeScheda = null;
        }
      }

      this.lastTap = currentTime;
    }

    handleSwipe(direction) {
      if (this.activeScheda) {
        const schedaArray = Array.from(this.schedaLinks);
        const currentIndex = schedaArray.indexOf(this.activeScheda);
        const newIndex = direction === 'up' 
          ? (currentIndex + 1) % this.schedaLinks.length
          : (currentIndex - 1 + this.schedaLinks.length) % this.schedaLinks.length;

        this.activeScheda.classList.remove('active');
        this.schedaLinks[newIndex].classList.add('active');
        this.activeScheda = this.schedaLinks[newIndex];
      }
    }

    initializeTouchDevice() {
      const swipeThreshold = 50;
      let touchStartY = 0;

      this.schedaLinks.forEach(link => {
        link.addEventListener('touchend', (e) => this.handleTap(e));
      });

      document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        const touchDistance = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(touchDistance) > swipeThreshold) {
          this.handleSwipe(touchDistance > 0 ? 'down' : 'up');
        }
      }, { passive: true });
    }

    initializeDesktopDevice() {
      this.schedaLinks.forEach(link => {
        link.addEventListener('click', (e) => this.handleClick(e));
      });
    }
  }

  // Inizializzazione
  new ContatoreSchede();
  new UIHandler();
});