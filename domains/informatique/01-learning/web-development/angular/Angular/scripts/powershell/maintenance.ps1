# Script de maintenance pour le tutoriel Angular n-tier (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$MaintenanceType = "all",
    
    [Parameter(Position=1)]
    [string]$BackupPath = "",
    
    [Parameter(Position=2)]
    [string]$BackupDir = "backups",
    
    [Parameter(Position=3)]
    [string]$LogDir = "logs"
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

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis de maintenance..."
    
    if (-not (Test-Command "node")) {
        Write-Error "Node.js n'est pas installé. Veuillez l'installer."
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-Error "npm n'est pas installé. Veuillez installer Node.js qui inclut npm."
        exit 1
    }
    
    if (-not (Test-Command "python")) {
        Write-Error "Python n'est pas installé. Veuillez l'installer."
        exit 1
    }
    
    if (-not (Test-Command "pip")) {
        Write-Error "pip n'est pas installé. Veuillez installer pip pour Python."
        exit 1
    }
    
    if (-not (Test-Command "docker")) {
        Write-Warning "Docker n'est pas installé. La maintenance Docker sera ignorée."
    }
    
    if (-not (Test-Command "psql")) {
        Write-Warning "PostgreSQL n'est pas installé. La maintenance de la base de données sera ignorée."
    }
    
    Write-Success "Prérequis de maintenance vérifiés!"
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

# Fonction pour créer les répertoires nécessaires
function New-Directories {
    Write-Log "Création des répertoires nécessaires..."
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir | Out-Null
    }
    if (-not (Test-Path "Angular\Tuto-Angular\logs")) {
        New-Item -ItemType Directory -Path "Angular\Tuto-Angular\logs" | Out-Null
    }
    if (-not (Test-Path "Angular\Tuto-Angular\backend\logs")) {
        New-Item -ItemType Directory -Path "Angular\Tuto-Angular\backend\logs" | Out-Null
    }
    
    Write-Success "Répertoires créés!"
}

# Fonction pour sauvegarder les données
function Backup-Data {
    Write-Log "Sauvegarde des données..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = "$BackupDir\backup_$timestamp"
    
    if (-not (Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath | Out-Null
    }
    
    # Sauvegarder le code source
    Write-Log "Sauvegarde du code source..."
    Compress-Archive -Path "Angular\Tuto-Angular\*" -DestinationPath "$backupPath\source_code.zip" -Force
    
    # Sauvegarder la base de données
    if (Test-Command "psql") {
        Write-Log "Sauvegarde de la base de données..."
        pg_dump tuto_angular | Out-File -FilePath "$backupPath\database.sql" -Encoding UTF8
    }
    else {
        Write-Warning "PostgreSQL n'est pas installé. Sauvegarde de la base de données ignorée."
    }
    
    # Sauvegarder les logs
    Write-Log "Sauvegarde des logs..."
    if (Test-Path "Angular\Tuto-Angular\logs") {
        Compress-Archive -Path "Angular\Tuto-Angular\logs\*" -DestinationPath "$backupPath\logs.zip" -Force
    }
    
    # Sauvegarder les configurations
    Write-Log "Sauvegarde des configurations..."
    if (Test-Path "Angular\Tuto-Angular\backend\config.env") {
        Copy-Item "Angular\Tuto-Angular\backend\config.env" $backupPath
    }
    if (Test-Path "Angular\Tuto-Angular\src\environments") {
        Copy-Item "Angular\Tuto-Angular\src\environments" "$backupPath\environments" -Recurse -Force
    }
    
    Write-Success "Sauvegarde terminée: $backupPath"
}

# Fonction pour nettoyer les logs
function Clear-Logs {
    Write-Log "Nettoyage des logs..."
    
    # Nettoyer les logs anciens (plus de 30 jours)
    $cutoffDate = (Get-Date).AddDays(-30)
    
    Get-ChildItem -Path "Angular\Tuto-Angular\logs" -Filter "*.log" | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item -Force
    Get-ChildItem -Path "Angular\Tuto-Angular\backend\logs" -Filter "*.log" | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item -Force
    Get-ChildItem -Path $LogDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt $cutoffDate } | Remove-Item -Force
    
    # Nettoyer les logs de taille importante (plus de 100MB)
    $maxSize = 100MB
    
    Get-ChildItem -Path "Angular\Tuto-Angular\logs" -Filter "*.log" | Where-Object { $_.Length -gt $maxSize } | Remove-Item -Force
    Get-ChildItem -Path "Angular\Tuto-Angular\backend\logs" -Filter "*.log" | Where-Object { $_.Length -gt $maxSize } | Remove-Item -Force
    Get-ChildItem -Path $LogDir -Filter "*.log" | Where-Object { $_.Length -gt $maxSize } | Remove-Item -Force
    
    Write-Success "Logs nettoyés!"
}

# Fonction pour nettoyer les fichiers temporaires
function Clear-TempFiles {
    Write-Log "Nettoyage des fichiers temporaires..."
    
    # Nettoyer le frontend
    if (Test-Path "Angular\Tuto-Angular\dist") {
        Remove-Item "Angular\Tuto-Angular\dist" -Recurse -Force
    }
    if (Test-Path "Angular\Tuto-Angular\out-tsc") {
        Remove-Item "Angular\Tuto-Angular\out-tsc" -Recurse -Force
    }
    if (Test-Path "Angular\Tuto-Angular\node_modules\.cache") {
        Remove-Item "Angular\Tuto-Angular\node_modules\.cache" -Recurse -Force
    }
    
    # Nettoyer le backend
    Get-ChildItem -Path "Angular\Tuto-Angular\backend" -Recurse -Directory -Name "__pycache__" | Remove-Item -Recurse -Force
    Get-ChildItem -Path "Angular\Tuto-Angular\backend" -Recurse -Filter "*.pyc" | Remove-Item -Force
    Get-ChildItem -Path "Angular\Tuto-Angular\backend" -Recurse -Filter "*.pyo" | Remove-Item -Force
    Get-ChildItem -Path "Angular\Tuto-Angular\backend" -Recurse -Filter "*.pyd" | Remove-Item -Force
    
    # Nettoyer les fichiers temporaires système
    if (Test-Path "$env:TEMP\tuto-angular*") {
        Remove-Item "$env:TEMP\tuto-angular*" -Recurse -Force
    }
    if (Test-Path "$env:LOCALAPPDATA\cache\tuto-angular*") {
        Remove-Item "$env:LOCALAPPDATA\cache\tuto-angular*" -Recurse -Force
    }
    
    Write-Success "Fichiers temporaires nettoyés!"
}

# Fonction pour nettoyer les images Docker
function Clear-DockerImages {
    Write-Log "Nettoyage des images Docker..."
    
    if (-not (Test-Command "docker")) {
        Write-Warning "Docker n'est pas installé. Nettoyage Docker ignoré."
        return
    }
    
    # Nettoyer les images non utilisées
    docker image prune -f
    
    # Nettoyer les conteneurs arrêtés
    docker container prune -f
    
    # Nettoyer les volumes non utilisés
    docker volume prune -f
    
    # Nettoyer les réseaux non utilisés
    docker network prune -f
    
    Write-Success "Images Docker nettoyées!"
}

# Fonction pour mettre à jour les dépendances
function Update-Dependencies {
    Write-Log "Mise à jour des dépendances..."
    
    # Frontend
    Write-Log "Mise à jour des dépendances frontend..."
    Set-Location "Angular\Tuto-Angular"
    npm update
    npm audit fix
    Set-Location "..\.."
    
    # Backend
    Write-Log "Mise à jour des dépendances backend..."
    Set-Location "Angular\Tuto-Angular\backend"
    pip install --upgrade pip
    pip install --upgrade -r requirements.txt
    Set-Location "..\..\.."
    
    Write-Success "Dépendances mises à jour!"
}

# Fonction pour vérifier la santé de l'application
function Test-Health {
    Write-Log "Vérification de la santé de l'application..."
    
    # Vérifier les dépendances
    Write-Log "Vérification des dépendances..."
    
    # Frontend
    Set-Location "Angular\Tuto-Angular"
    npm audit
    Set-Location "..\.."
    
    # Backend
    Set-Location "Angular\Tuto-Angular\backend"
    pip check
    Set-Location "..\..\.."
    
    # Vérifier la base de données
    if (Test-Command "psql") {
        Write-Log "Vérification de la base de données..."
        try {
            psql -d tuto_angular -c "SELECT version();" | Out-Null
        }
        catch {
            Write-Warning "Connexion à la base de données échouée"
        }
    }
    
    # Vérifier les services Docker
    if (Test-Command "docker") {
        Write-Log "Vérification des services Docker..."
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    }
    
    Write-Success "Vérification de santé terminée!"
}

# Fonction pour générer un rapport de maintenance
function New-MaintenanceReport {
    Write-Log "Génération du rapport de maintenance..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = "$LogDir\maintenance_report_$timestamp.txt"
    
    $reportContent = @"
Rapport de maintenance - Tuto Angular n-tier
Généré le: $(Get-Date)
Type de maintenance: $MaintenanceType

=== Informations système ===
OS: $($env:OS)
Architecture: $($env:PROCESSOR_ARCHITECTURE)
Node.js: $(node --version)
npm: $(npm --version)
Python: $(python --version)
pip: $(pip --version)

=== Espace disque ===
$(Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}} | Format-Table -AutoSize)

=== Mémoire ===
$(Get-WmiObject -Class Win32_OperatingSystem | Select-Object @{Name="TotalMemory(GB)";Expression={[math]::Round($_.TotalVisibleMemorySize/1MB,2)}}, @{Name="FreeMemory(GB)";Expression={[math]::Round($_.FreePhysicalMemory/1MB,2)}} | Format-Table -AutoSize)

=== Processus ===
$(Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, CPU, WorkingSet | Format-Table -AutoSize)

=== Services Docker ===
"@
    
    if (Test-Command "docker") {
        $reportContent += "`n$(docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}')"
    }
    else {
        $reportContent += "`nDocker non disponible"
    }
    
    $reportContent += @"

=== Base de données ===
"@
    
    if (Test-Command "psql") {
        try {
            $reportContent += "`n$(psql -d tuto_angular -c 'SELECT version();')"
        }
        catch {
            $reportContent += "`nPostgreSQL non disponible"
        }
    }
    else {
        $reportContent += "`nPostgreSQL non disponible"
    }
    
    $reportContent += @"

=== Logs récents ===
"@
    
    if (Test-Path "Angular\Tuto-Angular\logs\*.log") {
        $reportContent += "`n$(Get-Content 'Angular\Tuto-Angular\logs\*.log' | Select-Object -Last 50)"
    }
    else {
        $reportContent += "`nAucun log récent"
    }
    
    $reportContent += @"

=== Erreurs récentes ===
"@
    
    if (Test-Path "Angular\Tuto-Angular\logs\*.log") {
        $reportContent += "`n$(Get-Content 'Angular\Tuto-Angular\logs\*.log' | Select-String -Pattern 'error' -CaseSensitive:$false | Select-Object -Last 20)"
    }
    else {
        $reportContent += "`nAucune erreur récente"
    }
    
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    
    Write-Success "Rapport de maintenance généré: $reportFile"
}

# Fonction pour restaurer depuis une sauvegarde
function Restore-FromBackup {
    Write-Log "Restauration depuis une sauvegarde..."
    
    if ([string]::IsNullOrEmpty($BackupPath)) {
        Write-Error "Chemin de sauvegarde non spécifié"
        exit 1
    }
    
    if (-not (Test-Path $BackupPath)) {
        Write-Error "Répertoire de sauvegarde non trouvé: $BackupPath"
        exit 1
    }
    
    # Restaurer le code source
    Write-Log "Restauration du code source..."
    if (Test-Path "$BackupPath\source_code.zip") {
        Expand-Archive -Path "$BackupPath\source_code.zip" -DestinationPath "." -Force
    }
    
    # Restaurer la base de données
    if (Test-Path "$BackupPath\database.sql") {
        if (Test-Command "psql") {
            Write-Log "Restauration de la base de données..."
            Get-Content "$BackupPath\database.sql" | psql -d tuto_angular
        }
    }
    
    # Restaurer les logs
    if (Test-Path "$BackupPath\logs.zip") {
        Write-Log "Restauration des logs..."
        Expand-Archive -Path "$BackupPath\logs.zip" -DestinationPath "Angular\Tuto-Angular\logs" -Force
    }
    
    # Restaurer les configurations
    if (Test-Path "$BackupPath\config.env") {
        Write-Log "Restauration des configurations..."
        Copy-Item "$BackupPath\config.env" "Angular\Tuto-Angular\backend\"
    }
    if (Test-Path "$BackupPath\environments") {
        Copy-Item "$BackupPath\environments" "Angular\Tuto-Angular\src\environments" -Recurse -Force
    }
    
    Write-Success "Restauration terminée!"
}

# Fonction pour surveiller les performances
function Monitor-Performance {
    Write-Log "Surveillance des performances..."
    
    # Surveiller l'utilisation CPU
    Write-Log "Utilisation CPU:"
    Get-WmiObject -Class Win32_Processor | Select-Object LoadPercentage
    
    # Surveiller l'utilisation mémoire
    Write-Log "Utilisation mémoire:"
    Get-WmiObject -Class Win32_OperatingSystem | Select-Object @{Name="TotalMemory(GB)";Expression={[math]::Round($_.TotalVisibleMemorySize/1MB,2)}}, @{Name="FreeMemory(GB)";Expression={[math]::Round($_.FreePhysicalMemory/1MB,2)}}
    
    # Surveiller l'espace disque
    Write-Log "Espace disque:"
    Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
    
    # Surveiller les processus
    Write-Log "Processus les plus gourmands:"
    Get-Process | Sort-Object CPU -Descending | Select-Object -First 10 Name, CPU, WorkingSet
    
    Write-Success "Surveillance des performances terminée!"
}

# Fonction pour nettoyer
function Clear-All {
    Write-Log "Nettoyage complet..."
    
    Clear-Logs
    Clear-TempFiles
    Clear-DockerImages
    
    Write-Success "Nettoyage complet terminé!"
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\maintenance.ps1 [MAINTENANCE_TYPE] [BACKUP_PATH] [BACKUP_DIR] [LOG_DIR]"
    Write-Host ""
    Write-Host "Maintenance Types:"
    Write-Host "  all         Toutes les tâches de maintenance (défaut)"
    Write-Host "  backup      Sauvegarde des données"
    Write-Host "  clean       Nettoyage des fichiers temporaires"
    Write-Host "  logs        Nettoyage des logs"
    Write-Host "  docker      Nettoyage des images Docker"
    Write-Host "  update      Mise à jour des dépendances"
    Write-Host "  health      Vérification de la santé"
    Write-Host "  report      Génération du rapport de maintenance"
    Write-Host "  restore     Restauration depuis une sauvegarde"
    Write-Host "  monitor     Surveillance des performances"
    Write-Host "  help        Afficher cette aide"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  BackupPath  Chemin de sauvegarde pour la restauration"
    Write-Host "  BackupDir   Répertoire de sauvegarde (défaut: backups)"
    Write-Host "  LogDir      Répertoire des logs (défaut: logs)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\maintenance.ps1 backup"
    Write-Host "  .\maintenance.ps1 clean"
    Write-Host "  .\maintenance.ps1 restore C:\path\to\backup"
    Write-Host "  .\maintenance.ps1 all -BackupDir C:\custom\backup"
}

# Fonction principale
function Main {
    switch ($MaintenanceType.ToLower()) {
        "all" { 
            Test-Prerequisites
            New-Directories
            Backup-Data
            Clear-Logs
            Clear-TempFiles
            Clear-DockerImages
            Update-Dependencies
            Test-Health
            New-MaintenanceReport
        }
        "backup" { 
            Test-Prerequisites
            New-Directories
            Backup-Data
        }
        "clean" { 
            Clear-TempFiles
            Clear-DockerImages
        }
        "logs" { Clear-Logs }
        "docker" { Clear-DockerImages }
        "update" { 
            Test-Prerequisites
            Update-Dependencies
        }
        "health" { Test-Health }
        "report" { 
            New-Directories
            New-MaintenanceReport
        }
        "restore" { Restore-FromBackup }
        "monitor" { Monitor-Performance }
        "help" { Show-Help }
        "--help" { Show-Help }
        "-h" { Show-Help }
        default { 
            Write-Error "Type de maintenance inconnu: $MaintenanceType"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
