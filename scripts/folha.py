"""folha.py — folhas de contato (4 slides por imagem) dos PNGs que o render.ps1 exportou, para revisar rápido.
Uso: python -I folha.py <pasta com s01.png, s02.png...>"""
import os
import sys

from PIL import Image, ImageDraw

pasta = sys.argv[1]
arqs = sorted(a for a in os.listdir(pasta) if a.startswith("s") and a.endswith(".png"))
for k in range(0, len(arqs), 4):
    folha = Image.new("RGB", (1600, 900), "gray")
    for j, a in enumerate(arqs[k:k + 4]):
        im = Image.open(os.path.join(pasta, a)).convert("RGB").resize((796, 448))
        x, y = (j % 2) * 804, (j // 2) * 452
        folha.paste(im, (x, y))
        ImageDraw.Draw(folha).text((x + 6, y + 4), a, fill="red")
    folha.save(os.path.join(pasta, f"folha{k // 4 + 1}.png"))
print(f"{(len(arqs) + 3) // 4} folhas em {pasta}")
