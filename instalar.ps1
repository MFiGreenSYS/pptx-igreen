# instalar.ps1 — instala a skill pptx-igreen nesta máquina (Windows) e roda o teste de ponta a ponta.
#   powershell -NoProfile -ExecutionPolicy Bypass -File instalar.ps1            (padrão: ~\.claude\skills\pptx-igreen)
#   ... -Destino "D:\outra\pasta" -SemTeste
# Precisa: Node 18+ (nodejs.org) e Python 3.10+ (python.org, "Add to PATH"). PowerPoint é opcional (só para o teste visual).
param([string]$Destino = (Join-Path $HOME ".claude\skills\pptx-igreen"), [switch]$SemTeste)
$ErrorActionPreference = "Stop"
$Origem = $PSScriptRoot
function Passo($t) { Write-Host "`n== $t" -ForegroundColor Green }

Passo "Conferindo Node e Python"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw "Node não encontrado. Instale o Node 18+ (https://nodejs.org) e rode de novo." }
$nv = (& node --version).TrimStart("v").Split(".")[0]
if ([int]$nv -lt 18) { throw "Node $nv é antigo; precisa do 18 ou mais novo." }
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { throw "Python não encontrado. Instale o Python 3.10+ (marque 'Add python.exe to PATH') e rode de novo." }
Write-Host ("node " + (& node --version) + " · " + (& python --version))

Passo "Copiando a skill para $Destino"
if ((Resolve-Path $Origem).Path -ne $Destino) {
  New-Item -ItemType Directory -Force $Destino | Out-Null
  robocopy $Origem $Destino /MIR /XD node_modules __pycache__ .git /XF *.pyc /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy falhou ($LASTEXITCODE)" }
}

Passo "Pacotes Node (versões travadas: pptxgenjs 3.12.0, sharp 0.33.5)"
Push-Location (Join-Path $Destino "scripts")
try {
  if (Test-Path package-lock.json) { & npm ci --no-audit --no-fund } else { & npm install --no-audit --no-fund }
  if ($LASTEXITCODE -ne 0) { throw "npm falhou" }
} finally { Pop-Location }

Passo "Pacotes Python (lxml, Pillow; PyMuPDF para ler PDF de briefing)"
& python -m pip install --user --disable-pip-version-check -q "lxml>=5" "Pillow>=10" "pymupdf>=1.24"
if ($LASTEXITCODE -ne 0) { throw "pip falhou" }

Passo "Fontes (Montserrat e Geist Mono, licença OFL) — só as que faltam, por usuário"
$pastaF = Join-Path $env:LOCALAPPDATA "Microsoft\Windows\Fonts"
New-Item -ItemType Directory -Force $pastaF | Out-Null
$reg = "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts"
$novas = 0
foreach ($f in Get-ChildItem (Join-Path $Destino "fontes") -Include *.ttf, *.otf -Recurse) {
  $sistema = Join-Path $env:WINDIR ("Fonts\" + $f.Name)
  $usuario = Join-Path $pastaF $f.Name
  if ((Test-Path $sistema) -or (Test-Path $usuario)) { continue }
  Copy-Item $f.FullName $usuario
  $tipo = if ($f.Extension -eq ".otf") { "OpenType" } else { "TrueType" }
  New-ItemProperty -Path $reg -Name ("{0} ({1})" -f $f.BaseName, $tipo) -Value $usuario -PropertyType String -Force | Out-Null
  $novas++
}
Write-Host "$novas fontes novas instaladas" ; if ($novas) { Write-Host "Feche e abra o PowerPoint para ele enxergar as fontes novas." -ForegroundColor Yellow }
if (-not (Test-Path (Join-Path $env:WINDIR "Fonts\impact.ttf"))) { Write-Warning "Impact não está instalada (vem com o Windows). Os títulos vão sair em outra fonte." }

if (-not $SemTeste) {
  Passo "Teste de ponta a ponta"
  & python -I (Join-Path $Destino "teste\rodar_teste.py") (Join-Path $env:TEMP "pptx-igreen-teste")
  if ($LASTEXITCODE -ne 0) { throw "Teste REPROVADO — veja $env:TEMP\pptx-igreen-teste\RELATORIO_TESTE.md" }
}
Passo "Pronto. Skill em $Destino"
