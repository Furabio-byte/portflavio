window.PortflavioApp = window.PortflavioApp || {};

document.addEventListener('DOMContentLoaded', () => {
  const app = window.PortflavioApp;

  new app.ContatoreSchede();
  new app.ContactFormHandler();
  app.avviaMappa();
});
