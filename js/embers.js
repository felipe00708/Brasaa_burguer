/* ==========================================================================
   BRASA BURGER — Embers (canvas particle system)
   Glowing sparks rising from the bottom, additive blending, DPR-aware,
   paused while off-screen or when the tab is hidden.
   ========================================================================== */
(function (global) {
  'use strict';

  function Embers(canvas, opts) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.o = Object.assign({ density: 0.00009, max: 140, colors: ['255,196,107', '242,162,58', '232,82,31', '255,230,170'] }, opts || {});
    this.ps = [];
    this.on = false;
    this.mx = 0;
    var self = this;
    this.resize = function () {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var r = self.c.getBoundingClientRect();
      self.w = r.width; self.h = r.height;
      self.c.width = r.width * dpr; self.c.height = r.height * dpr;
      self.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      self.count = Math.min(self.o.max, Math.round(self.w * self.h * self.o.density));
    };
    this.resize();
    global.addEventListener('resize', this.resize, { passive: true });
    global.addEventListener('pointermove', function (e) { self.mx = (e.clientX / global.innerWidth - 0.5); }, { passive: true });
  }

  Embers.prototype.spawn = function (initial) {
    var o = this.o;
    return {
      x: Math.random() * this.w,
      y: initial ? Math.random() * this.h : this.h + 10,
      r: 0.6 + Math.random() * 2.2,
      vy: 0.35 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.4,
      life: 0, max: 260 + Math.random() * 380,
      wob: Math.random() * Math.PI * 2,
      c: o.colors[(Math.random() * o.colors.length) | 0]
    };
  };

  Embers.prototype.tick = function () {
    var ctx = this.ctx, ps = this.ps;
    while (ps.length < this.count) ps.push(this.spawn(ps.length < this.count * 0.8 && !this.seeded));
    this.seeded = true;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = ps.length - 1; i >= 0; i--) {
      var p = ps[i];
      p.life++;
      p.wob += 0.03;
      p.x += p.vx + Math.sin(p.wob) * 0.35 + this.mx * 0.6;
      p.y -= p.vy;
      var k = p.life / p.max, a = k < 0.1 ? k * 10 : 1 - (k - 0.1) / 0.9;
      if (p.life > p.max || p.y < -20) { ps.splice(i, 1); continue; }
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, 'rgba(' + p.c + ',' + (a * 0.95).toFixed(3) + ')');
      g.addColorStop(0.35, 'rgba(' + p.c + ',' + (a * 0.35).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + p.c + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  };

  Embers.prototype.start = function () {
    if (this.on) return; this.on = true;
    var self = this;
    (function loop() { if (!self.on) return; self.tick(); self.raf = requestAnimationFrame(loop); })();
  };
  Embers.prototype.stop = function () { this.on = false; cancelAnimationFrame(this.raf); };

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
