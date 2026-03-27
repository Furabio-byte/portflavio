window.PortflavioApp = window.PortflavioApp || {};

(function registerUiModule(app) {
  app.smoothScroll = (targetElement) => {
    const startPosition = window.scrollY;
    const targetPosition = targetElement.getBoundingClientRect().top + startPosition;
    const distance = targetPosition - startPosition;

    const easeInOutSextuple = (t) =>
      t < 0.5 ? 32 * t ** 6 : 1 - (-2 * t + 2) ** 6 / 2;

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

      this.yearElement.textContent = lastTwoDigits >= 30 ? lastTwoDigits : lastTwoDigits % 10;

      if (!savedYear || currentYear !== savedYear) {
        this.saveYear(currentYear);
      }
    }

    getSavedYear() {
      try {
        const savedYear = localStorage.getItem(this.STORAGE_KEY_YEAR);
        return savedYear ? parseInt(savedYear, 10) : null;
      } catch (error) {
        console.error("Errore nel recupero dell'anno:", error);
        return null;
      }
    }

    saveYear(year) {
      try {
        localStorage.setItem(this.STORAGE_KEY_YEAR, year.toString());
      } catch (error) {
        console.error("Errore nel salvataggio dell'anno:", error);
      }
    }
  }

  class UIHandler {
    constructor() {
      this.schedaLinks = document.querySelectorAll('.scheda-link');
      this.activeScheda = null;
      this.lastTap = null;
      this.isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      this.bindEvents();
      this.initARIA();
    }

    initARIA() {
      this.schedaLinks.forEach((link) => {
        link.setAttribute('aria-expanded', 'false');
      });
    }

    bindEvents() {
      this.schedaLinks.forEach((link) => {
        link.addEventListener('click', (event) => this.handleInteraction(event));

        if (this.isDesktopPointer) {
          link.addEventListener('mouseenter', () => this.previewScheda(link));
          link.addEventListener('mouseleave', () => this.clearPreview(link));
        }
      });

      const swipeThreshold = 50;
      let touchStartY = 0;

      document.addEventListener('touchstart', (event) => {
        touchStartY = event.touches[0].clientY;
      }, { passive: true });

      document.addEventListener('touchend', (event) => {
        const touchDistance = event.changedTouches[0].clientY - touchStartY;
        if (Math.abs(touchDistance) > swipeThreshold) {
          this.handleSwipe(touchDistance > 0 ? 'down' : 'up');
        }
      }, { passive: true });
    }

    handleInteraction(event) {
      const currentSchedaLink = event.currentTarget;
      const currentSchedaInner = currentSchedaLink.querySelector('.scheda');
      const targetId = currentSchedaLink.getAttribute('href');

      event.preventDefault();

      if (this.isDesktopPointer) {
        this.navigateToTarget(targetId);
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - (this.lastTap || 0);
      const isQuickTap = timeSinceLastTap <= 400;
      const isAlreadyActive = currentSchedaInner && currentSchedaInner.classList.contains('active');

      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(isQuickTap && isAlreadyActive ? 100 : 50);
      }

      if (isQuickTap && isAlreadyActive) {
        this.navigateToTarget(targetId);
      } else {
        this.toggleScheda(currentSchedaLink);
      }

      this.lastTap = currentTime;
    }

    navigateToTarget(targetId) {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        app.smoothScroll(targetElement);
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
      if (!this.activeScheda) return;

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

    toggleScheda(schedaLink) {
      const isSameLink = schedaLink === this.activeScheda;
      const innerScheda = schedaLink.querySelector('.scheda');

      if (isSameLink) {
        if (innerScheda) {
          innerScheda.classList.remove('active', 'is-active');
        }
        schedaLink.setAttribute('aria-expanded', 'false');
        this.activeScheda = null;
        return;
      }

      if (this.activeScheda) {
        this.resetScheda(this.activeScheda);
      }

      if (innerScheda) {
        innerScheda.classList.add('active', 'is-active');
      }

      schedaLink.setAttribute('aria-expanded', 'true');
      this.activeScheda = schedaLink;
    }

    resetScheda(schedaLink) {
      const innerScheda = schedaLink.querySelector('.scheda');
      if (innerScheda) {
        innerScheda.classList.remove('active', 'is-active');
      }
      schedaLink.setAttribute('aria-expanded', 'false');
    }
  }

  app.ContatoreSchede = ContatoreSchede;
  app.UIHandler = UIHandler;
}(window.PortflavioApp));
