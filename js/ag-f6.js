/* Algoritmo genético da função F6 — porte fiel de ag_f6.py.
   O gerador Mersenne Twister replica o random do Python, então a semente 42
   reproduz exatamente o resultado da apresentação (F6 = 0.9627727912). */
(function () {
  'use strict';

  /* ---------- Mersenne Twister (igual ao random do CPython) ---------- */
  class MT {
    constructor(seed) {
      this.mt = new Uint32Array(624);
      this.i = 625;
      this.seedArray([seed >>> 0]);
    }
    initGenrand(s) {
      const mt = this.mt;
      mt[0] = s >>> 0;
      for (let i = 1; i < 624; i++) {
        const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
        mt[i] = (Math.imul(1812433253, p) + i) >>> 0;
      }
      this.i = 624;
    }
    seedArray(key) {
      this.initGenrand(19650218);
      const mt = this.mt;
      let i = 1, j = 0;
      for (let k = Math.max(624, key.length); k; k--) {
        const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
        mt[i] = ((mt[i] ^ Math.imul(p, 1664525)) >>> 0) + key[j] + j >>> 0;
        i++; j++;
        if (i >= 624) { mt[0] = mt[623]; i = 1; }
        if (j >= key.length) j = 0;
      }
      for (let k = 623; k; k--) {
        const p = mt[i - 1] ^ (mt[i - 1] >>> 30);
        mt[i] = ((mt[i] ^ Math.imul(p, 1566083941)) >>> 0) - i >>> 0;
        i++;
        if (i >= 624) { mt[0] = mt[623]; i = 1; }
      }
      mt[0] = 0x80000000;
      this.i = 624;
    }
    u32() {
      const mt = this.mt;
      if (this.i >= 624) {
        for (let k = 0; k < 624; k++) {
          const y = (mt[k] & 0x80000000) | (mt[(k + 1) % 624] & 0x7fffffff);
          mt[k] = mt[(k + 397) % 624] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
        }
        this.i = 0;
      }
      let y = mt[this.i++];
      y ^= y >>> 11;
      y ^= (y << 7) & 0x9d2c5680;
      y ^= (y << 15) & 0xefc60000;
      y ^= y >>> 18;
      return y >>> 0;
    }
    random() {
      const a = this.u32() >>> 5, b = this.u32() >>> 6;
      return (a * 67108864 + b) / 9007199254740992;
    }
    // random.randint(a, b) do Python (via _randbelow com getrandbits)
    randint(a, b) {
      const n = b - a + 1, k = 32 - Math.clz32(n);
      let r = this.u32() >>> (32 - k);
      while (r >= n) r = this.u32() >>> (32 - k);
      return a + r;
    }
  }

  /* ---------- Algoritmo (mesma lógica do Python) ---------- */
  const BITS_POR_VAR = 22, TAM_CROM = 2 * BITS_POR_VAR;
  const LIM_MIN = -100, LIM_MAX = 100, MAX_INT = (1 << BITS_POR_VAR) - 1;

  const bitsParaInteiro = bits => bits.reduce((acc, b) => acc * 2 + b, 0);
  function decodificar(c) {
    const gx = bitsParaInteiro(c.slice(0, BITS_POR_VAR));
    const gy = bitsParaInteiro(c.slice(BITS_POR_VAR));
    return [LIM_MIN + (LIM_MAX - LIM_MIN) * (gx / MAX_INT), LIM_MIN + (LIM_MAX - LIM_MIN) * (gy / MAX_INT)];
  }
  function f6(x, y) {
    const r2 = x * x + y * y;
    const num = Math.sin(Math.sqrt(r2)) ** 2 - 0.5;
    const den = (1 + 0.001 * r2) ** 2;
    return 0.5 - num / den;
  }
  const aptidao = c => { const [x, y] = decodificar(c); return f6(x, y); };

  function roleta(rng, pop, apt) {
    const soma = apt.reduce((a, b) => a + b, 0);
    const corte = rng.random() * soma;
    let acum = 0;
    for (let i = 0; i < pop.length; i++) { acum += apt[i]; if (acum >= corte) return pop[i]; }
    return pop[pop.length - 1];
  }
  function cruzamento(rng, p1, p2, taxa) {
    if (rng.random() < taxa) {
      const ponto = rng.randint(1, TAM_CROM - 1);
      return [p1.slice(0, ponto).concat(p2.slice(ponto)), p2.slice(0, ponto).concat(p1.slice(ponto))];
    }
    return [p1.slice(), p2.slice()];
  }
  function mutacao(rng, ind, taxa) {
    for (let i = 0; i < TAM_CROM; i++) if (rng.random() < taxa) ind[i] ^= 1;
    return ind;
  }
  function melhorIndice(apt) {
    let b = 0;
    for (let i = 1; i < apt.length; i++) if (apt[i] > apt[b]) b = i;
    return b;
  }

  /* ---------- Interface ---------- */
  const $ = id => document.getElementById(id);
  const t = (pt, en) => window.I18N.t(pt, en);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const inputs = { pop: $('i-pop'), gen: $('i-gen'), cross: $('i-cross'), mut: $('i-mut') };
  const outs = { pop: $('o-pop'), gen: $('o-gen'), cross: $('o-cross'), mut: $('o-mut') };
  const btnRun = $('ag-run'), btnPause = $('ag-pause'), btnReset = $('ag-reset'), btnZoom = $('ag-zoom');
  const log = $('ag-log'), mapCanvas = $('ag-map'), chartCanvas = $('ag-chart');
  const fmt = (v, d) => v.toFixed(d);
  const pad2 = n => String(n).padStart(2, '0');

  let run = null, timer = null, paused = false, zoom = false, bg = null;

  Object.keys(inputs).forEach(k => inputs[k].addEventListener('input', () => { outs[k].textContent = inputs[k].value; }));

  function setPauseLabel() { btnPause.textContent = paused ? t('Continuar', 'Resume') : t('Pausar', 'Pause'); }
  document.addEventListener('langchange', () => { setPauseLabel(); drawChart(); });
  setPauseLabel();

  function logLine(text, cls) {
    const line = document.createElement('div');
    if (cls) line.className = cls;
    line.textContent = text;
    log.appendChild(line);
    while (log.childNodes.length > 450) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
  }

  function start() {
    stop();
    const P = +inputs.pop.value, G = +inputs.gen.value;
    const seed = $('i-seed').checked ? 42 : (Math.random() * 4294967296) >>> 0;
    const rng = new MT(seed);
    run = {
      rng, P, G, taxaCruz: +inputs.cross.value, taxaMut: +inputs.mut.value,
      pop: Array.from({ length: P }, () => Array.from({ length: TAM_CROM }, () => rng.randint(0, 1))),
      g: 0, hist: [], elite: null, done: false
    };
    log.innerHTML = '';
    logLine(`$ python ag_f6.py   # pop=${P} geracoes=${G} cruz=${run.taxaCruz} mut=${run.taxaMut}${seed === 42 ? ' seed=42' : ''}`, 'muted');
    paused = false; setPauseLabel();
    btnPause.disabled = false;
    schedule();
  }

  function stop() { clearTimeout(timer); timer = null; }

  function schedule() {
    const delay = reduced ? 0 : Math.max(12, Math.min(140, 4200 / run.G));
    timer = setTimeout(() => {
      if (paused || !run || run.done) return;
      step();
      if (!run.done) schedule();
    }, delay);
  }

  function step() {
    const r = run, rng = r.rng;
    const apt = r.pop.map(aptidao);
    const b = melhorIndice(apt);
    const elite = r.pop[b].slice();
    r.hist.push(apt[b]);
    r.elite = elite;
    r.g++;
    const [x, y] = decodificar(elite);
    logLine(`Geracao ${pad2(r.g)} | Melhor aptidao: ${fmt(apt[b], 10)} | x = ${fmt(x, 10)}, y = ${fmt(y, 10)}`);

    const nova = [elite];
    while (nova.length < r.P) {
      const p1 = roleta(rng, r.pop, apt);
      const p2 = roleta(rng, r.pop, apt);
      let [f1, f2] = cruzamento(rng, p1, p2, r.taxaCruz);
      f1 = mutacao(rng, f1, r.taxaMut);
      f2 = mutacao(rng, f2, r.taxaMut);
      nova.push(f1);
      if (nova.length < r.P) nova.push(f2);
    }
    r.popAnterior = r.pop;
    r.pop = nova;

    if (r.g >= r.G) finish();
    render(r.popAnterior, elite);
  }

  function finish() {
    const r = run;
    const apt = r.pop.map(aptidao);
    const b = melhorIndice(apt);
    const [x, y] = decodificar(r.pop[b]);
    r.done = true;
    r.final = { f: apt[b], x, y };
    logLine('');
    logLine('----- RESULTADO FINAL -----', 'hl');
    logLine(`Melhor F6: ${fmt(apt[b], 10)}`, 'hl');
    logLine(`x = ${fmt(x, 10)}, y = ${fmt(y, 10)}`, 'hl');
    btnPause.disabled = true;
  }

  function render(pop, elite) {
    const r = run;
    const best = r.done ? r.final.f : r.hist[r.hist.length - 1];
    const [x, y] = r.done ? [r.final.x, r.final.y] : decodificar(elite);
    $('r-gen').textContent = `${r.g} / ${r.G}`;
    $('r-best').textContent = fmt(best, 10);
    $('r-xy').textContent = `${fmt(x, 3)}, ${fmt(y, 3)}`;
    drawMap(pop, elite);
    drawChart();
  }

  /* ---------- Mapa de calor ---------- */
  const STOPS = [[0, [7, 11, 26]], [.5, [16, 32, 90]], [.8, [47, 107, 255]], [.93, [140, 170, 255]], [1, [255, 210, 63]]];
  function color(v) {
    for (let i = 1; i < STOPS.length; i++) {
      if (v <= STOPS[i][0]) {
        const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], k = (v - a) / (b - a);
        return ca.map((c, j) => c + (cb[j] - c) * k);
      }
    }
    return STOPS[STOPS.length - 1][1];
  }
  const range = () => (zoom ? 15 : 100);

  function sizeCanvas(cv) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = cv.clientWidth || cv.width;
    const h = Math.round(w * cv.height / cv.width) || cv.height;
    if (cv._w !== w || cv._dpr !== dpr) {
      cv._ratio = cv._ratio || cv.height / cv.width;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(w * cv._ratio * dpr);
      cv._w = w; cv._dpr = dpr;
      if (cv === mapCanvas) bg = null;
    }
    return { W: cv.width, H: cv.height, dpr };
  }

  function background(W) {
    const img = new ImageData(W, W), R = range();
    for (let py = 0; py < W; py++) {
      const y = R - (py / (W - 1)) * 2 * R;
      for (let px = 0; px < W; px++) {
        const x = -R + (px / (W - 1)) * 2 * R;
        const c = color(f6(x, y)), o = (py * W + px) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
    const off = document.createElement('canvas');
    off.width = off.height = W;
    off.getContext('2d').putImageData(img, 0, 0);
    return off;
  }

  function drawMap(pop, elite) {
    const { W, dpr } = sizeCanvas(mapCanvas);
    const ctx = mapCanvas.getContext('2d');
    if (!bg) bg = background(W);
    ctx.drawImage(bg, 0, 0);
    const R = range();
    const toPx = (x, y) => [(x + R) / (2 * R) * W, (R - y) / (2 * R) * W];
    if (pop) {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      pop.forEach(c => {
        const [x, y] = decodificar(c);
        if (Math.abs(x) > R || Math.abs(y) > R) return;
        const [px, py] = toPx(x, y);
        ctx.beginPath(); ctx.arc(px, py, 2.2 * dpr, 0, Math.PI * 2); ctx.fill();
      });
    }
    if (elite) {
      const [x, y] = decodificar(elite);
      if (Math.abs(x) <= R && Math.abs(y) <= R) {
        const [px, py] = toPx(x, y);
        ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath(); ctx.arc(px, py, 7 * dpr, 0, Math.PI * 2); ctx.stroke();
      }
    }
    // cruz no ótimo global
    const [cx, cy] = toPx(0, 0);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1 * dpr;
    ctx.beginPath(); ctx.moveTo(cx - 6 * dpr, cy); ctx.lineTo(cx + 6 * dpr, cy); ctx.moveTo(cx, cy - 6 * dpr); ctx.lineTo(cx, cy + 6 * dpr); ctx.stroke();
    ctx.fillStyle = 'rgba(242,244,250,.75)';
    ctx.font = `${11 * dpr}px "JetBrains Mono", monospace`;
    ctx.fillText(`x, y ∈ [−${R}, ${R}]`, 8 * dpr, W - 8 * dpr);
  }

  /* ---------- Gráfico de convergência ---------- */
  function drawChart() {
    const { W, H, dpr } = sizeCanvas(chartCanvas);
    const ctx = chartCanvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const hist = run ? run.hist : [];
    const G = run ? run.G : +inputs.gen.value;
    const m = { l: 44 * dpr, r: 12 * dpr, t: 12 * dpr, b: 30 * dpr };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const lo = hist.length ? Math.max(0, Math.floor(Math.min(...hist) * 20) / 20 - .05) : .5;
    const hi = 1;
    const X = g => m.l + (G <= 1 ? 0 : (g - 1) / (G - 1)) * pw;
    const Y = v => m.t + (1 - (v - lo) / (hi - lo)) * ph;

    ctx.font = `${10.5 * dpr}px "JetBrains Mono", monospace`;
    ctx.lineWidth = 1 * dpr;
    for (let k = 0; k <= 4; k++) {
      const v = lo + (hi - lo) * k / 4, y = Y(v);
      ctx.strokeStyle = 'rgba(143,160,255,.12)';
      ctx.beginPath(); ctx.moveTo(m.l, y); ctx.lineTo(W - m.r, y); ctx.stroke();
      ctx.fillStyle = '#8E98B8'; ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(2), m.l - 6 * dpr, y + 3.5 * dpr);
    }
    ctx.textAlign = 'center';
    [1, Math.round(G / 2), G].forEach(g => ctx.fillText(g, X(g), H - 12 * dpr));
    ctx.fillText(t('geração', 'generation'), m.l + pw / 2, H - 1 * dpr);

    if (!hist.length) return;
    const grad = ctx.createLinearGradient(0, m.t, 0, m.t + ph);
    grad.addColorStop(0, 'rgba(47,107,255,.35)'); grad.addColorStop(1, 'rgba(47,107,255,0)');
    ctx.beginPath();
    hist.forEach((v, i) => (i ? ctx.lineTo(X(i + 1), Y(v)) : ctx.moveTo(X(1), Y(v))));
    ctx.lineTo(X(hist.length), m.t + ph); ctx.lineTo(X(1), m.t + ph); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath();
    hist.forEach((v, i) => (i ? ctx.lineTo(X(i + 1), Y(v)) : ctx.moveTo(X(1), Y(v))));
    ctx.strokeStyle = '#5B8CFF'; ctx.lineWidth = 2.5 * dpr; ctx.lineJoin = 'round'; ctx.stroke();

    const last = hist[hist.length - 1];
    ctx.fillStyle = '#FFD23F';
    ctx.beginPath(); ctx.arc(X(hist.length), Y(last), 5 * dpr, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = X(hist.length) > W - 70 * dpr ? 'right' : 'left';
    ctx.fillText(last.toFixed(4), X(hist.length) + (ctx.textAlign === 'right' ? -8 : 8) * dpr, Y(last) + 16 * dpr);
  }

  function reset() {
    stop();
    run = null; paused = false; setPauseLabel();
    btnPause.disabled = true;
    ['r-gen', 'r-best', 'r-xy'].forEach(id => { $(id).textContent = '–'; });
    log.innerHTML = '<span class="muted">$ python ag_f6.py</span>';
    drawMap(null, null);
    drawChart();
  }

  btnRun.addEventListener('click', start);
  btnPause.addEventListener('click', () => {
    if (!run || run.done) return;
    paused = !paused; setPauseLabel();
    if (!paused) schedule();
  });
  btnReset.addEventListener('click', reset);
  btnZoom.addEventListener('click', () => {
    zoom = !zoom; bg = null;
    btnZoom.setAttribute('aria-pressed', zoom);
    if (run) drawMap(run.popAnterior || run.pop, run.elite); else drawMap(null, null);
  });

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (run) render(run.popAnterior || run.pop, run.elite); else { drawMap(null, null); drawChart(); } }, 200);
  });

  // Desenha o estado inicial e roda sozinho a primeira vez que a demo aparece
  reset();
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { io.disconnect(); if (!run) start(); }
  }, { threshold: .5 });
  io.observe(mapCanvas);

  // exposto para conferência no console
  window.__agf6 = { MT, f6, decodificar };
})();
