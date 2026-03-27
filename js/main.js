window.PortflavioApp = window.PortflavioApp || {};

document.addEventListener('DOMContentLoaded', () => {
  const app = window.PortflavioApp;

  app.applyDeviceFlags?.();
  new app.RevealHandler();
  new app.CustomCursorHandler();
  new app.ContatoreSchede();
  new app.UIHandler();
  new app.ScrollHandler();
  new app.ContactFormHandler();
});
