window.PortflavioApp = window.PortflavioApp || {};

(function registerContactModule(app) {
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
      this.shareButton = document.getElementById('sharePortfolioButton');
      this.apiUrl = window.PORTFLAVIO_CONFIG?.contactApiUrl || '';
      this.bindEvents();
    }

    bindEvents() {
      this.suggestionButtons.forEach((button) => {
        button.addEventListener('click', () => this.applySuggestedDomain(button.dataset.domain || ''));
      });

      if (this.shareButton) {
        this.shareButton.addEventListener('click', () => this.sharePortfolio());
      }

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
          this.setStatus("Scrivi un messaggio un po' piu dettagliato.", true);
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
          this.setStatus(error.message || "Errore durante l'invio.", true);
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
        this.setStatus("Scrivi prima la parte iniziale della tua email.", true);
        this.emailInput.focus();
        return;
      }

      this.emailInput.value = `${localPart}${domain}`;
      this.setStatus('', false);
      this.emailInput.focus();
    }

    async sharePortfolio() {
      const shareUrl = 'https://www.portflavio.it';
      const shareData = {
        title: 'Portflavio - Portfolio Personale',
        text: "Dai un'occhiata al portfolio di Flavio.",
        url: shareUrl
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
          this.setStatus('Portfolio condiviso.', false);
          return;
        }

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          this.setStatus('Link copiato negli appunti.', false);
          return;
        }

        this.setStatus('Condivisione non disponibile su questo browser.', true);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          this.setStatus('Condivisione non riuscita.', true);
        }
      }
    }

    setPending(isPending) {
      if (!this.submitButton) return;

      this.submitButton.disabled = isPending;
      this.submitButton.textContent = isPending ? 'Invio...' : 'Invia';
    }

    setStatus(message, isError) {
      if (!this.statusElement) return;

      this.statusElement.textContent = message;
      this.statusElement.style.color = isError ? '#8a2b2b' : '';
    }
  }

  app.ContactFormHandler = ContactFormHandler;
}(window.PortflavioApp));
