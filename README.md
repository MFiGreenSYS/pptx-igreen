# pptx-igreen

Skill do Claude Code que gera apresentações PowerPoint (.pptx 16:9, editáveis) no padrão visual aprovado da
iGreen Energy: fundo com textura da marca ou verde cheio, Impact + Montserrat, logo oficial, Morph em todos os slides,
animações por clique, gráficos em 3D nativo, vidro neon, mostrador, mapa de estados. Guia completo em `SKILL.md`.

## Instalar

Precisa de **Node 18+**, **Python 3.10+** e **Git**. PowerPoint é opcional (só para a parte visual do teste).

**Recebeu o arquivo `pptx-igreen.bundle`** (Windows, PowerShell):
```powershell
git clone pptx-igreen.bundle "$HOME\.claude\skills\pptx-igreen"
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.claude\skills\pptx-igreen\instalar.ps1"
```
Mac:
```bash
git clone pptx-igreen.bundle ~/.claude/skills/pptx-igreen && bash ~/.claude/skills/pptx-igreen/instalar.sh
```
O instalador põe os pacotes nas versões travadas (pptxgenjs 3.12.0, sharp 0.33.5), as fontes Montserrat e
Geist Mono que faltarem e roda o teste. Pronto quando aparecer **RESULTADO: APROVADO**.

## Atualizar

Recebeu um `pptx-igreen.bundle` novo: na pasta da skill,
```bash
git pull <caminho>/pptx-igreen.bundle main
```
e rode o instalador de novo.

## Testar a qualquer hora
```bash
python -I ~/.claude/skills/pptx-igreen/teste/rodar_teste.py
```

Uso interno iGreen Energy. Fontes Montserrat e Geist Mono: SIL Open Font License 1.1 (`fontes/LICENCAS.txt`).
Logos e imagens da marca: não distribuir fora da empresa.
