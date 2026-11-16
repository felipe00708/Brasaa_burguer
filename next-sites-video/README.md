# NEXT SITES — Vídeo publicitário (9:16 · 1080×1920 · 48,5 s com narração)

Comercial cinematográfico 100% programado (Canvas 2D + projeção 3D em perspectiva + Web Audio).
Toda a animação é **determinística**: cada quadro é uma função do tempo, por isso o mesmo projeto
serve para assistir no navegador e para exportar o MP4 quadro a quadro, sem perda de quadros.

## Assistir no navegador

Precisa de um servidor local (por causa das fontes e da exportação):

```bash
cd next-sites-video
python3 -m http.server 8080      # ou: npx serve .
# abra http://localhost:8080
```

Controles: **Reproduzir/Pausar** (barra de espaço), **Reiniciar** (R), ←/→ avançam um quadro
(Shift = 1 s), clique ou arraste na timeline para navegar. "Zona segura" mostra as áreas cobertas
pela interface do Instagram/Reels.

## Narração (ElevenLabs)

A narração já está integrada: os 8 trechos estão em `assets/narracao/01.mp3 … 08.mp3` e a faixa
montada (cada trecho na posição certa) em `assets/narracao.mp3`. O player carrega essa faixa
automaticamente e o render a mixa no MP4 final, abaixando a trilha sob a voz.

Para encaixar a voz em velocidade natural (≈44 s de fala), a linha do tempo foi esticada por trechos
(`KNOTS` em `src/timeline.js`) e o vídeo passou a ter **48,5 s**. As animações continuam as mesmas:
apenas o tempo de cada trecho foi ajustado, e a música foi rearranjada nas novas seções.

| Vídeo | Cena | Narração |
|---|---|---|
| 0,5 s | 1 · Abertura | Todos os dias, novas oportunidades surgem e o mundo dos negócios não para de evoluir. |
| 7,25 s | 2 · Mundo digital | Hoje, antes de escolher uma empresa, as pessoas pesquisam, procuram informações e comparam. |
| 13,5 s | 3 · Problema | Mas e se, quando procurarem sua empresa, não houver um site para apresentar tudo o que você oferece? |
| 19,8 s | 3 · Problema | Você pode estar perdendo oportunidades sem perceber. |
| 23,6 s | 4 · Transformação | Imagine sua empresa com uma presença digital profissional… |
| 34,25 s | 4 · Benefícios | Mais visibilidade, mais credibilidade, mais oportunidades. (cada benefício entra na palavra) |
| 41,0 s | 5 · Encerramento | Sua empresa merece estar na internet. |
| 43,55 s | 5 · Encerramento | NEXT SITES, transformando negócios em presença digital. |

Para trocar a narração: substitua os arquivos e as posições em `VO_CUES`, ou carregue outro arquivo
pelo painel **Narração** do player (com ajuste de início), ou use `node render.cjs --narration voz.mp3`.

## Logo oficial

A logo oficial está em `assets/logo.png` (recortada com fundo transparente) e é usada no
encerramento e na traseira do celular. Para trocar:

- substitua `assets/logo.png` (fundo transparente) — carregada automaticamente; ou
- use o botão **Carregar logo** no player; ou
- no render automático: `node render.cjs --logo caminho/da/logo.png`.

## Exportar MP4

**No navegador (Chrome/Edge):** botão **Exportar MP4** — renderiza quadro a quadro com WebCodecs
(H.264 + AAC) e baixa `next-sites-1080x1920-30fps.mp4`. Navegadores sem WebCodecs usam
gravação em tempo real.

**Por linha de comando (qualidade máxima, x264):**

```bash
npm i playwright && npx playwright install chromium   # uma vez; requer ffmpeg instalado
node render.cjs                                      # 30 fps
node render.cjs --fps 60
node render.cjs --narration voz.mp3 --offset 0.3 --duck 0.45   # outra narração
node render.cjs --sem-narracao
```

Saída em `out/`:

- `next-sites.mp4` — **versão final**: narração + trilha + efeitos
- `next-sites-sem-narracao.mp4` — só trilha + efeitos
- `next-sites-sem-audio.mp4` — só o vídeo (para montar no CapCut/Premiere)
- `stems/trilha.wav`, `stems/efeitos.wav`, `stems/trilha+efeitos.wav` — faixas separadas

## Estrutura

```
index.html        player (controles, timeline, mixer, exportação)
src/timeline.js   duração, cenas, janelas de narração e marcações de sincronia
src/gfx.js        partículas 3D, linhas de luz, tipografia cinética, aparelhos 3D, ícones
src/screens.js    interfaces nas telas: busca, perfil sem site, site profissional (celular/tablet/notebook)
src/scenes.js     as 5 cenas e a composição final
src/audio.js      trilha e efeitos sintetizados (separados da narração), mixagem e WAV
src/player.js     reprodução sincronizada e exportação MP4
render.cjs        renderização automática para MP4 (Playwright + ffmpeg)
```

Paleta usada exclusivamente: `#0057F1`, `#00A6FF`, `#05070D`, `#F4F6FA` (a única exceção é o verde
do botão de WhatsApp no site de demonstração, por ser o padrão reconhecível do app —
troque `WHATS` em `src/screens.js` para `#0057F1` se preferir 100% da paleta).

Fonte: Montserrat (SIL Open Font License, incluída em `assets/fonts`). Muxer MP4: `mp4-muxer` (MIT).
