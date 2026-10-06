window.PortflavioApp = window.PortflavioApp || {};

(function registerMappaModule(app) {
  const NS = 'http://www.w3.org/2000/svg';
  const CONTENUTO = { x: 0, y: -30, w: 1200, h: 760 };
  const ICONA_PREC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
  const ICONA_SUCC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';
  const ICONA_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l12 8-12 8z"/></svg>';
  const ICONA_PAUSA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>';
  const ICONA_PERCORSO = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/></svg>';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const crea = (tag, attrs = {}, parent = null) => {
    const nodo = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => nodo.setAttribute(k, v));
    if (parent) parent.appendChild(nodo);
    return nodo;
  };
  const easing = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const testo = (root, sel) => root.querySelector(sel)?.textContent.trim() || null;
  // testo bianco o nero, a seconda di quanto è chiaro il colore della linea
  const testoSu = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.6 ? '#111111' : '#ffffff';
  };

  // Le linee e le stazioni vengono lette dall'elenco nell'HTML: è l'unica fonte dei contenuti.
  function leggiLinee() {
    return Array.from(document.querySelectorAll('.elenco-linea')).map((sezione) => {
      const linea = {
        id: sezione.dataset.linea,
        nome: testo(sezione, '.linea-nome'),
        num: testo(sezione, '.numero'),
        colore: sezione.dataset.colore,
        solida: sezione.dataset.solida,
        tratteggio: sezione.dataset.tratteggio || null,
        sezione,
        nodi: []
      };

      sezione.querySelectorAll('.voce').forEach((voce, indice) => {
        const articolo = voce.querySelector('article');
        const titolo = testo(articolo, '.voce-titolo');
        const num = testo(articolo, '.voce-num');
        const link = articolo.querySelector('.voce-link');
        linea.nodi.push({
          id: `${linea.id}-${num}`,
          x: Number(voce.dataset.x),
          y: Number(voce.dataset.y),
          nome: voce.dataset.etichetta,
          posizione: voce.dataset.et,
          tipo: voce.dataset.tipo || null,
          futura: voce.classList.contains('voce-futura'),
          tag: testo(articolo, '.voce-tag'),
          num,
          titolo,
          ente: testo(articolo, '.voce-ente'),
          desc: Array.from(articolo.querySelectorAll('.voce-desc')).map((p) => p.textContent.trim()),
          tech: Array.from(articolo.querySelectorAll('.voce-tech li')).map((li) => li.textContent.trim()),
          link: link ? { href: link.getAttribute('href'), testo: link.textContent.trim(), esterno: link.target === '_blank' } : null,
          linea,
          indice,
          voce
        });
      });

      return linea;
    });
  }

  function avviaMappa() {
    const svg = $('mappa');
    if (!svg) return;

    const LINEE = leggiLinee();
    const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vista = $('vista');
    const pannello = $('pannello');
    const contenuto = $('contenuto');
    const riserva = document.querySelector('.riserva');
    const modulo = $('moduloContatti');
    const bottoneCondividi = $('sharePortfolioButton');

    const HUB = { id: 'PORT', x: 600, y: 380, nome: 'PORT', hub: true };
    const perId = { PORT: HUB };
    const vicini = { PORT: [] };
    const stazioni = [];

    LINEE.forEach((linea) => {
      let precedente = HUB;
      linea.nodi.forEach((nodo) => {
        perId[nodo.id] = nodo;
        stazioni.push(nodo);
        vicini[nodo.id] = [precedente.id];
        vicini[precedente.id].push(nodo.id);
        precedente = nodo;
      });
    });

    /* ---------- Disegno ---------- */
    const defs = crea('defs', {}, svg);
    // un fiume morbido attraversa la mappa, come nelle mappe della metro
    crea('path', { class: 'fiume', d: 'M-400,610 C-100,600 120,700 330,650 S640,560 820,590 S1080,720 1300,660 S1600,600 1700,620' }, svg);

    // bagliore delle linee nel tema scuro, come insegne al neon
    const bagliore = crea('filter', { id: 'bagliore', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    crea('feGaussianBlur', { stdDeviation: 7 }, bagliore);

    const gBagliore = crea('g', { class: 'bagliore', filter: 'url(#bagliore)' }, svg);
    const gBordi = crea('g', { class: 'bordi' }, svg);
    const gLinee = crea('g', {}, svg);
    const gPercorso = crea('g', {}, svg);
    const gArchi = crea('g', {}, svg);
    // i treni vivono in un livello a parte, leggero, che segue la mappa in tempo reale:
    // così continuano a muoversi anche mentre la mappa viene spostata o ingrandita
    const svgTreni = crea('svg', { id: 'treni', 'aria-hidden': 'true', focusable: 'false' });
    svg.after(svgTreni);
    const gTreni = crea('g', {}, svgTreni);
    const gEtichette = crea('g', {}, svg);
    const gStazioni = crea('g', {}, svg);

    LINEE.forEach((linea, i) => {
      const ritardo = i * 0.25;
      crea('path', { d: linea.solida, 'data-linea': linea.id, style: `--c:${linea.colore};--d:${ritardo}s`, pathLength: 1 }, gBagliore);
      crea('path', { d: linea.solida + (linea.tratteggio ? ` ${linea.tratteggio}` : ''), 'data-linea': linea.id, style: `--d:${ritardo}s` }, gBordi);
      const g = crea('g', { class: 'linea', 'data-linea': linea.id, style: `--c:${linea.colore};--d:${ritardo}s` }, gLinee);
      linea.pathEl = crea('path', { d: linea.solida, class: 'solida', pathLength: 1 }, g);
      if (linea.tratteggio) crea('path', { d: linea.tratteggio, class: 'tratteggio' }, g);
      // un impulso di luce scorre lungo la linea attiva
      crea('path', { d: linea.solida, class: 'flusso', pathLength: 1 }, g);
      const presa = crea('path', { d: linea.solida + (linea.tratteggio ? ` ${linea.tratteggio}` : ''), class: 'presa' }, g);
      presa.addEventListener('pointerenter', () => g.classList.add('evidenziata'));
      presa.addEventListener('pointerleave', () => g.classList.remove('evidenziata'));
      presa.addEventListener('click', () => { if (!trascinato) filtra(filtro === linea.id ? null : linea.id); });
      linea.g = g;
    });

    stazioni.forEach((nodo) => {
      const { linea } = nodo;
      const ritardo = LINEE.indexOf(linea) * 0.25 + 0.5 + nodo.indice * 0.06;
      const g = crea('g', {
        class: `stazione${nodo.futura ? ' futura' : ''}`,
        'data-linea': linea.id,
        tabindex: 0,
        role: 'button',
        'aria-label': `${linea.nome}: ${nodo.nome}`,
        style: `--c:${linea.colore};--d:${ritardo}s`
      }, gStazioni);
      crea('circle', { class: 'area', cx: nodo.x, cy: nodo.y, r: 18 }, g);
      crea('circle', { class: 'alone', cx: nodo.x, cy: nodo.y, r: 11 }, g);
      crea('circle', { class: 'punto', cx: nodo.x, cy: nodo.y, r: 7 }, g);

      let x = nodo.x;
      let y = nodo.y;
      let ancora = 'start';
      let rotazione = 0;
      switch (nodo.posizione) {
        case 'r': x += 16; y += 5; break;
        case 'l': x -= 16; y += 5; ancora = 'end'; break;
        case 'b': y += 30; ancora = 'middle'; break;
        case 't': y -= 18; ancora = 'middle'; break;
        case 'tr': x += 8; y -= 16; rotazione = -38; break;
        case 'bl': x -= 8; y += 22; ancora = 'end'; rotazione = -38; break;
        default: x += 16;
      }
      const etichetta = crea('text', {
        class: `etichetta-mappa${nodo.futura ? ' futura' : ''}${nodo.titolo === 'SLIDE' ? ' forte' : ''}`,
        x,
        y,
        'text-anchor': ancora,
        'data-linea': linea.id,
        style: `--d:${ritardo + 0.1}s`
      }, gEtichette);
      if (rotazione) etichetta.setAttribute('transform', `rotate(${rotazione} ${x} ${y})`);
      etichetta.textContent = nodo.nome;

      // zoom semantico: avvicinandosi compare l'ente o la prima competenza
      const dettaglio = nodo.futura ? null : (nodo.ente || nodo.tech[0]);
      if (dettaglio) {
        const sotto = crea('text', { class: 'sottoetichetta', x, y: y + 15, 'text-anchor': ancora, 'data-linea': linea.id }, gEtichette);
        if (rotazione) sotto.setAttribute('transform', `rotate(${rotazione} ${x} ${y})`);
        sotto.textContent = dettaglio;
      }

      nodo.g = g;
      nodo.t = etichetta;
      g.addEventListener('click', () => { if (!trascinato) seleziona(nodo, { vola: false }); });
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seleziona(nodo); } });
      g.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') mostraSuggerimento(nodo); });
      g.addEventListener('pointerleave', nascondiSuggerimento);
      g.addEventListener('focus', () => mostraSuggerimento(nodo));
      g.addEventListener('blur', nascondiSuggerimento);
    });

    const hubG = crea('g', { class: 'hub', tabindex: 0, role: 'button', 'aria-label': 'PORT' }, gStazioni);
    crea('circle', { class: 'anello-esterno', cx: HUB.x, cy: HUB.y, r: 36 }, hubG);
    crea('circle', { class: 'anello', cx: HUB.x, cy: HUB.y, r: 22 }, hubG);
    const hubTesto = crea('text', { x: 578, y: 350, 'text-anchor': 'end' }, hubG);
    hubTesto.textContent = 'PORT';
    HUB.g = hubG;
    hubG.addEventListener('click', () => { if (!trascinato) seleziona(HUB, { vola: false }); });
    hubG.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seleziona(HUB); } });

    /* ---------- Geometria delle linee (per percorsi sulle curve) ---------- */
    function misuraLinee() {
      LINEE.forEach((linea) => {
        const tot = linea.pathEl.getTotalLength();
        linea.tot = tot;
        linea.nodi.forEach((nodo) => {
          let migliore = 0;
          let distanza = Infinity;
          for (let l = 0; l <= tot; l += 2) {
            const q = linea.pathEl.getPointAtLength(l);
            const d = (q.x - nodo.x) ** 2 + (q.y - nodo.y) ** 2;
            if (d < distanza) { distanza = d; migliore = l; }
          }
          nodo.len = distanza < 30 ? migliore : null;
        });
      });
    }

    function tratto(a, b) {
      const linea = (a.hub ? b : a).linea;
      const la = a.hub ? 0 : a.len;
      const lb = b.hub ? 0 : b.len;
      if (la == null || lb == null) return [[a.x, a.y], [b.x, b.y]];
      const punti = [];
      const dir = lb > la ? 1 : -1;
      for (let l = la; dir > 0 ? l < lb : l > lb; l += 6 * dir) {
        const q = linea.pathEl.getPointAtLength(l);
        punti.push([q.x, q.y]);
      }
      punti.push([b.x, b.y]);
      return punti;
    }

    /* ---------- Treni: viaggiano da fermata a fermata e sostano in stazione ---------- */
    const VELOCITA = 0.12;
    const SOSTA = 1100;
    const treni = [];

    function preparaTreni() {
      misuraLinee();
      LINEE.forEach((linea, i) => {
        const fermate = [0, ...linea.nodi.map((n) => n.len).filter((l) => l != null)].sort((a, b) => a - b);
        [0, fermate.length - 1].forEach((partenza, k) => {
          if (fermate.length < 2) return;
          const g = crea('g', { class: 'treno', 'data-linea': linea.id, style: `--c:${linea.colore}` }, gTreni);
          crea('circle', { class: 'faro', cx: 9, cy: 0, r: 9 }, g);
          crea('rect', { x: -13, y: -6.5, width: 26, height: 13, rx: 6.5 }, g);
          crea('circle', { class: 'luce', cx: 7, cy: 0, r: 2.5 }, g);
          treni.push({ linea, g, fermate, indice: partenza, dir: k === 0 ? 1 : -1, stato: 'sosta', t0: -i * 700 - k * 1900, da: fermate[partenza], a: fermate[partenza] });
        });
      });
    }

    function posa(treno, l, dir) {
      const p = treno.linea.pathEl;
      const a = p.getPointAtLength(l);
      const b = p.getPointAtLength(Math.min(Math.max(l + dir, 0), treno.linea.tot));
      const angolo = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      treno.g.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${angolo})`);
    }

    function muoviTreni(ora) {
      treni.forEach((treno) => {
        if (treno.stato === 'sosta') {
          posa(treno, treno.a, treno.dir);
          if (ora - treno.t0 < SOSTA) return;
          let prossimo = treno.indice + treno.dir;
          if (prossimo < 0 || prossimo >= treno.fermate.length) { treno.dir *= -1; prossimo = treno.indice + treno.dir; }
          treno.da = treno.fermate[treno.indice];
          treno.a = treno.fermate[prossimo];
          treno.indice = prossimo;
          treno.durata = Math.abs(treno.a - treno.da) / VELOCITA;
          treno.stato = 'corsa';
          treno.t0 = ora;
        }
        const p = Math.min((ora - treno.t0) / treno.durata, 1);
        posa(treno, treno.da + (treno.a - treno.da) * easing(p), treno.dir);
        if (p >= 1) { treno.stato = 'sosta'; treno.t0 = ora; }
      });
      requestAnimationFrame(muoviTreni);
    }

    if (!ridotto) window.setTimeout(() => { preparaTreni(); requestAnimationFrame(muoviTreni); }, 1800);

    /* ---------- Zoom e spostamento ---------- */
    let vb = { x: 0, y: 0, w: CONTENUTO.w, h: CONTENUTO.h };
    let animazione = null;
    const aspetto = () => vista.clientWidth / Math.max(vista.clientHeight, 1);
    const adatta = () => ({ cx: CONTENUTO.x + CONTENUTO.w / 2, cy: CONTENUTO.y + CONTENUTO.h / 2, w: Math.max(CONTENUTO.w, CONTENUTO.h * aspetto()) });
    const W_MIN = 240;
    const wMax = () => adatta().w * 1.4;

    // Durante zoom e spostamenti la mappa già disegnata viene solo traslata e scalata via CSS
    // (lavoro della GPU); il ridisegno vero e nitido avviene una volta sola, a gesto finito.
    let vbDisegnato = null;
    let timerConsolida = null;
    let rafApplica = null;

    function applica() {
      if (rafApplica) return;
      rafApplica = requestAnimationFrame(() => {
        rafApplica = null;
        aggiornaMinimappa();
        aggiornaGriglia();
        svgTreni.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
        nascondiSuggerimento();
        if (!vbDisegnato) { consolida(); return; }
        const scala = vista.clientWidth / vbDisegnato.w;
        const k = vbDisegnato.w / vb.w;
        const tx = k * scala * (vbDisegnato.x - vb.x);
        const ty = k * scala * (vbDisegnato.y - vb.y);
        vista.classList.add('in-movimento');
        svg.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${k})`;
        window.clearTimeout(timerConsolida);
        timerConsolida = window.setTimeout(consolida, 160);
      });
    }

    function consolida() {
      window.clearTimeout(timerConsolida);
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      svgTreni.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      svg.style.transform = '';
      svg.classList.toggle('vicino', vb.w < 640);
      vbDisegnato = { ...vb };
      vista.classList.remove('in-movimento');
    }

    function aggiornaGriglia() {
      const scala = vista.clientWidth / vb.w;
      const passo = 40 * scala;
      vista.style.setProperty('--griglia-passo', `${passo}px`);
      vista.style.setProperty('--griglia-x', `${(-vb.x * scala) % passo}px`);
      vista.style.setProperty('--griglia-y', `${(-vb.y * scala) % passo}px`);
    }

    function imposta(cx, cy, w) {
      const larghezza = Math.min(Math.max(w, W_MIN), wMax());
      const altezza = larghezza / aspetto();
      vb = { x: cx - larghezza / 2, y: cy - altezza / 2, w: larghezza, h: altezza };
      applica();
    }

    function vola(cx, cy, w, durata = 700) {
      cancelAnimationFrame(animazione);
      if (ridotto) { imposta(cx, cy, w); return; }
      const da = { cx: vb.x + vb.w / 2, cy: vb.y + vb.h / 2, w: vb.w };
      const inizio = performance.now();
      const passo = (ora) => {
        const p = Math.min((ora - inizio) / durata, 1);
        const e = easing(p);
        imposta(da.cx + (cx - da.cx) * e, da.cy + (cy - da.cy) * e, da.w + (w - da.w) * e);
        if (p < 1) animazione = requestAnimationFrame(passo);
      };
      animazione = requestAnimationFrame(passo);
    }

    // su mobile il pannello copre la parte bassa: il punto va centrato nella parte visibile
    function scostamento(w) {
      if (window.innerWidth > 960) return 0;
      const v = vista.getBoundingClientRect();
      const cimaFoglio = window.innerHeight - (pannello.offsetHeight - posizioneFoglio(statoFoglio));
      const coperto = Math.max(0, Math.min(v.bottom, window.innerHeight) - cimaFoglio);
      const altezza = Math.min(Math.max(w, W_MIN), wMax()) / aspetto();
      return (coperto / 2) * (altezza / vista.clientHeight);
    }

    function inquadra(nodiDaVedere, margineX = 150, margineY = 120) {
      const xs = nodiDaVedere.map((n) => n.x);
      const ys = nodiDaVedere.map((n) => n.y);
      const minx = Math.min(...xs) - margineX;
      const maxx = Math.max(...xs) + margineX;
      const miny = Math.min(...ys) - margineY;
      const maxy = Math.max(...ys) + margineY;
      const w = Math.max(maxx - minx, (maxy - miny) * aspetto());
      vola((minx + maxx) / 2, (miny + maxy) / 2 + scostamento(w), w);
    }

    function zoomA(fattore, clientX, clientY) {
      cancelAnimationFrame(animazione);
      const r = vista.getBoundingClientRect();
      const px = clientX ?? r.left + r.width / 2;
      const py = clientY ?? r.top + r.height / 2;
      const p = { x: vb.x + (px - r.left) / r.width * vb.w, y: vb.y + (py - r.top) / r.height * vb.h };
      const w = Math.min(Math.max(vb.w * fattore, W_MIN), wMax());
      const k = w / vb.w;
      vb = { x: p.x - (p.x - vb.x) * k, y: p.y - (p.y - vb.y) * k, w, h: w / aspetto() };
      applica();
    }

    const mappaIntera = () => { const f = adatta(); vola(f.cx, f.cy, f.w); };

    svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomA(Math.exp(e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
    svg.addEventListener('dblclick', (e) => { if (!e.target.closest('.stazione, .hub')) zoomA(0.6, e.clientX, e.clientY); });

    const puntatori = new Map();
    let trascinato = false;
    let inizioPan = null;
    let inizioPinch = null;

    svg.addEventListener('pointerdown', (e) => {
      puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY });
      trascinato = false;
      cancelAnimationFrame(animazione);
      if (puntatori.size === 1) inizioPan = { x: e.clientX, y: e.clientY, vb: { ...vb } };
      if (puntatori.size === 2) {
        const [a, b] = [...puntatori.values()];
        inizioPinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), w: vb.w };
      }
    });

    svg.addEventListener('pointermove', (e) => {
      if (!puntatori.has(e.pointerId)) return;
      puntatori.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (puntatori.size === 2 && inizioPinch) {
        const [a, b] = [...puntatori.values()];
        const w = inizioPinch.w * inizioPinch.dist / Math.hypot(a.x - b.x, a.y - b.y);
        zoomA(w / vb.w, (a.x + b.x) / 2, (a.y + b.y) / 2);
        trascinato = true;
        return;
      }

      if (!inizioPan) return;
      const dx = e.clientX - inizioPan.x;
      const dy = e.clientY - inizioPan.y;
      if (!trascinato && Math.hypot(dx, dy) < 6) return;
      if (!trascinato) {
        trascinato = true;
        svg.setPointerCapture(e.pointerId);
        svg.classList.add('trascina');
      }
      const r = vista.getBoundingClientRect();
      vb.x = inizioPan.vb.x - dx / r.width * vb.w;
      vb.y = inizioPan.vb.y - dy / r.height * vb.h;
      applica();
    });

    let ultimoTocco = { t: 0, x: 0, y: 0 };
    const fineTrascinamento = (e) => {
      // doppio tocco su un punto vuoto della mappa: ingrandisce lì
      if (e.type === 'pointerup' && e.pointerType === 'touch' && !trascinato && puntatori.size === 1 && !e.target.closest('.stazione, .hub, .linea')) {
        const ora = performance.now();
        if (ora - ultimoTocco.t < 320 && Math.hypot(e.clientX - ultimoTocco.x, e.clientY - ultimoTocco.y) < 30) {
          zoomA(0.5, e.clientX, e.clientY);
          ultimoTocco.t = 0;
        } else {
          ultimoTocco = { t: ora, x: e.clientX, y: e.clientY };
        }
      }
      puntatori.delete(e.pointerId);
      if (puntatori.size < 2) inizioPinch = null;
      if (puntatori.size === 0) {
        inizioPan = null;
        svg.classList.remove('trascina');
        window.setTimeout(() => { trascinato = false; }, 0);
      } else {
        const [p] = [...puntatori.values()];
        inizioPan = { x: p.x, y: p.y, vb: { ...vb } };
      }
    };
    svg.addEventListener('pointerup', fineTrascinamento);
    svg.addEventListener('pointercancel', fineTrascinamento);

    $('zoomPiu').addEventListener('click', () => zoomA(0.7));
    $('zoomMeno').addEventListener('click', () => zoomA(1.4));
    $('zoomReset').addEventListener('click', mappaIntera);

    /* ---------- Minimappa ---------- */
    const minimappa = $('minimappa');
    const miniSvg = crea('svg', { viewBox: `${CONTENUTO.x} ${CONTENUTO.y} ${CONTENUTO.w} ${CONTENUTO.h}`, preserveAspectRatio: 'xMidYMid meet' }, minimappa);
    LINEE.forEach((linea) => crea('path', { d: linea.solida, style: `--c:${linea.colore}` }, miniSvg));
    const miniRiquadro = crea('rect', {}, miniSvg);

    function aggiornaMinimappa() {
      miniRiquadro.setAttribute('x', vb.x);
      miniRiquadro.setAttribute('y', vb.y);
      miniRiquadro.setAttribute('width', vb.w);
      miniRiquadro.setAttribute('height', vb.h);
      minimappa.classList.toggle('vis', vb.w < adatta().w * 0.85);
    }

    minimappa.addEventListener('click', (e) => {
      const r = minimappa.getBoundingClientRect();
      const scala = Math.max(CONTENUTO.w / r.width, CONTENUTO.h / r.height);
      const offX = (r.width - CONTENUTO.w / scala) / 2;
      const offY = (r.height - CONTENUTO.h / scala) / 2;
      vola(CONTENUTO.x + (e.clientX - r.left - offX) * scala, CONTENUTO.y + (e.clientY - r.top - offY) * scala, vb.w, 450);
    });

    /* ---------- Suggerimento sulla stazione ---------- */
    const suggerimento = $('suggerimento');

    function mostraSuggerimento(nodo) {
      if (trascinato) return;
      const v = vista.getBoundingClientRect();
      suggerimento.style.left = `${(nodo.x - vb.x) / vb.w * v.width}px`;
      suggerimento.style.top = `${(nodo.y - vb.y) / vb.h * v.height}px`;
      suggerimento.style.setProperty('--c', nodo.linea.colore);
      suggerimento.innerHTML = `<small>${esc(nodo.linea.nome)} &middot; ${esc(nodo.num)}</small><strong>${esc(nodo.titolo || nodo.nome)}</strong>${nodo.ente ? `<small>${esc(nodo.ente)}</small>` : ''}`;
      suggerimento.classList.add('vis');
    }

    function nascondiSuggerimento() {
      suggerimento?.classList.remove('vis');
    }

    /* ---------- Legenda e filtro ---------- */
    const legenda = $('legenda');
    let filtro = null;

    LINEE.forEach((linea) => {
      const bottone = document.createElement('button');
      bottone.type = 'button';
      bottone.style.setProperty('--c', linea.colore);
      bottone.setAttribute('aria-pressed', 'false');
      bottone.innerHTML = `<span class="sigla" aria-hidden="true">${esc(linea.id)}</span>${esc(linea.nome)}<span class="num">${esc(linea.num)}</span>`;
      bottone.addEventListener('click', () => filtra(filtro === linea.id ? null : linea.id));
      legenda.appendChild(bottone);
    });

    function filtra(id) {
      filtro = id;
      svg.classList.toggle('filtra', Boolean(id));
      svgTreni.classList.toggle('filtra', Boolean(id));
      svgTreni.querySelectorAll('[data-linea]').forEach((n) => n.classList.toggle('attiva', n.dataset.linea === id));
      svg.querySelectorAll('[data-linea]').forEach((n) => n.classList.toggle('attiva', n.dataset.linea === id));
      Array.from(legenda.children).forEach((b, i) => b.setAttribute('aria-pressed', String(LINEE[i].id === id)));
      if (id) scorri(LINEE.find((l) => l.id === id));
      if (id) inquadra(LINEE.find((l) => l.id === id).nodi.concat(HUB), 160, 120);
    }

    /* ---------- Pannello ---------- */
    let corrente = null;

    // memoria delle stazioni visitate (solo su questo dispositivo)
    const leggi = (chiave) => { try { return JSON.parse(localStorage.getItem(chiave)) || []; } catch (error) { return []; } };
    const scrivi = (chiave, valore) => { try { localStorage.setItem(chiave, JSON.stringify(valore)); } catch (error) { /* solo per questa visita */ } };
    const visitabili = stazioni.filter((s) => !s.futura);
    const visitate = new Set(leggi('pf-visitate').filter((id) => perId[id]));
    let recenti = leggi('pf-recenti').filter((id) => perId[id]);

    function segnaVisitata(nodo) {
      if (nodo.hub) return;
      if (!nodo.futura) visitate.add(nodo.id);
      recenti = [nodo.id, ...recenti.filter((id) => id !== nodo.id)].slice(0, 4);
      scrivi('pf-visitate', [...visitate]);
      scrivi('pf-recenti', recenti);
      nodo.g.classList.add('visitata');
    }
    visitate.forEach((id) => perId[id].g?.classList.add('visitata'));

    function collegati(nodo) {
      const miei = new Set(nodo.tech || []);
      if (!miei.size) return [];
      return stazioni.filter((s) => s !== nodo && s.tech.some((t) => miei.has(t)));
    }

    function pulisciStato() {
      [HUB, ...stazioni].forEach((n) => n.g.classList.remove('selezionata', 'collegata', 'in-percorso'));
      stazioni.forEach((n) => n.t.classList.remove('evidenza'));
      gArchi.replaceChildren();
    }

    // l'impulso di luce scorre sulla linea scelta, o su tutte quando si è a PORT
    function scorri(lineaAttiva) {
      LINEE.forEach((l) => l.g.classList.toggle('scorre', lineaAttiva === 'tutte' || l === lineaAttiva));
    }

    // archi tra stazioni che condividono competenze, come rotte aeree sopra la mappa
    function disegnaArchi(nodo, altri) {
      altri.forEach((altro, i) => {
        const mx = (nodo.x + altro.x) / 2;
        const my = (nodo.y + altro.y) / 2;
        const dx = altro.x - nodo.x;
        const dy = altro.y - nodo.y;
        const k = 0.28;
        const d = `M${nodo.x},${nodo.y} Q${mx - dy * k},${my + dx * k} ${altro.x},${altro.y}`;
        crea('path', { class: 'arco', d, pathLength: 1, style: `--c:${altro.linea.colore};--d:${0.05 + i * 0.08}s` }, gArchi);
      });
    }

    // il modulo contatti e il pulsante condividi sono nodi veri, gestiti da contact.js: vanno conservati
    function rendiPezziFissi() {
      if (modulo && modulo.parentElement !== riserva) riserva.appendChild(modulo);
      if (bottoneCondividi && bottoneCondividi.parentElement !== riserva) riserva.appendChild(bottoneCondividi);
    }

    function riempi(html) {
      rendiPezziFissi();
      contenuto.innerHTML = html;
      contenuto.scrollTop = 0;
    }

    /* foglio mobile a tre posizioni: chiuso (sporge la maniglia), medio, pieno */
    const SBIRCIA = 64;
    let statoFoglio = 'medio';

    function posizioneFoglio(stato) {
      const altezza = pannello.offsetHeight;
      if (stato === 'pieno') return 0;
      if (stato === 'chiuso') return Math.max(altezza - SBIRCIA, 0);
      return Math.max(altezza - Math.min(window.innerHeight * 0.58, 540), 0);
    }

    function impostaFoglio(stato) {
      statoFoglio = stato;
      const aperto = stato !== 'chiuso';
      pannello.classList.toggle('aperto', aperto);
      pannello.dataset.stato = stato;
      $('maniglia').setAttribute('aria-expanded', String(aperto));
      if (window.innerWidth > 960) { pannello.style.removeProperty('--foglio-y'); contenuto.style.paddingBottom = ''; return; }
      const y = posizioneFoglio(stato);
      pannello.style.setProperty('--foglio-y', `${y}px`);
      // la parte del foglio sotto lo schermo diventa spazio di scorrimento: nulla resta tagliato
      contenuto.style.paddingBottom = `calc(${y}px + 28px + env(safe-area-inset-bottom))`;
    }

    function apriPannello(aperto = true) {
      impostaFoglio(aperto ? (statoFoglio === 'pieno' ? 'pieno' : 'medio') : 'chiuso');
    }
    window.addEventListener('resize', () => impostaFoglio(statoFoglio));

    function striscia(linea, qui) {
      const fermate = linea.nodi.map((n) => `<button type="button" class="${n === qui ? 'qui' : ''}${n.futura ? ' futura' : ''}" data-vai="${n.id}" aria-label="${esc(n.nome)}" title="${esc(n.nome)}"></button>`).join('');
      return `<div class="striscia" style="--c:${linea.colore}"><button type="button" class="hub-mini" data-vai="PORT" aria-label="PORT" title="PORT"></button>${fermate}</div>`;
    }

    function seleziona(nodo, { vola: spostaVista = true, daViaggio = false, storia = true } = {}) {
      if (!nodo) return;
      if (!daViaggio) fermaViaggio();
      if (percorsoAttivo()) chiudiPercorso(false);
      pulisciStato();
      corrente = nodo;
      nodo.g.classList.add('selezionata');

      if (nodo.hub) {
        scorri('tutte');
        mostraHub();
      } else {
        const altri = collegati(nodo);
        altri.forEach((s) => { s.g.classList.add('collegata'); s.t.classList.add('evidenza'); });
        scorri(nodo.linea);
        disegnaArchi(nodo, altri);
        mostraStazione(nodo, altri);
      }
      suona(nodo.hub ? 0 : LINEE.indexOf(nodo.linea) + 1);
      segnaVisitata(nodo);

      apriPannello();
      if (spostaVista) {
        const w = Math.min(vb.w, 700);
        vola(nodo.x, nodo.y + scostamento(w), w);
      }
      if (storia && location.hash !== `#${nodo.id}`) history.pushState({ id: nodo.id }, '', `#${nodo.id}`);
    }

    function mostraStazione(nodo, altri) {
      const { linea } = nodo;
      const condivise = new Set(altri.flatMap((s) => s.tech));
      const pos = linea.nodi.indexOf(nodo);
      const prec = pos > 0 ? linea.nodi[pos - 1].id : 'PORT';
      const succ = linea.nodi[pos + 1]?.id || '';
      contenuto.style.setProperty('--c', linea.colore);
      contenuto.style.setProperty('--ct', testoSu(linea.colore));

      let h = `<div class="pan-testa"><span class="sigla" style="--c:${linea.colore}" aria-hidden="true">${esc(linea.id)}</span><span class="pan-linea">${esc(linea.nome)} &middot; ${pos + 1}/${linea.nodi.length}</span>
        <div class="pan-nav"><button type="button" data-vai="${prec}" aria-label="Stazione precedente">${ICONA_PREC}</button><button type="button" data-vai="${succ}" ${succ ? '' : 'disabled'} aria-label="Stazione successiva">${ICONA_SUCC}</button></div></div>`;
      // il cartello della stazione, come quelli smaltati sulle banchine
      h += `<div class="cartello${nodo.futura ? ' futura' : ''}" style="--c:${linea.colore};--ct:${testoSu(linea.colore)}"><span class="cartello-tag">${esc(nodo.tag)} &middot; ${esc(nodo.num)}</span><h2 class="cartello-nome">${esc(nodo.titolo || nodo.nome)}</h2></div>`;
      h += striscia(linea, nodo);
      if (nodo.ente) h += `<p class="pan-ente">${esc(nodo.ente)}</p>`;
      nodo.desc.forEach((p) => { h += `<p class="pan-desc">${esc(p)}</p>`; });
      if (nodo.tech.length) {
        h += `<ul class="pan-tech">${nodo.tech.map((t) => `<li><button type="button" class="${condivise.has(t) ? 'condivisa' : ''}" data-cerca="${esc(t)}">${esc(t)}</button></li>`).join('')}</ul>`;
      }
      if (altri.length) {
        h += `<p class="pan-sezione">Coincidenze</p><ul class="collegamenti">${altri.map((s) => `<li><button type="button" data-vai="${s.id}" style="--c2:${s.linea.colore}"><span class="sigla" style="--c:${s.linea.colore}" aria-hidden="true">${esc(s.linea.id)}</span>${esc(s.nome)}<small>${esc(s.tech.filter((t) => nodo.tech.includes(t)).join(', '))}</small></button></li>`).join('')}</ul>`;
      }
      if (nodo.tipo === 'modulo') h += '<div data-posto="modulo"></div>';
      h += '<div class="azioni">';
      if (nodo.link) h += `<a class="pan-bottone" href="${esc(nodo.link.href)}"${nodo.link.esterno ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(nodo.link.testo)} &rarr;</a>`;
      if (nodo.tipo === 'condividi') h += '<span data-posto="condividi"></span>';
      h += '<button class="pan-bottone secondario" type="button" data-azione="da">Parti da qui</button><button class="pan-bottone secondario" type="button" data-azione="link">Condividi stazione</button></div>';

      riempi(h);
      contenuto.querySelector('[data-posto="modulo"]')?.replaceWith(modulo);
      contenuto.querySelector('[data-posto="condividi"]')?.replaceWith(bottoneCondividi);
    }

    function orario() {
      return new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    }

    function mostraHub() {
      contenuto.style.removeProperty('--c');
      const righe = LINEE.map((linea, i) => {
        const capolinea = linea.nodi[linea.nodi.length - 1];
        return `<button type="button" class="riga" data-vai="${capolinea.id}" style="animation-delay:${0.15 + i * 0.18}s"><span>${esc(linea.id)}</span><span>${esc(linea.nome)} &rsaquo; ${esc(capolinea.nome)}</span><span>${linea.nodi.filter((n) => !n.futura).length}</span></button>`;
      }).join('');
      const scorrimento = stazioni.filter((s) => !s.futura).map((s) => s.nome).join(' · ');
      riempi(`<div class="pan-testa"><span class="sigla sigla-neutra" aria-hidden="true">P</span><span class="pan-linea">PORT</span></div>
        <h2 class="pan-titolo">Portfolio personale di Flavio</h2>
        <div class="tabellone" role="group" aria-label="Tabellone delle linee"><div class="ora"><span>PORT</span><span data-orologio>${orario()}</span></div>${righe}<div class="scorrimento" aria-hidden="true"><span>${esc(scorrimento)}</span></div></div>
        <p class="pan-desc">Ogni linea è una sezione. Tocca una stazione per aprirla, isola una linea dalla legenda, cerca una competenza o calcola un percorso tra due stazioni.</p>`);
      contenuto.querySelectorAll('.tabellone .riga span:nth-child(2)').forEach((el, i) => paletteRotanti(el, 250 + i * 180));

      // quanto della mappa è stato esplorato
      const fatte = visitabili.filter((s) => visitate.has(s.id)).length;
      let extra = `<div class="esplorazione"><div class="esplorazione-testa"><span class="pan-sezione">Esplorazione</span><span>${fatte}/${visitabili.length}</span></div>
        <div class="esplorazione-barra" role="progressbar" aria-label="Stazioni visitate" aria-valuemin="0" aria-valuemax="${visitabili.length}" aria-valuenow="${fatte}"><span style="width:${fatte / visitabili.length * 100}%"></span></div>
        ${fatte === visitabili.length ? '<p class="pan-desc">Hai visitato tutte le stazioni.</p>' : ''}</div>`;

      if (recenti.length) {
        extra += `<p class="pan-sezione">Visitate di recente</p><ul class="collegamenti">${recenti.map((id) => perId[id]).map((n) => `<li><button type="button" data-vai="${n.id}" style="--c2:${n.linea.colore}"><span class="sigla" style="--c:${n.linea.colore}" aria-hidden="true">${esc(n.linea.id)}</span>${esc(n.nome)}<small>${esc(n.linea.nome)}</small></button></li>`).join('')}</ul>`;
      }

      // le competenze più ricorrenti: toccandone una si accendono le stazioni che la contengono
      const conteggio = new Map();
      visitabili.forEach((s) => s.tech.forEach((t) => conteggio.set(t, (conteggio.get(t) || 0) + 1)));
      const competenze = [...conteggio].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it')).slice(0, 16);
      extra += `<p class="pan-sezione">Competenze</p><ul class="competenze">${competenze.map(([t, n]) => `<li><button type="button" data-cerca="${esc(t)}">${esc(t)}${n > 1 ? `<span>${n}</span>` : ''}</button></li>`).join('')}</ul>`;

      contenuto.insertAdjacentHTML('beforeend', extra);
    }

    // le lettere del tabellone girano come le palette prima di fermarsi sul testo giusto
    function paletteRotanti(el, ritardo) {
      if (ridotto) return;
      const finale = el.textContent;
      const segni = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const inizio = performance.now() + ritardo;
      const durata = 650;
      const passo = (ora) => {
        if (!el.isConnected) return;
        const p = (ora - inizio) / durata;
        if (p < 0) { requestAnimationFrame(passo); return; }
        const fermi = Math.floor(Math.min(p, 1) * finale.length);
        el.textContent = finale.split('').map((c, i) => (i < fermi || c === ' ' ? c : segni[Math.floor(Math.random() * segni.length)])).join('');
        if (p < 1) requestAnimationFrame(passo); else el.textContent = finale;
      };
      requestAnimationFrame(passo);
    }

    window.setInterval(() => {
      const orologio = contenuto.querySelector('[data-orologio]');
      if (orologio) orologio.textContent = orario();
    }, 15000);

    contenuto.addEventListener('click', (e) => {
      const vai = e.target.closest('[data-vai]');
      if (vai && vai.dataset.vai) { seleziona(perId[vai.dataset.vai]); return; }
      const competenza = e.target.closest('[data-cerca]');
      if (competenza) { input.value = competenza.dataset.cerca; input.focus(); cerca(); return; }
      const azione = e.target.closest('[data-azione]');
      if (!azione) return;
      if (azione.dataset.azione === 'link') condividiStazione(corrente);
      if (azione.dataset.azione === 'da') apriPercorso(corrente.id);
    });

    /* ---------- Avvisi e condivisione ---------- */
    const toast = $('toast');
    let timerToast = null;
    function avvisa(messaggio) {
      toast.textContent = messaggio;
      toast.classList.add('vis');
      window.clearTimeout(timerToast);
      timerToast = window.setTimeout(() => toast.classList.remove('vis'), 2200);
    }

    async function condividiStazione(nodo) {
      const url = `${location.origin}${location.pathname}#${nodo.id}`;
      try {
        if (navigator.share) {
          await navigator.share({ title: `${nodo.titolo || nodo.nome} - Portflavio`, url });
          return;
        }
        await navigator.clipboard.writeText(url);
        avvisa('Link alla stazione copiato');
      } catch (error) {
        if (error?.name !== 'AbortError') avvisa(url);
      }
    }

    /* ---------- Ricerca ---------- */
    const input = $('cercaInput');
    const lista = $('risultati');
    let risultati = [];
    let attivo = 0;

    // la barra di ricerca è anche una palette di comandi, come nelle app professionali
    function elencoComandi() {
      const scuro = document.documentElement.dataset.theme === 'dark';
      return [
        { nome: 'Viaggio guidato', tasto: 'V', azione: () => bottoneViaggio.click() },
        { nome: 'Calcola percorso', azione: () => apriPercorso(corrente && !corrente.hub ? corrente.id : undefined) },
        { nome: vista.classList.contains('mostra-elenco') ? 'Torna alla mappa' : 'Vista elenco', tasto: 'L', azione: () => bottoneElenco.click() },
        { nome: scuro ? 'Tema chiaro' : 'Tema scuro', azione: () => cambiaTema() },
        { nome: suoniAttivi ? 'Disattiva suoni' : 'Attiva suoni', azione: () => attivaSuoni(!suoniAttivi) },
        { nome: 'Mappa intera', tasto: '0', azione: mappaIntera },
        ...(document.fullscreenEnabled ? [{ nome: document.fullscreenElement ? 'Esci da schermo intero' : 'Schermo intero', tasto: 'F', azione: schermoIntero }] : []),
        ...(visitate.size ? [{ nome: 'Azzera stazioni visitate', azione: azzeraVisitate }] : []),
        { nome: 'Torna a PORT', tasto: 'Esc', azione: () => { filtra(null); seleziona(HUB); } },
        { nome: 'Scorciatoie', tasto: '?', azione: apriAiuto },
        ...LINEE.map((l) => ({ nome: `Linea ${l.nome}`, sigla: l.id, colore: l.colore, azione: () => filtra(l.id) }))
      ];
    }

    function voceRisultato(r, i) {
      const attr = `type="button" role="option" id="ris-${i}" aria-selected="${i === 0}" class="${i === 0 ? 'attivo' : ''}" data-i="${i}"`;
      if (r.tipo === 'comando') {
        const icona = r.c.sigla
          ? `<span class="sigla" style="--c:${r.c.colore}" aria-hidden="true">${esc(r.c.sigla)}</span>`
          : '<span class="sigla sigla-neutra" aria-hidden="true">&rsaquo;</span>';
        return `<li><button ${attr}>${icona}<span>${esc(r.c.nome)}</span>${r.c.tasto ? `<kbd>${esc(r.c.tasto)}</kbd>` : ''}</button></li>`;
      }
      const n = r.nodo;
      return `<li><button ${attr}><span class="sigla" style="--c:${n.linea.colore}" aria-hidden="true">${esc(n.linea.id)}</span><span>${esc(n.nome)}<small>${esc([n.ente, ...n.tech].filter(Boolean).join(' \u00B7 '))}</small></span></button></li>`;
    }

    function cerca() {
      const q = input.value.trim().toLowerCase();
      const comandi = elencoComandi();

      if (!q) {
        pulisciStato();
        if (corrente) corrente.g.classList.add('selezionata');
        if (document.activeElement !== input) { chiudiRisultati(); return; }
        risultati = comandi.map((c) => ({ tipo: 'comando', c }));
      } else {
        const trovate = stazioni.map((nodo) => {
          const campi = [nodo.nome, nodo.titolo, nodo.ente, ...nodo.tech, nodo.linea.nome].filter(Boolean).map((t) => t.toLowerCase());
          const punteggio = Math.max(...campi.map((t, i) => (t.startsWith(q) ? 3 : t.includes(q) ? 1 : 0) * (i === 0 ? 2 : 1)));
          return { tipo: 'stazione', nodo, punteggio };
        }).filter((r) => r.punteggio > 0).sort((a, b) => b.punteggio - a.punteggio).slice(0, 8);
        const azioni = comandi.filter((c) => c.nome.toLowerCase().includes(q)).slice(0, 4).map((c) => ({ tipo: 'comando', c }));
        risultati = [...trovate, ...azioni];
        pulisciStato();
        trovate.forEach((r) => r.nodo.g.classList.add('collegata'));
      }

      attivo = 0;
      lista.innerHTML = risultati.length ? risultati.map(voceRisultato).join('') : '<li class="vuoto">Nessuna stazione</li>';
      lista.classList.add('aperti');
      input.setAttribute('aria-expanded', 'true');
      if (risultati.length) input.setAttribute('aria-activedescendant', 'ris-0');
    }

    function chiudiRisultati() {
      lista.classList.remove('aperti');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }

    function scegli(i) {
      const r = risultati[i];
      if (!r) return;
      chiudiRisultati();
      input.value = '';
      input.blur();
      if (r.tipo === 'comando') r.c.azione();
      else seleziona(r.nodo);
    }

    input.addEventListener('input', cerca);
    input.addEventListener('focus', cerca);
    input.addEventListener('keydown', (e) => {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && risultati.length) {
        e.preventDefault();
        attivo = (attivo + (e.key === 'ArrowDown' ? 1 : -1) + risultati.length) % risultati.length;
        lista.querySelectorAll('button').forEach((b, i) => {
          b.classList.toggle('attivo', i === attivo);
          b.setAttribute('aria-selected', String(i === attivo));
        });
        input.setAttribute('aria-activedescendant', `ris-${attivo}`);
      }
      if (e.key === 'Enter') { e.preventDefault(); scegli(attivo); }
      if (e.key === 'Escape') { input.value = ''; chiudiRisultati(); input.blur(); cerca(); }
    });
    lista.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) scegli(Number(b.dataset.i)); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.cerca')) chiudiRisultati(); });

    /* ---------- Percorso tra due stazioni ---------- */
    const bottonePercorso = $('btnPercorso');
    let tracciato = null;
    const percorsoAttivo = () => bottonePercorso.getAttribute('aria-pressed') === 'true';

    function percorsoMinimo(da, a) {
      const prev = { [da]: null };
      const coda = [da];
      while (coda.length) {
        const c = coda.shift();
        if (c === a) break;
        vicini[c].forEach((v) => { if (!(v in prev)) { prev[v] = c; coda.push(v); } });
      }
      if (!(a in prev)) return [];
      const out = [];
      for (let c = a; c != null; c = prev[c]) out.unshift(perId[c]);
      return out;
    }

    function opzioni() {
      return [HUB, ...stazioni].map((n) => `<option value="${n.id}">${n.hub ? 'PORT' : `${esc(n.linea.id)} · ${esc(n.nome)}`}</option>`).join('');
    }

    function apriPercorso(daId) {
      fermaViaggio();
      bottonePercorso.setAttribute('aria-pressed', 'true');
      contenuto.style.removeProperty('--c');
      riempi(`<div class="pan-testa"><span class="sigla sigla-neutra" aria-hidden="true">${ICONA_PERCORSO}</span><span class="pan-linea">Percorso</span></div>
        <div class="pianifica"><label for="selDa">DA</label><select id="selDa">${opzioni()}</select>
        <button type="button" class="scambia" id="scambia" aria-label="Inverti partenza e arrivo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/></svg></button>
        <label for="selA">A</label><select id="selA">${opzioni()}</select></div>
        <div id="esito" aria-live="polite"></div>`);
      const da = $('selDa');
      const a = $('selA');
      da.value = daId && perId[daId] ? daId : 'R-03';
      a.value = da.value === 'O-06' ? 'R-03' : 'O-06';
      const calcola = () => mostraPercorso(da.value, a.value);
      da.addEventListener('change', calcola);
      a.addEventListener('change', calcola);
      $('scambia').addEventListener('click', () => { [da.value, a.value] = [a.value, da.value]; calcola(); });
      calcola();
      apriPannello();
    }

    function chiudiPercorso(ripristina = true) {
      bottonePercorso.setAttribute('aria-pressed', 'false');
      tracciato?.remove();
      tracciato = null;
      pulisciStato();
      if (ripristina) seleziona(corrente || HUB, { vola: false, storia: false });
    }

    function mostraPercorso(daId, aId) {
      pulisciStato();
      tracciato?.remove();
      const esito = $('esito');
      const percorso = percorsoMinimo(daId, aId);
      if (percorso.length < 2) { esito.innerHTML = '<p class="pan-desc">Scegli due stazioni diverse.</p>'; return; }

      if (!LINEE[0].tot) misuraLinee();
      const punti = [[percorso[0].x, percorso[0].y]];
      for (let i = 1; i < percorso.length; i += 1) punti.push(...tratto(percorso[i - 1], percorso[i]).slice(1));
      tracciato = crea('polyline', { class: 'percorso-tracciato', points: punti.map((q) => q.join(',')).join(' ') }, gPercorso);
      percorso.forEach((n) => n.g.classList.add('in-percorso'));

      const fermate = percorso.length - 1;
      const cambi = percorso.filter((n, i) => n.hub && i > 0 && i < percorso.length - 1).length;
      let h = `<p class="riepilogo">${fermate} ${fermate === 1 ? 'fermata' : 'fermate'} &middot; ${cambi ? 'cambio a PORT' : 'nessun cambio'}</p><ol class="tappe">`;
      percorso.forEach((n, i) => {
        const cambio = n.hub && i > 0 && i < percorso.length - 1;
        const colore = n.hub ? (percorso[i + 1] && !percorso[i + 1].hub ? percorso[i + 1].linea.colore : 'var(--ink)') : n.linea.colore;
        const nota = cambio
          ? `<small>Cambio: ${esc(percorso[i - 1].linea.nome)} &rarr; ${esc(percorso[i + 1].linea.nome)}</small>`
          : (!n.hub && (i === 0 || i === percorso.length - 1) ? `<small>${esc(n.linea.nome)}</small>` : '');
        h += `<li class="${cambio ? 'cambio' : ''}" style="--c:${colore}">${esc(n.nome)}${nota}</li>`;
      });
      esito.innerHTML = `${h}</ol>`;
      inquadra(percorso, 140, 120);
    }

    bottonePercorso.addEventListener('click', () => {
      if (percorsoAttivo()) chiudiPercorso();
      else apriPercorso(corrente && !corrente.hub ? corrente.id : undefined);
    });

    /* ---------- Viaggio guidato ---------- */
    const giro = [HUB, ...LINEE.flatMap((l) => l.nodi)];
    const bottoneViaggio = $('btnViaggio');
    const barra = $('viaggioBarra');
    let timerViaggio = null;
    let passo = 0;
    let inPausa = false;

    function avviaViaggio() {
      if (percorsoAttivo()) chiudiPercorso(false);
      filtra(null);
      passo = 0;
      inPausa = false;
      $('viaggioPausa').innerHTML = ICONA_PAUSA;
      bottoneViaggio.setAttribute('aria-pressed', 'true');
      barra.classList.add('attiva');
      tappaViaggio();
    }

    function tappaViaggio() {
      const nodo = giro[passo];
      const prossima = giro[passo + 1];
      seleziona(nodo, { daViaggio: true, vola: false, storia: false });
      vola(nodo.x, nodo.y + scostamento(520), 520, 900);
      $('viaggioTesto').textContent = `${passo + 1}/${giro.length}${prossima ? ` · Prossima: ${prossima.nome}` : ''}`;
      $('viaggioProgresso').style.width = `${(passo + 1) / giro.length * 100}%`;
      window.clearTimeout(timerViaggio);
      timerViaggio = window.setTimeout(() => {
        if (inPausa) return;
        passo += 1;
        if (passo >= giro.length) { fermaViaggio(); seleziona(HUB); return; }
        tappaViaggio();
      }, 3400);
    }

    function fermaViaggio() {
      if (!barra.classList.contains('attiva')) return;
      window.clearTimeout(timerViaggio);
      timerViaggio = null;
      bottoneViaggio.setAttribute('aria-pressed', 'false');
      barra.classList.remove('attiva');
    }

    bottoneViaggio.addEventListener('click', () => (barra.classList.contains('attiva') ? fermaViaggio() : avviaViaggio()));
    $('viaggioStop').addEventListener('click', fermaViaggio);
    $('viaggioPausa').addEventListener('click', () => {
      inPausa = !inPausa;
      $('viaggioPausa').innerHTML = inPausa ? ICONA_PLAY : ICONA_PAUSA;
      $('viaggioPausa').setAttribute('aria-label', inPausa ? 'Riprendi' : 'Pausa');
      if (!inPausa) {
        passo += 1;
        if (passo < giro.length) tappaViaggio(); else fermaViaggio();
      }
    });

    /* ---------- Vista elenco ---------- */
    const bottoneElenco = $('btnElenco');
    stazioni.forEach((nodo) => {
      nodo.voce.tabIndex = 0;
      nodo.voce.setAttribute('role', 'button');
      nodo.voce.setAttribute('aria-label', `${nodo.linea.nome}: ${nodo.nome}`);
      const apri = () => seleziona(nodo, { vola: false });
      nodo.voce.addEventListener('click', apri);
      nodo.voce.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apri(); } });
    });

    function elenco(attivo) {
      vista.classList.toggle('mostra-elenco', attivo);
      bottoneElenco.setAttribute('aria-pressed', String(attivo));
    }
    bottoneElenco.addEventListener('click', () => elenco(!vista.classList.contains('mostra-elenco')));

    /* ---------- Tema ---------- */
    const bottoneTema = $('btnTema');
    function tema(scuro) {
      document.documentElement.dataset.theme = scuro ? 'dark' : 'light';
      bottoneTema.setAttribute('aria-pressed', String(scuro));
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', scuro ? '#0e0f11' : '#fbfaf7');
      try { localStorage.setItem('pf-tema', scuro ? 'dark' : 'light'); } catch (error) { /* preferenza solo per questa visita */ }
    }
    bottoneTema.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
    // il nuovo tema si apre a cerchio dal pulsante, con la View Transitions API dove disponibile
    function cambiaTema() {
      const scuro = document.documentElement.dataset.theme !== 'dark';
      if (!document.startViewTransition || ridotto) { tema(scuro); return; }
      const r = bottoneTema.getBoundingClientRect();
      document.documentElement.style.setProperty('--vt-x', `${r.left + r.width / 2}px`);
      document.documentElement.style.setProperty('--vt-y', `${r.top + r.height / 2}px`);
      document.startViewTransition(() => tema(scuro));
    }
    bottoneTema.addEventListener('click', cambiaTema);

    function schermoIntero() {
      if (!document.fullscreenEnabled) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    }

    function azzeraVisitate() {
      visitate.clear();
      recenti = [];
      scrivi('pf-visitate', []);
      scrivi('pf-recenti', []);
      stazioni.forEach((n) => n.g.classList.remove('visitata'));
      if (corrente?.hub) mostraHub();
      avvisa('Esplorazione azzerata');
    }

    /* ---------- Suoni (spenti di default) ---------- */
    const bottoneSuono = $('btnSuono');
    let suoniAttivi = false;
    let audio = null;
    try { suoniAttivi = localStorage.getItem('pf-suoni') === '1'; } catch (error) { suoniAttivi = false; }
    bottoneSuono.setAttribute('aria-pressed', String(suoniAttivi));

    function attivaSuoni(on) {
      suoniAttivi = on;
      bottoneSuono.setAttribute('aria-pressed', String(on));
      try { localStorage.setItem('pf-suoni', on ? '1' : '0'); } catch (error) { /* solo per questa visita */ }
      if (on) suona(0);
      avvisa(on ? 'Suoni attivati' : 'Suoni disattivati');
    }
    bottoneSuono.addEventListener('click', () => attivaSuoni(!suoniAttivi));

    // due note morbide, come l'annuncio di una stazione; ogni linea ha la sua tonalità
    function suona(tono) {
      if (!suoniAttivi) return;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        const base = [523.25, 587.33, 659.25, 698.46, 783.99][tono] || 523.25;
        [base, base * 1.25].forEach((frequenza, i) => {
          const osc = audio.createOscillator();
          const vol = audio.createGain();
          const t = audio.currentTime + i * 0.13;
          osc.type = 'sine';
          osc.frequency.value = frequenza;
          vol.gain.setValueAtTime(0, t);
          vol.gain.linearRampToValueAtTime(0.07, t + 0.02);
          vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
          osc.connect(vol).connect(audio.destination);
          osc.start(t);
          osc.stop(t + 0.75);
        });
      } catch (error) {
        /* audio non disponibile */
      }
    }

    /* ---------- Scorciatoie ---------- */
    const aiuto = $('aiuto');
    const apriAiuto = () => { if (aiuto.showModal && !aiuto.open) aiuto.showModal(); };
    $('btnAiuto').addEventListener('click', apriAiuto);
    $('maniglia').addEventListener('click', () => {
      if (Date.now() - fineTrascinoFoglio < 350) return;
      impostaFoglio(statoFoglio === 'chiuso' ? 'medio' : statoFoglio === 'medio' ? 'chiuso' : 'medio');
    });

    /* ---------- Gesti sul foglio mobile ----------
       su e giù: lo trascina tra chiuso, medio e pieno, seguendo il dito;
       destra e sinistra: stazione precedente e successiva sulla stessa linea */
    let tocco = null;
    let fineTrascinoFoglio = 0;

    pannello.addEventListener('touchstart', (e) => {
      if (window.innerWidth > 960 || e.touches.length !== 1) return;
      if (e.target.closest('input, textarea, select, .striscia')) return;
      tocco = {
        x0: e.touches[0].clientX,
        y0: e.touches[0].clientY,
        t0: performance.now(),
        dallaManiglia: Boolean(e.target.closest('#maniglia')),
        inCima: contenuto.scrollTop <= 0,
        base: posizioneFoglio(statoFoglio),
        modo: null,
        dy: 0,
        dx: 0
      };
    }, { passive: true });

    pannello.addEventListener('touchmove', (e) => {
      if (!tocco) return;
      const dx = e.touches[0].clientX - tocco.x0;
      const dy = e.touches[0].clientY - tocco.y0;
      tocco.dx = dx;
      tocco.dy = dy;

      if (!tocco.modo) {
        if (Math.hypot(dx, dy) < 8) return;
        if (Math.abs(dx) > Math.abs(dy) * 1.5 && !tocco.dallaManiglia) { tocco.modo = 'orizzontale'; return; }
        const giu = dy > 0;
        // dal contenuto: giù solo se è già in cima, su solo se il foglio non è ancora pieno
        const puoTrascinare = tocco.dallaManiglia || (giu ? tocco.inCima : statoFoglio !== 'pieno');
        if (!puoTrascinare) { tocco = null; return; }
        tocco.modo = 'foglio';
        pannello.classList.add('trascino');
      }
      if (tocco.modo !== 'foglio') return;
      e.preventDefault();
      const y = Math.min(Math.max(tocco.base + dy, 0), posizioneFoglio('chiuso'));
      pannello.style.setProperty('--foglio-y', `${y}px`);
    }, { passive: false });

    const fineTocco = () => {
      if (!tocco) return;
      const { modo, dx, dy, t0, base } = tocco;
      tocco = null;
      if (modo === 'orizzontale') {
        if (Math.abs(dx) > 60 && corrente && !corrente.hub) {
          const i = corrente.linea.nodi.indexOf(corrente);
          const prossimo = dx < 0 ? corrente.linea.nodi[i + 1] : (corrente.linea.nodi[i - 1] || HUB);
          if (prossimo) {
            pannello.dataset.scorri = dx < 0 ? 'avanti' : 'indietro';
            seleziona(prossimo);
            window.setTimeout(() => { delete pannello.dataset.scorri; }, 450);
          }
        }
        return;
      }
      if (modo !== 'foglio') return;
      fineTrascinoFoglio = Date.now();
      pannello.classList.remove('trascino');
      // dove si fermerebbe il foglio con lo slancio del dito, poi la posizione più vicina
      const velocita = dy / Math.max(performance.now() - t0, 1);
      const arrivo = base + dy + velocita * 180;
      const stati = ['pieno', 'medio', 'chiuso'];
      const vicino = stati.reduce((a, b) => (Math.abs(posizioneFoglio(b) - arrivo) < Math.abs(posizioneFoglio(a) - arrivo) ? b : a));
      impostaFoglio(vicino);
    };
    pannello.addEventListener('touchend', fineTocco);
    pannello.addEventListener('touchcancel', fineTocco);

    // a foglio chiuso, toccare la parte che sporge lo apre
    pannello.addEventListener('click', (e) => {
      if (window.innerWidth > 960 || statoFoglio !== 'chiuso' || e.target.closest('#maniglia')) return;
      if (Date.now() - fineTrascinoFoglio < 350) return;
      impostaFoglio('medio');
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); return; }
      if (e.target.closest('input, textarea, select') || aiuto.open || e.metaKey || e.ctrlKey || e.altKey) return;
      const tasto = e.key.toLowerCase();
      if (tasto === '/') { e.preventDefault(); input.focus(); return; }
      if (tasto === '?') { apriAiuto(); return; }
      if (tasto === '+' || tasto === '=') zoomA(0.7);
      if (tasto === '-') zoomA(1.4);
      if (tasto === '0') mappaIntera();
      if (tasto === 'v') bottoneViaggio.click();
      if (tasto === 'l') bottoneElenco.click();
      if (tasto === 'f') schermoIntero();
      if (tasto === 'escape') { filtra(null); elenco(false); seleziona(HUB); }
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && corrente) {
        e.preventDefault();
        let prossimo;
        if (corrente.hub) prossimo = e.key === 'ArrowRight' ? LINEE[0].nodi[0] : null;
        else {
          const i = corrente.linea.nodi.indexOf(corrente);
          prossimo = e.key === 'ArrowRight' ? corrente.linea.nodi[i + 1] : (corrente.linea.nodi[i - 1] || HUB);
        }
        if (prossimo) { seleziona(prossimo); prossimo.g.focus({ preventScroll: true }); }
      }
    });

    /* ---------- Apertura: una volta per visita ---------- */
    const intro = $('intro');
    let introVista = false;
    try { introVista = sessionStorage.getItem('pf-intro') === '1'; } catch (error) { introVista = false; }

    if (intro && !ridotto && !introVista) {
      let chiusa = false;
      const chiudi = () => {
        if (chiusa) return;
        chiusa = true;
        intro.classList.add('esci');
        svg.classList.remove('in-attesa');
        window.setTimeout(() => intro.remove(), 800);
      };
      svg.classList.add('in-attesa');
      intro.classList.add('attiva');
      paletteRotanti(intro.querySelector('.intro-scritta'), 350);
      window.setTimeout(chiudi, 2400);
      intro.addEventListener('click', chiudi);
      document.addEventListener('keydown', chiudi, { once: true });
      try { sessionStorage.setItem('pf-intro', '1'); } catch (error) { /* si rivedrà alla prossima visita */ }
    } else {
      intro?.remove();
    }

    /* ---------- Avvio ---------- */
    new ResizeObserver(() => imposta(vb.x + vb.w / 2, vb.y + vb.h / 2, vb.w)).observe(vista);

    const f = adatta();
    if (vista.clientWidth < 700) imposta(HUB.x, HUB.y, 620); else imposta(f.cx, f.cy, f.w);

    const daIndirizzo = () => perId[decodeURIComponent(location.hash.slice(1))];
    window.addEventListener('popstate', () => seleziona(daIndirizzo() || HUB, { storia: false }));

    const iniziale = daIndirizzo();
    if (iniziale) window.setTimeout(() => seleziona(iniziale, { storia: false }), 900);
    else seleziona(HUB, { vola: false, storia: false });
    if (window.innerWidth <= 960 && !iniziale) apriPannello(false);
  }

  app.avviaMappa = avviaMappa;
}(window.PortflavioApp));
