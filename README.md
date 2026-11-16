# BRASA BURGER — Site institucional

Site institucional da hamburgueria artesanal **BRASA BURGER**. Feito em HTML, CSS e JavaScript puros: não precisa de build, servidor especial nem dependências. Funciona em qualquer hospedagem de arquivos estáticos.

---

## 1. Antes de publicar: checklist do cliente

Tudo o que depende de informação real fica em **um único arquivo: `js/config.js`**. Campos vazios ficam **ocultos automaticamente**, então nenhum dado provisório aparece para o visitante.

| Item | Onde | Situação atual |
|---|---|---|
| Número do WhatsApp para pedidos | `whatsapp.number` | **Vazio.** Os botões abrem o WhatsApp com a mensagem pronta, e o cliente escolhe o contato |
| Mensagem padrão do pedido | `whatsapp.message` | Preenchida, pode ser ajustada |
| Endereço | `contact.address` | **Vazio** (coluna oculta no rodapé) |
| Horário de funcionamento | `contact.hours` | **Vazio** (oculto no rodapé, na chamada final e no menu mobile) |
| Telefone / e-mail | `contact.phone`, `contact.email` | **Vazio** (oculto) |
| Instagram / TikTok / Facebook | `contact.instagram`… | **Vazio** (coluna oculta) |
| Nota e quantidade de avaliações | `reviews.rating`, `reviews.count` | **Vazio** (selo oculto) |
| Fotos da galeria | `gallery.*.image` | Ilustrações animadas no lugar das fotos |
| Endereço final do site | `site.url` + `index.html` | **Vazio** (veja a seção 4) |

**Conteúdo para validar com o cliente** (está no `index.html`):

- **Depoimentos** da seção Avaliações: são **exemplos** e devem ser substituídos por avaliações reais (ex.: do Google) antes de publicar. O trecho está marcado com o comentário `DEPOIMENTOS DE EXEMPLO`.
- **Afirmações sobre o produto**: blend de 180 g, chapa a 280 °C, carne fresca e nunca congelada, molhos e picles feitos na casa, brioche de fermentação lenta e bacon defumado. Confirme que todas valem para a operação real e ajuste o texto se necessário.
- **História**: o texto apresenta a filosofia da marca ("o ritual da brasa"), sem datas ou nomes. Se o cliente quiser contar a história real (ano de fundação, fundadores), basta editar a seção `#historia`.

---

## 2. Configuração (`js/config.js`)

### WhatsApp

```js
whatsapp: {
  number: '5511912345678',   // DDI 55 + DDD + número, só dígitos
  message: 'Olá, BRASA BURGER! 🔥 Quero fazer um pedido.'
}
```

Os 6 botões de pedido usam este mesmo número: topo, hero, menu mobile, chamada final, rodapé e botão flutuante. Todos abrem `https://wa.me/<número>?text=<mensagem>` em nova aba.

### Endereço, horário e redes

```js
contact: {
  address: { street: 'Rua Exemplo, 123', district: 'Centro', city: 'São Paulo', state: 'SP', zip: '01000-000' },
  mapsUrl: '',                                   // opcional; se vazio, o link do Maps é gerado pelo endereço
  hours: ['Terça a quinta · 18h às 23h', 'Sexta e sábado · 18h à 0h'],
  hoursSchema: ['Tu-Th 18:00-23:00', 'Fr-Sa 18:00-23:59'],   // opcional, para o Google
  phone: '(11) 91234-5678',
  email: 'contato@brasaburger.com.br',
  instagram: 'https://instagram.com/brasaburger',
  tiktok: '', facebook: ''
}
```

O endereço vira automaticamente um link para o Google Maps, e o telefone vira um link clicável no celular.

### Avaliações

```js
reviews: { rating: '4,9', count: '+1.200 avaliações no Google', url: 'https://g.page/...' }
```

Use **apenas números reais**. Se `rating` ficar vazio, o selo não aparece.

### Fotos da galeria

1. Coloque as fotos em `assets/img/galeria/` (tamanhos e dicas em `assets/img/galeria/LEIA-ME.txt`).
2. Informe o caminho no config:

```js
gallery: {
  chapa:  { image: 'assets/img/galeria/chapa.webp',  alt: 'Hambúrguer sendo prensado na chapa', position: 'center' },
  salao:  { image: 'assets/img/galeria/salao.webp',  alt: 'Salão da BRASA BURGER',              position: 'center' },
  burger: { image: 'assets/img/galeria/burger.webp', alt: 'Hambúrguer artesanal',               position: 'center 40%' },
  batata: { image: 'assets/img/galeria/batata.webp', alt: 'Batatas rústicas',                   position: 'center' },
  noite:  { image: 'assets/img/galeria/noite.webp',  alt: 'Noite no salão',                     position: 'center' }
}
```

| Espaço | Conteúdo | Formato | Tamanho ideal |
|---|---|---|---|
| `chapa` | Preparo na chapa | horizontal largo | 1800×1200 |
| `salao` | Ambiente / salão | horizontal | 1400×1000 |
| `burger` | Hambúrguer em destaque | vertical | 1200×1500 |
| `batata` | Batatas / acompanhamentos | horizontal | 1400×1000 |
| `noite` | Clima do salão à noite | quadrado | 1200×1200 |

As fotos recebem o mesmo tratamento visual da marca (vinheta quente e zoom suave ao passar o mouse), carregam só quando chegam perto da tela e abrem ampliadas ao clicar, com setas e teclado. Se um arquivo não for encontrado, a ilustração continua no lugar.

---

## 3. Publicação

O site é só uma pasta de arquivos. Opções gratuitas e simples:

- **Netlify**: em app.netlify.com, arraste a pasta do projeto para a área "Deploy manually".
- **Vercel**: `vercel` na pasta do projeto, ou importe o repositório do GitHub (framework: "Other", sem build).
- **GitHub Pages**: em *Settings → Pages*, escolha a branch e a pasta raiz (`/`).
- **Hospedagem tradicional (cPanel/FTP)**: envie todo o conteúdo da pasta para `public_html`.

Para testar no computador, basta abrir o `index.html` no navegador. Para simular um servidor: `npx serve .` ou `python3 -m http.server`.

---

## 4. SEO e compartilhamento

Já configurado:

- Título, descrição, `robots`, idioma `pt-BR` e `theme-color`.
- Open Graph e Twitter Card com imagem de compartilhamento 1200×630 (`assets/og-image.jpg`).
- Favicon SVG + PNG, ícone Apple (`apple-touch-icon.png`) e manifesto (`site.webmanifest`) com ícones 192/512 e versão *maskable*.
- Dados estruturados `Restaurant` (schema.org). Endereço, telefone, horário, redes e nota são incluídos automaticamente quando preenchidos no config.
- Um único `h1`, hierarquia de títulos, textos alternativos e `robots.txt`.

**Depois de publicar, com o domínio definido:**

1. Em `js/config.js`, preencha `site.url` (ex.: `'https://www.brasaburger.com.br'`).
2. No `index.html`, descomente a linha `<link rel="canonical" ...>` e coloque o domínio.
3. No `index.html`, troque `assets/og-image.jpg` nas tags `og:image` e `twitter:image` pela URL completa (ex.: `https://www.brasaburger.com.br/assets/og-image.jpg`). Algumas redes só leem imagens com endereço absoluto.
4. No `robots.txt`, descomente a linha do `Sitemap` se for criar um sitemap.
5. Cadastre o site no **Google Search Console** e mantenha o **Perfil da Empresa no Google** com o mesmo endereço e horário do site.

---

## 5. Estrutura

```
index.html               conteúdo, SEO e estrutura das seções
site.webmanifest         manifesto (ícones / tela inicial do celular)
robots.txt
css/base.css             identidade (cores, fontes), botões, revelação no scroll, cursor
css/burger.css           componente do hambúrguer (camadas 3D, rótulos, queijo derretendo)
css/loader.css           tela de carregamento
css/layout.css           cabeçalho, menu responsivo, hero, faixa animada, rodapé
css/sections.css         história, ingredientes, diferenciais, avaliações, galeria, CTA
js/config.js             ← ÚNICO arquivo de configuração
js/burger.js             motor do hambúrguer (ingredientes em SVG + animação 3D)
js/embers.js             faíscas de brasa (canvas)
js/loader.js             progresso real de carregamento + montagem do burger
js/main.js               contato, WhatsApp, SEO dinâmico, galeria, menu, scroll, carrossel
assets/                  favicon, ícones, imagem de compartilhamento
assets/img/galeria/      fotos reais da galeria (ver LEIA-ME.txt)
```

**Paleta**: vermelho `#B5121B`, preto `#191313`, dourado `#F2A23A` e creme `#F7F0E8` (variáveis em `css/base.css`). **Fontes**: Anton (títulos), Fraunces itálico (destaques) e Manrope (textos), via Google Fonts.

---

## 6. Desempenho e acessibilidade

- Cerca de 48 KB (gzip) de HTML, CSS e JS, sem bibliotecas externas. Os scripts carregam com `defer`.
- As animações usam `transform`/`opacity`, ficam pausadas fora da tela ou com a aba oculta, e as brasas usam sprites pré-renderizados.
- Aparelhos modestos ou com "economia de dados" recebem automaticamente uma versão mais leve dos efeitos decorativos.
- Quem volta ao site na mesma sessão vê uma intro mais curta, e o botão "Pular intro" está sempre disponível.
- Respeita `prefers-reduced-motion`. Funciona sem JavaScript (o conteúdo aparece sem a intro), tem link "Pular para o conteúdo", menu mobile com foco gerenciado e alvos de toque com pelo menos 44 px.
