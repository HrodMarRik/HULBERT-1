# Script de sécurité pour le tutoriel Angular n-tier (PowerShell)

param(
    [string]$SecurityType = "all",
    [string]$SecurityDir = $env:SECURITY_DIR ?? "security",
    [string]$LogFile = $env:LOG_FILE ?? "security.log"
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
    $logMessage = "[INFO] $Message"
    Write-Host $logMessage -ForegroundColor $Colors.Blue
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-Success {
    param([string]$Message)
    $logMessage = "[SUCCESS] $Message"
    Write-Host $logMessage -ForegroundColor $Colors.Green
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-Warning {
    param([string]$Message)
    $logMessage = "[WARNING] $Message"
    Write-Host $logMessage -ForegroundColor $Colors.Yellow
    Add-Content -Path $LogFile -Value $logMessage
}

function Write-Error {
    param([string]$Message)
    $logMessage = "[ERROR] $Message"
    Write-Host $logMessage -ForegroundColor $Colors.Red
    Add-Content -Path $LogFile -Value $logMessage
}

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis de sécurité..."
    
    $prerequisites = @{
        "nmap" = $false
        "openssl" = $false
        "docker" = $false
    }
    
    # Vérifier nmap
    try {
        $null = Get-Command nmap -ErrorAction Stop
        $prerequisites["nmap"] = $true
    } catch {
        Write-Warning "nmap n'est pas installé. Certaines vérifications de sécurité seront limitées."
    }
    
    # Vérifier OpenSSL
    try {
        $null = Get-Command openssl -ErrorAction Stop
        $prerequisites["openssl"] = $true
    } catch {
        Write-Warning "OpenSSL n'est pas installé. Certaines vérifications de sécurité seront limitées."
    }
    
    # Vérifier Docker
    try {
        $null = Get-Command docker -ErrorAction Stop
        $prerequisites["docker"] = $true
    } catch {
        Write-Warning "Docker n'est pas installé. Certaines vérifications de sécurité seront limitées."
    }
    
    Write-Success "Prérequis de sécurité vérifiés!"
    return $true
}

# Fonction pour créer les répertoires nécessaires
function New-SecurityDirectories {
    Write-Log "Création des répertoires nécessaires..."
    
    $directories = @(
        $SecurityDir,
        "$SecurityDir\scans",
        "$SecurityDir\reports",
        "$SecurityDir\certificates",
        "$SecurityDir\keys",
        "$SecurityDir\policies"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Répertoires créés!"
}

# Fonction pour scanner les ports ouverts
function Invoke-PortScan {
    Write-Log "Scan des ports ouverts..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $scanFile = "$SecurityDir\scans\port_scan_$timestamp.txt"
    
    try {
        $null = Get-Command nmap -ErrorAction Stop
        
        $process = Start-Process -FilePath "nmap" -ArgumentList @("-sS", "-O", "-sV", "localhost") -RedirectStandardOutput $scanFile -RedirectStandardError $scanFile -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Success "Scan des ports terminé: $scanFile"
        } else {
            Write-Error "Échec du scan des ports"
            return $false
        }
    } catch {
        Write-Warning "nmap n'est pas installé. Scan des ports ignoré."
    }
    
    return $true
}

# Fonction pour vérifier les certificats SSL
function Test-SSLCertificates {
    Write-Log "Vérification des certificats SSL..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $certFile = "$SecurityDir\reports\ssl_certificates_$timestamp.txt"
    
    try {
        $null = Get-Command openssl -ErrorAction Stop
        
        # Vérifier les certificats locaux
        $certFiles = Get-ChildItem -Path . -Recurse -Include "*.crt", "*.pem", "*.key" -File
        foreach ($cert in $certFiles) {
            Add-Content -Path $certFile -Value "=== $($cert.FullName) ==="
            $process = Start-Process -FilePath "openssl" -ArgumentList @("x509", "-in", $cert.FullName, "-text", "-noout") -RedirectStandardOutput $certFile -RedirectStandardError $certFile -Wait -PassThru -NoNewWindow
            Add-Content -Path $certFile -Value ""
        }
        
        Write-Success "Vérification des certificats SSL terminée: $certFile"
    } catch {
        Write-Warning "OpenSSL n'est pas installé. Vérification des certificats SSL ignorée."
    }
    
    return $true
}

# Fonction pour vérifier les vulnérabilités Docker
function Test-DockerSecurity {
    Write-Log "Vérification de la sécurité Docker..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $dockerFile = "$SecurityDir\reports\docker_security_$timestamp.txt"
    
    try {
        $null = Get-Command docker -ErrorAction Stop
        
        # Vérifier les images Docker
        $process = Start-Process -FilePath "docker" -ArgumentList @("images", "--format", "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}") -RedirectStandardOutput $dockerFile -Wait -PassThru -NoNewWindow
        
        # Vérifier les conteneurs en cours d'exécution
        Add-Content -Path $dockerFile -Value "`n=== Conteneurs en cours d'exécution ==="
        $process = Start-Process -FilePath "docker" -ArgumentList @("ps", "--format", "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}") -RedirectStandardOutput $dockerFile -Wait -PassThru -NoNewWindow
        
        # Vérifier les volumes
        Add-Content -Path $dockerFile -Value "`n=== Volumes Docker ==="
        $process = Start-Process -FilePath "docker" -ArgumentList @("volume", "ls") -RedirectStandardOutput $dockerFile -Wait -PassThru -NoNewWindow
        
        # Vérifier les réseaux
        Add-Content -Path $dockerFile -Value "`n=== Réseaux Docker ==="
        $process = Start-Process -FilePath "docker" -ArgumentList @("network", "ls") -RedirectStandardOutput $dockerFile -Wait -PassThru -NoNewWindow
        
        Write-Success "Vérification de la sécurité Docker terminée: $dockerFile"
    } catch {
        Write-Warning "Docker n'est pas installé. Vérification de la sécurité Docker ignorée."
    }
    
    return $true
}

# Fonction pour vérifier les permissions des fichiers
function Test-FilePermissions {
    Write-Log "Vérification des permissions des fichiers..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $permFile = "$SecurityDir\reports\file_permissions_$timestamp.txt"
    
    # Vérifier les fichiers avec des permissions trop permissives
    $files = Get-ChildItem -Path . -Recurse -File | Where-Object {
        $_.Attributes -match "777" -or
        $_.Attributes -match "666" -or
        $_.Attributes -match "644"
    }
    
    foreach ($file in $files) {
        Add-Content -Path $permFile -Value $file.FullName
    }
    
    # Vérifier les fichiers avec des permissions d'exécution
    $execFiles = Get-ChildItem -Path . -Recurse -File | Where-Object {
        $_.Attributes -match "111"
    }
    
    foreach ($file in $execFiles) {
        Add-Content -Path $permFile -Value $file.FullName
    }
    
    Write-Success "Vérification des permissions des fichiers terminée: $permFile"
    return $true
}

# Fonction pour vérifier les mots de passe faibles
function Test-WeakPasswords {
    Write-Log "Vérification des mots de passe faibles..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $passwordFile = "$SecurityDir\reports\weak_passwords_$timestamp.txt"
    
    # Rechercher les mots de passe dans les fichiers de configuration
    $configFiles = Get-ChildItem -Path . -Recurse -Include "*.env", "*.conf", "*.config", "*.json", "*.yaml", "*.yml" -File
    
    foreach ($file in $configFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "(?i)(password|passwd|pwd)") {
            Add-Content -Path $passwordFile -Value "$($file.FullName): $content"
        }
    }
    
    Write-Success "Vérification des mots de passe faibles terminée: $passwordFile"
    return $true
}

# Fonction pour vérifier les dépendances vulnérables
function Test-VulnerableDependencies {
    Write-Log "Vérification des dépendances vulnérables..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $depsFile = "$SecurityDir\reports\vulnerable_dependencies_$timestamp.txt"
    
    # Vérifier les dépendances npm
    if (Test-Path "package.json") {
        Add-Content -Path $depsFile -Value "=== Dépendances npm ==="
        try {
            $process = Start-Process -FilePath "npm" -ArgumentList @("audit", "--json") -RedirectStandardOutput $depsFile -Wait -PassThru -NoNewWindow
        } catch {
            Add-Content -Path $depsFile -Value "npm audit non disponible"
        }
    }
    
    # Vérifier les dépendances Python
    if (Test-Path "requirements.txt") {
        Add-Content -Path $depsFile -Value "`n=== Dépendances Python ==="
        try {
            $process = Start-Process -FilePath "pip-audit" -ArgumentList @() -RedirectStandardOutput $depsFile -Wait -PassThru -NoNewWindow
        } catch {
            Add-Content -Path $depsFile -Value "pip-audit non disponible"
        }
    }
    
    Write-Success "Vérification des dépendances vulnérables terminée: $depsFile"
    return $true
}

# Fonction pour générer un rapport de sécurité
function New-SecurityReport {
    Write-Log "Génération du rapport de sécurité..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = "$SecurityDir\reports\security_report_$timestamp.txt"
    
    $report = @"
=== Rapport de sécurité ===
Date: $(Get-Date)
Utilisateur: $env:USERNAME
Système: $env:COMPUTERNAME

=== Résumé des vérifications ===
Scan des ports: $(Get-ChildItem -Path "$SecurityDir\scans" -Filter "*.txt" -ErrorAction SilentlyContinue | Measure-Object).Count fichiers
Certificats SSL: $(Get-ChildItem -Path "$SecurityDir\reports" -Filter "*ssl_certificates*.txt" -ErrorAction SilentlyContinue | Measure-Object).Count fichiers
Sécurité Docker: $(Get-ChildItem -Path "$SecurityDir\reports" -Filter "*docker_security*.txt" -ErrorAction SilentlyContinue | Measure-Object).Count fichiers
Permissions fichiers: $(Get-ChildItem -Path "$SecurityDir\reports" -Filter "*file_permissions*.txt" -ErrorAction SilentlyContinue | Measure-Object).Count fichiers
Mots de passe faibles: $(Get-ChildItem -Path "$SecurityDir\reports" -Filter "*weak_passwords*.txt" -ErrorAction SilentlyContinue | Measure-Object).Count fichiers
Dépendances vulnérables: $(Get-ChildItem -Path "$SecurityDir\reports" -Filter "*vulnerable_dependencies*.txt" -ErrorAction SilentlyContinue | Measure-Object).Count fichiers

=== Recommandations ===
1. Mettre à jour régulièrement les dépendances
2. Utiliser des mots de passe forts
3. Configurer correctement les permissions des fichiers
4. Surveiller les ports ouverts
5. Maintenir les certificats SSL à jour
6. Surveiller les conteneurs Docker

"@
    
    $report | Out-File -FilePath $reportFile -Encoding UTF8
    
    Write-Success "Rapport de sécurité généré: $reportFile"
    return $true
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\security.ps1 [SECURITY_TYPE] [OPTIONS]" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Security Types:" -ForegroundColor $Colors.White
    Write-Host "  all         Toutes les vérifications de sécurité (défaut)" -ForegroundColor $Colors.White
    Write-Host "  ports       Scan des ports ouverts" -ForegroundColor $Colors.White
    Write-Host "  ssl         Vérification des certificats SSL" -ForegroundColor $Colors.White
    Write-Host "  docker      Vérification de la sécurité Docker" -ForegroundColor $Colors.White
    Write-Host "  permissions Vérification des permissions des fichiers" -ForegroundColor $Colors.White
    Write-Host "  passwords   Vérification des mots de passe faibles" -ForegroundColor $Colors.White
    Write-Host "  dependencies Vérification des dépendances vulnérables" -ForegroundColor $Colors.White
    Write-Host "  report      Génération du rapport de sécurité" -ForegroundColor $Colors.White
    Write-Host "  help        Afficher cette aide" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Colors.White
    Write-Host "  -SecurityDir Répertoire de sécurité (défaut: security)" -ForegroundColor $Colors.White
    Write-Host "  -LogFile     Fichier de log (défaut: security.log)" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.White
    Write-Host "  .\security.ps1 all" -ForegroundColor $Colors.White
    Write-Host "  .\security.ps1 ports" -ForegroundColor $Colors.White
    Write-Host "  .\security.ps1 all -SecurityDir C:\custom\security" -ForegroundColor $Colors.White
}

# Fonction principale
function Main {
    switch ($SecurityType.ToLower()) {
        "all" {
            if (!(Test-Prerequisites)) { return }
            New-SecurityDirectories
            Invoke-PortScan | Out-Null
            Test-SSLCertificates | Out-Null
            Test-DockerSecurity | Out-Null
            Test-FilePermissions | Out-Null
            Test-WeakPasswords | Out-Null
            Test-VulnerableDependencies | Out-Null
            New-SecurityReport | Out-Null
        }
        "ports" {
            if (!(Test-Prerequisites)) { return }
            New-SecurityDirectories
            Invoke-PortScan | Out-Null
        }
        "ssl" {
            if (!(Test-Prerequisites)) { return }
            New-SecurityDirectories
            Test-SSLCertificates | Out-Null
        }
        "docker" {
            if (!(Test-Prerequisites)) { return }
            New-SecurityDirectories
            Test-DockerSecurity | Out-Null
        }
        "permissions" {
            if (!(Test-Prerequisites)) { return }
            New-SecurityDirectories
            Test-FilePermissions | Out-Null
        }
        "passwords" {
            if (!(Test-Prerequisites)) { return }
            New-SecurityDirectories
            Test-WeakPasswords | Out-Null
        }
        "dependencies" {
            if (!(Test-Prerequisites)) { return }
            New-SecurityDirectories
            Test-VulnerableDependencies | Out-Null
        }
        "report" {
            New-SecurityReport | Out-Null
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
            Write-Error "Type de vérification de sécurité inconnu: $SecurityType"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
