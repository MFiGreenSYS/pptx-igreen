// novo_projeto.js — cria a pasta do deck no padrão da casa: DD-MM-AAAA_Nome (Regra 1), com build.js pronto,
// referencias\, assets\ e _historico\.
// Uso: node novo_projeto.js "Nome do Projeto" [pasta-mãe]
//   pasta-mãe padrão: D:\iGreen.SYS\10_Gerador-de-PPTX (se existir) ou a pasta atual.
const fs = require("fs");
const path = require("path");

const nome = process.argv[2];
if (!nome) { console.error('Uso: node novo_projeto.js "Nome do Projeto" [pasta-mãe]'); process.exit(2); }
const padrao = "D:/iGreen.SYS/10_Gerador-de-PPTX";
const mae = process.argv[3] || (fs.existsSync(padrao) ? padrao : process.cwd());
const h = new Date(), dd = String(h.getDate()).padStart(2, "0"), mm = String(h.getMonth() + 1).padStart(2, "0");
const slug = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pasta = path.join(mae, `${dd}-${mm}-${h.getFullYear()}_${slug}`);
if (fs.existsSync(pasta)) { console.error("Já existe: " + pasta); process.exit(1); }
for (const p of ["", "referencias", "assets", "_historico"]) fs.mkdirSync(path.join(pasta, p), { recursive: true });
const modelo = fs.readFileSync(path.join(__dirname, "modelo_build.js"), "utf8").replace(/__TITULO__/g, nome).replace(/__ARQUIVO__/g, nome);
fs.writeFileSync(path.join(pasta, "build.js"), modelo, "utf8");
console.log(pasta);
