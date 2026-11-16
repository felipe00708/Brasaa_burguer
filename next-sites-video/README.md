# NEXT SITES — Vídeo publicitário (9:16 · 1080×1920 · 35 s)

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

O projeto **não gera voz, diálogos nem legendas**. A narração entra como uma faixa separada:

1. No painel **Narração**, carregue o MP3/WAV.
2. Ajuste **Início em** (deslocamento, de −5 s a +10 s) olhando a forma de onda na timeline.
3. **Trilha sob voz** define quanto a música abaixa automaticamente enquanto há fala.
4. **Exportar MP4** já sai com a narração mixada.

As janelas reservadas para a voz aparecem na timeline (faixa tracejada) e estão em
`src/timeline.js` (`VO_CUES`):

| Tempo | Cena | Texto em tela |
|---|---|---|
| 0,8–5,6 s | 1 · Abertura | O mundo está mudando. E a forma de fazer negócios também. |
| 6,4–11,6 s | 2 · Mundo digital | Seus clientes estão conectados. Eles pesquisam. Comparam. Escolhem. |
| 12,8–17,4 s | 3 · Problema | E sua empresa? Está sendo encontrada? |
| 20,4–24,4 s | 4 · Transformação | Sua empresa merece uma presença digital profissional. |
| 24,8–28,6 s | 4 · Benefícios | Mais visibilidade. Mais credibilidade. Mais oportunidades. |
| 30,6–34,6 s | 5 · Encerramento | Sua empresa merece estar na internet. NEXT SITES. |

Se a narração ficar mais longa ou mais curta, todos os tempos das animações e dos efeitos sonoros
estão centralizados em `CUE`, no mesmo arquivo; alterar ali ressincroniza vídeo e áudio juntos.

## Logo oficial

O emblema atual é **provisório** (nenhum arquivo de logo foi fornecido). Para usar a logo oficial
com o desenho e as cores originais:

- salve como `assets/logo.png` (fundo transparente) — carregada automaticamente; ou
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
node render.cjs --narration voz.mp3 --offset 0.3 --duck 0.45
```

Saída em `out/`:

- `next-sites.mp4` — vídeo com trilha + efeitos
- `next-sites-sem-audio.mp4` — só o vídeo (para montar no CapCut/Premiere)
- `next-sites-com-narracao.mp4` — quando `--narration` é usado
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
