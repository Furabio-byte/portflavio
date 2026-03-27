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
      this.yearElement = document.querySelector('.scheda-link:last-child .numero');
      this.init();
    }

    init() {
      if (this.yearElement) {
        const currentYear = new Date().getFullYear();
        const lastTwoDigits = currentYear % 100;
        this.yearElement.textContent = lastTwoDigits >= 30 ? lastTwoDigits.toString() : (lastTwoDigits % 10).toString();
      }
    }
  }

  class UIHandler {
    constructor() {
      this.schedaLinks = document.querySelectorAll('.scheda-link');
      this.activeScheda = null;
      this.lastTapTime = 0;
      this.lastTappedScheda = null;
      this.justSwiped = false;
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
          this.justSwiped = true;
          this.handleSwipe(touchDistance > 0 ? 'down' : 'up');
          window.setTimeout(() => {
            this.justSwiped = false;
          }, 250);
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

      if (this.justSwiped) {
        return;
      }

      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - this.lastTapTime;
      const isQuickTap = timeSinceLastTap <= 550;
      const isSameScheda = this.lastTappedScheda === currentSchedaLink;
      const isAlreadyActive = currentSchedaInner && currentSchedaInner.classList.contains('active');
      const shouldNavigate = isQuickTap && isSameScheda && isAlreadyActive;

      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(shouldNavigate ? 100 : 50);
      }

      if (shouldNavigate) {
        this.navigateToTarget(targetId);
      } else {
        this.toggleScheda(currentSchedaLink);
      }

      this.lastTapTime = currentTime;
      this.lastTappedScheda = currentSchedaLink;
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
      this.resetScheda(this.activeScheda);
      const newInnerScheda = newScheda.querySelector('.scheda');
      if (newInnerScheda) {
        newInnerScheda.classList.add('active', 'is-active');
      }
      newScheda.setAttribute('aria-expanded', 'true');
      this.activeScheda = newScheda;
      this.lastTappedScheda = newScheda;
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
        this.lastTappedScheda = null;
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
