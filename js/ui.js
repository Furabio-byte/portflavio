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
      this.roadElement = document.querySelector('.scheda-link:nth-child(3) .numero');
      this.textElement = document.querySelector('.scheda-link:last-child .numero');
      this.init();
    }

    init() {
      if (!this.roadElement || !this.textElement) return;

      const currentYear = new Date().getFullYear();
      const isReasonableYear = currentYear >= 2020 && currentYear <= 2039;

      if (!isReasonableYear) {
        this.roadElement.textContent = '2';
        this.textElement.textContent = '6';
        return;
      }

      const yearDigits = String(currentYear).slice(-2);
      this.roadElement.textContent = yearDigits.charAt(0);
      this.textElement.textContent = yearDigits.charAt(1);
    }
  }

  class UIHandler {
    constructor() {
      this.schedaLinks = document.querySelectorAll('.scheda-link');
      this.activeScheda = null;
      this.lastTapTime = 0;
      this.lastTappedScheda = null;
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
      const timeSinceLastTap = currentTime - this.lastTapTime;
      const isQuickTap = timeSinceLastTap <= 550;
      const isSameScheda = this.lastTappedScheda === currentSchedaLink;
      const isAlreadyActive = currentSchedaInner?.classList.contains('is-active');
      const shouldNavigate = isQuickTap && isSameScheda && isAlreadyActive;

      if (shouldNavigate) {
        this.navigateToTarget(targetId);
      } else if (!isAlreadyActive) {
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
        innerScheda.classList.add('is-active');
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

    toggleScheda(schedaLink) {
      const innerScheda = schedaLink.querySelector('.scheda');

      if (this.activeScheda) {
        this.resetScheda(this.activeScheda);
      }

      if (innerScheda) {
        innerScheda.classList.add('is-active');
      }

      schedaLink.setAttribute('aria-expanded', 'true');
      this.activeScheda = schedaLink;
    }

    resetScheda(schedaLink) {
      const innerScheda = schedaLink.querySelector('.scheda');
      if (innerScheda) {
        innerScheda.classList.remove('is-active');
      }
      schedaLink.setAttribute('aria-expanded', 'false');
    }
  }

  app.ContatoreSchede = ContatoreSchede;
  app.UIHandler = UIHandler;
}(window.PortflavioApp));
