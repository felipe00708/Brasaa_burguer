#!/usr/bin/env node
/* NEXT SITES — renderiza o vídeo quadro a quadro em um navegador headless e
   codifica em MP4 H.264 1080x1920 com ffmpeg.

   Uso:
     node render.cjs                         -> out/next-sites.mp4 (trilha + efeitos), stems WAV e versão sem áudio
     node render.cjs --fps 60
     node render.cjs --narration voz.mp3 --offset 0.4 [--duck 0.45]
                                             -> também gera out/next-sites-com-narracao.mp4
     node render.cjs --logo minha-logo.png   -> usa a logo oficial no encerramento

   Requisitos: Node 18+, ffmpeg no PATH e Playwright (npm i playwright && npx playwright install chromium). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const FPS = +opt('fps', 30);
const NARR = opt('narration', null);
const OFFSET = +opt('offset', 0);
const DUCK = +opt('duck', 0.45);
const LOGO = opt('logo', null);
const OUT = path.resolve(opt('out', path.join(__dirname, 'out')));
const ROOT = __dirname;
const DUR = 35;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      if (p === '/assets/logo.png' && LOGO) p = '__logo__';
      const file = p === '__logo__' ? path.resolve(LOGO) : path.join(ROOT, path.normalize(p));
      if (p !== '__logo__' && !file.startsWith(ROOT)) { rsp.writeHead(403); return rsp.end(); }
      fs.readFile(file, (err, data) => {
        if (err) { rsp.writeHead(404); return rsp.end(); }
        rsp.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        rsp.end(data);
      });
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}
function run(cmd, a, input) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
    let err = ''; p.stderr.on('data', d => (err += d));
    p.on('close', c => (c === 0 ? res() : rej(new Error(cmd + ' falhou:\n' + err.slice(-2000)))));
    if (input) input(p.stdin);
  });
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'stems'), { recursive: true });
  const srv = await serve();
  const url = `http://127.0.0.1:${srv.address().port}/index.html?render`;
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('pageerror', e => console.error('[página]', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.NS && window.NS.ready);
  await page.evaluate(() => window.NS.ready);
  if (LOGO) await page.waitForTimeout(500);

  console.log('• Exportando trilha e efeitos (WAV)…');
  for (const [kind, name] of [['music', 'trilha.wav'], ['sfx', 'efeitos.wav'], ['mix', 'trilha+efeitos.wav']]) {
    const b64 = await page.evaluate(k => window.NS.wav(k), kind);
    fs.writeFileSync(path.join(OUT, 'stems', name), Buffer.from(b64, 'base64'));
  }

  const N = Math.round(DUR * FPS);
  const videoOnly = path.join(OUT, 'next-sites-sem-audio.mp4');
  console.log(`• Renderizando ${N} quadros a ${FPS} fps…`);
  const t0 = Date.now();
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '5.1',
    '-r', String(FPS), '-movflags', '+faststart', videoOnly], async stdin => {
    for (let f = 0; f < N; f++) {
      const data = await page.evaluate(t => window.NS.frame(t, 'image/jpeg', 0.96), f / FPS);
      const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64');
      if (!stdin.write(buf)) await new Promise(r => stdin.once('drain', r));
      if (f % 30 === 0) process.stdout.write(`\r  quadro ${f + 1}/${N}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    stdin.end();
  });
  console.log(`\r  ${N} quadros em ${((Date.now() - t0) / 1000).toFixed(0)}s            `);
  await browser.close(); srv.close();

  console.log('• Montando MP4 com trilha + efeitos…');
  const mixWav = path.join(OUT, 'stems', 'trilha+efeitos.wav');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoOnly, '-i', mixWav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', path.join(OUT, 'next-sites.mp4')]);

  if (NARR) {
    console.log('• Mixando narração (com abaixamento automático da trilha)…');
    const ms = Math.max(0, Math.round(OFFSET * 1000)), trim = Math.max(0, -OFFSET);
    const thr = (0.02 + (1 - DUCK) * 0.03).toFixed(3), ratio = (2 + (1 - DUCK) * 10).toFixed(1);
    const fc = [
      `[2:a]atrim=start=${trim},asetpts=PTS-STARTPTS,adelay=${ms}|${ms},aformat=channel_layouts=stereo,apad,asplit=2[n1][n2]`,
      `[1:a][n1]sidechaincompress=threshold=${thr}:ratio=${ratio}:attack=15:release=450[bed]`,
      `[bed][n2]amix=inputs=2:normalize=0:duration=first[a]`,
    ].join(';');
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoOnly, '-i', mixWav, '-i', path.resolve(NARR), '-filter_complex', fc,
      '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', String(DUR), '-movflags', '+faststart',
      path.join(OUT, 'next-sites-com-narracao.mp4')]);
  }
  console.log('✓ Pronto em', OUT);
})().catch(e => { console.error(e); process.exit(1); });
