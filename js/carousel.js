window.PortflavioApp = window.PortflavioApp || {};

(function registerCarouselModule(app) {
  class ScrollHandler {
    constructor() {
      this.initializeCarousels();
    }

    initializeCarousels() {
      const containers = document.querySelectorAll('.scroll-container');

      containers.forEach((container) => {
        const subSchedeContainer = container.querySelector('.sub-schede-container');
        const dotIndicator = container.querySelector('.dot-indicator');
        const cards = subSchedeContainer ? subSchedeContainer.querySelectorAll('.sub-scheda') : [];

        if (!subSchedeContainer || !dotIndicator || cards.length === 0) return;

        const rebuildDots = () => this.buildDots(dotIndicator, subSchedeContainer);
        rebuildDots();

        subSchedeContainer.addEventListener('scroll', () => {
          this.updateActiveDot(subSchedeContainer, dotIndicator);
        }, { passive: true });

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

        if (window.ResizeObserver) {
          const resizeObserver = new ResizeObserver(() => rebuildDots());
          resizeObserver.observe(subSchedeContainer);
        }

        let isDown = false;
        let startX;
        let scrollLeft;

        subSchedeContainer.addEventListener('mousedown', (event) => {
          isDown = true;
          subSchedeContainer.style.cursor = 'grabbing';
          startX = event.pageX - subSchedeContainer.offsetLeft;
          scrollLeft = subSchedeContainer.scrollLeft;
          event.preventDefault();
        });

        subSchedeContainer.addEventListener('mouseleave', () => {
          isDown = false;
          subSchedeContainer.style.cursor = 'grab';
        });

        subSchedeContainer.addEventListener('mouseup', () => {
          isDown = false;
          subSchedeContainer.style.cursor = 'grab';
        });

        subSchedeContainer.addEventListener('mousemove', (event) => {
          if (!isDown) return;

          event.preventDefault();
          const x = event.pageX - subSchedeContainer.offsetLeft;
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
        cards.forEach((card, index) => {
          const dot = document.createElement('span');
          dot.classList.add('dot');
          if (index === 0) dot.classList.add('active');

          dot.addEventListener('click', () => {
            scroller.scrollTo({
              left: card.offsetLeft - scroller.offsetLeft,
              behavior: 'smooth'
            });
          });

          dotIndicator.appendChild(dot);
        });
        return;
      }

      const cardWidth = cards[0].offsetWidth + 40;
      const cardsPerView = Math.max(1, Math.floor(scroller.clientWidth / cardWidth));
      const totalDots = Math.max(1, Math.ceil(cards.length / cardsPerView));

      for (let index = 0; index < totalDots; index += 1) {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');

        dot.addEventListener('click', () => {
          scroller.scrollTo({
            left: index * scroller.clientWidth,
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
        const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
        let closestIndex = 0;
        let closestDist = Infinity;

        cards.forEach((card, index) => {
          const cardCenter = card.offsetLeft - scroller.offsetLeft + card.offsetWidth / 2;
          const dist = Math.abs(viewportCenter - cardCenter);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = index;
          }
        });

        dots.forEach((dot, index) => {
          dot.classList.toggle('active', index === closestIndex);
        });
        return;
      }

      if (dots.length === 0) return;

      const currentPage = Math.round(scroller.scrollLeft / scroller.clientWidth);
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentPage);
      });
    }
  }

  app.ScrollHandler = ScrollHandler;
}(window.PortflavioApp));
