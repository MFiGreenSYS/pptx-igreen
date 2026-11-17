# Armadilhas (cada uma já aconteceu)

## Conteúdo
- **Inventar texto**: frase de efeito, gancho, slogan ("Bora conectar", "Mas o que parece pouco vira hábito") —
  removidos. Só o que está no material. Título pode reorganizar palavras do PDF, não criar promessa.
- Regra mal estendida: "sem fidelidade" valia só para 5G e seguro, não para energia. Leia o escopo de cada frase.
- "Black Friday" × "Green Friday": os materiais de novembro usam Green Friday; o flyer do time dizia Black Friday.
  Não escolha sozinho: deixe fora ou pergunte.
- Pedido em áudio: transcreva inteiro (`transcrever.py`, modelo medium) e resuma o que foi pedido antes de mexer.
- Confira toda conta (16 × 241 = 3.856; bruto − PIS/COFINS − IR/CSLL = líquido; HFP + HP = total).
- Dado novo pedido por ele (ex.: faixa 75 clientes = R$ 7,5 mil) vale também para os posts da mesma campanha.

## Imagens
- PNG "transparente" que é fundo **preto opaco** (insta3d, greenfriday, club_logo): recorte por flood-fill do preto
  ligado à borda ou alfa = brilho (logo claro).
- Cartazes grudados nos PNGs dos carregadores: use os `_c.png` recortados.
- Foto da sede: só a fachada real. Vídeo de evento com legenda queimada/logo no canto: não serve de fundo.
- Imagem de capa com um "G" desenhado: recorte só a parte sem o G (Regra 4).
- `glow_halo.png` é um anel: para brilho suave use `glow_brilho_topo.png`.
- `cg_bg1.jpg` tem contorno de G que parece degrau vazio atrás de gráfico → `cg_bg2.jpg`.

## Tipografia
- Bold do Montserrat sai **itálico** em máquina só com Regular + Bold Italic → face "Montserrat SemiBold" (kit faz).
- Fonte por usuário (Geist Mono, Montserrat Light) não existe em outra máquina: para apresentar fora, exporte PDF
  ou incorpore as fontes. O instalador da skill instala as que faltam.
- Impact a 470 pt: "MOB" (3 letras) cabe em 13,3"; 4 letras ("BESS") a 400 pt.

## Arquivo / ferramentas
- PowerPoint com o arquivo aberto → EBUSY. Gere `_novo.pptx`, peça para fechar, substitua.
- Um arquivo só por deck (nome fixo). Cópias ("v2", "final") viram bagunça; versões antigas em `_historico\`.
- O Matheus edita à mão: antes de regerar, `comparar.py` e leve as edições para o `build.js`.
- Nunca reescreva .js/.py com PowerShell `Get/Set-Content` (mojibake). Python com `encoding="utf-8"` ou
  `[IO.File]::WriteAllText` UTF-8 sem BOM. Scripts `.ps1` com acento: salvar com BOM (PowerShell 5.1).
- `python -I` ignora `PYTHONIOENCODING`: escreva saída em arquivo UTF-8 ou `sys.stdout.reconfigure(encoding="utf-8")`.
- Política de execução do PowerShell bloqueia `.ps1`: rode com `-ExecutionPolicy Bypass`.
- Caminho com espaço passado do Git Bash para PowerShell pode quebrar: rode o PowerShell direto.
- O validador da skill pptx genérica não pega id repetido; o `validar.py` daqui pega, e o teste real é abrir no PowerPoint.

## Layout (revisão de cada render)
- Kicker encostando no acento do título (til do "Ã", circunflexo do "Ê"): kicker ≥ 0,35" acima.
- Título longo quebrando em 3 linhas e invadindo o bloco de baixo: diminua o corpo ou alargue a caixa.
- Texto em 1 linha numa caixa estreita (ex.: "Acompanhamento") quebra no meio da palavra: diminua 1 pt.
- Selo/pílula atrás de outro bloco some (ordem de criação = ordem de empilhamento).
- Rótulo pequeno em cima da textura forte: `transp` na textura ou véu.
