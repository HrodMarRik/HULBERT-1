# Script de backup pour le tutoriel Angular n-tier (PowerShell)

param(
    [string]$BackupType = "all",
    [string]$BackupDir = $env:BACKUP_DIR ?? "backups",
    [int]$RetentionDays = $env:RETENTION_DAYS ?? 30,
    [bool]$Compress = $env:COMPRESS ?? $true
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
    Write-Log "Vérification des prérequis de backup..."
    
    $prerequisites = @{
        "tar" = $false
        "gzip" = $false
        "psql" = $false
        "docker" = $false
    }
    
    # Vérifier tar
    try {
        $null = Get-Command tar -ErrorAction Stop
        $prerequisites["tar"] = $true
    } catch {
        Write-Error "tar n'est pas installé. Veuillez l'installer."
        return $false
    }
    
    # Vérifier gzip
    try {
        $null = Get-Command gzip -ErrorAction Stop
        $prerequisites["gzip"] = $true
    } catch {
        Write-Warning "gzip n'est pas installé. La compression sera limitée."
    }
    
    # Vérifier PostgreSQL
    try {
        $null = Get-Command psql -ErrorAction Stop
        $prerequisites["psql"] = $true
    } catch {
        Write-Warning "PostgreSQL n'est pas installé. Le backup de la base de données sera ignoré."
    }
    
    # Vérifier Docker
    try {
        $null = Get-Command docker -ErrorAction Stop
        $prerequisites["docker"] = $true
    } catch {
        Write-Warning "Docker n'est pas installé. Le backup des images Docker sera ignoré."
    }
    
    Write-Success "Prérequis de backup vérifiés!"
    return $true
}

# Fonction pour créer les répertoires nécessaires
function New-BackupDirectories {
    Write-Log "Création des répertoires nécessaires..."
    
    $directories = @(
        $BackupDir,
        "$BackupDir\code",
        "$BackupDir\database",
        "$BackupDir\logs",
        "$BackupDir\config",
        "$BackupDir\docker"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Répertoires créés!"
}

# Fonction pour créer un timestamp
function Get-Timestamp {
    return (Get-Date).ToString("yyyyMMdd_HHmmss")
}

# Fonction pour sauvegarder le code source
function Backup-Code {
    Write-Log "Sauvegarde du code source..."
    
    $timestamp = Get-Timestamp
    $backupFile = "$BackupDir\code\source_code_$timestamp.tar.gz"
    
    # Créer un fichier temporaire pour lister les fichiers à exclure
    $excludeFile = [System.IO.Path]::GetTempFileName()
    $excludeContent = @(
        "node_modules",
        "dist",
        "out-tsc",
        "__pycache__",
        "*.pyc",
        ".git",
        "*.log",
        "*.tmp",
        "*.swp",
        "*.swo",
        "*~",
        ".DS_Store",
        "Thumbs.db"
    )
    $excludeContent | Out-File -FilePath $excludeFile -Encoding UTF8
    
    try {
        # Créer le backup
        $filesToBackup = @(
            "Angular\",
            "backend\",
            "docs\",
            "*.md",
            "*.json",
            "*.sh",
            "*.bat",
            "*.ps1",
            "*.yml",
            "*.yaml",
            "*.conf",
            "*.env",
            "*.example"
        )
        
        $arguments = @("--exclude-from=$excludeFile", "-czf", $backupFile) + $filesToBackup
        $process = Start-Process -FilePath "tar" -ArgumentList $arguments -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0 -and (Test-Path $backupFile)) {
            $size = (Get-Item $backupFile).Length
            Write-Success "Code source sauvegardé: $backupFile (Taille: $size bytes)"
        } else {
            Write-Error "Échec de la sauvegarde du code source"
            return $false
        }
    } finally {
        Remove-Item $excludeFile -Force -ErrorAction SilentlyContinue
    }
    
    return $true
}

# Fonction pour sauvegarder la base de données
function Backup-Database {
    Write-Log "Sauvegarde de la base de données..."
    
    try {
        $null = Get-Command psql -ErrorAction Stop
    } catch {
        Write-Warning "PostgreSQL n'est pas installé. Sauvegarde de la base de données ignorée."
        return $true
    }
    
    $timestamp = Get-Timestamp
    $backupFile = "$BackupDir\database\database_$timestamp.sql"
    
    try {
        # Sauvegarde complète
        $process = Start-Process -FilePath "pg_dump" -ArgumentList @("-h", "localhost", "-U", "postgres", "-d", "tuto_angular") -RedirectStandardOutput $backupFile -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -ne 0) {
            Write-Error "Échec de la sauvegarde de la base de données"
            return $false
        }
        
        # Compresser si demandé
        if ($Compress) {
            try {
                $null = Get-Command gzip -ErrorAction Stop
                $process = Start-Process -FilePath "gzip" -ArgumentList $backupFile -Wait -PassThru -NoNewWindow
                if ($process.ExitCode -eq 0) {
                    $backupFile = "$backupFile.gz"
                }
            } catch {
                Write-Warning "gzip n'est pas disponible. Compression ignorée."
            }
        }
        
        if (Test-Path $backupFile) {
            $size = (Get-Item $backupFile).Length
            Write-Success "Base de données sauvegardée: $backupFile (Taille: $size bytes)"
        } else {
            Write-Error "Échec de la sauvegarde de la base de données"
            return $false
        }
    } catch {
        Write-Error "Erreur lors de la sauvegarde de la base de données: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

# Fonction pour sauvegarder les logs
function Backup-Logs {
    Write-Log "Sauvegarde des logs..."
    
    $timestamp = Get-Timestamp
    $backupFile = "$BackupDir\logs\logs_$timestamp.tar.gz"
    
    # Créer un fichier temporaire pour lister les logs
    $tempFile = [System.IO.Path]::GetTempFileName()
    
    try {
        # Trouver tous les fichiers de log
        $logFiles = @()
        $logFiles += Get-ChildItem -Path . -Recurse -Include "*.log" -File | Select-Object -ExpandProperty FullName
        $logFiles += Get-ChildItem -Path . -Recurse -Include "*.out" -File | Select-Object -ExpandProperty FullName
        $logFiles += Get-ChildItem -Path . -Recurse -Include "*.err" -File | Select-Object -ExpandProperty FullName
        
        if ($logFiles.Count -gt 0) {
            $logFiles | Out-File -FilePath $tempFile -Encoding UTF8
            
            $process = Start-Process -FilePath "tar" -ArgumentList @("-czf", $backupFile, "-T", $tempFile) -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -eq 0 -and (Test-Path $backupFile)) {
                $size = (Get-Item $backupFile).Length
                Write-Success "Logs sauvegardés: $backupFile (Taille: $size bytes)"
            } else {
                Write-Error "Échec de la sauvegarde des logs"
                return $false
            }
        } else {
            Write-Warning "Aucun fichier de log trouvé"
        }
    } finally {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
    
    return $true
}

# Fonction pour sauvegarder les configurations
function Backup-Config {
    Write-Log "Sauvegarde des configurations..."
    
    $timestamp = Get-Timestamp
    $backupFile = "$BackupDir\config\config_$timestamp.tar.gz"
    
    # Créer un fichier temporaire pour lister les configurations
    $tempFile = [System.IO.Path]::GetTempFileName()
    
    try {
        # Trouver tous les fichiers de configuration
        $configFiles = @()
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.env" -File | Select-Object -ExpandProperty FullName
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.conf" -File | Select-Object -ExpandProperty FullName
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.config" -File | Select-Object -ExpandProperty FullName
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.ini" -File | Select-Object -ExpandProperty FullName
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.yaml" -File | Select-Object -ExpandProperty FullName
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.yml" -File | Select-Object -ExpandProperty FullName
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.json" -File | Select-Object -ExpandProperty FullName
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.xml" -File | Select-Object -ExpandProperty FullName
        $configFiles += Get-ChildItem -Path . -Recurse -Include "*.properties" -File | Select-Object -ExpandProperty FullName
        
        if ($configFiles.Count -gt 0) {
            $configFiles | Out-File -FilePath $tempFile -Encoding UTF8
            
            $process = Start-Process -FilePath "tar" -ArgumentList @("-czf", $backupFile, "-T", $tempFile) -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -eq 0 -and (Test-Path $backupFile)) {
                $size = (Get-Item $backupFile).Length
                Write-Success "Configurations sauvegardées: $backupFile (Taille: $size bytes)"
            } else {
                Write-Error "Échec de la sauvegarde des configurations"
                return $false
            }
        } else {
            Write-Warning "Aucun fichier de configuration trouvé"
        }
    } finally {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
    
    return $true
}

# Fonction pour sauvegarder les images Docker
function Backup-Docker {
    Write-Log "Sauvegarde des images Docker..."
    
    try {
        $null = Get-Command docker -ErrorAction Stop
    } catch {
        Write-Warning "Docker n'est pas installé. Sauvegarde des images Docker ignorée."
        return $true
    }
    
    $timestamp = Get-Timestamp
    $backupFile = "$BackupDir\docker\docker_images_$timestamp.tar"
    
    try {
        # Obtenir la liste des images Docker
        $images = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -notlike "*<none>*" }
        
        if ($images.Count -gt 0) {
            # Sauvegarder les images Docker
            $process = Start-Process -FilePath "docker" -ArgumentList @("save", "-o", $backupFile) + $images -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de la sauvegarde des images Docker"
                return $false
            }
            
            # Compresser si demandé
            if ($Compress) {
                try {
                    $null = Get-Command gzip -ErrorAction Stop
                    $process = Start-Process -FilePath "gzip" -ArgumentList $backupFile -Wait -PassThru -NoNewWindow
                    if ($process.ExitCode -eq 0) {
                        $backupFile = "$backupFile.gz"
                    }
                } catch {
                    Write-Warning "gzip n'est pas disponible. Compression ignorée."
                }
            }
            
            if (Test-Path $backupFile) {
                $size = (Get-Item $backupFile).Length
                Write-Success "Images Docker sauvegardées: $backupFile (Taille: $size bytes)"
            } else {
                Write-Error "Échec de la sauvegarde des images Docker"
                return $false
            }
        } else {
            Write-Warning "Aucune image Docker trouvée"
        }
    } catch {
        Write-Error "Erreur lors de la sauvegarde des images Docker: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

# Fonction pour créer un backup complet
function Backup-All {
    Write-Log "Création d'un backup complet..."
    
    $timestamp = Get-Timestamp
    $backupFile = "$BackupDir\complete_backup_$timestamp.tar.gz"
    
    # Créer un fichier temporaire pour lister les fichiers à sauvegarder
    $tempFile = [System.IO.Path]::GetTempFileName()
    
    try {
        # Lister tous les fichiers à sauvegarder
        $allFiles = Get-ChildItem -Path . -Recurse -File | Where-Object {
            $_.FullName -notlike "*$BackupDir*" -and
            $_.FullName -notlike "*node_modules*" -and
            $_.FullName -notlike "*dist*" -and
            $_.FullName -notlike "*out-tsc*" -and
            $_.FullName -notlike "*__pycache__*" -and
            $_.FullName -notlike "*.git*" -and
            $_.Extension -ne ".log" -and
            $_.Extension -ne ".tmp" -and
            $_.Extension -ne ".swp" -and
            $_.Extension -ne ".swo" -and
            $_.Name -notlike "*~" -and
            $_.Name -ne ".DS_Store" -and
            $_.Name -ne "Thumbs.db"
        } | Select-Object -ExpandProperty FullName
        
        if ($allFiles.Count -gt 0) {
            $allFiles | Out-File -FilePath $tempFile -Encoding UTF8
            
            $process = Start-Process -FilePath "tar" -ArgumentList @("-czf", $backupFile, "-T", $tempFile) -Wait -PassThru -NoNewWindow
            
            if ($process.ExitCode -eq 0 -and (Test-Path $backupFile)) {
                $size = (Get-Item $backupFile).Length
                Write-Success "Backup complet créé: $backupFile (Taille: $size bytes)"
            } else {
                Write-Error "Échec de la sauvegarde complète"
                return $false
            }
        } else {
            Write-Error "Aucun fichier à sauvegarder"
            return $false
        }
    } finally {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
    
    return $true
}

# Fonction pour nettoyer les anciens backups
function Remove-OldBackups {
    Write-Log "Nettoyage des anciens backups..."
    
    $deletedCount = 0
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    
    # Nettoyer les backups de code
    if (Test-Path "$BackupDir\code") {
        $oldBackups = Get-ChildItem -Path "$BackupDir\code" -Filter "*.tar.gz" | Where-Object { $_.LastWriteTime -lt $cutoffDate }
        $deletedCount += $oldBackups.Count
        $oldBackups | Remove-Item -Force
    }
    
    # Nettoyer les backups de base de données
    if (Test-Path "$BackupDir\database") {
        $oldBackups = Get-ChildItem -Path "$BackupDir\database" -Filter "*.sql*" | Where-Object { $_.LastWriteTime -lt $cutoffDate }
        $deletedCount += $oldBackups.Count
        $oldBackups | Remove-Item -Force
    }
    
    # Nettoyer les backups de logs
    if (Test-Path "$BackupDir\logs") {
        $oldBackups = Get-ChildItem -Path "$BackupDir\logs" -Filter "*.tar.gz" | Where-Object { $_.LastWriteTime -lt $cutoffDate }
        $deletedCount += $oldBackups.Count
        $oldBackups | Remove-Item -Force
    }
    
    # Nettoyer les backups de configuration
    if (Test-Path "$BackupDir\config") {
        $oldBackups = Get-ChildItem -Path "$BackupDir\config" -Filter "*.tar.gz" | Where-Object { $_.LastWriteTime -lt $cutoffDate }
        $deletedCount += $oldBackups.Count
        $oldBackups | Remove-Item -Force
    }
    
    # Nettoyer les backups Docker
    if (Test-Path "$BackupDir\docker") {
        $oldBackups = Get-ChildItem -Path "$BackupDir\docker" -Filter "*.tar*" | Where-Object { $_.LastWriteTime -lt $cutoffDate }
        $deletedCount += $oldBackups.Count
        $oldBackups | Remove-Item -Force
    }
    
    # Nettoyer les backups complets
    if (Test-Path $BackupDir) {
        $oldBackups = Get-ChildItem -Path $BackupDir -Filter "complete_backup_*.tar.gz" | Where-Object { $_.LastWriteTime -lt $cutoffDate }
        $deletedCount += $oldBackups.Count
        $oldBackups | Remove-Item -Force
    }
    
    if ($deletedCount -gt 0) {
        Write-Success "Anciens backups nettoyés: $deletedCount fichiers supprimés"
    } else {
        Write-Log "Aucun ancien backup à nettoyer"
    }
}

# Fonction pour vérifier l'intégrité des backups
function Test-BackupIntegrity {
    Write-Log "Vérification de l'intégrité des backups..."
    
    $verifiedCount = 0
    $failedCount = 0
    
    # Vérifier les backups de code
    if (Test-Path "$BackupDir\code") {
        $backups = Get-ChildItem -Path "$BackupDir\code" -Filter "*.tar.gz"
        foreach ($backup in $backups) {
            $process = Start-Process -FilePath "tar" -ArgumentList @("-tzf", $backup.FullName) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
            if ($process.ExitCode -eq 0) {
                $verifiedCount++
            } else {
                $failedCount++
                Write-Warning "Backup corrompu: $($backup.FullName)"
            }
        }
    }
    
    # Vérifier les backups de base de données
    if (Test-Path "$BackupDir\database") {
        $backups = Get-ChildItem -Path "$BackupDir\database" -Filter "*.sql*"
        foreach ($backup in $backups) {
            if ($backup.Extension -eq ".gz") {
                $process = Start-Process -FilePath "gzip" -ArgumentList @("-t", $backup.FullName) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
                if ($process.ExitCode -eq 0) {
                    $verifiedCount++
                } else {
                    $failedCount++
                    Write-Warning "Backup corrompu: $($backup.FullName)"
                }
            } else {
                $verifiedCount++
            }
        }
    }
    
    # Vérifier les backups de logs
    if (Test-Path "$BackupDir\logs") {
        $backups = Get-ChildItem -Path "$BackupDir\logs" -Filter "*.tar.gz"
        foreach ($backup in $backups) {
            $process = Start-Process -FilePath "tar" -ArgumentList @("-tzf", $backup.FullName) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
            if ($process.ExitCode -eq 0) {
                $verifiedCount++
            } else {
                $failedCount++
                Write-Warning "Backup corrompu: $($backup.FullName)"
            }
        }
    }
    
    # Vérifier les backups de configuration
    if (Test-Path "$BackupDir\config") {
        $backups = Get-ChildItem -Path "$BackupDir\config" -Filter "*.tar.gz"
        foreach ($backup in $backups) {
            $process = Start-Process -FilePath "tar" -ArgumentList @("-tzf", $backup.FullName) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
            if ($process.ExitCode -eq 0) {
                $verifiedCount++
            } else {
                $failedCount++
                Write-Warning "Backup corrompu: $($backup.FullName)"
            }
        }
    }
    
    # Vérifier les backups Docker
    if (Test-Path "$BackupDir\docker") {
        $backups = Get-ChildItem -Path "$BackupDir\docker" -Filter "*.tar*"
        foreach ($backup in $backups) {
            if ($backup.Extension -eq ".gz") {
                $process = Start-Process -FilePath "gzip" -ArgumentList @("-t", $backup.FullName) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
                if ($process.ExitCode -eq 0) {
                    $verifiedCount++
                } else {
                    $failedCount++
                    Write-Warning "Backup corrompu: $($backup.FullName)"
                }
            } else {
                $verifiedCount++
            }
        }
    }
    
    # Vérifier les backups complets
    if (Test-Path $BackupDir) {
        $backups = Get-ChildItem -Path $BackupDir -Filter "complete_backup_*.tar.gz"
        foreach ($backup in $backups) {
            $process = Start-Process -FilePath "tar" -ArgumentList @("-tzf", $backup.FullName) -Wait -PassThru -NoNewWindow -RedirectStandardOutput $null -RedirectStandardError $null
            if ($process.ExitCode -eq 0) {
                $verifiedCount++
            } else {
                $failedCount++
                Write-Warning "Backup corrompu: $($backup.FullName)"
            }
        }
    }
    
    if ($failedCount -eq 0) {
        Write-Success "Tous les backups sont intègres ($verifiedCount fichiers vérifiés)"
    } else {
        Write-Warning "Backups vérifiés: $verifiedCount OK, $failedCount corrompus"
    }
}

# Fonction pour lister les backups
function Get-BackupList {
    Write-Log "Liste des backups disponibles..."
    
    Write-Host "=== Backups de code ===" -ForegroundColor $Colors.White
    if (Test-Path "$BackupDir\code") {
        $backups = Get-ChildItem -Path "$BackupDir\code" -Filter "*.tar.gz"
        if ($backups.Count -gt 0) {
            $backups | Format-Table Name, Length, LastWriteTime -AutoSize
        } else {
            Write-Host "Aucun backup de code" -ForegroundColor $Colors.Yellow
        }
    } else {
        Write-Host "Aucun backup de code" -ForegroundColor $Colors.Yellow
    }
    
    Write-Host "=== Backups de base de données ===" -ForegroundColor $Colors.White
    if (Test-Path "$BackupDir\database") {
        $backups = Get-ChildItem -Path "$BackupDir\database" -Filter "*.sql*"
        if ($backups.Count -gt 0) {
            $backups | Format-Table Name, Length, LastWriteTime -AutoSize
        } else {
            Write-Host "Aucun backup de base de données" -ForegroundColor $Colors.Yellow
        }
    } else {
        Write-Host "Aucun backup de base de données" -ForegroundColor $Colors.Yellow
    }
    
    Write-Host "=== Backups de logs ===" -ForegroundColor $Colors.White
    if (Test-Path "$BackupDir\logs") {
        $backups = Get-ChildItem -Path "$BackupDir\logs" -Filter "*.tar.gz"
        if ($backups.Count -gt 0) {
            $backups | Format-Table Name, Length, LastWriteTime -AutoSize
        } else {
            Write-Host "Aucun backup de logs" -ForegroundColor $Colors.Yellow
        }
    } else {
        Write-Host "Aucun backup de logs" -ForegroundColor $Colors.Yellow
    }
    
    Write-Host "=== Backups de configuration ===" -ForegroundColor $Colors.White
    if (Test-Path "$BackupDir\config") {
        $backups = Get-ChildItem -Path "$BackupDir\config" -Filter "*.tar.gz"
        if ($backups.Count -gt 0) {
            $backups | Format-Table Name, Length, LastWriteTime -AutoSize
        } else {
            Write-Host "Aucun backup de configuration" -ForegroundColor $Colors.Yellow
        }
    } else {
        Write-Host "Aucun backup de configuration" -ForegroundColor $Colors.Yellow
    }
    
    Write-Host "=== Backups Docker ===" -ForegroundColor $Colors.White
    if (Test-Path "$BackupDir\docker") {
        $backups = Get-ChildItem -Path "$BackupDir\docker" -Filter "*.tar*"
        if ($backups.Count -gt 0) {
            $backups | Format-Table Name, Length, LastWriteTime -AutoSize
        } else {
            Write-Host "Aucun backup Docker" -ForegroundColor $Colors.Yellow
        }
    } else {
        Write-Host "Aucun backup Docker" -ForegroundColor $Colors.Yellow
    }
    
    Write-Host "=== Backups complets ===" -ForegroundColor $Colors.White
    if (Test-Path $BackupDir) {
        $backups = Get-ChildItem -Path $BackupDir -Filter "complete_backup_*.tar.gz"
        if ($backups.Count -gt 0) {
            $backups | Format-Table Name, Length, LastWriteTime -AutoSize
        } else {
            Write-Host "Aucun backup complet" -ForegroundColor $Colors.Yellow
        }
    } else {
        Write-Host "Aucun backup complet" -ForegroundColor $Colors.Yellow
    }
}

# Fonction pour restaurer un backup
function Restore-Backup {
    param([string]$BackupFile)
    
    if ([string]::IsNullOrEmpty($BackupFile)) {
        Write-Error "Fichier de backup non spécifié"
        return $false
    }
    
    if (!(Test-Path $BackupFile)) {
        Write-Error "Fichier de backup non trouvé: $BackupFile"
        return $false
    }
    
    Write-Log "Restauration du backup: $BackupFile"
    
    try {
        # Déterminer le type de backup
        if ($BackupFile -like "*complete_backup*") {
            Write-Log "Restauration d'un backup complet..."
            $process = Start-Process -FilePath "tar" -ArgumentList @("-xzf", $BackupFile, "-C", ".") -Wait -PassThru -NoNewWindow
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de la restauration du backup complet"
                return $false
            }
        } elseif ($BackupFile -like "*source_code*") {
            Write-Log "Restauration du code source..."
            $process = Start-Process -FilePath "tar" -ArgumentList @("-xzf", $BackupFile, "-C", ".") -Wait -PassThru -NoNewWindow
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de la restauration du code source"
                return $false
            }
        } elseif ($BackupFile -like "*database*") {
            Write-Log "Restauration de la base de données..."
            if ($BackupFile.EndsWith(".gz")) {
                $process = Start-Process -FilePath "gzip" -ArgumentList @("-c", $BackupFile) -RedirectStandardOutput "temp_restore.sql" -Wait -PassThru -NoNewWindow
                if ($process.ExitCode -eq 0) {
                    $process = Start-Process -FilePath "psql" -ArgumentList @("-d", "tuto_angular") -RedirectStandardInput "temp_restore.sql" -Wait -PassThru -NoNewWindow
                    Remove-Item "temp_restore.sql" -Force -ErrorAction SilentlyContinue
                }
            } else {
                $process = Start-Process -FilePath "psql" -ArgumentList @("-d", "tuto_angular") -RedirectStandardInput $BackupFile -Wait -PassThru -NoNewWindow
            }
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de la restauration de la base de données"
                return $false
            }
        } elseif ($BackupFile -like "*logs*") {
            Write-Log "Restauration des logs..."
            $process = Start-Process -FilePath "tar" -ArgumentList @("-xzf", $BackupFile, "-C", ".") -Wait -PassThru -NoNewWindow
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de la restauration des logs"
                return $false
            }
        } elseif ($BackupFile -like "*config*") {
            Write-Log "Restauration des configurations..."
            $process = Start-Process -FilePath "tar" -ArgumentList @("-xzf", $BackupFile, "-C", ".") -Wait -PassThru -NoNewWindow
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de la restauration des configurations"
                return $false
            }
        } elseif ($BackupFile -like "*docker*") {
            Write-Log "Restauration des images Docker..."
            if ($BackupFile.EndsWith(".gz")) {
                $process = Start-Process -FilePath "gzip" -ArgumentList @("-c", $BackupFile) -RedirectStandardOutput "temp_restore.tar" -Wait -PassThru -NoNewWindow
                if ($process.ExitCode -eq 0) {
                    $process = Start-Process -FilePath "docker" -ArgumentList @("load") -RedirectStandardInput "temp_restore.tar" -Wait -PassThru -NoNewWindow
                    Remove-Item "temp_restore.tar" -Force -ErrorAction SilentlyContinue
                }
            } else {
                $process = Start-Process -FilePath "docker" -ArgumentList @("load") -RedirectStandardInput $BackupFile -Wait -PassThru -NoNewWindow
            }
            if ($process.ExitCode -ne 0) {
                Write-Error "Échec de la restauration des images Docker"
                return $false
            }
        } else {
            Write-Error "Type de backup non reconnu: $BackupFile"
            return $false
        }
        
        Write-Success "Backup restauré avec succès: $BackupFile"
        return $true
    } catch {
        Write-Error "Erreur lors de la restauration: $($_.Exception.Message)"
        return $false
    }
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\backup.ps1 [BACKUP_TYPE] [OPTIONS]" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Backup Types:" -ForegroundColor $Colors.White
    Write-Host "  all         Tous les types de backup (défaut)" -ForegroundColor $Colors.White
    Write-Host "  code        Code source seulement" -ForegroundColor $Colors.White
    Write-Host "  database    Base de données seulement" -ForegroundColor $Colors.White
    Write-Host "  logs        Logs seulement" -ForegroundColor $Colors.White
    Write-Host "  config      Configurations seulement" -ForegroundColor $Colors.White
    Write-Host "  docker      Images Docker seulement" -ForegroundColor $Colors.White
    Write-Host "  complete    Backup complet" -ForegroundColor $Colors.White
    Write-Host "  cleanup     Nettoyer les anciens backups" -ForegroundColor $Colors.White
    Write-Host "  verify      Vérifier l'intégrité des backups" -ForegroundColor $Colors.White
    Write-Host "  list        Lister les backups disponibles" -ForegroundColor $Colors.White
    Write-Host "  restore     Restaurer un backup" -ForegroundColor $Colors.White
    Write-Host "  help        Afficher cette aide" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Colors.White
    Write-Host "  -BackupDir     Répertoire de backup (défaut: backups)" -ForegroundColor $Colors.White
    Write-Host "  -RetentionDays Jours de rétention (défaut: 30)" -ForegroundColor $Colors.White
    Write-Host "  -Compress      Compression (défaut: true)" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.White
    Write-Host "  .\backup.ps1 all" -ForegroundColor $Colors.White
    Write-Host "  .\backup.ps1 code" -ForegroundColor $Colors.White
    Write-Host "  .\backup.ps1 restore /path/to/backup.tar.gz" -ForegroundColor $Colors.White
    Write-Host "  .\backup.ps1 all -BackupDir C:\custom\backup" -ForegroundColor $Colors.White
}

# Fonction principale
function Main {
    switch ($BackupType.ToLower()) {
        "all" {
            if (!(Test-Prerequisites)) { return }
            New-BackupDirectories
            Backup-Code | Out-Null
            Backup-Database | Out-Null
            Backup-Logs | Out-Null
            Backup-Config | Out-Null
            Backup-Docker | Out-Null
            Remove-OldBackups
        }
        "code" {
            if (!(Test-Prerequisites)) { return }
            New-BackupDirectories
            Backup-Code | Out-Null
        }
        "database" {
            if (!(Test-Prerequisites)) { return }
            New-BackupDirectories
            Backup-Database | Out-Null
        }
        "logs" {
            if (!(Test-Prerequisites)) { return }
            New-BackupDirectories
            Backup-Logs | Out-Null
        }
        "config" {
            if (!(Test-Prerequisites)) { return }
            New-BackupDirectories
            Backup-Config | Out-Null
        }
        "docker" {
            if (!(Test-Prerequisites)) { return }
            New-BackupDirectories
            Backup-Docker | Out-Null
        }
        "complete" {
            if (!(Test-Prerequisites)) { return }
            New-BackupDirectories
            Backup-All | Out-Null
        }
        "cleanup" {
            Remove-OldBackups
        }
        "verify" {
            Test-BackupIntegrity
        }
        "list" {
            Get-BackupList
        }
        "restore" {
            $restoreFile = $args[0]
            Restore-Backup $restoreFile
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
            Write-Error "Type de backup inconnu: $BackupType"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
