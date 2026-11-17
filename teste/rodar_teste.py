"""rodar_teste.py — teste de ponta a ponta da skill pptx-igreen numa máquina (rode depois do instalador).

1. pré-requisitos (node, pacotes node da skill, lxml/Pillow, fontes)
2. gera o deck de teste (teste/build_teste.js) com o kit -> anim.py roda junto
3. valida a estrutura (validar.py) e confere o esperado: 9 slides, Morph em todos, animações, 8 barras 3D
4. Windows + PowerPoint: abre de verdade, confere a transição Morph (3954) em todos e exporta os 9 slides em PNG
5. confere pixels: slide verde é verde, slide escuro é escuro, barra de destaque 3D acesa
Gera RELATORIO_TESTE.md na pasta de saída. Saída 0 = aprovado.

Uso: python -I rodar_teste.py [pasta_saida]
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(SKILL, "scripts"))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

saida = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(tempfile.gettempdir(), "pptx-igreen-teste"))
if os.path.isdir(saida):
    shutil.rmtree(saida)
os.makedirs(saida)
deck = os.path.join(saida, "teste_pptx-igreen.pptx")
checks = []


def ok(nome, cond, detalhe=""):
    checks.append((nome, bool(cond), detalhe))
    print(("  OK   " if cond else "  FALHA ") + nome + (f" — {detalhe}" if detalhe else ""))
    return cond


print("1) pré-requisitos")
node = shutil.which("node")
ok("node instalado", node, subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip() if node else "")
for m in ("pptxgenjs", "sharp"):
    ok(f"pacote node {m}", os.path.isdir(os.path.join(SKILL, "scripts", "node_modules", m)))
for m in ("lxml", "PIL"):
    try:
        __import__(m)
        ok(f"python {m}", True)
    except ImportError:
        ok(f"python {m}", False, "pip install lxml pillow")
import validar  # noqa: E402  (precisa do lxml)

inst = validar.fontes_instaladas()
for f in ("Impact", "Montserrat", "Montserrat SemiBold", "Montserrat Light", "Geist Mono"):
    ok(f"fonte {f}", validar.fonte_ok(f, inst))

print("2) gera o deck de teste")
t0 = time.time()
r = subprocess.run([node, os.path.join(AQUI, "build_teste.js"), deck], capture_output=True, text=True, encoding="utf8", errors="replace",
                   env={**os.environ, "PPTX_IGREEN": SKILL})
ok("build_teste.js + anim.py", r.returncode == 0 and os.path.exists(deck), (r.stdout + r.stderr).strip().replace("\n", " · ")[:300])
if not os.path.exists(deck):
    sys.exit(1)
print(f"   ({time.time() - t0:.1f}s)")

print("3) estrutura")
v = validar.validar(deck)
rs = v["resumo"]
ok("sem erros de estrutura", not v["erros"], "; ".join(v["erros"])[:300])
ok("9 slides", rs["slides"] == 9, str(rs["slides"]))
ok("Morph em todos", rs["morph"] == 9, str(rs["morph"]))
ok("animações (≥60 objetos)", rs["animados"] >= 60, str(rs["animados"]))
ok("cliques (≥6)", rs["cliques"] >= 6, str(rs["cliques"]))
ok("8 barras em 3D nativo", rs["3d"] == 8, str(rs["3d"]))
ok("sem negrito sintético do Montserrat", not any("negrito" in a for a in v["avisos"]))
ok("todas as fontes do deck instaladas", not any("fontes usadas" in a for a in v["avisos"]), "; ".join(v["avisos"]))

pp = None
if sys.platform == "win32":
    print("4) PowerPoint")
    pasta_png = os.path.join(saida, "render")
    pp = validar.abrir_no_powerpoint(deck, pasta_png)
    erro = str(pp.get("erro", ""))
    if erro and ("PowerPoint.Application" in erro or "80040154" in erro or "class" in erro.lower()):
        ok("PowerPoint instalado", False, "sem PowerPoint: etapa visual pulada")
    else:
        ok("PowerPoint abre o deck", not erro, erro)
        txt = " ".join(pp.get("saida", []))
        ok("transição Morph (3954) em todos", txt.count("entry=3954") == 9, f"{txt.count('entry=3954')}/9")
        ok("9 PNGs exportados", pp.get("pngs") == 9, str(pp.get("pngs")))
        print("5) pixels")
        try:
            from PIL import Image

            def media(n, caixa):
                im = Image.open(os.path.join(pasta_png, f"s{n:02d}.png")).convert("RGB").crop(caixa).resize((1, 1))
                return im.getpixel((0, 0))
            g = media(8, (40, 40, 200, 200))
            ok("slide verde é verde", g[1] > 200 and g[0] < 90 and g[2] < 90, str(g))
            e = media(2, (1300, 40, 1580, 200))
            ok("slide escuro é escuro (textura)", max(e) < 90, str(e))
            b = media(4, (1440, 300, 1500, 600))
            ok("barra de destaque acesa (verde)", b[1] > 180 and b[0] < 120, str(b))
        except Exception as ex:  # noqa: BLE001
            ok("checagem de pixels", False, str(ex))
else:
    print("4) PowerPoint: só no Windows — abra o deck no PowerPoint/Keynote e confira à mão")

aprovado = all(c[1] for c in checks if not c[0].startswith("PowerPoint instalado"))
import platform  # noqa: E402
rel = ["# Teste da skill pptx-igreen", "", f"- Máquina: {platform.node()} · {platform.platform()}",
       f"- Data: {time.strftime('%d/%m/%Y %H:%M')}", f"- Deck: `{deck}`", f"- **Resultado: {'APROVADO' if aprovado else 'REPROVADO'}**", "",
       "| Checagem | | Detalhe |", "|---|---|---|"] + [f"| {n} | {'✅' if c else '❌'} | {d.replace('|', '/')} |" for n, c, d in checks]
rel += ["", "Resumo do validador:", "```", json.dumps(rs, ensure_ascii=False, indent=1), "```"]
if pp and pp.get("folhas"):
    rel += ["", "Folhas de contato: " + ", ".join(f"`render/{f}`" for f in pp["folhas"])]
open(os.path.join(saida, "RELATORIO_TESTE.md"), "w", encoding="utf8").write("\n".join(rel))
print("\nRESULTADO:", "APROVADO" if aprovado else "REPROVADO", "·", os.path.join(saida, "RELATORIO_TESTE.md"))
sys.exit(0 if aprovado else 1)
