(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const strip = document.querySelector('.strip');
  const track = strip && strip.querySelector('.strip-track');
  if (strip && track && track.querySelector('.strip-group') && !reduce) {
    const initial = track.innerHTML;
    let unit = 0;
    const build = () => {
      track.innerHTML = initial;
      const group = track.querySelector('.strip-group');
      if (!group) return;
      unit = Math.round(group.getBoundingClientRect().width);
      if (!unit) return;
      const need = window.innerWidth * 2 + unit;
      let guard = 0;
      while (track.scrollWidth < need && guard < 40) {
        track.appendChild(group.cloneNode(true));
        guard++;
      }
      track.style.setProperty('--shift', -unit + 'px');
      track.style.setProperty('--dur', Math.max(14, Math.round(unit / 55)) + 's');
      strip.classList.add('is-live');
    };
    const start = () => build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    else start();
    let timer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(build, 180);
    });
  }

  const canvas = document.getElementById('bgParticles');
  if (!canvas || !canvas.getContext || reduce) return;

  const ctx = canvas.getContext('2d');
  const cream = (a) => 'rgba(244,239,228,' + a + ')';
  let W = 0;
  let H = 0;
  let dpr = 1;
  let points = [];
  let mx = null;
  let my = null;
  let raf = 0;
  let last = 0;
  const linkDist = 118;

  const init = () => {
    const vw = Math.max(320, document.documentElement.clientWidth);
    const vh = Math.max(320, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.round(vw * dpr);
    H = canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    const count = Math.round(Math.min(96, Math.max(26, (vw * vh) / 24000)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.24 * dpr,
      vy: (Math.random() - 0.5) * 0.24 * dpr,
      r: (Math.random() * 0.9 + 0.7) * dpr
    }));
  };

  const draw = (t) => {
    if (t - last < 32) return;
    last = t;
    ctx.clearRect(0, 0, W, H);
    const link = linkDist * dpr;

    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      if (mx !== null) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d = Math.hypot(dx, dy);
        if (d < 92 * dpr && d > 0.1) {
          p.x += (dx / d) * 0.7;
          p.y += (dy / d) * 0.7;
        }
      }
    }

    ctx.lineWidth = dpr * 0.6;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) {
          ctx.strokeStyle = cream(((1 - d / link) * 0.15).toFixed(3));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (mx !== null) {
      const reach = 170 * dpr;
      ctx.lineWidth = dpr * 0.7;
      for (const p of points) {
        const d = Math.hypot(p.x - mx, p.y - my);
        if (d < reach) {
          ctx.strokeStyle = cream(((1 - d / reach) * 0.28).toFixed(3));
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }
      ctx.fillStyle = cream(0.5);
      ctx.beginPath();
      ctx.arc(mx, my, 2 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = cream(0.4);
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const loop = (t) => {
    draw(t);
    raf = requestAnimationFrame(loop);
  };

  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mx = (e.clientX - r.left) * dpr;
    my = (e.clientY - r.top) * dpr;
  }, { passive: true });
  document.addEventListener('mouseleave', () => {
    mx = null;
    my = null;
  });

  init();
  draw(performance.now());
  raf = requestAnimationFrame(loop);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      raf = requestAnimationFrame(loop);
    }
  });
})();
