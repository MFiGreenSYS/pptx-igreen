# Padrão visual iGreen para PPTX (aprovado pelo Matheus, out–nov/2026)

## Formato
- 16:9 `LAYOUT_WIDE` (13,333 × 7,5 pol). Margem 0,6". Vertical 460×540 só no Live Connect (ver projeto 28-10).
- **Editável sempre**: todo texto, número, cartão e barra é objeto nativo. Imagem só para fundo, logo, ícone, foto,
  mapa e gráficos de luz (vidro, mostrador). Nunca texto "assado" em PNG.

## Cor
| Uso | Hex |
|---|---|
| Verde iGreen (o único acento) | `18FF00` |
| Preto da marca (fundo) | `030604` |
| Texto escuro sobre verde | `0A0F0B` |
| Rótulo sobre escuro | `9DB0A2` · texto corrido `D7DED9` · fio fino `22352A` |
| Cartão de vidro | `0A140C` (15% transparente) com borda verde 65% transparente |
- Verde cheio = destaque ("o item da vez" em bloco verde cheio). Branco direto sobre verde não lê: use marcador
  preto (`highlight: "0A0F0B"`) ou texto preto.

## Fundos (nunca preto chapado, nunca slide branco)

> **Exclusivos do Expert — não usar (17/11/2026).** `bg_fumaca.jpg` (`fundo(s, "fumaca")`) e `bg_malha.jpg`
> (`fundo(s, "escuro")`, que é o **padrão** quando se chama `d.fundo(s)` sem tipo) ficaram reservados aos materiais
> do Expert. Em qualquer outro deck, use só verde cheio, `cg1` ou `cg2` — e **sempre passe o tipo**, porque omitir
> cai no malha. Em deck do Expert, libere com `d.fundo(s, "fumaca", { expert: true })`; sem a chave o build avisa.

- **`cg2` é o padrão, de capa a fecho** — `fundos/cg_bg2.jpg` + brilho no topo. É o substituto do malha.
  Onde há muito texto pequeno: `transp: 35–40`.
- **`cg1` quase nunca** — `fundos/cg_bg1.jpg` tem o contorno de um G e de uma lâmpada. Atrás de gráfico vira um
  degrau vazio; atrás do logo do fecho, o contorno da lâmpada encosta no ícone do logo e atrás de título Impact
  grande polui (visto no render de 17/11/2026). Só em slide de respiro, sem logo grande e sem gráfico.
- **Verde cheio `18FF00`** para alternar com o escuro (tipografia-cenário, slide de decisão). Texto preto.
- Com `cg1`/`cg2` vem a submarca "conexão green" no cromo quando o deck for Conexão Green; em deck de outro
  produto, `cromo()` sem `submarca` — o fundo é só textura.
- Slide claro (branco/menta) foi **rejeitado** em 16/11/2026 ("altere os slides em branco, deixe preto ou verde").

## Tipografia
- Títulos e números: **Impact**, caixa alta, entrelinha 0,86, última linha (ou a palavra-chave) em verde.
- Texto: **Montserrat**; "negrito" = face **Montserrat SemiBold** (o kit troca sozinho; bold sintético sai itálico).
- Números grandes no centro de mostrador: Montserrat Light. Fichas técnicas e rótulos: **Geist Mono**.
- Kicker: Montserrat SemiBold 10 pt, caixa alta, espaçamento 4, verde, acima do título.

## Marca (Regra 4 do CLAUDE.md da iGreen)
- Logo e ícone SEMPRE os oficiais (`assets/marca/Igreen.svg`, `Icone.svg` e os PNGs gerados deles). Nunca recortar
  o ícone do logo, nunca redesenhar, nunca copiar o "G" de arte de IA ou de imagem de referência.
- Um logo por slide: no fecho com logo grande, `cromo({ logo: false })`.
- Logo branco no escuro, logo escuro no verde.

## Estrutura que ele aprova
- Logo no topo-esquerdo + **barra de capítulos** embaixo (fio fino com preenchimento verde que cresce slide a slide
  pelo Morph, capítulo atual em verde).
- Cabeçalho: número mono ("01") + kicker + título Impact em 2–3 linhas.
- Elemento ilustrativo **grande**, sangrando a borda (ele aumentou o Instagram 3D de 4,6" para 6").
- Fotos reais de contexto (vídeo do Onboarding, fachada real da sede). A sede é a **fachada térrea neon com
  palmeiras** (`produtos/sede_fachada.png`), nunca prédio/aéreo de outro vídeo.
- Destaque em bloco verde cheio; número grande com legenda pequena; fios finos de 0,75 pt.
- Capa de abertura e capa de fecho em todo deck (pedido de 15/11/2026).
- Gráficos em **3D nativo** (extrusão do PowerPoint, editável) quando houver barras/escada (pedido de 15/11/2026).

## Rejeitado (não fazer)
Linhas neon grossas com halo borrado · cartões inclinados · reflexo box-reflect · cartão de poeira/partículas ·
arco simples de cartões · raios de "sol" girando · G de plástico 3D · mockup de MacBook · número gigante em abertura de
capítulo · logo duplicado · texto encostando na borda · pessoa cortada em linha reta (dissolver com degradê) ·
`glow_halo.png` (é um anel e aparece como argola) · brilho radial solto e forte · slide branco/menta ·
fundo de fumaça (`bg_fumaca.jpg`) e textura de malha (`bg_malha.jpg`) fora de material do Expert (17/11/2026).
