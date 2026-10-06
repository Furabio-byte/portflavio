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

  // senza una scelta salvata il tema è automatico: scuro di sera e di notte, come una città che accende le luci
  if (tema !== 'light' && tema !== 'dark') {
    const ora = new Date().getHours();
    tema = ora >= 20 || ora < 7 ? 'dark' : 'light';
    root.dataset.temaAuto = '1';
  }

  root.dataset.theme = tema;
}());
