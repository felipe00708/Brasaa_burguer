/* NEXT SITES — trilha instrumental e efeitos sonoros sintetizados (Web Audio).
   Nenhuma voz é gerada. Música e efeitos são renderizados em faixas separadas;
   a narração (ElevenLabs) entra como uma terceira faixa independente. */
(function () {
  const TL = window.NS_TIMELINE, CUE = TL.CUE, DUR = TL.DUR;
  const SR = 48000;

  function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function noiseBuffer(ctx, secs, seed) {
    const b = ctx.createBuffer(2, ctx.sampleRate * secs, ctx.sampleRate), r = rng(seed);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; }
    return b;
  }
  function impulse(ctx, secs, decay, seed) {
    const n = ctx.sampleRate * secs, b = ctx.createBuffer(2, n, ctx.sampleRate), r = rng(seed);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }

  function setup(ctx, masterGain) {
    const out = ctx.createDynamicsCompressor();
    out.threshold.value = -10; out.ratio.value = 4; out.attack.value = 0.003; out.release.value = 0.25;
    const master = ctx.createGain(); master.gain.value = masterGain;
    out.connect(master); master.connect(ctx.destination);
    const rev = ctx.createConvolver(); rev.buffer = impulse(ctx, 3.2, 3.2, 11);
    const revG = ctx.createGain(); revG.gain.value = 0.32; rev.connect(revG); revG.connect(out);
    const noise = noiseBuffer(ctx, 4, 5);
    return { ctx, out, rev, noise };
  }
  function env(param, t, a, peak, d, sustain = 0, rel = 0) {
    param.setValueAtTime(0.0001, t);
    param.linearRampToValueAtTime(peak, t + a);
    if (rel > 0) { param.setValueAtTime(peak, t + a + d); param.exponentialRampToValueAtTime(0.0001, t + a + d + rel); }
    else param.exponentialRampToValueAtTime(Math.max(0.0001, sustain), t + a + d);
  }
  function noiseSrc(A, t, dur, offset = 0) {
    const s = A.ctx.createBufferSource(); s.buffer = A.noise; s.loop = true;
    s.start(t, offset % 3, dur + 0.05); return s;
  }
  function send(node, A, dry = 1, wet = 0) {
    if (dry > 0) { const g = A.ctx.createGain(); g.gain.value = dry; node.connect(g); g.connect(A.out); }
    if (wet > 0) { const g = A.ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(A.rev); }
  }

  /* ---------- instrumentos ---------- */
  function kick(A, t, vol = 1) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    env(g.gain, t, 0.002, vol, 0.38);
    o.connect(g); send(g, A, 1, 0.05); o.start(t); o.stop(t + 0.45);
  }
  function hat(A, t, vol = 0.12, open = false) {
    const s = noiseSrc(A, t, open ? 0.3 : 0.08, t * 7), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    f.type = 'highpass'; f.frequency.value = 7500;
    env(g.gain, t, 0.001, vol, open ? 0.25 : 0.05);
    s.connect(f); f.connect(g); send(g, A, 1, 0.08);
  }
  function clap(A, t, vol = 0.35) {
    const s = noiseSrc(A, t, 0.35, t * 3), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t);
    [0, 0.012, 0.024].forEach(d => { g.gain.linearRampToValueAtTime(vol, t + d + 0.001); g.gain.exponentialRampToValueAtTime(vol * 0.3, t + d + 0.01); });
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    s.connect(f); f.connect(g); send(g, A, 1, 0.3);
  }
  function pluck(A, t, midi, vol = 0.08, dur = 0.22, cutoff = 2400, type = 'sawtooth', wet = 0.25) {
    const o = A.ctx.createOscillator(), o2 = A.ctx.createOscillator(), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    o.type = type; o2.type = type; o.frequency.value = mtof(midi); o2.frequency.value = mtof(midi); o2.detune.value = 9;
    f.type = 'lowpass'; f.Q.value = 6;
    f.frequency.setValueAtTime(cutoff, t); f.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff * 0.12), t + dur);
    env(g.gain, t, 0.004, vol, dur);
    o.connect(f); o2.connect(f); f.connect(g); send(g, A, 1, wet);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function bass(A, t, midi, vol = 0.22, dur = 0.22) {
    const o = A.ctx.createOscillator(), s = A.ctx.createOscillator(), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(midi); s.type = 'sine'; s.frequency.value = mtof(midi - 12);
    f.type = 'lowpass'; f.Q.value = 4; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(160, t + dur);
    const sg = A.ctx.createGain(); sg.gain.value = 0.8;
    env(g.gain, t, 0.005, vol, dur);
    o.connect(f); f.connect(g); s.connect(sg); sg.connect(g); send(g, A, 1, 0);
    o.start(t); s.start(t); o.stop(t + dur + 0.05); s.stop(t + dur + 0.05);
  }
  function pad(A, t0, t1, midis, vol = 0.05, cutoff = 1600, attack = 0.6, release = 1.2) {
    const f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.setValueAtTime(vol, Math.max(t0 + attack, t1)); g.gain.exponentialRampToValueAtTime(0.0001, t1 + release);
    f.connect(g); send(g, A, 1, 0.5);
    midis.forEach((m, i) => [-7, 7].forEach(dt => {
      const o = A.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = dt + i;
      o.connect(f); o.start(t0); o.stop(t1 + release + 0.1);
    }));
  }
  function drone(A, t0, t1, midis, vol, c0, c1) {
    const f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    f.type = 'lowpass'; f.Q.value = 2; f.frequency.setValueAtTime(c0, t0); f.frequency.exponentialRampToValueAtTime(c1, t1);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (t1 - t0) * 0.5); g.gain.linearRampToValueAtTime(0.0001, t1);
    f.connect(g); send(g, A, 1, 0.35);
    midis.forEach((m, i) => {
      const o = A.ctx.createOscillator(); o.type = i ? 'sawtooth' : 'triangle'; o.frequency.value = mtof(m); o.detune.value = i * 6 - 4;
      o.connect(f); o.start(t0); o.stop(t1 + 0.1);
    });
  }

  /* ---------- MÚSICA ----------
     As seções seguem as cenas já reposicionadas (T = tempo de projeto -> vídeo final);
     dentro de cada seção o andamento é constante (120 bpm). */
  async function renderMusic() {
    const T = TL.T;
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * DUR), SR);
    const A = setup(ctx, 0.85);
    const b = 0.5;
    // Seção A: drone escuro que cresce
    drone(A, 0, T(6.6), [33, 40, 45], 0.16, 120, 1400);
    const arpA = [57, 64, 69, 72];
    for (let i = 0; ; i++) { const t = T(3.0) + i * 0.1875; if (t > T(5.3)) break; pluck(A, t, arpA[i % 4] + 12, 0.025 + Math.min(i, 20) * 0.002, 0.18, 1200 + Math.min(i, 20) * 120, 'triangle', 0.5); }

    // Seção B: pulso tecnológico
    const b0 = T(6), b1 = T(11.75);
    drone(A, b0, T(12.4), [33, 45], 0.09, 300, 900);
    const arpB = [57, 60, 64, 67, 64, 60, 57, 55];
    for (let i = 0; ; i++) { const t = b0 + i * (b / 2); if (t >= b1) break; pluck(A, t, arpB[i % 8], 0.05, 0.2, 900 + ((t - b0) / (b1 - b0)) * 2600); }
    for (let i = 0; ; i++) { const t = b0 + i * b; if (t >= b1) break; kick(A, t, 0.55 + ((t - b0) / (b1 - b0)) * 0.25); if (t >= T(9)) hat(A, t + b / 2, 0.08); }

    // Seção C: tensão — batida de coração e notas suspensas
    const c0 = T(12), c1 = T(18);
    drone(A, c0, c1, [33, 34, 45], 0.11, 900, 260);
    for (let t = T(12.5); t < c1 - 0.5; t += 1.0) { kick(A, t, 0.6); kick(A, t + 0.22, 0.35); }
    for (let k = 0, t = T(12.6); t < c1 - 1.2; t += 1.6, k++) pluck(A, t, k % 2 ? 81 : 88, 0.032, 1.4, k % 2 ? 3000 : 4000, 'sine', 0.9);

    // Seção D: drop — Lá menor, Fá, Dó, Sol
    const chords = [[57, 60, 64, 71], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 67]];
    const roots = [33, 29, 36, 31];
    const start = T(18), end = T(28.5), bar = 2.0, full = T(19.9);
    for (let k = 0; ; k++) {
      const t0 = start + k * bar; if (t0 >= end) break;
      pad(A, t0, Math.min(t0 + bar, end) - 0.05, chords[k % 4].map(m => m - 12), 0.035, Math.min(3000, 1400 + k * 200), 0.25, 0.4);
    }
    for (let i = 0; ; i++) {
      const t = start + i * b; if (t >= end - 0.05) break;
      const ci = Math.floor((t - start) / bar) % 4;
      if (t >= start + 0.5) kick(A, t, 0.95);
      if (i % 2 === 1 && t >= full) clap(A, t, 0.3);
      if (t >= full) { hat(A, t + b / 2, 0.1, i % 4 === 3); hat(A, t + b / 4, 0.05); hat(A, t + (3 * b) / 4, 0.05); }
      if (t >= start + 0.5) { bass(A, t, roots[ci] + 12, 0.2, 0.2); bass(A, t + b / 2, roots[ci] + 12, 0.17, 0.18); }
    }
    for (let i = 0; ; i++) {
      const t = start + i * (b / 4); if (t >= end - 0.05) break;
      if (t < full) continue;
      const ci = Math.floor((t - start) / bar) % 4, ch = chords[ci];
      const note = ch[i % 4] + (i % 8 >= 4 ? 12 : 0);
      pluck(A, t, note, 0.032, 0.14, t > T(CUE.benefits[0]) ? 5200 : 3200, 'square', 0.3);
    }
    // Seção E: impacto final e cauda
    const e0 = T(30.3), eEnd = DUR - 1.3;
    pad(A, e0, eEnd, [45, 52, 57, 59, 64], 0.06, 2200, 0.08, 1.2);
    pad(A, e0, eEnd, [69, 76], 0.02, 5000, 0.4, 1.2);
    kick(A, e0, 1.1);
    bass(A, e0, 33, 0.3, 1.8);
    const arpE = [69, 76, 81, 83, 76, 81];
    const nE = Math.floor((eEnd - 0.6 - e0) / 0.1875);
    for (let i = 0; i < nE; i++) pluck(A, e0 + 0.6 + i * 0.1875, arpE[i % 6], 0.03 * (1 - i / (nE + 4)), 0.3, 3000, 'triangle', 0.7);
    return ctx.startRendering();
  }

  /* ---------- EFEITOS ---------- */
  function whoosh(A, t, dur = 0.7, vol = 0.35, f0 = 300, f1 = 4000, pan0 = -0.8, pan1 = 0.8) {
    const s = noiseSrc(A, t, dur, t), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain(), p = A.ctx.createStereoPanner();
    f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.7); f.frequency.exponentialRampToValueAtTime(f0 * 2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    p.pan.setValueAtTime(pan0, t); p.pan.linearRampToValueAtTime(pan1, t + dur);
    s.connect(f); f.connect(g); g.connect(p); send(p, A, 1, 0.3);
  }
  function impact(A, t, vol = 0.8, tail = 1.4) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.9);
    env(g.gain, t, 0.002, vol, tail);
    o.connect(g); send(g, A, 1, 0.2); o.start(t); o.stop(t + tail + 0.1);
    const s = noiseSrc(A, t, 0.9, t * 2), f = A.ctx.createBiquadFilter(), ng = A.ctx.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(3500, t); f.frequency.exponentialRampToValueAtTime(150, t + 0.6);
    env(ng.gain, t, 0.001, vol * 0.5, 0.7);
    s.connect(f); f.connect(ng); send(ng, A, 1, 0.6);
  }
  function riser(A, t0, t1, vol = 0.25) {
    const s = noiseSrc(A, t0, t1 - t0, t0), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(250, t0); f.frequency.exponentialRampToValueAtTime(7000, t1);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t1 - 0.02); g.gain.linearRampToValueAtTime(0.0001, t1);
    s.connect(f); f.connect(g); send(g, A, 1, 0.4);
    const o = A.ctx.createOscillator(), og = A.ctx.createGain(), of = A.ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(880, t1);
    of.type = 'lowpass'; of.frequency.setValueAtTime(400, t0); of.frequency.exponentialRampToValueAtTime(5000, t1);
    og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(vol * 0.25, t1 - 0.02); og.gain.linearRampToValueAtTime(0.0001, t1);
    o.connect(of); of.connect(og); send(og, A, 1, 0.4); o.start(t0); o.stop(t1 + 0.05);
  }
  function blip(A, t, f0, f1, dur, vol, type = 'sine', wet = 0.15) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g.gain, t, 0.002, vol, dur);
    o.connect(g); send(g, A, 1, wet); o.start(t); o.stop(t + dur + 0.05);
  }
  function tick(A, t, vol = 0.12) {
    const s = noiseSrc(A, t, 0.03, t * 11), f = A.ctx.createBiquadFilter(), g = A.ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 3800; f.Q.value = 3;
    env(g.gain, t, 0.001, vol, 0.025);
    s.connect(f); f.connect(g); send(g, A, 1, 0.05);
  }
  function shimmer(A, t, vol = 0.08) {
    [1760, 2637, 3520, 4186].forEach((fr, i) => blip(A, t + i * 0.035, fr, fr * 1.01, 1.0, vol / (i + 1), 'sine', 0.9));
  }
  function glitch(A, t, dur, vol, seed) {
    const r = rng(seed);
    let x = t;
    while (x < t + dur) {
      const d = 0.015 + r() * 0.05;
      blip(A, x, 200 + r() * 1800, 150 + r() * 1200, d, vol * (0.5 + r() * 0.5), 'square', 0.05);
      x += d + r() * 0.03;
    }
  }
  function textHit(A, t, vol = 0.35) {
    blip(A, t, 140, 45, 0.35, vol, 'sine', 0.1);
    tick(A, t, 0.08);
    whoosh(A, t - 0.18, 0.3, 0.08, 1500, 6000, 0, 0);
  }

  async function renderSfx() {
    // os efeitos são marcados em tempo de projeto e reposicionados no vídeo final (sem alterar a duração de cada som)
    const T = TL.T;
    const whoosh = (A, t, ...r) => RAW.whoosh(A, T(t), ...r), impact = (A, t, ...r) => RAW.impact(A, T(t), ...r);
    const riser = (A, t0, t1, ...r) => RAW.riser(A, T(t0), T(t1), ...r), blip = (A, t, ...r) => RAW.blip(A, T(t), ...r);
    const tick = (A, t, ...r) => RAW.tick(A, T(t), ...r), shimmer = (A, t, ...r) => RAW.shimmer(A, T(t), ...r);
    const glitch = (A, t, ...r) => RAW.glitch(A, T(t), ...r), textHit = (A, t, ...r) => RAW.textHit(A, T(t), ...r);
    const ctx = new OfflineAudioContext(2, Math.ceil(SR * DUR), SR);
    const A = setup(ctx, 0.9);
    // Cena 1
    whoosh(A, CUE.line1 - 0.1, 1.0, 0.25, 200, 3000);
    whoosh(A, 0.85, 0.9, 0.12, 400, 5000, 0.8, -0.8);
    textHit(A, CUE.text1a, 0.25); impact(A, CUE.text1a + 0.05, 0.25, 1.0);
    whoosh(A, 1.5, 0.9, 0.1, 300, 4000);
    shimmer(A, 2.15, 0.05);
    textHit(A, CUE.text1b + 0.05, 0.22);
    textHit(A, CUE.text1b + 0.5, 0.18);
    shimmer(A, 3.9, 0.05);
    riser(A, 4.2, 5.4, 0.18);
    whoosh(A, 5.2, 1.0, 0.45, 150, 6000, 0, 0);
    impact(A, 5.65, 0.4, 1.0);
    // Cena 2
    whoosh(A, 6.0, 1.1, 0.3, 200, 2500, 0.6, -0.2);
    impact(A, 6.9, 0.3, 0.8);
    textHit(A, CUE.text2a, 0.2); textHit(A, CUE.text2a + 0.35, 0.18);
    whoosh(A, CUE.exit2a - 0.1, 0.5, 0.12, 600, 5000);
    textHit(A, CUE.word1, 0.24);
    const n = 17; for (let i = 0; i < n; i++) tick(A, CUE.typeStart + (i / n) * (CUE.typeEnd - CUE.typeStart), 0.1 + (i % 3) * 0.02);
    textHit(A, CUE.word2, 0.24);
    [0, 0.12, 0.24].forEach((d, i) => blip(A, CUE.word2 + 0.05 + d, 900 + i * 300, 1400 + i * 300, 0.08, 0.06));
    blip(A, CUE.word2 + 0.55, 600, 900, 0.06, 0.05); blip(A, CUE.word2 + 0.85, 600, 900, 0.06, 0.05);
    textHit(A, CUE.word3, 0.26);
    blip(A, CUE.tap1, 1300, 700, 0.06, 0.18); tick(A, CUE.tap1, 0.16);
    whoosh(A, CUE.exit2, 0.7, 0.3, 400, 5000, -0.6, 0.6);
    // Cena 3
    glitch(A, 12.45, 0.25, 0.08, 3);
    impact(A, CUE.hit3a, 0.9, 1.6); glitch(A, CUE.hit3a, 0.25, 0.07, 4);
    blip(A, CUE.tapFail, 900, 500, 0.06, 0.14); tick(A, CUE.tapFail, 0.12);
    blip(A, CUE.tapFail + 0.62, 330, 200, 0.12, 0.12, 'square', 0.1); blip(A, CUE.tapFail + 0.78, 260, 150, 0.16, 0.12, 'square', 0.1);
    impact(A, CUE.hit3b, 0.55, 1.2); glitch(A, CUE.hit3b, 0.4, 0.07, 5);
    impact(A, CUE.hit3b + 0.25, 0.35, 1.0);
    CUE.losses.forEach((t, i) => { whoosh(A, t, 0.9, 0.12, 2000, 300, 0, i % 2 ? 0.8 : -0.8); blip(A, t + 1.05, 700 - i * 60, 220 - i * 20, 0.6, 0.05, 'triangle', 0.6); });
    glitch(A, 15.9, 0.15, 0.06, 6);
    riser(A, 16.4, 18.0, 0.3);
    glitch(A, CUE.exit3, 0.6, 0.08, 7);
    // Cena 4
    impact(A, CUE.transform, 1.0, 2.0);
    riser(A, CUE.transform, CUE.transform + 0.6, 0.15);
    whoosh(A, CUE.spinStart, CUE.spinEnd - CUE.spinStart, 0.4, 200, 6000, -0.7, 0.7);
    shimmer(A, CUE.spinEnd, 0.1); impact(A, CUE.spinEnd, 0.35, 1.0);
    for (let i = 0; i < 6; i++) tick(A, CUE.build + i * 0.12, 0.07);
    textHit(A, CUE.text4, 0.2); textHit(A, CUE.text4 + 0.32, 0.18); textHit(A, CUE.text4 + 0.64, 0.22);
    whoosh(A, CUE.devicesIn, 0.9, 0.25, 200, 3000, -0.8, 0.8);
    whoosh(A, CUE.scroll1, 0.8, 0.08, 800, 3000, 0, 0);
    whoosh(A, CUE.scroll2, 0.8, 0.08, 800, 3000, 0, 0);
    whoosh(A, CUE.exit4, 0.7, 0.2, 400, 4000, 0.5, -0.5);
    CUE.benefits.forEach((t, i) => { whoosh(A, t - 0.3, 0.4, 0.12, 500, 6000, 0, 0); impact(A, t, 0.4, 1.0); shimmer(A, t + 0.1, 0.07); blip(A, t + 0.85, 2000 + i * 300, 4000, 0.3, 0.03, 'sine', 0.8); });
    // Cena 5
    whoosh(A, CUE.exitBenefits, 0.7, 0.25, 300, 5000, 0, 0);
    riser(A, 28.6, CUE.logo, 0.35);
    impact(A, CUE.logo, 1.0, 2.6); shimmer(A, CUE.logo + 0.05, 0.12);
    whoosh(A, CUE.wordmark, 0.8, 0.15, 400, 4000, -0.5, 0.5);
    textHit(A, CUE.headline, 0.2); textHit(A, CUE.headline + 0.33, 0.22);
    whoosh(A, CUE.tagline, 1.0, 0.07, 1000, 6000, -0.6, 0.6);
    shimmer(A, CUE.shine, 0.07);
    whoosh(A, CUE.shine, 1.0, 0.06, 2000, 8000, -0.5, 0.5);
    return ctx.startRendering();
  }

  const RAW = { whoosh, impact, riser, blip, tick, shimmer, glitch, textHit };

  async function build() {
    const [music, sfx] = await Promise.all([renderMusic(), renderSfx()]);
    return { music, sfx };
  }

  /* curva de abaixamento da música quando há narração (sidechain simples) */
  function duckCurve(narr, offset, amount, step = 0.02) {
    const n = Math.ceil(DUR / step), out = new Float32Array(n);
    if (!narr) { out.fill(1); return out; }
    const ch = narr.getChannelData(0), sr = narr.sampleRate, win = Math.floor(sr * step);
    let env = 0;
    for (let i = 0; i < n; i++) {
      const t = i * step - offset; let rms = 0;
      if (t >= 0) {
        const s0 = Math.floor(t * sr);
        for (let j = 0; j < win && s0 + j < ch.length; j += 4) rms += ch[s0 + j] * ch[s0 + j];
        rms = Math.sqrt(rms / (win / 4));
      }
      const active = rms > 0.015 ? 1 : 0;
      env = active > env ? env + (active - env) * 0.5 : env + (active - env) * 0.06;
      out[i] = 1 - (1 - amount) * env;
    }
    return out;
  }

  /* mixagem final offline (para exportação) */
  async function mix({ music, sfx, narration, narrOffset = 0, vMusic = 1, vSfx = 1, vNarr = 1, duck = 0.45, sampleRate = SR }) {
    const ctx = new OfflineAudioContext(2, Math.ceil(sampleRate * DUR), sampleRate);
    const add = (buf, vol, when = 0, offset = 0, curve) => {
      if (!buf || vol <= 0) return;
      const s = ctx.createBufferSource(); s.buffer = buf;
      const g = ctx.createGain(); g.gain.value = vol;
      if (curve) { const c = Float32Array.from(curve, v => v * vol); g.gain.setValueCurveAtTime(c, 0, DUR); }
      s.connect(g); g.connect(ctx.destination); s.start(when, offset);
    };
    const curve = narration ? duckCurve(narration, narrOffset, duck) : null;
    add(music, vMusic, 0, 0, curve);
    add(sfx, vSfx);
    if (narration) {
      if (narrOffset >= 0) add(narration, vNarr, narrOffset, 0); else add(narration, vNarr, 0, -narrOffset);
    }
    return ctx.startRendering();
  }

  function toWav(buf) {
    const nch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
    const ab = new ArrayBuffer(44 + len * nch * 2), v = new DataView(ab);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + len * nch * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nch, true); v.setUint32(24, sr, true);
    v.setUint32(28, sr * nch * 2, true); v.setUint16(32, nch * 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, len * nch * 2, true);
    const chs = []; for (let c = 0; c < nch; c++) chs.push(buf.getChannelData(c));
    let o = 44;
    for (let i = 0; i < len; i++) for (let c = 0; c < nch; c++) { const s = Math.max(-1, Math.min(1, chs[c][i])); v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
    return new Blob([ab], { type: 'audio/wav' });
  }

  window.NSA = { build, mix, toWav, duckCurve, SR };
})();
