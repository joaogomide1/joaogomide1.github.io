/* Controle por gestos — versão web do FINAL.py (OpenCV + MediaPipe).
   Mesma lógica de contagem de dedos e do menu por estados; no navegador,
   o volume controlado é o de uma música gerada com Web Audio. */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const t = (pt, en) => window.I18N.t(pt, en);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLD = 3000; // no original: 5 s
  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  const CONNECTIONS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
  const DEDO_IDS = [4, 8, 12, 16, 20];

  const els = {
    demo: $('g-demo'), cam: $('g-cam'), video: $('g-video'), overlay: $('g-overlay'),
    state: $('g-state'), ring: $('g-ring'), count: $('g-count'), msg: $('g-msg'),
    vol: $('g-vol'), volNum: $('g-vol-num'), start: $('g-start'), stop: $('g-stop'),
    steps: Array.from(document.querySelectorAll('#g-steps li'))
  };

  /* ---------- Lógica do FINAL.py ---------- */
  function dedosLevantados(lm) {
    return DEDO_IDS.map((id, i) => (i === 0 ? (lm[id].x < lm[id - 2].x ? 1 : 0) : (lm[id].y < lm[id - 2].y ? 1 : 0)));
  }
  function detectarSinal(lm) {
    if (lm[4].y < lm[3].y) return 'positivo';
    if (lm[4].y > lm[3].y) return 'negativo';
    return null;
  }

  // Máquina de estados: menu → confirmar → volume → menu
  const sm = { mode: 'menu', held: null, since: 0, option: null };
  let camOn = false, msgTimer;

  function say(text) {
    els.msg.textContent = text;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { els.msg.textContent = ''; }, 3000);
  }
  function stateLabel() {
    if (!camOn) return t('Demonstração', 'Demo');
    return { menu: t('Menu', 'Menu'), confirm: t('Confirmar?', 'Confirm?'), volume: t('Modo volume', 'Volume mode') }[sm.mode];
  }
  function showState() {
    els.state.textContent = stateLabel();
    els.steps.forEach(li => li.classList.toggle('on', li.dataset.step === sm.mode));
  }
  document.addEventListener('langchange', showState);

  // Mantém a mesma leitura por HOLD ms; devolve true quando completa
  function hold(value, now) {
    if (value !== sm.held) { sm.held = value; sm.since = now; }
    const p = value == null ? 0 : Math.min(1, (now - sm.since) / HOLD);
    els.ring.style.setProperty('--p', p);
    return p >= 1;
  }
  function go(mode) { sm.mode = mode; sm.held = null; showState(); }

  function update(lm, now) {
    if (!lm) { els.count.textContent = '–'; hold(null, now); return; }
    const n = dedosLevantados(lm).reduce((a, b) => a + b, 0);
    els.count.textContent = n;

    if (sm.mode === 'menu') {
      const ok = n === 1 || n === 2;
      if (hold(ok ? n : null, now) && ok) {
        sm.option = n;
        say(t(`Opção ${n} selecionada`, `Option ${n} selected`));
        go('confirm');
      }
    } else if (sm.mode === 'confirm') {
      const s = detectarSinal(lm);
      els.count.textContent = s === 'positivo' ? '👍' : s === 'negativo' ? '👎' : n;
      if (hold(s, now) && s) {
        if (s === 'negativo') { say(t('Cancelado', 'Cancelled')); go('menu'); }
        else if (sm.option === 1) { say(t('Confirmado', 'Confirmed')); go('volume'); }
        else { say(t('Função 2 ativa: outra ação', 'Function 2 active: another action')); go('menu'); }
      }
    } else if (sm.mode === 'volume') {
      const ok = n >= 1 && n <= 5;
      if (hold(ok ? n : null, now) && ok) {
        const v = (n - 1) * 0.25;
        setVolume(v);
        say(t(`Volume: ${v * 100}%`, `Volume: ${v * 100}%`));
        go('menu');
      }
    }
  }

  /* ---------- Música de exemplo (Web Audio) ---------- */
  let audio = null;
  function startAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const master = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 1800;
    master.connect(ctx.destination);
    filter.connect(master);
    audio = { ctx, master, filter, step: 0, next: ctx.currentTime + .1, level: 0.5 };
    master.gain.value = curve(audio.level);
    // Am - F - C - G, arpejo em colcheias
    const chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 52, 55, 60], [55, 59, 62, 67]];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    const note = (m, time, len, type, vol) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = hz(m);
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(vol, time + .02);
      g.gain.exponentialRampToValueAtTime(.001, time + len);
      o.connect(g); g.connect(filter);
      o.start(time); o.stop(time + len + .05);
    };
    const eighth = 60 / 104 / 2;
    audio.timer = setInterval(() => {
      while (audio.next < ctx.currentTime + .2) {
        const s = audio.step, chord = chords[Math.floor(s / 8) % 4];
        note(chord[[0, 1, 2, 3, 2, 1, 2, 3][s % 8]] + 12, audio.next, .35, 'triangle', .12);
        if (s % 8 === 0) note(chord[0] - 12, audio.next, eighth * 8, 'sine', .18);
        audio.step++; audio.next += eighth;
      }
    }, 50);
  }
  function stopAudio() {
    if (!audio) return;
    clearInterval(audio.timer);
    audio.ctx.close();
    audio = null;
  }
  const curve = v => v * v * 0.9;
  function setVolume(v) {
    els.vol.style.width = v * 100 + '%';
    els.volNum.textContent = Math.round(v * 100) + '%';
    if (audio) {
      audio.level = v;
      audio.master.gain.setTargetAtTime(curve(v), audio.ctx.currentTime, .15);
    }
  }

  /* ---------- Câmera + MediaPipe ---------- */
  let landmarker = null, stream = null, raf = 0, lastTime = -1;

  async function start() {
    els.start.disabled = true;
    els.start.textContent = t('Carregando…', 'Loading…');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-camera');
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      startAudio();
      setVolume(0.5);
      if (!landmarker) {
        const vision = await import(`${MP}/vision_bundle.mjs`);
        const files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
        const opts = delegate => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numHands: 1 });
        try { landmarker = await vision.HandLandmarker.createFromOptions(files, opts('GPU')); }
        catch (e) { landmarker = await vision.HandLandmarker.createFromOptions(files, opts('CPU')); }
      }
      els.video.srcObject = stream;
      await els.video.play();
      camOn = true;
      els.cam.hidden = false;
      els.demo.hidden = true;
      els.start.hidden = true;
      els.stop.hidden = false;
      go('menu');
      loop();
    } catch (e) {
      stopCamera();
      say(e && e.name === 'NotAllowedError'
        ? t('Permissão da câmera negada. Mostrando a demonstração.', 'Camera permission denied. Showing the demo.')
        : t('Não foi possível abrir a câmera. Mostrando a demonstração.', 'Could not open the camera. Showing the demo.'));
    } finally {
      els.start.disabled = false;
      els.start.textContent = t('Ativar câmera', 'Turn on camera');
    }
  }

  function stopCamera() {
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(tr => tr.stop());
    stream = null;
    stopAudio();
    camOn = false;
    els.cam.hidden = true;
    els.demo.hidden = false;
    els.start.hidden = false;
    els.stop.hidden = true;
    els.ring.style.setProperty('--p', 0);
    showState();
  }

  function loop() {
    const v = els.video, cv = els.overlay;
    if (cv.width !== v.videoWidth) { cv.width = v.videoWidth; cv.height = v.videoHeight; }
    if (v.currentTime !== lastTime && v.videoWidth) {
      lastTime = v.currentTime;
      const now = performance.now();
      const res = landmarker.detectForVideo(v, now);
      const lm = res.landmarks && res.landmarks[0];
      drawHand(cv.getContext('2d'), lm, cv.width, cv.height, true);
      update(lm, now);
    }
    raf = requestAnimationFrame(loop);
  }

  function drawHand(ctx, lm, w, h, clear) {
    if (clear) ctx.clearRect(0, 0, w, h);
    if (!lm) return;
    const s = Math.max(w, h) / 480;
    ctx.lineWidth = 3 * s; ctx.strokeStyle = '#5B8CFF'; ctx.lineCap = 'round';
    CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(lm[a].x * w, lm[a].y * h); ctx.lineTo(lm[b].x * w, lm[b].y * h); ctx.stroke();
    });
    lm.forEach((p, i) => {
      ctx.fillStyle = DEDO_IDS.includes(i) ? '#FFD23F' : '#F2F4FA';
      ctx.beginPath(); ctx.arc(p.x * w, p.y * h, (DEDO_IDS.includes(i) ? 6 : 4) * s, 0, Math.PI * 2); ctx.fill();
    });
  }

  /* ---------- Demonstração animada (sem câmera) ---------- */
  // Mão aberta de referência (coordenadas 0–1), palma virada para a câmera
  const OPEN = [[.5, .9], [.4, .83], [.32, .74], [.26, .66], [.2, .59], [.41, .55], [.39, .41], [.38, .31], [.37, .22],
    [.5, .53], [.5, .38], [.5, .27], [.5, .17], [.59, .55], [.6, .41], [.61, .31], [.62, .23], [.68, .6], [.71, .49], [.73, .41], [.75, .34]];
  const FINGERS = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
  // ordem em que os dedos levantam: indicador, médio, anelar, mínimo, polegar
  const ORDER = [1, 2, 3, 4, 0];

  function handPose(up) {
    const pts = OPEN.map(p => p.slice());
    FINGERS.forEach((ids, f) => {
      const k = 1 - up[f]; // 0 = aberto, 1 = dobrado
      if (!k) return;
      const [mcp, pip, dip, tip] = ids.map(i => OPEN[i]);
      if (f === 0) {
        const to = [[.4, .8], [.44, .72], [.5, .68], [.55, .66]];
        ids.forEach((id, j) => { pts[id] = [OPEN[id][0] + (to[j][0] - OPEN[id][0]) * k, OPEN[id][1] + (to[j][1] - OPEN[id][1]) * k]; });
        return;
      }
      const fold = [[mcp[0], mcp[1] - .07], [mcp[0] + .005, mcp[1] - .01], [mcp[0] + .005, mcp[1] + .04]];
      [pip, dip, tip].forEach((p, j) => {
        const id = ids[j + 1];
        pts[id] = [p[0] + (fold[j][0] - p[0]) * k, p[1] + (fold[j][1] - p[1]) * k];
      });
    });
    return pts.map(([x, y]) => ({ x, y }));
  }

  const demoCtx = els.demo.getContext('2d');
  let demoStart = performance.now(), demoVisible = false, lastDemoVol = -1;
  const PHASE = 3200; // cada quantidade de dedos dura 3,2 s

  function drawDemo(now) {
    if (camOn || !demoVisible) return;
    const cv = els.demo, dpr = Math.min(devicePixelRatio || 1, 2);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const W = cv.width, H = cv.height;
    const el = reduced ? PHASE * 2.5 : (now - demoStart) % (PHASE * 5);
    const n = Math.floor(el / PHASE) + 1;
    const inPhase = (el % PHASE) / PHASE;
    const up = [0, 0, 0, 0, 0];
    ORDER.forEach((f, i) => {
      if (i < n - 1) up[f] = 1;
      else if (i === n - 1) up[f] = Math.min(1, inPhase / .15);
    });

    demoCtx.clearRect(0, 0, W, H);
    // grade de fundo
    demoCtx.strokeStyle = 'rgba(143,160,255,.07)'; demoCtx.lineWidth = 1;
    for (let x = 0; x < W; x += 24 * dpr) { demoCtx.beginPath(); demoCtx.moveTo(x, 0); demoCtx.lineTo(x, H); demoCtx.stroke(); }
    for (let y = 0; y < H; y += 24 * dpr) { demoCtx.beginPath(); demoCtx.moveTo(0, y); demoCtx.lineTo(W, y); demoCtx.stroke(); }

    const size = Math.min(W, H) * .95, ox = (W - size) / 2, oy = (H - size) / 2 + H * .03;
    const lm = handPose(up).map(p => ({ x: (ox + p.x * size) / W, y: (oy + p.y * size) / H }));
    drawHand(demoCtx, lm, W, H, false);

    els.count.textContent = n;
    els.ring.style.setProperty('--p', Math.min(1, inPhase / .9));
    const v = (n - 1) * .25;
    if (inPhase > .9 && lastDemoVol !== v) { lastDemoVol = v; setVolume(v); say(t(`Volume: ${v * 100}%`, `Volume: ${v * 100}%`)); }
    if (inPhase < .1) lastDemoVol = -1;
    els.steps.forEach(li => li.classList.toggle('on', li.dataset.step === 'volume'));
  }

  (function demoLoop(now) {
    drawDemo(now);
    if (!reduced) requestAnimationFrame(demoLoop);
  })(performance.now());

  new IntersectionObserver(([e]) => {
    demoVisible = e.isIntersecting;
    if (demoVisible) { demoStart = performance.now(); if (reduced) drawDemo(demoStart); }
  }).observe(els.demo);

  els.start.addEventListener('click', start);
  els.stop.addEventListener('click', stopCamera);
  showState();
  els.steps.forEach(li => li.classList.toggle('on', li.dataset.step === 'volume'));
})();
