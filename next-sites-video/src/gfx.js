/* NEXT SITES — núcleo gráfico: utilitários, partículas, luz, tipografia cinética,
   dispositivos com projeção 3D em perspectiva e ícones vetoriais. */
(function () {
  const TL = window.NS_TIMELINE;
  const { W, H, COLORS: C } = TL;
  const FONT = 'Montserrat, Inter, "Helvetica Neue", Arial, sans-serif';

  /* ---------- matemática ---------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const smooth = (x, a, b) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const E = {
    outCubic: x => 1 - Math.pow(1 - x, 3),
    inCubic: x => x * x * x,
    inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuint: x => 1 - Math.pow(1 - x, 5),
    inOutQuint: x => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
    outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    inOutExpo: x => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    outBack: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    outBackSoft: x => { const c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  /* sobe de a→b, desce de b→c */
  const bump = (t, a, b, c) => (t < a || t > c ? 0 : t < b ? smooth(t, a, b) : 1 - smooth(t, b, c));

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (n) => { const r = mulberry32(n * 9301 + 49297); r(); return r(); };

  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }

  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /* ---------- sprites de brilho ---------- */
  function glowSprite(rgb) {
    const c = mk(128, 128), g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.12, `rgba(${rgb},0.85)`);
    gr.addColorStop(0.35, `rgba(${rgb},0.28)`);
    gr.addColorStop(0.7, `rgba(${rgb},0.06)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return c;
  }
  const RGB = { neon: '0,166,255', blue: '0,87,241', ice: '244,246,250' };
  const SPR = { neon: glowSprite(RGB.neon), blue: glowSprite(RGB.blue), ice: glowSprite(RGB.ice) };
  function glow(g, kind, x, y, rx, ry, a) {
    if (a <= 0.003) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, a);
    g.drawImage(SPR[kind], x - rx, y - (ry ?? rx), rx * 2, (ry ?? rx) * 2);
    g.restore();
  }

  /* ---------- campo de partículas 3D ---------- */
  const DEPTH = 3200, FOCAL = 720;
  const PARTS = [];
  (function () {
    const r = mulberry32(7);
    for (let i = 0; i < 720; i++) {
      const k = r();
      PARTS.push({
        x: (r() - 0.5) * 3600, y: (r() - 0.5) * 5600, z: r() * DEPTH,
        s: 0.45 + r() * r() * 3.2, ph: r() * 6.283,
        k: k < 0.55 ? 'neon' : k < 0.85 ? 'blue' : 'ice',
      });
    }
  })();

  /* velocidade da câmera ao longo do vídeo (unidades/s) */
  function camSpeed(t) {
    let v;
    if (t < 6) v = lerp(70, 300, E.inCubic(P(t, 0, 5.3)));
    else if (t < 12) v = 150;
    else if (t < 18) v = 60;
    else if (t < 29) v = 230;
    else v = t < 30.4 ? lerp(230, 120, P(t, 29, 30.3)) : 55;
    v += 2600 * bump(t, 5.3, 5.75, 6.6);
    v += 900 * bump(t, 11.65, 11.95, 12.5);
    v += 3200 * bump(t, 17.95, 18.2, 19.6);
    v += 2200 * bump(t, 30.1, 30.35, 31.2);
    return v;
  }
  const CAM_DT = 1 / 240, CAMZ = [0];
  for (let i = 1; i <= TL.DUR / CAM_DT + 10; i++) CAMZ.push(CAMZ[i - 1] + camSpeed(i * CAM_DT) * CAM_DT);
  const camZ = (t) => { const f = clamp(t, 0, TL.DUR + 1) / CAM_DT, i = Math.floor(f); return lerp(CAMZ[i], CAMZ[i + 1] ?? CAMZ[i], f - i); };

  function drawParticles(g, t, o = {}) {
    const alphaMul = o.alpha ?? 1, z0 = camZ(t), v = camSpeed(t);
    const stretch = Math.min(v * 0.07, 1400);
    const vort = o.vortex || 0, conv = o.converge || 0;
    const cx = W / 2, cy = o.cy ?? H / 2;
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (let i = 0; i < PARTS.length; i++) {
      const p = PARTS[i];
      const z = ((p.z - z0) % DEPTH + DEPTH) % DEPTH + 40;
      let x = p.x, y = p.y;
      if (vort || conv) {
        const a = vort * (1.4 - z / DEPTH);
        const ca = Math.cos(a), sa = Math.sin(a);
        const nx = x * ca - y * sa, ny = x * sa + y * ca;
        x = nx * (1 - conv); y = ny * (1 - conv);
      }
      const f = FOCAL / z, sx = cx + x * f, sy = cy + y * f;
      if (sx < -120 || sx > W + 120 || sy < -120 || sy > H + 120) continue;
      let a = smooth(z, 40, 420) * (1 - smooth(z, DEPTH * 0.65, DEPTH)) * (0.55 + 0.45 * Math.sin(t * 2.2 + p.ph));
      a *= alphaMul;
      if (a < 0.01) continue;
      const size = Math.min(46, p.s * f * 8);
      if (stretch > 60) {
        const f2 = FOCAL / (z + stretch);
        g.strokeStyle = `rgba(${RGB[p.k]},${(a * 0.8).toFixed(3)})`;
        g.lineWidth = Math.max(1, size * 0.32);
        g.beginPath(); g.moveTo(cx + x * f2, cy + y * f2); g.lineTo(sx, sy); g.stroke();
      }
      g.globalAlpha = a;
      g.drawImage(SPR[p.k], sx - size, sy - size, size * 2, size * 2);
    }
    g.restore();
  }

  /* ---------- linhas de luz ---------- */
  function streak(g, p, x0, y0, x1, y1, o = {}) {
    if (p <= 0 || p >= 1 + (o.len ?? 0.35)) return;
    const w = o.w ?? 3, len = o.len ?? 0.35, kind = o.kind ?? 'neon', a = o.a ?? 1;
    const hp = clamp(p), tp = clamp(p - len);
    const hx = lerp(x0, x1, hp), hy = lerp(y0, y1, hp), tx = lerp(x0, x1, tp), ty = lerp(y0, y1, tp);
    if (Math.hypot(hx - tx, hy - ty) < 1) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const gr = g.createLinearGradient(tx, ty, hx, hy);
    gr.addColorStop(0, `rgba(${RGB[kind]},0)`);
    gr.addColorStop(0.75, `rgba(${RGB[kind]},${0.55 * a})`);
    gr.addColorStop(1, `rgba(244,246,250,${a})`);
    g.strokeStyle = gr;
    g.lineWidth = w * 7; g.globalAlpha = 0.14; g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
    g.lineWidth = w; g.globalAlpha = 1; g.beginPath(); g.moveTo(tx, ty); g.lineTo(hx, hy); g.stroke();
    g.restore();
    if (p < 1) glow(g, kind, hx, hy, w * 16, w * 16, 0.9 * a);
  }

  /* linha que se expande a partir do centro */
  function laser(g, cx, y, halfW, a, w = 2) {
    if (a <= 0.003 || halfW < 1) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
    gr.addColorStop(0, 'rgba(0,166,255,0)');
    gr.addColorStop(0.5, `rgba(244,246,250,${a})`);
    gr.addColorStop(1, 'rgba(0,166,255,0)');
    g.fillStyle = gr;
    g.fillRect(cx - halfW, y - w / 2, halfW * 2, w);
    g.globalAlpha = a * 0.25; g.fillRect(cx - halfW, y - w * 4, halfW * 2, w * 8);
    g.restore();
    glow(g, 'neon', cx, y, halfW * 0.5, 30, a * 0.5);
  }

  function shockwave(g, cx, cy, p, maxR, a = 1, w = 24) {
    if (p <= 0 || p >= 1) return;
    const r = maxR * E.outCubic(p), al = a * (1 - p);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(0,166,255,${al * 0.5})`; g.lineWidth = w * (1 - p) + 2;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = `rgba(244,246,250,${al * 0.8})`; g.lineWidth = Math.max(1, w * 0.18 * (1 - p));
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.restore();
  }

  /* chão de grade em perspectiva */
  function grid(g, t, a, hy) {
    if (a <= 0.003) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineWidth = 1.5;
    for (let i = -16; i <= 16; i++) {
      const xf = W / 2 + i * 26, xn = W / 2 + i * 240;
      const gr = g.createLinearGradient(0, hy, 0, H);
      gr.addColorStop(0, 'rgba(0,166,255,0)');
      gr.addColorStop(1, `rgba(0,166,255,${0.5 * a})`);
      g.strokeStyle = gr;
      g.beginPath(); g.moveTo(xf, hy); g.lineTo(xn, H); g.stroke();
    }
    const off = camZ(t) * 0.35;
    for (let k = 0; k < 14; k++) {
      const zz = ((k * 100 - off) % 1400 + 1400) % 1400 + 70;
      const y = hy + (H - hy) * (70 / zz);
      const fa = a * 0.55 * Math.pow((y - hy) / (H - hy), 0.7);
      g.strokeStyle = `rgba(0,166,255,${fa})`;
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    g.restore();
    glow(g, 'neon', W / 2, hy, W * 0.7, 26, a * 0.6);
  }

  /* ---------- tipografia cinética ---------- */
  const font = (size, weight) => `${weight} ${size}px ${FONT}`;
  const measureCtx = mk(4, 4).getContext('2d');
  const LCACHE = new Map();
  /* segs: [[texto, destaque], ...] */
  function layout(segs, size, weight = 800, track = 0) {
    const key = JSON.stringify(segs) + '|' + size + '|' + weight + '|' + track;
    let L = LCACHE.get(key);
    if (L) return L;
    const g = measureCtx; g.font = font(size, weight);
    const full = segs.map(s => s[0]).join('');
    const chars = []; let idx = 0, word = 0;
    for (const [txt, hl] of segs) {
      for (const ch of txt) {
        const x = g.measureText(full.slice(0, idx)).width + idx * track;
        const w = g.measureText(ch).width;
        chars.push({ ch, x, w, hl: !!hl, word, i: idx });
        if (ch === ' ') word++;
        idx++;
      }
    }
    const width = g.measureText(full).width + Math.max(0, full.length - 1) * track;
    L = { chars, width, size, weight, track, n: idx, nWords: word + 1, text: full };
    LCACHE.set(key, L);
    return L;
  }
  function fit(segs, weight, maxW, maxSize, track = 0) {
    let s = maxSize;
    while (s > 12 && layout(segs, s, weight, track * s).width > maxW) s -= 2;
    return layout(segs, s, weight, track * s);
  }
  /* fx(c, L) -> {a, dx, dy, s, sx, sy, r, blur, hl, glow, col} */
  function drawLine(g, L, cx, cy, fx, o = {}) {
    g.save();
    g.font = font(L.size, L.weight);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (o.comp) g.globalCompositeOperation = o.comp;
    for (const c of L.chars) {
      if (c.ch === ' ') continue;
      const st = fx ? fx(c, L) : { a: 1 };
      if (!st || st.a <= 0.003) continue;
      const hl = st.hl !== undefined ? st.hl : c.hl;
      g.save();
      g.translate(cx - L.width / 2 + c.x + c.w / 2 + (st.dx || 0), cy + (st.dy || 0));
      if (st.r) g.rotate(st.r);
      const s = st.s ?? 1;
      if (s !== 1 || st.sx || st.sy) g.scale(s * (st.sx ?? 1), s * (st.sy ?? 1));
      g.globalAlpha = clamp(st.a);
      if (st.blur > 0.5) g.filter = `blur(${st.blur.toFixed(1)}px)`;
      if (o.fill) {
        g.fillStyle = o.fill;
      } else {
        g.fillStyle = st.col || (hl ? C.neon : C.ice);
        const gl = st.glow ?? 1;
        if (gl > 0) {
          g.shadowColor = hl ? 'rgba(0,166,255,0.95)' : 'rgba(0,166,255,0.45)';
          g.shadowBlur = (hl ? 38 : 16) * gl;
        }
      }
      g.fillText(c.ch, 0, 0);
      g.restore();
    }
    g.restore();
  }
  /* brilho que atravessa o texto */
  function shine(g, L, cx, cy, p, fx, a = 0.9) {
    if (p <= 0 || p >= 1) return;
    const x0 = cx - L.width / 2 - 260, x1 = cx + L.width / 2 + 260;
    const bx = lerp(x0, x1, p);
    const gr = g.createLinearGradient(bx - 160, cy - 80, bx + 160, cy + 80);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, `rgba(255,255,255,${a})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    drawLine(g, L, cx, cy, fx, { fill: gr, comp: 'lighter' });
  }

  /* ---------- dispositivo 3D (rotação em Y com perspectiva real por faixas) ---------- */
  const D3 = 2600;
  function device3D(g, face, back, o) {
    const res = o.res || 2;
    const w = face.width / res, h = face.height / res, s = o.s;
    const cos = Math.cos(o.ry), sin = Math.sin(o.ry);
    const d = (o.depth ?? 22) * s, hw = (w * s) / 2, hh = (h * s) / 2;
    const proj = (X, Z) => { const x = X * cos + Z * sin, z = -X * sin + Z * cos; const f = D3 / (D3 + z); return [x * f, f]; };
    g.save();
    g.translate(o.x, o.y);
    if (o.roll) g.rotate(o.roll);
    g.globalAlpha = o.alpha ?? 1;
    // brilho de contorno atrás do aparelho
    if (o.halo) glow(g, 'neon', 0, 0, hw * 1.9 * Math.max(0.35, Math.abs(cos)), hh * 1.25, o.halo * (o.alpha ?? 1));
    // lateral (espessura)
    if (Math.abs(sin) > 0.015) {
      const X = sin > 0 ? hw : -hw;
      const r = (o.radius ?? 60) * s * 0.75;
      const [xa, fa] = proj(X, -d / 2), [xb, fb] = proj(X, d / 2);
      const gr = g.createLinearGradient(0, -hh, 0, hh);
      gr.addColorStop(0, '#323b4f'); gr.addColorStop(0.5, '#0f131c'); gr.addColorStop(1, '#2a3243');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(xa, -(hh - r) * fa); g.quadraticCurveTo(xa, -hh * fa, (xa + xb) / 2, -(hh - r * 0.15) * ((fa + fb) / 2));
      g.lineTo(xb, -(hh - r) * fb);
      g.lineTo(xb, (hh - r) * fb);
      g.lineTo((xa + xb) / 2, (hh - r * 0.15) * ((fa + fb) / 2)); g.quadraticCurveTo(xa, hh * fa, xa, (hh - r) * fa);
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,166,255,0.55)'; g.lineWidth = 1.5; g.stroke();
    }
    const front = cos >= 0 || !back;
    const tex = front ? face : back;
    const Z = front ? -d / 2 : d / 2;
    const N = Math.max(16, Math.min(120, Math.round((Math.abs(cos) * hw * 2) / 6)));
    const Xof = u => (front ? (u - 0.5) * 2 * hw : (0.5 - u) * 2 * hw);
    let [px, pf] = proj(Xof(0), Z);
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const [nx, nf] = proj(Xof(u1), Z);
      const x0 = Math.min(px, nx), x1 = Math.max(px, nx);
      const f = (pf + nf) / 2, dh = hh * f;
      const sx = u0 * tex.width, sw = (u1 - u0) * tex.width;
      if (x1 - x0 > 0.05) g.drawImage(tex, sx, 0, sw, tex.height, x0, -dh, x1 - x0 + 0.7, dh * 2);
      px = nx; pf = nf;
    }
    g.restore();
    return { proj, hw, hh };
  }

  /* objeto extrudado (medalhas / emblema) — escala afim + camadas de espessura */
  function extruded(g, face, back, x, y, size, ry, o = {}) {
    const cos = Math.cos(ry), sin = Math.sin(ry);
    const depth = size * (o.depth ?? 0.16), L = 12, round = o.round ?? 0.5;
    const ac = Math.max(0.002, Math.abs(cos));
    g.save(); g.translate(x, y); g.globalAlpha = o.alpha ?? 1;
    for (let k = 0; k <= L; k++) {
      const off = sin * depth * (0.5 - k / L);
      const shade = 0.35 + 0.5 * (k / L);
      g.fillStyle = `rgb(${Math.round(3 * shade)},${Math.round(50 * shade)},${Math.round(150 * shade)})`;
      rr(g, off - (size / 2) * ac, -size / 2, size * ac, size, size * round * ac + 0.0001);
      g.fill();
    }
    g.translate(-sin * depth * 0.5, 0);
    const tex = cos >= 0 || !back ? face : back;
    g.scale(ac, 1);
    g.drawImage(tex, -size / 2, -size / 2, size, size);
    g.restore();
  }

  /* ---------- ícones (traço), centrados em (x,y), tamanho s ---------- */
  const I = {};
  function strokeSetup(g, col, lw) { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; }
  I.search = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.12); g.beginPath(); g.arc(x - s * 0.08, y - s * 0.08, s * 0.3, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x + s * 0.14, y + s * 0.14); g.lineTo(x + s * 0.4, y + s * 0.4); g.stroke(); };
  I.globe = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); g.beginPath(); g.arc(x, y, s * 0.42, 0, 7); g.stroke(); g.beginPath(); g.ellipse(x, y, s * 0.18, s * 0.42, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x - s * 0.42, y); g.lineTo(x + s * 0.42, y); g.stroke(); };
  I.camera = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); rr(g, x - s * 0.42, y - s * 0.26, s * 0.84, s * 0.6, s * 0.1); g.stroke(); g.beginPath(); g.arc(x, y + s * 0.04, s * 0.16, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x - s * 0.16, y - s * 0.26); g.lineTo(x - s * 0.08, y - s * 0.38); g.lineTo(x + s * 0.08, y - s * 0.38); g.lineTo(x + s * 0.16, y - s * 0.26); g.stroke(); };
  I.clock = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); g.beginPath(); g.arc(x, y, s * 0.42, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x, y - s * 0.24); g.lineTo(x, y); g.lineTo(x + s * 0.18, y + s * 0.1); g.stroke(); };
  I.slash = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); g.beginPath(); g.moveTo(x - s * 0.45, y - s * 0.45); g.lineTo(x + s * 0.45, y + s * 0.45); g.stroke(); };
  I.pin = (g, x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x, y + s * 0.48); g.bezierCurveTo(x - s * 0.5, y - s * 0.02, x - s * 0.36, y - s * 0.5, x, y - s * 0.5); g.bezierCurveTo(x + s * 0.36, y - s * 0.5, x + s * 0.5, y - s * 0.02, x, y + s * 0.48); g.fill(); g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(x, y - s * 0.14, s * 0.13, 0, 7); g.fill(); };
  I.star = (g, x, y, s, col, filled = true) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? s * 0.22 : s * 0.5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); if (filled) { g.fillStyle = col; g.fill(); } else { strokeSetup(g, col, s * 0.08); g.stroke(); } };
  I.imageOff = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.07); rr(g, x - s * 0.45, y - s * 0.35, s * 0.9, s * 0.7, s * 0.08); g.stroke(); g.beginPath(); g.moveTo(x - s * 0.38, y + s * 0.26); g.lineTo(x - s * 0.1, y - s * 0.04); g.lineTo(x + s * 0.08, y + s * 0.14); g.lineTo(x + s * 0.2, y + s * 0.02); g.lineTo(x + s * 0.38, y + s * 0.22); g.stroke(); g.beginPath(); g.arc(x + s * 0.2, y - s * 0.16, s * 0.07, 0, 7); g.stroke(); I.slash(g, x, y, s * 1.05, col); };
  I.route = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); g.beginPath(); g.moveTo(x - s * 0.3, y + s * 0.38); g.bezierCurveTo(x - s * 0.3, y, x + s * 0.3, y + s * 0.05, x + s * 0.3, y - s * 0.3); g.stroke(); g.beginPath(); g.arc(x - s * 0.3, y + s * 0.38, s * 0.08, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + s * 0.12, y - s * 0.22); g.lineTo(x + s * 0.3, y - s * 0.4); g.lineTo(x + s * 0.48, y - s * 0.22); g.stroke(); };
  I.linkBroken = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.1); g.save(); g.translate(x, y); g.rotate(-Math.PI / 4); rr(g, -s * 0.52, -s * 0.15, s * 0.42, s * 0.3, s * 0.15); g.stroke(); rr(g, s * 0.1, -s * 0.15, s * 0.42, s * 0.3, s * 0.15); g.stroke(); g.restore(); g.beginPath(); g.moveTo(x - s * 0.05, y - s * 0.42); g.lineTo(x - s * 0.02, y - s * 0.26); g.moveTo(x + s * 0.05, y + s * 0.42); g.lineTo(x + s * 0.02, y + s * 0.26); g.stroke(); };
  I.user = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); g.beginPath(); g.arc(x, y - s * 0.16, s * 0.18, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y + s * 0.5, s * 0.36, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); };
  I.cart = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); g.beginPath(); g.moveTo(x - s * 0.45, y - s * 0.32); g.lineTo(x - s * 0.3, y - s * 0.32); g.lineTo(x - s * 0.18, y + s * 0.18); g.lineTo(x + s * 0.34, y + s * 0.18); g.lineTo(x + s * 0.44, y - s * 0.16); g.lineTo(x - s * 0.24, y - s * 0.16); g.stroke(); g.beginPath(); g.arc(x - s * 0.12, y + s * 0.36, s * 0.07, 0, 7); g.arc(x + s * 0.28, y + s * 0.36, s * 0.07, 0, 7); g.fill(); };
  I.chat = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); rr(g, x - s * 0.42, y - s * 0.34, s * 0.84, s * 0.56, s * 0.16); g.stroke(); g.beginPath(); g.moveTo(x - s * 0.18, y + s * 0.22); g.lineTo(x - s * 0.24, y + s * 0.42); g.lineTo(x + s * 0.02, y + s * 0.22); g.stroke(); for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(x + i * s * 0.18, y - s * 0.06, s * 0.05, 0, 7); g.fill(); } };
  I.coin = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); g.beginPath(); g.arc(x, y, s * 0.42, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, s * 0.3, 0, 7); g.globalAlpha *= 0.5; g.stroke(); g.globalAlpha /= 0.5; g.beginPath(); g.moveTo(x + s * 0.12, y - s * 0.13); g.bezierCurveTo(x + s * 0.02, y - s * 0.2, x - s * 0.15, y - s * 0.16, x - s * 0.12, y - s * 0.05); g.bezierCurveTo(x - s * 0.08, y + s * 0.04, x + s * 0.14, y + s * 0.0, x + s * 0.13, y + s * 0.09); g.bezierCurveTo(x + s * 0.12, y + s * 0.2, x - s * 0.06, y + s * 0.2, x - s * 0.14, y + s * 0.13); g.moveTo(x, y - s * 0.26); g.lineTo(x, y + s * 0.26); g.stroke(); };
  I.menu = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.1); for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x - s * 0.36, y + i * s * 0.24); g.lineTo(x + s * 0.36, y + i * s * 0.24); g.stroke(); } };
  I.back = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.11); g.beginPath(); g.moveTo(x + s * 0.12, y - s * 0.3); g.lineTo(x - s * 0.18, y); g.lineTo(x + s * 0.12, y + s * 0.3); g.stroke(); };
  I.whats = (g, x, y, s, col = '#ffffff') => {
    strokeSetup(g, col, s * 0.085);
    g.beginPath(); g.arc(x, y, s * 0.4, Math.PI * 0.72, Math.PI * 2.62); g.stroke();
    g.beginPath(); g.moveTo(x - s * 0.27, y + s * 0.3); g.lineTo(x - s * 0.42, y + s * 0.44); g.lineTo(x - s * 0.2, y + s * 0.37); g.stroke();
    g.save(); g.translate(x, y); g.rotate(-0.2);
    g.beginPath(); g.moveTo(-s * 0.15, -s * 0.18); g.quadraticCurveTo(-s * 0.2, s * 0.02, s * 0.0, s * 0.15); g.quadraticCurveTo(s * 0.12, s * 0.22, s * 0.2, s * 0.14); g.lineWidth = s * 0.11; g.stroke();
    g.restore();
  };
  I.eye = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.08); g.beginPath(); g.moveTo(x - s * 0.48, y); g.quadraticCurveTo(x, y - s * 0.5, x + s * 0.48, y); g.quadraticCurveTo(x, y + s * 0.5, x - s * 0.48, y); g.stroke(); g.beginPath(); g.arc(x, y, s * 0.17, 0, 7); g.fill(); g.fillStyle = 'rgba(5,7,13,0.9)'; g.beginPath(); g.arc(x, y, s * 0.07, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x + s * 0.06, y - s * 0.06, s * 0.035, 0, 7); g.fill(); };
  I.shield = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.08); g.beginPath(); g.moveTo(x, y - s * 0.46); g.lineTo(x + s * 0.38, y - s * 0.3); g.lineTo(x + s * 0.36, y + s * 0.02); g.quadraticCurveTo(x + s * 0.3, y + s * 0.32, x, y + s * 0.48); g.quadraticCurveTo(x - s * 0.3, y + s * 0.32, x - s * 0.36, y + s * 0.02); g.lineTo(x - s * 0.38, y - s * 0.3); g.closePath(); g.stroke(); g.lineWidth = s * 0.1; g.beginPath(); g.moveTo(x - s * 0.16, y + s * 0.0); g.lineTo(x - s * 0.03, y + s * 0.14); g.lineTo(x + s * 0.19, y - s * 0.13); g.stroke(); };
  I.chart = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.08); const b = [[-0.36, 0.14], [-0.12, -0.02], [0.12, -0.18]]; for (const [bx, top] of b) { rr(g, x + bx * s - s * 0.08, y + top * s, s * 0.16, (0.42 - top) * s, s * 0.03); g.stroke(); } g.lineWidth = s * 0.09; g.beginPath(); g.moveTo(x - s * 0.44, y - s * 0.06); g.lineTo(x - s * 0.1, y - s * 0.28); g.lineTo(x + s * 0.06, y - s * 0.16); g.lineTo(x + s * 0.42, y - s * 0.44); g.stroke(); g.beginPath(); g.moveTo(x + s * 0.22, y - s * 0.46); g.lineTo(x + s * 0.44, y - s * 0.46); g.lineTo(x + s * 0.44, y - s * 0.24); g.stroke(); };
  I.truck = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.09); rr(g, x - s * 0.46, y - s * 0.24, s * 0.52, s * 0.4, s * 0.04); g.stroke(); g.beginPath(); g.moveTo(x + s * 0.06, y - s * 0.1); g.lineTo(x + s * 0.3, y - s * 0.1); g.lineTo(x + s * 0.44, y + s * 0.04); g.lineTo(x + s * 0.44, y + s * 0.16); g.lineTo(x + s * 0.06, y + s * 0.16); g.stroke(); g.beginPath(); g.arc(x - s * 0.24, y + s * 0.24, s * 0.08, 0, 7); g.moveTo(x + s * 0.34, y + s * 0.24); g.arc(x + s * 0.26, y + s * 0.24, s * 0.08, 0, 7); g.fill(); };
  I.tool = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.11); g.beginPath(); g.moveTo(x - s * 0.34, y + s * 0.34); g.lineTo(x + s * 0.08, y - s * 0.08); g.stroke(); g.beginPath(); g.arc(x + s * 0.2, y - s * 0.2, s * 0.17, Math.PI * 0.9, Math.PI * 2.6); g.stroke(); };
  I.spark = (g, x, y, s, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x, y - s * 0.46); g.quadraticCurveTo(x + s * 0.06, y - s * 0.06, x + s * 0.46, y); g.quadraticCurveTo(x + s * 0.06, y + s * 0.06, x, y + s * 0.46); g.quadraticCurveTo(x - s * 0.06, y + s * 0.06, x - s * 0.46, y); g.quadraticCurveTo(x - s * 0.06, y - s * 0.06, x, y - s * 0.46); g.fill(); };
  /* produtos ilustrados */
  I.watch = (g, x, y, s, col) => { g.fillStyle = col; rr(g, x - s * 0.16, y - s * 0.5, s * 0.32, s * 1.0, s * 0.1); g.globalAlpha *= 0.55; g.fill(); g.globalAlpha /= 0.55; g.beginPath(); g.arc(x, y, s * 0.3, 0, 7); g.fill(); g.fillStyle = '#05070D'; g.beginPath(); g.arc(x, y, s * 0.24, 0, 7); g.fill(); strokeSetup(g, '#00A6FF', s * 0.04); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - s * 0.15); g.moveTo(x, y); g.lineTo(x + s * 0.11, y + s * 0.05); g.stroke(); };
  I.bottle = (g, x, y, s, col) => { g.fillStyle = col; rr(g, x - s * 0.08, y - s * 0.5, s * 0.16, s * 0.14, s * 0.03); g.fill(); rr(g, x - s * 0.24, y - s * 0.32, s * 0.48, s * 0.82, s * 0.14); g.fill(); g.fillStyle = 'rgba(255,255,255,0.45)'; rr(g, x - s * 0.17, y - s * 0.22, s * 0.07, s * 0.55, s * 0.035); g.fill(); g.fillStyle = 'rgba(5,7,13,0.25)'; rr(g, x - s * 0.24, y + s * 0.0, s * 0.48, s * 0.2, 0); g.fill(); };
  I.bag = (g, x, y, s, col) => { g.fillStyle = col; rr(g, x - s * 0.36, y - s * 0.16, s * 0.72, s * 0.62, s * 0.08); g.fill(); strokeSetup(g, col, s * 0.07); g.beginPath(); g.arc(x, y - s * 0.16, s * 0.2, Math.PI, 0); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x, y + s * 0.12, s * 0.08, 0, 7); g.fill(); };
  I.headphones = (g, x, y, s, col) => { strokeSetup(g, col, s * 0.1); g.beginPath(); g.arc(x, y + s * 0.05, s * 0.38, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.fillStyle = col; rr(g, x - s * 0.46, y - s * 0.02, s * 0.2, s * 0.4, s * 0.08); g.fill(); rr(g, x + s * 0.26, y - s * 0.02, s * 0.2, s * 0.4, s * 0.08); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; rr(g, x - s * 0.42, y + s * 0.03, s * 0.05, s * 0.28, s * 0.02); g.fill(); };

  window.NSG = {
    W, H, C, FONT, RGB, clamp, lerp, P, smooth, E, bump, mulberry32, hash, mk, rr,
    SPR, glow, drawParticles, camSpeed, camZ, streak, laser, shockwave, grid,
    font, layout, fit, drawLine, shine, device3D, extruded, I,
  };
})();
