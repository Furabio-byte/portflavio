document.addEventListener('DOMContentLoaded', () => {
  const userAgent = navigator.userAgent;
  const isMobileSafari =
    /iP(hone|ad|od)/.test(userAgent) &&
    /WebKit/i.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS/i.test(userAgent);

  if (isMobileSafari) {
    document.body.classList.add('is-mobile-safari');
  }

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

        // scroll real-time: aggiorna i dots durante il movimento → nessun "nero" di mezzo
        subSchedeContainer.addEventListener('scroll', () => {
          this.updateActiveDot(subSchedeContainer, dotIndicator);
        }, { passive: true });

        // scrollend: aggiorna alla posizione finale precisa dopo lo snap (zero scia)
        // Fallback con debounce 250ms per browser che non supportano scrollend
        const onScrollEnd = () => this.updateActiveDot(subSchedeContainer, dotIndicator);
        if ('onscrollend' in window) {
          subSchedeContainer.addEventListener('scrollend', onScrollEnd, { passive: true });
        } else {
          let scrollDebounce;
          subSchedeContainer.addEventListener('scroll', () => {
            clearTimeout(scrollDebounce);
            scrollDebounce = setTimeout(onScrollEnd, 250);
          }, { passive: true });
        }

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
      const cards = scroller.querySelectorAll('.sub-scheda');
      if (cards.length === 0) return;

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        for (let i = 0; i < cards.length; i++) {
          const dot = document.createElement('span');
          dot.classList.add('dot');
          if (i === 0) dot.classList.add('active');

          dot.addEventListener('click', () => {
            scroller.scrollTo({
              left: cards[i].offsetLeft - scroller.offsetLeft,
              behavior: 'smooth'
            });
          });

          dotIndicator.appendChild(dot);
        }
        return;
      }

      // Desktop: calcola quante card entrano nel viewport e quante "fermate" servono
      const cardWidth = cards[0].offsetWidth + 40; // +40 per il gap
      const cardsPerView = Math.max(1, Math.floor(scroller.clientWidth / cardWidth));
      const totalDots = Math.max(1, Math.ceil(cards.length / cardsPerView));

      for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');

        dot.addEventListener('click', () => {
          // Desktop: salta alla "fermata" corrispondente
          scroller.scrollTo({
            left: i * scroller.clientWidth,
            behavior: 'smooth'
          });
        });

        dotIndicator.appendChild(dot);
      }
    }
    updateActiveDot(scroller, dotIndicator) {
      const dots = dotIndicator.querySelectorAll('.dot');
      const cards = scroller.querySelectorAll('.sub-scheda');
      if (cards.length === 0) return;

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Mobile: dot attivo = card più vicina al centro del viewport
        const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
        let closestIndex = 0;
        let closestDist = Infinity;
        cards.forEach((card, i) => {
          const cardCenter = card.offsetLeft - scroller.offsetLeft + card.offsetWidth / 2;
          const dist = Math.abs(viewportCenter - cardCenter);
          if (dist < closestDist) { closestDist = dist; closestIndex = i; }
        });
        dots.forEach((dot, i) => dot.classList.toggle('active', i === closestIndex));
      } else {
        if (dots.length === 0) return;

        // Desktop: dot attivo = fermata corrente in base allo scroll
        const currentPage = Math.round(scroller.scrollLeft / scroller.clientWidth);
        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentPage));
      }
    }
  }

  class UIHandler {
    constructor() {
      this.schedaLinks = document.querySelectorAll('.scheda-link');
      this.activeScheda = null;
      this.lastTap = null;
      this.isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
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

        if (this.isDesktopPointer) {
          link.addEventListener('mouseenter', () => this.previewScheda(link));
          link.addEventListener('mouseleave', () => this.clearPreview(link));
        }
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

      if (this.isDesktopPointer) {
        this.navigateToTarget(targetId);
        return;
      }

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
        this.navigateToTarget(targetId);
      } else {
        // AZIONE: Singolo tocco / click su nuova scheda -> Apri la scheda (Espandi)
        this.toggleScheda(currentSchedaLink);
      }

      this.lastTap = currentTime;
    }

    navigateToTarget(targetId) {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        smoothScroll(targetElement);
        history.pushState(null, '', targetId);
      }
    }

    previewScheda(schedaLink) {
      if (this.activeScheda && this.activeScheda !== schedaLink) {
        this.resetScheda(this.activeScheda);
      }

      const innerScheda = schedaLink.querySelector('.scheda');
      if (innerScheda) {
        innerScheda.classList.add('active', 'is-active');
      }

      schedaLink.setAttribute('aria-expanded', 'true');
      this.activeScheda = schedaLink;
    }

    clearPreview(schedaLink) {
      if (this.activeScheda === schedaLink) {
        this.resetScheda(schedaLink);
        this.activeScheda = null;
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
        this.activeScheda.classList.remove('active');
        newScheda.classList.add('active');
        this.activeScheda = newScheda;
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

  class ContactFormHandler {
    constructor() {
      this.form = document.getElementById('contactForm');
      if (!this.form) return;

      this.emailInput = document.getElementById('contactEmail');
      this.messageInput = document.getElementById('contactMessage');
      this.honeypotInput = document.getElementById('contactCompanyFax');
      this.statusElement = document.getElementById('contactStatus');
      this.submitButton = document.querySelector('button[form="contactForm"]');
      this.suggestionButtons = document.querySelectorAll('.contact-suggestion');
      this.apiUrl = window.PORTFLAVIO_CONFIG?.contactApiUrl || '';
      this.bindEvents();
    }

    bindEvents() {
      this.suggestionButtons.forEach((button) => {
        button.addEventListener('click', () => this.applySuggestedDomain(button.dataset.domain || ''));
      });

      this.form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = this.emailInput.value.trim();
        const message = this.messageInput.value.trim();
        const companyFax = this.honeypotInput ? this.honeypotInput.value.trim() : '';

        if (!email) {
          this.setStatus('Inserisci la tua email prima di inviare.', true);
          return;
        }

        if (!this.emailInput.checkValidity()) {
          this.setStatus('Inserisci un indirizzo email valido.', true);
          return;
        }

        if (!message) {
          this.setStatus('Scrivi un messaggio prima di inviare.', true);
          return;
        }

        if (message.length < 3) {
          this.setStatus('Scrivi un messaggio un po\' piu dettagliato.', true);
          return;
        }

        if (!this.apiUrl || this.apiUrl.includes('REPLACE_WITH_YOUR_VERCEL_DOMAIN')) {
          this.setStatus('Configura prima il dominio Vercel del backend.', true);
          return;
        }

        this.setPending(true);
        this.setStatus('Invio in corso...', false);

        try {
          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, message, company_fax: companyFax })
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(data.error || 'Invio non riuscito.');
          }

          this.form.reset();
          this.setStatus('Messaggio inviato correttamente.', false);
        } catch (error) {
          this.setStatus(error.message || 'Errore durante l\'invio.', true);
        } finally {
          this.setPending(false);
        }
      });
    }

    applySuggestedDomain(domain) {
      if (!domain) return;

      const currentValue = this.emailInput.value.trim();
      const localPart = currentValue.split('@')[0].trim();

      if (!localPart) {
        this.setStatus('Scrivi prima la parte iniziale della tua email.', true);
        this.emailInput.focus();
        return;
      }

      this.emailInput.value = `${localPart}${domain}`;
      this.setStatus('', false);
      this.emailInput.focus();
    }

    setPending(isPending) {
      if (this.submitButton) {
        this.submitButton.disabled = isPending;
        this.submitButton.textContent = isPending ? 'Invio...' : 'Invia';
      }
    }

    setStatus(message, isError) {
      if (!this.statusElement) return;
      this.statusElement.textContent = message;
      this.statusElement.style.color = isError ? '#8a2b2b' : '';
    }
  }

  new RevealHandler();
  new CustomCursorHandler();
  new ContatoreSchede();
  new UIHandler();
  new ScrollHandler();
  new ContactFormHandler();
});
