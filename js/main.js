/* ==========================================================================
   BRASA BURGER — Site interactions
   ========================================================================== */
(function (global) {
  'use strict';

  var doc = document, root = doc.documentElement;
  var CFG = global.BRASA_CONFIG || {};
  var B = global.BrasaBurger;
  var reduce = B ? B.reduceMotion : false;
  var finePointer = global.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- WhatsApp & contact config -------------------------------- */
  function whatsappUrl() {
    var w = CFG.whatsapp || {};
    var n = String(w.number || '').replace(/\D/g, '');
    return 'https://wa.me/' + n + (w.message ? '?text=' + encodeURIComponent(w.message) : '');
  }
  $$('[data-order]').forEach(function (a) {
    a.href = whatsappUrl();
    a.target = '_blank';
    a.rel = 'noopener';
  });
  var contact = CFG.contact || {};
  $$('[data-contact]').forEach(function (el) { el.textContent = contact[el.dataset.contact] || ''; });
  $$('[data-social]').forEach(function (el) { if (contact[el.dataset.social]) el.href = contact[el.dataset.social]; });
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Gallery: optional real photos ---------------------------- */
  var gal = CFG.gallery || {};
  $$('[data-shot]').forEach(function (fig) {
    var c = gal[fig.dataset.shot];
    if (c && c.image) {
      var img = new Image();
      img.loading = 'lazy'; img.decoding = 'async'; img.className = 'shot__photo';
      img.alt = ($('figcaption b', fig) || {}).textContent || '';
      img.src = c.image;
      $('.shot__art', fig).replaceWith(img);
    }
  });

  /* ---------- Ingredient art (reuses the burger engine) ---------------- */
  if (B) $$('[data-art]').forEach(function (el) { el.innerHTML = B.art(el.dataset.art); });

  /* ---------- Burgers -------------------------------------------------- */
  var hero = null, heroEl = $('[data-burger="hero"]');
  if (B && heroEl) {
    hero = B.create(heroEl, { labels: true, autoCycle: false, startExploded: 1, spread: 0.72, drop: 48, varTarget: heroEl.parentNode });
    hero.setExplode(1);
    hero.autoPause();
  }
  var mini = $('[data-burger="mini"]');
  if (B && mini) B.create(mini, { startExploded: 0, autoCycle: true }).autoPause();
  var cta = $('[data-burger="cta"]');
  var ctaBurger = B && cta ? B.create(cta, { startExploded: 0 }).autoPause() : null;

  // Hero: assemble when the loader leaves, then enable auto montage cycle.
  doc.addEventListener('brasa:ready', function () {
    if (!hero) return;
    setTimeout(function () { hero.setExplode(0); }, 350);
    setTimeout(function () { if (!manual) hero.o.autoCycle = true; hero.t0 = performance.now() - 1500; }, 2600);
  });
  if (!$('#loader')) doc.dispatchEvent(new CustomEvent('brasa:ready'));

  // Manual toggle "Ver por dentro"
  var manual = false, toggle = $('#heroToggle');
  if (toggle && hero) {
    toggle.addEventListener('click', function () {
      manual = !manual;
      hero.o.autoCycle = !manual;
      hero.cycle = 0;
      hero.setExplode(manual ? 1 : 0);
      if (!manual) hero.t0 = performance.now();
      toggle.setAttribute('aria-pressed', String(manual));
      $('.hero__toggle-text', toggle).textContent = manual ? 'Montar burger' : 'Ver por dentro';
      toggle.classList.toggle('is-open', manual);
    });
  }

  // Pointer parallax (hero + CTA burger + decorative layers)
  var heroSec = $('.hero');
  if (finePointer && !reduce) {
    global.addEventListener('pointermove', function (e) {
      var nx = e.clientX / global.innerWidth * 2 - 1, ny = e.clientY / global.innerHeight * 2 - 1;
      if (hero) hero.setPointer(nx, ny);
      if (ctaBurger) ctaBurger.setPointer(nx * 0.6, ny * 0.6);
      if (heroSec) { heroSec.style.setProperty('--px', nx.toFixed(3)); heroSec.style.setProperty('--py', ny.toFixed(3)); }
    }, { passive: true });
  }

  /* ---------- Scroll: progress, header, hero explode, timeline -------- */
  var header = $('#header'), prog = $('.progress span'), timeline = $('.timeline');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var sy = global.scrollY, vh = global.innerHeight;
    var max = doc.documentElement.scrollHeight - vh;
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? sy / max : 0).toFixed(4) + ')';
    header.classList.toggle('is-scrolled', sy > 40);
    root.classList.toggle('past-hero', sy > vh * 0.6);
    if (hero && heroSec) {
      var k = clamp(sy / (heroSec.offsetHeight * 0.7), 0, 1);
      hero.setScroll(k);
      heroSec.style.setProperty('--sy', k.toFixed(3));
    }
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      timeline.style.setProperty('--p', clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1).toFixed(3));
    }
  }
  global.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Mobile menu --------------------------------------------- */
  var menuBtn = $('#menuBtn'), nav = $('#nav');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  global.addEventListener('resize', function () { if (global.innerWidth > 980) setMenu(false); }, { passive: true });

  /* ---------- Smooth anchor scroll with header offset ------------------ */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = $(id); if (!t) return;
      e.preventDefault();
      var top = id === '#inicio' ? 0 : t.getBoundingClientRect().top + global.scrollY - (header.offsetHeight - 1);
      global.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Scroll spy ---------------------------------------------- */
  var links = $$('.nav__link');
  if ('IntersectionObserver' in global) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Split headings into words -------------------------------- */
  $$('[data-split]').forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var o = doc.createElement('span'); o.className = 'w';
            var s = doc.createElement('span'); s.textContent = w; s.style.setProperty('--wi', i++);
            o.appendChild(s); frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  });

  /* ---------- Reveal on scroll + counters ------------------------------ */
  function countUp(el) {
    var end = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10);
    var dur = 1600, t0 = performance.now();
    if (reduce || end === 0) { el.textContent = end.toFixed(dec).replace('.', ','); return; }
    (function step(now) {
      var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4);
      el.textContent = (end * e).toFixed(dec).replace('.', ',');
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ('IntersectionObserver' in global) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Micro-interactions (pointer devices) ---------------------- */
  if (finePointer && !reduce) {
    // Magnetic buttons
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
    // Tilt cards
    $$('.tilt').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, yy = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty('--rx', (-yy * 10).toFixed(2) + 'deg');
        c.style.setProperty('--ry', (x * 12).toFixed(2) + 'deg');
        c.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
        c.style.setProperty('--gy', ((yy + 0.5) * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
    // Spotlight cards
    $$('.spot').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    // Custom cursor
    var cur = $('.cursor');
    if (cur) {
      root.classList.add('has-cursor');
      var dot = $('.cursor__dot', cur), ring = $('.cursor__ring', cur);
      var cx = -100, cy = -100, rx = -100, ry = -100;
      global.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
      (function loop() {
        rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18;
        dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
        ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
        requestAnimationFrame(loop);
      })();
      doc.addEventListener('pointerover', function (e) {
        var t = e.target.closest && e.target.closest('a,button,.tilt,[data-burger="hero"]');
        cur.classList.toggle('is-hover', !!t);
      });
      doc.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
      doc.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
    }
  }

  /* ---------- Reviews slider ------------------------------------------ */
  (function slider() {
    var el = $('#reviews'); if (!el) return;
    var vp = $('.slider__viewport', el), track = $('.slider__track', el), slides = $$('.review', track);
    var dotsWrap = $('.slider__dots', el);
    var idx = 0, per = 1, timer = null, dragX = null, dx = 0;

    function perView() { var w = global.innerWidth; return w >= 1100 ? 3 : w >= 720 ? 2 : 1; }
    function pages() { return Math.max(1, slides.length - per + 1); }
    function buildDots() {
      dotsWrap.innerHTML = '';
      for (var i = 0; i < pages(); i++) {
        var b = doc.createElement('button');
        b.type = 'button'; b.className = 'slider__dot'; b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Avaliação ' + (i + 1));
        (function (i) { b.addEventListener('click', function () { go(i); restart(); }); })(i);
        dotsWrap.appendChild(b);
      }
    }
    function go(i, instant) {
      idx = (i + pages()) % pages();
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      var w = slides[0].getBoundingClientRect().width + gap;
      track.style.transition = instant ? 'none' : '';
      track.style.transform = 'translate3d(' + (-idx * w) + 'px,0,0)';
      $$('.slider__dot', dotsWrap).forEach(function (d, j) { d.classList.toggle('is-active', j === idx); d.setAttribute('aria-selected', String(j === idx)); });
      slides.forEach(function (s, j) { s.classList.toggle('is-current', j >= idx && j < idx + per); });
    }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(idx + 1); }, 6000); }
    function layout() { per = perView(); el.style.setProperty('--per', per); buildDots(); go(Math.min(idx, pages() - 1), true); }

    $$('[data-dir]', el).forEach(function (b) { b.addEventListener('click', function () { go(idx + Number(b.dataset.dir)); restart(); }); });
    el.addEventListener('mouseenter', function () { clearInterval(timer); });
    el.addEventListener('mouseleave', restart);
    vp.addEventListener('pointerdown', function (e) { dragX = e.clientX; dx = 0; vp.setPointerCapture(e.pointerId); });
    vp.addEventListener('pointermove', function (e) { if (dragX !== null) dx = e.clientX - dragX; });
    function end() { if (dragX === null) return; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); dragX = null; restart(); }
    vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);
    el.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(idx + 1); if (e.key === 'ArrowLeft') go(idx - 1); });
    global.addEventListener('resize', layout, { passive: true });
    layout(); restart();
  })();

  /* ---------- Embers ---------------------------------------------------- */
  var canvas = $('#embers');
  if (canvas && global.BrasaEmbers && !reduce) global.BrasaEmbers.create(canvas).autoPause(heroSec);
})(window);
