/* ==========================================================================
   BRASA BURGER — Configuração do site
   --------------------------------------------------------------------------
   Este é o ÚNICO arquivo que precisa ser editado para colocar o site no ar
   com os dados reais da hamburgueria. Campos vazios ('') ficam ocultos no
   site automaticamente — nada de informação provisória aparece para o
   visitante.
   ========================================================================== */
window.BRASA_CONFIG = {

  /* ---------------------------------------------------------------- PEDIDOS
     Todos os botões "FAÇA SEU PEDIDO" (topo, hero, menu mobile, chamada
     final, rodapé e botão flutuante) usam este mesmo número.
     Formato: DDI + DDD + número, só dígitos. Ex.: '5511912345678'
     Enquanto estiver vazio, o WhatsApp abre com a mensagem pronta e o
     cliente escolhe o contato manualmente.                                 */
  whatsapp: {
    number: '',
    message: 'Olá, BRASA BURGER! 🔥 Quero fazer um pedido.'
  },

  /* ---------------------------------------------------------------- CONTATO */
  contact: {
    address: {
      street: '',        // Ex.: 'Rua Exemplo, 123'
      district: '',      // Ex.: 'Centro'
      city: '',          // Ex.: 'São Paulo'
      state: '',         // Ex.: 'SP'
      zip: ''            // Ex.: '01000-000'
    },
    mapsUrl: '',         // Link do Google Maps (opcional; se vazio, é gerado a partir do endereço)

    // Uma linha por item. Ex.: ['Terça a quinta · 18h às 23h', 'Sexta e sábado · 18h à 0h']
    hours: [],

    // Horário no formato do Google (opcional, melhora o SEO).
    // Ex.: ['Tu-Th 18:00-23:00', 'Fr-Sa 18:00-23:59']
    hoursSchema: [],

    phone: '',           // Exibição. Ex.: '(11) 91234-5678'
    email: '',
    instagram: '',       // URL completa. Ex.: 'https://instagram.com/brasaburger'
    tiktok: '',
    facebook: ''
  },

  /* ------------------------------------------------------------- AVALIAÇÕES
     Nota e quantidade reais (ex.: do Google). Se vazio, o selo de nota fica
     oculto. Os depoimentos ficam no index.html (seção #avaliacoes).        */
  reviews: {
    rating: '',          // Ex.: '4,9'
    count: '',           // Ex.: '+1.200 avaliações no Google'
    url: ''              // Link para as avaliações (opcional)
  },

  /* ----------------------------------------------------------------- SITE */
  site: {
    url: ''              // Endereço final do site. Ex.: 'https://www.brasaburger.com.br'
  },

  /* ---------------------------------------------------------------- GALERIA
     Cada espaço mostra uma ilustração animada da marca até receber uma foto.
     Coloque as fotos em assets/img/galeria/ e informe o caminho em `image`.
     `position` ajusta o enquadramento (ex.: 'center 30%').
     Tamanhos recomendados em assets/img/galeria/LEIA-ME.txt               */
  gallery: {
    chapa:  { image: '', alt: 'Hambúrguer sendo prensado na chapa quente', position: 'center' },
    salao:  { image: '', alt: 'Ambiente da hamburgueria BRASA BURGER',     position: 'center' },
    burger: { image: '', alt: 'Hambúrguer artesanal da BRASA BURGER',      position: 'center' },
    batata: { image: '', alt: 'Porção de batatas rústicas crocantes',      position: 'center' },
    noite:  { image: '', alt: 'Noite no salão da BRASA BURGER',            position: 'center' }
  }
};
