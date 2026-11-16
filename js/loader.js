/* ==========================================================================
   BRASA BURGER — Loading screen
   Burger assembled ingredient by ingredient, melting cheese, embers,
   progress indicator tied to the real page load, then a cinematic
   "curtain" exit. Returning visitors (same session) get a shorter intro.
   Fires `brasa:ready` on document when the site is revealed.
   ========================================================================== */
(function (global) {
  'use strict';

  var doc = document, root = doc.documentElement;
  var loader = doc.getElementById('loader');
  if (!loader) { root.classList.remove('is-loading'); root.classList.add('is-ready'); return; }

  var bar = doc.getElementById('loaderBar');
  var count = doc.getElementById('loaderCount');
  var phrase = doc.getElementById('loaderPhrase');
  var skip = doc.getElementById('loaderSkip');
  var reduce = global.BrasaBurger ? global.BrasaBurger.reduceMotion : false;

  var returning = false;
  try { returning = sessionStorage.getItem('brasa:intro') === '1'; sessionStorage.setItem('brasa:intro', '1'); } catch (e) { /* storage blocked */ }

  var PHRASES = [
    [0, 'Acendendo a brasa…'],
    [0.2, 'Tostando o brioche na manteiga…'],
    [0.42, 'Prensando o blend na chapa…'],
    [0.6, 'Derretendo o cheddar…'],
    [0.8, 'Montando camada por camada…'],
    [0.97, 'Pronto. Bom apetite!']
  ];

  var MIN_TIME = reduce ? 500 : (returning ? 1700 : 4000);
  var start = performance.now();
  var pageLoaded = doc.readyState === 'complete';
  var shown = 0, done = false, lastPhrase = -1;

  global.addEventListener('load', function () { pageLoaded = true; });
  // Never hold the intro hostage to a slow third-party request.
  setTimeout(function () { pageLoaded = true; }, 8000);

  var burger = null;
  var mount = loader.querySelector('[data-burger="loader"]');
  if (global.BrasaBurger && mount) {
    burger = global.BrasaBurger.create(mount, { startExploded: 0 });
    burger.render(performance.now());
    burger.assemble(returning ? { start: 80, step: 120 } : { start: 350, step: 300 }).then(function () {
      loader.classList.add('is-assembled');
    });
    burger.start();
  }

  var embers = null, emCanvas = doc.getElementById('loaderEmbers');
  if (emCanvas && global.BrasaEmbers && !reduce) {
    embers = global.BrasaEmbers.create(emCanvas, { density: 0.00004, max: 60, maxMobile: 28, speed: 0.8 });
    embers.start();
  }

  function setPhrase(i) {
    lastPhrase = i;
    phrase.classList.remove('is-in');
    void phrase.offsetWidth;
    phrase.textContent = PHRASES[i][1];
    phrase.classList.add('is-in');
  }

  function tick(now) {
    if (done) return;
    var t = Math.min(1, (now - start) / MIN_TIME);
    var target = pageLoaded ? t : Math.min(t, 0.92);
    shown += (target - shown) * 0.12;
    if (target >= 1 && shown > 0.995) shown = 1;

    bar.style.transform = 'scaleX(' + shown.toFixed(4) + ')';
    count.textContent = ('00' + Math.round(shown * 100)).slice(-3);

    for (var i = PHRASES.length - 1; i >= 0; i--) {
      if (shown >= PHRASES[i][0]) { if (i !== lastPhrase) setPhrase(i); break; }
    }

    if (shown >= 1) return finish();
    requestAnimationFrame(tick);
  }

  function finish() {
    if (done) return;
    done = true;
    bar.style.transform = 'scaleX(1)';
    count.textContent = '100';
    loader.classList.add('is-assembled', 'is-leaving');
    setTimeout(function () {
      root.classList.remove('is-loading');
      root.classList.add('is-ready');
      doc.dispatchEvent(new CustomEvent('brasa:ready'));
    }, reduce ? 50 : 650);
    setTimeout(function () {
      loader.classList.add('is-gone');
      loader.setAttribute('aria-hidden', 'true');
      if (burger) burger.destroy();
      if (embers) embers.destroy();
    }, reduce ? 250 : 1600);
  }

  skip.addEventListener('click', function () { pageLoaded = true; start = -1e9; shown = 0.999; });
  requestAnimationFrame(tick);
})(window);
