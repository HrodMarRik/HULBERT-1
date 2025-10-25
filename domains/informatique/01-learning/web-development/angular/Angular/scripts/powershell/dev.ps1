# Script de développement pour le tutoriel Angular n-tier (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Couleurs pour les messages
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Fonction pour afficher les messages
function Write-Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Fonction pour vérifier si une commande existe
function Test-Command {
    param([string]$CommandName)
    try {
        Get-Command $CommandName -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis..."
    
    if (-not (Test-Command "node")) {
        Write-Error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-Error "npm n'est pas installé. Veuillez installer Node.js qui inclut npm."
        exit 1
    }
    
    if (-not (Test-Command "python")) {
        Write-Error "Python n'est pas installé. Veuillez l'installer depuis https://python.org/"
        exit 1
    }
    
    if (-not (Test-Command "pip")) {
        Write-Error "pip n'est pas installé. Veuillez installer pip pour Python."
        exit 1
    }
    
    if (-not (Test-Command "psql")) {
        Write-Warning "PostgreSQL n'est pas installé. Veuillez l'installer depuis https://postgresql.org/"
        Write-Warning "Vous pouvez continuer sans PostgreSQL pour le moment."
    }
    
    Write-Success "Tous les prérequis sont satisfaits!"
}

# Fonction pour installer les dépendances
function Install-Dependencies {
    Write-Log "Installation des dépendances..."
    
    # Frontend
    Write-Log "Installation des dépendances frontend..."
    Set-Location "Angular\Tuto-Angular"
    npm install
    Set-Location "..\.."
    
    # Backend
    Write-Log "Installation des dépendances backend..."
    Set-Location "Angular\Tuto-Angular\backend"
    pip install -r requirements.txt
    Set-Location "..\..\.."
    
    Write-Success "Dépendances installées avec succès!"
}

# Fonction pour configurer la base de données
function Setup-Database {
    Write-Log "Configuration de la base de données..."
    
    if (Test-Command "psql") {
        # Créer la base de données si elle n'existe pas
        try {
            createdb tuto_angular 2>$null
        }
        catch {
            Write-Log "Base de données 'tuto_angular' existe déjà"
        }
        
        # Copier le fichier de configuration
        try {
            Copy-Item "Angular\Tuto-Angular\backend\config.env.example" "Angular\Tuto-Angular\backend\config.env" -ErrorAction Stop
        }
        catch {
            Write-Log "Fichier config.env existe déjà"
        }
        
        Write-Success "Base de données configurée!"
    }
    else {
        Write-Warning "PostgreSQL n'est pas installé. Veuillez l'installer et configurer la base de données manuellement."
    }
}

# Fonction pour démarrer le développement
function Start-Development {
    Write-Log "Démarrage de l'environnement de développement..."
    
    # Démarrer le backend en arrière-plan
    Write-Log "Démarrage du backend..."
    Set-Location "Angular\Tuto-Angular\backend"
    Start-Process -FilePath "uvicorn" -ArgumentList "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000" -WindowStyle Hidden
    Set-Location "..\..\.."
    
    # Attendre que le backend soit prêt
    Start-Sleep -Seconds 5
    
    # Démarrer le frontend
    Write-Log "Démarrage du frontend..."
    Set-Location "Angular\Tuto-Angular"
    Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden
    Set-Location "..\.."
    
    Write-Success "Environnement de développement démarré!"
    Write-Log "Frontend: http://localhost:4200"
    Write-Log "Backend: http://localhost:8000"
    Write-Log "API Docs: http://localhost:8000/docs"
    Write-Log "Appuyez sur une touche pour arrêter les services..."
    Read-Host
}

# Fonction pour exécuter les tests
function Invoke-Tests {
    Write-Log "Exécution des tests..."
    
    # Tests frontend
    Write-Log "Tests frontend..."
    Set-Location "Angular\Tuto-Angular"
    npm run test:ci
    Set-Location "..\.."
    
    # Tests backend
    Write-Log "Tests backend..."
    Set-Location "Angular\Tuto-Angular\backend"
    pytest
    Set-Location "..\..\.."
    
    Write-Success "Tous les tests sont passés!"
}

# Fonction pour construire l'application
function Build-Application {
    Write-Log "Construction de l'application..."
    
    # Build frontend
    Write-Log "Construction du frontend..."
    Set-Location "Angular\Tuto-Angular"
    npm run build:prod
    Set-Location "..\.."
    
    # Build backend
    Write-Log "Construction du backend..."
    Set-Location "Angular\Tuto-Angular\backend"
    Write-Host "Backend build completed"
    Set-Location "..\..\.."
    
    Write-Success "Application construite avec succès!"
}

# Fonction pour nettoyer
function Clear-TemporaryFiles {
    Write-Log "Nettoyage des fichiers temporaires..."
    
    # Nettoyer le frontend
    Set-Location "Angular\Tuto-Angular"
    if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
    if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force }
    Set-Location "..\.."
    
    # Nettoyer le backend
    Set-Location "Angular\Tuto-Angular\backend"
    Get-ChildItem -Path . -Recurse -Directory -Name "__pycache__" | Remove-Item -Recurse -Force
    Get-ChildItem -Path . -Recurse -Filter "*.pyc" | Remove-Item -Force
    Set-Location "..\..\.."
    
    Write-Success "Nettoyage terminé!"
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\dev.ps1 [COMMAND]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  check       Vérifier les prérequis"
    Write-Host "  install     Installer les dépendances"
    Write-Host "  setup       Configurer la base de données"
    Write-Host "  dev         Démarrer l'environnement de développement"
    Write-Host "  test        Exécuter les tests"
    Write-Host "  build       Construire l'application"
    Write-Host "  clean       Nettoyer les fichiers temporaires"
    Write-Host "  help        Afficher cette aide"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\dev.ps1 check"
    Write-Host "  .\dev.ps1 install"
    Write-Host "  .\dev.ps1 dev"
}

# Fonction principale
function Main {
    switch ($Command.ToLower()) {
        "check" { Test-Prerequisites }
        "install" { 
            Test-Prerequisites
            Install-Dependencies 
        }
        "setup" { Setup-Database }
        "dev" { Start-Development }
        "test" { Invoke-Tests }
        "build" { Build-Application }
        "clean" { Clear-TemporaryFiles }
        "help" { Show-Help }
        "--help" { Show-Help }
        "-h" { Show-Help }
        default { 
            Write-Error "Commande inconnue: $Command"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
