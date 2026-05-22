#!/usr/bin/env pwsh
# ─────────────────────────────────────────────────────────────────────────────
#  generate-uml.ps1  —  Génère les diagrammes UML NaturEssence en PNG
#  Usage : .\generate-uml.ps1
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$scriptDir = $PSScriptRoot

# Chemins
$umlDir    = Join-Path $scriptDir "docs\uml"
$outDir    = Join-Path $scriptDir "docs\uml\output"
$jarPath   = Join-Path $scriptDir "docs\uml\plantuml.jar"
$jarUrl    = "https://github.com/plantuml/plantuml/releases/download/v1.2024.6/plantuml-1.2024.6.jar"

Write-Host ""
Write-Host "  NaturEssence — Générateur de diagrammes UML" -ForegroundColor Green
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor DarkGreen
Write-Host ""

# ── 1. Localiser Java ────────────────────────────────────────────────────────
$javaBin = $null

# Essayer d'abord le PATH courant
if (Get-Command java -ErrorAction SilentlyContinue) {
    $javaBin = "java"
}

# Sinon chercher Eclipse Adoptium (installé sur cette machine)
if (-not $javaBin) {
    $candidates = @(
        "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot\bin\java.exe",
        "C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot\bin\java.exe",
        "C:\Program Files\Java\latest\bin\java.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $javaBin = $c; break }
    }
}

if (-not $javaBin) {
    Write-Host "  [ERREUR] Java introuvable. Installez JRE 11+ depuis https://adoptium.net/" -ForegroundColor Red
    exit 1
}

$javaVersion = & $javaBin -version 2>&1 | Select-Object -First 1
Write-Host "  [OK] Java : $javaVersion" -ForegroundColor Cyan

# ── 2. Télécharger PlantUML si absent ────────────────────────────────────────
if (-not (Test-Path $jarPath)) {
    Write-Host "  [INFO] plantuml.jar non trouvé. Téléchargement en cours..." -ForegroundColor Yellow
    Write-Host "         Source : $jarUrl" -ForegroundColor DarkGray
    try {
        Invoke-WebRequest -Uri $jarUrl -OutFile $jarPath -UseBasicParsing
        Write-Host "  [OK] plantuml.jar téléchargé." -ForegroundColor Cyan
    } catch {
        Write-Host "  [ERREUR] Impossible de télécharger plantuml.jar : $_" -ForegroundColor Red
        Write-Host "           Téléchargez-le manuellement depuis https://plantuml.com/download" -ForegroundColor Yellow
        Write-Host "           et placez-le ici : $jarPath" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  [OK] plantuml.jar déjà présent." -ForegroundColor Cyan
}

# ── 3. Créer le dossier de sortie ────────────────────────────────────────────
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

# ── 4. Générer les PNG ────────────────────────────────────────────────────────
$pumlFiles = @(
    "usecase.puml",
    "classdiagram.puml"
)

foreach ($file in $pumlFiles) {
    $src = Join-Path $umlDir $file
    if (-not (Test-Path $src)) {
        Write-Host "  [SKIP] $file introuvable" -ForegroundColor DarkYellow
        continue
    }
    Write-Host ""
    Write-Host "  Génération de $file ..." -ForegroundColor White
    & $javaBin -jar $jarPath -tpng -o $outDir $src
    if ($LASTEXITCODE -eq 0) {
        $outName = [System.IO.Path]::GetFileNameWithoutExtension($file) + ".png"
        Write-Host "  [OK] docs\uml\output\$outName" -ForegroundColor Green
    } else {
        Write-Host "  [ERREUR] Échec pour $file (code $LASTEXITCODE)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "  Terminé ! Les PNG sont dans : docs\uml\output\" -ForegroundColor Green
Write-Host "  Ouvrez-les avec l'Explorateur Windows ou un éditeur d'images." -ForegroundColor DarkGray
Write-Host ""
