window.PortflavioApp = window.PortflavioApp || {};

(function registerContactModule(app) {
  class ContactFormHandler {
    constructor() {
      this.form = document.getElementById('contactForm');
      if (!this.form) return;

      this.card = document.querySelector('.contact-form-card');
      this.emailInput = document.getElementById('contactEmail');
      this.messageInput = document.getElementById('contactMessage');
      this.honeypotInput = document.getElementById('contactCompanyFax');
      this.statusElement = document.getElementById('contactStatus');
      this.submitButton = document.querySelector('button[form="contactForm"]');
      this.suggestionButtons = document.querySelectorAll('.contact-suggestion');
      this.shareButton = document.getElementById('sharePortfolioButton');
      this.emailField = this.emailInput?.closest('.contact-field') || null;
      this.messageField = this.messageInput?.closest('.contact-field') || null;
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
        this.resetValidationState();

        const email = this.emailInput.value.trim();
        const message = this.messageInput.value.trim();
        const companyFax = this.honeypotInput ? this.honeypotInput.value.trim() : '';

        if (!email) {
          this.showFieldError(this.emailField, this.emailInput, 'Inserisci la tua email prima di inviare.');
          return;
        }

        if (!this.emailInput.checkValidity()) {
          this.showFieldError(this.emailField, this.emailInput, 'Inserisci un indirizzo email valido.');
          return;
        }

        if (!message) {
          this.showFieldError(this.messageField, this.messageInput, 'Scrivi un messaggio prima di inviare.');
          return;
        }

        if (message.length < 3) {
          this.showFieldError(this.messageField, this.messageInput, "Scrivi un messaggio un po' più dettagliato.");
          return;
        }

        if (!this.apiUrl || this.apiUrl.includes('REPLACE_WITH_YOUR_VERCEL_DOMAIN')) {
          this.setStatus('Il servizio di contatto non è disponibile in questo momento.', true, 'error');
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

          this.handleSuccessState();
        } catch (error) {
          this.setStatus(this.getUserFriendlyError(error), true, 'error');
          this.animateCard('is-shake');
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
        this.setStatus("Scrivi prima la parte iniziale della tua email.", true, 'error');
        this.emailInput.focus();
        return;
      }

      this.emailInput.value = `${localPart}${domain}`;
      this.resetValidationState();
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
          this.setStatus('Portfolio condiviso.', false, 'success');
          return;
        }

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          this.setStatus('Link copiato negli appunti.', false, 'success');
          return;
        }

        this.setStatus('La condivisione non è disponibile su questo browser.', true, 'error');
      } catch (error) {
        if (error?.name !== 'AbortError') {
          this.setStatus('La condivisione non è riuscita.', true, 'error');
        }
      }
    }

    showFieldError(fieldElement, inputElement, message) {
      if (fieldElement) {
        fieldElement.classList.add('is-error');
      }

      this.setStatus(message, true, 'error');
      this.animateCard('is-shake');
      inputElement?.focus();
    }

    handleSuccessState() {
      this.form.reset();
      this.resetValidationState();
      this.card?.classList.add('is-success');
      this.submitButton?.classList.add('is-success');
      this.setStatus('Messaggio inviato. Ti risponderò al più presto.', false, 'success');
      this.animateCard('is-pulse');

      window.setTimeout(() => {
        this.submitButton?.classList.remove('is-success');
      }, 1400);
    }

    resetValidationState() {
      this.emailField?.classList.remove('is-error');
      this.messageField?.classList.remove('is-error');
      this.card?.classList.remove('is-success');
    }

    animateCard(className) {
      if (!this.card) return;

      this.card.classList.remove(className);
      void this.card.offsetWidth;
      this.card.classList.add(className);

      window.setTimeout(() => {
        this.card?.classList.remove(className);
      }, className === 'is-pulse' ? 650 : 380);
    }

    getUserFriendlyError(error) {
      const message = typeof error?.message === 'string' ? error.message : '';

      if (message === 'Invalid email.') {
        return 'Inserisci un indirizzo email valido.';
      }

      if (message === 'Invalid message length.') {
        return 'Scrivi un messaggio più dettagliato.';
      }

      if (message === 'Spam detected.') {
        return 'Non è stato possibile inviare il messaggio. Riprova.';
      }

      if (message === 'Forbidden origin.') {
        return 'Invio non consentito da questa pagina.';
      }

      if (message === 'Too many requests. Try again later.') {
        return 'Hai effettuato troppi tentativi. Riprova più tardi.';
      }

      if (message === 'Server email configuration is missing.') {
        return 'Il servizio di contatto non è disponibile in questo momento.';
      }

      if (message === 'Email provider error.') {
        return "C'è stato un problema temporaneo nell'invio. Riprova tra poco.";
      }

      if (message === 'Unexpected server error.' || message === 'Invio non riuscito.') {
        return 'Qualcosa è andato storto. Riprova tra qualche istante.';
      }

      return message || 'Qualcosa è andato storto. Riprova tra qualche istante.';
    }

    setPending(isPending) {
      if (!this.submitButton) return;

      this.submitButton.disabled = isPending;
      this.submitButton.textContent = isPending ? 'Invio...' : 'Invia';
    }

    setStatus(message, isError, tone = null) {
      if (!this.statusElement) return;

      this.statusElement.textContent = message;
      this.statusElement.style.color = '';
      this.statusElement.classList.remove('is-error', 'is-success', 'is-animated');

      if (tone === 'error' || isError) {
        this.statusElement.classList.add('is-error');
      } else if (tone === 'success') {
        this.statusElement.classList.add('is-success');
      }

      if (message) {
        void this.statusElement.offsetWidth;
        this.statusElement.classList.add('is-animated');
      }
    }
  }

  app.ContactFormHandler = ContactFormHandler;
}(window.PortflavioApp));
