"""transcrever.py — transcreve áudio (WhatsApp .ogg, .mp3, .m4a) em português com Whisper local, com tempos.
Usado para entender pedidos do Fábio/time em áudio ANTES de mexer em qualquer coisa (nada de inventar).
Precisa: pip install openai-whisper  e  ffmpeg no PATH.  Modelo "medium" é o que acertou nomes e números.
Uso: python -I transcrever.py audio.ogg [saida.txt] [modelo]
"""
import os
import sys

import whisper

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
arq = sys.argv[1]
saida = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(arq)[0] + ".txt"
modelo = sys.argv[3] if len(sys.argv) > 3 else "medium"
r = whisper.load_model(modelo).transcribe(arq, language="pt", fp16=False)
texto = "\n".join(f"[{s['start']:.1f}] {s['text'].strip()}" for s in r["segments"])
open(saida, "w", encoding="utf8").write(texto)
print(texto)
