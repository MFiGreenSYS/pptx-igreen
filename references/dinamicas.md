# Catálogo de dinâmicas (o que já foi usado e como montar com o kit)

Cada uma foi aplicada a conteúdo real; use de forma genuína ao conteúdo novo, não copie o slide.
Projeto de referência entre parênteses (pastas em `D:\iGreen.SYS\10_Gerador-de-PPTX\`).

| Dinâmica | Quando usar | Como (kit) |
|---|---|---|
| **Capa cinema** | abertura | `fundo("cg2")` ou vídeo de fundo + véu; kicker + título Impact 100–120 pt em 2 linhas, última em verde (BESS, Promoções). `fumaca` só no Expert |
| **Capa de fecho** | sempre | `fundo("cg2")` + logo grande central (`cromo({logo:false})`) + `#NOSSAENERGIATRANSFORMA` |
| **Vídeo real de fundo** | assunto com cena (carro, placas, sede) | `d.video(s, mp4, capa.jpg, 0,0,W,H,"!!bg-x")` + véu `graficos.veuEsquerda()`; vídeos do Onboarding RH comprimidos (1280 px, 9 s, sem áudio). Vídeo com legenda queimada ou logo no canto: não usar (Ganhos) |
| **Sanfona Morph** | várias opções do mesmo tipo (conexões) | N slides, painéis com nomes `!!painel-x`; o da vez abre (largura grande) e toca vídeo, os outros fecham com nome deitado (Ganhos 8–13) |
| **Tipografia-cenário** | produto/hero | verde cheio, palavra gigante Impact 400–470 pt branca atrás, produto recortado na frente, ficha em linha embaixo (BESS 6: "BESS" + contêiner; lab: "MOB" + 3 carregadores) |
| **Vidro neon** | o número que fecha a conta | `d.vidroNeon()` (economia R$ 177 mil no BESS; R$ 360 no Ganhos) |
| **Mostrador** | percentual/prazo de um total | `d.mostrador(..., pct)` — anel enche com o efeito Roda no clique (82% do Mob, payback 3,9 de 25 anos) |
| **Ficha técnica mono** | dados de unidade/equipamento | `d.ficha()` em coluna com fio verde no topo; régua proporcional real em vez de "pontos de nota" (BESS 3 e 7) |
| **Barras/escada 3D** | faixas crescentes, metas | `d.barras3d()`; destaque no fim em verde cheio, cascata ascendente (Bônus Turbinado 10→300; Investimento de Volta 10/20/30 proporcional) |
| **Cascata proporcional** | bruto → líquido | retângulos com altura proporcional ao valor, um por clique (BESS 12) |
| **Linha do tempo** | trajetória | fio + pontos, um ano por clique, último ano em bloco verde (Ganhos 3, BESS 2) |
| **Bento escuro** | lista de benefícios | cartões `d.vidro()` com ícone e número, um em verde cheio, vídeo no módulo grande (lab 4) |
| **Mapa de estados** | onde vale | `kit.mapaEstados([...ufs], png)` + `d.rodapeEstados()`; contorno preto, só os ativos em verde (Desconto Social, Promoções) |
| **Mockup de iPhone** | print de app | `d.iphone(s, tela.png, ...)`; um print por clique; sem Dynamic Island |
| **Equação por cliques** | conta de ganho | termos entrando um por clique, resultado em bloco verde (Ganhos "Na prática") |
| **Grade 3 colunas com fios** | vantagens | palavra Impact grande + texto curto, fios finos de 0,75 pt |
| **Frase-manifesto em verde** | decisão/aquisição | verde cheio, frase central Montserrat SemiBold 32–34 pt, palavras-chave em branco com marcador preto (BESS 11) |

Pesquisa de referência: pasta do Matheus `Downloads\ref-moderns-pptx` (60 pins). Candidatas ainda não usadas:
dado 3D isométrico com brilho (precisa render do Blender), pessoa real com feixe de luz verde (precisa foto real).
