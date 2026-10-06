window.PortflavioApp = window.PortflavioApp || {};

document.addEventListener('DOMContentLoaded', () => {
  const app = window.PortflavioApp;

  new app.ContatoreSchede();
  new app.ContactFormHandler();
  app.avviaMappa();
});

// installabile come app e consultabile offline
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
