# Script de documentation pour le tutoriel Angular n-tier (PowerShell)

param(
    [string]$DocType = "all",
    [string]$DocDir = $env:DOC_DIR ?? "docs",
    [string]$OutputDir = $env:OUTPUT_DIR ?? "output"
)

# Couleurs pour les messages
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Fonction pour afficher les messages
function Write-Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis de documentation..."
    
    $prerequisites = @{
        "pandoc" = $false
        "git" = $false
    }
    
    # Vérifier pandoc
    try {
        $null = Get-Command pandoc -ErrorAction Stop
        $prerequisites["pandoc"] = $true
    } catch {
        Write-Warning "pandoc n'est pas installé. Certaines conversions de documentation seront limitées."
    }
    
    # Vérifier Git
    try {
        $null = Get-Command git -ErrorAction Stop
        $prerequisites["git"] = $true
    } catch {
        Write-Warning "Git n'est pas installé. Certaines fonctionnalités de documentation seront limitées."
    }
    
    Write-Success "Prérequis de documentation vérifiés!"
    return $true
}

# Fonction pour créer les répertoires nécessaires
function New-DocumentationDirectories {
    Write-Log "Création des répertoires nécessaires..."
    
    $directories = @(
        $DocDir,
        $OutputDir,
        "$OutputDir\html",
        "$OutputDir\pdf",
        "$OutputDir\epub",
        "$OutputDir\mobi"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Répertoires créés!"
}

# Fonction pour générer la documentation HTML
function New-HTMLDocumentation {
    Write-Log "Génération de la documentation HTML..."
    
    $htmlFile = "$OutputDir\html\index.html"
    
    $htmlContent = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tutoriel Angular n-tier</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2, h3 { color: #333; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .toc { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
        .toc ul { list-style-type: none; padding-left: 0; }
        .toc li { margin: 5px 0; }
        .toc a { text-decoration: none; color: #0066cc; }
        .toc a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Tutoriel Angular n-tier</h1>
    
    <div class="toc">
        <h2>Table des matières</h2>
        <ul>
            <li><a href="#introduction">Introduction</a></li>
            <li><a href="#architecture">Architecture n-tier</a></li>
            <li><a href="#frontend">Frontend Angular</a></li>
            <li><a href="#backend">Backend Python/FastAPI</a></li>
            <li><a href="#database">Base de données PostgreSQL</a></li>
            <li><a href="#deployment">Déploiement</a></li>
            <li><a href="#exercises">Exercices</a></li>
        </ul>
    </div>
    
    <h2 id="introduction">Introduction</h2>
    <p>Ce tutoriel vous guide à travers la création d'une application web complète utilisant Angular, TypeScript, Python/FastAPI et PostgreSQL dans une architecture n-tier.</p>
    
    <h2 id="architecture">Architecture n-tier</h2>
    <p>L'architecture n-tier sépare l'application en plusieurs couches logiques :</p>
    <ul>
        <li><strong>Présentation</strong> : Interface utilisateur Angular</li>
        <li><strong>Application</strong> : Logique métier FastAPI</li>
        <li><strong>Données</strong> : Base de données PostgreSQL</li>
    </ul>
    
    <h2 id="frontend">Frontend Angular</h2>
    <p>Le frontend Angular utilise TypeScript et suit les meilleures pratiques de développement.</p>
    
    <h2 id="backend">Backend Python/FastAPI</h2>
    <p>Le backend FastAPI fournit une API REST moderne et performante.</p>
    
    <h2 id="database">Base de données PostgreSQL</h2>
    <p>PostgreSQL est utilisé comme base de données relationnelle robuste.</p>
    
    <h2 id="deployment">Déploiement</h2>
    <p>Le déploiement utilise Docker et Docker Compose pour la containerisation.</p>
    
    <h2 id="exercises">Exercices</h2>
    <p>Des exercices pratiques sont fournis pour renforcer l'apprentissage.</p>
</body>
</html>
"@
    
    $htmlContent | Out-File -FilePath $htmlFile -Encoding UTF8
    
    Write-Success "Documentation HTML générée: $htmlFile"
    return $true
}

# Fonction pour générer la documentation PDF
function New-PDFDocumentation {
    Write-Log "Génération de la documentation PDF..."
    
    try {
        $null = Get-Command pandoc -ErrorAction Stop
        
        $pdfFile = "$OutputDir\pdf\tutorial.pdf"
        
        $markdownFiles = Get-ChildItem -Path $DocDir -Filter "*.md" -File
        if ($markdownFiles.Count -gt 0) {
            $process = Start-Process -FilePath "pandoc" -ArgumentList @($markdownFiles.FullName, "-o", $pdfFile, "--pdf-engine=pdflatex", "--toc", "--toc-depth=3") -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -eq 0) {
                Write-Success "Documentation PDF générée: $pdfFile"
            } else {
                Write-Error "Échec de la génération PDF"
                return $false
            }
        } else {
            Write-Warning "Aucun fichier Markdown trouvé dans $DocDir"
        }
    } catch {
        Write-Warning "pandoc n'est pas installé. Génération PDF ignorée."
    }
    
    return $true
}

# Fonction pour générer la documentation EPUB
function New-EPUBDocumentation {
    Write-Log "Génération de la documentation EPUB..."
    
    try {
        $null = Get-Command pandoc -ErrorAction Stop
        
        $epubFile = "$OutputDir\epub\tutorial.epub"
        
        $markdownFiles = Get-ChildItem -Path $DocDir -Filter "*.md" -File
        if ($markdownFiles.Count -gt 0) {
            $process = Start-Process -FilePath "pandoc" -ArgumentList @($markdownFiles.FullName, "-o", $epubFile, "--toc", "--toc-depth=3") -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -eq 0) {
                Write-Success "Documentation EPUB générée: $epubFile"
            } else {
                Write-Error "Échec de la génération EPUB"
                return $false
            }
        } else {
            Write-Warning "Aucun fichier Markdown trouvé dans $DocDir"
        }
    } catch {
        Write-Warning "pandoc n'est pas installé. Génération EPUB ignorée."
    }
    
    return $true
}

# Fonction pour générer la documentation MOBI
function New-MOBIDocumentation {
    Write-Log "Génération de la documentation MOBI..."
    
    try {
        $null = Get-Command pandoc -ErrorAction Stop
        
        $mobiFile = "$OutputDir\mobi\tutorial.mobi"
        
        $markdownFiles = Get-ChildItem -Path $DocDir -Filter "*.md" -File
        if ($markdownFiles.Count -gt 0) {
            $process = Start-Process -FilePath "pandoc" -ArgumentList @($markdownFiles.FullName, "-o", $mobiFile, "--toc", "--toc-depth=3") -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -eq 0) {
                Write-Success "Documentation MOBI générée: $mobiFile"
            } else {
                Write-Error "Échec de la génération MOBI"
                return $false
            }
        } else {
            Write-Warning "Aucun fichier Markdown trouvé dans $DocDir"
        }
    } catch {
        Write-Warning "pandoc n'est pas installé. Génération MOBI ignorée."
    }
    
    return $true
}

# Fonction pour générer la documentation complète
function New-AllDocumentation {
    Write-Log "Génération de la documentation complète..."
    
    New-HTMLDocumentation | Out-Null
    New-PDFDocumentation | Out-Null
    New-EPUBDocumentation | Out-Null
    New-MOBIDocumentation | Out-Null
    
    Write-Success "Documentation complète générée!"
    return $true
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\docs.ps1 [DOC_TYPE] [OPTIONS]" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Documentation Types:" -ForegroundColor $Colors.White
    Write-Host "  all         Tous les types de documentation (défaut)" -ForegroundColor $Colors.White
    Write-Host "  html        Documentation HTML seulement" -ForegroundColor $Colors.White
    Write-Host "  pdf         Documentation PDF seulement" -ForegroundColor $Colors.White
    Write-Host "  epub        Documentation EPUB seulement" -ForegroundColor $Colors.White
    Write-Host "  mobi        Documentation MOBI seulement" -ForegroundColor $Colors.White
    Write-Host "  help        Afficher cette aide" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Colors.White
    Write-Host "  -DocDir     Répertoire de documentation (défaut: docs)" -ForegroundColor $Colors.White
    Write-Host "  -OutputDir  Répertoire de sortie (défaut: output)" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.White
    Write-Host "  .\docs.ps1 all" -ForegroundColor $Colors.White
    Write-Host "  .\docs.ps1 html" -ForegroundColor $Colors.White
    Write-Host "  .\docs.ps1 all -DocDir C:\custom\docs" -ForegroundColor $Colors.White
}

# Fonction principale
function Main {
    switch ($DocType.ToLower()) {
        "all" {
            if (!(Test-Prerequisites)) { return }
            New-DocumentationDirectories
            New-AllDocumentation | Out-Null
        }
        "html" {
            if (!(Test-Prerequisites)) { return }
            New-DocumentationDirectories
            New-HTMLDocumentation | Out-Null
        }
        "pdf" {
            if (!(Test-Prerequisites)) { return }
            New-DocumentationDirectories
            New-PDFDocumentation | Out-Null
        }
        "epub" {
            if (!(Test-Prerequisites)) { return }
            New-DocumentationDirectories
            New-EPUBDocumentation | Out-Null
        }
        "mobi" {
            if (!(Test-Prerequisites)) { return }
            New-DocumentationDirectories
            New-MOBIDocumentation | Out-Null
        }
        "help" {
            Show-Help
        }
        "--help" {
            Show-Help
        }
        "-h" {
            Show-Help
        }
        default {
            Write-Error "Type de documentation inconnu: $DocType"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
