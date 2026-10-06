// Caricato nel <head>: attiva la modalità mappa e applica il tema prima del primo disegno.
(function preparaPagina() {
  const root = document.documentElement;
  root.classList.add('js');

  let tema = null;
  try {
    tema = localStorage.getItem('pf-tema');
  } catch (error) {
    tema = null;
  }

  if (!tema) {
    tema = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.dataset.theme = tema;
}());
