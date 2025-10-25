# Script de monitoring pour le tutoriel Angular n-tier (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$MonitoringType = "all",
    
    [Parameter(Position=1)]
    [int]$Interval = 60,
    
    [Parameter(Position=2)]
    [string]$LogFile = "logs\monitoring.log",
    
    [Parameter(Position=3)]
    [string]$AlertEmail = ""
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
    Write-Log "Vérification des prérequis de monitoring..."
    
    if (-not (Test-Command "curl")) {
        Write-Error "curl n'est pas installé. Veuillez l'installer."
        exit 1
    }
    
    if (-not (Test-Command "jq")) {
        Write-Warning "jq n'est pas installé. Le parsing JSON sera limité."
    }
    
    if (-not (Test-Command "mail")) {
        Write-Warning "mail n'est pas installé. Les alertes par email seront ignorées."
    }
    
    Write-Success "Prérequis de monitoring vérifiés!"
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
    
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" | Out-Null
    }
    if (-not (Test-Path "alerts")) {
        New-Item -ItemType Directory -Path "alerts" | Out-Null
    }
    
    Write-Success "Répertoires créés!"
}

# Fonction pour vérifier la santé du frontend
function Test-FrontendHealth {
    Write-Log "Vérification de la santé du frontend..."
    
    $frontendUrl = "http://localhost:4200"
    try {
        $response = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend accessible (HTTP $($response.StatusCode))"
            return $true
        }
        else {
            Write-Error "Frontend non accessible (HTTP $($response.StatusCode))"
            return $false
        }
    }
    catch {
        Write-Error "Frontend non accessible (Erreur: $($_.Exception.Message))"
        return $false
    }
}

# Fonction pour vérifier la santé du backend
function Test-BackendHealth {
    Write-Log "Vérification de la santé du backend..."
    
    $backendUrl = "http://localhost:8000/health"
    try {
        $response = Invoke-WebRequest -Uri $backendUrl -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend accessible (HTTP $($response.StatusCode))"
            return $true
        }
        else {
            Write-Error "Backend non accessible (HTTP $($response.StatusCode))"
            return $false
        }
    }
    catch {
        Write-Error "Backend non accessible (Erreur: $($_.Exception.Message))"
        return $false
    }
}

# Fonction pour vérifier la santé de la base de données
function Test-DatabaseHealth {
    Write-Log "Vérification de la santé de la base de données..."
    
    if (-not (Test-Command "psql")) {
        Write-Warning "PostgreSQL n'est pas installé. Vérification de la base de données ignorée."
        return $true
    }
    
    try {
        $result = psql -d tuto_angular -c "SELECT 1;" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Base de données accessible"
            return $true
        }
        else {
            Write-Error "Base de données non accessible"
            return $false
        }
    }
    catch {
        Write-Error "Base de données non accessible (Erreur: $($_.Exception.Message))"
        return $false
    }
}

# Fonction pour vérifier les services Docker
function Test-DockerServices {
    Write-Log "Vérification des services Docker..."
    
    if (-not (Test-Command "docker")) {
        Write-Warning "Docker n'est pas installé. Vérification des services Docker ignorée."
        return $true
    }
    
    try {
        $runningContainers = docker ps --format "{{.Names}}" | Measure-Object | Select-Object -ExpandProperty Count
        if ($runningContainers -gt 0) {
            Write-Success "Services Docker en cours d'exécution ($runningContainers conteneurs)"
            return $true
        }
        else {
            Write-Warning "Aucun service Docker en cours d'exécution"
            return $false
        }
    }
    catch {
        Write-Warning "Erreur lors de la vérification des services Docker"
        return $false
    }
}

# Fonction pour surveiller les performances système
function Monitor-SystemPerformance {
    Write-Log "Surveillance des performances système..."
    
    # Utilisation CPU
    $cpuUsage = Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty LoadPercentage
    Write-Log "Utilisation CPU: ${cpuUsage}%"
    
    # Utilisation mémoire
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $memoryUsage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 1)
    Write-Log "Utilisation mémoire: ${memoryUsage}%"
    
    # Utilisation disque
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $diskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 1)
    Write-Log "Utilisation disque: ${diskUsage}%"
    
    # Vérifier les seuils d'alerte
    if ($cpuUsage -gt 80) {
        Write-Warning "Utilisation CPU élevée: ${cpuUsage}%"
        Send-Alert "CPU" "Utilisation CPU élevée: ${cpuUsage}%"
    }
    
    if ($memoryUsage -gt 80) {
        Write-Warning "Utilisation mémoire élevée: ${memoryUsage}%"
        Send-Alert "Mémoire" "Utilisation mémoire élevée: ${memoryUsage}%"
    }
    
    if ($diskUsage -gt 80) {
        Write-Warning "Utilisation disque élevée: ${diskUsage}%"
        Send-Alert "Disque" "Utilisation disque élevée: ${diskUsage}%"
    }
}

# Fonction pour surveiller les performances de l'application
function Monitor-ApplicationPerformance {
    Write-Log "Surveillance des performances de l'application..."
    
    # Temps de réponse du frontend
    try {
        $frontendResponseTime = Measure-Command { Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -TimeoutSec 10 } | Select-Object -ExpandProperty TotalSeconds
        Write-Log "Temps de réponse frontend: ${frontendResponseTime}s"
        
        if ($frontendResponseTime -gt 5) {
            Write-Warning "Temps de réponse frontend élevé: ${frontendResponseTime}s"
            Send-Alert "Performance" "Temps de réponse frontend élevé: ${frontendResponseTime}s"
        }
    }
    catch {
        Write-Warning "Impossible de mesurer le temps de réponse du frontend"
    }
    
    # Temps de réponse du backend
    try {
        $backendResponseTime = Measure-Command { Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 10 } | Select-Object -ExpandProperty TotalSeconds
        Write-Log "Temps de réponse backend: ${backendResponseTime}s"
        
        if ($backendResponseTime -gt 2) {
            Write-Warning "Temps de réponse backend élevé: ${backendResponseTime}s"
            Send-Alert "Performance" "Temps de réponse backend élevé: ${backendResponseTime}s"
        }
    }
    catch {
        Write-Warning "Impossible de mesurer le temps de réponse du backend"
    }
}

# Fonction pour surveiller les logs d'erreur
function Monitor-ErrorLogs {
    Write-Log "Surveillance des logs d'erreur..."
    
    $errorCount = 0
    
    # Compter les erreurs dans les logs
    if (Test-Path "Angular\Tuto-Angular\logs\*.log") {
        $errorCount += (Get-Content "Angular\Tuto-Angular\logs\*.log" | Select-String -Pattern "ERROR|FATAL" -CaseSensitive:$false | Measure-Object | Select-Object -ExpandProperty Count)
    }
    
    if (Test-Path "Angular\Tuto-Angular\backend\logs\*.log") {
        $errorCount += (Get-Content "Angular\Tuto-Angular\backend\logs\*.log" | Select-String -Pattern "ERROR|FATAL" -CaseSensitive:$false | Measure-Object | Select-Object -ExpandProperty Count)
    }
    
    if ($errorCount -gt 0) {
        Write-Warning "Erreurs détectées dans les logs: $errorCount"
        Send-Alert "Logs" "Erreurs détectées dans les logs: $errorCount"
    }
    else {
        Write-Success "Aucune erreur dans les logs"
    }
}

# Fonction pour surveiller l'espace disque
function Monitor-DiskSpace {
    Write-Log "Surveillance de l'espace disque..."
    
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $diskUsage = [math]::Round((($disk.Size - $disk.FreeSpace) / $disk.Size) * 100, 1)
    $availableSpace = [math]::Round($disk.FreeSpace / 1GB, 2)
    
    Write-Log "Espace disque utilisé: ${diskUsage}%"
    Write-Log "Espace disque disponible: ${availableSpace}GB"
    
    if ($diskUsage -gt 90) {
        Write-Error "Espace disque critique: ${diskUsage}%"
        Send-Alert "Disque" "Espace disque critique: ${diskUsage}%"
    }
    elseif ($diskUsage -gt 80) {
        Write-Warning "Espace disque faible: ${diskUsage}%"
        Send-Alert "Disque" "Espace disque faible: ${diskUsage}%"
    }
}

# Fonction pour surveiller la mémoire
function Monitor-Memory {
    Write-Log "Surveillance de la mémoire..."
    
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $memoryUsage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 1)
    $availableMemory = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
    
    Write-Log "Mémoire utilisée: ${memoryUsage}%"
    Write-Log "Mémoire disponible: ${availableMemory}MB"
    
    if ($memoryUsage -gt 90) {
        Write-Error "Mémoire critique: ${memoryUsage}%"
        Send-Alert "Mémoire" "Mémoire critique: ${memoryUsage}%"
    }
    elseif ($memoryUsage -gt 80) {
        Write-Warning "Mémoire faible: ${memoryUsage}%"
        Send-Alert "Mémoire" "Mémoire faible: ${memoryUsage}%"
    }
}

# Fonction pour surveiller le CPU
function Monitor-CPU {
    Write-Log "Surveillance du CPU..."
    
    $cpuUsage = Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty LoadPercentage
    $loadAverage = Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty LoadPercentage
    
    Write-Log "Utilisation CPU: ${cpuUsage}%"
    Write-Log "Charge moyenne: ${loadAverage}"
    
    if ($cpuUsage -gt 90) {
        Write-Error "CPU critique: ${cpuUsage}%"
        Send-Alert "CPU" "CPU critique: ${cpuUsage}%"
    }
    elseif ($cpuUsage -gt 80) {
        Write-Warning "CPU élevé: ${cpuUsage}%"
        Send-Alert "CPU" "CPU élevé: ${cpuUsage}%"
    }
}

# Fonction pour surveiller les processus
function Monitor-Processes {
    Write-Log "Surveillance des processus..."
    
    $processCount = (Get-Process | Measure-Object | Select-Object -ExpandProperty Count)
    $zombieCount = (Get-Process | Where-Object { $_.ProcessName -eq "defunct" } | Measure-Object | Select-Object -ExpandProperty Count)
    
    Write-Log "Nombre de processus: $processCount"
    Write-Log "Processus zombies: $zombieCount"
    
    if ($zombieCount -gt 0) {
        Write-Warning "Processus zombies détectés: $zombieCount"
        Send-Alert "Processus" "Processus zombies détectés: $zombieCount"
    }
}

# Fonction pour surveiller les connexions réseau
function Monitor-Network {
    Write-Log "Surveillance des connexions réseau..."
    
    $establishedConnections = (Get-NetTCPConnection | Where-Object { $_.State -eq "Established" } | Measure-Object | Select-Object -ExpandProperty Count)
    $listeningPorts = (Get-NetTCPConnection | Where-Object { $_.State -eq "Listen" } | Measure-Object | Select-Object -ExpandProperty Count)
    
    Write-Log "Connexions établies: $establishedConnections"
    Write-Log "Ports en écoute: $listeningPorts"
    
    # Vérifier les ports critiques
    $criticalPorts = @(80, 443, 8000, 4200, 5432)
    
    foreach ($port in $criticalPorts) {
        $listening = Get-NetTCPConnection | Where-Object { $_.LocalPort -eq $port -and $_.State -eq "Listen" }
        if (-not $listening) {
            Write-Warning "Port critique non accessible: $port"
            Send-Alert "Réseau" "Port critique non accessible: $port"
        }
    }
}

# Fonction pour envoyer une alerte
function Send-Alert {
    param(
        [string]$AlertType,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    # Enregistrer l'alerte dans le fichier de log
    "[$timestamp] ALERTE [$AlertType]: $Message" | Out-File -FilePath $LogFile -Append -Encoding UTF8
    
    # Enregistrer l'alerte dans un fichier séparé
    "[$timestamp] $AlertType`: $Message" | Out-File -FilePath "alerts\alerts.log" -Append -Encoding UTF8
    
    # Envoyer l'alerte par email si configuré
    if (-not [string]::IsNullOrEmpty($AlertEmail) -and (Test-Command "mail")) {
        $emailBody = @"
Type d'alerte: $AlertType
Message: $Message
Timestamp: $timestamp
Serveur: $env:COMPUTERNAME
"@
        $emailBody | mail -s "[ALERTE] $AlertType" $AlertEmail
    }
}

# Fonction pour générer un rapport de monitoring
function New-MonitoringReport {
    Write-Log "Génération du rapport de monitoring..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = "logs\monitoring_report_$timestamp.txt"
    
    $reportContent = @"
Rapport de monitoring - Tuto Angular n-tier
Généré le: $(Get-Date)
Type de monitoring: $MonitoringType

=== Santé des services ===
Frontend: $(if (Test-FrontendHealth) { "OK" } else { "ERREUR" })
Backend: $(if (Test-BackendHealth) { "OK" } else { "ERREUR" })
Base de données: $(if (Test-DatabaseHealth) { "OK" } else { "ERREUR" })
Services Docker: $(if (Test-DockerServices) { "OK" } else { "ERREUR" })

=== Performances système ===
CPU: $(Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty LoadPercentage)%
Mémoire: $([math]::Round((($(Get-WmiObject -Class Win32_OperatingSystem).TotalVisibleMemorySize - $(Get-WmiObject -Class Win32_OperatingSystem).FreePhysicalMemory) / $(Get-WmiObject -Class Win32_OperatingSystem).TotalVisibleMemorySize) * 100, 1))%
Disque: $([math]::Round((($(Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").Size - $(Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").FreeSpace) / $(Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'").Size) * 100, 1))%

=== Performances application ===
Temps de réponse frontend: $(try { (Measure-Command { Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -TimeoutSec 10 }).TotalSeconds } catch { "0" })s
Temps de réponse backend: $(try { (Measure-Command { Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 10 }).TotalSeconds } catch { "0" })s

=== Connexions réseau ===
Connexions établies: $((Get-NetTCPConnection | Where-Object { $_.State -eq "Established" } | Measure-Object | Select-Object -ExpandProperty Count))
Ports en écoute: $((Get-NetTCPConnection | Where-Object { $_.State -eq "Listen" } | Measure-Object | Select-Object -ExpandProperty Count))

=== Processus ===
Nombre de processus: $((Get-Process | Measure-Object | Select-Object -ExpandProperty Count))
Processus zombies: $((Get-Process | Where-Object { $_.ProcessName -eq "defunct" } | Measure-Object | Select-Object -ExpandProperty Count))

=== Logs d'erreur ===
Erreurs récentes: $(if (Test-Path "Angular\Tuto-Angular\logs\*.log") { (Get-Content "Angular\Tuto-Angular\logs\*.log" | Select-String -Pattern "ERROR|FATAL" -CaseSensitive:$false | Measure-Object | Select-Object -ExpandProperty Count) } else { "0" })

=== Alertes récentes ===
$(if (Test-Path "alerts\alerts.log") { Get-Content "alerts\alerts.log" | Select-Object -Last 20 } else { "Aucune alerte récente" })
"@
    
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    
    Write-Success "Rapport de monitoring généré: $reportFile"
}

# Fonction pour démarrer le monitoring continu
function Start-ContinuousMonitoring {
    Write-Log "Démarrage du monitoring continu (intervalle: ${Interval}s)..."
    
    while ($true) {
        Write-Log "=== Cycle de monitoring $(Get-Date) ==="
        
        switch ($MonitoringType.ToLower()) {
            "all" {
                Test-FrontendHealth | Out-Null
                Test-BackendHealth | Out-Null
                Test-DatabaseHealth | Out-Null
                Test-DockerServices | Out-Null
                Monitor-SystemPerformance
                Monitor-ApplicationPerformance
                Monitor-ErrorLogs
                Monitor-DiskSpace
                Monitor-Memory
                Monitor-CPU
                Monitor-Processes
                Monitor-Network
            }
            "health" {
                Test-FrontendHealth | Out-Null
                Test-BackendHealth | Out-Null
                Test-DatabaseHealth | Out-Null
                Test-DockerServices | Out-Null
            }
            "performance" {
                Monitor-SystemPerformance
                Monitor-ApplicationPerformance
            }
            "resources" {
                Monitor-DiskSpace
                Monitor-Memory
                Monitor-CPU
            }
            "network" {
                Monitor-Network
            }
            "logs" {
                Monitor-ErrorLogs
            }
            default {
                Write-Error "Type de monitoring inconnu: $MonitoringType"
                exit 1
            }
        }
        
        Write-Log "Attente de ${Interval}s avant le prochain cycle..."
        Start-Sleep -Seconds $Interval
    }
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\monitoring.ps1 [MONITORING_TYPE] [INTERVAL] [LOG_FILE] [ALERT_EMAIL]"
    Write-Host ""
    Write-Host "Monitoring Types:"
    Write-Host "  all         Tous les types de monitoring (défaut)"
    Write-Host "  health      Santé des services seulement"
    Write-Host "  performance Performances système et application"
    Write-Host "  resources   Ressources système (CPU, mémoire, disque)"
    Write-Host "  network     Connexions réseau"
    Write-Host "  logs        Logs d'erreur"
    Write-Host "  report      Générer un rapport de monitoring"
    Write-Host "  help        Afficher cette aide"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  Interval    Intervalle en secondes pour le monitoring continu (défaut: 60)"
    Write-Host "  LogFile     Fichier de log (défaut: logs\monitoring.log)"
    Write-Host "  AlertEmail  Adresse email pour les alertes"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\monitoring.ps1 all 30"
    Write-Host "  .\monitoring.ps1 health"
    Write-Host "  .\monitoring.ps1 all -AlertEmail admin@example.com"
}

# Fonction principale
function Main {
    switch ($MonitoringType.ToLower()) {
        "all" { 
            Test-Prerequisites
            New-Directories
            Start-ContinuousMonitoring
        }
        "health" { 
            Test-Prerequisites
            New-Directories
            Start-ContinuousMonitoring
        }
        "performance" { 
            Test-Prerequisites
            New-Directories
            Start-ContinuousMonitoring
        }
        "resources" { 
            Test-Prerequisites
            New-Directories
            Start-ContinuousMonitoring
        }
        "network" { 
            Test-Prerequisites
            New-Directories
            Start-ContinuousMonitoring
        }
        "logs" { 
            Test-Prerequisites
            New-Directories
            Start-ContinuousMonitoring
        }
        "report" { 
            Test-Prerequisites
            New-Directories
            New-MonitoringReport
        }
        "help" { Show-Help }
        "--help" { Show-Help }
        "-h" { Show-Help }
        default { 
            Write-Error "Type de monitoring inconnu: $MonitoringType"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
