# Script de configuration pour le tutoriel Angular n-tier (PowerShell)

param(
    [string]$ConfigType = "all",
    [string]$ConfigDir = $env:CONFIG_DIR ?? "config",
    [string]$TemplateDir = $env:TEMPLATE_DIR ?? "templates"
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
    Write-Log "Vérification des prérequis de configuration..."
    
    $prerequisites = @{
        "node" = $false
        "npm" = $false
        "python" = $false
        "pip" = $false
    }
    
    # Vérifier Node.js
    try {
        $null = Get-Command node -ErrorAction Stop
        $prerequisites["node"] = $true
    } catch {
        Write-Warning "Node.js n'est pas installé. Certaines configurations seront limitées."
    }
    
    # Vérifier npm
    try {
        $null = Get-Command npm -ErrorAction Stop
        $prerequisites["npm"] = $true
    } catch {
        Write-Warning "npm n'est pas installé. Certaines configurations seront limitées."
    }
    
    # Vérifier Python
    try {
        $null = Get-Command python -ErrorAction Stop
        $prerequisites["python"] = $true
    } catch {
        Write-Warning "Python n'est pas installé. Certaines configurations seront limitées."
    }
    
    # Vérifier pip
    try {
        $null = Get-Command pip -ErrorAction Stop
        $prerequisites["pip"] = $true
    } catch {
        Write-Warning "pip n'est pas installé. Certaines configurations seront limitées."
    }
    
    Write-Success "Prérequis de configuration vérifiés!"
    return $true
}

# Fonction pour créer les répertoires nécessaires
function New-ConfigurationDirectories {
    Write-Log "Création des répertoires nécessaires..."
    
    $directories = @(
        $ConfigDir,
        $TemplateDir,
        "$ConfigDir\environments",
        "$ConfigDir\database",
        "$ConfigDir\nginx",
        "$ConfigDir\docker",
        "$ConfigDir\ci-cd"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Répertoires créés!"
}

# Fonction pour configurer l'environnement de développement
function Set-DevelopmentEnvironment {
    Write-Log "Configuration de l'environnement de développement..."
    
    # Configuration Angular
    if (Test-Path "Angular\Tuto-Angular\package.json") {
        Write-Log "Configuration du projet Angular..."
        
        # Installer les dépendances
        Set-Location "Angular\Tuto-Angular"
        $process = Start-Process -FilePath "npm" -ArgumentList @("install") -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -ne 0) {
            Write-Error "Échec de l'installation des dépendances Angular"
            Set-Location $PSScriptRoot
            return $false
        }
        
        Set-Location $PSScriptRoot
        Write-Success "Projet Angular configuré!"
    } else {
        Write-Warning "Projet Angular non trouvé. Configuration ignorée."
    }
    
    # Configuration Python
    if (Test-Path "backend\requirements.txt") {
        Write-Log "Configuration du projet Python..."
        
        # Créer un environnement virtuel
        $process = Start-Process -FilePath "python" -ArgumentList @("-m", "venv", "backend\venv") -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -ne 0) {
            Write-Error "Échec de la création de l'environnement virtuel Python"
            return $false
        }
        
        # Activer l'environnement virtuel et installer les dépendances
        $activateScript = "backend\venv\Scripts\Activate.ps1"
        if (Test-Path $activateScript) {
            & $activateScript
            $process = Start-Process -FilePath "pip" -ArgumentList @("install", "-r", "backend\requirements.txt") -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de l'installation des dépendances Python"
                return $false
            }
            
            deactivate
        } else {
            Write-Warning "Script d'activation de l'environnement virtuel non trouvé"
        }
        
        Write-Success "Projet Python configuré!"
    } else {
        Write-Warning "Projet Python non trouvé. Configuration ignorée."
    }
    
    return $true
}

# Fonction pour configurer la base de données
function Set-DatabaseConfiguration {
    Write-Log "Configuration de la base de données..."
    
    # Configuration PostgreSQL
    try {
        $null = Get-Command psql -ErrorAction Stop
        
        Write-Log "Configuration de PostgreSQL..."
        
        # Créer la base de données
        $process = Start-Process -FilePath "createdb" -ArgumentList @("tuto_angular") -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -ne 0) {
            Write-Warning "Base de données 'tuto_angular' existe déjà ou erreur de création"
        }
        
        # Créer les tables
        if (Test-Path "backend\database\models.py") {
            Write-Log "Création des tables..."
            
            # Activer l'environnement virtuel et exécuter les migrations
            $activateScript = "backend\venv\Scripts\Activate.ps1"
            if (Test-Path $activateScript) {
                & $activateScript
                
                $pythonScript = @"
from backend.database.models import Base
from backend.database.connection import engine
Base.metadata.create_all(bind=engine)
print('Tables créées avec succès!')
"@
                
                $process = Start-Process -FilePath "python" -ArgumentList @("-c", $pythonScript) -Wait -PassThru -NoNewWindow
                
                if ($process.ExitCode -ne 0) {
                    Write-Error "Échec de la création des tables"
                    deactivate
                    return $false
                }
                
                deactivate
                Write-Success "Tables créées avec succès!"
            } else {
                Write-Warning "Script d'activation de l'environnement virtuel non trouvé"
            }
        } else {
            Write-Warning "Fichier models.py non trouvé. Création des tables ignorée."
        }
        
        Write-Success "PostgreSQL configuré!"
    } catch {
        Write-Warning "PostgreSQL n'est pas installé. Configuration de la base de données ignorée."
    }
    
    return $true
}

# Fonction pour configurer Docker
function Set-DockerConfiguration {
    Write-Log "Configuration de Docker..."
    
    try {
        $null = Get-Command docker -ErrorAction Stop
        
        # Construire les images Docker
        if (Test-Path "docker-compose.yml") {
            Write-Log "Construction des images Docker..."
            
            $process = Start-Process -FilePath "docker-compose" -ArgumentList @("build") -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de la construction des images Docker"
                return $false
            }
            
            Write-Success "Images Docker construites!"
        } else {
            Write-Warning "Fichier docker-compose.yml non trouvé. Construction des images ignorée."
        }
        
        Write-Success "Docker configuré!"
    } catch {
        Write-Warning "Docker n'est pas installé. Configuration Docker ignorée."
    }
    
    return $true
}

# Fonction pour configurer Nginx
function Set-NginxConfiguration {
    Write-Log "Configuration de Nginx..."
    
    try {
        $null = Get-Command nginx -ErrorAction Stop
        
        # Copier la configuration Nginx
        if (Test-Path "nginx.conf") {
            Write-Log "Copie de la configuration Nginx..."
            
            Copy-Item "nginx.conf" "$ConfigDir\nginx\" -Force
            
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Échec de la copie de la configuration Nginx"
                return $false
            }
            
            Write-Success "Configuration Nginx copiée!"
        } else {
            Write-Warning "Fichier nginx.conf non trouvé. Configuration Nginx ignorée."
        }
        
        Write-Success "Nginx configuré!"
    } catch {
        Write-Warning "Nginx n'est pas installé. Configuration Nginx ignorée."
    }
    
    return $true
}

# Fonction pour configurer CI/CD
function Set-CICDConfiguration {
    Write-Log "Configuration de CI/CD..."
    
    # Configuration GitHub Actions
    if (Test-Path ".github\workflows") {
        Write-Log "Configuration de GitHub Actions..."
        
        # Vérifier que les fichiers de workflow existent
        if (Test-Path ".github\workflows\ci-cd.yml") {
            Write-Success "Workflow GitHub Actions configuré!"
        } else {
            Write-Warning "Fichier de workflow GitHub Actions non trouvé."
        }
    } else {
        Write-Warning "Répertoire .github\workflows non trouvé. Configuration CI/CD ignorée."
    }
    
    Write-Success "CI/CD configuré!"
    return $true
}

# Fonction pour configurer les environnements
function Set-EnvironmentsConfiguration {
    Write-Log "Configuration des environnements..."
    
    # Configuration de l'environnement de développement
    if (Test-Path "Angular\Tuto-Angular\src\environments\environment.ts") {
        Write-Log "Configuration de l'environnement de développement..."
        
        # Vérifier que la configuration est correcte
        $content = Get-Content "Angular\Tuto-Angular\src\environments\environment.ts" -Raw
        if ($content -match "apiUrl.*localhost") {
            Write-Success "Environnement de développement configuré!"
        } else {
            Write-Warning "Configuration de l'environnement de développement à vérifier."
        }
    } else {
        Write-Warning "Fichier environment.ts non trouvé. Configuration de l'environnement ignorée."
    }
    
    # Configuration de l'environnement de production
    if (Test-Path "Angular\Tuto-Angular\src\environments\environment.prod.ts") {
        Write-Log "Configuration de l'environnement de production..."
        
        # Vérifier que la configuration est correcte
        $content = Get-Content "Angular\Tuto-Angular\src\environments\environment.prod.ts" -Raw
        if ($content -match "apiUrl.*yourdomain") {
            Write-Success "Environnement de production configuré!"
        } else {
            Write-Warning "Configuration de l'environnement de production à vérifier."
        }
    } else {
        Write-Warning "Fichier environment.prod.ts non trouvé. Configuration de l'environnement ignorée."
    }
    
    Write-Success "Environnements configurés!"
    return $true
}

# Fonction pour configurer les outils de développement
function Set-DevToolsConfiguration {
    Write-Log "Configuration des outils de développement..."
    
    # Configuration ESLint
    if (Test-Path "Angular\Tuto-Angular\.eslintrc.json") {
        Write-Log "Configuration d'ESLint..."
        
        # Installer ESLint globalement si nécessaire
        try {
            $null = Get-Command eslint -ErrorAction Stop
        } catch {
            $process = Start-Process -FilePath "npm" -ArgumentList @("install", "-g", "eslint") -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -ne 0) {
                Write-Warning "Échec de l'installation globale d'ESLint"
            }
        }
        
        Write-Success "ESLint configuré!"
    } else {
        Write-Warning "Fichier .eslintrc.json non trouvé. Configuration ESLint ignorée."
    }
    
    # Configuration Prettier
    if (Test-Path "Angular\Tuto-Angular\.prettierrc") {
        Write-Log "Configuration de Prettier..."
        
        # Installer Prettier globalement si nécessaire
        try {
            $null = Get-Command prettier -ErrorAction Stop
        } catch {
            $process = Start-Process -FilePath "npm" -ArgumentList @("install", "-g", "prettier") -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -ne 0) {
                Write-Warning "Échec de l'installation globale de Prettier"
            }
        }
        
        Write-Success "Prettier configuré!"
    } else {
        Write-Warning "Fichier .prettierrc non trouvé. Configuration Prettier ignorée."
    }
    
    Write-Success "Outils de développement configurés!"
    return $true
}

# Fonction pour configurer tout
function Set-AllConfiguration {
    Write-Log "Configuration complète..."
    
    Set-DevelopmentEnvironment | Out-Null
    Set-DatabaseConfiguration | Out-Null
    Set-DockerConfiguration | Out-Null
    Set-NginxConfiguration | Out-Null
    Set-CICDConfiguration | Out-Null
    Set-EnvironmentsConfiguration | Out-Null
    Set-DevToolsConfiguration | Out-Null
    
    Write-Success "Configuration complète terminée!"
    return $true
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\config.ps1 [CONFIG_TYPE] [OPTIONS]" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Configuration Types:" -ForegroundColor $Colors.White
    Write-Host "  all         Toutes les configurations (défaut)" -ForegroundColor $Colors.White
    Write-Host "  development Configuration de l'environnement de développement" -ForegroundColor $Colors.White
    Write-Host "  database    Configuration de la base de données" -ForegroundColor $Colors.White
    Write-Host "  docker      Configuration de Docker" -ForegroundColor $Colors.White
    Write-Host "  nginx       Configuration de Nginx" -ForegroundColor $Colors.White
    Write-Host "  cicd        Configuration de CI/CD" -ForegroundColor $Colors.White
    Write-Host "  environments Configuration des environnements" -ForegroundColor $Colors.White
    Write-Host "  dev-tools   Configuration des outils de développement" -ForegroundColor $Colors.White
    Write-Host "  help        Afficher cette aide" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Colors.White
    Write-Host "  -ConfigDir    Répertoire de configuration (défaut: config)" -ForegroundColor $Colors.White
    Write-Host "  -TemplateDir  Répertoire des modèles (défaut: templates)" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.White
    Write-Host "  .\config.ps1 all" -ForegroundColor $Colors.White
    Write-Host "  .\config.ps1 development" -ForegroundColor $Colors.White
    Write-Host "  .\config.ps1 all -ConfigDir C:\custom\config" -ForegroundColor $Colors.White
}

# Fonction principale
function Main {
    switch ($ConfigType.ToLower()) {
        "all" {
            if (!(Test-Prerequisites)) { return }
            New-ConfigurationDirectories
            Set-AllConfiguration | Out-Null
        }
        "development" {
            if (!(Test-Prerequisites)) { return }
            New-ConfigurationDirectories
            Set-DevelopmentEnvironment | Out-Null
        }
        "database" {
            if (!(Test-Prerequisites)) { return }
            New-ConfigurationDirectories
            Set-DatabaseConfiguration | Out-Null
        }
        "docker" {
            if (!(Test-Prerequisites)) { return }
            New-ConfigurationDirectories
            Set-DockerConfiguration | Out-Null
        }
        "nginx" {
            if (!(Test-Prerequisites)) { return }
            New-ConfigurationDirectories
            Set-NginxConfiguration | Out-Null
        }
        "cicd" {
            if (!(Test-Prerequisites)) { return }
            New-ConfigurationDirectories
            Set-CICDConfiguration | Out-Null
        }
        "environments" {
            if (!(Test-Prerequisites)) { return }
            New-ConfigurationDirectories
            Set-EnvironmentsConfiguration | Out-Null
        }
        "dev-tools" {
            if (!(Test-Prerequisites)) { return }
            New-ConfigurationDirectories
            Set-DevToolsConfiguration | Out-Null
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
            Write-Error "Type de configuration inconnu: $ConfigType"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
