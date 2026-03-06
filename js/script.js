document.addEventListener('DOMContentLoaded', () => {
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

  class ContatoreSchede {
    constructor() {
      this.STORAGE_PREFIX = 'portflavio_';
      this.STORAGE_KEY_YEAR = `${this.STORAGE_PREFIX}anno`;
      this.yearElement = document.querySelector('.scheda-link:last-child .numero');

      if (!this.yearElement) {
        console.warn('Elemento anno non trovato');
        return;
      }
      this.init();
    }

    init() {
      const currentYear = new Date().getFullYear();
      const lastTwoDigits = currentYear % 100;
      const savedYear = this.getSavedYear();

      if (!savedYear || currentYear !== savedYear) {
        this.yearElement.textContent = lastTwoDigits >= 30 ? lastTwoDigits : lastTwoDigits % 10;
        this.saveYear(currentYear);
      }
    }

    getSavedYear() {
      try {
        const savedYear = localStorage.getItem(this.STORAGE_KEY_YEAR);
        return savedYear ? parseInt(savedYear, 10) : null;
      } catch (error) {
        console.error('Errore nel recupero dell\'anno:', error);
        return null;
      }
    }

    saveYear(year) {
      try {
        localStorage.setItem(this.STORAGE_KEY_YEAR, year.toString());
      } catch (error) {
        console.error('Errore nel salvataggio dell\'anno:', error);
      }
    }

    static reset() {
      Object.keys(localStorage)
        .filter(key => key.startsWith('portflavio_'))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  class ScrollHandler {
    constructor() {
      this.initializeScrollButtons();
    }

    initializeScrollButtons() {
      const containers = document.querySelectorAll('.scroll-container');
      containers.forEach(container => {
        const subSchedeContainer = container.querySelector('.sub-schede-container');
        const leftBtn = container.querySelector('.scroll-btn.scroll-left');
        const rightBtn = container.querySelector('.scroll-btn.scroll-right');

        if (leftBtn && rightBtn && subSchedeContainer) {
          leftBtn.addEventListener('click', () => this.scroll(subSchedeContainer, 'left'));
          rightBtn.addEventListener('click', () => this.scroll(subSchedeContainer, 'right'));
        }
      });
    }

    scroll(container, direction) {
      const scrollAmount = container.offsetWidth * 0.8;
      const newScrollLeft = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  }

  class UIHandler {
    constructor() {
      this.schedaLinks = document.querySelectorAll('.scheda-link');
      this.activeScheda = null;
      this.lastTap = null;
      this.init();
    }

    init() {
      // Inizializza l'attributo ARIA base
      this.schedaLinks.forEach(link => {
        link.setAttribute('aria-expanded', 'false');
      });

      if (window.matchMedia('(hover: none)').matches) {
        this.initializeTouchDevice();
      } else {
        this.initializeDesktopDevice();
      }

      // Aggiunge un resizer decurtato (debounce) per la rotazione del dispositivo mobile (portrait -> landscape)
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.init(); // Reinizializza la logica UI in base al nuovo media (es. passaggio mouse/touch)
        }, 250);
      });
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

    handleTap(e) {
      const currentScheda = e.currentTarget;
      const targetId = currentScheda.getAttribute('href');
      
      e.preventDefault();
      const currentTime = Date.now();
      const isSameScheda = this.activeScheda === currentScheda;
      const isDoubleTap = this.lastTap && isSameScheda && ((currentTime - this.lastTap) <= 300);

      // Haptic Feedback (se supportato)
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(isDoubleTap ? 100 : 50);
      }
 
      if (isDoubleTap) {
        // AZIONE: Naviga o Invia Mail (Secondo tocco)
        if (targetId.startsWith('mailto:')) {
          window.location.href = targetId;
        } else {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            smoothScroll(targetElement);
            history.pushState(null, '', targetId);
          }
        }
      } else {
        // AZIONE: Mostra Parola Nascondendo Lettera (Primo tocco, o tocco su scheda diversa)
        this.toggleScheda(currentScheda);
      }
 
      this.lastTap = currentTime;
    }

    handleClick(e) {
      const targetId = e.currentTarget.getAttribute('href');
      if (targetId.startsWith('mailto:')) return true;
      e.preventDefault();

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        smoothScroll(targetElement);
        history.pushState(null, '', targetId);
      }
    }

    handleSwipe(direction) {
      if (this.activeScheda) {
        const schedaArray = Array.from(this.schedaLinks);
        const currentIndex = schedaArray.indexOf(this.activeScheda);
        const newIndex = direction === 'up'
          ? (currentIndex + 1) % this.schedaLinks.length
          : (currentIndex - 1 + this.schedaLinks.length) % this.schedaLinks.length;

        const newScheda = this.schedaLinks[newIndex];
        const targetId = newScheda.getAttribute('href');

        if (!targetId.startsWith('mailto:')) {
          this.activeScheda.classList.remove('active');
          newScheda.classList.add('active');
          this.activeScheda = newScheda;
        }
      }
    }

    toggleScheda(scheda) {
      const isActive = scheda === this.activeScheda;

      if (isActive) {
        scheda.classList.remove('active');
        scheda.classList.remove('is-active');
        this.activeScheda = null;
      } else {
        if (this.activeScheda) {
          this.resetScheda(this.activeScheda);
        }
        scheda.classList.add('active');
        scheda.classList.add('is-active');
        this.activeScheda = scheda;
      }
    }

    resetScheda(scheda) {
      scheda.classList.remove('active');
      scheda.classList.remove('is-active');
    }
  }

  new ContatoreSchede();
  new UIHandler();
  new ScrollHandler();
});