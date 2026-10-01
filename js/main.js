/* Interações gerais: partículas, cursor, rolagem, modais, contadores. */
(function () {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const t = (pt, en) => window.I18N.t(pt, en);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Partículas do hero ---------- */
  function particles() {
    const canvas = $('#particles');
    const hero = $('.hero');
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, pts = [], targets = [], form = 0, visible = true;
    const mouse = { x: -9999, y: -9999 };
    const LINK = 110;

    function build() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = w < 700 ? 70 : 140;
      pts = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6,
        r: Math.random() * 1.6 + .8, yellow: i % 9 === 0
      }));
      targets = w < 860 ? [] : letterTargets(n);
    }

    // Pontos amostrados das letras "JG", no lado direito do hero
    function letterTargets(n) {
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const o = off.getContext('2d');
      const size = Math.min(h * .5, w * .28);
      o.font = `700 ${size}px "Space Grotesk", sans-serif`;
      o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff';
      o.fillText('JG', w * .74, h * .6);
      const data = o.getImageData(0, 0, w, h).data;
      const cand = [];
      for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) if (data[(y * w + x) * 4 + 3] > 128) cand.push({ x, y });
      for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
      return Array.from({ length: n }, (_, i) => cand[i % cand.length]);
    }

    function step() {
      const goal = targets.length ? clamp(scrollY / (h * .28), 0, 1) : 0;
      form += (goal * goal * (3 - 2 * goal) - form) * .08;

      ctx.clearRect(0, 0, w, h);
      const pos = pts.map((p, i) => {
        const dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 32000) { const d = Math.sqrt(d2) || 1; p.vx += dx / d * .04; p.vy += dy / d * .04; }
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > 1.6) { p.vx *= 1.6 / sp; p.vy *= 1.6 / sp; }
        if (sp < .15) { p.vx += (Math.random() - .5) * .1; p.vy += (Math.random() - .5) * .1; }
        p.vx *= .99; p.vy *= .99;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = clamp(p.x, 0, w); p.y = clamp(p.y, 0, h);
        const tg = targets[i];
        return tg ? { x: p.x + (tg.x - p.x) * form, y: p.y + (tg.y - p.y) * form } : { x: p.x, y: p.y };
      });

      const link = LINK * (1 - form * .5);
      ctx.lineWidth = 1;
      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y;
          const d = dx * dx + dy * dy;
          if (d < link * link) {
            ctx.strokeStyle = `rgba(91,140,255,${(1 - Math.sqrt(d) / link) * .35})`;
            ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
          }
        }
        // linha até o cursor
        const mx = pos[i].x - mouse.x, my = pos[i].y - mouse.y, md = Math.hypot(mx, my);
        if (md < 150) {
          ctx.strokeStyle = `rgba(255,210,63,${(1 - md / 150) * .45})`;
          ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      pos.forEach((q, i) => {
        ctx.fillStyle = pts[i].yellow ? '#FFD23F' : '#5B8CFF';
        ctx.beginPath(); ctx.arc(q.x, q.y, pts[i].r + form * .6, 0, Math.PI * 2); ctx.fill();
      });
    }

    function loop() { if (visible) step(); requestAnimationFrame(loop); }
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });

    const start = () => { build(); if (reduced) step(); else loop(); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  }

  /* ---------- Cursor customizado ---------- */
  function cursor() {
    if (!finePointer || reduced) return;
    const dot = $('.cursor-dot'), ring = $('.cursor-ring');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    document.documentElement.classList.add('has-cursor');
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; });
    (function follow() {
      rx += (x - rx) * .16; ry += (y - ry) * .16;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(follow);
    })();
    document.addEventListener('pointerover', e => {
      ring.classList.toggle('hover', !!e.target.closest('a, button, input, label, .card, .hotspot'));
    });
    document.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ring.style.opacity = ''; });
  }

  /* ---------- Botões magnéticos e cards com tilt ---------- */
  function hoverEffects() {
    if (!finePointer || reduced) return;
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(.5 - py) * 7}deg) rotateY(${(px - .5) * 7}deg)`;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Texto digitado ---------- */
  function typed() {
    const el = $('#typed');
    const phrases = () => t(['Analista de Dados', 'Power BI & SQL', 'Python Developer'], ['Data Analyst', 'Power BI & SQL', 'Python Developer']);
    if (reduced) {
      el.textContent = phrases()[0];
      document.addEventListener('langchange', () => { el.textContent = phrases()[0]; });
      return;
    }
    let i = 0, n = 0, deleting = false;
    (function tick() {
      const list = phrases(), word = list[i % list.length];
      n += deleting ? -1 : 1;
      el.textContent = word.slice(0, n);
      let wait = deleting ? 40 : 85;
      if (!deleting && n >= word.length) { deleting = true; wait = 1800; }
      else if (deleting && n <= 0) { deleting = false; i++; wait = 350; }
      setTimeout(tick, wait);
    })();
  }

  /* ---------- Revelação ao rolar ---------- */
  function reveals() {
    const items = $$('.reveal');
    if (reduced || !('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in')); return; }
    const groups = new Map();
    items.forEach(el => {
      const k = el.parentElement;
      const i = groups.get(k) || 0;
      el.style.transitionDelay = `${Math.min(i, 5) * 90}ms`;
      groups.set(k, i + 1);
    });
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ---------- Contadores ---------- */
  function counters() {
    const els = $$('[data-count]');
    const run = el => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '';
      if (reduced) { el.textContent = end + suf; return; }
      const t0 = performance.now();
      (function f(now) {
        const p = clamp((now - t0) / 1600, 0, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(f);
      })(t0);
    };
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }), { threshold: .6 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Linha do tempo ---------- */
  function timeline() {
    const tl = $('#timeline');
    const fill = document.createElement('span');
    fill.className = 'timeline-fill';
    tl.prepend(fill);
    const items = $$('.tl-item', tl);
    const update = () => {
      const r = tl.getBoundingClientRect();
      const px = clamp(innerHeight * .65 - r.top, 0, r.height - 12);
      fill.style.height = px + 'px';
      items.forEach(it => it.classList.toggle('lit', it.offsetTop <= px));
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  /* ---------- Navegação ---------- */
  function nav() {
    const bar = $('#nav'), menu = $('#menu-btn'), links = $('#nav-links');
    const onScroll = () => bar.classList.toggle('scrolled', scrollY > 20);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', open);
      links.classList.toggle('open', open);
    });
    $$('a', links).forEach(a => a.addEventListener('click', () => {
      menu.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    }));

    const map = new Map($$('a', links).map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      map.forEach(a => a.classList.remove('active'));
      const a = map.get(e.target.id);
      if (a) a.classList.add('active');
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section').forEach(s => io.observe(s));
  }

  /* ---------- Modais ---------- */
  // O modal abre na "top layer", acima do cursor customizado; enquanto ele
  // estiver aberto, o cursor nativo volta a aparecer.
  function modals() {
    const root = document.documentElement;
    let hadCursor = false;
    $$('[data-modal]').forEach(btn => btn.addEventListener('click', () => {
      const d = document.getElementById(btn.dataset.modal);
      if (!d) return;
      hadCursor = root.classList.contains('has-cursor');
      root.classList.remove('has-cursor');
      d.showModal();
      root.style.overflow = 'hidden';
    }));
    const restore = () => {
      root.style.overflow = '';
      if (hadCursor) root.classList.add('has-cursor');
    };
    $$('dialog.modal').forEach(d => {
      const close = () => { d.close(); restore(); };
      $('.modal-close', d).addEventListener('click', close);
      d.addEventListener('click', e => { if (e.target === d) close(); });
      d.addEventListener('close', restore); // Esc
    });
  }

  /* ---------- Copiar e-mail ---------- */
  function copyMail() {
    const btn = $('#copy-mail'), label = $('#copy-label');
    const idle = () => { label.textContent = t('copiar', 'copy'); };
    document.addEventListener('langchange', idle);
    idle();
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.mail);
        label.textContent = t('copiado!', 'copied!');
        setTimeout(idle, 2000);
      } catch (e) {
        location.href = 'mailto:' + btn.dataset.mail;
      }
    });
  }

  particles();
  cursor();
  hoverEffects();
  typed();
  reveals();
  counters();
  timeline();
  nav();
  modals();
  copyMail();
})();
