---
name: pptx-igreen
description: Cria e ajusta apresentações PowerPoint (.pptx 16:9, editáveis) no padrão visual aprovado da iGreen Energy — fundo escuro com textura da marca ou verde cheio (nunca slide branco), Impact + Montserrat, logo oficial, barra de capítulos, Morph entre todos os slides, animações por clique, gráficos em 3D nativo, vídeo real de fundo, vidro neon, mostrador, tipografia-cenário, mapa de estados, mockup de iPhone. Use sempre que o Matheus pedir PPT/PPTX/apresentação/deck/slides da iGreen (Conexão Green, Mob, Telecom, Seguros, BESS, Live Connect, APN, promoções, propostas para clientes), mandar um PDF/briefing/áudio para virar slides, pedir para "adaptar", "deixar brabo", "me surpreender" em PowerPoint, ou corrigir um deck já gerado. Traz kit Node (pptxgenjs), pós-processador Python (Morph/animação/3D), validador, render pelo PowerPoint, comparador de edições manuais, instalador e teste.
---

# pptx-igreen — decks da iGreen no padrão aprovado

Tudo o que funcionou nos decks de out–nov/2026 (Live Connect, Desconto Social, Ganhos do Licenciado, Proposta BESS,
Promoções Conexão Green), empacotado para sair **idêntico** em qualquer máquina.

```
pptx-igreen/
  SKILL.md                 este guia
  instalar.ps1 / .sh       instala em outra máquina (pacotes travados, fontes) e roda o teste
  scripts/lib/igreen.js    o KIT: novoDeck(), fundos, cromo, cabeçalho, ficha, vidro, ícones, barras 3D, mostrador...
  scripts/anim.py          pós-processador: Morph, animações por etiqueta, 3D nativo, vídeo, ids e mídias únicos
  scripts/validar.py       confere o .pptx (estrutura, fontes) e, no Windows, abre no PowerPoint e exporta PNGs
  scripts/comparar.py      o que o Matheus mudou à mão (rodar ANTES de regerar)
  scripts/novo_projeto.js  cria a pasta DD-MM-AAAA_Nome com build.js modelo
  scripts/transcrever.py   áudio do WhatsApp -> texto (Whisper) para entender pedidos sem inventar
  assets/                  logos oficiais, texturas, fundos Conexão Green, brilhos, 147 ícones, iPhone, produtos, mapa
  fontes/                  Montserrat (6 pesos) + Geist Mono (OFL)
  references/              padrão visual · dinâmicas · animações · armadilhas · processo
  teste/                   deck de teste com todas as peças + rodar_teste.py
```

## Regra de fundo (17/11/2026)

`fumaca` (`bg_fumaca.jpg`) e `escuro`/malha (`bg_malha.jpg`) são **exclusivos do Expert**. Em qualquer outro deck use
só `"verde"` ou `"cg2"` (o substituto do malha, serve de capa a fecho; `"cg1"` tem o contorno de um G que briga com o logo e com título grande), e **sempre passe o tipo**: `d.fundo(s)` sem argumento cai no
malha. Em material do Expert, libere com `d.fundo(s, "fumaca", { expert: true })` — sem a chave o build avisa na saída.

## Fluxo de todo pedido

1. **Entender antes de criar.** Ler o PDF inteiro (PyMuPDF), transcrever áudio (`transcrever.py`), listar o que pedem.
   **Nada inventado**: textos, números, datas, estados e nomes saem do material; frase de efeito só se ele mandar.
   Na dúvida entre duas leituras, pergunte. Confira contas (somas, %).
2. **Pasta do projeto** (Regra 1 do `D:\iGreen.SYS\CLAUDE.md`): `node scripts/novo_projeto.js "Nome"` →
   `10_Gerador-de-PPTX\DD-MM-AAAA_Nome\` com `build.js`, `referencias\` (cópia do material), `assets\`, `_historico\`.
3. **Montar o `build.js`** com o kit (veja `references/dinamicas.md`); assets do projeto em `assets\` do projeto.
4. **Gerar**: `node build.js` (o `d.salvar()` grava, aplica o tema e roda o `anim.py`).
5. **Validar e olhar**: `python -I scripts/validar.py "<deck>" --abrir _render` → abra as `folha*.png` e revise
   cada slide contra `references/padrao-visual.md` e `references/armadilhas.md` (sobreposição, texto cortado, logo
   repetido, foto errada). Corrija e repita até ficar limpo.
6. **Entregar** um arquivo só, nome fixo, na pasta do projeto. Versão anterior vai para `_historico\`. Diga o que
   não foi visto (ex.: animações só conferidas em estrutura, não assistidas no modo apresentação).
7. **Aprender**: o que ele aprovar/corrigir vira regra em `references/` desta skill (e na memória).

## Antes de regerar um deck existente (obrigatório)

Ele edita os PPTX à mão. Se o arquivo foi salvo depois do último build: copie para `_historico\`, gere para um arquivo
temporário, rode `python -I scripts/comparar.py gerado.pptx editado.pptx` e leve cada mudança dele para o `build.js`
antes de sobrescrever. Se o PowerPoint estiver com o arquivo aberto (EBUSY), gere `_novo.pptx` e peça para fechar.

## Kit em 20 linhas

```js
const kit = require(require("path").join(require("os").homedir(), ".claude/skills/pptx-igreen/scripts/lib/igreen.js"));
const d = kit.novoDeck({ titulo: "Proposta X", capitulos: ["Introdução", "Análise", "Retorno"], total: 8 });
const { C, F, M, W, tag } = d;                      // cores, fontes, margem 0.6", largura 13.333"
let s = d.slide(); await d.fundo(s, "cg2"); d.cromo(s, { capitulo: 0 });              // capa
s = d.slide(); await d.fundo(s, "cg2"); d.cromo(s, { capitulo: 1 });                  // escuro + textura
d.cabecalho(s, "01", "Análise · Consumo", ["CONSUMO", "E FATURA."]);
d.ficha(s, "Distribuidora", "Energisa", 7, 1.7, 5.7, { passo: "c1" });
await d.vidroNeon(s, 6.75, 0.75, 5.95, "Economia mensal", "R$ 177.194,35", "texto do PDF", { pilula: "por mês" });
await d.mostrador(s, 7.5, 1.2, 4.2, 3.9 / 25, "3,9", "anos de payback", "em 25 anos");
d.barras3d(s, itens, { x0: 4.55, x1: 12.48, base: 5.95 });                            // escada 3D
s = d.slide(); await d.fundo(s, "verde"); d.cromo(s, { capitulo: 2, modo: "verde" }); // verde cheio
await d.salvar("Proposta X.pptx");
```
Etiquetas de animação no `objectName`: `tag("Nome", "a"|"c1"|"c2", "ascend|wipe|wipeup|fly|zoom|fade|wheel|play", ms)`;
`"!!nome"` = par do Morph; `"Nome#3d"`/`"#3d-top"`/`"#3d-raso"` = 3D nativo. Detalhes em `references/animacoes.md`.

## Instalar em outra máquina

Copie a pasta `pptx-igreen` (ou o zip) e rode `instalar.ps1` (Windows) ou `instalar.sh` (Mac). Ele copia para
`~/.claude/skills/pptx-igreen`, instala pptxgenjs 3.12.0 + sharp 0.33.5 pelo `package-lock.json`, lxml/Pillow/PyMuPDF,
as fontes que faltarem e roda `teste/rodar_teste.py` (no Windows abre no PowerPoint e confere pixels). Só está pronto
com **APROVADO** no `RELATORIO_TESTE.md`. Vídeos do Onboarding e prints de app não vêm na skill: ficam no projeto.
