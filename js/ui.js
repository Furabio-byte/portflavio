window.PortflavioApp = window.PortflavioApp || {};

(function registerUiModule(app) {
  // I numeri delle linee formano l'anno: Project 2, Others 0, poi le ultime due cifre.
  class ContatoreSchede {
    constructor() {
      this.roadElement = document.querySelector('.elenco-linea[data-linea="R"] .numero');
      this.textElement = document.querySelector('.elenco-linea[data-linea="T"] .numero');
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

  app.ContatoreSchede = ContatoreSchede;
}(window.PortflavioApp));
