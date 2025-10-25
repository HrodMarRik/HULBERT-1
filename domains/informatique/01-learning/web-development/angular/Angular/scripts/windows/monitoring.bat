@echo off
setlocal enabledelayedexpansion

REM Script de monitoring pour le tutoriel Angular n-tier (Windows)

REM Configuration
set "MONITORING_TYPE=%~1"
if "%MONITORING_TYPE%"=="" set "MONITORING_TYPE=all"
set "INTERVAL=%~2"
if "%INTERVAL%"=="" set "INTERVAL=60"
set "LOG_FILE=logs\monitoring.log"
set "ALERT_EMAIL="

REM Couleurs pour les messages
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Fonction pour afficher les messages
:log
echo %BLUE%[INFO]%NC% %~1
goto :eof

:success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Fonction pour vérifier les prérequis
:check_prerequisites
call :log "Vérification des prérequis de monitoring..."

where curl >nul 2>&1
if %errorlevel% neq 0 (
    call :error "curl n'est pas installé. Veuillez l'installer."
    exit /b 1
)

where jq >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "jq n'est pas installé. Le parsing JSON sera limité."
)

where mail >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "mail n'est pas installé. Les alertes par email seront ignorées."
)

call :success "Prérequis de monitoring vérifiés!"
goto :eof

REM Fonction pour créer les répertoires nécessaires
:create_directories
call :log "Création des répertoires nécessaires..."

if not exist "logs" mkdir "logs"
if not exist "alerts" mkdir "alerts"

call :success "Répertoires créés!"
goto :eof

REM Fonction pour vérifier la santé du frontend
:check_frontend_health
call :log "Vérification de la santé du frontend..."

set "frontend_url=http://localhost:4200"
curl -s -o nul -w "%%{http_code}" "%frontend_url%" > temp_response.txt 2>nul
set /p response_code=<temp_response.txt
del temp_response.txt 2>nul

if "%response_code%"=="200" (
    call :success "Frontend accessible (HTTP %response_code%)"
    exit /b 0
) else (
    call :error "Frontend non accessible (HTTP %response_code%)"
    exit /b 1
)

REM Fonction pour vérifier la santé du backend
:check_backend_health
call :log "Vérification de la santé du backend..."

set "backend_url=http://localhost:8000/health"
curl -s -o nul -w "%%{http_code}" "%backend_url%" > temp_response.txt 2>nul
set /p response_code=<temp_response.txt
del temp_response.txt 2>nul

if "%response_code%"=="200" (
    call :success "Backend accessible (HTTP %response_code%)"
    exit /b 0
) else (
    call :error "Backend non accessible (HTTP %response_code%)"
    exit /b 1
)

REM Fonction pour vérifier la santé de la base de données
:check_database_health
call :log "Vérification de la santé de la base de données..."

where psql >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "PostgreSQL n'est pas installé. Vérification de la base de données ignorée."
    exit /b 0
)

psql -d tuto_angular -c "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    call :success "Base de données accessible"
    exit /b 0
) else (
    call :error "Base de données non accessible"
    exit /b 1
)

REM Fonction pour vérifier les services Docker
:check_docker_services
call :log "Vérification des services Docker..."

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "Docker n'est pas installé. Vérification des services Docker ignorée."
    exit /b 0
)

docker ps --format "{{.Names}}" | find /c /v "" > temp_count.txt 2>nul
set /p running_containers=<temp_count.txt
del temp_count.txt 2>nul

if %running_containers% gtr 0 (
    call :success "Services Docker en cours d'exécution (%running_containers% conteneurs)"
    exit /b 0
) else (
    call :warning "Aucun service Docker en cours d'exécution"
    exit /b 1
)

REM Fonction pour surveiller les performances système
:monitor_system_performance
call :log "Surveillance des performances système..."

REM Utilisation CPU
for /f "tokens=2 delims=," %%a in ('wmic cpu get loadpercentage /value ^| find "="') do set "cpu_usage=%%a"
set "cpu_usage=%cpu_usage: =%"

REM Utilisation mémoire
for /f "tokens=2 delims=," %%a in ('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value ^| find "TotalVisibleMemorySize"') do set "total_memory=%%a"
for /f "tokens=2 delims=," %%a in ('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value ^| find "FreePhysicalMemory"') do set "free_memory=%%a"
set "total_memory=%total_memory: =%"
set "free_memory=%free_memory: =%"
set /a "memory_usage=100 - (free_memory * 100 / total_memory)"

REM Utilisation disque
for /f "tokens=3 delims= " %%a in ('dir C:\ /-c ^| find "bytes free"') do set "free_space=%%a"
for /f "tokens=1 delims= " %%a in ('dir C:\ /-c ^| find "bytes free"') do set "total_space=%%a"
set /a "disk_usage=100 - (free_space * 100 / total_space)"

call :log "Utilisation CPU: %cpu_usage%%%"
call :log "Utilisation mémoire: %memory_usage%%%"
call :log "Utilisation disque: %disk_usage%%%"

REM Vérifier les seuils d'alerte
if %cpu_usage% gtr 80 (
    call :warning "Utilisation CPU élevée: %cpu_usage%%%"
    call :send_alert "CPU" "Utilisation CPU élevée: %cpu_usage%%%"
)

if %memory_usage% gtr 80 (
    call :warning "Utilisation mémoire élevée: %memory_usage%%%"
    call :send_alert "Mémoire" "Utilisation mémoire élevée: %memory_usage%%%"
)

if %disk_usage% gtr 80 (
    call :warning "Utilisation disque élevée: %disk_usage%%%"
    call :send_alert "Disque" "Utilisation disque élevée: %disk_usage%%%"
)
goto :eof

REM Fonction pour surveiller les performances de l'application
:monitor_application_performance
call :log "Surveillance des performances de l'application..."

REM Temps de réponse du frontend
curl -s -o nul -w "%%{time_total}" http://localhost:4200 > temp_time.txt 2>nul
set /p frontend_response_time=<temp_time.txt
del temp_time.txt 2>nul

REM Temps de réponse du backend
curl -s -o nul -w "%%{time_total}" http://localhost:8000/health > temp_time.txt 2>nul
set /p backend_response_time=<temp_time.txt
del temp_time.txt 2>nul

call :log "Temps de réponse frontend: %frontend_response_time%s"
call :log "Temps de réponse backend: %backend_response_time%s"

REM Vérifier les seuils d'alerte
if %frontend_response_time% gtr 5 (
    call :warning "Temps de réponse frontend élevé: %frontend_response_time%s"
    call :send_alert "Performance" "Temps de réponse frontend élevé: %frontend_response_time%s"
)

if %backend_response_time% gtr 2 (
    call :warning "Temps de réponse backend élevé: %backend_response_time%s"
    call :send_alert "Performance" "Temps de réponse backend élevé: %backend_response_time%s"
)
goto :eof

REM Fonction pour surveiller les logs d'erreur
:monitor_error_logs
call :log "Surveillance des logs d'erreur..."

set "error_count=0"

REM Compter les erreurs dans les logs
if exist "Angular\Tuto-Angular\logs\*.log" (
    findstr /i "ERROR FATAL" "Angular\Tuto-Angular\logs\*.log" | find /c /v "" > temp_count.txt 2>nul
    set /p temp_count=<temp_count.txt
    del temp_count.txt 2>nul
    set /a "error_count=error_count + temp_count"
)

if exist "Angular\Tuto-Angular\backend\logs\*.log" (
    findstr /i "ERROR FATAL" "Angular\Tuto-Angular\backend\logs\*.log" | find /c /v "" > temp_count.txt 2>nul
    set /p temp_count=<temp_count.txt
    del temp_count.txt 2>nul
    set /a "error_count=error_count + temp_count"
)

if %error_count% gtr 0 (
    call :warning "Erreurs détectées dans les logs: %error_count%"
    call :send_alert "Logs" "Erreurs détectées dans les logs: %error_count%"
) else (
    call :success "Aucune erreur dans les logs"
)
goto :eof

REM Fonction pour surveiller l'espace disque
:monitor_disk_space
call :log "Surveillance de l'espace disque..."

for /f "tokens=3 delims= " %%a in ('dir C:\ /-c ^| find "bytes free"') do set "free_space=%%a"
for /f "tokens=1 delims= " %%a in ('dir C:\ /-c ^| find "bytes free"') do set "total_space=%%a"
set /a "disk_usage=100 - (free_space * 100 / total_space)"

call :log "Espace disque utilisé: %disk_usage%%%"
call :log "Espace disque disponible: %free_space%KB"

if %disk_usage% gtr 90 (
    call :error "Espace disque critique: %disk_usage%%%"
    call :send_alert "Disque" "Espace disque critique: %disk_usage%%%"
) else if %disk_usage% gtr 80 (
    call :warning "Espace disque faible: %disk_usage%%%"
    call :send_alert "Disque" "Espace disque faible: %disk_usage%%%"
)
goto :eof

REM Fonction pour surveiller la mémoire
:monitor_memory
call :log "Surveillance de la mémoire..."

for /f "tokens=2 delims=," %%a in ('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value ^| find "TotalVisibleMemorySize"') do set "total_memory=%%a"
for /f "tokens=2 delims=," %%a in ('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value ^| find "FreePhysicalMemory"') do set "free_memory=%%a"
set "total_memory=%total_memory: =%"
set "free_memory=%free_memory: =%"
set /a "memory_usage=100 - (free_memory * 100 / total_memory)"

call :log "Mémoire utilisée: %memory_usage%%%"
call :log "Mémoire disponible: %free_memory%KB"

if %memory_usage% gtr 90 (
    call :error "Mémoire critique: %memory_usage%%%"
    call :send_alert "Mémoire" "Mémoire critique: %memory_usage%%%"
) else if %memory_usage% gtr 80 (
    call :warning "Mémoire faible: %memory_usage%%%"
    call :send_alert "Mémoire" "Mémoire faible: %memory_usage%%%"
)
goto :eof

REM Fonction pour surveiller le CPU
:monitor_cpu
call :log "Surveillance du CPU..."

for /f "tokens=2 delims=," %%a in ('wmic cpu get loadpercentage /value ^| find "="') do set "cpu_usage=%%a"
set "cpu_usage=%cpu_usage: =%"

call :log "Utilisation CPU: %cpu_usage%%%"

if %cpu_usage% gtr 90 (
    call :error "CPU critique: %cpu_usage%%%"
    call :send_alert "CPU" "CPU critique: %cpu_usage%%%"
) else if %cpu_usage% gtr 80 (
    call :warning "CPU élevé: %cpu_usage%%%"
    call :send_alert "CPU" "CPU élevé: %cpu_usage%%%"
)
goto :eof

REM Fonction pour surveiller les processus
:monitor_processes
call :log "Surveillance des processus..."

tasklist /fo csv | find /c /v "" > temp_count.txt 2>nul
set /p process_count=<temp_count.txt
del temp_count.txt 2>nul

tasklist /fo csv | find /c "defunct" > temp_count.txt 2>nul
set /p zombie_count=<temp_count.txt
del temp_count.txt 2>nul

call :log "Nombre de processus: %process_count%"
call :log "Processus zombies: %zombie_count%"

if %zombie_count% gtr 0 (
    call :warning "Processus zombies détectés: %zombie_count%"
    call :send_alert "Processus" "Processus zombies détectés: %zombie_count%"
)
goto :eof

REM Fonction pour surveiller les connexions réseau
:monitor_network
call :log "Surveillance des connexions réseau..."

netstat -an | find /c "ESTABLISHED" > temp_count.txt 2>nul
set /p established_connections=<temp_count.txt
del temp_count.txt 2>nul

netstat -an | find /c "LISTENING" > temp_count.txt 2>nul
set /p listening_ports=<temp_count.txt
del temp_count.txt 2>nul

call :log "Connexions établies: %established_connections%"
call :log "Ports en écoute: %listening_ports%"

REM Vérifier les ports critiques
set "critical_ports=80 443 8000 4200 5432"
for %%p in (%critical_ports%) do (
    netstat -an | find ":%%p " >nul 2>&1
    if %errorlevel% neq 0 (
        call :warning "Port critique non accessible: %%p"
        call :send_alert "Réseau" "Port critique non accessible: %%p"
    )
)
goto :eof

REM Fonction pour envoyer une alerte
:send_alert
set "alert_type=%~1"
set "message=%~2"
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,4%-%dt:~4,2%-%dt:~6,2% %dt:~8,2%:%dt:~10,2%:%dt:~12,2%"

REM Enregistrer l'alerte dans le fichier de log
echo [%timestamp%] ALERTE [%alert_type%]: %message% >> "%LOG_FILE%"

REM Enregistrer l'alerte dans un fichier séparé
echo [%timestamp%] %alert_type%: %message% >> "alerts\alerts.log"

REM Envoyer l'alerte par email si configuré
if not "%ALERT_EMAIL%"=="" (
    where mail >nul 2>&1
    if %errorlevel% equ 0 (
        echo Alerte de monitoring - %timestamp% | mail -s "[ALERTE] %alert_type%" "%ALERT_EMAIL%"
    )
)
goto :eof

REM Fonction pour générer un rapport de monitoring
:generate_monitoring_report
call :log "Génération du rapport de monitoring..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "report_file=logs\monitoring_report_%timestamp%.txt"

echo Rapport de monitoring - Tuto Angular n-tier > "%report_file%"
echo Généré le: %date% %time% >> "%report_file%"
echo Type de monitoring: %MONITORING_TYPE% >> "%report_file%"
echo. >> "%report_file%"
echo === Santé des services === >> "%report_file%"
call :check_frontend_health
if %errorlevel% equ 0 (
    echo Frontend: OK >> "%report_file%"
) else (
    echo Frontend: ERREUR >> "%report_file%"
)
call :check_backend_health
if %errorlevel% equ 0 (
    echo Backend: OK >> "%report_file%"
) else (
    echo Backend: ERREUR >> "%report_file%"
)
call :check_database_health
if %errorlevel% equ 0 (
    echo Base de données: OK >> "%report_file%"
) else (
    echo Base de données: ERREUR >> "%report_file%"
)
call :check_docker_services
if %errorlevel% equ 0 (
    echo Services Docker: OK >> "%report_file%"
) else (
    echo Services Docker: ERREUR >> "%report_file%"
)
echo. >> "%report_file%"
echo === Performances système === >> "%report_file%"
for /f "tokens=2 delims=," %%a in ('wmic cpu get loadpercentage /value ^| find "="') do set "cpu_usage=%%a"
echo CPU: %cpu_usage: =%%% >> "%report_file%"
for /f "tokens=2 delims=," %%a in ('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value ^| find "TotalVisibleMemorySize"') do set "total_memory=%%a"
for /f "tokens=2 delims=," %%a in ('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value ^| find "FreePhysicalMemory"') do set "free_memory=%%a"
set "total_memory=%total_memory: =%"
set "free_memory=%free_memory: =%"
set /a "memory_usage=100 - (free_memory * 100 / total_memory)"
echo Mémoire: %memory_usage%%% >> "%report_file%"
for /f "tokens=3 delims= " %%a in ('dir C:\ /-c ^| find "bytes free"') do set "free_space=%%a"
for /f "tokens=1 delims= " %%a in ('dir C:\ /-c ^| find "bytes free"') do set "total_space=%%a"
set /a "disk_usage=100 - (free_space * 100 / total_space)"
echo Disque: %disk_usage%%% >> "%report_file%"
echo. >> "%report_file%"
echo === Performances application === >> "%report_file%"
curl -s -o nul -w "%%{time_total}" http://localhost:4200 > temp_time.txt 2>nul
set /p frontend_response_time=<temp_time.txt
del temp_time.txt 2>nul
echo Temps de réponse frontend: %frontend_response_time%s >> "%report_file%"
curl -s -o nul -w "%%{time_total}" http://localhost:8000/health > temp_time.txt 2>nul
set /p backend_response_time=<temp_time.txt
del temp_time.txt 2>nul
echo Temps de réponse backend: %backend_response_time%s >> "%report_file%"
echo. >> "%report_file%"
echo === Connexions réseau === >> "%report_file%"
netstat -an | find /c "ESTABLISHED" > temp_count.txt 2>nul
set /p established_connections=<temp_count.txt
del temp_count.txt 2>nul
echo Connexions établies: %established_connections% >> "%report_file%"
netstat -an | find /c "LISTENING" > temp_count.txt 2>nul
set /p listening_ports=<temp_count.txt
del temp_count.txt 2>nul
echo Ports en écoute: %listening_ports% >> "%report_file%"
echo. >> "%report_file%"
echo === Processus === >> "%report_file%"
tasklist /fo csv | find /c /v "" > temp_count.txt 2>nul
set /p process_count=<temp_count.txt
del temp_count.txt 2>nul
echo Nombre de processus: %process_count% >> "%report_file%"
tasklist /fo csv | find /c "defunct" > temp_count.txt 2>nul
set /p zombie_count=<temp_count.txt
del temp_count.txt 2>nul
echo Processus zombies: %zombie_count% >> "%report_file%"
echo. >> "%report_file%"
echo === Logs d'erreur === >> "%report_file%"
set "error_count=0"
if exist "Angular\Tuto-Angular\logs\*.log" (
    findstr /i "ERROR FATAL" "Angular\Tuto-Angular\logs\*.log" | find /c /v "" > temp_count.txt 2>nul
    set /p temp_count=<temp_count.txt
    del temp_count.txt 2>nul
    set /a "error_count=error_count + temp_count"
)
if exist "Angular\Tuto-Angular\backend\logs\*.log" (
    findstr /i "ERROR FATAL" "Angular\Tuto-Angular\backend\logs\*.log" | find /c /v "" > temp_count.txt 2>nul
    set /p temp_count=<temp_count.txt
    del temp_count.txt 2>nul
    set /a "error_count=error_count + temp_count"
)
echo Erreurs récentes: %error_count% >> "%report_file%"
echo. >> "%report_file%"
echo === Alertes récentes === >> "%report_file%"
if exist "alerts\alerts.log" (
    type "alerts\alerts.log" | more +0 >> "%report_file%"
) else (
    echo Aucune alerte récente >> "%report_file%"
)

call :success "Rapport de monitoring généré: %report_file%"
goto :eof

REM Fonction pour démarrer le monitoring continu
:start_continuous_monitoring
call :log "Démarrage du monitoring continu (intervalle: %INTERVAL%s)..."

:monitoring_loop
call :log "=== Cycle de monitoring %date% %time% ==="

if "%MONITORING_TYPE%"=="all" (
    call :check_frontend_health
    call :check_backend_health
    call :check_database_health
    call :check_docker_services
    call :monitor_system_performance
    call :monitor_application_performance
    call :monitor_error_logs
    call :monitor_disk_space
    call :monitor_memory
    call :monitor_cpu
    call :monitor_processes
    call :monitor_network
) else if "%MONITORING_TYPE%"=="health" (
    call :check_frontend_health
    call :check_backend_health
    call :check_database_health
    call :check_docker_services
) else if "%MONITORING_TYPE%"=="performance" (
    call :monitor_system_performance
    call :monitor_application_performance
) else if "%MONITORING_TYPE%"=="resources" (
    call :monitor_disk_space
    call :monitor_memory
    call :monitor_cpu
) else if "%MONITORING_TYPE%"=="network" (
    call :monitor_network
) else if "%MONITORING_TYPE%"=="logs" (
    call :monitor_error_logs
) else (
    call :error "Type de monitoring inconnu: %MONITORING_TYPE%"
    exit /b 1
)

call :log "Attente de %INTERVAL%s avant le prochain cycle..."
timeout /t %INTERVAL% /nobreak >nul
goto :monitoring_loop

REM Fonction pour afficher l'aide
:show_help
echo Usage: %0 [MONITORING_TYPE] [INTERVAL]
echo.
echo Monitoring Types:
echo   all         Tous les types de monitoring (défaut)
echo   health      Santé des services seulement
echo   performance Performances système et application
echo   resources   Ressources système (CPU, mémoire, disque)
echo   network     Connexions réseau
echo   logs        Logs d'erreur
echo   report      Générer un rapport de monitoring
echo   help        Afficher cette aide
echo.
echo Parameters:
echo   INTERVAL    Intervalle en secondes pour le monitoring continu (défaut: 60)
echo.
echo Environment Variables:
echo   LOG_FILE    Fichier de log (défaut: logs\monitoring.log)
echo   ALERT_EMAIL Adresse email pour les alertes
echo.
echo Examples:
echo   %0 all 30
echo   %0 health
echo   set ALERT_EMAIL=admin@example.com ^& %0 all
goto :eof

REM Fonction principale
:main
if "%MONITORING_TYPE%"=="all" goto :run_all_monitoring
if "%MONITORING_TYPE%"=="health" goto :run_health_monitoring
if "%MONITORING_TYPE%"=="performance" goto :run_performance_monitoring
if "%MONITORING_TYPE%"=="resources" goto :run_resources_monitoring
if "%MONITORING_TYPE%"=="network" goto :run_network_monitoring
if "%MONITORING_TYPE%"=="logs" goto :run_logs_monitoring
if "%MONITORING_TYPE%"=="report" goto :run_report_monitoring
if "%MONITORING_TYPE%"=="help" goto :show_help
if "%MONITORING_TYPE%"=="--help" goto :show_help
if "%MONITORING_TYPE%"=="-h" goto :show_help

call :error "Type de monitoring inconnu: %MONITORING_TYPE%"
call :show_help
exit /b 1

:run_all_monitoring
call :check_prerequisites
call :create_directories
call :start_continuous_monitoring
goto :eof

:run_health_monitoring
call :check_prerequisites
call :create_directories
call :start_continuous_monitoring
goto :eof

:run_performance_monitoring
call :check_prerequisites
call :create_directories
call :start_continuous_monitoring
goto :eof

:run_resources_monitoring
call :check_prerequisites
call :create_directories
call :start_continuous_monitoring
goto :eof

:run_network_monitoring
call :check_prerequisites
call :create_directories
call :start_continuous_monitoring
goto :eof

:run_logs_monitoring
call :check_prerequisites
call :create_directories
call :start_continuous_monitoring
goto :eof

:run_report_monitoring
call :check_prerequisites
call :create_directories
call :generate_monitoring_report
goto :eof

:help
call :show_help
exit /b 0

REM Exécuter la fonction principale
call :main %1 %2
