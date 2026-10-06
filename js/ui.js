window.PortflavioApp = window.PortflavioApp || {};

(function registerUiModule(app) {
  // Il numero di ogni linea è quante stazioni vere ha: le voci "coming soon" non contano.
  class ContatoreSchede {
    constructor() {
      document.querySelectorAll('.elenco-linea').forEach((linea) => {
        const numero = linea.querySelector('.numero');
        if (numero) numero.textContent = linea.querySelectorAll('.voce:not(.voce-futura)').length;
      });
    }
  }

  app.ContatoreSchede = ContatoreSchede;
}(window.PortflavioApp));
