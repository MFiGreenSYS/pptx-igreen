// Deck de teste da skill: usa TODAS as peças do kit (fundos, cromo, cabeçalho, ficha, vidro, ícones, pílulas,
// tipografia-cenário, barras 3D, vidro neon, mostrador, mockup de iPhone, mapa de estados, rodapé, capa e fecho).
// Conteúdo de exemplo = números reais já aprovados (Promoções Conexão Green e Proposta BESS), só para teste.
// Uso: node build_teste.js "<saida.pptx>"
const os = require("os");
const path = require("path");
const fs = require("fs");
const SKILL = process.env.PPTX_IGREEN || path.resolve(__dirname, "..");
const kit = require(path.join(SKILL, "scripts", "lib", "igreen.js"));
const sharp = require(require.resolve("sharp", { paths: [path.join(SKILL, "scripts")] }));

const OUT = path.resolve(process.argv[2] || path.join(os.tmpdir(), "pptx-igreen-teste.pptx"));
const TMP = path.join(path.dirname(OUT), "_teste_assets");

(async () => {
  fs.mkdirSync(TMP, { recursive: true });
  const ESTADOS = ["MG", "GO", "PE", "BA", "MT", "CE"];
  const mapa = await kit.mapaEstados(ESTADOS, path.join(TMP, "mapa_teste.png"));
  // tela de app de exemplo para o mockup (gerada; num deck real vem o print do app)
  const tela = path.join(TMP, "tela.png");
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="912" height="1972"><rect width="912" height="1972" fill="#0b1a0e"/>
    <rect x="60" y="260" width="792" height="420" rx="40" fill="#18FF00"/><text x="456" y="500" font-family="Arial" font-weight="700" font-size="90" text-anchor="middle" fill="#030604">iGreen</text>
    ${[0, 1, 2, 3].map((i) => `<rect x="60" y="${760 + i * 230}" width="792" height="190" rx="30" fill="#16231A"/>`).join("")}</svg>`)).png().toFile(tela);

  const d = kit.novoDeck({ titulo: "Teste pptx-igreen", capitulos: ["Abertura", "Kit", "Dinâmicas", "Fecho"], total: 9 });
  const { C, F, M, W, CW, tag } = d;
  let s;

  // 1 · capa (fumaça)
  s = d.slide(); await d.fundo(s, "fumaca"); d.cromo(s, { capitulo: 0 });
  d.kicker(s, "Teste da skill · pptx-igreen", M, 2.0);
  d.t(s, [{ text: "TESTE DO", options: { breakLine: true } }, { text: "KIT iGREEN.", options: { color: C.G } }], M, 2.35, 11, 3.0,
    { fontFace: F.HF, fontSize: 110, lineSpacingMultiple: 0.84, objectName: tag("!!titulo", "a", "ascend") });

  // 2 · escuro com textura: cabeçalho + fichas + cartões de vidro com ícones + pílula
  s = d.slide(); await d.fundo(s); d.cromo(s, { capitulo: 1 });
  d.cabecalho(s, "01", "Kit · peças básicas", ["CABEÇALHO", "E FICHA."], { tamanho: 54, w: 6 });
  [["Município", "Araguaína/TO"], ["Distribuidora", "Energisa"], ["Demanda contratada", "2.000 kW"]].forEach(([k, v], i) => d.ficha(s, k, v, 7.0, 1.3 + i * 0.62, W - M - 7.0, { passo: "a", atraso: 300 + i * 120 }));
  ["rocket", "gift", "money"].forEach((ic, i) => {
    const x = M + i * 2.1;
    d.vidro(s, x, 4.1, 1.95, 1.6, "Card " + i, "c1", i * 150);
    d.icone(s, ic, x + 0.25, 4.3, 0.55, { passo: "c1", atraso: i * 150 + 100 });
  });
  d.pilula(s, "VÁLIDA ATÉ 30/11", 7.0, 4.3, { cheia: true, passo: "c2" });
  d.nota(s, "Nota de rodapé de teste.");

  // 3 · verde cheio: tipografia-cenário com os carregadores na frente
  s = d.slide(); await d.fundo(s, "verde");
  d.t(s, "MOB", -0.2, 0.15, W + 0.4, 6.2, { fontFace: F.HF, fontSize: 470, color: "FFFFFF", align: "center", valign: "middle", charSpacing: -2, objectName: tag("Palavra gigante", "a", "ascend") });
  d.cromo(s, { capitulo: 2, modo: "verde" });
  for (const [i, [f, h, x]] of [["p_charger_slow_c.png", 4.35, 2.3], ["p_charger_fast_c.png", 3.75, 4.85], ["p_charger_ultra_c.png", 4.55, 8.55]].entries()) {
    await d.foto(s, kit.ASSET("produtos", f), x, 6.05 - h, null, h, { objectName: tag("Carregador " + i, "a", "fly", 350 + i * 180) });
  }

  // 4 · barras 3D (escada crescente, destaque no fim)
  s = d.slide(); await d.fundo(s, "cg2"); d.cromo(s, { capitulo: 2, submarca: "conexão green" });
  d.cabecalho(s, null, "Promoção · Novembro", ["BÔNUS", "EXTRA", "TURBINADO."], { tamanho: 56, w: 4, y: 1.3 });
  const T = [[10, "1"], [25, "2,5"], [50, "5"], [75, "7,5"], [100, "10"], [150, "15"], [200, "20"], [300, "30"]];
  d.barras3d(s, T.map(([cli, mil], i) => ({ acima: "R$", rotulo: mil + (i === 7 ? " MIL" : " mil"), sub: String(cli), sub2: "clientes", destaque: i === 7 })),
    { x0: 4.55, x1: W - M - 0.25, base: 5.95, hMin: 1.6, hMax: 4.6, rotuloTam: 18 });
  await d.rodapeEstados(s, ESTADOS, mapa);

  // 5 · vidro neon
  s = d.slide(); await d.fundo(s, "escuro", { transp: 40 }); d.cromo(s, { capitulo: 2 });
  d.cabecalho(s, "04", "Conclusão", ["ECONOMIA,", "INVESTIMENTO", "E RETORNO."], { tamanho: 54, w: 6 });
  await d.vidroNeon(s, 6.75, 0.75, 5.95, "Economia líquida mensal estimada", "R$ 177.194,35", "no cenário com recarga do BESS pela rede no horário fora de ponta", { pilula: "por mês" });

  // 6 · mostrador (Roda)
  s = d.slide(); await d.fundo(s); d.cromo(s, { capitulo: 2 });
  d.cabecalho(s, "04", "Indicadores", ["RETORNO EM", "3,9 ANOS."], { tamanho: 54, w: 5 });
  await d.mostrador(s, 7.5, 1.2, 4.2, 3.9 / 25, "3,9", "anos de payback", "num horizonte de 25 anos", { cada: 20 });

  // 7 · mockup de iPhone
  s = d.slide(); await d.fundo(s); d.cromo(s, { capitulo: 2 });
  d.cabecalho(s, null, "Conexão Green · Green Friday", ["LINK DE", "CONEXÃO."], { tamanho: 60, w: 7, y: 1.3 });
  d.iphone(s, tela, 8.6, 0.75, 2.45, { passo: "c1" });

  // 8 · verde cheio com marcador preto nas palavras-chave + cartões
  s = d.slide(); await d.fundo(s, "verde"); d.cromo(s, { capitulo: 3, modo: "verde" });
  const MK = { color: "FFFFFF", highlight: C.INK };
  d.t(s, [{ text: "O que muda entre as duas formas de aquisição " }, { text: " não é o valor do benefício fiscal ", options: MK }, { text: " — é " }, { text: " quando ele entra no caixa. ", options: MK }],
    1.3, 1.5, W - 2.6, 1.9, { fontFace: F.SEMI, fontSize: 32, color: C.INK, align: "center", valign: "middle", objectName: tag("Frase", "a", "ascend") });
  [["À vista", "R$ 7.924.948,92"], ["Locação · 120 meses", "R$ 164.766,07"], ["Parcela líquida*", "R$ 93.504,75"]].forEach(([k, v], i) => {
    const cw = (CW - 0.3) / 3, x = M + i * (cw + 0.15), hot = i === 2;
    s.addShape(d.pres.shapes.ROUNDED_RECTANGLE, { x, y: 4.3, w: cw, h: 1.45, rectRadius: 0.14, fill: { color: hot ? "FFFFFF" : C.INK }, line: { color: hot ? "FFFFFF" : C.INK, width: 0 }, objectName: tag("Opcao " + i, "c" + (i + 1), "ascend") });
    d.t(s, k, x + 0.3, 4.55, cw - 0.6, 0.3, { fontSize: 11, color: hot ? "17331A" : C.MUTED, objectName: tag("Opcao rot " + i, "c" + (i + 1), "fade", 200) });
    d.t(s, v, x + 0.3, 4.9, cw - 0.6, 0.7, { fontFace: F.HF, fontSize: 34, color: hot ? C.INK : "FFFFFF", valign: "middle", objectName: tag("Opcao val " + i, "c" + (i + 1), "fade", 300) });
  });

  // 9 · fecho (logo grande, sem o pequeno)
  s = d.slide(); await d.fundo(s, "fumaca"); d.cromo(s, { capitulo: 3, logo: false });
  s.addImage({ path: kit.ASSET("marca", "logo_white.png"), x: (W - 5.2) / 2, y: 2.55, w: 5.2, h: (5.2 * 386) / 1400, objectName: tag("Logo grande", "a", "zoom") });
  d.t(s, "#NOSSAENERGIATRANSFORMA", 0, 4.25, W, 0.4, { fontSize: 16, bold: true, color: C.G, align: "center", charSpacing: 6, objectName: tag("Hashtag", "a", "fade", 500) });

  await d.salvar(OUT);
  console.log("OK", d.n, "slides ->", OUT);
  console.log(d.relatorioAnim || "");
})().catch((e) => { console.error(e); process.exit(1); });
