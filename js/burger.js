/* ==========================================================================
   BRASA BURGER — Burger engine
   Renders a layered, vector-illustrated burger (one SVG per ingredient) and
   animates it in 3D: floating layers, assembly/disassembly, pointer and
   scroll parallax. Used by the loader, the hero, the ingredients cards and
   the final call-to-action.
   ========================================================================== */
(function (global) {
  'use strict';

  var uidCounter = 0;
  var reduceMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- helpers ---------------------------------------------------- */

  // Deterministic PRNG so the art is identical on every render.
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function f(n) { return Math.round(n * 10) / 10; }

  // Closed, smooth path through points (quadratic curves via midpoints).
  function smooth(pts) {
    var n = pts.length;
    var mid = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
    var start = mid(pts[n - 1], pts[0]);
    var d = 'M' + f(start[0]) + ' ' + f(start[1]);
    for (var i = 0; i < n; i++) {
      var m = mid(pts[i], pts[(i + 1) % n]);
      d += 'Q' + f(pts[i][0]) + ' ' + f(pts[i][1]) + ' ' + f(m[0]) + ' ' + f(m[1]);
    }
    return d + 'Z';
  }

  function svg(vb, body, cls) {
    return '<svg class="' + (cls || '') + '" viewBox="0 0 ' + vb[0] + ' ' + vb[1] +
      '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  /* ---------- ingredient art -------------------------------------------- */

  var ART = {};

  ART.topBun = function (u) {
    var r = rng(7), seeds = '', placed = [], tries = 0;
    while (placed.length < 44 && tries++ < 900) {
      var x = 60 + r() * 480, y = 34 + r() * 160;
      var nx = (x - 300) / 282, ny = (y - 218) / 202;
      if (nx * nx + ny * ny > 0.8 || y > 192) continue;
      var ok = true;
      for (var i = 0; i < placed.length; i++) {
        var dx = placed[i][0] - x, dy = placed[i][1] - y;
        if (dx * dx + dy * dy < 560) { ok = false; break; }
      }
      if (!ok) continue;
      placed.push([x, y]);
      var ang = nx * 55 + (r() - 0.5) * 60;
      var sc = 0.7 + (1 - Math.abs(nx)) * 0.4;
      seeds += '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(ang) + ') scale(' + f(sc) + ')">' +
        '<ellipse cx="1.4" cy="2.6" rx="8" ry="3.8" fill="#5a2208" opacity=".38"/>' +
        '<ellipse rx="8" ry="3.8" fill="url(#' + u + 'seed)"/>' +
        '<ellipse cx="-2.4" cy="-1.1" rx="3.4" ry="1.1" fill="#fff" opacity=".85"/></g>';
    }
    var specks = '';
    for (var s = 0; s < 70; s++) {
      var sx = 60 + r() * 480, sy = 40 + r() * 170;
      var snx = (sx - 300) / 282, sny = (sy - 218) / 202;
      if (snx * snx + sny * sny > 0.85) continue;
      specks += '<circle cx="' + f(sx) + '" cy="' + f(sy) + '" r="' + f(0.8 + r() * 1.8) + '" fill="#7a300c" opacity="' + f(0.12 + r() * 0.2) + '"/>';
    }
    var dome = 'M22 198C18 92 140 18 300 16C460 18 582 92 578 198C578 214 562 222 540 222L60 222C38 222 22 214 22 198Z';
    return svg([600, 240],
      '<defs>' +
        '<radialGradient id="' + u + 'bun" cx="36%" cy="22%" r="86%">' +
          '<stop offset="0" stop-color="#FFD68F"/><stop offset=".22" stop-color="#F3A548"/>' +
          '<stop offset=".55" stop-color="#CF6A20"/><stop offset=".82" stop-color="#93400F"/><stop offset="1" stop-color="#5E2508"/>' +
        '</radialGradient>' +
        '<linearGradient id="' + u + 'crumb" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#C96E26"/><stop offset=".35" stop-color="#F6D7A2"/><stop offset="1" stop-color="#E2A964"/>' +
        '</linearGradient>' +
        '<linearGradient id="' + u + 'seed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8E8"/><stop offset="1" stop-color="#E3C58E"/></linearGradient>' +
        '<linearGradient id="' + u + 'rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFB25A" stop-opacity="0"/><stop offset=".7" stop-color="#FFB25A" stop-opacity="0"/><stop offset="1" stop-color="#FFC77A" stop-opacity=".9"/></linearGradient>' +
        '<linearGradient id="' + u + 'shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#3a1404" stop-opacity="0"/><stop offset="1" stop-color="#3a1404" stop-opacity=".45"/></linearGradient>' +
        '<filter id="' + u + 'blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>' +
      '</defs>' +
      '<path d="M24 196C40 214 120 226 300 228C480 226 560 214 576 196C580 214 568 236 540 238L60 238C32 236 20 214 24 196Z" fill="url(#' + u + 'crumb)"/>' +
      '<path d="' + dome + '" fill="url(#' + u + 'bun)"/>' +
      '<path d="' + dome + '" fill="url(#' + u + 'shade)"/>' +
      specks +
      '<ellipse cx="218" cy="70" rx="130" ry="34" fill="#fff" opacity=".28" filter="url(#' + u + 'blur)"/>' +
      '<ellipse cx="190" cy="58" rx="46" ry="10" fill="#fff" opacity=".35" filter="url(#' + u + 'blur)"/>' +
      seeds +
      '<path d="' + dome + '" fill="none" stroke="url(#' + u + 'rim)" stroke-width="4"/>'
    );
  };

  ART.onion = function (u) {
    var rings = [[120, 22, 96, 9], [255, 24, 82, 8], [380, 20, 104, 10], [505, 23, 86, 8]];
    var b = '<defs><linearGradient id="' + u + 'on" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7B2D78"/><stop offset=".5" stop-color="#B562A6"/><stop offset="1" stop-color="#6E2368"/></linearGradient></defs>';
    rings.forEach(function (c) {
      b += '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="' + c[3] + '" fill="none" stroke="url(#' + u + 'on)" stroke-width="8"/>' +
           '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="' + (c[2] - 3) + '" ry="' + (c[3] - 2) + '" fill="none" stroke="#F7EEF6" stroke-width="3" opacity=".9"/>' +
           '<ellipse cx="' + c[0] + '" cy="' + (c[1] - 1) + '" rx="' + (c[2] - 12) + '" ry="' + (c[3] - 4) + '" fill="none" stroke="#E7CFE3" stroke-width="2" opacity=".6"/>';
    });
    return svg([620, 44], b);
  };

  ART.tomato = function (u) {
    var r = rng(3);
    function slice(cx, cy, rx, ry) {
      var loc = '';
      for (var i = 0; i < 4; i++) {
        var lx = cx - rx * 0.62 + i * rx * 0.41;
        loc += '<ellipse cx="' + f(lx) + '" cy="' + cy + '" rx="' + f(rx * 0.16) + '" ry="' + f(ry * 0.5) + '" fill="#FF8D5E"/>';
        for (var s = 0; s < 3; s++) {
          loc += '<ellipse cx="' + f(lx + (r() - 0.5) * rx * 0.18) + '" cy="' + f(cy + (r() - 0.5) * ry * 0.5) + '" rx="3" ry="1.8" fill="#FFE1A1"/>';
        }
      }
      return '<ellipse cx="' + cx + '" cy="' + (cy + 4) + '" rx="' + rx + '" ry="' + ry + '" fill="#8E0F0A"/>' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#' + u + 'tom)"/>' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (rx - 12) + '" ry="' + (ry - 6) + '" fill="#E63B26"/>' + loc +
        '<path d="M' + (cx - rx + 18) + ' ' + (cy - ry + 8) + 'Q' + cx + ' ' + (cy - ry - 4) + ' ' + (cx + rx - 30) + ' ' + (cy - ry + 6) + '" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>';
    }
    return svg([620, 64],
      '<defs><radialGradient id="' + u + 'tom" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#FF6A45"/><stop offset=".7" stop-color="#D3231A"/><stop offset="1" stop-color="#A3140E"/></radialGradient></defs>' +
      slice(170, 30, 152, 24) + slice(448, 32, 150, 24));
  };

  ART.bacon = function (u) {
    function strip(y0, phase, x0, x1, amp) {
      var top = [], bot = [], mid = [];
      for (var x = x0; x <= x1; x += 14) {
        var y = y0 + Math.sin(x / 36 + phase) * amp;
        top.push([x, y - 9]); mid.push([x, y]);
        bot.unshift([x, y + 9]);
      }
      var path = smooth(top.concat(bot));
      var line = function (off) { return 'M' + mid.map(function (p) { return f(p[0]) + ' ' + f(p[1] + off); }).join('L'); };
      return '<path d="' + path + '" fill="url(#' + u + 'bac)" stroke="#4A0F08" stroke-width="1.5"/>' +
        '<path d="' + line(-3) + '" stroke="#F4BFA0" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>' +
        '<path d="' + line(4) + '" stroke="#E7A07D" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>';
    }
    return svg([620, 70],
      '<defs><linearGradient id="' + u + 'bac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8432A"/><stop offset=".5" stop-color="#8E2516"/><stop offset="1" stop-color="#5C150B"/></linearGradient></defs>' +
      strip(40, 1.6, 22, 600, 8) + strip(30, 0, 8, 590, 10));
  };

  ART.cheese = function (u) {
    var drips = [[118, 11, 50], [206, 8, 28], [300, 13, 80], [392, 9, 42], [470, 12, 94], [552, 8, 34]];
    var d = '';
    drips.forEach(function (c, i) {
      var x = c[0], w = c[1], len = c[2], t = 36;
      d += '<g class="b-drip" style="--d:' + i + '"><path d="M' + (x - w) + ' ' + t + 'L' + (x + w) + ' ' + t +
        'C' + f(x + w * 0.6) + ' ' + f(t + len * 0.5) + ' ' + f(x + w * 0.95) + ' ' + (t + len) + ' ' + x + ' ' + f(t + len + w * 0.6) +
        'C' + f(x - w * 0.95) + ' ' + (t + len) + ' ' + f(x - w * 0.6) + ' ' + f(t + len * 0.5) + ' ' + (x - w) + ' ' + t + 'Z" fill="url(#' + u + 'ch)"/>' +
        '<ellipse cx="' + (x - w * 0.3) + '" cy="' + (t + len - 2) + '" rx="' + f(w * 0.28) + '" ry="' + f(w * 0.5) + '" fill="#FFF3C2" opacity=".7"/></g>';
    });
    return svg([640, 150],
      '<defs><linearGradient id="' + u + 'ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD960"/><stop offset=".55" stop-color="#F8B735"/><stop offset="1" stop-color="#E68A18"/></linearGradient>' +
      '<linearGradient id="' + u + 'chs" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE48A"/><stop offset=".5" stop-color="#FFC941"/><stop offset="1" stop-color="#F2A23A"/></linearGradient></defs>' +
      d +
      '<path class="b-cheese-slab" d="M8 22Q320 2 632 18L640 40Q622 46 612 46L600 106Q596 116 586 106L556 46L88 46L58 114Q50 124 42 114L30 46Q10 44 0 40Z" fill="url(#' + u + 'chs)"/>' +
      '<path d="M0 40Q10 44 30 46L88 46 556 46 612 46Q622 46 640 40" stroke="#D97A12" stroke-width="2" fill="none" opacity=".5"/>' +
      '<path d="M16 23Q320 5 626 20" stroke="#FFF4BE" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>');
  };

  ART.patty = function (u) {
    var r = rng(21), pts = [], x;
    for (x = 40; x <= 580; x += 24) pts.push([x, 13 + r() * 8]);
    pts.push([602, 26], [614, 60], [604, 94]);
    for (x = 580; x >= 40; x -= 24) pts.push([x, 106 + r() * 9]);
    pts.push([14, 94], [6, 60], [18, 26]);
    var shape = smooth(pts), tex = '';
    for (var i = 0; i < 260; i++) {
      var tx = 18 + r() * 584, ty = 18 + r() * 92, rr = 1 + r() * 3.6;
      var c = r() > 0.55 ? '#2A0F05' : (r() > 0.5 ? '#8B4A22' : '#5C2A12');
      tex += '<circle cx="' + f(tx) + '" cy="' + f(ty) + '" r="' + f(rr) + '" fill="' + c + '" opacity="' + f(0.35 + r() * 0.5) + '"/>';
    }
    var shine = '';
    for (var j = 0; j < 9; j++) {
      shine += '<ellipse cx="' + f(60 + r() * 500) + '" cy="' + f(26 + r() * 20) + '" rx="' + f(8 + r() * 18) + '" ry="2" fill="#FFD2A0" opacity="' + f(0.25 + r() * 0.3) + '"/>';
    }
    return svg([620, 120],
      '<defs><linearGradient id="' + u + 'pat" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#7A3C1B"/><stop offset=".25" stop-color="#5A2812"/><stop offset=".7" stop-color="#3B190B"/><stop offset="1" stop-color="#1E0A04"/></linearGradient>' +
        '<linearGradient id="' + u + 'patr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#FF8A3A" stop-opacity="0"/><stop offset="1" stop-color="#FF8A3A" stop-opacity=".35"/></linearGradient>' +
        '<clipPath id="' + u + 'pc"><path d="' + shape + '"/></clipPath></defs>' +
      '<path d="' + shape + '" fill="url(#' + u + 'pat)"/>' +
      '<g clip-path="url(#' + u + 'pc)">' + tex +
        '<rect width="620" height="120" fill="url(#' + u + 'patr)"/>' +
        '<path d="M0 30Q310 4 620 30L620 0 0 0Z" fill="#A0582A" opacity=".45"/>' + shine +
      '</g>');
  };

  ART.lettuce = function (u) {
    var r = rng(5), top = [], bot = [], x, veins = '';
    for (x = 0; x <= 640; x += 16) top.push([x, 26 + Math.sin(x / 23) * 5 + r() * 6]);
    for (x = 640; x >= 0; x -= 11) bot.push([x, 54 + Math.sin(x / 15 + 1) * 11 + r() * 16]);
    var back = [], fr;
    for (x = 0; x <= 640; x += 16) back.push([x, 32 + r() * 6]);
    for (x = 640; x >= 0; x -= 13) back.push([x, 64 + Math.sin(x / 12) * 12 + r() * 12]);
    for (var v = 0; v < 22; v++) {
      fr = 20 + r() * 600;
      veins += '<path d="M' + f(fr) + ' 34Q' + f(fr + (r() - 0.5) * 20) + ' 48 ' + f(fr + (r() - 0.5) * 30) + ' ' + f(56 + r() * 16) + '" stroke="#D9F59A" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/>';
    }
    return svg([640, 90],
      '<defs><linearGradient id="' + u + 'let" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9E36A"/><stop offset=".45" stop-color="#6DB22C"/><stop offset="1" stop-color="#2F6E14"/></linearGradient></defs>' +
      '<path d="' + smooth(back) + '" fill="#265A10"/>' +
      '<path d="' + smooth(top.concat(bot)) + '" fill="url(#' + u + 'let)"/>' + veins);
  };

  ART.bottomBun = function (u) {
    var r = rng(11), specks = '';
    for (var i = 0; i < 40; i++) specks += '<circle cx="' + f(50 + r() * 500) + '" cy="' + f(40 + r() * 70) + '" r="' + f(0.8 + r() * 1.6) + '" fill="#6e2a0a" opacity="' + f(0.12 + r() * 0.2) + '"/>';
    var shape = 'M26 20C26 9 40 5 62 5L538 5C560 5 574 9 574 20L571 70C567 110 520 126 300 128C80 126 33 110 29 70Z';
    return svg([600, 130],
      '<defs><linearGradient id="' + u + 'bb" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#F7DCAA"/><stop offset=".13" stop-color="#EDBF7C"/><stop offset=".2" stop-color="#DA8C3C"/>' +
        '<stop offset=".6" stop-color="#B4561B"/><stop offset="1" stop-color="#6E2A0C"/></linearGradient>' +
        '<linearGradient id="' + u + 'bbr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset=".85" stop-color="#FFB25A" stop-opacity="0"/><stop offset="1" stop-color="#FFB25A" stop-opacity=".45"/></linearGradient>' +
        '<filter id="' + u + 'bbl"><feGaussianBlur stdDeviation="6"/></filter></defs>' +
      '<path d="' + shape + '" fill="url(#' + u + 'bb)"/>' +
      '<path d="' + shape + '" fill="url(#' + u + 'bbr)"/>' + specks +
      '<ellipse cx="220" cy="62" rx="120" ry="12" fill="#fff" opacity=".2" filter="url(#' + u + 'bbl)"/>');
  };

  ART.shadow = function (u) {
    return svg([700, 120],
      '<defs><radialGradient id="' + u + 'sh" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset=".6" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + u + 'gl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F2A23A" stop-opacity=".55"/><stop offset="1" stop-color="#B5121B" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="350" cy="64" rx="350" ry="56" fill="url(#' + u + 'gl)"/>' +
      '<ellipse cx="350" cy="58" rx="290" ry="34" fill="url(#' + u + 'sh)"/>');
  };

  /* ---------- layer stack ------------------------------------------------
     Stage units: 600 x 640. x/y = top-left of each layer, w/h = viewBox size.
     z = depth for 3D, e = exploded offset, fl = float amplitude, rot = tilt
     when exploded. Order = paint order (bottom first).                    */
  var STAGE_W = 600, STAGE_H = 640;
  var LAYERS = [
    { k: 'shadow',    vb: [700, 120], x: -50, y: 528, z: -60, e: 30,   fl: 0, rot: 0 },
    { k: 'bottomBun', vb: [600, 130], x: 0,   y: 444, z: -30, e: 96,   fl: 5, rot: -2,  label: 'Brioche tostado na manteiga' },
    { k: 'lettuce',   vb: [640, 90],  x: -20, y: 420, z: -10, e: 54,   fl: 7, rot: 3,   label: 'Alface americana crocante' },
    { k: 'patty',     vb: [620, 120], x: -10, y: 334, z: 0,   e: 14,   fl: 6, rot: -1.5,label: 'Blend Angus 180g na brasa' },
    { k: 'cheese',    vb: [640, 150], x: -20, y: 318, z: 12,  e: -24,  fl: 7, rot: 2,   label: 'Cheddar inglês derretido' },
    { k: 'bacon',     vb: [620, 70],  x: -10, y: 290, z: 24,  e: -62,  fl: 8, rot: -3,  label: 'Bacon defumado na lenha' },
    { k: 'tomato',    vb: [620, 64],  x: -10, y: 268, z: 36,  e: -100, fl: 8, rot: 2.5, label: 'Tomate italiano maduro' },
    { k: 'onion',     vb: [620, 44],  x: -10, y: 256, z: 46,  e: -134, fl: 9, rot: -2,  label: 'Cebola roxa fatiada' },
    { k: 'topBun',    vb: [600, 240], x: 0,   y: 34,  z: 60,  e: -186, fl: 6, rot: 3,   label: 'Brioche com gergelim' }
  ];

  function art(name) {
    uidCounter++;
    return ART[name]('bb' + uidCounter + name.charAt(0));
  }

  /* ---------- Burger component ----------------------------------------- */

  function Burger(root, opts) {
    this.root = root;
    this.o = Object.assign({ labels: false, autoCycle: false, startExploded: 0, spread: 1, drop: 0, varTarget: null }, opts || {});
    this.explode = this.o.startExploded;   // current
    this.target = this.o.startExploded;    // manual target
    this.cycle = 0;                        // auto-cycle contribution
    this.scroll = 0;                       // scroll contribution
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.running = false;
    this.visible = true;
    this.t0 = performance.now();
    this.build();
  }

  Burger.prototype.build = function () {
    var root = this.root, self = this;
    root.classList.add('b-stage-wrap');
    var stage = document.createElement('div');
    stage.className = 'b-stage';
    this.layers = LAYERS.map(function (L, i) {
      var el = document.createElement('div');
      el.className = 'b-layer b-layer--' + L.k;
      el.style.left = (L.x / STAGE_W * 100) + '%';
      el.style.top = (L.y / STAGE_H * 100) + '%';
      el.style.width = (L.vb[0] / STAGE_W * 100) + '%';
      el.style.zIndex = i + 1;
      var inner = document.createElement('div');
      inner.className = 'b-layer__in';
      inner.innerHTML = art(L.k);
      el.appendChild(inner);
      if (self.o.labels && L.label) {
        var lab = document.createElement('span');
        lab.className = 'b-label' + (i % 2 ? ' b-label--left' : '');
        lab.innerHTML = '<i></i><b>' + L.label + '</b>';
        el.appendChild(lab);
      }
      stage.appendChild(el);
      return { el: el, inner: inner, L: L, phase: i * 1.37, speed: 0.6 + (i % 4) * 0.13 };
    });
    root.appendChild(stage);
    this.stage = stage;
    this.measure();
    this._onResize = function () { self.measure(); };
    global.addEventListener('resize', this._onResize, { passive: true });
    this.render(performance.now());
  };

  Burger.prototype.measure = function () {
    this.scale = this.stage.clientWidth / STAGE_W || 1;
  };

  Burger.prototype.setExplode = function (v) { this.target = Math.max(0, Math.min(1, v)); };
  Burger.prototype.setScroll = function (v) { this.scroll = Math.max(0, Math.min(1, v)); };
  Burger.prototype.setPointer = function (x, y) { this.pointer.tx = x; this.pointer.ty = y; };

  Burger.prototype.render = function (now) {
    var t = (now - this.t0) / 1000;
    var S = this.scale;

    // Auto cycle: hold assembled -> open -> hold open -> close (≈ 9s loop)
    if (this.o.autoCycle && !reduceMotion) {
      var c = (t % 9) / 9, v;
      if (c < 0.42) v = 0;
      else if (c < 0.55) v = ease((c - 0.42) / 0.13);
      else if (c < 0.85) v = 1;
      else v = 1 - ease((c - 0.85) / 0.15);
      this.cycle = v * 0.9;
    }
    var goal = Math.max(this.target, this.cycle, this.scroll);
    this.explode += (goal - this.explode) * 0.08;
    var E = this.explode;

    var p = this.pointer;
    p.x += (p.tx - p.x) * 0.07;
    p.y += (p.ty - p.y) * 0.07;

    this.stage.style.transform = 'rotateX(' + f(8 - p.y * 9 + E * 6) + 'deg) rotateY(' + f(p.x * 14) + 'deg)';
    this.root.style.setProperty('--explode', E.toFixed(3));
    if (this.o.varTarget) this.o.varTarget.style.setProperty('--explode', E.toFixed(3));

    for (var i = 0; i < this.layers.length; i++) {
      var o = this.layers[i], L = o.L;
      var fl = reduceMotion ? 0 : Math.sin(t * o.speed * 1.6 + o.phase) * L.fl * (0.35 + E * 0.9);
      var fx = reduceMotion ? 0 : Math.cos(t * o.speed + o.phase) * L.fl * 0.35 * E;
      var y = ((L.e * this.o.spread + this.o.drop) * E + fl + p.y * L.z * 0.18) * S;
      var x = (fx + p.x * L.z * 0.35) * S;
      var z = L.z * (1 + E * 2.2) * S;
      var r = L.rot * E + (reduceMotion ? 0 : Math.sin(t * o.speed + o.phase) * 0.6 * E);
      if (L.k === 'shadow') {
        o.el.style.transform = 'translate3d(' + f(x * 0.2) + 'px,' + f(y) + 'px,' + f(z) + 'px) scale(' + f(1 - E * 0.18) + ')';
        o.el.style.opacity = (1 - E * 0.35).toFixed(3);
      } else {
        o.el.style.transform = 'translate3d(' + f(x) + 'px,' + f(y) + 'px,' + f(z) + 'px) rotate(' + f(r) + 'deg)';
      }
    }
  };

  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  Burger.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    var self = this;
    (function loop(now) {
      if (!self.running) return;
      if (self.visible) self.render(now);
      self.raf = requestAnimationFrame(loop);
    })(performance.now());
  };

  Burger.prototype.stop = function () { this.running = false; cancelAnimationFrame(this.raf); };

  // Only animate while on screen.
  Burger.prototype.autoPause = function () {
    var self = this;
    if (!('IntersectionObserver' in global)) return this.start();
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        self.visible = en.isIntersecting;
        if (en.isIntersecting) self.start(); else self.stop();
      });
    }, { rootMargin: '120px' }).observe(this.root);
    return this;
  };

  /* Assembly animation: ingredients drop in one by one (loader). Returns a
     Promise resolved when the top bun lands. */
  Burger.prototype.assemble = function (opts) {
    opts = Object.assign({ step: 260, start: 200 }, opts || {});
    var self = this, S = this.scale;
    var total = 0;
    var anims = this.layers.map(function (o, i) {
      var delay = opts.start + i * opts.step;
      total = delay;
      if (o.L.k === 'shadow') {
        o.inner.style.opacity = 0;
        return o.inner.animate([{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: 700, delay: delay, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
      }
      var fromY = -(o.L.y + 260) * S;
      var a = o.inner.animate([
        { transform: 'translateY(' + f(fromY) + 'px) rotate(' + (i % 2 ? -8 : 8) + 'deg)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'translateY(' + f(8 * S) + 'px) scaleY(.92) rotate(0deg)', offset: 0.72 },
        { transform: 'translateY(' + f(-3 * S) + 'px) scaleY(1.02)', offset: 0.86 },
        { transform: 'translateY(0) scaleY(1)', opacity: 1 }
      ], { duration: 720, delay: delay, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'both' });
      if (o.L.k === 'cheese') {
        o.inner.querySelectorAll('.b-drip').forEach(function (d, j) {
          d.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(.35)', offset: 0.3 }, { transform: 'scaleY(1.08)', offset: 0.85 }, { transform: 'scaleY(1)' }],
            { duration: 1500 + j * 140, delay: delay + 520, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'both' });
        });
      }
      return a;
    });
    this.root.classList.add('is-assembling');
    return new Promise(function (resolve) {
      var last = anims[anims.length - 1];
      last.onfinish = function () { self.root.classList.remove('is-assembling'); self.root.classList.add('is-assembled'); resolve(); };
      if (reduceMotion) anims.forEach(function (a) { a.finish(); });
    }).then(function () { return total; });
  };

  Burger.prototype.destroy = function () {
    this.stop();
    global.removeEventListener('resize', this._onResize);
  };

  global.BrasaBurger = {
    create: function (el, opts) { return new Burger(el, opts); },
    art: art,                       // single ingredient SVG (for cards)
    reduceMotion: reduceMotion
  };
})(window);
