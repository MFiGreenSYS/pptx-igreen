"""anim.py — pós-processador dos decks iGreen (skill pptx-igreen). Roda depois do pptxgenjs; o kit chama sozinho.

- Morph (por objeto) em todos os slides: objetos com o mesmo nome "!!..." viajam de um slide para o outro.
- Animações pela etiqueta no nome do objeto: "Nome [passo|efeito|atraso]".
    passo   a = entra ao abrir o slide | c1, c2... = no 1º, 2º... clique
    efeito  ascend, wipe, wipeup, fly, zoom, fade, wheel (Roda: arcos), play (vídeo: aparece e toca)
    atraso  ms dentro do passo
- "#3d" / "#3d-top" / "#3d-raso" no nome: extrusão 3D nativa (câmera oblíqua, continua editável).
- Vídeos mudos e em loop; ids de objeto únicos (o pptxgenjs repete e o PowerPoint recusa abrir com timeline);
  mídias repetidas gravadas uma vez só; etiquetas apagadas do nome no final (painel de seleção limpo).

Uso: python -I anim.py "<deck.pptx>"
"""
import re
import struct
import sys
import zipfile

from lxml import etree

NS = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main",
      "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
P14 = "http://schemas.microsoft.com/office/powerpoint/2010/main"
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"
MORPH = (f'<mc:AlternateContent xmlns:mc="{MC}"><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">'
         '<p:transition spd="slow" p14:dur="1250"><p159:morph option="byObject"/></p:transition></mc:Choice>'
         '<mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>')
TAG = re.compile(r"^(.*?)\s*\[(a|c\d+)\|(\w+)\|(\d+)\]$")


def _vis(i, spid):
    return (f'<p:set><p:cBhvr><p:cTn id="{i}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
            f'<p:to><p:strVal val="visible"/></p:to></p:set>')


def _anim(i, spid, attr, v0, v1, dur, additive=False):
    add = ' additive="base"' if additive else ""
    val = lambda v: f'<p:fltVal val="{v}"/>' if isinstance(v, (int, float)) else f'<p:strVal val="{v}"/>'
    return (f'<p:anim calcmode="lin" valueType="num"><p:cBhvr{add}><p:cTn id="{i}" dur="{dur}" fill="hold"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>{attr}</p:attrName></p:attrNameLst></p:cBhvr>'
            f'<p:tavLst><p:tav tm="0"><p:val>{val(v0)}</p:val></p:tav><p:tav tm="100000"><p:val>{val(v1)}</p:val></p:tav></p:tavLst></p:anim>')


def _filt(i, spid, filt, dur):
    return (f'<p:animEffect transition="in" filter="{filt}"><p:cBhvr><p:cTn id="{i}" dur="{dur}"/>'
            f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>')


EFFECTS = {  # nome: (presetID, subtipo, ms, extra do cTn, corpo)
    "ascend": (42, 0, 900, ' decel="100000"', lambda n, s, d: _filt(n(), s, "fade", d) + _anim(n(), s, "ppt_x", "#ppt_x", "#ppt_x", d)
               + _anim(n(), s, "ppt_y", "#ppt_y+.1", "#ppt_y", d)),
    "wipe": (22, 8, 700, "", lambda n, s, d: _filt(n(), s, "wipe(left)", d)),
    "wipeup": (22, 4, 600, "", lambda n, s, d: _filt(n(), s, "wipe(down)", d)),
    "fly": (2, 4, 1000, ' accel="20000" decel="80000"', lambda n, s, d: _anim(n(), s, "ppt_x", "#ppt_x", "#ppt_x", d, True)
            + _anim(n(), s, "ppt_y", "1+#ppt_h/2", "#ppt_y", d, True)),
    "zoom": (53, 16, 600, "", lambda n, s, d: _anim(n(), s, "ppt_w", 0, "#ppt_w", d) + _anim(n(), s, "ppt_h", 0, "#ppt_h", d)
             + _filt(n(), s, "fade", d)),
    "fade": (10, 0, 600, "", lambda n, s, d: _filt(n(), s, "fade", d)),
    "wheel": (21, 1, 1500, "", lambda n, s, d: _filt(n(), s, "wheel(1)", d)),  # Roda: revela no sentido horário (arcos)
}


def mp4_ms(data):
    i = data.find(b"mvhd")
    if i < 0:
        return 10000
    if data[i + 4] == 1:
        ts, dur = struct.unpack(">IQ", data[i + 24:i + 36])
    else:
        ts, dur = struct.unpack(">II", data[i + 16:i + 24])
    return int(dur * 1000 / ts)


def unique_ids(xml):
    """O pptxgenjs repete ids de objeto nos slides com vídeo; com timeline o PowerPoint recusa abrir."""
    ids = [int(i) for i in re.findall(r'<p:cNvPr id="(\d+)"', xml)]
    nxt, seen = max(ids, default=1) + 1, set()

    def fix(m):
        nonlocal nxt
        i = int(m.group(1))
        if i in seen:
            i, nxt = nxt, nxt + 1
        seen.add(i)
        return f'<p:cNvPr id="{i}"'
    return re.sub(r'<p:cNvPr id="(\d+)"', fix, xml)


def slide_order(z):
    pres = z.read("ppt/presentation.xml").decode()
    rels = z.read("ppt/_rels/presentation.xml.rels").decode()
    rmap = {re.search(r'Id="([^"]+)"', m).group(1): re.search(r'Target="([^"]+)"', m).group(1)
            for m in re.findall(r"<Relationship [^>]*>", rels)}
    return ["ppt/" + rmap[r].lstrip("/").replace("ppt/", "") for r in re.findall(r'<p:sldId [^>]*r:id="(rId\d+)"', pres)]


def objects(xml, rels, files):
    root = etree.fromstring(xml.encode("utf8"))
    out = []
    for el in root.find(".//p:cSld/p:spTree", NS):
        kind = etree.QName(el).localname
        cnv = el.find(".//p:cNvPr", NS)
        if kind not in ("sp", "pic") or cnv is None:
            continue
        name = cnv.get("name") or ""
        m = TAG.match(name)
        media = el.find(f".//{{{P14}}}media")
        dur = None
        if el.find(".//a:videoFile", NS) is not None and media is not None:
            rid = media.get(f"{{{NS['r']}}}embed")
            t = re.search(rf'Id="{rid}"[^>]*Target="\.\./media/([^"]+)"', rels) or re.search(rf'Target="\.\./media/([^"]+)"[^>]*Id="{rid}"', rels)
            dur = mp4_ms(files["ppt/media/" + t.group(1)]) if t else 9000
        out.append({"id": cnv.get("id"), "name": name, "kind": kind, "text": bool("".join(el.itertext()).strip()) if kind == "sp" else False,
                    "step": m.group(2) if m else None, "eff": m.group(3) if m else None, "delay": int(m.group(4)) if m else 0, "video": dur})
    return out


def timing(objs):
    c = [2]

    def n():
        c[0] += 1
        return c[0]

    steps = {}
    for o in objs:
        if o["step"]:
            steps.setdefault(o["step"], []).append(o)
        elif o["video"]:  # vídeo de fundo: toca ao abrir
            steps.setdefault("a", []).append({**o, "eff": "play", "delay": 0, "bg": True})
    if not steps:
        return ""
    order = sorted(steps, key=lambda k: 0 if k == "a" else int(k[1:]))
    groups, videos, built = [], [], set()
    for k in order:
        items = sorted(steps[k], key=lambda o: o["delay"])
        pars, first = [], True
        for o in items:
            node = ("clickEffect" if k != "a" else "afterEffect") if first else "withEffect"
            first = False
            if o["eff"] == "play":
                videos.append(o)
                if not o.get("bg"):  # vídeo de conteúdo: aparece em fade e toca junto
                    pars.append(f'<p:par><p:cTn id="{n()}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" nodeType="{node}">'
                                f'<p:stCondLst><p:cond delay="{o["delay"]}"/></p:stCondLst><p:childTnLst>{_vis(n(), o["id"])}{_filt(n(), o["id"], "fade", 600)}</p:childTnLst></p:cTn></p:par>')
                    node = "withEffect"
                pars.append(f'<p:par><p:cTn id="{n()}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="{node}">'
                            f'<p:stCondLst><p:cond delay="{o["delay"]}"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="playFrom(0.0)">'
                            f'<p:cBhvr><p:cTn id="{n()}" dur="{o["video"]}" fill="hold"/><p:tgtEl><p:spTgt spid="{o["id"]}"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par>')
                continue
            preset, sub, dur, extra, body = EFFECTS[o["eff"]]
            grp = ' grpId="0"' if o["kind"] == "sp" else ""
            if o["kind"] == "sp":
                built.add((o["id"], o["text"]))
            pars.append(f'<p:par><p:cTn id="{n()}" presetID="{preset}" presetClass="entr" presetSubtype="{sub}"{extra} fill="hold"{grp} nodeType="{node}">'
                        f'<p:stCondLst><p:cond delay="{o["delay"]}"/></p:stCondLst><p:childTnLst>{_vis(n(), o["id"])}{body(n, o["id"], dur)}</p:childTnLst></p:cTn></p:par>')
        cond = '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' if k == "a" else '<p:cond delay="indefinite"/>'
        groups.append(f'<p:par><p:cTn id="{n()}" fill="hold"><p:stCondLst>{cond}</p:stCondLst><p:childTnLst>'
                      f'<p:par><p:cTn id="{n()}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{"".join(pars)}</p:childTnLst></p:cTn></p:par>'
                      f'</p:childTnLst></p:cTn></p:par>')
    media = "".join(
        f'<p:video><p:cMediaNode vol="0" mute="1"><p:cTn id="{n()}" repeatCount="indefinite" fill="hold" display="0">'
        f'<p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="{v["id"]}"/></p:tgtEl></p:cMediaNode></p:video>'
        for v in videos)
    bld = "".join(f'<p:bldP spid="{i}" grpId="0"{"" if t else " animBg=\"1\""}/>' for i, t in sorted(built))
    return ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
            f'{"".join(groups)}</p:childTnLst></p:cTn>'
            '<p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
            f'{media}</p:childTnLst></p:cTn></p:par></p:tnLst>{"<p:bldLst>" + bld + "</p:bldLst>" if bld else ""}</p:timing>')


def tres_d(xml):
    """Formas com "#3d" no nome ganham 3D nativo do PowerPoint (câmera oblíqua: a face da frente fica no lugar, a
    profundidade sai para cima/direita), continuam editáveis. "#3d-top" = destaque verde, lateral verde-escura."""
    def one(m):
        sp = m.group(0)
        nm = re.search(r'<p:cNvPr id="\d+" name="([^"]*)"', sp)
        if not nm or "#3d" not in nm.group(1):
            return sp
        top = "#3d-top" in nm.group(1)
        side = "14E000" if top else "1E5A28"
        raso = "#3d-raso" in nm.group(1) or nm.group(1).startswith("Dia ")
        depth = 548640 if raso else 1097280  # a câmera oblíqua projeta ~1/4 da profundidade
        fx = ('<a:scene3d><a:camera prst="obliqueTopRight"/><a:lightRig rig="threePt" dir="t"/></a:scene3d>'
              f'<a:sp3d extrusionH="{depth}" prstMaterial="matte"><a:bevelT w="12700" h="12700"/>'
              f'<a:extrusionClr><a:srgbClr val="{side}"/></a:extrusionClr><a:contourClr><a:srgbClr val="{side}"/></a:contourClr></a:sp3d>')
        sp = sp.replace("</p:spPr>", fx + "</p:spPr>", 1)
        return re.sub(r'(<p:cNvPr id="\d+" name="[^"]*?)#3d(?:-top|-raso)?', r'\g<1>', sp, count=1)
    return re.sub(r"<p:sp>.*?</p:sp>", one, xml, flags=re.S)


def dedupe_media(files):
    """O pptxgenjs grava uma cópia da imagem por slide (a textura de fundo ia 12 vezes). Mantém uma só e
    aponta todos os .rels para ela."""
    import hashlib
    first, drop = {}, {}
    for name in sorted(files):
        if name.startswith("ppt/media/"):
            h = hashlib.md5(files[name]).hexdigest()
            if h in first:
                drop[name.split("/")[-1]] = first[h].split("/")[-1]
            else:
                first[h] = name
    if not drop:
        return files
    for name in list(files):
        if name.endswith(".rels"):
            x = files[name].decode("utf8")
            y = re.sub(r'Target="\.\./media/([^"]+)"', lambda m: f'Target="../media/{drop.get(m.group(1), m.group(1))}"', x)
            if y != x:
                files[name] = y.encode("utf8")
    for d in drop:
        del files["ppt/media/" + d]
    print(f"mídias repetidas removidas: {len(drop)}")
    return files


def main(deck):
    zin = zipfile.ZipFile(deck)
    order = slide_order(zin)
    files = {i.filename: zin.read(i.filename) for i in zin.infolist() if not i.filename.endswith("/")}
    zin.close()
    st = {"efeitos": 0, "cliques": 0, "videos": 0}
    for f in order:
        xml = unique_ids(files[f].decode("utf8"))
        rels = files[f.replace("slides/", "slides/_rels/") + ".rels"].decode()
        objs = objects(xml, rels, files)
        tm = timing(objs)
        xml = re.sub(r"<mc:AlternateContent[^>]*>(?:(?!</mc:AlternateContent>).)*?<p:transition.*?</mc:AlternateContent>|<p:transition.*?</p:transition>|<p:transition[^>]*/>|<p:timing>.*?</p:timing>", "", xml, flags=re.S)
        if "xmlns:p14=" not in xml[:600]:
            xml = xml.replace("<p:sld ", f'<p:sld xmlns:p14="{P14}" ', 1)
        xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + MORPH + tm, 1)
        xml = tres_d(xml)
        # a etiqueta já virou animação: o painel de seleção fica só com o nome limpo
        xml = re.sub(r'(<p:cNvPr id="\d+" name=")([^"]*?)\s*\[(?:a|c\d+)\|\w+\|\d+\]"', r'\g<1>\g<2>"', xml)
        etree.fromstring(xml.encode("utf8"))
        files[f] = xml.encode("utf8")
        st["efeitos"] += sum(1 for o in objs if o["step"])
        st["cliques"] += len({o["step"] for o in objs if o["step"] and o["step"] != "a"})
        st["videos"] += sum(1 for o in objs if o["video"])
    files = dedupe_media(files)
    with zipfile.ZipFile(deck, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
            z.writestr(name, data, compress_type=zipfile.ZIP_STORED if name.endswith((".mp4", ".png", ".jpg", ".jpeg")) else zipfile.ZIP_DEFLATED)
    print(f"morph em {len(order)} slides | {st['efeitos']} objetos animados | {st['cliques']} cliques | {st['videos']} vídeos")


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    main(sys.argv[1])
