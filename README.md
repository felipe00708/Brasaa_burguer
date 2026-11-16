# BRASA BURGER — Site institucional

Site institucional de uma hamburgueria fictícia, em HTML, CSS e JavaScript puros (sem build, sem dependências). Abra o `index.html` direto no navegador ou publique a pasta em qualquer hospedagem estática (Netlify, Vercel, GitHub Pages).

## Configuração (WhatsApp, contato, fotos)

Tudo fica em **`js/config.js`**:

```js
whatsapp: {
  number: '5511999999999',          // DDI + DDD + número, só dígitos
  message: 'Olá, BRASA BURGER! 🔥 Quero fazer meu pedido.'
}
```

Todos os botões com o atributo `data-order` ("FAÇA SEU PEDIDO", o botão flutuante e o link do rodapé) passam a abrir `https://wa.me/<número>?text=<mensagem>`.

Na galeria "Experiência", cada quadro usa uma ilustração animada da marca. Para trocar por uma foto real, informe o caminho em `gallery.<quadro>.image`.

## Estrutura

```
index.html          marcação e conteúdo das seções
css/base.css        variáveis da marca, tipografia, botões, revelação no scroll, cursor
css/burger.css      componente do hambúrguer (camadas 3D, rótulos, queijo derretendo)
css/loader.css      tela de carregamento e saída com cortinas
css/layout.css      cabeçalho, menu responsivo, hero, faixa animada, rodapé
css/sections.css    história, ingredientes, diferenciais, avaliações, galeria, CTA
js/config.js        configurações editáveis
js/burger.js        motor do hambúrguer: ingredientes em SVG vetorial + animação 3D
js/embers.js        faíscas de brasa em canvas
js/loader.js        progresso real de carregamento + montagem do burger
js/main.js          navegação, scroll, contadores, carrossel, microinterações
```

## Destaques

- **Hambúrguer vetorial em camadas** (pão com gergelim, cebola roxa, tomate, bacon, cheddar com gotas, blend, alface, pão de base): cada ingrediente flutua por conta própria, com profundidade 3D, parallax pelo mouse, ciclo automático de montagem/desmontagem, abertura conforme a rolagem e o botão "Ver por dentro", que mostra os ingredientes com rótulos.
- **Tela de carregamento**: o burger é montado ingrediente por ingrediente, o cheddar derrete, as frases mudam conforme o progresso, que acompanha o carregamento real da página. A saída tem zoom, uma linha dourada e cortinas que se abrem.
- O mesmo componente de burger é reaproveitado no loader, no hero, nos cards de ingredientes, na galeria e na chamada final.
- Animações só com `transform` e `opacity`, pausadas quando saem da tela. Respeita `prefers-reduced-motion`.
- Layout responsivo para desktop, tablet e celular, com menu em tela cheia no mobile.
