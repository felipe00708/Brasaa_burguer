/* NEXT SITES — linha do tempo compartilhada entre vídeo, áudio e player.
   Todos os tempos em segundos. Altere aqui para ressincronizar tudo. */
(function () {
  const TL = {
    W: 1080,
    H: 1920,
    /* As animações são escritas em "tempo de projeto" (0–35 s). Para encaixar a
       narração em velocidade natural, a linha do tempo final é esticada por trechos:
       KNOTS = [[tempo de projeto, tempo no vídeo final], ...]. */
    DESIGN_DUR: 35,
    DUR: 48.5,
    KNOTS: [[0, 0], [6, 7.0], [12, 13.3], [18, 23.2], [20.6, 25.8], [24.45, 33.0], [24.95, 34.3], [26.25, 35.95],
      [27.55, 37.8], [28.65, 39.3], [29.0, 39.65], [30.3, 40.6], [32.3, 42.6], [35, 48.5]],
    FPS: 30,

    COLORS: {
      blue: '#0057F1',   // Azul elétrico
      neon: '#00A6FF',   // Azul neon
      black: '#05070D',  // Preto profundo
      ice: '#F4F6FA',    // Branco gelo
    },

    SCENES: [
      { id: 1, name: 'Abertura impactante', start: 0, end: 7.0 },
      { id: 2, name: 'O mundo digital', start: 7.0, end: 13.3 },
      { id: 3, name: 'O problema', start: 13.3, end: 23.2 },
      { id: 4, name: 'A transformação', start: 23.2, end: 39.65 },
      { id: 5, name: 'Encerramento', start: 39.65, end: 48.5 },
    ],

    /* Narração (ElevenLabs, voz Brian) — posição de cada trecho no vídeo final.
       Os arquivos estão em assets/narracao/ e a faixa montada em assets/narracao.mp3. */
    VO_CUES: [
      { start: 0.5, end: 6.56, scene: 1, file: '01.mp3', label: 'Todos os dias, novas oportunidades surgem e o mundo dos negócios não para de evoluir.' },
      { start: 7.25, end: 13.03, scene: 2, file: '02.mp3', label: 'Hoje, antes de escolher uma empresa, as pessoas pesquisam, procuram informações e comparam.' },
      { start: 13.5, end: 19.42, scene: 3, file: '03.mp3', label: 'Mas e se, quando procurarem sua empresa, não houver um site para apresentar tudo o que você oferece?' },
      { start: 19.8, end: 22.82, scene: 3, file: '04.mp3', label: 'Você pode estar perdendo oportunidades sem perceber.' },
      { start: 23.6, end: 33.92, scene: 4, file: '05.mp3', label: 'Imagine sua empresa com uma presença digital profissional, um espaço próprio para apresentar seus serviços, conquistar confiança e facilitar o contato com seus clientes.' },
      { start: 34.25, end: 39.03, scene: 4, file: '06.mp3', label: 'Mais visibilidade, mais credibilidade, mais oportunidades.' },
      { start: 41.0, end: 43.32, scene: 5, file: '07.mp3', label: 'Sua empresa merece estar na internet.' },
      { start: 43.55, end: 47.03, scene: 5, file: '08.mp3', label: 'NEXT SITES, transformando negócios em presença digital.' },
    ],

    /* Momentos-chave usados pelas animações e pelos efeitos sonoros */
    CUE: {
      line1: 0.55,
      text1a: 1.2,     // "O mundo está mudando."
      text1b: 3.0,     // "E a forma de fazer negócios também."
      exit1: 5.35,
      phoneIn: 6.0,
      text2a: 6.7,     // "Seus clientes estão conectados."
      exit2a: 8.6,
      word1: 9.0,      // "pesquisam."
      typeStart: 9.05,
      typeEnd: 9.95,
      word2: 9.95,     // "Comparam."
      word3: 10.85,    // "Escolhem."
      tap1: 11.25,
      exit2: 11.75,
      profile: 12.1,
      hit3a: 13.0,     // "E sua empresa?"
      tapFail: 13.35,
      hit3b: 14.4,     // "Está sendo encontrada?"
      losses: [13.8, 14.7, 15.5, 16.3],
      exit3: 17.35,
      transform: 18.0,
      spinStart: 18.35,
      spinEnd: 19.85,
      build: 19.85,
      text4: 20.6,     // "Sua empresa merece uma presença digital profissional."
      devicesIn: 21.2,
      scroll1: 21.7,
      scroll2: 23.4,
      exit4: 24.45,
      benefits: [24.95, 26.25, 27.55],
      exitBenefits: 28.65,
      core: 29.55,
      logo: 30.3,
      wordmark: 30.85,
      headline: 31.25,
      tagline: 33.2,   // sincronizado com "transformando" na narração
      shine: 34.0,
    },
  };

  /* mapeamento de tempo: T(projeto) -> vídeo final, Wt(vídeo final) -> projeto */
  const pw = (x, K, a, b) => {
    if (x <= K[0][a]) return K[0][b] + (x - K[0][a]);
    for (let i = 1; i < K.length; i++) if (x <= K[i][a]) {
      const [p, q] = [K[i - 1], K[i]]; return p[b] + ((x - p[a]) / (q[a] - p[a])) * (q[b] - p[b]);
    }
    const L = K[K.length - 1]; return L[b] + (x - L[a]);
  };
  TL.T = x => pw(x, TL.KNOTS, 0, 1);
  TL.Wt = x => pw(x, TL.KNOTS, 1, 0);

  if (typeof window !== 'undefined') window.NS_TIMELINE = TL;
  if (typeof module !== 'undefined') module.exports = TL;
})();
