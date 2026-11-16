/* ==========================================================================
   BRASA BURGER — Configuração do site
   Edite apenas este arquivo para trocar o WhatsApp, a mensagem padrão,
   os dados de contato e as fotos da galeria.
   ========================================================================== */
window.BRASA_CONFIG = {
  whatsapp: {
    // Número com DDI + DDD, apenas dígitos. Ex.: 55 + 11 + 999999999
    number: '5511999999999',
    // Mensagem que chega pré-preenchida no WhatsApp
    message: 'Olá, BRASA BURGER! 🔥 Quero fazer meu pedido.'
  },

  contact: {
    address: 'Rua das Brasas, 280 — Vila Madalena, São Paulo/SP',
    hours: 'Ter a Dom · 18h às 00h',
    phone: '(11) 99999-9999',
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/'
  },

  /* Galeria "Experiência": deixe `image` vazio para usar as ilustrações da
     marca, ou informe o caminho de uma foto (ex.: 'assets/img/salao.jpg'). */
  gallery: {
    chapa:   { image: '' },
    salao:   { image: '' },
    burger:  { image: '' },
    batata:  { image: '' },
    noite:   { image: '' }
  }
};
