/* NEXT SITES — player: reprodução sincronizada (vídeo + trilha + efeitos + narração),
   timeline, mixer e exportação MP4 (WebCodecs + mp4-muxer). */
(function () {
  const TL = window.NS_TIMELINE, DUR = TL.DUR, W = TL.W, H = TL.H;
  const $ = id => document.getElementById(id);
  const canvas = $('stage'), ctx = canvas.getContext('2d');
  const isRender = new URLSearchParams(location.search).has('render');
  if (isRender) document.body.classList.add('render');

  const S = {
    t: 0, playing: false, ac: null, startAt: 0, startT: 0, nodes: [],
    music: null, sfx: null, narr: null, narrName: '', exporting: false,
    vol: { music: 1, sfx: 1, narr: 1 }, offset: 0, duck: 0.45,
  };
  const fmt = t => { const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`; };
  const status = msg => { const el = $('status'); if (el) el.textContent = msg; };

  /* ---------- carregamento ---------- */
  const ready = (async () => {
    await Promise.all([500, 600, 700, 800, 900].map(w => document.fonts.load(`${w} 40px Montserrat`)));
    await document.fonts.ready;
    window.NSV.render(ctx, 0);
    status('Gerando trilha e efeitos sonoros…');
    const snd = await window.NSA.build();
    S.music = snd.music; S.sfx = snd.sfx;
    status('Pronto.');
    if (location.protocol !== 'file:') tryLoadLogo('assets/logo.png').catch(() => tryLoadLogo('assets/logo.svg')).catch(() => {});
    return true;
  })();

  function tryLoadLogo(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => { window.NSV.setLogo(im); if ($('logoClear')) $('logoClear').disabled = false; res(); };
      im.onerror = rej; im.src = src;
    });
  }

  /* ---------- áudio ao vivo ---------- */
  function ensureAC() {
    if (!S.ac) S.ac = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
    return S.ac;
  }
  function stopNodes() { S.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); S.nodes = []; }
  function startNodes(t) {
    const ac = ensureAC(), at = S.startAt;
    const mk = (buf, vol, when, off) => {
      if (!buf) return null;
      const s = ac.createBufferSource(); s.buffer = buf;
      const g = ac.createGain(); g.gain.value = vol;
      s.connect(g); g.connect(ac.destination);
      s.start(when, Math.max(0, off)); S.nodes.push(s);
      return g;
    };
    // trilha com abaixamento automático sob a narração
    if (S.music) {
      const s = ac.createBufferSource(); s.buffer = S.music;
      const duck = ac.createGain(), g = ac.createGain(); g.gain.value = S.vol.music;
      s.connect(duck); duck.connect(g); g.connect(ac.destination);
      if (S.narr) {
        const curve = window.NSA.duckCurve(S.narr, S.offset, S.duck);
        const i0 = Math.floor(t / 0.02), slice = curve.slice(i0);
        if (slice.length > 1) duck.gain.setValueCurveAtTime(slice, at, Math.max(0.05, DUR - t));
      }
      s.start(at, t); S.nodes.push(s); S.musicGain = g;
    }
    S.sfxGain = mk(S.sfx, S.vol.sfx, at, t);
    if (S.narr) {
      const rel = t - S.offset; // posição dentro do arquivo de narração
      S.narrGain = rel >= 0 ? mk(S.narr, S.vol.narr, at, rel) : mk(S.narr, S.vol.narr, at - rel, 0);
    }
  }
  function now() {
    if (!S.playing) return S.t;
    return Math.max(S.startT, S.startT + (S.ac.currentTime - S.startAt));
  }
  async function play() {
    if (S.exporting) return;
    await ready;
    const ac = ensureAC(); await ac.resume();
    if (S.t >= DUR - 0.01) S.t = 0;
    S.startT = S.t; S.startAt = ac.currentTime + 0.06;
    startNodes(S.t);
    S.playing = true; updateButtons();
  }
  function pause() {
    if (!S.playing) return;
    S.t = Math.min(DUR, now()); S.playing = false; stopNodes(); updateButtons();
  }
  function seek(t) {
    const was = S.playing; if (was) { S.playing = false; stopNodes(); }
    S.t = Math.max(0, Math.min(DUR, t));
    if (was) play(); else draw();
  }
  function restart() { seek(0); if (!S.playing) play(); }

  /* ---------- laço de desenho ---------- */
  function draw() {
    const t = now();
    window.NSV.render(ctx, t);
    if (!isRender) {
      $('time').textContent = `${fmt(t)} / ${fmt(DUR)}`;
      $('ph').style.left = `${(t / DUR) * 100}%`;
    }
  }
  function loop() {
    if (!S.exporting) {
      if (S.playing && now() >= DUR) {
        if ($('loop').checked) { S.playing = false; stopNodes(); S.t = 0; play(); }
        else { S.playing = false; stopNodes(); S.t = DUR; updateButtons(); }
      }
      draw();
    }
    requestAnimationFrame(loop);
  }

  /* ---------- interface ---------- */
  function updateButtons() {
    if (isRender) return;
    $('playBtn').textContent = S.playing ? '❚❚ Pausar' : '▶ Reproduzir';
    $('bigPlay').classList.toggle('hide', S.playing || S.t > 0);
  }
  function buildTimeline() {
    const ls = $('laneScenes'), lv = $('laneVo');
    TL.SCENES.forEach(s => {
      const d = document.createElement('div'); d.className = 'scene';
      d.style.left = `${(s.start / DUR) * 100}%`; d.style.width = `calc(${((s.end - s.start) / DUR) * 100}% - 2px)`;
      d.textContent = `${s.id}. ${s.name}`; d.title = `${s.name} (${s.start}s–${s.end}s)`;
      ls.appendChild(d);
    });
    TL.VO_CUES.forEach(c => {
      const d = document.createElement('div'); d.className = 'cue';
      d.style.left = `${(c.start / DUR) * 100}%`; d.style.width = `${((c.end - c.start) / DUR) * 100}%`;
      d.textContent = c.label; d.title = `Janela de narração ${c.start}s–${c.end}s: ${c.label}`;
      lv.appendChild(d);
    });
    const cl = $('cueList');
    TL.VO_CUES.forEach(c => {
      const d = document.createElement('div');
      d.innerHTML = `<b>${c.start.toFixed(1)}–${c.end.toFixed(1)}s</b><span></span>`;
      d.querySelector('span').textContent = c.label;
      cl.appendChild(d);
    });
    const tl = $('tl');
    let drag = false;
    const pos = e => { const r = tl.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * DUR; };
    tl.addEventListener('pointerdown', e => { drag = true; tl.setPointerCapture(e.pointerId); seek(pos(e)); });
    tl.addEventListener('pointermove', e => { if (drag && !S.playing) seek(pos(e)); });
    tl.addEventListener('pointerup', e => { if (drag) { drag = false; if (S.playing) seek(pos(e)); } });
  }
  function drawWave() {
    const c = $('wave'), g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    if (!S.narr) return;
    const d = S.narr.getChannelData(0), sr = S.narr.sampleRate;
    g.fillStyle = 'rgba(0,166,255,0.75)';
    for (let x = 0; x < c.width; x++) {
      const t0 = (x / c.width) * DUR - S.offset, t1 = ((x + 1) / c.width) * DUR - S.offset;
      if (t1 < 0 || t0 * sr > d.length) continue;
      let m = 0; for (let i = Math.max(0, Math.floor(t0 * sr)); i < Math.min(d.length, t1 * sr); i += 16) m = Math.max(m, Math.abs(d[i]));
      const h = m * c.height * 0.9;
      g.fillRect(x, (c.height - h) / 2, 1, Math.max(1, h));
    }
  }
  function bindRange(id, out, fmtFn, onChange) {
    const el = $(id), o = $(out);
    const upd = () => { o.textContent = fmtFn(+el.value); onChange(+el.value); };
    el.addEventListener('input', upd); upd();
  }
  function setupUI() {
    buildTimeline();
    $('playBtn').onclick = () => (S.playing ? pause() : play());
    $('bigPlay').onclick = () => play();
    $('restartBtn').onclick = restart;
    $('safeChk').onchange = e => $('safe').classList.toggle('on', e.target.checked);
    const pct = v => `${Math.round(v * 100)}%`;
    bindRange('vMusic', 'oMusic', pct, v => { S.vol.music = v; if (S.musicGain) S.musicGain.gain.value = v; });
    bindRange('vSfx', 'oSfx', pct, v => { S.vol.sfx = v; if (S.sfxGain) S.sfxGain.gain.value = v; });
    bindRange('vNarr', 'oNarr', pct, v => { S.vol.narr = v; if (S.narrGain) S.narrGain.gain.value = v; });
    bindRange('narrOffset', 'oOffset', v => `${v.toFixed(2).replace('.', ',')}s`, v => { S.offset = v; drawWave(); if (S.playing) seek(now()); });
    bindRange('duck', 'oDuck', pct, v => { S.duck = v; });
    $('narrFile').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      status('Decodificando narração…');
      try {
        const buf = await ensureAC().decodeAudioData(await f.arrayBuffer());
        S.narr = buf; S.narrName = f.name;
        $('narrInfo').textContent = `${f.name} · ${buf.duration.toFixed(2).replace('.', ',')} s${buf.duration > DUR ? ' (maior que o vídeo — o excedente será cortado)' : ''}`;
        $('narrClear').disabled = false; drawWave(); status('Narração carregada.');
        if (S.playing) seek(now());
      } catch (err) { status('Não foi possível ler o arquivo de áudio.'); }
    };
    $('narrClear').onclick = () => { S.narr = null; $('narrInfo').textContent = ''; $('narrClear').disabled = true; $('narrFile').value = ''; drawWave(); if (S.playing) seek(now()); };
    $('logoFile').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const url = URL.createObjectURL(f);
      tryLoadLogo(url).then(() => { status('Logo carregada.'); if (!S.playing) draw(); }).catch(() => status('Não foi possível ler a imagem.'));
    };
    $('logoClear').onclick = () => { window.NSV.setLogo(null); $('logoClear').disabled = true; $('logoFile').value = ''; if (!S.playing) draw(); };
    $('exportBtn').onclick = () => exportMP4(+$('fps').value, $('expAudio').checked);
    const dl = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
    $('wavMusic').onclick = async () => { await ready; dl(window.NSA.toWav(S.music), 'next-sites-trilha.wav'); };
    $('wavSfx').onclick = async () => { await ready; dl(window.NSA.toWav(S.sfx), 'next-sites-efeitos.wav'); };
    $('wavMix').onclick = async () => { await ready; dl(window.NSA.toWav(await mixdown()), S.narr ? 'next-sites-mix-com-narracao.wav' : 'next-sites-mix.wav'); };
    S.dl = dl;
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox') return;
      if (e.code === 'Space') { e.preventDefault(); S.playing ? pause() : play(); }
      else if (e.key === 'r' || e.key === 'R') restart();
      else if (e.key === 'ArrowRight') seek(now() + (e.shiftKey ? 1 : 1 / 30));
      else if (e.key === 'ArrowLeft') seek(now() - (e.shiftKey ? 1 : 1 / 30));
    });
    updateButtons();
  }

  function mixdown() {
    return window.NSA.mix({ music: S.music, sfx: S.sfx, narration: S.narr, narrOffset: S.offset, vMusic: S.vol.music, vSfx: S.vol.sfx, vNarr: S.vol.narr, duck: S.duck });
  }

  /* ---------- exportação MP4 quadro a quadro (WebCodecs) ---------- */
  async function pickVideo(fps) {
    if (!('VideoEncoder' in window)) return null;
    const list = [['avc', 'avc1.640034'], ['avc', 'avc1.640033'], ['avc', 'avc1.4d0034'], ['avc', 'avc1.42003e'], ['hevc', 'hev1.1.6.L153.B0'], ['vp9', 'vp09.00.51.08'], ['av1', 'av01.0.12M.08']];
    for (const [mux, codec] of list) {
      const cfg = { codec, width: W, height: H, bitrate: fps > 30 ? 24e6 : 16e6, framerate: fps, latencyMode: 'quality' };
      if (mux === 'avc') cfg.avc = { format: 'avc' };
      try { const r = await VideoEncoder.isConfigSupported(cfg); if (r.supported) return { mux, cfg }; } catch (e) {}
    }
    return null;
  }
  async function pickAudio() {
    if (!('AudioEncoder' in window)) return null;
    for (const [mux, codec] of [['aac', 'mp4a.40.2'], ['opus', 'opus']]) {
      const cfg = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 };
      try { const r = await AudioEncoder.isConfigSupported(cfg); if (r.supported) return { mux, cfg }; } catch (e) {}
    }
    return null;
  }
  async function exportMP4(fps, withAudio) {
    if (S.exporting) return;
    await ready; pause();
    const vsel = await pickVideo(fps);
    if (!vsel) return exportRealtime(fps, withAudio);
    const asel = withAudio ? await pickAudio() : null;
    S.exporting = true; $('exportBtn').disabled = true;
    const prog = $('prog');
    try {
      const { Muxer, ArrayBufferTarget } = window.Mp4Muxer;
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target, fastStart: 'in-memory', firstTimestampBehavior: 'offset',
        video: { codec: vsel.mux, width: W, height: H, frameRate: fps },
        audio: asel ? { codec: asel.mux, numberOfChannels: 2, sampleRate: 48000 } : undefined,
      });
      let err = null;
      const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { err = e; } });
      venc.configure(vsel.cfg);
      const N = Math.round(DUR * fps), work = document.createElement('canvas');
      work.width = W; work.height = H; const wctx = work.getContext('2d');
      for (let f = 0; f < N; f++) {
        if (err) throw err;
        window.NSV.render(wctx, f / fps);
        const frame = new VideoFrame(work, { timestamp: Math.round((f * 1e6) / fps), duration: Math.round(1e6 / fps) });
        venc.encode(frame, { keyFrame: f % (fps * 2) === 0 });
        frame.close();
        while (venc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 1));
        if (f % 5 === 0) {
          prog.style.width = `${((f / N) * (asel ? 92 : 100)).toFixed(1)}%`;
          status(`Renderizando quadro ${f + 1} de ${N}…`);
          ctx.drawImage(work, 0, 0);
          await new Promise(r => setTimeout(r, 0));
        }
      }
      await venc.flush(); venc.close();
      if (asel) {
        status('Codificando áudio…');
        const mixb = await mixdown();
        const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { err = e; } });
        aenc.configure(asel.cfg);
        const L = mixb.getChannelData(0), R = mixb.getChannelData(1), F = 1024;
        for (let i = 0; i < mixb.length; i += F) {
          const n = Math.min(F, mixb.length - i), data = new Float32Array(n * 2);
          data.set(L.subarray(i, i + n), 0); data.set(R.subarray(i, i + n), n);
          const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i * 1e6) / 48000), data });
          aenc.encode(ad); ad.close();
        }
        await aenc.flush(); aenc.close();
      }
      if (err) throw err;
      muxer.finalize();
      prog.style.width = '100%';
      const name = `next-sites-1080x1920-${fps}fps${S.narr ? '-com-narracao' : ''}.mp4`;
      S.dl(new Blob([target.buffer], { type: 'video/mp4' }), name);
      status(`Exportado: ${name}${asel ? '' : withAudio ? ' (sem áudio: codificador de áudio indisponível neste navegador)' : ''}`);
    } catch (e) {
      console.error(e); status('Falha na exportação: ' + e.message);
    } finally {
      S.exporting = false; $('exportBtn').disabled = false; draw();
    }
  }
  /* alternativa: gravação em tempo real (navegadores sem WebCodecs) */
  async function exportRealtime(fps, withAudio) {
    const mime = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    if (!mime) { status('Este navegador não suporta exportação. Use o Chrome/Edge ou o script render.mjs.'); return; }
    S.exporting = true; $('exportBtn').disabled = true;
    const ac = ensureAC(); await ac.resume();
    const stream = canvas.captureStream(fps);
    let src = null;
    if (withAudio) {
      const dest = ac.createMediaStreamDestination();
      src = ac.createBufferSource(); src.buffer = await mixdown(); src.connect(dest);
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    }
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16e6 });
    const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const done = new Promise(r => (rec.onstop = r));
    status('Gravando em tempo real (35 s)…');
    rec.start(); const t0 = performance.now(); if (src) src.start();
    await new Promise(res => {
      const step = () => {
        const t = (performance.now() - t0) / 1000;
        window.NSV.render(ctx, Math.min(t, DUR)); $('prog').style.width = `${(t / DUR) * 100}%`;
        if (t < DUR) requestAnimationFrame(step); else res();
      };
      step();
    });
    rec.stop(); await done;
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    S.dl(new Blob(chunks, { type: mime }), `next-sites-1080x1920.${ext}`);
    status(`Exportado (${ext.toUpperCase()}).`);
    S.exporting = false; $('exportBtn').disabled = false;
  }

  /* ---------- API para o renderizador automático (render.mjs) ---------- */
  const work = document.createElement('canvas'); work.width = W; work.height = H;
  window.NS = {
    ready,
    frame(t, type = 'image/jpeg', q = 0.95) { window.NSV.render(work.getContext('2d'), t); return work.toDataURL(type, q); },
    async wav(kind) {
      await ready;
      const buf = kind === 'music' ? S.music : kind === 'sfx' ? S.sfx : await window.NSA.mix({ music: S.music, sfx: S.sfx });
      const blob = window.NSA.toWav(buf), ab = await blob.arrayBuffer();
      let s = ''; const u = new Uint8Array(ab);
      for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
      return btoa(s);
    },
  };

  if (!isRender) { setupUI(); requestAnimationFrame(loop); }
})();
