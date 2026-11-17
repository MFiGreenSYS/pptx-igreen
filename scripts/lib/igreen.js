// Kit iGreen para PPTX (pptxgenjs) — tudo o que os decks aprovados usam, num lugar só.
// Origem: Live Connect (out/nov 2026), Desconto Social, Ganhos do Licenciado, Proposta BESS, Promoções Conexão Green.
//
//   const kit = require(path.join(os.homedir(), ".claude/skills/pptx-igreen/scripts/lib/igreen.js"));
//   const d = kit.novoDeck({ titulo: "Meu deck", capitulos: ["Introdução", "Ganhos"], total: 8 });
//   let s = d.slide(); d.fundo(s); d.cromo(s, { capitulo: 0 });
//   d.t(s, "TEXTO", 0.6, 1.2, 6, 1, { fontFace: d.F.HF, fontSize: 60, objectName: d.tag("Titulo", "a", "ascend") });
//   await d.salvar("Meu deck.pptx");   // grava, aplica o tema, roda o anim.py (Morph, animações, 3D, mídias únicas)
//
// Convenções que o anim.py lê no nome do objeto (objectName):
//   "Nome [a|ascend|0]"  entra sozinho ao abrir o slide (atraso em ms)  ·  "Nome [c2|fade|300]" entra no 2º clique
//   efeitos: ascend wipe wipeup fly zoom fade wheel play(vídeo)
//   "!!nome"   = par do Morph entre slides (mesmo nome em dois slides = o objeto viaja)
//   "Nome#3d" / "Nome#3d-top" = extrusão 3D nativa do PowerPoint (editável); -top = destaque verde
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const { applyTheme } = require("./apply_theme.js");

const RAIZ = path.resolve(__dirname, "../..");
const ASSET = (...p) => path.join(RAIZ, "assets", ...p);
const GERADOS = path.join(os.homedir(), ".cache", "pptx-igreen");

// ------------------------------------------------------------------ identidade
const C = {
  G: "18FF00",      // verde iGreen (o único acento)
  BG: "030604",     // preto da marca
  INK: "0A0F0B",    // texto escuro sobre verde/branco
  MUTED: "9DB0A2",  // rótulos sobre escuro
  SOFT: "D7DED9",   // texto corrido sobre escuro
  LINE: "22352A",   // fio fino sobre escuro
  VIDRO: "0A140C",  // corpo dos cartões de vidro
  VERDE_ESCURO: "0E2412",
  GD: "0B8F24",     // verde legível sobre claro (só se um slide claro for pedido)
};
const F = {
  HF: "Impact",                 // títulos e números
  BF: "Montserrat",             // texto
  SEMI: "Montserrat SemiBold",  // "negrito" (bold do Montserrat sai itálico em máquina com só Regular + Bold Italic)
  LIGHT: "Montserrat Light",
  MONO: "Geist Mono",           // fichas técnicas e rótulos
};
const TEMA = { name: "iGreen", headFontFace: F.HF, bodyFontFace: F.BF,
  colors: { dk1: C.BG, lt1: "FFFFFF", dk2: "0A130D", lt2: "EEF2EF", accent1: C.G, accent2: "0FA80A", accent3: C.MUTED, accent4: "5E6E62", accent5: "B6FF9E", accent6: "FFC83D", hlink: C.G, folHlink: "B6FF9E" } };

const tag = (name, step, eff = "fade", delay = 0) => `${name} [${step}|${eff}|${delay}]`;
const tamanhos = {};
async function tamanho(f) {
  if (!tamanhos[f]) { const m = await sharp(f).metadata(); tamanhos[f] = [m.width, m.height]; }
  return tamanhos[f];
}

// ------------------------------------------------------------------ gráficos gerados (SVG -> PNG), em cache
async function png(nome, svg) {
  fs.mkdirSync(GERADOS, { recursive: true });
  const f = path.join(GERADOS, nome);
  if (!fs.existsSync(f)) await sharp(Buffer.from(svg)).png().toFile(f);
  return f;
}
const graficos = {
  // cartão de vidro neon (luz verde saindo de baixo); proporção 1100x1000
  vidro: () => png("vidro_1100x1000.png", `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="1000"><defs>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101712"/><stop offset=".55" stop-color="#0b1a0e"/><stop offset="1" stop-color="#0d4a12"/></linearGradient>
    <radialGradient id="light" cx=".5" cy="1" r=".75"><stop offset="0" stop-color="#18FF00" stop-opacity=".95"/><stop offset=".35" stop-color="#18FF00" stop-opacity=".35"/><stop offset="1" stop-color="#18FF00" stop-opacity="0"/></radialGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".6" stop-color="#ffffff" stop-opacity=".06"/><stop offset="1" stop-color="#7CFF6A" stop-opacity=".9"/></linearGradient>
    <filter id="b40"><feGaussianBlur stdDeviation="40"/></filter><filter id="b12"><feGaussianBlur stdDeviation="12"/></filter>
    <clipPath id="c"><rect x="60" y="40" width="980" height="840" rx="100"/></clipPath></defs>
    <ellipse cx="550" cy="890" rx="462" ry="70" fill="#18FF00" opacity=".55" filter="url(#b40)"/>
    <rect x="60" y="40" width="980" height="840" rx="100" fill="url(#body)"/>
    <g clip-path="url(#c)"><rect x="0" y="300" width="1100" height="1000" fill="url(#light)"/><ellipse cx="550" cy="880" rx="396" ry="60" fill="#B6FF9E" opacity=".55" filter="url(#b12)"/></g>
    <rect x="61.5" y="41.5" width="977" height="837" rx="98" fill="none" stroke="url(#edge)" stroke-width="3"/></svg>`),
  // mostrador: trilho com 100 marcas (grandes a cada `cada`) e arco de `pct` (0..1) do topo, horário
  trilho: (cada = 10) => {
    const R = 900, c = R / 2, r = 340;
    const ticks = [...Array(100)].map((_, i) => {
      const a = (i / 100) * Math.PI * 2 - Math.PI / 2, big = i % cada === 0, r1 = 392, r2 = big ? 430 : 410;
      return `<line x1="${c + r1 * Math.cos(a)}" y1="${c + r1 * Math.sin(a)}" x2="${c + r2 * Math.cos(a)}" y2="${c + r2 * Math.sin(a)}" stroke="#${big ? "B6C9BA" : "4A5A4E"}" stroke-width="${big ? 4 : 2}"/>`;
    }).join("");
    return png(`trilho_${cada}.png`, `<svg xmlns="http://www.w3.org/2000/svg" width="${R}" height="${R}"><circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#16231A" stroke-width="46"/>${ticks}<circle cx="${c}" cy="${c}" r="${r - 70}" fill="#050906" stroke="#1E2E22" stroke-width="2"/></svg>`);
  },
  arco: (pct) => {
    const R = 900, c = R / 2, r = 340, a1 = pct * Math.PI * 2 - Math.PI / 2, ex = c + r * Math.cos(a1), ey = c + r * Math.sin(a1);
    const d = `M ${c} ${c - r} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    return png(`arco_${Math.round(pct * 1000)}.png`, `<svg xmlns="http://www.w3.org/2000/svg" width="${R}" height="${R}"><defs><filter id="g"><feGaussianBlur stdDeviation="16"/></filter></defs>
      <path d="${d}" fill="none" stroke="#18FF00" stroke-width="60" stroke-linecap="round" opacity=".55" filter="url(#g)"/><path d="${d}" fill="none" stroke="#18FF00" stroke-width="46" stroke-linecap="round"/><circle cx="${ex}" cy="${ey}" r="30" fill="#E9FFE3"/></svg>`);
  },
  // véu horizontal: texto legível à esquerda, foto/vídeo aparecendo à direita
  veuEsquerda: () => png("veu_esquerda.png", `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs>
    <linearGradient id="h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#030604"/><stop offset=".38" stop-color="#030604" stop-opacity=".9"/><stop offset=".65" stop-color="#030604" stop-opacity=".35"/><stop offset="1" stop-color="#030604" stop-opacity=".1"/></linearGradient>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset=".7" stop-color="#030604" stop-opacity="0"/><stop offset="1" stop-color="#030604" stop-opacity=".85"/></linearGradient></defs>
    <rect width="1920" height="1080" fill="url(#h)"/><rect width="1920" height="1080" fill="url(#v)"/></svg>`),
  // véu de base: escurece a faixa de baixo (barra de capítulos e notas legíveis sobre a textura)
  veuBase: () => png("veu_base.png", `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="300"><defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030604" stop-opacity="0"/><stop offset=".55" stop-color="#030604" stop-opacity=".7"/><stop offset="1" stop-color="#030604" stop-opacity=".95"/></linearGradient></defs>
    <rect width="1920" height="300" fill="url(#v)"/></svg>`),
  // painel da sanfona: limpo em cima, escuro embaixo
  veuPainel: () => png("veu_painel.png", `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="600"><defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030604" stop-opacity=".12"/><stop offset=".28" stop-color="#030604" stop-opacity=".05"/><stop offset=".45" stop-color="#030604" stop-opacity=".55"/><stop offset=".62" stop-color="#030604" stop-opacity=".88"/><stop offset="1" stop-color="#030604" stop-opacity=".97"/></linearGradient></defs>
    <rect width="120" height="600" fill="url(#v)"/></svg>`),
};

// mapa do Brasil por estado: só os `ativos` em verde, com a sigla; contorno preto sem brilho (aprovado 07/11/2026)
async function mapaEstados(ativos, saida, { escala = 6 } = {}) {
  const svg = fs.readFileSync(ASSET("mapa", "mapa-brasil-27-estados.svg"), "utf8");
  const shapes = [...svg.matchAll(/<(path|polygon)\b[^>]*id="sm-([A-Z]{2})"[^>]*>/g)].map((m) => {
    const t0 = m[0];
    const geom = m[1] === "path" ? `d="${t0.match(/\sd="([^"]+)"/)[1]}"` : `points="${t0.match(/points="([^"]+)"/)[1]}"`;
    return { el: m[1], uf: m[2], geom };
  });
  const VB = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const Wp = Math.round(VB[2] * escala), Hp = Math.round(VB[3] * escala);
  const corpo = shapes.map(({ el, uf, geom }) => {
    const on = ativos.includes(uf);
    return `<${el} ${geom} fill="${on ? "#18FF00" : "#16241A"}" fill-opacity="${on ? 0.92 : 1}" stroke="#000000" stroke-width="0.6" stroke-linejoin="round"/>`;
  }).join("");
  const rot = [];
  for (const { el, uf, geom } of shapes) {
    if (!ativos.includes(uf)) continue;
    const one = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wp / 2}" height="${Hp / 2}" viewBox="${VB.join(" ")}"><${el} ${geom} fill="#fff"/></svg>`;
    const { data, info } = await sharp(Buffer.from(one)).greyscale().raw().toBuffer({ resolveWithObject: true });
    let sx = 0, sy = 0, n = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[y * info.width + x] > 128) { sx += x; sy += y; n++; }
    const cx = (sx / n / info.width) * VB[2] + VB[0], cy = (sy / n / info.height) * VB[3] + VB[1];
    const ajuste = { RJ: [3, 3], ES: [4, 0], AL: [5, 1], PE: [4, 0], RN: [3, -1], SE: [4, 2], GO: [-2, 0] }[uf] || [0, 0];
    const pequeno = ["RJ", "ES", "AL", "PE", "RN", "SE", "PB", "DF"].includes(uf);
    rot.push(`<text x="${cx + ajuste[0]}" y="${cy + ajuste[1]}" text-anchor="middle" dominant-baseline="central" font-family="Montserrat, Arial" font-weight="700" font-size="${pequeno ? 6 : 9}" fill="#030604">${uf}</text>`);
  }
  const full = `<svg xmlns="http://www.w3.org/2000/svg" width="${Wp}" height="${Hp}" viewBox="${VB.join(" ")}">${corpo}${rot.join("")}</svg>`;
  fs.mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
  await sharp(Buffer.from(full)).png().toFile(saida);
  return saida;
}

// ------------------------------------------------------------------ deck
function novoDeck({ titulo = "iGreen", empresa = "iGreen Energy", capitulos = [], total = 10, tema = {} } = {}) {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.theme = { headFontFace: F.HF, bodyFontFace: F.BF };
  pres.title = titulo;
  pres.company = empresa;
  const W = 13.333, H = 7.5, M = 0.6, CW = W - 2 * M;
  let n = 0;

  const d = { pres, W, H, M, CW, C, F, tag, ASSET, graficos, mapaEstados, get n() { return n; } };

  d.slide = () => { n++; return pres.addSlide(); };

  // texto: negrito do Montserrat vira a face SemiBold (nunca bold sintético)
  d.t = (s, text, x, y, w, h, o = {}) => {
    const opts = { x, y, w, h, margin: 0, fontFace: F.BF, fontSize: 14, color: "FFFFFF", valign: "top", isTextBox: true, ...o };
    const fix = (r) => { if (r && r.bold && (r.fontFace || opts.fontFace) === F.BF) { r.fontFace = F.SEMI; r.bold = false; } };
    fix(opts);
    if (Array.isArray(text)) text.forEach((r) => r.options && fix(r.options));
    s.addText(text, opts);
  };

  d.foto = async (s, f, x, y, w, h, o = {}) => {
    const [nw, nh] = await tamanho(f);
    if (h == null) h = (w * nh) / nw;
    if (w == null) w = (h * nw) / nh;
    s.addImage({ path: f, x, y, w, h, ...o });
    return { x, y, w, h };
  };
  // foto cortada para preencher a caixa (cover)
  d.cobrir = async (s, f, x, y, w, h, o = {}) => {
    const [nw, nh] = await tamanho(f);
    s.addImage({ path: f, x, y, w: 10, h: (10 * nh) / nw, sizing: { type: "cover", w, h }, ...o });
  };
  // vídeo mudo em loop (o anim.py põe autoplay); capa = um quadro jpg do próprio vídeo
  d.video = async (s, mp4, capaJpg, x, y, w, h, objectName) => {
    const b64 = "data:image/jpeg;base64," + (await sharp(capaJpg).jpeg({ quality: 82 }).toBuffer()).toString("base64");
    s.addMedia({ type: "video", path: mp4, x, y, w, h, cover: b64, objectName });
  };

  // fundo: "escuro" = textura da marca (nunca preto chapado) · "verde" = verde cheio · "fumaca" (capa/fecho)
  //        "cg1"/"cg2" = fundos da Conexão Green · { transp } apaga a textura onde houver muito texto pequeno
  d.fundo = async (s, tipo = "escuro", { transp = 0, veuBase = true } = {}) => {
    if (tipo === "verde") { s.background = { color: C.G }; return; }
    s.background = { color: C.BG };
    const arq = { escuro: "bg_malha.jpg", fumaca: "bg_fumaca.jpg", cg1: "cg_bg1.jpg", cg2: "cg_bg2.jpg" }[tipo];
    if (!arq) return;
    s.addImage({ path: ASSET("fundos", arq), x: 0, y: 0, w: W, h: H, transparency: transp, objectName: tipo === "escuro" ? "!!textura" : "!!fundo" });
    if (tipo.startsWith("cg")) s.addImage({ path: ASSET("brilhos", "glow_brilho_topo.png"), x: -1.5, y: -1.6, w: 9, h: 4.5, objectName: "!!brilho-topo" });
    if (veuBase && tipo === "escuro") s.addImage({ path: await graficos.veuBase(), x: 0, y: 5.4, w: W, h: 2.1, objectName: "!!veu-base" });
  };

  // logo (oficial, Regra 4) + barra de capítulos com fio verde que cresce (Morph)
  // modo: "escuro" | "verde" | "claro"; logo:false na capa final (logo repetido no slide é proibido)
  d.cromo = (s, { capitulo = null, modo = "escuro", logo = true, submarca = null, barra = capitulos.length > 0 } = {}) => {
    const claro = modo !== "escuro";
    if (logo) {
      s.addImage({ path: ASSET("marca", claro ? "logo_dark.png" : "logo_white.png"), x: M, y: 0.42, w: submarca ? 1.45 : 1.2, h: ((submarca ? 1.45 : 1.2) * 386) / 1400, objectName: "!!logo" });
      if (submarca) d.t(s, submarca, M + 0.15, 0.82, 1.3, 0.2, { fontSize: 8.5, bold: true, align: "right", color: claro ? C.INK : "FFFFFF", objectName: "!!submarca" });
    }
    if (!barra) return;
    const y = 7.0, x0 = M, x1 = W - M, seg = (x1 - x0) / capitulos.length;
    s.addShape(pres.shapes.LINE, { x: x0, y, w: x1 - x0, h: 0, line: { color: claro ? "0A0F0B" : "253229", width: 0.75, transparency: claro ? 75 : 0 }, objectName: "!!rail" });
    const fill = modo === "verde" ? C.INK : C.G;
    s.addShape(pres.shapes.RECTANGLE, { x: x0, y: y - 0.012, w: Math.max(0.05, ((x1 - x0) * n) / total), h: 0.024, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: "!!rail-fill" });
    capitulos.forEach((cap, i) => d.t(s, cap.toUpperCase(), x0 + i * seg, y + 0.1, seg, 0.2, { fontSize: 7, charSpacing: 2, bold: i === capitulo,
      color: i === capitulo ? (modo === "escuro" ? C.G : C.INK) : modo === "verde" ? "0A4A10" : claro ? "8A968C" : "56655A", objectName: `!!cap-${i}` }));
  };

  d.kicker = (s, text, x, y, { cor = C.G, passo = "a", w = 7, atraso = 0 } = {}) =>
    d.t(s, text.toUpperCase(), x, y, w, 0.25, { fontSize: 10, bold: true, color: cor, charSpacing: 4, objectName: tag("Kicker", passo, "fade", atraso) });

  // cabeçalho de capítulo: número mono + kicker + título Impact (última linha em verde)
  d.cabecalho = (s, num, kick, linhas, { cor = "FFFFFF", acento = C.G, tamanho: sz = 54, w = 8, y = 1.15, kw = 5.5, nome = "Titulo" } = {}) => {
    if (num) d.t(s, num, M, y, 0.6, 0.3, { fontFace: F.MONO, fontSize: 12, color: acento, objectName: tag("Numero cap", "a", "fade") });
    d.kicker(s, kick, M + (num ? 0.55 : 0), y + 0.03, { cor: acento, w: kw });
    const h = (linhas.length * sz * 0.9) / 72 + 0.1;
    d.t(s, linhas.map((l, i) => ({ text: l, options: { color: i === linhas.length - 1 ? acento : cor, breakLine: i < linhas.length - 1 } })),
      M, y + 0.35, w, h, { fontFace: F.HF, fontSize: sz, lineSpacingMultiple: 0.86, objectName: nome.startsWith("!!") ? nome : tag(nome, "a", "ascend") });
    return y + 0.35 + h;
  };

  d.nota = (s, text, { y = 6.6, w = CW, x = M, cor = "6F7E73" } = {}) =>
    d.t(s, text, x, y, w, 0.32, { fontSize: 8, color: cor, valign: "bottom", objectName: tag("Nota", "a", "fade", 900) });

  // cartão de vidro (forma nativa) · quente = verde cheio com brilho suave atrás
  d.vidro = (s, x, y, w, h, nome, passo = "a", atraso = 0, { quente = false, efeito = "zoom" } = {}) => {
    if (quente) s.addImage({ path: ASSET("brilhos", "glow_brilho_topo.png"), x: x - w * 0.1, y: y - h * 0.45, w: w * 1.2, h: h * 0.9, transparency: 15, objectName: tag(nome + " brilho", passo, "fade", atraso + 200) });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.14, fill: { color: quente ? C.G : C.VIDRO, transparency: quente ? 0 : 15 },
      line: { color: C.G, transparency: quente ? 0 : 65, width: 0.75 }, objectName: tag(nome, passo, efeito, atraso) });
  };
  d.bloco = (s, x, y, w, h, nome, passo = "a", atraso = 0, efeito = "wipe") =>
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.G }, line: { color: C.G, width: 0 }, objectName: tag(nome, passo, efeito, atraso) });

  // ícone redondo: nome = ic_<nome>_{g,k,w}.png (g verde, k preto, w branco)
  d.icone = (s, nome, x, y, diam, { cheio = false, passo = "a", atraso = 0 } = {}) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: diam, h: diam, fill: { color: cheio ? C.INK : "0A1A0C" }, line: { color: cheio ? C.INK : C.G, transparency: cheio ? 0 : 35, width: 0.75 }, objectName: tag("Icone fundo " + nome, passo, "zoom", atraso) });
    const k = diam * 0.5;
    s.addImage({ path: ASSET("icones", `ic_${nome}_g.png`), x: x + (diam - k) / 2, y: y + (diam - k) / 2, w: k, h: k, objectName: tag("Icone " + nome, passo, "zoom", atraso + 50) });
  };

  d.pilula = (s, texto, x, y, { w, cheia = false, passo = "a", atraso = 0, tam = 10, cor = C.G } = {}) => {
    w = w || texto.length * tam * 0.0105 + 0.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.4, rectRadius: 0.2, fill: { color: cheia ? cor : C.BG, transparency: cheia ? 0 : 100 }, line: { color: cor, width: 1 }, objectName: tag("Pill " + texto, passo, "fade", atraso) });
    d.t(s, texto, x, y, w, 0.4, { fontSize: tam, bold: true, charSpacing: 2, color: cheia ? C.INK : cor, align: "center", valign: "middle", objectName: tag("Pill txt " + texto, passo, "fade", atraso) });
    return w;
  };

  // linha de ficha técnica: rótulo mono à esquerda, valor à direita, fio fino embaixo
  d.ficha = (s, k, v, x, y, w, { passo = "a", atraso = 0, vtam = 14, kw = 0.45 } = {}) => {
    s.addShape(pres.shapes.LINE, { x, y: y + 0.44, w, h: 0, line: { color: C.LINE, width: 0.75 }, objectName: tag("Fio " + k, passo, "wipe", atraso) });
    d.t(s, k.toUpperCase(), x, y + 0.1, w * kw, 0.3, { fontFace: F.MONO, fontSize: 9.5, color: C.MUTED, charSpacing: 1, valign: "middle", objectName: tag("Rot " + k, passo, "fade", atraso + 100) });
    d.t(s, v, x + w * kw, y + 0.05, w * (1 - kw), 0.36, { fontFace: F.SEMI, fontSize: vtam, align: "right", valign: "middle", objectName: tag("Val " + k, passo, "fade", atraso + 180) });
  };

  // mostrador (anel que enche no sentido horário com o efeito Roda) com número no centro
  d.mostrador = async (s, x, y, diam, pct, numero, rotulo, sub, { passo = "c1", cada = 10 } = {}) => {
    s.addImage({ path: await graficos.trilho(cada), x, y, w: diam, h: diam, objectName: tag("Mostrador", "a", "zoom", 300) });
    s.addImage({ path: await graficos.arco(pct), x, y, w: diam, h: diam, objectName: tag("Arco", passo, "wheel") });
    d.t(s, numero, x, y + diam / 2 - diam * 0.2, diam, diam * 0.27, { fontFace: F.LIGHT, fontSize: diam * 21, align: "center", valign: "middle", objectName: tag("Mostrador num", passo, "zoom", 400) });
    if (rotulo) d.t(s, rotulo.toUpperCase(), x, y + diam / 2 + diam * 0.09, diam, 0.25, { fontFace: F.MONO, fontSize: 9, color: C.G, align: "center", charSpacing: 3, objectName: tag("Mostrador rot", passo, "fade", 600) });
    if (sub) d.t(s, sub, x, y + diam / 2 + diam * 0.16, diam, 0.25, { fontSize: 9.5, color: C.MUTED, align: "center", objectName: tag("Mostrador sub", passo, "fade", 700) });
  };

  // cartão de vidro neon com número grande (dinâmica "vidro neon")
  d.vidroNeon = async (s, x, y, w, rotulo, numero, sub, { passo = "c1", pilula = null } = {}) => {
    const h = (w * 1000) / 1100, ix = x + w * (60 / 1100), iw = w * (980 / 1100);
    s.addImage({ path: await graficos.vidro(), x, y, w, h, objectName: tag("Cartao de vidro", "a", "fade", 300) });
    d.t(s, rotulo, ix + 0.45, y + 0.6, iw - 0.9, 0.3, { fontSize: 12.5, color: "C9D6CD", objectName: tag("Card rot", "a", "fade", 600) });
    if (pilula) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: ix + 0.45, y: y + 1.0, w: 1.45, h: 0.38, rectRadius: 0.19, fill: { color: "FFFFFF", transparency: 92 }, line: { color: "FFFFFF", transparency: 80, width: 0.75 }, objectName: tag("Card pill", "a", "fade", 650) });
      d.t(s, pilula, ix + 0.45, y + 1.0, 1.45, 0.38, { fontSize: 10, color: "E6EEE8", align: "center", valign: "middle", objectName: tag("Card pill txt", "a", "fade", 650) });
    }
    d.t(s, numero, ix, y + h * 0.36, iw, h * 0.22, { fontFace: F.SEMI, fontSize: Math.min(70, (iw * 72) / (numero.length * 0.62)), align: "center", valign: "middle", objectName: tag("Numero", passo, "zoom") });
    if (sub) d.t(s, sub, ix + 0.4, y + h * 0.6, iw - 0.8, 0.5, { fontSize: 11, color: "D7FFD0", align: "center", objectName: tag("Numero sub", passo, "fade", 300) });
  };

  // barras/degraus em 3D nativo (editável): itens = [{ valor, rotulo, sub, destaque }]; alturas lineares em `altura`
  d.barras3d = (s, itens, { x0, x1, base, hMin = 1.2, hMax = 4.5, gap = 0.17, passo = "a", cascata = 240, proporcional = false, rotuloTam = 20 }) => {
    const n2 = itens.length, sw = (x1 - x0 - gap * (n2 - 1)) / n2, maxv = Math.max(...itens.map((it) => it.peso || 1));
    itens.forEach((it, i) => {
      const h = proporcional ? hMin + ((it.peso || 1) / maxv) * (hMax - hMin) : hMin + (i * (hMax - hMin)) / Math.max(1, n2 - 1);
      const x = x0 + i * (sw + gap), y = base - h, top = !!it.destaque, at = 300 + i * cascata;
      s.addShape(pres.shapes.RECTANGLE, { x, y, w: sw, h, fill: { color: top ? C.G : C.VERDE_ESCURO }, line: { color: top ? C.G : "2B6B33", width: 0.75 }, objectName: tag(`Barra ${i + 1}#3d${top ? "-top" : ""}`, passo, "wipeup", at) });
      if (it.acima) d.t(s, it.acima, x, y + 0.14, sw, 0.22, { fontSize: 9, bold: true, color: top ? C.INK : C.MUTED, align: "center", objectName: tag("Barra acima " + i, passo, "fade", at + 200) });
      d.t(s, it.rotulo, x - 0.05, y + 0.32, sw + 0.1, 0.5, { fontFace: F.HF, fontSize: rotuloTam, color: top ? C.INK : "FFFFFF", align: "center", valign: "middle", objectName: tag("Barra rot " + i, passo, top ? "zoom" : "ascend", at + 200) });
      if (it.sub) d.t(s, it.sub, x, base - 0.62, sw, 0.32, { fontFace: F.HF, fontSize: 18, color: top ? C.INK : C.G, align: "center", objectName: tag("Barra sub " + i, passo, "fade", at + 250) });
      if (it.sub2) d.t(s, it.sub2, x, base - 0.32, sw, 0.22, { fontSize: 8.5, color: top ? "17331A" : C.MUTED, align: "center", objectName: tag("Barra sub2 " + i, passo, "fade", at + 250) });
    });
  };

  // mockup de iPhone com print (tela 912x1972 dentro da moldura 1024x2060)
  d.iphone = (s, telaPng, x, y, w, { passo = "c1", nome = "Print 1" } = {}) => {
    const h = (w * 2060) / 1024;
    s.addImage({ path: ASSET("brilhos", "glow_piso.png"), x: x - 0.5, y: y + h - 0.5, w: w + 1.0, h: 0.8, objectName: tag("Piso " + nome, passo, "fade") });
    s.addImage({ path: ASSET("mockups", "iphone_frame.png"), x, y, w, h, objectName: tag("Moldura " + nome, passo, "ascend") });
    s.addImage({ path: telaPng, x: x + (w * 56) / 1024, y: y + (h * 44) / 2060, w: (w * 912) / 1024, h: (h * 1972) / 2060, objectName: tag(nome, passo, "ascend") });
  };

  // rodapé com mapa pequeno + estados em pílulas + aviso de regras
  d.rodapeEstados = async (s, ufs, mapaPng, { rotulo = "ESTADOS PARTICIPANTES", aviso = "Consulte regras e condições em seu material de apoio." } = {}) => {
    const y = 6.3;
    if (ufs && ufs.length) {
      const [mw, mh] = await tamanho(mapaPng), hh = 0.78, x0 = M + (hh * mw) / mh + 0.2;
      s.addImage({ path: mapaPng, x: M, y: y - 0.1, w: (hh * mw) / mh, h: hh, objectName: "!!mapa" });
      d.t(s, rotulo, x0, y, 6, 0.2, { fontFace: F.MONO, fontSize: 8.5, color: C.MUTED, charSpacing: 2, objectName: "!!estados-rot" });
      ufs.forEach((uf, i) => {
        const x = x0 + i * 0.62;
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: y + 0.27, w: 0.54, h: 0.32, rectRadius: 0.16, fill: { color: C.G }, line: { color: C.G, width: 0 }, objectName: `!!uf-${uf}` });
        d.t(s, uf, x, y + 0.27, 0.54, 0.32, { fontSize: 9.5, bold: true, color: C.INK, align: "center", valign: "middle", objectName: `!!uf-txt-${uf}` });
      });
    }
    if (aviso) d.t(s, aviso, W - M - 4.6, y + 0.27, 4.6, 0.32, { fontSize: 9.5, color: C.SOFT, align: "right", valign: "middle", objectName: "!!aviso" });
  };

  // grava + tema + anim.py (Morph em todos, animações das etiquetas, 3D, vídeos, ids únicos, mídias únicas)
  d.salvar = async (arquivo, { animar = true, temaNome = titulo } = {}) => {
    const out = path.resolve(arquivo);
    await pres.writeFile({ fileName: out });
    await applyTheme(out, { ...TEMA, ...tema, name: temaNome });
    if (animar) {
      const py = process.platform === "win32" ? "python" : "python3";
      const r = spawnSync(py, ["-I", path.join(RAIZ, "scripts", "anim.py"), out], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
      if (r.status !== 0) throw new Error("anim.py falhou: " + (r.stderr || r.stdout || r.error));
      d.relatorioAnim = (r.stdout || "").trim();
    }
    return out;
  };
  return d;
}

module.exports = { novoDeck, mapaEstados, graficos, C, F, TEMA, tag, ASSET, RAIZ };
