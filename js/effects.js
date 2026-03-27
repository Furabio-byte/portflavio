window.PortflavioApp = window.PortflavioApp || {};

(function registerEffectsModule(app) {
  function applyDeviceFlags() {
    const userAgent = navigator.userAgent;
    const isMobileSafari =
      /iP(hone|ad|od)/.test(userAgent) &&
      /WebKit/i.test(userAgent) &&
      !/CriOS|FxiOS|EdgiOS/i.test(userAgent);

    if (isMobileSafari) {
      document.body.classList.add('is-mobile-safari');
    }
  }

  class RevealHandler {
    constructor() {
      this.reveals = document.querySelectorAll('.reveal');
      if (this.reveals.length === 0) return;
      this.initObserver();
    }

    initObserver() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
      });

      this.reveals.forEach((reveal) => {
        observer.observe(reveal);
      });
    }
  }

  class CustomCursorHandler {
    constructor() {
      if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

      this.cursor = document.querySelector('.custom-cursor');
      if (!this.cursor) return;

      this.initCursor();
    }

    initCursor() {
      document.addEventListener('mousemove', (event) => {
        this.cursor.style.left = `${event.clientX}px`;
        this.cursor.style.top = `${event.clientY}px`;
      });

      const interactables = document.querySelectorAll('a, button');
      interactables.forEach((element) => {
        element.addEventListener('mouseenter', () => {
          this.cursor.classList.add('hover');
        });

        element.addEventListener('mouseleave', () => {
          this.cursor.classList.remove('hover');
        });
      });
    }
  }

  app.applyDeviceFlags = applyDeviceFlags;
  app.RevealHandler = RevealHandler;
  app.CustomCursorHandler = CustomCursorHandler;
}(window.PortflavioApp));
