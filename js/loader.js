/* ==========================================================================
   BRASA BURGER — Loading screen
   Burger assembled ingredient by ingredient, melting cheese, progress
   indicator tied to real page load, then a cinematic "curtain" exit.
   Fires `brasa:ready` on document when the site is revealed.
   ========================================================================== */
(function (global) {
  'use strict';

  var doc = document, root = doc.documentElement;
  var loader = doc.getElementById('loader');
  if (!loader) { root.classList.remove('is-loading'); return; }

  var bar = doc.getElementById('loaderBar');
  var count = doc.getElementById('loaderCount');
  var phrase = doc.getElementById('loaderPhrase');
  var skip = doc.getElementById('loaderSkip');
  var reduce = global.BrasaBurger && global.BrasaBurger.reduceMotion;

  var PHRASES = [
    [0, 'Acendendo a brasa…'],
    [0.2, 'Tostando o brioche na manteiga…'],
    [0.42, 'Selando o blend Angus a 280°C…'],
    [0.6, 'Derretendo o cheddar inglês…'],
    [0.8, 'Montando camada por camada…'],
    [0.97, 'Pronto. Bom apetite!']
  ];

  var MIN_TIME = reduce ? 600 : 3900;
  var start = performance.now();
  var pageLoaded = doc.readyState === 'complete';
  var shown = 0, done = false, lastPhrase = -1;

  global.addEventListener('load', function () { pageLoaded = true; });

  var burger = null;
  var mount = loader.querySelector('[data-burger="loader"]');
  if (global.BrasaBurger && mount) {
    burger = global.BrasaBurger.create(mount, { startExploded: 0 });
    burger.render(performance.now());
    burger.assemble({ start: 350, step: 300 });
    burger.start();
  }

  function tick(now) {
    if (done) return;
    var t = Math.min(1, (now - start) / MIN_TIME);
    var target = pageLoaded ? t : Math.min(t, 0.92);
    shown += (target - shown) * 0.12;
    if (target >= 1 && shown > 0.995) shown = 1;

    var pct = Math.round(shown * 100);
    bar.style.transform = 'scaleX(' + shown.toFixed(4) + ')';
    count.textContent = ('00' + pct).slice(-3);

    for (var i = PHRASES.length - 1; i >= 0; i--) {
      if (shown >= PHRASES[i][0]) {
        if (i !== lastPhrase) {
          lastPhrase = i;
          phrase.classList.remove('is-in');
          void phrase.offsetWidth;
          phrase.textContent = PHRASES[i][1];
          phrase.classList.add('is-in');
        }
        break;
      }
    }

    if (shown >= 1) return finish();
    requestAnimationFrame(tick);
  }

  function finish() {
    if (done) return;
    done = true;
    bar.style.transform = 'scaleX(1)';
    count.textContent = '100';
    loader.classList.add('is-leaving');
    var exit = reduce ? 250 : 1500;
    // Reveal the page as the curtains open.
    setTimeout(function () {
      root.classList.remove('is-loading');
      root.classList.add('is-ready');
      doc.dispatchEvent(new CustomEvent('brasa:ready'));
    }, reduce ? 50 : 700);
    setTimeout(function () {
      loader.classList.add('is-gone');
      if (burger) burger.destroy();
      loader.setAttribute('aria-hidden', 'true');
    }, exit);
  }

  skip.addEventListener('click', function () { pageLoaded = true; start = -1e9; shown = 0.999; });
  requestAnimationFrame(tick);
})(window);
