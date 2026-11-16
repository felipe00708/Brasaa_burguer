/* ==========================================================================
   BRASA BURGER — Embers (canvas particle system)
   Glowing sparks rising from the bottom. Each colour is pre-rendered once
   into a small sprite, so a frame is just a few dozen drawImage calls.
   DPR-aware, lighter on small screens, paused off-screen / in hidden tabs.
   ========================================================================== */
(function (global) {
  'use strict';

  var COLORS = ['255,196,107', '242,162,58', '232,82,31', '255,230,170'];
  var SPRITE = 64;
  var sprites = null;

  function makeSprites() {
    if (sprites) return sprites;
    sprites = COLORS.map(function (c) {
      var cv = document.createElement('canvas');
      cv.width = cv.height = SPRITE;
      var g = cv.getContext('2d'), h = SPRITE / 2;
      var grad = g.createRadialGradient(h, h, 0, h, h, h);
      grad.addColorStop(0, 'rgba(' + c + ',1)');
      grad.addColorStop(0.18, 'rgba(' + c + ',.85)');
      grad.addColorStop(0.4, 'rgba(' + c + ',.28)');
      grad.addColorStop(1, 'rgba(' + c + ',0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, SPRITE, SPRITE);
      return cv;
    });
    return sprites;
  }

  function Embers(canvas, opts) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = Object.assign({ density: 0.00008, max: 120, maxMobile: 45, speed: 1 }, opts || {});
    this.ps = [];
    this.on = false;
    this.mx = 0;
    this.sp = makeSprites();
    var self = this;
    this.resize = function () {
      // Soft glows don't need retina resolution: 1x keeps fill-rate low.
      var dpr = 1;
      var r = self.c.getBoundingClientRect();
      self.w = r.width; self.h = r.height;
      self.c.width = Math.round(r.width * dpr); self.c.height = Math.round(r.height * dpr);
      self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cap = r.width < 760 ? self.o.maxMobile : self.o.max;
      self.count = Math.min(cap, Math.round(self.w * self.h * self.o.density));
    };
    this.resize();
    var rt;
    global.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(self.resize, 150); }, { passive: true });
    this._move = function (e) { self.mx = (e.clientX / global.innerWidth - 0.5); };
    global.addEventListener('pointermove', this._move, { passive: true });
  }

  Embers.prototype.spawn = function (initial) {
    return {
      x: Math.random() * this.w,
      y: initial ? Math.random() * this.h : this.h + 10,
      r: 0.6 + Math.random() * 2.2,
      vy: (0.35 + Math.random() * 1.1) * this.o.speed,
      vx: (Math.random() - 0.5) * 0.4,
      life: 0, max: 260 + Math.random() * 380,
      wob: Math.random() * 6.283,
      s: this.sp[(Math.random() * this.sp.length) | 0]
    };
  };

  Embers.prototype.tick = function () {
    var ctx = this.ctx, ps = this.ps;
    while (ps.length < this.count) ps.push(this.spawn(!this.seeded));
    this.seeded = true;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i];
      p.life++;
      p.wob += 0.03;
      p.x += p.vx + Math.sin(p.wob) * 0.35 + this.mx * 0.6;
      p.y -= p.vy;
      if (p.life > p.max || p.y < -20) { ps.splice(i, 1); continue; }
      var k = p.life / p.max;
      ctx.globalAlpha = k < 0.1 ? k * 10 : 1 - (k - 0.1) / 0.9;
      var d = p.r * 10;
      ctx.drawImage(p.s, p.x - d / 2, p.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  Embers.prototype.start = function () {
    if (this.on) return; this.on = true;
    var self = this;
    (function loop() { if (!self.on) return; self.tick(); self.raf = requestAnimationFrame(loop); })();
  };
  Embers.prototype.stop = function () { this.on = false; cancelAnimationFrame(this.raf); };

  Embers.prototype.destroy = function () {
    this.stop();
    global.removeEventListener('pointermove', this._move);
  };

  Embers.prototype.autoPause = function (target) {
    var self = this, visible = true;
    if ('IntersectionObserver' in global) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible && !document.hidden ? self.start() : self.stop(); })
        .observe(target || this.c);
    }
    document.addEventListener('visibilitychange', function () { document.hidden || !visible ? self.stop() : self.start(); });
    this.start();
    return this;
  };

  global.BrasaEmbers = { create: function (c, o) { return new Embers(c, o); } };
})(window);
