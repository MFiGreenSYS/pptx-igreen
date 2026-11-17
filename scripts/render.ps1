# render.ps1 — abre o PPTX no PowerPoint (COM), confere transições/sequências e exporta cada slide em PNG 1600x900.
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File render.ps1 "<deck.pptx>" "<pasta>" ["1,3,5"]
param([string]$pptx, [string]$out, [string]$which = "")
$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force $out | Out-Null
$app = New-Object -ComObject PowerPoint.Application
$p = $app.Presentations.Open((Resolve-Path $pptx).Path, $true, $false, $false)
try {
  $n = $p.Slides.Count
  $list = if ($which) { $which.Split(",") | ForEach-Object { [int]$_ } } else { 1..$n }
  foreach ($i in $list) { $p.Slides.Item($i).Export((Join-Path $out ("s{0:D2}.png" -f $i)), "PNG", 1600, 900) }
  "slides=$n"
  # 3954 = Morph (por objeto); seq = itens da sequência principal (efeitos + vídeos)
  foreach ($i in 1..$n) { "t$i entry=" + $p.Slides.Item($i).SlideShowTransition.EntryEffect + " seq=" + $p.Slides.Item($i).TimeLine.MainSequence.Count }
} finally { $p.Close() }
