/* NEXT SITES — cenas e composição final. render(ctx, t) é uma função pura de t:
   o mesmo tempo sempre gera o mesmo quadro (necessário para exportar MP4). */
(function () {
  const G = window.NSG, S = window.NSS, TL = window.NS_TIMELINE;
  const { W, H, C, P, E, clamp, lerp, smooth, bump, hash, mk, rr, I, glow, layout, fit, drawLine, shine, streak, laser, shockwave } = G;
  const CUE = TL.CUE;
  const MAXW = 940;

  /* ---------- logo (substituível) ---------- */
  const LOGO = { img: null };
  const EM = 320;
  const emblemFace = mk(EM * 2, EM * 2), emblemBack = mk(EM * 2, EM * 2);
  function buildEmblem(shineP) {
    const g = emblemFace.getContext('2d');
    g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, EM, EM);
    if (LOGO.img) {
      const im = LOGO.img, k = Math.min(EM / im.width, EM / im.height);
      g.drawImage(im, (EM - im.width * k) / 2, (EM - im.height * k) / 2, im.width * k, im.height * k);
    } else {
      S.drawEmblemShape(g, EM / 2, EM / 2, EM);
    }
    if (shineP > 0 && shineP < 1) {
      g.save(); g.globalCompositeOperation = 'source-atop';
      const x = lerp(-EM * 0.6, EM * 1.6, shineP);
      const gr = g.createLinearGradient(x - 90, 0, x + 90, EM);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, EM, EM); g.restore();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const b = emblemBack.getContext('2d');
    b.setTransform(2, 0, 0, 2, 0, 0); b.clearRect(0, 0, EM, EM);
    const bg = b.createLinearGradient(0, EM, EM, 0); bg.addColorStop(0, '#032A80'); bg.addColorStop(1, C.blue);
    b.fillStyle = bg; rr(b, 0, 0, EM, EM, EM * (LOGO.img ? 0.215 : 0.26)); b.fill();
    b.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* ---------- medalhas 3D dos benefícios ---------- */
  const MD = 240;
  function medal(icon) {
    const f = mk(MD * 2, MD * 2), g = f.getContext('2d'); g.scale(2, 2);
    const r = MD / 2;
    const gr = g.createRadialGradient(r * 0.7, r * 0.6, 4, r, r, r);
    gr.addColorStop(0, C.neon); gr.addColorStop(0.55, C.blue); gr.addColorStop(1, '#03205E');
    g.fillStyle = gr; g.beginPath(); g.arc(r, r, r - 2, 0, 7); g.fill();
    g.strokeStyle = 'rgba(244,246,250,0.7)'; g.lineWidth = 3; g.beginPath(); g.arc(r, r, r - 4, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(0,166,255,0.9)'; g.lineWidth = 2; g.beginPath(); g.arc(r, r, r - 18, 0, 7); g.stroke();
    const hl = g.createLinearGradient(0, 0, 0, r);
    hl.addColorStop(0, 'rgba(255,255,255,0.35)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.beginPath(); g.ellipse(r, r * 0.55, r * 0.72, r * 0.42, 0, 0, 7); g.fill();
    g.save(); g.shadowColor = 'rgba(0,166,255,1)'; g.shadowBlur = 18;
    icon(g, r, r + 2, MD * 0.5, C.ice); g.restore();
    const b = mk(MD * 2, MD * 2), bg = b.getContext('2d'); bg.scale(2, 2);
    const g2 = bg.createLinearGradient(0, 0, MD, MD); g2.addColorStop(0, '#0057F1'); g2.addColorStop(1, '#021A4F');
    bg.fillStyle = g2; bg.beginPath(); bg.arc(r, r, r - 2, 0, 7); bg.fill();
    bg.strokeStyle = 'rgba(0,166,255,0.8)'; bg.lineWidth = 3; bg.beginPath(); bg.arc(r, r, r - 4, 0, 7); bg.stroke();
    return { f, b };
  }
  const MEDALS = [medal(I.eye), medal(I.shield), medal(I.chart)];

  /* ---------- holograma da pessoa (perfil) ---------- */
  const PERSON = new Path2D(
    'M120 300 C110 150 220 60 330 80 C420 95 455 170 455 240 L462 290 C470 320 500 360 515 390 C520 405 505 415 488 418 ' +
    'C492 430 495 445 486 455 C494 465 492 480 480 488 C482 510 478 535 455 548 C430 560 395 560 375 570 L380 640 ' +
    'C400 690 470 720 560 760 L560 900 L0 900 L0 760 C60 730 120 700 140 640 C150 600 130 560 120 520 C95 450 100 380 120 300 Z');
  const dotPat = (function () {
    const c = mk(10, 10), g = c.getContext('2d');
    g.fillStyle = 'rgba(0,166,255,0.9)'; g.beginPath(); g.arc(5, 5, 1.6, 0, 7); g.fill();
    return c;
  })();
  let dotPattern = null;
  function hologram(g, t, ox, oy, a) {
    if (a <= 0.003) return;
    dotPattern = dotPattern || g.createPattern(dotPat, 'repeat');
    const rev = E.inOutCubic(P(t, 6.5, 7.6));
    g.save();
    g.translate(ox, oy);
    g.globalAlpha = a;
    g.save();
    g.beginPath(); g.rect(-20, -20, 640, 920 * rev + 20); g.clip();
    g.save(); g.clip(PERSON);
    const bg = g.createLinearGradient(0, 0, 560, 0);
    bg.addColorStop(0, 'rgba(0,30,90,0.35)'); bg.addColorStop(1, 'rgba(0,87,241,0.55)');
    g.fillStyle = bg; g.fillRect(0, 0, 560, 900);
    g.globalAlpha = a * 0.55; g.fillStyle = dotPattern; g.fillRect(0, 0, 560, 900);
    g.globalAlpha = a;
    g.fillStyle = 'rgba(0,166,255,0.14)';
    const off = (t * 40) % 8;
    for (let y = off; y < 900; y += 8) g.fillRect(0, y, 560, 2);
    // luz do celular no rosto
    const fg = g.createRadialGradient(520, 400, 10, 520, 400, 300);
    fg.addColorStop(0, 'rgba(0,166,255,0.55)'); fg.addColorStop(1, 'rgba(0,166,255,0)');
    g.fillStyle = fg; g.fillRect(0, 0, 560, 900);
    const sweep = ((t - 6.5) * 260) % 1100 - 100;
    const sg = g.createLinearGradient(0, sweep - 60, 0, sweep + 60);
    sg.addColorStop(0, 'rgba(244,246,250,0)'); sg.addColorStop(0.5, 'rgba(244,246,250,0.28)'); sg.addColorStop(1, 'rgba(244,246,250,0)');
    g.fillStyle = sg; g.fillRect(0, sweep - 60, 560, 120);
    g.restore();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = 'rgba(0,166,255,0.9)'; g.lineWidth = 3; g.shadowColor = C.neon; g.shadowBlur = 24;
    g.stroke(PERSON);
    g.restore();
    if (rev > 0 && rev < 1) laser(g, 280, 920 * rev, 360, 0.9, 3);
    g.restore();
  }

  /* ---------- auxiliares de texto ---------- */
  const seg = (str, hlWords = []) => str.split(/(\s+)/).filter(Boolean).map(w => [w, hlWords.includes(w)]);

  /* entrada: letras vindas da profundidade */
  const fxDepth = (t, t0, stg, dur, seed = 1) => (c) => {
    const p = P(t, t0 + c.i * stg, t0 + c.i * stg + dur), e = E.outExpo(p);
    if (p <= 0) return null;
    const rx = (hash(c.i * 17 + seed) - 0.5), ry = (hash(c.i * 31 + seed) - 0.5);
    return { a: smooth(p, 0, 0.35), s: lerp(3.6, 1, e), dx: rx * 520 * (1 - e), dy: ry * 420 * (1 - e), r: rx * 1.2 * (1 - e), blur: 26 * (1 - e) };
  };
  /* entrada: subindo com desfoque */
  const fxRise = (t, t0, stg, dur, perWord = false) => (c, L) => {
    const k = perWord ? c.word : c.i;
    const p = P(t, t0 + k * stg, t0 + k * stg + dur), e = E.outExpo(p);
    if (p <= 0) return null;
    return { a: smooth(p, 0, 0.5), dy: L.size * 0.9 * (1 - e), blur: 14 * (1 - e), sy: lerp(1.25, 1, e) };
  };
  /* combinação com saída (zoom em direção à câmera) */
  function withExit(fx, t, t1, dur = 0.5, mode = 'zoom', cx = W / 2) {
    return (c, L) => {
      const st = fx(c, L);
      if (!st) return null;
      const p = P(t, t1, t1 + dur);
      if (p <= 0) return st;
      const e = E.inCubic(p);
      if (mode === 'zoom') {
        st.s = (st.s ?? 1) * (1 + e * 2.6); st.blur = (st.blur || 0) + e * 24; st.a *= 1 - smooth(p, 0.3, 1);
        st.dx = (st.dx || 0) + (c.x + c.w / 2 - L.width / 2) * e * 1.6;
      } else if (mode === 'up') {
        st.dy = (st.dy || 0) - e * 140; st.blur = (st.blur || 0) + e * 18; st.a *= 1 - e;
      } else if (mode === 'glitch') {
        const j = hash(c.i * 7 + Math.floor(t * 30));
        st.dx = (st.dx || 0) + (j - 0.5) * 80 * e; st.a *= j > e ? 1 - e * 0.5 : 0; st.blur = (st.blur || 0) + e * 6;
      }
      return st;
    };
  }
  /* desenho com aberração cromática em azuis (sem vermelho) */
  function drawGlitchLine(g, L, cx, cy, fx, amt) {
    if (amt > 0.01) {
      const ofs = 10 * amt;
      g.save(); g.globalCompositeOperation = 'lighter';
      drawLine(g, L, cx - ofs, cy, (c, l) => { const s = fx(c, l); if (!s) return null; return { ...s, a: s.a * 0.55 * amt, col: C.blue, hl: false, glow: 0 }; });
      drawLine(g, L, cx + ofs, cy, (c, l) => { const s = fx(c, l); if (!s) return null; return { ...s, a: s.a * 0.55 * amt, col: C.neon, hl: false, glow: 0 }; });
      g.restore();
    }
    drawLine(g, L, cx, cy, fx);
  }

  /* ---------- CENA 1 ---------- */
  function scene1(g, t) {
    // linhas de luz cruzando a tela
    streak(g, P(t, 0.55, 1.35), -200, 840, 1300, 760, { w: 4, len: 0.45 });
    streak(g, P(t, 0.9, 1.7), 1300, 1200, -220, 1120, { w: 2, kind: 'ice', len: 0.5, a: 0.8 });
    streak(g, P(t, 1.55, 2.4), -150, 1650, 1200, 260, { w: 2.5, kind: 'blue', len: 0.4 });
    streak(g, P(t, 2.5, 3.2), 1250, 1480, -200, 1420, { w: 3, len: 0.5 });
    streak(g, P(t, 3.55, 4.3), -200, 470, 1300, 560, { w: 2, kind: 'ice', len: 0.5, a: 0.7 });
    streak(g, P(t, 4.3, 5.0), 1180, 300, -100, 1700, { w: 2, kind: 'blue', len: 0.35 });
    // explosão radial de linhas na saída
    if (t > 5.3 && t < 6.4) {
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + 0.3, d0 = 120 + hash(i) * 80;
        const p = P(t, 5.3 + hash(i + 5) * 0.25, 5.95 + hash(i + 5) * 0.3);
        streak(g, p, W / 2 + Math.cos(a) * d0, 880 + Math.sin(a) * d0, W / 2 + Math.cos(a) * 1500, 880 + Math.sin(a) * 1500, { w: 2.5, len: 0.6, kind: i % 3 ? 'neon' : 'ice' });
      }
    }
    // linha laser que revela o texto
    const lp = P(t, 0.95, 1.7);
    laser(g, W / 2, 1000, 520 * E.outExpo(lp), (1 - smooth(t, 2.0, 2.8)) * smooth(t, 0.95, 1.1), 2);

    if (t > 6.2) return;
    // dolly da câmera no texto
    const dolly = 1 + 0.06 * P(t, 1, 5.3);
    g.save(); g.translate(W / 2, 880); g.scale(dolly, dolly); g.translate(-W / 2, -880);

    const up = E.inOutCubic(P(t, 2.85, 3.5));
    const L1 = fit(seg('O mundo'), 800, MAXW, 128);
    const L2 = fit(seg('está mudando.', ['mudando.']), 800, MAXW, 118);
    const s1 = lerp(1, 0.82, up);
    const y1 = lerp(800, 620, up), y2 = lerp(935, 728, up);
    g.save(); g.translate(W / 2, (y1 + y2) / 2); g.scale(s1, s1); g.translate(-W / 2, -(y1 + y2) / 2);
    const fxA = withExit(fxDepth(t, CUE.text1a, 0.045, 1.0, 3), t, CUE.exit1, 0.55);
    const fxB = withExit(fxDepth(t, CUE.text1a + 0.3, 0.04, 1.0, 9), t, CUE.exit1, 0.55);
    const pulse = 1 + 0.6 * bump(t, 2.1, 2.35, 2.9);
    drawLine(g, L1, W / 2, y1, (c, L) => { const s = fxA(c, L); if (s) s.a *= lerp(1, 0.78, up); return s; });
    drawLine(g, L2, W / 2, y2, (c, L) => { const s = fxB(c, L); if (!s) return null; if (c.hl) s.glow = pulse; else s.a *= lerp(1, 0.78, up); return s; });
    shine(g, L2, W / 2, y2, P(t, 2.15, 2.9), fxB, 0.8);
    g.restore();

    const L3 = fit(seg('E a forma de fazer'), 800, MAXW, 96);
    const L4 = fit(seg('negócios também.', ['negócios']), 800, MAXW, 108);
    const fxC = withExit(fxRise(t, CUE.text1b, 0.09, 0.8, true), t, CUE.exit1 + 0.05, 0.55);
    const fxD = withExit(fxRise(t, CUE.text1b + 0.45, 0.12, 0.8, true), t, CUE.exit1 + 0.05, 0.55);
    // máscara para o efeito de revelação por baixo
    g.save(); g.beginPath(); g.rect(0, 860, W, 300); if (t < CUE.exit1) g.clip();
    drawLine(g, L3, W / 2, 925, fxC);
    drawLine(g, L4, W / 2, 1050, (c, L) => { const s = fxD(c, L); if (s && c.hl) s.glow = 1 + bump(t, 3.9, 4.1, 4.8); return s; });
    g.restore();
    if (t > 3.9 && t < 4.9) {
      const hlStart = L4.chars.find(c => c.hl), hlEnd = [...L4.chars].reverse().find(c => c.hl);
      const x0 = W / 2 - L4.width / 2 + hlStart.x, x1 = W / 2 - L4.width / 2 + hlEnd.x + hlEnd.w;
      streak(g, P(t, 3.9, 4.6), x0 - 20, 1108, x1 + 20, 1108, { w: 3, len: 0.9 });
    }
    shine(g, L4, W / 2, 1050, P(t, 4.2, 5.0), fxD, 0.7);
    g.restore();
  }

  /* ---------- estado dos aparelhos (contínuo entre as cenas 2–4) ---------- */
  function phoneState(t) {
    const st = { x: 600, y: 1210, s: 1.15, ry: 0.35, roll: 0, alpha: 1, mode: 'search', halo: 0.5, depth: 24 };
    if (t < 7.4) {
      const p = P(t, CUE.phoneIn, 7.4), e = E.outExpo(p);
      st.s = lerp(0.12, 1.15, e); st.ry = 0.35 - (1 - E.outCubic(p)) * 5.8; st.y = lerp(1000, 1210, e); st.x = lerp(540, 600, e);
      st.alpha = smooth(t, CUE.phoneIn, CUE.phoneIn + 0.25); st.roll = (1 - e) * -0.4;
    } else if (t < 11.75) {
      st.s = lerp(1.15, 1.22, P(t, 7.4, 11.75));
      st.y = 1210 + Math.sin(t * 1.3) * 12;
      st.ry = 0.35 + Math.sin(t * 0.8) * 0.06; st.roll = Math.sin(t * 0.7) * 0.02;
    } else if (t < 18) {
      const p = E.inOutCubic(P(t, 11.75, 12.5));
      st.x = lerp(600, 540, p); st.y = lerp(1210, 1300, p); st.s = lerp(1.22, 1.0, p) + 0.05 * P(t, 12.5, 17.4);
      st.ry = lerp(0.35 + Math.sin(t * 0.8) * 0.06, Math.sin(t * 0.6) * 0.09, p);
      st.roll = Math.sin(t * 0.7) * 0.02 * (1 - p);
      st.mode = t < 11.95 ? 'search' : t < 12.45 ? 'push' : 'problem';
      st.push = P(t, 11.95, 12.45);
      st.halo = lerp(0.5, 0.18, p);
      const sh = bump(t, CUE.tapFail + 0.6, CUE.tapFail + 0.65, CUE.tapFail + 1.0);
      st.x += Math.sin(t * 80) * 10 * sh;
      st.glitch = 0.9 * bump(t, 12.45, 12.5, 12.7) + 0.7 * bump(t, 13.0, 13.03, 13.25) + 0.6 * bump(t, 14.4, 14.43, 14.6) +
        0.5 * bump(t, 15.9, 15.93, 16.05) + 0.9 * bump(t, 17.3, 17.7, 18.0);
      st.dim = 0.15 + 0.35 * P(t, 16.8, 17.9);
      const d = E.inOutCubic(P(t, 17.4, 18));
      st.s -= 0.06 * d; st.y += 20 * d;
    } else {
      // transformação
      const pulse = bump(t, 18, 18.12, 18.5);
      const sp = P(t, CUE.spinStart, CUE.spinEnd), se = E.inOutCubic(sp);
      st.mode = 'site';
      st.ry = se * Math.PI * 2;
      st.x = 540; st.y = lerp(1320, 1180, E.inOutCubic(P(t, 18.2, 19.9))); st.s = lerp(0.99, 1.22, E.inOutCubic(P(t, 18.1, 19.9))) + pulse * 0.05;
      if (st.ry < Math.PI / 2) { st.mode = 'problem'; st.dim = 0.5 * (1 - P(t, 18, 18.4)); st.glitch = 0.4 * (1 - P(t, 18, 18.3)); }
      st.halo = lerp(0.2, 0.75, P(t, 18, 19.9));
      st.build = P(t, CUE.spinStart + 0.8, CUE.build + 0.9);
      if (t > CUE.spinEnd) {
        const settle = E.outBackSoft(P(t, CUE.spinEnd, CUE.spinEnd + 0.8));
        st.ry = Math.PI * 2 + (1 - settle) * 0.25;
        const k = E.inOutCubic(P(t, CUE.devicesIn, CUE.devicesIn + 1.0));
        st.x = lerp(540, 590, k); st.y = lerp(1180, 1270, k) + Math.sin(t * 1.2) * 10; st.s = lerp(1.22, 1.08, k);
        st.ry += k * (-0.28 + Math.sin(t * 0.9) * 0.1);
        st.roll = Math.sin(t * 0.6) * 0.015;
      }
      // rolagem do site
      st.scroll = lerp(0, 470, E.inOutCubic(P(t, CUE.scroll1, CUE.scroll1 + 0.9))) +
        lerp(0, 560, E.inOutCubic(P(t, CUE.scroll2, CUE.scroll2 + 0.9))) +
        lerp(0, 820, E.inOutCubic(P(t, 25.0, 27.0)));
      // recuo durante os benefícios
      const rc = E.inOutCubic(P(t, CUE.exit4, CUE.exit4 + 0.9));
      st.s *= lerp(1, 0.86, rc); st.y += 90 * rc; st.alpha = lerp(1, 0.09, rc) * (1 - smooth(t, CUE.exitBenefits, CUE.exitBenefits + 0.6));
      st.halo *= lerp(1, 0.4, rc);
    }
    st.glare = 0.5 + Math.sin(st.ry) * 0.6;
    return st;
  }

  function drawPhone(g, t) {
    const st = phoneState(t);
    if (st.alpha <= 0.003) return st;
    const face = S.buildPhone(t, st);
    G.device3D(g, face, S.phoneBack, { x: st.x, y: st.y, s: st.s, ry: st.ry, roll: st.roll, alpha: st.alpha, depth: st.depth, radius: S.PH.r, halo: st.halo });
    return st;
  }

  function drawSideDevices(g, t) {
    if (t < CUE.devicesIn || t > 29.4) return;
    const k = E.outExpo(P(t, CUE.devicesIn, CUE.devicesIn + 1.1));
    const rc = E.inOutCubic(P(t, CUE.exit4, CUE.exit4 + 0.9));
    const fade = (1 - smooth(t, CUE.exitBenefits, CUE.exitBenefits + 0.6)) * lerp(1, 0.08, rc) * smooth(t, CUE.devicesIn, CUE.devicesIn + 0.3);
    if (fade <= 0.003) return;
    const sc = lerp(0, 380, E.inOutCubic(P(t, 22.2, 24.2)));
    // notebook
    const lx = lerp(-520, 310, k), ly = 850 + Math.sin(t * 0.9 + 1) * 8 + 60 * rc;
    const lface = S.buildLaptop(sc * 0.6, 0.5 - 0.3 * Math.sin(t * 0.5));
    const ls = 0.9 * lerp(1, 0.86, rc), lry = -0.42 + Math.sin(t * 0.7) * 0.04;
    // base do notebook
    const cos = Math.cos(lry), sin = Math.sin(lry), hw = (S.LP.w * ls) / 2, hh = (S.LP.h * ls) / 2;
    const pj = (X, Y, Z) => { const x = X * cos + Z * sin, z = -X * sin + Z * cos, f = 2600 / (2600 + z); return [lx + x * f, ly + Y * f]; };
    const b1 = pj(-hw, hh, 0), b2 = pj(hw, hh, 0), b3 = pj(hw * 1.1, hh + 22 * ls, -260 * ls), b4 = pj(-hw * 1.1, hh + 22 * ls, -260 * ls);
    g.save(); g.globalAlpha = fade;
    const bg = g.createLinearGradient(0, b1[1], 0, b3[1]); bg.addColorStop(0, '#202838'); bg.addColorStop(1, '#0A0D14');
    g.fillStyle = bg; g.beginPath(); g.moveTo(...b1); g.lineTo(...b2); g.lineTo(...b3); g.lineTo(...b4); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,166,255,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(...b4); g.lineTo(...b3); g.stroke();
    g.restore();
    G.device3D(g, lface, null, { x: lx, y: ly, s: ls, ry: lry, alpha: fade, depth: 8, radius: 22, halo: 0.35 });
    // tablet
    const tx = lerp(1600, 870, k), ty = 1230 + Math.sin(t * 1.1 + 2) * 10 + 60 * rc;
    const tface = S.buildTablet(sc * 0.9, 0.5 + 0.3 * Math.sin(t * 0.6));
    G.device3D(g, tface, null, { x: tx, y: ty, s: 0.66 * lerp(1, 0.86, rc), ry: 0.45 + Math.sin(t * 0.8) * 0.05, alpha: fade, depth: 16, radius: S.TB.r, halo: 0.35 });
  }

  /* ---------- CENA 2: textos ---------- */
  function scene2Text(g, t) {
    if (t < 6.5 || t > 12.2) return;
    const La = fit(seg('Seus clientes'), 800, MAXW, 100);
    const Lb = fit(seg('estão conectados.', ['conectados.']), 800, MAXW, 100);
    if (t < CUE.exit2a + 0.6) {
      const fa = withExit(fxRise(t, CUE.text2a, 0.03, 0.7), t, CUE.exit2a, 0.45, 'up');
      const fb = withExit(fxRise(t, CUE.text2a + 0.35, 0.03, 0.7), t, CUE.exit2a + 0.05, 0.45, 'up');
      drawLine(g, La, W / 2, 380, fa);
      drawLine(g, Lb, W / 2, 495, fb);
      shine(g, Lb, W / 2, 495, P(t, 7.6, 8.4), fb, 0.7);
      laser(g, W / 2, 568, 420 * E.outExpo(P(t, 7.1, 7.8)), 0.7 * (1 - smooth(t, CUE.exit2a - 0.2, CUE.exit2a + 0.2)), 2);
    }
    const words = [['Eles ', 'pesquisam.'], ['Comparam.'], ['Escolhem.']];
    const times = [CUE.word1, CUE.word2, CUE.word3];
    words.forEach((w, i) => {
      const segs = w.length === 2 ? [[w[0], false], [w[1], true]] : [[w[0], true]];
      const L = fit(segs, 800, MAXW, 100);
      const y = 330 + i * 118;
      const active = t >= times[i] && (i === 2 || t < times[i + 1]);
      const done = t >= (times[i + 1] ?? 99);
      const fx = withExit(fxRise(t, times[i], 0.025, 0.6), t, CUE.exit2, 0.5, 'up');
      drawLine(g, L, W / 2, y, (c, LL) => {
        const s = fx(c, LL); if (!s) return null;
        if (c.hl) { s.hl = !done || i === 2; if (done && i !== 2) s.a *= 0.55; s.glow = active ? 1.4 : 0.6; }
        else if (done) s.a *= 0.55;
        return s;
      });
      if (active) laser(g, W / 2, y + 58, 260 * E.outExpo(P(t, times[i], times[i] + 0.5)), 0.6 * (1 - smooth(t, CUE.exit2, CUE.exit2 + 0.3)), 2);
    });
  }

  /* ---------- CENA 3 ---------- */
  const LOSS = [I.user, I.cart, I.chat, I.coin];
  function lossIcons(g, t, ph) {
    CUE.losses.forEach((t0, k) => {
      const p = P(t, t0, t0 + 1.9);
      if (p <= 0 || p >= 1) return;
      const dir = k % 2 ? 1 : -1;
      const sx = ph.x + dir * 60, sy = ph.y - 180 + k * 50;
      const ex = W / 2 + dir * (360 + k * 20), ey = sy - 260 + k * 40;
      const mp = E.outCubic(clamp(p / 0.6));
      const x = lerp(sx, ex, mp), y = lerp(sy, ey, mp) + Math.sin(t * 3 + k) * 6;
      const dis = P(p, 0.55, 1);
      // linha de conexão que se rompe
      if (dis < 0.3) {
        g.save(); g.setLineDash([10, 12]); g.lineDashOffset = -t * 60;
        g.strokeStyle = `rgba(0,166,255,${0.35 * (1 - dis / 0.3)})`; g.lineWidth = 2;
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(lerp(sx, x, 0.7), lerp(sy, y, 0.7)); g.stroke(); g.restore();
      }
      const a = smooth(p, 0, 0.12) * (1 - dis);
      if (a > 0.01) {
        const r = 62 * (1 + dis * 0.25);
        g.save(); g.globalAlpha = a;
        glow(g, 'blue', x, y, r * 2.2, r * 2.2, 0.5);
        g.fillStyle = 'rgba(8,14,30,0.85)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.strokeStyle = 'rgba(0,166,255,0.8)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
        LOSS[k](g, x, y, r * 1.05, C.ice);
        // rachadura
        if (dis > 0) {
          g.strokeStyle = `rgba(5,7,13,${0.9})`; g.lineWidth = 4;
          g.beginPath(); g.moveTo(x - r * 0.2, y - r); g.lineTo(x + r * 0.05, y - r * 0.2); g.lineTo(x - r * 0.15, y + r * 0.2); g.lineTo(x + r * 0.1, y + r); g.stroke();
        }
        g.restore();
      }
      // dissolução em partículas
      if (dis > 0) {
        for (let i = 0; i < 30; i++) {
          const ang = hash(k * 100 + i) * Math.PI * 2, sp = 60 + hash(k * 100 + i + 50) * 220;
          const px = x + Math.cos(ang) * sp * dis + dir * 120 * dis * dis, py = y + Math.sin(ang) * sp * dis - 60 * dis;
          glow(g, i % 3 ? 'neon' : 'ice', px, py, 10, 10, (1 - dis) * 0.9);
        }
      }
    });
  }

  function scene3Text(g, t) {
    if (t < 12.9 || t > 18.1) return;
    const La = fit(seg('E sua empresa?', ['empresa?']), 900, MAXW, 128);
    const pa = P(t, CUE.hit3a, CUE.hit3a + 0.4), ea = E.outExpo(pa);
    const glitchA = 0.9 * bump(t, CUE.hit3a, CUE.hit3a + 0.05, CUE.hit3a + 0.35) + 0.9 * P(t, CUE.exit3, CUE.exit3 + 0.4);
    const fxA = withExit((c) => (pa <= 0 ? null : { a: smooth(pa, 0, 0.3), s: lerp(2.8, 1, ea), blur: 22 * (1 - ea), dx: (c.x + c.w / 2 - La.width / 2) * 0.6 * (1 - ea) }), t, CUE.exit3, 0.5, 'glitch');
    const y0 = lerp(560, 400, E.inOutCubic(P(t, 14.1, 14.6)));
    drawGlitchLine(g, La, W / 2, y0, fxA, glitchA);
    shockwave(g, W / 2, y0, P(t, CUE.hit3a, CUE.hit3a + 0.9), 900, 0.8, 30);

    const Lb = fit(seg('Está sendo'), 800, MAXW, 104);
    const Lc = fit(seg('encontrada?', ['encontrada?']), 900, MAXW, 140);
    const fxB = withExit((c) => {
      const st = CUE.hit3b + hash(c.i * 13 + 2) * 0.35, p = P(t, st, st + 0.25);
      if (p <= 0) return null;
      const j = p < 1 ? (hash(c.i + Math.floor(t * 40)) - 0.5) * 30 * (1 - p) : 0;
      return { a: p < 1 ? (hash(c.i * 3 + Math.floor(t * 40)) > 0.35 ? 1 : 0.2) : 1, dx: j, blur: 6 * (1 - p) };
    }, t, CUE.exit3, 0.5, 'glitch');
    const pc = P(t, CUE.hit3b + 0.25, CUE.hit3b + 0.65), ec = E.outExpo(pc);
    const fxC = withExit((c) => (pc <= 0 ? null : { a: smooth(pc, 0, 0.3), s: lerp(2.2, 1, ec), blur: 18 * (1 - ec), glow: 1 + 0.8 * bump(t, 15.0, 15.3, 16.2) }), t, CUE.exit3, 0.5, 'glitch');
    const gb = 0.8 * bump(t, CUE.hit3b, CUE.hit3b + 0.05, CUE.hit3b + 0.5) + 0.9 * P(t, CUE.exit3, CUE.exit3 + 0.4) + 0.5 * bump(t, 15.9, 15.93, 16.05);
    drawGlitchLine(g, Lb, W / 2, 545, fxB, gb);
    drawGlitchLine(g, Lc, W / 2, 680, fxC, gb);
    shine(g, Lc, W / 2, 680, P(t, 15.2, 16.1), fxC, 0.7);
    laser(g, W / 2, 770, 460 * E.outExpo(P(t, CUE.hit3b + 0.5, CUE.hit3b + 1.2)), 0.75 * (1 - smooth(t, CUE.exit3 - 0.2, CUE.exit3 + 0.2)), 3);
  }

  /* ---------- CENA 4: transformação ---------- */
  function transformFX(g, t, ph) {
    if (t < 17.9 || t > 20.6) return;
    // anel de energia
    shockwave(g, ph.x, ph.y, P(t, 18.0, 18.9), 1300, 1, 40);
    shockwave(g, ph.x, ph.y, P(t, 18.15, 19.2), 900, 0.7, 20);
    // feixes verticais durante o giro
    const sp = bump(t, 18.2, 19.0, 20.0);
    if (sp > 0) {
      glow(g, 'neon', ph.x, ph.y, 240 * sp + 60, 900 * sp, 0.5 * sp);
      glow(g, 'ice', ph.x, ph.y, 40 * sp + 10, 700 * sp, 0.5 * sp);
      for (let i = 0; i < 26; i++) {
        const a = hash(i * 3) * Math.PI * 2, r = 200 + hash(i * 3 + 1) * 380;
        const p = P(t, 18.2 + hash(i) * 0.9, 19.0 + hash(i) * 1.0);
        if (p <= 0 || p >= 1) continue;
        const rr2 = r * (1 - E.inCubic(p));
        glow(g, i % 2 ? 'neon' : 'ice', ph.x + Math.cos(a + p * 3) * rr2, ph.y + Math.sin(a + p * 3) * rr2 * 1.4, 14, 14, (1 - p) * 0.9);
      }
    }
    // faíscas na conclusão
    const bp = P(t, CUE.spinEnd - 0.05, CUE.spinEnd + 0.9);
    if (bp > 0 && bp < 1) {
      for (let i = 0; i < 40; i++) {
        const a = hash(i * 7 + 3) * Math.PI * 2, v = 300 + hash(i * 7 + 4) * 700;
        const e = E.outCubic(bp);
        glow(g, i % 3 ? 'neon' : 'ice', ph.x + Math.cos(a) * v * e, ph.y + Math.sin(a) * v * e, 9, 9, 1 - bp);
      }
      shockwave(g, ph.x, ph.y, bp, 1000, 0.8, 18);
    }
  }

  function scene4Text(g, t) {
    if (t < 20.4 || t > 25.3) return;
    const lines = [
      fit(seg('Sua empresa merece'), 800, MAXW, 84),
      fit([['uma ', false], ['presença digital', true]], 800, MAXW, 84),
      fit(seg('profissional.', ['profissional.']), 900, MAXW, 104),
    ];
    const ys = [300, 405, 520];
    lines.forEach((L, i) => {
      const fx = withExit(fxRise(t, CUE.text4 + i * 0.32, 0.09, 0.75, true), t, CUE.exit4 + i * 0.06, 0.5, 'up');
      g.save(); g.beginPath(); g.rect(0, ys[i] - L.size, W, L.size * 1.9); if (t < CUE.exit4) g.clip();
      drawLine(g, L, W / 2, ys[i], fx);
      g.restore();
      if (i === 2) shine(g, L, W / 2, ys[i], P(t, 22.0, 22.9), fx, 0.8);
    });
    laser(g, W / 2, 600, 460 * E.outExpo(P(t, 21.3, 22.1)), 0.7 * (1 - smooth(t, CUE.exit4 - 0.2, CUE.exit4 + 0.2)), 2);
  }

  function benefits(g, t) {
    if (t < 24.8 || t > 29.4) return;
    const items = [['VISIBILIDADE'], ['CREDIBILIDADE'], ['OPORTUNIDADES']];
    items.forEach(([word], i) => {
      const t0 = CUE.benefits[i];
      if (t < t0) return;
      const yc = 560 + i * 400;
      const ex = P(t, CUE.exitBenefits + i * 0.08, CUE.exitBenefits + 0.55 + i * 0.08), ee = E.inCubic(ex);
      const exS = 1 + ee * 1.2, exA = 1 - smooth(ex, 0.2, 1), exY = -ee * 120;
      g.save();
      g.translate(W / 2, yc + exY); g.scale(exS, exS); g.translate(-W / 2, -yc);
      if (ex > 0) g.filter = `blur(${(ee * 14).toFixed(1)}px)`;
      // medalha 3D
      const mp = P(t, t0, t0 + 0.9);
      const ms = E.outBack(P(t, t0, t0 + 0.6));
      const ry = -(1 - E.outCubic(mp)) * Math.PI * 3 + Math.sin(t * 1.4 + i) * 0.35;
      const my = yc - 92 + Math.sin(t * 2 + i) * 5;
      glow(g, 'neon', W / 2, my, 230 * ms, 200 * ms, 0.55 * exA);
      shockwave(g, W / 2, my, P(t, t0 + 0.05, t0 + 0.8), 420, 0.8 * exA, 16);
      if (ms > 0.01) {
        const m = MEDALS[i];
        G.extruded(g, m.f, m.b, W / 2, my, 200 * ms, ry, { alpha: exA, depth: 0.18, round: 0.5 });
      }
      // "MAIS"
      const LM = layout([['MAIS', false]], 42, 700, 16);
      const pm = P(t, t0 + 0.2, t0 + 0.8), em = E.outExpo(pm);
      const LMw = layout([['MAIS', false]], 42, 700, lerp(60, 16, em));
      drawLine(g, LMw, W / 2, yc + 34, () => (pm <= 0 ? null : { a: smooth(pm, 0, 0.5) * exA * 0.9, blur: 8 * (1 - em), glow: 0.5 }));
      // palavra principal
      const LW = fit([[word, true]], 900, MAXW, 100);
      const fx = (c) => {
        const p = P(t, t0 + 0.28 + c.i * 0.028, t0 + 0.28 + c.i * 0.028 + 0.5), e = E.outExpo(p);
        if (p <= 0) return null;
        return { a: smooth(p, 0, 0.4) * exA, dy: 70 * (1 - e), blur: 12 * (1 - e), sy: lerp(1.4, 1, e), glow: 1 + 0.7 * bump(t, t0 + 0.9, t0 + 1.1, t0 + 1.6) };
      };
      g.save(); g.beginPath(); g.rect(0, yc + 50, W, 140); if (ex <= 0) g.clip();
      drawLine(g, LW, W / 2, yc + 118, fx);
      g.restore();
      shine(g, LW, W / 2, yc + 118, P(t, t0 + 0.85, t0 + 1.6), fx, 0.9);
      void LM;
      g.restore();
    });
  }

  /* ---------- CENA 5 ---------- */
  function scene5(g, t) {
    if (t < 28.8) return;
    const cy = 930;
    // linhas de luz convergindo
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.2;
      const p = P(t, 29.05 + hash(i * 5) * 0.5, 29.75 + hash(i * 5) * 0.55);
      streak(g, p, W / 2 + Math.cos(a) * 1500, cy + Math.sin(a) * 1500, W / 2 + Math.cos(a) * 30, cy + Math.sin(a) * 30, { w: 3, len: 0.5, kind: i % 3 ? 'neon' : 'ice' });
    }
    // núcleo de energia
    const cp = P(t, CUE.core, CUE.logo);
    if (cp > 0 && t < CUE.logo + 0.4) {
      const r = 20 + 140 * E.inCubic(cp), fl = 1 + 0.15 * Math.sin(t * 40);
      const fade = 1 - P(t, CUE.logo, CUE.logo + 0.4);
      glow(g, 'neon', W / 2, cy, r * 3 * fl, r * 3 * fl, 0.9 * fade);
      glow(g, 'ice', W / 2, cy, r * fl, r * fl, 1 * fade);
    }
    if (t < CUE.logo - 0.05) return;
    shockwave(g, W / 2, cy, P(t, CUE.logo, CUE.logo + 1.1), 1500, 1, 44);
    shockwave(g, W / 2, cy, P(t, CUE.logo + 0.12, CUE.logo + 1.3), 1000, 0.7, 20);

    // raios volumétricos atrás da logo
    const ra = smooth(t, CUE.logo, CUE.logo + 0.8) * (0.85 + 0.15 * Math.sin(t * 1.5));
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(W / 2, cy); g.rotate(t * 0.08);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2, wv = 0.05 + 0.04 * hash(i);
      const gr = g.createRadialGradient(0, 0, 60, 0, 0, 1100);
      gr.addColorStop(0, `rgba(0,166,255,${0.16 * ra})`); gr.addColorStop(1, 'rgba(0,166,255,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1100, a - wv, a + wv); g.closePath(); g.fill();
    }
    g.restore();
    glow(g, 'neon', W / 2, cy, 520, 520, 0.4 * ra);
    // reflexo no chão
    glow(g, 'blue', W / 2, cy + 260, 380, 40, 0.6 * ra);

    // emblema
    const lp = P(t, CUE.logo, CUE.logo + 1.1);
    const ls = lerp(0.35, 1, E.outBack(P(t, CUE.logo, CUE.logo + 0.8)));
    const lry = (1 - E.outCubic(lp)) * 1.6 + Math.sin(t * 0.9) * 0.08 * smooth(t, 31.5, 32.5);
    const fy = cy + Math.sin(t * 1.4) * 6 * smooth(t, 31.5, 32.5);
    buildEmblem(Math.max(P(t, CUE.logo + 0.6, CUE.logo + 1.4) * (t < CUE.logo + 1.4 ? 1 : 0), P(t, CUE.shine, CUE.shine + 1.0)));
    G.extruded(g, emblemFace, emblemBack, W / 2, fy, 300 * ls, lry, { depth: LOGO.img ? 0.12 : 0.14, round: LOGO.img ? 0.215 : 0.26, alpha: smooth(t, CUE.logo, CUE.logo + 0.15) });

    // marca
    const wp = P(t, CUE.wordmark, CUE.wordmark + 0.9), we = E.outExpo(wp);
    if (wp > 0) {
      const tr = lerp(70, 10, we);
      const LW = fit([['NEXT ', false], ['SITES', true]], 900, MAXW, 124, 0);
      const LW2 = layout([['NEXT ', false], ['SITES', true]], LW.size, 900, tr);
      const fx = (c) => ({ a: smooth(wp, 0, 0.5), blur: 16 * (1 - we), glow: 1 + 0.6 * bump(t, CUE.shine, CUE.shine + 0.4, CUE.shine + 1.2) });
      drawLine(g, LW2, W / 2, 1200, fx);
      shine(g, LW2, W / 2, 1200, P(t, CUE.shine + 0.25, CUE.shine + 1.15), fx, 0.9);
      laser(g, W / 2, 1272, 300 * E.outExpo(P(t, CUE.wordmark + 0.3, CUE.wordmark + 1.1)), 0.8, 2);
    }
    // slogan
    const tp = P(t, CUE.tagline, CUE.tagline + 1.0);
    if (tp > 0) {
      const LT = fit(seg('Transformando negócios'), 600, 900, 54, 0.01);
      const LT2 = fit(seg('em presença digital.'), 600, 900, 54, 0.01);
      const LT2b = layout(LT2.chars.length ? [['em presença digital.', false]] : [], LT.size, 600, 0.01 * LT.size);
      const rev = E.inOutCubic(tp);
      const x0 = W / 2 - LT.width / 2 - 10, x1 = W / 2 + LT.width / 2 + 10;
      const xr = lerp(x0, x1, rev);
      g.save(); g.beginPath(); g.rect(0, 1290, xr, 160); g.clip();
      drawLine(g, LT, W / 2, 1335, () => ({ a: 0.95, glow: 0.4 }));
      drawLine(g, LT2b, W / 2, 1405, () => ({ a: 0.95, glow: 0.4 }));
      g.restore();
      if (rev < 1) { glow(g, 'ice', xr, 1370, 30, 70, 0.9); glow(g, 'neon', xr, 1370, 90, 100, 0.6); }
    }
    // título principal
    const L1 = fit(seg('SUA EMPRESA MERECE'), 900, MAXW, 92);
    const L2 = fit(seg('ESTAR NA INTERNET.', ['INTERNET.']), 900, MAXW, 92);
    const fh = (t0) => (c) => {
      const p = P(t, t0 + c.word * 0.11, t0 + c.word * 0.11 + 0.7), e = E.outExpo(p);
      if (p <= 0) return null;
      return { a: smooth(p, 0, 0.4), s: lerp(1.9, 1, e), blur: 18 * (1 - e), glow: c.hl ? 1 + 0.5 * bump(t, 32.2, 32.5, 33.2) : 0.8 };
    };
    const hy = Math.sin(t * 1.1) * 4 * smooth(t, 32, 33);
    drawLine(g, L1, W / 2, 455 + hy, fh(CUE.headline));
    drawLine(g, L2, W / 2, 565 + hy, fh(CUE.headline + 0.33));
    shine(g, L2, W / 2, 565 + hy, P(t, 32.3, 33.1), fh(CUE.headline + 0.33), 0.8);
    shine(g, L1, W / 2, 455 + hy, P(t, CUE.shine + 0.6, CUE.shine + 1.4), fh(CUE.headline), 0.6);
  }

  /* ---------- atmosfera, flashes, tremor ---------- */
  const IMPACTS = [[1.2, 4], [6.9, 5], [13.0, 20], [14.65, 11], [18.0, 26], [24.95, 6], [26.25, 6], [27.55, 6], [30.3, 18]];
  function shake(t) {
    let x = 0, y = 0;
    for (const [ti, a] of IMPACTS) {
      const d = t - ti; if (d < 0 || d > 0.8) continue;
      const k = a * Math.exp(-d * 7);
      x += Math.sin(d * 93 + ti) * k; y += Math.cos(d * 71 + ti * 2) * k;
    }
    return [x, y];
  }
  const FLASHES = [[1.25, 0.14], [5.65, 0.3], [13.0, 0.32], [14.65, 0.2], [18.0, 0.75], [19.85, 0.3], [24.95, 0.12], [26.25, 0.12], [27.55, 0.12], [30.3, 0.9]];
  function flashes(g, t) {
    let a = 0;
    for (const [ti, k] of FLASHES) { const d = t - ti; if (d >= -0.04 && d < 0.9) a += k * (d < 0 ? 1 + d / 0.04 : Math.exp(-d * 6)); }
    if (a <= 0.003) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.48, H * 0.7);
    gr.addColorStop(0, `rgba(244,246,250,${Math.min(1, a)})`); gr.addColorStop(0.4, `rgba(0,166,255,${Math.min(1, a) * 0.6})`); gr.addColorStop(1, 'rgba(0,87,241,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }
  function atmosphere(g, t) {
    const s1 = smooth(t, 0.2, 3) * (1 - smooth(t, 5.6, 6.4));
    glow(g, 'blue', W / 2, 900, 900, 700, 0.35 * s1);
    glow(g, 'neon', W / 2, 1900, 1000, 300, 0.25 * smooth(t, 0, 4));
    const s2 = smooth(t, 6, 7) * (1 - smooth(t, 11.8, 12.6));
    glow(g, 'neon', 600, 1200, 700, 900, 0.22 * s2);
    const s3 = smooth(t, 12, 13) * (1 - smooth(t, 17.8, 18.2));
    glow(g, 'blue', W / 2, 1300, 700, 900, 0.16 * s3);
    const s4 = smooth(t, 18, 19) * (1 - smooth(t, 28.8, 29.6));
    glow(g, 'neon', W / 2, 1150, 900, 1000, 0.3 * s4);
    glow(g, 'blue', W / 2, 600, 900, 500, 0.2 * s4);
    const s5 = smooth(t, 29.5, 30.5);
    glow(g, 'blue', W / 2, 930, 1000, 1000, 0.35 * s5);
  }
  const vignette = (function () {
    const c = mk(W, H), g = c.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H * 0.47, H * 0.22, W / 2, H * 0.5, H * 0.72);
    gr.addColorStop(0, 'rgba(5,7,13,0)'); gr.addColorStop(1, 'rgba(5,7,13,0.85)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return c;
  })();
  const grain = (function () {
    const c = mk(256, 256), g = c.getContext('2d'), d = g.createImageData(256, 256), r = G.mulberry32(99);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.floor(r() * 255); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); return c;
  })();
  let grainPat = null;

  /* ---------- composição ---------- */
  function render(g, t) {
    t = clamp(t, 0, TL.DUR);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
    g.fillStyle = C.black; g.fillRect(0, 0, W, H);
    const [sx, sy] = shake(t);
    g.translate(sx, sy);

    atmosphere(g, t);
    const ga = 0.55 * smooth(t, 6.3, 7.5) * (1 - smooth(t, 11.8, 12.6)) + 0.8 * smooth(t, 19.6, 20.8) * (1 - smooth(t, 24.4, 25.4));
    G.grid(g, t, ga, 1540);
    const pAlpha = smooth(t, 0.05, 1.4) * (t > 12 && t < 18 ? 0.6 : 1);
    const vort = t > 28.6 ? E.inCubic(P(t, 28.6, CUE.logo)) * 3.2 + (t > CUE.logo ? (t - CUE.logo) * 0.15 : 0) : 0;
    const conv = t > 28.6 ? 0.85 * E.inCubic(P(t, 28.6, CUE.logo)) * (1 - E.outExpo(P(t, CUE.logo, CUE.logo + 0.9))) : 0;
    G.drawParticles(g, t, { alpha: pAlpha, vortex: vort, converge: conv, cy: t > 28.6 ? 930 : H / 2 });

    scene1(g, t);

    if (t >= 6 && t < 29.5) {
      if (t < 12.4) hologram(g, t, -185, 650, smooth(t, 6.5, 6.8) * (1 - smooth(t, 11.6, 12.2)) * (t > 11.6 && hash(Math.floor(t * 30)) > 0.6 ? 0.3 : 1));
      drawSideDevices(g, t);
      const ph = drawPhone(g, t);
      transformFX(g, t, ph);
      if (t > 12 && t < 18.5) lossIcons(g, t, ph);
    }
    scene2Text(g, t);
    scene3Text(g, t);
    scene4Text(g, t);
    benefits(g, t);
    scene5(g, t);

    flashes(g, t);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(vignette, 0, 0);
    grainPat = grainPat || g.createPattern(grain, 'repeat');
    const f = Math.floor(t * 30);
    g.save(); g.globalAlpha = 0.045; g.globalCompositeOperation = 'overlay';
    g.translate((f * 37) % 256, (f * 91) % 256); g.fillStyle = grainPat; g.fillRect(-256, -256, W + 512, H + 512);
    g.restore();
  }

  window.NSV = { render, LOGO, setLogo(img) { LOGO.img = img; S.buildBack(img); } };
})();
