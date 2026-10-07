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
  // traduzione dei testi dell'interfaccia (vedi i18n.js)
  const tr = (s) => (app.t ? app.t(s) : s);
  const ETICHETTE_STATO = { regolare: 'Servizio regolare', lavori: 'Lavori in corso', arrivo: 'In arrivo', disponibile: 'Disponibile' };
  const QR_SITO = '<svg class="qr" viewBox="0 0 25 25" role="img" aria-label="Codice QR per www.portflavio.it"><path d="M0 0.5h7m1 0h1m3 0h1m1 0h1m3 0h7m-25 1h1m5 0h1m1 0h2m1 0h3m4 0h1m5 0h1m-25 1h1m1 0h3m1 0h1m1 0h3m2 0h1m4 0h1m1 0h3m1 0h1m-25 1h1m1 0h3m1 0h1m2 0h1m1 0h3m2 0h1m1 0h1m1 0h3m1 0h1m-25 1h1m1 0h3m1 0h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1m-25 1h1m5 0h1m2 0h1m1 0h1m4 0h1m1 0h1m5 0h1m-25 1h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7m-14 1h3m2 0h1m-17 1h1m2 0h6m5 0h2m1 0h1m2 0h1m1 0h3m-23 1h4m2 0h2m2 0h1m2 0h1m1 0h1m1 0h5m-24 1h2m3 0h3m1 0h2m1 0h2m1 0h1m2 0h2m1 0h1m2 0h1m-25 1h1m4 0h1m1 0h2m2 0h2m2 0h2m2 0h1m1 0h4m-24 1h3m1 0h5m2 0h1m2 0h1m2 0h1m5 0h1m-25 1h1m4 0h1m1 0h1m1 0h2m1 0h1m1 0h4m2 0h1m2 0h1m-24 1h2m1 0h4m2 0h2m1 0h2m1 0h1m1 0h2m1 0h5m-25 1h1m1 0h2m4 0h3m1 0h1m2 0h1m1 0h1m1 0h1m1 0h2m1 0h1m-25 1h1m1 0h1m2 0h9m2 0h5m1 0h2m-16 1h2m1 0h3m2 0h1m3 0h1m1 0h2m-24 1h7m1 0h1m2 0h2m3 0h1m1 0h1m1 0h1m3 0h1m-25 1h1m5 0h1m1 0h1m4 0h1m1 0h2m3 0h1m2 0h2m-25 1h1m1 0h3m1 0h1m1 0h2m5 0h6m-21 1h1m1 0h3m1 0h1m1 0h1m1 0h2m1 0h2m1 0h1m1 0h1m4 0h2m-25 1h1m1 0h3m1 0h1m3 0h2m1 0h1m1 0h1m1 0h1m2 0h5m-25 1h1m5 0h1m3 0h3m2 0h1m3 0h2m1 0h3m-25 1h7m1 0h2m2 0h1m3 0h2m3 0h1m2 0h1" stroke="currentColor" fill="none" shape-rendering="crispEdges"/></svg>';
  // testo bianco o nero, a seconda di quanto è chiaro il colore della linea
  const testoSu = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return lum > 0.6 ? '#111111' : '#ffffff';
  };

  // Le linee e le stazioni vengono lette dall'elenco nell'HTML: è l'unica fonte dei contenuti.
  // I testi si rileggono quando cambia la lingua, le posizioni restano.
  function leggiVoce(voce) {
    const articolo = voce.querySelector('article');
    const inglese = app.lingua && app.lingua() === 'en';
    return {
      nome: (inglese && voce.dataset.etichettaEn) || voce.dataset.etichetta,
      tag: testo(articolo, '.voce-tag'),
      titolo: testo(articolo, '.voce-titolo'),
      ente: testo(articolo, '.voce-ente'),
      desc: Array.from(articolo.querySelectorAll('.voce-desc')).map((p) => p.textContent.trim()),
      tech: Array.from(articolo.querySelectorAll('.voce-tech li')).map((li) => li.textContent.trim()),
      // le "uscite" della stazione: sito, certificato verificabile, profilo...
      uscite: Array.from(articolo.querySelectorAll('a.voce-link')).map((a) => ({ href: a.getAttribute('href'), testo: a.textContent.trim(), esterno: a.target === '_blank' })),
      caso: articolo.querySelector('.voce-caso')?.innerHTML.trim() || null,
      anno: voce.dataset.anno || null
    };
  }

  function leggiStato(sezione) {
    const p = sezione.querySelector('.linea-stato');
    return p ? { tipo: p.dataset.stato || 'regolare', testo: p.textContent.trim() } : null;
  }

  function leggiLinee() {
    return Array.from(document.querySelectorAll('.elenco-linea')).map((sezione) => {
      const linea = {
        id: sezione.dataset.linea,
        nome: testo(sezione, '.linea-nome'),
        num: testo(sezione, '.numero'),
        colore: sezione.dataset.colore,
        solida: sezione.dataset.solida,
        tratteggio: sezione.dataset.tratteggio || null,
        cantiere: 'cantiere' in sezione.dataset,
        stato: leggiStato(sezione),
        sezione,
        nodi: []
      };

      sezione.querySelectorAll('.voce').forEach((voce, indice) => {
        linea.nodi.push({
          id: `${linea.id}-${testo(voce, '.voce-num')}`,
          x: Number(voce.dataset.x),
          y: Number(voce.dataset.y),
          posizione: voce.dataset.et,
          tipo: voce.dataset.tipo || null,
          futura: voce.classList.contains('voce-futura'),
          num: testo(voce, '.voce-num'),
          linea,
          indice,
          voce,
          ...leggiVoce(voce)
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
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
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
      const g = crea('g', { class: `linea${linea.cantiere ? ' cantiere' : ''}`, 'data-linea': linea.id, style: `--c:${linea.colore};--d:${ritardo}s` }, gLinee);
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
        class: `etichetta-mappa${nodo.futura ? ' futura' : ''}`,
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
      let sotto = null;
      if (dettaglio) {
        sotto = crea('text', { class: 'sottoetichetta', x, y: y + 15, 'text-anchor': ancora, 'data-linea': linea.id }, gEtichette);
        if (rotazione) sotto.setAttribute('transform', `rotate(${rotazione} ${x} ${y})`);
        sotto.textContent = dettaglio;
      }
      nodo.sotto = sotto;

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

    /* ---------- Geometria delle linee ----------
       Ogni binario viene campionato una volta sola in una tabella di punti (ogni 2 unità).
       Treni, stazioni e percorsi leggono la tabella: niente getPointAtLength a ogni fotogramma,
       che su Safari è lentissimo ed era la causa del lag. */
    const PASSO = 2;

    function campiona(linea) {
      if (linea.tabella) return;
      const tot = linea.pathEl.getTotalLength();
      const n = Math.ceil(tot / PASSO) + 1;
      const tabella = new Float32Array(n * 2);
      for (let i = 0; i < n; i += 1) {
        const q = linea.pathEl.getPointAtLength(Math.min(i * PASSO, tot));
        tabella[i * 2] = q.x;
        tabella[i * 2 + 1] = q.y;
      }
      linea.tot = tot;
      linea.tabella = tabella;
      linea.campioni = n;
    }

    // punto sul binario alla distanza l, interpolato dalla tabella
    function puntoSu(linea, l) {
      const t = linea.tabella;
      const f = Math.min(Math.max(l / PASSO, 0), linea.campioni - 1);
      const i = Math.floor(f);
      const j = Math.min(i + 1, linea.campioni - 1);
      const k = f - i;
      return { x: t[i * 2] + (t[j * 2] - t[i * 2]) * k, y: t[i * 2 + 1] + (t[j * 2 + 1] - t[i * 2 + 1]) * k };
    }

    function misuraLinee() {
      LINEE.forEach((linea) => {
        if (linea.misurata) return;
        campiona(linea);
        const t = linea.tabella;
        linea.nodi.forEach((nodo) => {
          let migliore = 0;
          let distanza = Infinity;
          for (let i = 0; i < linea.campioni; i += 1) {
            const d = (t[i * 2] - nodo.x) ** 2 + (t[i * 2 + 1] - nodo.y) ** 2;
            if (d < distanza) { distanza = d; migliore = i * PASSO; }
          }
          nodo.len = distanza < 30 ? migliore : null;
        });
        linea.misurata = true;
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
        const q = puntoSu(linea, l);
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
      const a = puntoSu(treno.linea, l);
      const b = puntoSu(treno.linea, Math.min(Math.max(l + dir * PASSO, 0), treno.linea.tot));
      const angolo = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      // si scrive solo se il treno si è davvero spostato: i treni in sosta non costano nulla
      const valore = `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${angolo.toFixed(0)})`;
      if (treno.ultimo !== valore) {
        treno.g.setAttribute('transform', valore);
        treno.ultimo = valore;
      }
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
        programmaConsolida();
      });
    }

    // il ridisegno nitido aspetta che il gesto sia finito: mai durante un pizzico o un trascinamento
    function programmaConsolida(attese = 0) {
      window.clearTimeout(timerConsolida);
      timerConsolida = window.setTimeout(() => {
        // con un dito ancora appoggiato aspetta, ma mai più di qualche secondo
        if (puntatori.size > 0 && attese < 25) { programmaConsolida(attese + 1); return; }
        consolida();
      }, 160);
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
    // doppio click per ingrandire solo con il mouse: sui touch i tocchi ravvicinati non fanno zoom
    let ultimoPuntatore = 'mouse';
    svg.addEventListener('pointerdown', (e) => { ultimoPuntatore = e.pointerType; });
    svg.addEventListener('dblclick', (e) => {
      if (ultimoPuntatore !== 'mouse' || e.target.closest('.stazione, .hub')) return;
      zoomA(0.6, e.clientX, e.clientY);
    });

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

    const fineTrascinamento = (e) => {
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
      bottone.addEventListener('click', () => filtra(filtro === linea.id ? null : linea.id));
      legenda.appendChild(bottone);
      linea.bottone = bottone;
    });

    // ogni linea mostra il suo stato del servizio con un pallino: verde regolare, ambra lavori, blu in arrivo
    function disegnaLegenda() {
      LINEE.forEach((linea) => {
        const stato = linea.stato ? `<span class="stato-punto" data-stato="${esc(linea.stato.tipo)}" aria-hidden="true"></span>` : '';
        linea.bottone.innerHTML = `<span class="sigla" aria-hidden="true">${esc(linea.id)}</span>${esc(linea.nome)}<span class="num">${esc(linea.num)}</span>${stato}`;
        linea.bottone.title = linea.stato ? `${linea.nome}: ${linea.stato.testo}` : linea.nome;
      });
    }
    disegnaLegenda();

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
    // su iPhone (Safari 26 e Chrome) la barra del browser galleggia sopra la pagina e ne copre il fondo:
    // il foglio chiuso sporge un po' di più, più quanto lo schermo visibile risulta già ridotto
    const IOS = window.CSS?.supports?.('-webkit-touch-callout', 'none') && navigator.maxTouchPoints > 0;
    function sporgenza() {
      const vv = window.visualViewport;
      const coperto = vv && vv.scale <= 1.01 ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)) : 0;
      return SBIRCIA + (IOS ? 24 : 0) + Math.round(coperto);
    }
    let statoFoglio = 'medio';

    function posizioneFoglio(stato) {
      const altezza = pannello.offsetHeight;
      if (stato === 'pieno') return 0;
      if (stato === 'chiuso') return Math.max(altezza - sporgenza(), 0);
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
      // la posizione è misurata dal fondo del foglio: se la barra del browser cambia l'altezza
      // dello schermo (Safari e Chrome su iPhone), la parte visibile resta la stessa
      const visibile = pannello.offsetHeight - y;
      pannello.style.setProperty('--foglio-y', stato === 'pieno' ? '0px' : `calc(100% - ${visibile}px)`);
      // la parte del foglio sotto lo schermo diventa spazio di scorrimento: nulla resta tagliato
      contenuto.style.paddingBottom = `calc(${y}px + 28px + env(safe-area-inset-bottom))`;
    }

    function apriPannello(aperto = true) {
      impostaFoglio(aperto ? (statoFoglio === 'pieno' ? 'pieno' : 'medio') : 'chiuso');
    }
    window.addEventListener('resize', () => impostaFoglio(statoFoglio));
    // le barre di Safari e Chrome su telefono si mostrano e nascondono senza sempre avvisare con resize
    const riallineaFoglio = () => { if (!pannello.classList.contains('trascino')) impostaFoglio(statoFoglio); };
    window.visualViewport?.addEventListener('resize', riallineaFoglio);
    if (window.ResizeObserver) new ResizeObserver(riallineaFoglio).observe(pannello);

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
        <div class="pan-nav"><button type="button" data-vai="${prec}" aria-label="${esc(tr('Stazione precedente'))}">${ICONA_PREC}</button><button type="button" data-vai="${succ}" ${succ ? '' : 'disabled'} aria-label="${esc(tr('Stazione successiva'))}">${ICONA_SUCC}</button></div></div>`;
      // il cartello della stazione, come quelli smaltati sulle banchine
      h += `<div class="cartello${nodo.futura ? ' futura' : ''}" style="--c:${linea.colore};--ct:${testoSu(linea.colore)}"><span class="cartello-tag">${esc(nodo.tag)} &middot; ${esc(nodo.num)}${nodo.anno ? ` &middot; ${esc(nodo.anno)}` : ''}</span><h2 class="cartello-nome">${esc(nodo.titolo || nodo.nome)}</h2></div>`;
      h += striscia(linea, nodo);
      if (nodo.ente) h += `<p class="pan-ente">${esc(nodo.ente)}</p>`;
      nodo.desc.forEach((p) => { h += `<p class="pan-desc">${esc(p)}</p>`; });
      if (nodo.tech.length) {
        h += `<ul class="pan-tech">${nodo.tech.map((t) => `<li><button type="button" class="${condivise.has(t) ? 'condivisa' : ''}" data-cerca="${esc(t)}">${esc(t)}</button></li>`).join('')}</ul>`;
      }
      // caso di studio: compare solo se è stato scritto nell'HTML
      if (nodo.caso) h += `<p class="pan-sezione">${tr('Caso di studio')}</p><div class="caso-studio">${nodo.caso}</div>`;
      // uscite: link verso l'esterno, come i cartelli d'uscita delle stazioni
      if (nodo.uscite.length) {
        h += `<p class="pan-sezione">${tr('Uscite')}</p><ul class="uscite">${nodo.uscite.map((u) => `<li><a href="${esc(u.href)}"${u.esterno ? ' target="_blank" rel="noopener noreferrer"' : ''}><span class="uscita-freccia" aria-hidden="true">&#8599;</span>${esc(u.testo)}</a></li>`).join('')}</ul>`;
      }
      if (altri.length) {
        h += `<p class="pan-sezione">${tr('Coincidenze')}</p><ul class="collegamenti">${altri.map((s) => `<li><button type="button" data-vai="${s.id}" style="--c2:${s.linea.colore}"><span class="sigla" style="--c:${s.linea.colore}" aria-hidden="true">${esc(s.linea.id)}</span>${esc(s.nome)}<small>${esc(s.tech.filter((t) => nodo.tech.includes(t)).join(', '))}</small></button></li>`).join('')}</ul>`;
      }
      if (nodo.tipo === 'modulo') h += '<div data-posto="modulo"></div>';
      h += '<div class="azioni">';
      if (nodo.tipo === 'condividi') h += '<span data-posto="condividi"></span>';
      h += `<button class="pan-bottone secondario" type="button" data-azione="da">${tr('Parti da qui')}</button><button class="pan-bottone secondario" type="button" data-azione="link">${tr('Condividi stazione')}</button></div>`;

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
      // il tabellone fa scorrere gli annunci di servizio, come nelle stazioni vere
      const annunci = LINEE.filter((l) => l.stato).map((l) => `${l.nome}: ${l.stato.testo}`).join('   \u00B7   ');
      riempi(`<div class="pan-testa"><span class="sigla sigla-neutra" aria-hidden="true">P</span><span class="pan-linea">PORT</span></div>
        <h2 class="pan-titolo">${tr('Portfolio personale di Flavio')}</h2>
        <div class="tabellone" role="group" aria-label="${esc(tr('Tabellone delle linee'))}"><div class="ora"><span>PORT</span><span data-orologio>${orario()}</span></div>${righe}<div class="scorrimento" aria-hidden="true"><span>${esc(annunci)}</span></div></div>
        <div class="azioni azioni-port">
          <button type="button" class="pan-bottone" data-azione="biglietto"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6z"/></svg>${tr('Il tuo biglietto')}</button>
          <button type="button" class="pan-bottone secondario" data-azione="poster"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>${tr('Scarica il poster')}</button>
        </div>`);
      contenuto.querySelectorAll('.tabellone .riga span:nth-child(2)').forEach((el, i) => paletteRotanti(el, 250 + i * 180));

      // stato del servizio di ogni linea
      let extra = `<p class="pan-sezione">${tr('Stato del servizio')}</p><ul class="stato-servizio">${LINEE.filter((l) => l.stato).map((l) => `<li><button type="button" data-filtra="${l.id}"><span class="sigla" style="--c:${l.colore}" aria-hidden="true">${esc(l.id)}</span><span class="stato-testo"><strong>${esc(l.nome)}</strong>${esc(l.stato.testo)}</span><span class="stato-etichetta" data-stato="${esc(l.stato.tipo)}">${tr(ETICHETTE_STATO[l.stato.tipo] || 'Servizio regolare')}</span></button></li>`).join('')}</ul>`;

      // orari: compaiono quando le stazioni hanno l'anno (data-anno nell'HTML)
      const datate = stazioni.filter((n) => n.anno).sort((a, b) => String(b.anno).localeCompare(String(a.anno)));
      if (datate.length) {
        extra += `<p class="pan-sezione">${tr('Orari')}</p><ol class="orari">${datate.map((n) => `<li><button type="button" data-vai="${n.id}" style="--c:${n.linea.colore}"><span class="orari-anno">${esc(n.anno)}</span><span>${esc(n.nome)}</span></button></li>`).join('')}</ol>`;
      }

      // quanto della mappa è stato esplorato
      const fatte = visitabili.filter((s) => visitate.has(s.id)).length;
      extra += `<div class="esplorazione"><div class="esplorazione-testa"><span class="pan-sezione">${tr('Esplorazione')}</span><span>${fatte}/${visitabili.length}</span></div>
        <div class="esplorazione-barra" role="progressbar" aria-label="${esc(tr('Stazioni visitate'))}" aria-valuemin="0" aria-valuemax="${visitabili.length}" aria-valuenow="${fatte}"><span style="width:${fatte / visitabili.length * 100}%"></span></div>
        ${fatte === visitabili.length ? `<p class="pan-desc">${tr('Hai visitato tutte le stazioni.')}</p>` : ''}</div>`;

      if (recenti.length) {
        extra += `<p class="pan-sezione">${tr('Visitate di recente')}</p><ul class="collegamenti">${recenti.map((id) => perId[id]).map((n) => `<li><button type="button" data-vai="${n.id}" style="--c2:${n.linea.colore}"><span class="sigla" style="--c:${n.linea.colore}" aria-hidden="true">${esc(n.linea.id)}</span>${esc(n.nome)}<small>${esc(n.linea.nome)}</small></button></li>`).join('')}</ul>`;
      }

      // le competenze più ricorrenti: toccandone una si accendono le stazioni che la contengono
      const conteggio = new Map();
      visitabili.forEach((s) => s.tech.forEach((t) => conteggio.set(t, (conteggio.get(t) || 0) + 1)));
      const competenze = [...conteggio].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it')).slice(0, 16);
      extra += `<p class="pan-sezione">${tr('Competenze')}</p><ul class="competenze">${competenze.map(([t, n]) => `<li><button type="button" data-cerca="${esc(t)}">${esc(t)}${n > 1 ? `<span>${n}</span>` : ''}</button></li>`).join('')}</ul>`;

      extra += `<p class="pan-desc pan-nota">${tr('Ogni linea è una sezione. Tocca una stazione per aprirla, isola una linea dalla legenda, cerca una competenza o calcola un percorso tra due stazioni.')}</p>`;
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
      if (azione.dataset.azione === 'biglietto') apriBiglietto();
      if (azione.dataset.azione === 'poster') scaricaPoster();
    });
    contenuto.addEventListener('click', (e) => {
      const linea = e.target.closest('[data-filtra]');
      if (linea) filtra(linea.dataset.filtra);
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
        avvisa(tr('Link alla stazione copiato'));
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
        { nome: tr(viaggioAttivo() ? (inPausa ? 'Riprendi il viaggio' : 'Metti in pausa il viaggio') : 'Viaggio guidato'), tasto: 'V', azione: () => bottoneViaggio.click() },
        { nome: tr('Il tuo biglietto (CV da stampare)'), tasto: 'B', azione: apriBiglietto },
        { nome: tr('Scarica il poster della mappa'), azione: scaricaPoster },
        { nome: app.lingua && app.lingua() === 'en' ? 'Italiano' : 'English', tasto: 'E', azione: cambiaLingua },
        { nome: tr('Calcola percorso'), azione: () => apriPercorso(corrente && !corrente.hub ? corrente.id : undefined) },
        { nome: tr(vista.classList.contains('mostra-elenco') ? 'Torna alla mappa' : 'Vista elenco'), tasto: 'L', azione: () => bottoneElenco.click() },
        { nome: tr(scuro ? 'Tema chiaro' : 'Tema scuro'), azione: () => cambiaTema() },
        ...(temaAuto ? [] : [{ nome: tr('Tema automatico (scuro di notte)'), azione: temaAutomatico }]),
        { nome: tr(suoniAttivi ? 'Disattiva suoni' : 'Attiva suoni'), azione: () => attivaSuoni(!suoniAttivi) },
        { nome: tr('Mappa intera'), tasto: '0', azione: mappaIntera },
        ...(document.fullscreenEnabled ? [{ nome: tr(document.fullscreenElement ? 'Esci da schermo intero' : 'Schermo intero'), tasto: 'F', azione: schermoIntero }] : []),
        ...(visitate.size ? [{ nome: tr('Azzera stazioni visitate'), azione: azzeraVisitate }] : []),
        { nome: tr('Torna a PORT'), tasto: 'Esc', azione: () => { filtra(null); seleziona(HUB); } },
        ...(touch ? [] : [{ nome: tr('Scorciatoie'), tasto: '?', azione: apriAiuto }]),
        ...LINEE.map((l) => ({ nome: `${tr('Linea')} ${l.nome}`, sigla: l.id, colore: l.colore, azione: () => filtra(l.id) }))
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
      lista.innerHTML = risultati.length ? risultati.map(voceRisultato).join('') : `<li class="vuoto">${tr('Nessuna stazione')}</li>`;
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
      riempi(`<div class="pan-testa"><span class="sigla sigla-neutra" aria-hidden="true">${ICONA_PERCORSO}</span><span class="pan-linea">${tr('Percorso')}</span></div>
        <div class="pianifica"><label for="selDa">${tr('DA')}</label><select id="selDa">${opzioni()}</select>
        <button type="button" class="scambia" id="scambia" aria-label="${esc(tr('Inverti partenza e arrivo'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/></svg></button>
        <label for="selA">${tr('A')}</label><select id="selA">${opzioni()}</select></div>
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
      if (percorso.length < 2) { esito.innerHTML = `<p class="pan-desc">${tr('Scegli due stazioni diverse.')}</p>`; return; }

      misuraLinee();
      const punti = [[percorso[0].x, percorso[0].y]];
      for (let i = 1; i < percorso.length; i += 1) punti.push(...tratto(percorso[i - 1], percorso[i]).slice(1));
      tracciato = crea('polyline', { class: 'percorso-tracciato', points: punti.map((q) => q.join(',')).join(' ') }, gPercorso);
      percorso.forEach((n) => n.g.classList.add('in-percorso'));

      const fermate = percorso.length - 1;
      const cambi = percorso.filter((n, i) => n.hub && i > 0 && i < percorso.length - 1).length;
      let h = `<p class="riepilogo">${fermate} ${tr(fermate === 1 ? 'fermata' : 'fermate')} &middot; ${tr(cambi ? 'cambio a PORT' : 'nessun cambio')}</p><ol class="tappe">`;
      percorso.forEach((n, i) => {
        const cambio = n.hub && i > 0 && i < percorso.length - 1;
        const colore = n.hub ? (percorso[i + 1] && !percorso[i + 1].hub ? percorso[i + 1].linea.colore : 'var(--ink)') : n.linea.colore;
        const nota = cambio
          ? `<small>${tr('Cambio:')} ${esc(percorso[i - 1].linea.nome)} &rarr; ${esc(percorso[i + 1].linea.nome)}</small>`
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
    const iconaViaggio = bottoneViaggio.querySelector('svg');
    const barra = $('viaggioBarra');
    let timerViaggio = null;
    let passo = 0;
    let inPausa = false;
    let scadenza = 0;
    let residuo = 0;
    const viaggioAttivo = () => barra.classList.contains('attiva');

    // il tempo su ogni fermata dipende da quanto c'è da leggere: da 5 a 15 secondi
    function durataTappa(nodo) {
      if (nodo.hub) return 8000;
      const testo = [nodo.titolo || nodo.nome, nodo.ente, ...nodo.desc, ...nodo.tech].filter(Boolean).join(' ');
      const parole = testo.split(/\s+/).length;
      return Math.min(Math.max(5000, 2000 + parole * 280), 15000);
    }

    // pulsante in testata e pulsante nella barra mostrano sempre lo stesso stato: ▶ o ⏸
    function aggiornaComandiViaggio() {
      const attivo = viaggioAttivo();
      const mostraPausa = attivo && !inPausa;
      iconaViaggio.innerHTML = mostraPausa ? '<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>' : '<path d="M7 4l12 8-12 8z"/>';
      bottoneViaggio.setAttribute('aria-pressed', String(attivo));
      bottoneViaggio.title = tr(!attivo ? 'Viaggio guidato' : (inPausa ? 'Riprendi il viaggio' : 'Metti in pausa il viaggio'));
      bottoneViaggio.setAttribute('aria-label', bottoneViaggio.title);
      $('viaggioPausa').innerHTML = mostraPausa ? ICONA_PAUSA : ICONA_PLAY;
      $('viaggioPausa').setAttribute('aria-label', tr(inPausa ? 'Riprendi' : 'Pausa'));
      barra.classList.toggle('in-pausa', inPausa);
    }

    function programmaTappa(ms) {
      window.clearTimeout(timerViaggio);
      scadenza = performance.now() + ms;
      barra.style.setProperty('--tappa', `${ms}ms`);
      timerViaggio = window.setTimeout(prossimaTappa, ms);
    }

    function prossimaTappa() {
      passo += 1;
      if (passo >= giro.length) { fermaViaggio(); seleziona(HUB); return; }
      tappaViaggio();
    }

    function avviaViaggio() {
      if (percorsoAttivo()) chiudiPercorso(false);
      filtra(null);
      passo = 0;
      inPausa = false;
      barra.classList.add('attiva');
      aggiornaComandiViaggio();
      tappaViaggio();
    }

    function tappaViaggio() {
      const nodo = giro[passo];
      const prossima = giro[passo + 1];
      seleziona(nodo, { daViaggio: true, vola: false, storia: false });
      vola(nodo.x, nodo.y + scostamento(520), 520, 900);
      $('viaggioTesto').textContent = `${passo + 1}/${giro.length}${prossima ? ` · ${tr('Prossima:')} ${prossima.nome}` : ''}`;
      $('viaggioProgresso').style.width = `${(passo + 1) / giro.length * 100}%`;
      // il conto alla rovescia della fermata riparte da capo
      barra.classList.remove('conta');
      void barra.offsetWidth;
      barra.classList.add('conta');
      if (inPausa) { residuo = durataTappa(nodo); return; }
      programmaTappa(durataTappa(nodo));
    }

    function pausaViaggio(pausa) {
      if (!viaggioAttivo() || pausa === inPausa) return;
      inPausa = pausa;
      if (pausa) {
        residuo = Math.max(scadenza - performance.now(), 1200);
        window.clearTimeout(timerViaggio);
      } else {
        programmaTappa(residuo);
      }
      aggiornaComandiViaggio();
    }

    function fermaViaggio() {
      if (!viaggioAttivo()) return;
      window.clearTimeout(timerViaggio);
      timerViaggio = null;
      inPausa = false;
      barra.classList.remove('attiva', 'conta');
      aggiornaComandiViaggio();
    }

    bottoneViaggio.addEventListener('click', () => (viaggioAttivo() ? pausaViaggio(!inPausa) : avviaViaggio()));
    $('viaggioStop').addEventListener('click', fermaViaggio);
    $('viaggioPausa').addEventListener('click', () => pausaViaggio(!inPausa));

    // se durante il viaggio tocchi o scorri la scheda per leggere, il viaggio si mette in pausa
    const pausaPerLettura = () => {
      if (!viaggioAttivo() || inPausa) return;
      pausaViaggio(true);
      avvisa(tr('Viaggio in pausa: premi ▶ per riprendere'));
    };
    contenuto.addEventListener('wheel', pausaPerLettura, { passive: true });
    contenuto.addEventListener('touchstart', pausaPerLettura, { passive: true });

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

    /* ---------- Tema: scelto a mano, oppure automatico (scuro dalle 20 alle 7) ---------- */
    const bottoneTema = $('btnTema');
    let temaAuto = document.documentElement.dataset.temaAuto === '1';
    const notte = () => { const ora = new Date().getHours(); return ora >= 20 || ora < 7; };

    function applicaTema(scuro) {
      document.documentElement.dataset.theme = scuro ? 'dark' : 'light';
      bottoneTema.setAttribute('aria-pressed', String(scuro));
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', scuro ? '#0e0f11' : '#fbfaf7');
    }

    function tema(scuro) {
      temaAuto = false;
      delete document.documentElement.dataset.temaAuto;
      applicaTema(scuro);
      try { localStorage.setItem('pf-tema', scuro ? 'dark' : 'light'); } catch (error) { /* preferenza solo per questa visita */ }
    }

    function temaAutomatico() {
      temaAuto = true;
      document.documentElement.dataset.temaAuto = '1';
      try { localStorage.removeItem('pf-tema'); } catch (error) { /* nulla da togliere */ }
      applicaTema(notte());
      avvisa(tr('Tema automatico: scuro dalle 20 alle 7'));
    }

    // come una città che accende le luci: la sera il tema automatico passa da solo al neon
    window.setInterval(() => {
      if (temaAuto && (document.documentElement.dataset.theme === 'dark') !== notte()) applicaTema(notte());
    }, 60000);
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
      avvisa(tr('Esplorazione azzerata'));
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
      avvisa(tr(on ? 'Suoni attivati' : 'Suoni disattivati'));
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
      if (e.target.closest('input, textarea, select') || aiuto.open || finestraBiglietto?.open || e.metaKey || e.ctrlKey || e.altKey) return;
      const tasto = e.key.toLowerCase();
      if (tasto === '/') { e.preventDefault(); input.focus(); return; }
      if (tasto === '?') { apriAiuto(); return; }
      if (tasto === '+' || tasto === '=') zoomA(0.7);
      if (tasto === '-') zoomA(1.4);
      if (tasto === '0') mappaIntera();
      if (tasto === 'v') bottoneViaggio.click();
      if (tasto === 'l') bottoneElenco.click();
      if (tasto === 'f') schermoIntero();
      if (tasto === 'b') apriBiglietto();
      if (tasto === 'e') cambiaLingua();
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

    /* ---------- Il biglietto: un CV in forma di biglietto della metro ---------- */
    const finestraBiglietto = $('biglietto');
    const scenaBiglietto = $('bigliettoScena');
    const EMAIL = 'info@portflavio.it';
    const LINKEDIN = 'https://www.linkedin.com/in/flavio-iachini-b306b8198';

    function costruisciBiglietto() {
      const anno = new Date().getFullYear();
      const perLinea = (id) => LINEE.find((l) => l.id === id);
      const vere = (l) => (l ? l.nodi.filter((n) => !n.futura) : []);
      const conta = stazioni.filter((n) => !n.futura).length;
      const intestazione = (l, sottotitolo) => `<h3 class="b-linea-titolo"><span class="sigla" style="--c:${l.colore}" aria-hidden="true">${esc(l.id)}</span>${esc(l.nome)}<small>${sottotitolo}</small><span class="b-conta">${vere(l).length}</span></h3>`;
      const sito = (n) => n.uscite.find((u) => u.esterno)?.href.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const seriale = `PF-${anno}-${String(conta).padStart(2, '0')}${LINEE.map((l) => l.id).join('')}`;

      const R = perLinea('R');
      const O = perLinea('O');
      const P = perLinea('P');
      const cantiere = LINEE.filter((l) => l.cantiere);

      let h = `<article class="biglietto" lang="${app.lingua ? app.lingua() : 'it'}">
        <header class="b-testa">
          <div class="b-bande" aria-hidden="true">${LINEE.filter((l) => !l.cantiere).map((l) => `<span style="--c:${l.colore}"></span>`).join('')}</div>
          <div class="b-intestazione">
            <div>
              <p class="b-micro">${tr('Biglietto')} &middot; PASS ${anno}</p>
              <h2 class="b-marchio" id="bigliettoTitolo">PORTFLAVIO</h2>
              <p class="b-sotto">${tr('Portfolio personale di Flavio')}</p>
            </div>
            <svg class="b-snodo" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6v20" stroke="#d7262b"/><path d="M6 32h20" stroke="#1f4fa3"/><path d="M38 32h20" stroke="#0f8a4a"/><path d="M32 38v20" stroke="#e8a200"/><circle cx="32" cy="32" r="9"/></svg>
          </div>
          <dl class="b-campi">
            <div><dt>${tr('Passeggero')}</dt><dd>Flavio</dd></div>
            <div><dt>${tr('Linee')}</dt><dd>${LINEE.map((l) => esc(l.id)).join(' ')}</dd></div>
            <div><dt>${tr('Stazioni')}</dt><dd>${conta}</dd></div>
            <div><dt>${tr('Validità')}</dt><dd>${anno}</dd></div>
          </dl>
        </header>
        <div class="b-strappo" aria-hidden="true"></div>
        <div class="b-corpo">`;

      if (R) {
        h += `<section class="b-linea" style="--c:${R.colore}">${intestazione(R, tr('Esperienze'))}<ol class="b-fermate">${vere(R).map((n) => `
          <li><span class="b-punto" aria-hidden="true"></span><div>
            <p class="b-titolo"><strong>${esc(n.titolo || n.nome)}</strong>${n.anno ? `<span class="b-anno">${esc(n.anno)}</span>` : ''}</p>
            ${n.ente ? `<p class="b-ente">${esc(n.ente)}</p>` : ''}
            ${n.desc[0] ? `<p class="b-desc">${esc(n.desc[0])}</p>` : ''}
            ${n.tech.length ? `<p class="b-tech">${n.tech.map(esc).join(' &middot; ')}</p>` : ''}
          </div></li>`).join('')}</ol></section>`;
      }
      if (O) {
        h += `<section class="b-linea" style="--c:${O.colore}">${intestazione(O, tr('Certificazioni'))}<ol class="b-griglia">${vere(O).map((n) => `
          <li><span class="b-punto" aria-hidden="true"></span><div><strong>${esc(n.titolo || n.nome)}</strong><span>${esc((n.ente || '').replace(/\.$/, ''))}${n.anno ? ` &middot; ${esc(n.anno)}` : ''}</span></div></li>`).join('')}</ol></section>`;
      }
      h += '<div class="b-doppia">';
      if (P) {
        h += `<section class="b-linea" style="--c:${P.colore}">${intestazione(P, tr('Progetti'))}<ol class="b-fermate">${vere(P).map((n) => `
          <li><span class="b-punto" aria-hidden="true"></span><div><p class="b-titolo"><strong>${esc(n.titolo || n.nome)}</strong><span class="b-stato">${esc(n.tag.replace(/[[\]]/g, ''))}</span></p>
          ${n.desc[0] ? `<p class="b-desc">${esc(n.desc[0])}</p>` : ''}${sito(n) ? `<p class="b-tech">${esc(sito(n))}</p>` : ''}</div></li>`).join('')}</ol></section>`;
      }
      const T = perLinea('T');
      h += `<section class="b-linea" style="--c:${T ? T.colore : '#e8a200'}"><h3 class="b-linea-titolo"><span class="sigla" style="--c:${T ? T.colore : '#e8a200'}" aria-hidden="true">T</span>Text<small>${tr('Contatti')}</small></h3>
        <ul class="b-contatti"><li><span>${tr('Email')}</span>${EMAIL}</li><li><span>LinkedIn</span>linkedin.com/in/flavio-iachini-b306b8198</li><li><span>${tr('Mappa')}</span>www.portflavio.it</li></ul></section>`;
      h += '</div>';
      cantiere.forEach((l) => {
        h += `<section class="b-linea b-cantiere" style="--c:${l.colore}">${intestazione(l, tr('In costruzione'))}<ol class="b-griglia">${vere(l).map((n) => `<li><span class="b-punto" aria-hidden="true"></span><div><strong>${esc(n.titolo || n.nome)}</strong><span>${esc(n.anno || '')}</span></div></li>`).join('')}</ol></section>`;
      });

      h += `</div>
        <div class="b-strappo" aria-hidden="true"></div>
        <footer class="b-piede">
          <div class="b-qr">${QR_SITO}<p>${tr('Inquadra per aprire la mappa')}</p></div>
          <div class="b-codice">
            <span class="b-barre" aria-hidden="true"></span>
            <span class="b-seriale">${seriale}</span>
            <p class="b-nota">${tr('Valido su tutte le linee')} &middot; www.portflavio.it</p>
          </div>
        </footer>
      </article>`;
      return h;
    }

    function apriBiglietto() {
      if (!finestraBiglietto?.showModal) return;
      scenaBiglietto.innerHTML = costruisciBiglietto();
      if (!finestraBiglietto.open) finestraBiglietto.showModal();
    }

    $('btnBiglietto')?.addEventListener('click', apriBiglietto);
    $('bigliettoStampa')?.addEventListener('click', () => {
      document.body.classList.add('stampa-biglietto');
      window.print();
    });
    window.addEventListener('afterprint', () => document.body.classList.remove('stampa-biglietto'));

    /* ---------- Poster: la mappa come immagine da condividere ---------- */
    const PROPRIETA = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-size', 'font-weight', 'font-family', 'paint-order', 'letter-spacing', 'display', 'visibility'];

    async function scaricaPoster() {
      avvisa(tr('Preparo il poster...'));
      const sfondo = getComputedStyle(document.body).backgroundColor;
      const inchiostro = getComputedStyle(document.body).color;
      const copia = svg.cloneNode(true);
      const originali = svg.querySelectorAll('*');
      const copie = copia.querySelectorAll('*');
      // gli stili vengono scritti dentro gli elementi: l'immagine non conosce il CSS del sito
      originali.forEach((el, i) => {
        const stile = getComputedStyle(el);
        copie[i].setAttribute('style', PROPRIETA.map((p) => `${p}:${stile.getPropertyValue(p)}`).join(';'));
      });
      // il poster mostra la mappa completa e ferma, qualunque sia lo stato delle animazioni
      copia.querySelectorAll('.arco, .percorso-tracciato, .flusso, .alone, .presa, .area, .sottoetichetta').forEach((n) => n.remove());
      copia.querySelectorAll('*').forEach((n) => { n.style.opacity = '1'; n.style.display = ''; });
      copia.querySelectorAll('.solida, .bagliore path').forEach((n) => { n.style.strokeDasharray = 'none'; });
      copia.querySelectorAll('.punto').forEach((n) => { n.setAttribute('r', 7); n.style.fill = sfondo; });
      copia.querySelectorAll('.etichetta-mappa').forEach((n) => { n.style.opacity = '1'; });

      const larghezza = 1320;
      const altezza = 1020;
      const poster = crea('svg', { viewBox: `-60 -200 ${larghezza} ${altezza}`, width: larghezza * 2, height: altezza * 2 });
      crea('rect', { x: -60, y: -200, width: larghezza, height: altezza, fill: sfondo }, poster);
      const titolo = crea('text', { x: 0, y: -110, style: `font: 800 72px Inter, Helvetica, Arial, sans-serif; fill:${inchiostro}; letter-spacing:-2px` }, poster);
      titolo.textContent = 'PORT';
      const sotto = crea('text', { x: 4, y: -72, style: `font: 600 22px Inter, Helvetica, Arial, sans-serif; fill:${inchiostro}` }, poster);
      sotto.textContent = tr('Portfolio personale di Flavio');
      LINEE.forEach((l, i) => {
        const x = 760 + i * 120;
        crea('circle', { cx: x, cy: -100, r: 16, fill: l.colore }, poster);
        const lettera = crea('text', { x, y: -93, 'text-anchor': 'middle', style: 'font: 800 18px Inter, Helvetica, Arial, sans-serif; fill:#fff' }, poster);
        lettera.textContent = l.id;
        const nome = crea('text', { x: x + 24, y: -94, style: `font: 600 16px Inter, Helvetica, Arial, sans-serif; fill:${inchiostro}` }, poster);
        nome.textContent = l.nome;
      });
      const mappa = crea('g', {}, poster);
      Array.from(copia.childNodes).forEach((n) => mappa.appendChild(n));
      const piede = crea('text', { x: 0, y: 780, style: `font: 700 20px Inter, Helvetica, Arial, sans-serif; fill:${inchiostro}` }, poster);
      piede.textContent = 'www.portflavio.it';

      const dati = new XMLSerializer().serializeToString(poster);
      const url = URL.createObjectURL(new Blob([dati], { type: 'image/svg+xml' }));
      try {
        const img = new Image();
        img.decoding = 'async';
        await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = url; });
        const tela = document.createElement('canvas');
        tela.width = larghezza * 2;
        tela.height = altezza * 2;
        tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height);
        const png = await new Promise((ok) => tela.toBlob(ok, 'image/png'));
        // su telefono (Safari e Chrome) il foglio di condivisione permette di salvarlo direttamente in Foto
        const file = window.File && new File([png], 'portflavio-mappa.png', { type: 'image/png' });
        if (file && touch && navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'PORT' });
            return;
          } catch (error) {
            if (error.name === 'AbortError') return;
          }
        }
        const link = document.createElement('a');
        link.href = URL.createObjectURL(png);
        link.download = 'portflavio-mappa.png';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(link.href), 4000);
        avvisa(tr('Poster scaricato'));
      } catch (error) {
        avvisa(tr('Il poster non è disponibile su questo browser'));
      } finally {
        URL.revokeObjectURL(url);
      }
    }

    /* ---------- Lingua: italiano e inglese ---------- */
    const bottoneLingua = $('btnLingua');

    function etichettaLingua() {
      if (!bottoneLingua) return;
      const inglese = app.lingua && app.lingua() === 'en';
      bottoneLingua.querySelector('[aria-hidden]').textContent = inglese ? 'IT' : 'EN';
      bottoneLingua.setAttribute('lang', inglese ? 'it' : 'en');
    }

    function cambiaLingua() {
      if (!app.impostaLingua) return;
      app.impostaLingua(app.lingua() === 'en' ? 'it' : 'en');
    }

    // al cambio di lingua: testi delle stazioni riletti dall'HTML, etichette e pannello ridisegnati
    document.addEventListener('pf:lingua', () => {
      LINEE.forEach((linea) => {
        linea.nome = testo(linea.sezione, '.linea-nome');
        linea.stato = leggiStato(linea.sezione);
        linea.nodi.forEach((nodo) => {
          Object.assign(nodo, leggiVoce(nodo.voce));
          nodo.t.textContent = nodo.nome;
          if (nodo.sotto) nodo.sotto.textContent = nodo.futura ? '' : (nodo.ente || nodo.tech[0] || '');
          nodo.g.setAttribute('aria-label', `${linea.nome}: ${nodo.nome}`);
        });
      });
      disegnaLegenda();
      etichettaLingua();
      aggiornaComandiViaggio();
      if (finestraBiglietto?.open) scenaBiglietto.innerHTML = costruisciBiglietto();
      if (percorsoAttivo()) chiudiPercorso(false);
      if (corrente) {
        if (corrente.hub) mostraHub();
        else mostraStazione(corrente, collegati(corrente));
      }
    });

    bottoneLingua?.addEventListener('click', cambiaLingua);
    etichettaLingua();

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
