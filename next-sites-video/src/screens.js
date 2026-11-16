/* NEXT SITES — interfaces exibidas nas telas dos aparelhos e faces dos aparelhos. */
(function () {
  const G = window.NSG;
  const { C, P, E, clamp, lerp, mk, rr, I, font, hash, smooth } = G;
  const CUE = window.NS_TIMELINE.CUE;

  const RES = 2;
  /* celular: corpo 400x850, tela 376x826 (coordenadas lógicas) */
  const PH = { w: 400, h: 850, inset: 12, r: 64, sr: 54 };
  PH.sw = PH.w - PH.inset * 2; PH.sh = PH.h - PH.inset * 2;
  const phoneScreen = mk(PH.sw * RES, PH.sh * RES);
  const phoneFace = mk(PH.w * RES, PH.h * RES);
  const phoneBack = mk(PH.w * RES, PH.h * RES);
  const tmp = mk(PH.sw * RES, PH.sh * RES);

  const WHATS = '#25D366';
  const sk = (g, x, y, w, h, col) => { g.fillStyle = col; rr(g, x, y, w, h, h / 2); g.fill(); };
  function text(g, str, x, y, size, weight, col, align = 'left') {
    g.font = font(size, weight); g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(str, x, y);
  }
  function statusBar(g, w, col) {
    text(g, '9:41', 30, 24, 15, 700, col);
    g.fillStyle = col;
    for (let i = 0; i < 4; i++) { rr(g, w - 104 + i * 6, 28 - i * 3 - 4, 4, 4 + i * 3, 1); g.fill(); }
    g.strokeStyle = col; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(w - 66, 31, 3 + i * 4, -Math.PI * 0.75, -Math.PI * 0.25); g.stroke(); }
    rr(g, w - 50, 18, 26, 13, 4); g.lineWidth = 1.5; g.stroke(); rr(g, w - 48, 20, 18, 9, 2.5); g.fill();
  }

  /* ---------- TELA A: pesquisa ---------- */
  const QUERY = 'loja perto de mim';
  function drawSearch(g, t) {
    const w = PH.sw, h = PH.sh;
    g.fillStyle = '#080C16'; g.fillRect(0, 0, w, h);
    const bgG = g.createRadialGradient(w * 0.5, 0, 10, w * 0.5, 0, h * 0.7);
    bgG.addColorStop(0, 'rgba(0,87,241,0.22)'); bgG.addColorStop(1, 'rgba(0,87,241,0)');
    g.fillStyle = bgG; g.fillRect(0, 0, w, h);
    statusBar(g, w, C.ice);

    // cabeçalho
    g.save(); g.strokeStyle = C.neon; g.lineWidth = 3; g.beginPath(); g.arc(36, 72, 11, 0, 7); g.stroke(); g.restore();
    text(g, 'Buscar', 56, 72, 19, 700, C.ice);
    g.fillStyle = 'rgba(0,166,255,0.18)'; g.beginPath(); g.arc(w - 36, 72, 15, 0, 7); g.fill();
    I.user(g, w - 36, 72, 20, C.neon);

    // barra de busca
    const typed = Math.floor(P(t, CUE.typeStart, CUE.typeEnd) * QUERY.length);
    const focus = smooth(t, CUE.word1 - 0.4, CUE.word1);
    g.fillStyle = '#121A2B'; rr(g, 16, 100, w - 32, 50, 25); g.fill();
    g.strokeStyle = `rgba(0,166,255,${0.25 + 0.75 * focus})`; g.lineWidth = 1.5 + focus; g.stroke();
    if (focus > 0) { g.save(); g.shadowColor = C.neon; g.shadowBlur = 18 * focus; g.stroke(); g.restore(); }
    I.search(g, 44, 125, 20, C.neon);
    if (typed > 0) text(g, QUERY.slice(0, typed), 66, 125, 16, 600, C.ice);
    else text(g, 'Pesquisar', 66, 125, 16, 500, 'rgba(244,246,250,0.38)');
    g.font = font(16, 600);
    const cw = typed > 0 ? g.measureText(QUERY.slice(0, typed)).width : 0;
    if (focus > 0.5 && Math.floor(t * 2.6) % 2 === 0 && t < CUE.word2 + 0.3) { g.fillStyle = C.neon; g.fillRect(68 + cw, 114, 2, 22); }

    // resultados
    const rp = P(t, CUE.word2 - 0.25, CUE.word2 + 0.55);
    if (rp <= 0) {
      // sugestões enquanto digita
      for (let i = 0; i < 4; i++) {
        const a = smooth(t, CUE.word1 + 0.1 + i * 0.12, CUE.word1 + 0.4 + i * 0.12) * (1 - rp);
        if (a <= 0) continue;
        g.globalAlpha = a;
        I.search(g, 40, 186 + i * 48, 14, 'rgba(244,246,250,0.4)');
        sk(g, 62, 181 + i * 48, [170, 130, 190, 110][i], 10, 'rgba(244,246,250,0.22)');
        g.globalAlpha = 1;
      }
      return;
    }
    // chips
    const chips = ['Todos', 'Mapas', 'Imagens'];
    let cx = 16;
    chips.forEach((c, i) => {
      g.globalAlpha = E.outCubic(P(rp, i * 0.1, 0.4 + i * 0.1));
      g.font = font(13, 700); const tw = g.measureText(c).width + 26;
      g.fillStyle = i === 0 ? C.blue : '#121A2B'; rr(g, cx, 164, tw, 30, 15); g.fill();
      text(g, c, cx + 13, 179, 13, 700, i === 0 ? C.ice : 'rgba(244,246,250,0.6)');
      cx += tw + 8;
    });
    g.globalAlpha = 1;
    // mapa
    const ma = E.outCubic(P(rp, 0.05, 0.55));
    g.save(); g.globalAlpha = ma; g.translate(0, (1 - ma) * 30);
    g.fillStyle = '#0D1424'; rr(g, 16, 206, w - 32, 150, 18); g.fill();
    g.save(); rr(g, 16, 206, w - 32, 150, 18); g.clip();
    g.strokeStyle = 'rgba(0,166,255,0.16)'; g.lineWidth = 6;
    [[0, 260, 400, 300], [80, 200, 160, 360], [200, 200, 300, 360], [0, 330, 400, 250]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
    g.strokeStyle = 'rgba(244,246,250,0.06)'; g.lineWidth = 2;
    for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(16 + i * 50, 206); g.lineTo(16 + i * 50 - 40, 356); g.stroke(); }
    g.restore();
    [[96, 268], [214, 300], [292, 250]].forEach(([px, py], i) => {
      const d = E.outBack(P(rp, 0.25 + i * 0.12, 0.6 + i * 0.12));
      if (d <= 0) return;
      g.fillStyle = 'rgba(0,166,255,0.25)'; g.beginPath(); g.ellipse(px, py + 14, 10 * d, 4 * d, 0, 0, 7); g.fill();
      I.pin(g, px, py - (1 - d) * 40, 30, i === 0 ? C.neon : C.blue);
    });
    g.restore();

    // lista
    const cmp = P(t, CUE.word2 + 0.25, CUE.word3 - 0.05);
    const hlIdx = t < CUE.word3 ? Math.min(2, Math.floor(cmp * 3)) : 0;
    const chosen = smooth(t, CUE.word3, CUE.word3 + 0.3);
    for (let i = 0; i < 4; i++) {
      const a = E.outCubic(P(rp, 0.2 + i * 0.12, 0.65 + i * 0.12));
      if (a <= 0) continue;
      const y = 372 + i * 108;
      g.save(); g.globalAlpha = a; g.translate((1 - a) * 60, 0);
      const active = (cmp > 0 && t < CUE.word3 && i === hlIdx) || (i === 0 && chosen > 0);
      const press = i === 0 ? 1 - 0.03 * smooth(t, CUE.tap1, CUE.tap1 + 0.08) * (1 - smooth(t, CUE.tap1 + 0.12, CUE.tap1 + 0.3)) : 1;
      g.translate(w / 2, y + 48); g.scale(press, press); g.translate(-w / 2, -(y + 48));
      g.fillStyle = active ? '#12213F' : '#0F1626'; rr(g, 16, y, w - 32, 96, 18); g.fill();
      if (active) { g.save(); g.strokeStyle = C.neon; g.lineWidth = 2; g.shadowColor = C.neon; g.shadowBlur = 16; rr(g, 16, y, w - 32, 96, 18); g.stroke(); g.restore(); }
      const av = g.createLinearGradient(30, y + 18, 90, y + 78);
      av.addColorStop(0, C.blue); av.addColorStop(1, C.neon);
      g.fillStyle = av; rr(g, 30, y + 18, 60, 60, 14); g.fill();
      [I.bag, I.watch, I.bottle, I.headphones][i](g, 60, y + 48, 34, 'rgba(244,246,250,0.92)');
      sk(g, 104, y + 24, [150, 128, 168, 136][i], 12, 'rgba(244,246,250,0.85)');
      const stars = [5, 4, 5, 4][i];
      for (let s = 0; s < 5; s++) I.star(g, 110 + s * 17, y + 52, 15, s < stars ? C.neon : 'rgba(244,246,250,0.18)');
      sk(g, 104, y + 70, [90, 70, 100, 80][i], 8, 'rgba(244,246,250,0.28)');
      g.fillStyle = 'rgba(0,166,255,0.12)'; g.beginPath(); g.arc(w - 54, y + 32, 16, 0, 7); g.fill(); I.globe(g, w - 54, y + 32, 18, C.neon);
      g.fillStyle = 'rgba(0,166,255,0.12)'; g.beginPath(); g.arc(w - 54, y + 66, 16, 0, 7); g.fill(); I.route(g, w - 54, y + 66, 18, C.neon);
      g.restore();
    }
    // toque
    const tp = P(t, CUE.tap1, CUE.tap1 + 0.55);
    if (tp > 0 && tp < 1) {
      const y = 372 + 48;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(0,166,255,${0.35 * (1 - tp)})`; g.beginPath(); g.arc(150, y, 20 + 140 * E.outCubic(tp), 0, 7); g.fill();
      g.strokeStyle = `rgba(244,246,250,${0.8 * (1 - tp)})`; g.lineWidth = 3; g.beginPath(); g.arc(150, y, 14 + 70 * E.outCubic(tp), 0, 7); g.stroke();
      g.restore();
    }
  }

  /* ---------- TELA B: empresa sem site (informações limitadas) ---------- */
  function drawProblem(g, t) {
    const w = PH.sw, h = PH.sh, t0 = CUE.profile;
    g.fillStyle = '#0A0D13'; g.fillRect(0, 0, w, h);
    statusBar(g, w, 'rgba(244,246,250,0.7)');
    I.back(g, 30, 72, 22, 'rgba(244,246,250,0.6)');
    sk(g, 58, 66, 130, 12, 'rgba(244,246,250,0.18)');
    // capa sem imagem
    const ca = E.outCubic(P(t, t0, t0 + 0.4));
    g.globalAlpha = ca;
    g.fillStyle = '#141924'; rr(g, 16, 100, w - 32, 200, 20); g.fill();
    // estática
    for (let i = 0; i < 26; i++) {
      const yy = 100 + hash(i + Math.floor(t * 12) * 31) * 200, ww = 40 + hash(i * 7 + Math.floor(t * 12)) * 160;
      g.fillStyle = 'rgba(244,246,250,0.035)'; g.fillRect(16 + hash(i * 3 + Math.floor(t * 12)) * (w - 80), yy, ww, 2);
    }
    I.imageOff(g, w / 2, 200, 70, 'rgba(244,246,250,0.28)');
    // nome
    sk(g, 22, 324, 210, 18, 'rgba(244,246,250,0.32)');
    for (let s = 0; s < 5; s++) I.star(g, 30 + s * 20, 360, 16, 'rgba(244,246,250,0.22)', false);
    sk(g, 136, 355, 70, 10, 'rgba(244,246,250,0.12)');
    g.globalAlpha = 1;
    // linhas de informação
    const rows = [[I.globe, 'Sem site'], [I.camera, 'Sem fotos'], [I.clock, 'Sem informações']];
    rows.forEach(([ic, label], i) => {
      const st = t0 + 0.45 + i * 0.28;
      let a = smooth(t, st, st + 0.2);
      if (a <= 0) return;
      const fl = t < st + 0.35 ? (hash(Math.floor(t * 40) + i) > 0.5 ? 1 : 0.25) : 1;
      g.globalAlpha = a * fl;
      const y = 410 + i * 56;
      g.fillStyle = '#121722'; rr(g, 16, y - 22, w - 32, 46, 14); g.fill();
      ic(g, 42, y + 1, 22, 'rgba(244,246,250,0.42)');
      I.slash(g, 42, y + 1, 24, 'rgba(244,246,250,0.55)');
      text(g, label, 66, y + 1, 16, 600, 'rgba(244,246,250,0.5)');
      g.globalAlpha = 1;
    });
    // botão desabilitado
    const ba = smooth(t, t0 + 1.0, t0 + 1.3);
    if (ba > 0) {
      g.globalAlpha = ba;
      const pr = 1 - 0.04 * (smooth(t, CUE.tapFail, CUE.tapFail + 0.08) * (1 - smooth(t, CUE.tapFail + 0.1, CUE.tapFail + 0.3)));
      g.save(); g.translate(w / 2, 605); g.scale(pr, pr);
      g.fillStyle = '#171C27'; rr(g, -(w - 32) / 2, -27, w - 32, 54, 27); g.fill();
      g.strokeStyle = 'rgba(244,246,250,0.08)'; g.lineWidth = 1.5; g.stroke();
      text(g, 'Visitar site', 0, 1, 16, 700, 'rgba(244,246,250,0.35)', 'center');
      g.restore();
      g.globalAlpha = 1;
    }
    // toque + falha
    const tp = P(t, CUE.tapFail, CUE.tapFail + 0.5);
    if (tp > 0 && tp < 1) {
      g.fillStyle = `rgba(244,246,250,${0.18 * (1 - tp)})`; g.beginPath(); g.arc(w / 2, 605, 20 + 110 * E.outCubic(tp), 0, 7); g.fill();
    }
    const sp = P(t, CUE.tapFail + 0.12, CUE.tapFail + 0.65);
    if (sp > 0 && sp < 1) {
      g.save(); g.strokeStyle = 'rgba(244,246,250,0.5)'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.arc(w / 2, 690, 18, t * 9, t * 9 + 4.2); g.stroke(); g.restore();
    }
    const ep = P(t, CUE.tapFail + 0.62, CUE.tapFail + 0.95);
    if (ep > 0) {
      const sh = Math.sin((t - CUE.tapFail - 0.62) * 70) * 8 * (1 - P(t, CUE.tapFail + 0.62, CUE.tapFail + 1.0));
      g.save(); g.globalAlpha = E.outCubic(ep); g.translate(sh, (1 - E.outBack(ep)) * 30);
      g.fillStyle = '#121722'; rr(g, 40, 650, w - 80, 120, 20); g.fill();
      g.strokeStyle = 'rgba(244,246,250,0.12)'; g.lineWidth = 1.5; g.stroke();
      I.linkBroken(g, 96, 710, 44, 'rgba(244,246,250,0.55)');
      text(g, '404', 140, 698, 34, 800, 'rgba(244,246,250,0.55)');
      sk(g, 142, 726, 120, 9, 'rgba(244,246,250,0.18)');
      g.restore();
    }
  }

  /* ---------- SITE PROFISSIONAL (layout mobile, 376 de largura lógica) ---------- */
  const SITE_W = 376;
  const BLOCKS = [
    { y: 0, h: 470, draw: heroBlock },
    { y: 470, h: 560, draw: productsBlock },
    { y: 1030, h: 400, draw: servicesBlock },
    { y: 1430, h: 420, draw: aboutBlock },
    { y: 1850, h: 400, draw: contactBlock },
    { y: 2250, h: 150, draw: footerBlock },
  ];
  const SITE_H = 2400;
  function title(g, str, y, dark = true) {
    text(g, str, 22, y, 24, 800, dark ? C.black : C.ice);
    g.fillStyle = C.neon; rr(g, 22, y + 20, 36, 5, 2.5); g.fill();
  }
  function heroBlock(g, t) {
    const gr = g.createLinearGradient(0, 0, SITE_W, 470);
    gr.addColorStop(0, C.blue); gr.addColorStop(1, C.neon);
    g.fillStyle = gr; g.fillRect(0, 0, SITE_W, 470);
    g.fillStyle = 'rgba(244,246,250,0.08)';
    g.beginPath(); g.arc(330, 90, 120, 0, 7); g.fill();
    g.beginPath(); g.arc(30, 420, 90, 0, 7); g.fill();
    sk(g, 22, 88, 110, 22, 'rgba(244,246,250,0.2)');
    text(g, 'Sua Empresa', 22, 140, 34, 800, C.ice);
    sk(g, 22, 172, 250, 10, 'rgba(244,246,250,0.75)');
    sk(g, 22, 190, 200, 10, 'rgba(244,246,250,0.75)');
    g.fillStyle = C.ice; rr(g, 22, 218, 196, 46, 23); g.fill();
    g.fillStyle = WHATS; g.beginPath(); g.arc(46, 241, 14, 0, 7); g.fill(); I.whats(g, 46, 241, 20, '#fff');
    text(g, 'Fale conosco', 68, 242, 15, 700, C.blue);
    // produto em destaque
    g.fillStyle = 'rgba(5,7,13,0.18)'; g.beginPath(); g.ellipse(188, 440, 110, 16, 0, 0, 7); g.fill();
    const fl = Math.sin(t * 2) * 6;
    g.save(); g.shadowColor = 'rgba(5,7,13,0.35)'; g.shadowBlur = 30;
    g.fillStyle = 'rgba(244,246,250,0.14)'; g.beginPath(); g.arc(188, 362 + fl, 78, 0, 7); g.fill(); g.restore();
    I.headphones(g, 188, 362 + fl, 110, C.ice);
  }
  function productCard(g, x, y, i) {
    g.save(); g.shadowColor = 'rgba(0,40,120,0.14)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
    g.fillStyle = '#fff'; rr(g, x, y, 162, 210, 18); g.fill(); g.restore();
    const ig = g.createLinearGradient(x, y, x + 162, y + 124);
    ig.addColorStop(0, '#E4EDFF'); ig.addColorStop(1, '#CFE2FF');
    g.fillStyle = ig; rr(g, x + 8, y + 8, 146, 116, 13); g.fill();
    [I.watch, I.bottle, I.bag, I.headphones][i](g, x + 81, y + 66, 70, C.blue);
    sk(g, x + 14, y + 140, 110, 10, 'rgba(5,7,13,0.75)');
    sk(g, x + 14, y + 158, 70, 8, 'rgba(5,7,13,0.25)');
    sk(g, x + 14, y + 182, 56, 12, C.blue);
    g.fillStyle = C.blue; g.beginPath(); g.arc(x + 136, y + 186, 14, 0, 7); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + 130, y + 186); g.lineTo(x + 142, y + 186); g.moveTo(x + 136, y + 180); g.lineTo(x + 136, y + 192); g.stroke();
  }
  function productsBlock(g) {
    g.fillStyle = C.ice; g.fillRect(0, 0, SITE_W, 560);
    title(g, 'Produtos', 46);
    for (let i = 0; i < 4; i++) productCard(g, 18 + (i % 2) * 178, 92 + Math.floor(i / 2) * 228, i);
  }
  function servicesBlock(g) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, SITE_W, 400);
    title(g, 'Serviços', 46);
    [I.truck, I.tool, I.spark].forEach((ic, i) => {
      const y = 104 + i * 96;
      g.fillStyle = C.ice; rr(g, 18, y, SITE_W - 36, 82, 18); g.fill();
      const cg = g.createLinearGradient(32, y + 14, 86, y + 68); cg.addColorStop(0, C.blue); cg.addColorStop(1, C.neon);
      g.fillStyle = cg; g.beginPath(); g.arc(60, y + 41, 26, 0, 7); g.fill();
      ic(g, 60, y + 41, 30, '#fff');
      sk(g, 100, y + 22, [150, 130, 160][i], 11, 'rgba(5,7,13,0.78)');
      sk(g, 100, y + 44, 200, 8, 'rgba(5,7,13,0.22)');
      sk(g, 100, y + 58, 150, 8, 'rgba(5,7,13,0.22)');
    });
  }
  function aboutBlock(g) {
    g.fillStyle = C.ice; g.fillRect(0, 0, SITE_W, 420);
    title(g, 'Sobre nós', 46);
    const x = 18, y = 92, w = SITE_W - 36, h = 180;
    const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#0B2E78'); bg.addColorStop(1, C.blue);
    g.fillStyle = bg; rr(g, x, y, w, h, 18); g.fill();
    g.save(); rr(g, x, y, w, h, 18); g.clip();
    g.fillStyle = 'rgba(244,246,250,0.12)'; g.beginPath(); g.arc(x + w - 50, y + 40, 26, 0, 7); g.fill();
    g.fillStyle = '#0A1A3F'; g.fillRect(x + 50, y + 60, w - 100, h - 60);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? C.ice : C.neon; g.beginPath(); const sx = x + 44 + i * ((w - 88) / 8); g.moveTo(sx, y + 60); g.lineTo(sx + (w - 88) / 8, y + 60); g.lineTo(sx + (w - 88) / 8, y + 84); g.arc(sx + (w - 88) / 16, y + 84, (w - 88) / 16, 0, Math.PI); g.fill(); }
    g.fillStyle = 'rgba(0,166,255,0.55)'; g.fillRect(x + 70, y + 108, 80, 52); g.fillRect(x + w - 150, y + 108, 80, 52);
    g.fillStyle = 'rgba(244,246,250,0.85)'; g.fillRect(x + w / 2 - 20, y + 104, 40, 76);
    g.restore();
    sk(g, 22, 296, 300, 9, 'rgba(5,7,13,0.3)'); sk(g, 22, 314, 260, 9, 'rgba(5,7,13,0.3)'); sk(g, 22, 332, 280, 9, 'rgba(5,7,13,0.3)');
    for (let s = 0; s < 5; s++) I.star(g, 30 + s * 22, 372, 18, C.neon);
    sk(g, 146, 367, 90, 10, 'rgba(5,7,13,0.55)');
  }
  function contactBlock(g) {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, SITE_W, 400);
    title(g, 'Contato', 46);
    g.fillStyle = '#E4EDFF'; rr(g, 18, 92, SITE_W - 36, 120, 18); g.fill();
    g.save(); rr(g, 18, 92, SITE_W - 36, 120, 18); g.clip();
    g.strokeStyle = 'rgba(0,87,241,0.18)'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(0, 170); g.lineTo(400, 120); g.moveTo(120, 92); g.lineTo(200, 212); g.stroke(); g.restore();
    I.pin(g, 188, 140, 40, C.blue);
    [[I.pin, 220], [I.clock, 220]].forEach(([ic], i) => {
      const y = 240 + i * 36;
      g.fillStyle = 'rgba(0,87,241,0.1)'; g.beginPath(); g.arc(36, y, 14, 0, 7); g.fill();
      ic(g, 36, y, 18, C.blue);
      sk(g, 60, y - 5, [210, 170][i], 10, 'rgba(5,7,13,0.5)');
    });
    g.save(); g.shadowColor = 'rgba(37,211,102,0.45)'; g.shadowBlur = 20; g.shadowOffsetY = 6;
    g.fillStyle = WHATS; rr(g, 18, 316, SITE_W - 36, 58, 29); g.fill(); g.restore();
    I.whats(g, 70, 345, 28, '#fff');
    text(g, 'Chamar no WhatsApp', 96, 346, 17, 800, '#ffffff');
  }
  function footerBlock(g) {
    g.fillStyle = C.black; g.fillRect(0, 0, SITE_W, 150);
    const lg = g.createLinearGradient(22, 30, 50, 58); lg.addColorStop(0, C.blue); lg.addColorStop(1, C.neon);
    g.fillStyle = lg; rr(g, 22, 30, 28, 28, 8); g.fill();
    sk(g, 60, 39, 100, 10, 'rgba(244,246,250,0.6)');
    sk(g, 22, 84, 220, 8, 'rgba(244,246,250,0.2)'); sk(g, 22, 102, 160, 8, 'rgba(244,246,250,0.2)');
  }
  function siteHeader(g, w) {
    g.save(); g.shadowColor = 'rgba(5,7,13,0.12)'; g.shadowBlur = 12;
    g.fillStyle = 'rgba(255,255,255,0.97)'; g.fillRect(0, 0, w, 58); g.restore();
    const lg = g.createLinearGradient(20, 15, 48, 43); lg.addColorStop(0, C.blue); lg.addColorStop(1, C.neon);
    g.fillStyle = lg; rr(g, 20, 15, 28, 28, 8); g.fill();
    text(g, 'SUA EMPRESA', 58, 30, 14, 800, C.black);
    I.menu(g, w - 36, 29, 22, C.black);
  }
  /* desenha a página com rolagem; build anima a construção dos blocos */
  function drawSitePage(g, t, scroll, build, viewH) {
    BLOCKS.forEach((b, i) => {
      if (b.y + b.h < scroll || b.y > scroll + viewH) return;
      const bp = E.outCubic(P(build, i * 0.1, i * 0.1 + 0.55));
      if (bp <= 0) return;
      g.save();
      g.translate(0, b.y - scroll + (1 - bp) * 60);
      g.globalAlpha = bp;
      g.beginPath(); g.rect(0, 0, SITE_W, b.h); g.clip();
      b.draw(g, t);
      g.restore();
    });
  }
  function drawSite(g, t, scroll, build) {
    const w = PH.sw, h = PH.sh;
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.save(); g.translate(0, 44);
    drawSitePage(g, t, scroll, build, h - 44);
    // cabeçalho fixo
    const hb = E.outCubic(P(build, 0, 0.35));
    g.globalAlpha = hb; g.translate(0, -(1 - hb) * 58);
    siteHeader(g, w);
    g.restore();
    g.globalAlpha = 1;
    // status bar
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, 44);
    statusBar(g, w, C.black);
    // botão flutuante do WhatsApp
    const fa = E.outBack(P(build, 0.7, 1));
    if (fa > 0) {
      const pulse = (t * 0.9) % 1;
      g.save(); g.translate(w - 50, h - 56); g.scale(fa, fa);
      g.fillStyle = `rgba(37,211,102,${0.4 * (1 - pulse)})`; g.beginPath(); g.arc(0, 0, 28 + pulse * 22, 0, 7); g.fill();
      g.shadowColor = 'rgba(37,211,102,0.6)'; g.shadowBlur = 18; g.fillStyle = WHATS; g.beginPath(); g.arc(0, 0, 28, 0, 7); g.fill();
      g.shadowBlur = 0; I.whats(g, 0, 0, 34, '#fff');
      g.restore();
    }
    // varredura de construção
    if (build > 0 && build < 1) {
      const yy = h * E.inOutCubic(clamp(build * 1.3));
      const gr = g.createLinearGradient(0, yy - 90, 0, yy + 4);
      gr.addColorStop(0, 'rgba(0,166,255,0)'); gr.addColorStop(1, 'rgba(0,166,255,0.55)');
      g.fillStyle = gr; g.fillRect(0, yy - 90, w, 94);
      g.fillStyle = 'rgba(244,246,250,0.95)'; g.fillRect(0, yy, w, 3);
    }
  }

  /* ---------- páginas estáticas para tablet e notebook ---------- */
  const tabletPage = mk(SITE_W * RES, SITE_H * RES);
  let staticDone = false;
  function buildStatic() {
    if (staticDone) return; staticDone = true;
    buildTabletPage(); buildDeskPage();
  }
  function buildTabletPage() {
    const g = tabletPage.getContext('2d'); g.scale(RES, RES);
    BLOCKS.forEach(b => { g.save(); g.translate(0, b.y); b.draw(g, 0); g.restore(); });
  }
  const DESK_W = 652, DESK_H = 1100;
  const deskPage = mk(DESK_W * RES, DESK_H * RES);
  function buildDeskPage() {
    const g = deskPage.getContext('2d'); g.scale(RES, RES);
    g.fillStyle = C.ice; g.fillRect(0, 0, DESK_W, DESK_H);
    // nav
    g.fillStyle = '#fff'; g.fillRect(0, 0, DESK_W, 50);
    const lg = g.createLinearGradient(20, 12, 46, 38); lg.addColorStop(0, C.blue); lg.addColorStop(1, C.neon);
    g.fillStyle = lg; rr(g, 20, 12, 26, 26, 7); g.fill();
    text(g, 'SUA EMPRESA', 54, 26, 12, 800, C.black);
    ['Início', 'Produtos', 'Serviços', 'Contato'].forEach((n, i) => text(g, n, 300 + i * 70, 26, 10.5, 600, i === 0 ? C.blue : 'rgba(5,7,13,0.6)'));
    g.fillStyle = WHATS; rr(g, DESK_W - 110, 12, 92, 26, 13); g.fill();
    I.whats(g, DESK_W - 94, 25, 14, '#fff'); text(g, 'WhatsApp', DESK_W - 82, 26, 10, 700, '#fff');
    // hero
    const gr = g.createLinearGradient(0, 50, DESK_W, 340); gr.addColorStop(0, C.blue); gr.addColorStop(1, C.neon);
    g.fillStyle = gr; g.fillRect(0, 50, DESK_W, 290);
    g.fillStyle = 'rgba(244,246,250,0.08)'; g.beginPath(); g.arc(520, 120, 170, 0, 7); g.fill();
    text(g, 'Sua Empresa', 40, 140, 40, 800, C.ice);
    sk(g, 40, 176, 280, 10, 'rgba(244,246,250,0.75)'); sk(g, 40, 194, 230, 10, 'rgba(244,246,250,0.75)');
    g.fillStyle = C.ice; rr(g, 40, 226, 150, 40, 20); g.fill(); text(g, 'Fale conosco', 72, 246, 13, 700, C.blue);
    g.fillStyle = WHATS; g.beginPath(); g.arc(58, 246, 11, 0, 7); g.fill(); I.whats(g, 58, 246, 15, '#fff');
    g.strokeStyle = 'rgba(244,246,250,0.8)'; g.lineWidth = 2; rr(g, 202, 226, 120, 40, 20); g.stroke(); sk(g, 228, 241, 70, 10, 'rgba(244,246,250,0.8)');
    g.fillStyle = 'rgba(244,246,250,0.16)'; g.beginPath(); g.arc(490, 200, 100, 0, 7); g.fill();
    I.headphones(g, 490, 200, 140, C.ice);
    // produtos
    text(g, 'Produtos', 40, 382, 22, 800, C.black); g.fillStyle = C.neon; rr(g, 40, 400, 34, 4, 2); g.fill();
    for (let i = 0; i < 4; i++) {
      const x = 40 + i * 146, y = 420;
      g.save(); g.shadowColor = 'rgba(0,40,120,0.12)'; g.shadowBlur = 14; g.fillStyle = '#fff'; rr(g, x, y, 132, 180, 14); g.fill(); g.restore();
      const ig = g.createLinearGradient(x, y, x + 132, y + 110); ig.addColorStop(0, '#E4EDFF'); ig.addColorStop(1, '#CFE2FF');
      g.fillStyle = ig; rr(g, x + 7, y + 7, 118, 100, 10); g.fill();
      [I.watch, I.bottle, I.bag, I.headphones][i](g, x + 66, y + 57, 60, C.blue);
      sk(g, x + 12, y + 122, 90, 9, 'rgba(5,7,13,0.7)'); sk(g, x + 12, y + 140, 60, 7, 'rgba(5,7,13,0.25)'); sk(g, x + 12, y + 158, 46, 10, C.blue);
    }
    // serviços
    g.fillStyle = '#fff'; g.fillRect(0, 630, DESK_W, 260);
    text(g, 'Serviços', 40, 670, 22, 800, C.black); g.fillStyle = C.neon; rr(g, 40, 688, 34, 4, 2); g.fill();
    [I.truck, I.tool, I.spark].forEach((ic, i) => {
      const x = 40 + i * 196, y = 712;
      g.fillStyle = C.ice; rr(g, x, y, 180, 150, 16); g.fill();
      const cg = g.createLinearGradient(x + 16, y + 16, x + 64, y + 64); cg.addColorStop(0, C.blue); cg.addColorStop(1, C.neon);
      g.fillStyle = cg; g.beginPath(); g.arc(x + 40, y + 40, 24, 0, 7); g.fill(); ic(g, x + 40, y + 40, 28, '#fff');
      sk(g, x + 16, y + 84, 120, 10, 'rgba(5,7,13,0.75)'); sk(g, x + 16, y + 104, 148, 7, 'rgba(5,7,13,0.22)'); sk(g, x + 16, y + 118, 110, 7, 'rgba(5,7,13,0.22)');
    });
    // contato
    g.fillStyle = C.black; g.fillRect(0, 890, DESK_W, 210);
    g.fillStyle = WHATS; rr(g, 40, 940, 230, 52, 26); g.fill(); I.whats(g, 72, 966, 24, '#fff'); text(g, 'Chamar no WhatsApp', 94, 967, 14, 800, '#fff');
    sk(g, 40, 1020, 240, 8, 'rgba(244,246,250,0.25)'); sk(g, 40, 1038, 180, 8, 'rgba(244,246,250,0.25)');
  }

  /* ---------- faces dos aparelhos ---------- */
  function bodyGradient(g, w, h) {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#3A4458'); gr.addColorStop(0.35, '#151A25'); gr.addColorStop(0.7, '#0C1018'); gr.addColorStop(1, '#2E3748');
    return gr;
  }
  function glare(g, w, h, pos, a = 0.16) {
    const x = lerp(-w * 0.6, w * 1.6, pos);
    const gr = g.createLinearGradient(x - w * 0.5, 0, x + w * 0.5, h * 0.6);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.48, `rgba(255,255,255,${a})`); gr.addColorStop(0.52, `rgba(255,255,255,${a * 0.6})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore();
  }
  function glitchCanvas(cv, amt, seed) {
    if (amt <= 0.01) return;
    const g = cv.getContext('2d'), tg = tmp.getContext('2d');
    tg.clearRect(0, 0, tmp.width, tmp.height); tg.drawImage(cv, 0, 0);
    const n = Math.round(3 + amt * 9);
    for (let i = 0; i < n; i++) {
      const y = hash(seed * 13 + i) * cv.height, hh = 6 + hash(seed * 7 + i * 3) * 60 * amt;
      const dx = (hash(seed * 5 + i * 11) - 0.5) * 90 * amt;
      g.drawImage(tmp, 0, y, cv.width, hh, dx, y, cv.width, hh);
    }
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * amt;
    g.drawImage(tmp, 10 * amt, 0); g.restore();
  }

  /* monta a face do celular para o tempo t; mode: 'search' | 'problem' | 'site' */
  function buildPhone(t, st) {
    const sg = phoneScreen.getContext('2d');
    sg.setTransform(RES, 0, 0, RES, 0, 0);
    if (st.mode === 'search') drawSearch(sg, t);
    else if (st.mode === 'problem') drawProblem(sg, t);
    else if (st.mode === 'push') {
      // transição: pesquisa sai para a esquerda, perfil entra pela direita
      const k = E.inOutCubic(st.push);
      sg.save(); sg.translate(-k * PH.sw, 0); drawSearch(sg, t); sg.restore();
      sg.save(); sg.translate((1 - k) * PH.sw, 0); drawProblem(sg, t); sg.restore();
    } else drawSite(sg, t, st.scroll || 0, st.build ?? 1);
    if (st.dim) { sg.fillStyle = `rgba(5,7,13,${st.dim})`; sg.fillRect(0, 0, PH.sw, PH.sh); }
    sg.setTransform(1, 0, 0, 1, 0, 0);
    if (st.glitch) glitchCanvas(phoneScreen, st.glitch, Math.floor(t * 24));

    const g = phoneFace.getContext('2d');
    g.setTransform(RES, 0, 0, RES, 0, 0);
    g.clearRect(0, 0, PH.w, PH.h);
    g.fillStyle = bodyGradient(g, PH.w, PH.h); rr(g, 0, 0, PH.w, PH.h, PH.r); g.fill();
    g.strokeStyle = 'rgba(0,166,255,0.55)'; g.lineWidth = 2; rr(g, 1, 1, PH.w - 2, PH.h - 2, PH.r - 1); g.stroke();
    g.fillStyle = '#000'; rr(g, PH.inset - 4, PH.inset - 4, PH.sw + 8, PH.sh + 8, PH.sr + 4); g.fill();
    g.save(); rr(g, PH.inset, PH.inset, PH.sw, PH.sh, PH.sr); g.clip();
    g.drawImage(phoneScreen, PH.inset, PH.inset, PH.sw, PH.sh);
    glare(g, PH.w, PH.h, st.glare ?? 0.5, 0.13);
    g.restore();
    g.fillStyle = '#000'; rr(g, PH.w / 2 - 56, PH.inset + 12, 112, 32, 16); g.fill();
    g.fillStyle = 'rgba(0,166,255,0.35)'; g.beginPath(); g.arc(PH.w / 2 + 34, PH.inset + 28, 5, 0, 7); g.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
    return phoneFace;
  }
  function buildBack(img) {
    const g = phoneBack.getContext('2d'); g.setTransform(RES, 0, 0, RES, 0, 0); g.clearRect(0, 0, PH.w, PH.h);
    const gr = g.createLinearGradient(0, 0, PH.w, PH.h);
    gr.addColorStop(0, '#16336E'); gr.addColorStop(0.5, '#0A1430'); gr.addColorStop(1, '#0057F1');
    g.fillStyle = gr; rr(g, 0, 0, PH.w, PH.h, PH.r); g.fill();
    g.strokeStyle = 'rgba(0,166,255,0.6)'; g.lineWidth = 2; rr(g, 1, 1, PH.w - 2, PH.h - 2, PH.r - 1); g.stroke();
    g.fillStyle = 'rgba(5,7,13,0.55)'; rr(g, 24, 24, 170, 170, 46); g.fill();
    [[70, 70], [148, 70], [70, 148]].forEach(([x, y]) => {
      g.fillStyle = '#05070D'; g.beginPath(); g.arc(x, y, 30, 0, 7); g.fill();
      g.strokeStyle = 'rgba(0,166,255,0.5)'; g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(0,166,255,0.35)'; g.beginPath(); g.arc(x - 6, y - 6, 7, 0, 7); g.fill();
    });
    g.globalAlpha = 0.95;
    if (img) g.drawImage(img, PH.w / 2 - 60, PH.h / 2 - 20, 120, 120); else drawEmblemShape(g, PH.w / 2, PH.h / 2 + 40, 110);
    g.globalAlpha = 1;
  }
  buildBack(null);

  /* tablet */
  const TB = { w: 560, h: 800, inset: 18, r: 40 };
  TB.sw = TB.w - TB.inset * 2; TB.sh = TB.h - TB.inset * 2;
  const tabletFace = mk(TB.w * RES, TB.h * RES);
  function buildTablet(scroll, gl) {
    buildStatic();
    const g = tabletFace.getContext('2d'); g.setTransform(RES, 0, 0, RES, 0, 0);
    g.clearRect(0, 0, TB.w, TB.h);
    g.fillStyle = bodyGradient(g, TB.w, TB.h); rr(g, 0, 0, TB.w, TB.h, TB.r); g.fill();
    g.strokeStyle = 'rgba(0,166,255,0.5)'; g.lineWidth = 2; rr(g, 1, 1, TB.w - 2, TB.h - 2, TB.r - 1); g.stroke();
    g.save(); rr(g, TB.inset, TB.inset, TB.sw, TB.sh, 18); g.clip();
    const sc = TB.sw / SITE_W, srcH = TB.sh / sc;
    g.drawImage(tabletPage, 0, scroll * RES, SITE_W * RES, srcH * RES, TB.inset, TB.inset, TB.sw, TB.sh);
    // cabeçalho
    g.save(); g.translate(TB.inset, TB.inset); g.scale(sc, sc); siteHeader(g, SITE_W); g.restore();
    glare(g, TB.w, TB.h, gl, 0.12);
    g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0);
    return tabletFace;
  }
  /* notebook (tela) */
  const LP = { w: 690, h: 440, inset: 19 };
  LP.sw = DESK_W; LP.sh = 402;
  const laptopFace = mk(LP.w * RES, LP.h * RES);
  function buildLaptop(scroll, gl) {
    buildStatic();
    const g = laptopFace.getContext('2d'); g.setTransform(RES, 0, 0, RES, 0, 0);
    g.clearRect(0, 0, LP.w, LP.h);
    g.fillStyle = '#0B0E15'; rr(g, 0, 0, LP.w, LP.h, 22); g.fill();
    g.strokeStyle = 'rgba(0,166,255,0.5)'; g.lineWidth = 2; rr(g, 1, 1, LP.w - 2, LP.h - 2, 21); g.stroke();
    g.save(); rr(g, LP.inset, LP.inset, LP.sw, LP.sh, 6); g.clip();
    g.drawImage(deskPage, 0, scroll * RES, DESK_W * RES, LP.sh * RES, LP.inset, LP.inset, LP.sw, LP.sh);
    glare(g, LP.w, LP.h, gl, 0.1);
    g.restore();
    g.fillStyle = 'rgba(0,166,255,0.5)'; g.beginPath(); g.arc(LP.w / 2, 10, 3, 0, 7); g.fill();
    g.setTransform(1, 0, 0, 1, 0, 0);
    return laptopFace;
  }

  /* ---------- emblema NEXT SITES (provisório — substituível pela logo oficial) ---------- */
  function drawEmblemShape(g, x, y, s) {
    g.save(); g.translate(x, y);
    const gr = g.createLinearGradient(-s / 2, s / 2, s / 2, -s / 2);
    gr.addColorStop(0, C.blue); gr.addColorStop(1, C.neon);
    g.fillStyle = gr; rr(g, -s / 2, -s / 2, s, s, s * 0.26); g.fill();
    g.fillStyle = C.ice;
    g.beginPath();
    g.moveTo(-0.27 * s, 0.27 * s); g.lineTo(-0.27 * s, -0.25 * s); g.lineTo(-0.12 * s, -0.25 * s);
    g.lineTo(0.13 * s, 0.07 * s); g.lineTo(0.13 * s, -0.1 * s); g.lineTo(0.27 * s, -0.1 * s);
    g.lineTo(0.27 * s, 0.27 * s); g.lineTo(0.14 * s, 0.27 * s); g.lineTo(-0.13 * s, -0.07 * s); g.lineTo(-0.13 * s, 0.27 * s);
    g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0.2 * s, -0.36 * s); g.lineTo(0.37 * s, -0.12 * s); g.lineTo(0.03 * s, -0.12 * s); g.closePath(); g.fill();
    g.restore();
  }

  window.NSS = {
    PH, TB, LP, SITE_H, DESK_H, buildPhone, buildTablet, buildLaptop, phoneBack, buildBack, drawEmblemShape, glare,
  };
})();
