/* NEXT SITES — linha do tempo compartilhada entre vídeo, áudio e player.
   Todos os tempos em segundos. Altere aqui para ressincronizar tudo. */
(function () {
  const TL = {
    W: 1080,
    H: 1920,
    DUR: 35,
    FPS: 30,

    COLORS: {
      blue: '#0057F1',   // Azul elétrico
      neon: '#00A6FF',   // Azul neon
      black: '#05070D',  // Preto profundo
      ice: '#F4F6FA',    // Branco gelo
    },

    SCENES: [
      { id: 1, name: 'Abertura impactante', start: 0, end: 6 },
      { id: 2, name: 'O mundo digital', start: 6, end: 12 },
      { id: 3, name: 'O problema', start: 12, end: 18 },
      { id: 4, name: 'A transformação', start: 18, end: 29 },
      { id: 5, name: 'Encerramento', start: 29, end: 35 },
    ],

    /* Janelas reservadas para a narração (ElevenLabs). São apenas guias
       visuais na timeline do player; nenhuma voz é gerada. */
    VO_CUES: [
      { start: 0.8, end: 5.6, scene: 1, label: 'O mundo está mudando. E a forma de fazer negócios também.' },
      { start: 6.4, end: 11.6, scene: 2, label: 'Seus clientes estão conectados. Eles pesquisam. Comparam. Escolhem.' },
      { start: 12.8, end: 17.4, scene: 3, label: 'E sua empresa? Está sendo encontrada?' },
      { start: 20.4, end: 24.4, scene: 4, label: 'Sua empresa merece uma presença digital profissional.' },
      { start: 24.8, end: 28.6, scene: 4, label: 'Mais visibilidade. Mais credibilidade. Mais oportunidades.' },
      { start: 30.6, end: 34.6, scene: 5, label: 'Sua empresa merece estar na internet. NEXT SITES.' },
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
      tagline: 31.95,
      shine: 33.4,
    },
  };

  if (typeof window !== 'undefined') window.NS_TIMELINE = TL;
  if (typeof module !== 'undefined') module.exports = TL;
})();
