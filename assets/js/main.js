(() => {
  const html = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const title = document.querySelector('[data-split]');
  if (title && !reduce) {
    const text = title.textContent.trim();
    title.textContent = '';
    const word = document.createElement('span');
    word.className = 'word';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'ltr';
      s.textContent = ch;
      s.style.setProperty('--i', i);
      word.appendChild(s);
    });
    title.appendChild(word);
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    document.body.classList.add('ready');
  };
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(start);
    setTimeout(start, 1400);
  } else {
    start();
  }
  setTimeout(() => document.body.classList.add('intro-done'), 1800);
  setTimeout(() => document.body.classList.add('intro-fallback'), 2600);

  const head = document.querySelector('.site-head');
  const bar = document.querySelector('.head-progress i');
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      const y = window.scrollY;
      if (head) head.classList.toggle('solid', y > 30);
      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? Math.min(1, y / max) * 100 : 0) + '%';
      }
      raf = 0;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const items = [...document.querySelectorAll('.reveal')];
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => {
      const sibs = [...(el.parentElement ? el.parentElement.children : [])].filter((n) => n.classList.contains('reveal'));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.setProperty('--d', Math.min(i, 5) * 70 + 'ms');
      io.observe(el);
    });
  } else {
    items.forEach((el) => el.classList.add('in'));
  }

  document.querySelectorAll('.card').forEach((card) => {
    const media = card.querySelector('.card-media');
    if (!media) return;
    const spot = document.createElement('span');
    spot.className = 'spot';
    media.appendChild(spot);
    media.addEventListener('pointermove', (e) => {
      const r = media.getBoundingClientRect();
      media.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      media.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });

  if (!reduce) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = `translate(${x * 12}px, ${y * 8}px) scale(1.02)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    const title = document.querySelector('.hero-title');
    if (title) {
      const letters = [...title.querySelectorAll('.ltr')];
      let centers = [];
      let queued = 0;
      let px = 0;
      let py = 0;
      let active = false;
      const measure = () => {
        const r = title.getBoundingClientRect();
        centers = letters.map((l) => {
          const b = l.getBoundingClientRect();
          return { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top };
        });
      };
      const move = () => {
        queued = 0;
        if (!active) return;
        letters.forEach((l, i) => {
          const c = centers[i];
          const dx = c.x - px;
          const dy = c.y - py;
          const d = Math.hypot(dx, dy);
          const reach = 165;
          if (d < reach && d > 0.5) {
            const k = (1 - d / reach);
            l.style.transform = 'translate3d(' + (dx / d) * k * 26 + 'px,' + (dy / d) * k * 16 + 'px,0) rotate(' + (dx / d) * k * 3 + 'deg) scale(' + (1 + k * 0.03) + ')';
          } else if (l.style.transform) {
            l.style.transform = '';
          }
        });
      };
      title.addEventListener('pointerenter', measure);
      title.addEventListener('pointermove', (e) => {
        const r = title.getBoundingClientRect();
        px = e.clientX - r.left;
        py = e.clientY - r.top;
        active = true;
        if (!queued) queued = requestAnimationFrame(move);
      });
      title.addEventListener('pointerleave', () => {
        active = false;
        letters.forEach((l) => { l.style.transform = ''; });
      });
    }
  }

  const copy = document.querySelector('[data-copy]');
  if (copy) {
    const label = copy.querySelector('span');
    const original = label ? label.textContent : '';
    copy.addEventListener('click', async () => {
      const value = copy.dataset.copy;
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
      }
      copy.classList.add('done');
      if (label) label.textContent = 'скопировано';
      setTimeout(() => {
        copy.classList.remove('done');
        if (label) label.textContent = original;
      }, 1800);
    });
  }
  const filters = document.querySelectorAll('.fchip');
  if (filters.length) {
    const cards = [...document.querySelectorAll('.card[data-cat]')];
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.filter;
        filters.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cards.forEach((card) => {
          const show = cat === 'all' || card.dataset.cat === cat;
          card.classList.toggle('is-off', !show);
          if (show) card.removeAttribute('aria-hidden');
          else card.setAttribute('aria-hidden', 'true');
        });
      });
    });
  }

  const counters = [...document.querySelectorAll('[data-count]')];
  if (counters.length) {
    const run = (el) => {
      const target = Number(el.dataset.count) || 0;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1100);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window && !reduce) {
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          run(e.target);
          io2.unobserve(e.target);
        });
      }, { threshold: 0.6 });
      counters.forEach((c) => io2.observe(c));
    } else {
      counters.forEach((c) => { c.textContent = c.dataset.count; });
    }
  }

  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (dot && ring && !reduce && window.matchMedia('(pointer: fine)').matches) {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let on = false;
    const put = (el, px, py) => {
      el.style.transform = 'translate(' + px + 'px, ' + py + 'px) translate(-50%, -50%)';
    };
    const follow = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      put(ring, x, y);
      requestAnimationFrame(follow);
    };
    document.addEventListener('pointermove', (e) => {
      tx = e.clientX;
      ty = e.clientY;
      put(dot, tx, ty);
      if (!on) { on = true; document.body.classList.add('cursor-on'); }
      const el = e.target instanceof Element ? e.target.closest('a, button, .card, .fchip') : null;
      ring.classList.toggle('is-hot', !!el);
    }, { passive: true });
    document.addEventListener('pointerleave', () => {
      on = false;
      document.body.classList.remove('cursor-on');
    });
    follow();
  }
  const blobs = [...document.querySelectorAll('.blob')];
  if (blobs.length && !reduce) {
    let bx = 0;
    let by = 0;
    let tx = 0;
    let ty = 0;
    const t0 = performance.now();
    const drift = (now) => {
      const t = (now - t0) / 1000;
      bx += (tx - bx) * 0.06;
      by += (ty - by) * 0.06;
      blobs.forEach((b, i) => {
        const dir = i === 0 ? 1 : -1;
        const fx = Math.sin(t * 0.32 + i * 2.1) * 16;
        const fy = Math.cos(t * 0.27 + i * 1.7) * 14;
        const sc = 1 + Math.sin(t * 0.22 + i) * 0.05;
        b.style.transform = 'translate3d(' + (bx * dir + fx) + 'px, ' + (by * dir + fy) + 'px, 0) scale(' + sc + ')';
      });
      requestAnimationFrame(drift);
    };
    window.addEventListener('pointermove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 70;
      ty = (e.clientY / window.innerHeight - 0.5) * 50;
    }, { passive: true });
    requestAnimationFrame(drift);
  }
})();
