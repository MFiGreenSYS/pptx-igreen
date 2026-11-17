# Animações, Morph e 3D (o que o anim.py faz)

O pptxgenjs não escreve transição nem animação. O `anim.py` lê o **nome** de cada objeto e monta a timeline.

## Etiqueta no objectName
`kit.tag("Nome", passo, efeito, atraso)` → `"Nome [passo|efeito|atraso]"`
- `passo`: `a` = entra sozinho ao abrir o slide · `c1`, `c2`… = no 1º, 2º… clique (tudo do mesmo clique junto,
  com o atraso em ms de cada um).
- `efeito`: `ascend` (sobe e aparece, títulos) · `wipe` (revela da esquerda, blocos/fios) · `wipeup` (de baixo, barras) ·
  `fly` (voa de baixo, objetos/fotos) · `zoom` (números, cartões) · `fade` · `wheel` (Roda, para arcos de mostrador) ·
  `play` (vídeo: aparece e toca).
- Depois de montar a timeline o `anim.py` **apaga a etiqueta do nome** (painel de seleção limpo).

## Morph
- Todos os slides recebem Morph por objeto (1,25 s; fallback fade). Conferido no PowerPoint: EntryEffect 3954.
- Objetos com o **mesmo nome `!!algo`** em slides seguidos viajam (logo `!!logo`, textura `!!textura`, barra
  `!!rail`/`!!rail-fill`/`!!cap-i`, painéis da sanfona, título da capa que encolhe até o slide seguinte).
- Não ponha etiqueta de entrada num objeto que faz par de Morph (ele sumiria e voltaria).

## 3D nativo (editável)
- `"Nome#3d"` (lateral verde-escura), `"#3d-top"` (destaque verde) e `"#3d-raso"` (0,6" de profundidade).
- Câmera `obliqueTopRight`: a face da frente não sai do lugar (os rótulos continuam alinhados) e a profundidade sai
  para cima/direita. Profundidade padrão 1,2" (aparece ~1/4). No PowerPoint: Formatar Forma → Formato 3D.
- Espaço entre barras ≥ 0,17" senão a lateral de uma cobre a vizinha.

## Vídeo
- Todo vídeo sai mudo e em loop. Sem etiqueta = vídeo de fundo, toca ao abrir. Com `play` = aparece e toca no passo.
- O pptxgenjs repete ids de objeto em slide com vídeo; o `anim.py` renumera (sem isso o PowerPoint recusa abrir).

## Outras coisas que o anim.py garante
- Mídias repetidas (textura, logos) gravadas uma vez só no zip (deck 34 MB → 22 MB).
- Zip sem entradas de pasta (o validador do PowerPoint reclama).
- Vídeos em sequência por "após anterior" não seguraram no PowerPoint do Matheus: prefira um item por clique.
