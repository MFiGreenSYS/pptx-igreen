"""comparar.py — o que o Matheus mudou à mão no PPTX em relação ao que o gerador produz.

Regra: ANTES de regerar um deck que ele pode ter editado, gere uma cópia, compare e leve as mudanças para o build.js
(senão a edição dele some). Mostra por slide: objetos novos/removidos, posição/tamanho, texto, fonte/cor, imagem
trocada (hash), fundo, transição e animação.

Uso: python -I comparar.py gerado.pptx editado.pptx [relatorio.txt]
"""
import hashlib
import os
import re
import sys
import zipfile

from lxml import etree

NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
EMU = 914400


def ordem(z):
    pres = z.read("ppt/presentation.xml").decode()
    rels = z.read("ppt/_rels/presentation.xml.rels").decode()
    rm = {re.search(r'Id="([^"]+)"', m).group(1): re.search(r'Target="([^"]+)"', m).group(1) for m in re.findall(r"<Relationship [^>]*>", rels)}
    return ["ppt/" + rm[r].lstrip("/").replace("ppt/", "") for r in re.findall(r'<p:sldId [^>]*r:id="(rId\d+)"', pres)]


def midia(z, f, rid):
    rels = z.read(f.replace("slides/", "slides/_rels/") + ".rels").decode()
    m = re.search(rf'Id="{rid}"[^>]*Target="([^"]+)"', rels) or re.search(rf'Target="([^"]+)"[^>]*Id="{rid}"', rels)
    if not m:
        return None
    p = "ppt/" + m.group(1).replace("../", "")
    try:
        return hashlib.md5(z.read(p)).hexdigest()[:8]
    except KeyError:
        return m.group(1)


def objetos(z, f):
    root = etree.fromstring(z.read(f))
    out = {}
    for el in root.find(".//p:cSld/p:spTree", NS).iter():
        k = etree.QName(el).localname
        if k not in ("sp", "pic", "grpSp", "cxnSp", "graphicFrame"):
            continue
        if etree.QName(el.getparent()).localname not in ("spTree", "grpSp"):
            continue
        c = el.find(".//p:cNvPr", NS)
        if c is None:
            continue
        off, ext = el.find(".//a:off", NS), el.find(".//a:ext[@cx]", NS)
        geo = (round(int(off.get("x")) / EMU, 2), round(int(off.get("y")) / EMU, 2), round(int(ext.get("cx")) / EMU, 2), round(int(ext.get("cy")) / EMU, 2)) if off is not None and ext is not None else None
        txt = " | ".join("".join(t.text or "" for t in p.iter("{%s}t" % NS["a"])) for p in el.iter("{%s}p" % NS["a"])).strip(" |")
        runs = sorted({(r.get("sz"), (r.find("a:latin", NS).get("typeface") if r.find("a:latin", NS) is not None else None),
                        (r.find(".//a:srgbClr", NS).get("val") if r.find(".//a:srgbClr", NS) is not None else None)) for r in el.iter("{%s}rPr" % NS["a"])}, key=str)
        sp = el.find("p:spPr", NS)
        fill = None
        if sp is not None:
            sf = sp.find("a:solidFill//a:srgbClr", NS)
            fill = sf.get("val") if sf is not None else ("grad" if sp.find("a:gradFill", NS) is not None else None)
        blip = el.find(".//a:blip", NS)
        img = midia(z, f, blip.get("{%s}embed" % NS["r"])) if blip is not None else None
        chave, i = c.get("name"), 2
        while chave in out:
            chave, i = f"{c.get('name')}#{i}", i + 1
        out[chave] = {"tipo": k, "geo": geo, "texto": txt[:120], "fonte": runs, "preenchimento": fill, "imagem": img}
    x = z.read(f).decode("utf8", "ignore")
    bg = re.search(r'<p:bg>.*?srgbClr val="([0-9A-Fa-f]{6})"', x, re.S)
    return out, (bg.group(1) if bg else None), "p159:morph" in x, len(re.findall(r'presetClass="entr"', x)), len(re.findall(r'nodeType="clickEffect"', x))


def comparar(a, b):
    za, zb = zipfile.ZipFile(a), zipfile.ZipFile(b)
    oa, ob = ordem(za), ordem(zb)
    linhas = [f"slides: gerado {len(oa)} · editado {len(ob)}"]
    for i in range(max(len(oa), len(ob))):
        if i >= len(oa) or i >= len(ob):
            linhas.append(f"=== SLIDE {i + 1}: {'só no editado' if i >= len(oa) else 'removido no editado'}")
            continue
        (sa, bga, ma, ea, ca), (sb, bgb, mb, eb, cb) = objetos(za, oa[i]), objetos(zb, ob[i])
        L = []
        if bga != bgb:
            L.append(f"  fundo: {bga} -> {bgb}")
        if ma != mb:
            L.append(f"  Morph: {ma} -> {mb}")
        if (ea, ca) != (eb, cb):
            L.append(f"  animação: {ea} efeitos/{ca} cliques -> {eb}/{cb}")
        for k in sa:
            if k not in sb:
                L.append(f"  - REMOVIDO {k}: {sa[k]['tipo']} {sa[k]['geo']} '{sa[k]['texto']}'")
        for k in sb:
            if k not in sa:
                L.append(f"  + NOVO {k}: {sb[k]}")
        for k in sa:
            if k in sb:
                dif = [f"{c}: {sa[k][c]} -> {sb[k][c]}" for c in sa[k] if sa[k][c] != sb[k][c]]
                if dif:
                    L.append(f"  ~ {k}: " + " ; ".join(dif))
        linhas.append(f"=== SLIDE {i + 1}" + ("\n" + "\n".join(L) if L else "  (igual)"))
    return "\n".join(linhas)


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    rel = comparar(sys.argv[1], sys.argv[2])
    if len(sys.argv) > 3:
        open(sys.argv[3], "w", encoding="utf8").write(rel)
        print("relatório em", os.path.abspath(sys.argv[3]))
    else:
        print(rel)
