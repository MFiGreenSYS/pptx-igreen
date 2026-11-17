"""validar.py — confere um PPTX gerado pelo kit iGreen antes de entregar.

Erros (saída 1): zip quebrado, pasta dentro do zip, XML inválido, extensão sem Content-Type, alvo de .rels que não
existe, id de objeto repetido no slide, animação apontando para objeto que não existe.
Avisos: mídia órfã, fonte usada que não está instalada, Montserrat com negrito sintético (sai itálico em muita máquina).
Resumo: slides, Morph, objetos animados, cliques, 3D, vídeos, fontes.

  python -I validar.py "deck.pptx"                 # estrutura
  python -I validar.py "deck.pptx" --abrir pasta   # + abre no PowerPoint (Windows) e exporta cada slide em PNG + folha
"""
import json
import os
import re
import subprocess
import sys
import zipfile
from xml.dom import minidom  # noqa: F401  (só para garantir que o parser padrão existe)

from lxml import etree

AQUI = os.path.dirname(os.path.abspath(__file__))


def fontes_instaladas():
    nomes = set()
    pastas = []
    if sys.platform == "win32":
        pastas = [os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts"),
                  os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Windows", "Fonts")]
    elif sys.platform == "darwin":
        pastas = ["/Library/Fonts", "/System/Library/Fonts", "/System/Library/Fonts/Supplemental", os.path.expanduser("~/Library/Fonts")]
    else:
        pastas = ["/usr/share/fonts", os.path.expanduser("~/.local/share/fonts"), os.path.expanduser("~/.fonts")]
    for p in pastas:
        for raiz, _, arqs in os.walk(p):
            for a in arqs:
                nomes.add(re.sub(r"[^a-z]", "", os.path.splitext(a)[0].lower()))
    return nomes


def fonte_ok(face, instaladas):
    chave = re.sub(r"[^a-z]", "", face.lower())
    return any(n.startswith(chave) or chave.startswith(n) and len(n) > 4 for n in instaladas)


def validar(caminho):
    erros, avisos = [], []
    resumo = {"arquivo": caminho}
    try:
        z = zipfile.ZipFile(caminho)
    except Exception as e:
        return {"erros": [f"não abre como zip: {e}"], "avisos": [], "resumo": resumo}
    nomes = z.namelist()
    if len(nomes) != len(set(nomes)):
        erros.append("nomes repetidos dentro do zip")
    pastas = [n for n in nomes if n.endswith("/")]
    if pastas:
        erros.append(f"{len(pastas)} entradas de pasta no zip (o PowerPoint reclama): {pastas[:3]}")
    ct = z.read("[Content_Types].xml").decode("utf8")
    exts = set(re.findall(r'Extension="([^"]+)"', ct))
    overrides = set(re.findall(r'PartName="([^"]+)"', ct))
    for n in nomes:
        if n.endswith("/") or n == "[Content_Types].xml":
            continue
        ext = n.rsplit(".", 1)[-1].lower()
        if ext not in {e.lower() for e in exts} and "/" + n not in overrides:
            erros.append(f"sem Content-Type: {n}")
        if n.endswith((".xml", ".rels")):
            try:
                etree.fromstring(z.read(n))
            except Exception as e:
                erros.append(f"XML inválido em {n}: {e}")
    # rels: alvos internos existem
    usados = set()
    for n in nomes:
        if not n.endswith(".rels"):
            continue
        base = os.path.dirname(os.path.dirname(n))
        for alvo, modo in re.findall(r'Target="([^"]+)"(?:[^>]*TargetMode="([^"]+)")?', z.read(n).decode("utf8")):
            if modo == "External" or alvo.startswith("http"):
                continue
            p = os.path.normpath(os.path.join(base, alvo)).replace("\\", "/").lstrip("/") if not alvo.startswith("/") else alvo.lstrip("/")
            usados.add(p)
            if p not in nomes:
                erros.append(f"{n} aponta para {alvo}, que não existe")
    orfas = [n for n in nomes if n.startswith("ppt/media/") and n not in usados]
    if orfas:
        avisos.append(f"{len(orfas)} mídias sem uso: {orfas[:3]}")
    # slides
    pres = z.read("ppt/presentation.xml").decode("utf8")
    rels = z.read("ppt/_rels/presentation.xml.rels").decode("utf8")
    rmap = {re.search(r'Id="([^"]+)"', m).group(1): re.search(r'Target="([^"]+)"', m).group(1) for m in re.findall(r"<Relationship [^>]*>", rels)}
    ordem = ["ppt/" + rmap[r].lstrip("/").replace("ppt/", "") for r in re.findall(r'<p:sldId [^>]*r:id="(rId\d+)"', pres)]
    morph = anim = cliques = tres_d = videos = 0
    faces = {}
    negrito_montserrat = 0
    for i, f in enumerate(ordem, 1):
        x = z.read(f).decode("utf8")
        ids = re.findall(r'<p:cNvPr id="(\d+)"', x)
        rep = {k for k in ids if ids.count(k) > 1}
        if rep:
            erros.append(f"slide {i}: ids de objeto repetidos {sorted(rep)[:5]} (o PowerPoint recusa abrir com animação)")
        alvos = set(re.findall(r'<p:spTgt spid="(\d+)"', x))
        faltam = alvos - set(ids)
        if faltam:
            erros.append(f"slide {i}: animação aponta para objetos inexistentes {sorted(faltam)[:5]}")
        morph += "p159:morph" in x
        anim += len(re.findall(r'presetClass="entr"', x))
        cliques += len(re.findall(r'nodeType="clickEffect"', x))
        tres_d += len(re.findall(r"<a:sp3d\b", x))
        videos += len(re.findall(r"<a:videoFile\b", x))
        for face in re.findall(r'<a:latin typeface="([^"]+)"', x):
            faces[face] = faces.get(face, 0) + 1
        negrito_montserrat += len(re.findall(r'<a:rPr[^>]*\bb="1"[^>]*>(?:(?!</a:rPr>).)*?typeface="Montserrat"', x, re.S))
    if negrito_montserrat:
        avisos.append(f"{negrito_montserrat} trechos em Montserrat com negrito sintético (use a face Montserrat SemiBold)")
    inst = fontes_instaladas()
    faltando = [f for f in faces if not fonte_ok(f, inst)]
    if faltando:
        avisos.append(f"fontes usadas e não instaladas nesta máquina: {faltando} (rode o instalador da skill)")
    resumo.update({"slides": len(ordem), "morph": morph, "animados": anim, "cliques": cliques, "3d": tres_d, "videos": videos,
                   "fontes": faces, "mb": round(os.path.getsize(caminho) / 1e6, 2)})
    return {"erros": erros, "avisos": avisos, "resumo": resumo}


def abrir_no_powerpoint(caminho, pasta):
    """Windows + PowerPoint: abre de verdade, conta slides, confere a transição e exporta PNG de cada slide."""
    if sys.platform != "win32":
        return {"pulado": "só no Windows com PowerPoint"}
    os.makedirs(pasta, exist_ok=True)
    r = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", os.path.join(AQUI, "render.ps1"),
                        os.path.abspath(caminho), os.path.abspath(pasta)], capture_output=True, text=True, encoding="utf8", errors="replace")
    if r.returncode != 0:
        return {"erro": (r.stderr or r.stdout).strip()[:600]}
    linhas = r.stdout.strip().splitlines()
    info = {"saida": linhas, "pngs": len([a for a in os.listdir(pasta) if a.startswith("s") and a.endswith(".png")])}
    try:
        subprocess.run([sys.executable, "-I", os.path.join(AQUI, "folha.py"), pasta], check=True)
        info["folhas"] = sorted(a for a in os.listdir(pasta) if a.startswith("folha"))
    except Exception as e:  # noqa: BLE001
        info["folhas_erro"] = str(e)
    return info


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    res = validar(sys.argv[1])
    if "--abrir" in sys.argv:
        pasta = sys.argv[sys.argv.index("--abrir") + 1] if len(sys.argv) > sys.argv.index("--abrir") + 1 else os.path.splitext(sys.argv[1])[0] + "_render"
        res["powerpoint"] = abrir_no_powerpoint(sys.argv[1], pasta)
        if "erro" in res["powerpoint"]:
            res["erros"].append("PowerPoint não abriu o arquivo: " + res["powerpoint"]["erro"])
    print(json.dumps(res, ensure_ascii=False, indent=2))
    print("\nRESULTADO:", "REPROVADO" if res["erros"] else "APROVADO", f"({len(res['erros'])} erros, {len(res['avisos'])} avisos)")
    sys.exit(1 if res["erros"] else 0)
