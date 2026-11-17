// __TITULO__ — gerado com a skill pptx-igreen (kit em ~/.claude/skills/pptx-igreen).
// Textos e números SEMPRE do material do Matheus (PDF/briefing/áudio transcrito). Nada inventado.
// Rodar: node build.js            (grava, aplica tema, Morph, animações, 3D)  ->  python -I <skill>/scripts/validar.py "<arquivo>" --abrir _render
const os = require("os");
const path = require("path");
const SKILL = process.env.PPTX_IGREEN || path.join(os.homedir(), ".claude", "skills", "pptx-igreen");
const kit = require(path.join(SKILL, "scripts", "lib", "igreen.js"));

const CAPITULOS = ["Introdução", "Conteúdo", "Fechamento"]; // barra de capítulos embaixo (vazio = sem barra)
const OUT = path.join(__dirname, process.argv[2] || "__ARQUIVO__.pptx");

(async () => {
  const d = kit.novoDeck({ titulo: "__TITULO__", capitulos: CAPITULOS, total: 3 });
  const { C, F, M, W, H, tag } = d;
  let s;

  // 1 · CAPA — textura Conexão Green, título gigante ("fumaca" e "escuro"/malha são só do Expert)
  s = d.slide(); await d.fundo(s, "cg2"); d.cromo(s, { capitulo: 0 });
  d.kicker(s, "iGreen Energy", M, 2.0);
  d.t(s, [{ text: "TÍTULO", options: { breakLine: true } }, { text: "DO DECK.", options: { color: C.G } }], M, 2.35, 11, 3.0,
    { fontFace: F.HF, fontSize: 110, lineSpacingMultiple: 0.84, objectName: tag("Titulo", "a", "ascend") });

  // 2 · CONTEÚDO — escuro com textura cg2, cabeçalho de capítulo + ficha técnica
  s = d.slide(); await d.fundo(s, "cg2"); d.cromo(s, { capitulo: 1 });
  d.cabecalho(s, "01", "Capítulo · assunto", ["TÍTULO DO", "SLIDE."]);
  d.ficha(s, "Rótulo", "Valor", 7.0, 1.7, W - M - 7.0, { passo: "c1" });

  // 3 · FECHO — logo grande, sem o logo pequeno
  s = d.slide(); await d.fundo(s, "cg2"); d.cromo(s, { capitulo: 2, logo: false });
  s.addImage({ path: kit.ASSET("marca", "logo_white.png"), x: (W - 5.2) / 2, y: 2.55, w: 5.2, h: (5.2 * 386) / 1400, objectName: tag("Logo grande", "a", "zoom") });
  d.t(s, "#NOSSAENERGIATRANSFORMA", 0, 4.25, W, 0.4, { fontSize: 16, bold: true, color: C.G, align: "center", charSpacing: 6, objectName: tag("Hashtag", "a", "fade", 500) });

  await d.salvar(OUT);
  console.log("OK", d.n, "slides ->", OUT, "\n" + (d.relatorioAnim || ""));
})().catch((e) => { console.error(e); process.exit(1); });
