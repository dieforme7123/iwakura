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

  const start = () => requestAnimationFrame(() => document.body.classList.add('ready'));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(start);
  } else {
    start();
  }
  setTimeout(() => document.body.classList.add('intro-done'), 1800);

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

    const hero = document.querySelector('.hero');
    const letters = [...document.querySelectorAll('.hero-title .ltr')];
    if (hero && letters.length) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        letters.forEach((l, i) => {
          const d = 0.45 + (i % 3) * 0.35;
          l.style.transform = `translate3d(${nx * 26 * d}px, ${ny * 18 * d}px, 0) rotateY(${nx * 7 * d}deg) rotateX(${-ny * 5 * d}deg)`;
        });
      });
      hero.addEventListener('pointerleave', () => {
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
})();
