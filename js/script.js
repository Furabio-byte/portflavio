document.addEventListener('DOMContentLoaded', () => {
  const easeInOutSextuple = (t) =>
    t < 0.5 ? 32 * t ** 6 : 1 - (-2 * t + 2) ** 6 / 2;

  const smoothScroll = (targetElement) => {
    const startPosition = window.scrollY;
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
      
      // Calcola e assegna sempre il numero corretto all'elemento visuale, forzando l'aggiornamento sull'HTML hardcoded ("5")
      this.yearElement.textContent = lastTwoDigits >= 30 ? lastTwoDigits : lastTwoDigits % 10;

      // Aggiorna il localStorage in disparte solo se è cambiato l'anno
      if (!savedYear || currentYear !== savedYear) {
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
      this.initializeCarousels();
    }

    initializeCarousels() {
      const containers = document.querySelectorAll('.scroll-container');
      containers.forEach(container => {
        const subSchedeContainer = container.querySelector('.sub-schede-container');
        const dotIndicator = container.querySelector('.dot-indicator');
        const cards = subSchedeContainer ? subSchedeContainer.querySelectorAll('.sub-scheda') : [];

        if (!subSchedeContainer || !dotIndicator || cards.length === 0) return;

        // Helper riutilizzabile per (ri)costruire i dots
        const rebuildDots = () => this.buildDots(dotIndicator, subSchedeContainer);

        // Prima costruzione
        rebuildDots();

        // Aggiorna il dot attivo allo scroll (funziona sia su desktop che su touch mobile)
        subSchedeContainer.addEventListener('scroll', () => {
          this.updateActiveDot(subSchedeContainer, dotIndicator);
        }, { passive: true });

        // Ricalcola i dots se la finestra cambia dimensione (es. rotazione schermo su mobile)
        if (window.ResizeObserver) {
          const resizeObserver = new ResizeObserver(() => rebuildDots());
          resizeObserver.observe(subSchedeContainer);
        }

        // --- DRAG TO SCROLL (solo mouse/desktop) ---
        let isDown = false;
        let startX;
        let scrollLeft;

        subSchedeContainer.addEventListener('mousedown', (e) => {
          isDown = true;
          subSchedeContainer.style.cursor = 'grabbing';
          startX = e.pageX - subSchedeContainer.offsetLeft;
          scrollLeft = subSchedeContainer.scrollLeft;
          e.preventDefault();
        });

        subSchedeContainer.addEventListener('mouseleave', () => {
          isDown = false;
          subSchedeContainer.style.cursor = 'grab';
        });

        subSchedeContainer.addEventListener('mouseup', () => {
          isDown = false;
          subSchedeContainer.style.cursor = 'grab';
        });

        subSchedeContainer.addEventListener('mousemove', (e) => {
          if (!isDown) return;
          e.preventDefault();
          const x = e.pageX - subSchedeContainer.offsetLeft;
          const walk = (x - startX) * 2;
          subSchedeContainer.scrollLeft = scrollLeft - walk;
        });

        subSchedeContainer.style.cursor = 'grab';
      });
    }

    buildDots(dotIndicator, scroller) {
      dotIndicator.innerHTML = '';

      // Aspetta che il DOM sia pronto per calcolare le dimensioni reali
      setTimeout(() => {
        const totalPages = Math.ceil(scroller.scrollWidth / scroller.clientWidth);

        for (let i = 0; i < totalPages; i++) {
          const dot = document.createElement('span');
          dot.classList.add('dot');
          if (i === 0) dot.classList.add('active');

          // Click su dot: salta alla pagina corrispondente
          dot.addEventListener('click', () => {
            scroller.scrollTo({
              left: i * scroller.clientWidth,
              behavior: 'smooth'
            });
          });

          dotIndicator.appendChild(dot);
        }
      }, 100);
    }

    updateActiveDot(scroller, dotIndicator) {
      const dots = dotIndicator.querySelectorAll('.dot');
      if (dots.length === 0) return;

      // Calcola la pagina attuale in base alla posizione di scroll
      const currentPage = Math.round(scroller.scrollLeft / scroller.clientWidth);

      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentPage);
      });
    }
  }

  class UIHandler {
    constructor() {
      this.schedaLinks = document.querySelectorAll('.scheda-link');
      this.activeScheda = null;
      this.lastTap = null;
      this.bindEvents(); // Esegue il binding dei listener una sola volta
      this.initARIA();
    }

    initARIA() {
      this.schedaLinks.forEach(link => {
        link.setAttribute('aria-expanded', 'false');
      });
    }

    bindEvents() {
      // Usiamo solo 'click' che gestisce nativamente sia mouse che touch
      this.schedaLinks.forEach(link => {
        link.addEventListener('click', (e) => this.handleInteraction(e));
      });

      // Swipe per scorrere tra le schede rimarrà basato sul touch
      const swipeThreshold = 50;
      let touchStartY = 0;

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

    handleInteraction(e) {
      const currentSchedaLink = e.currentTarget;
      const currentSchedaInner = currentSchedaLink.querySelector('.scheda');
      const targetId = currentSchedaLink.getAttribute('href');
      
      e.preventDefault();
      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - (this.lastTap || 0);
      const isQuickTap = timeSinceLastTap <= 400; // Leggermente aumentato per una migliore ux sul doppio tocco effettivo
      const isAlreadyActive = currentSchedaInner && currentSchedaInner.classList.contains('active');

      // Haptic Feedback (se supportato e abilitato dall'utente sul device)
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(isQuickTap && isAlreadyActive ? 100 : 50);
      }

      // Logica Navigazione vs Apertura (1 Tocco apre, 2 Tocchi scrolla)
      if (isQuickTap && isAlreadyActive) {
        // AZIONE: Doppio tocco / click sulla stessa scheda già aperta -> Naviga
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
        // AZIONE: Singolo tocco / click su nuova scheda -> Apri la scheda (Espandi)
        this.toggleScheda(currentSchedaLink);
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

        const newScheda = this.schedaLinks[newIndex];
        const targetId = newScheda.getAttribute('href');

        if (!targetId.startsWith('mailto:')) {
          this.activeScheda.classList.remove('active');
          newScheda.classList.add('active');
          this.activeScheda = newScheda;
        }
      }
    }

    toggleScheda(schedaLink) {
      const isSameLink = schedaLink === this.activeScheda;
      const innerScheda = schedaLink.querySelector('.scheda');

      if (isSameLink) {
        if (innerScheda) {
          innerScheda.classList.remove('active', 'is-active');
        }
        schedaLink.setAttribute('aria-expanded', 'false');
        this.activeScheda = null;
      } else {
        if (this.activeScheda) {
          this.resetScheda(this.activeScheda);
        }
        if (innerScheda) {
          innerScheda.classList.add('active', 'is-active');
        }
        schedaLink.setAttribute('aria-expanded', 'true');
        this.activeScheda = schedaLink;
      }
    }

    resetScheda(schedaLink) {
      const innerScheda = schedaLink.querySelector('.scheda');
      if (innerScheda) {
        innerScheda.classList.remove('active', 'is-active');
      }
      schedaLink.setAttribute('aria-expanded', 'false');
    }
  }

  class RevealHandler {
    constructor() {
      this.reveals = document.querySelectorAll('.reveal');
      if (this.reveals.length === 0) return;
      this.initObserver();
    }

    initObserver() {
      const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Si attiva quando il 15% della sezione diventa visibile
      };

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            // Una volta apparsa, potremmo voler smettere di osservarla (fade-in una sola volta)
            // obs.unobserve(entry.target); 
          }
        });
      }, observerOptions);

      this.reveals.forEach(reveal => {
        observer.observe(reveal);
      });
    }
  }

  class CustomCursorHandler {
    constructor() {
      // Si attiva solo se il device possiede un mouse (non touch)
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

      this.cursor = document.querySelector('.custom-cursor');
      if (!this.cursor) return;

      this.initCursor();
    }

    initCursor() {
      // Movimento Cursore
      document.addEventListener('mousemove', (e) => {
        this.cursor.style.left = `${e.clientX}px`;
        this.cursor.style.top = `${e.clientY}px`;
      });

      // Effetto espansione passando sopra link o pulsanti
      const interactables = document.querySelectorAll('a, button');
      interactables.forEach(el => {
        el.addEventListener('mouseenter', () => {
          this.cursor.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
          this.cursor.classList.remove('hover');
        });
      });
    }
  }

  new RevealHandler();
  new CustomCursorHandler();
  new ContatoreSchede();
  new UIHandler();
  new ScrollHandler();
});