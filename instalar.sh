#!/usr/bin/env bash
# instalar.sh — instala a skill pptx-igreen no macOS/Linux e roda o teste (sem a etapa do PowerPoint, que é só Windows).
#   bash instalar.sh            (padrão: ~/.claude/skills/pptx-igreen)
#   DESTINO=/outra/pasta bash instalar.sh
# Precisa: Node 18+ e Python 3.10+ (brew install node python).
set -euo pipefail
ORIGEM="$(cd "$(dirname "$0")" && pwd)"
DESTINO="${DESTINO:-$HOME/.claude/skills/pptx-igreen}"
passo() { printf '\n== %s\n' "$1"; }

passo "Conferindo Node e Python"
command -v node >/dev/null || { echo "Instale o Node 18+ (brew install node)"; exit 1; }
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] || { echo "Node antigo; precisa do 18+"; exit 1; }
PY="$(command -v python3 || command -v python)" || { echo "Instale o Python 3.10+"; exit 1; }
echo "node $(node --version) · $($PY --version)"

passo "Copiando a skill para $DESTINO"
if [ "$ORIGEM" != "$DESTINO" ]; then
  mkdir -p "$DESTINO"
  rsync -a --delete --exclude node_modules --exclude __pycache__ --exclude .git "$ORIGEM/" "$DESTINO/"
fi

passo "Pacotes Node (pptxgenjs 3.12.0, sharp 0.33.5)"
cd "$DESTINO/scripts"
if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

passo "Pacotes Python"
"$PY" -m pip install --user -q "lxml>=5" "Pillow>=10" "pymupdf>=1.24" || "$PY" -m pip install --user --break-system-packages -q "lxml>=5" "Pillow>=10" "pymupdf>=1.24"

passo "Fontes (Montserrat, Geist Mono)"
if [ "$(uname)" = "Darwin" ]; then FD="$HOME/Library/Fonts"; else FD="$HOME/.local/share/fonts"; fi
mkdir -p "$FD"
for f in "$DESTINO"/fontes/*.{ttf,otf}; do [ -e "$FD/$(basename "$f")" ] || cp "$f" "$FD/"; done
command -v fc-cache >/dev/null && fc-cache -f "$FD" >/dev/null || true
ls /System/Library/Fonts/Supplemental/Impact.ttf >/dev/null 2>&1 || ls /Library/Fonts/Impact.ttf >/dev/null 2>&1 || echo "AVISO: fonte Impact não encontrada (títulos sairão em outra fonte)."

passo "Teste"
"$PY" -I "$DESTINO/teste/rodar_teste.py" "${TMPDIR:-/tmp}/pptx-igreen-teste"
passo "Pronto. Skill em $DESTINO"
