@echo off
setlocal enabledelayedexpansion

REM Script de maintenance pour le tutoriel Angular n-tier (Windows)

REM Configuration
set "MAINTENANCE_TYPE=%~1"
if "%MAINTENANCE_TYPE%"=="" set "MAINTENANCE_TYPE=all"
set "BACKUP_DIR=backups"
set "LOG_DIR=logs"

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
call :log "Vérification des prérequis de maintenance..."

where node >nul 2>&1
if %errorlevel% neq 0 (
    call :error "Node.js n'est pas installé. Veuillez l'installer."
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    call :error "npm n'est pas installé. Veuillez installer Node.js qui inclut npm."
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    call :error "Python n'est pas installé. Veuillez l'installer."
    exit /b 1
)

where pip >nul 2>&1
if %errorlevel% neq 0 (
    call :error "pip n'est pas installé. Veuillez installer pip pour Python."
    exit /b 1
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "Docker n'est pas installé. La maintenance Docker sera ignorée."
)

where psql >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "PostgreSQL n'est pas installé. La maintenance de la base de données sera ignorée."
)

call :success "Prérequis de maintenance vérifiés!"
goto :eof

REM Fonction pour créer les répertoires nécessaires
:create_directories
call :log "Création des répertoires nécessaires..."

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "Angular\Tuto-Angular\logs" mkdir "Angular\Tuto-Angular\logs"
if not exist "Angular\Tuto-Angular\backend\logs" mkdir "Angular\Tuto-Angular\backend\logs"

call :success "Répertoires créés!"
goto :eof

REM Fonction pour sauvegarder les données
:backup_data
call :log "Sauvegarde des données..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "backup_path=%BACKUP_DIR%\backup_%timestamp%"

if not exist "%backup_path%" mkdir "%backup_path%"

REM Sauvegarder le code source
call :log "Sauvegarde du code source..."
powershell -Command "Compress-Archive -Path 'Angular\Tuto-Angular\*' -DestinationPath '%backup_path%\source_code.zip' -Force"

REM Sauvegarder la base de données
where psql >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Sauvegarde de la base de données..."
    pg_dump tuto_angular > "%backup_path%\database.sql"
) else (
    call :warning "PostgreSQL n'est pas installé. Sauvegarde de la base de données ignorée."
)

REM Sauvegarder les logs
call :log "Sauvegarde des logs..."
if exist "Angular\Tuto-Angular\logs" (
    powershell -Command "Compress-Archive -Path 'Angular\Tuto-Angular\logs\*' -DestinationPath '%backup_path%\logs.zip' -Force"
)

REM Sauvegarder les configurations
call :log "Sauvegarde des configurations..."
if exist "Angular\Tuto-Angular\backend\config.env" (
    copy "Angular\Tuto-Angular\backend\config.env" "%backup_path%\"
)
if exist "Angular\Tuto-Angular\src\environments" (
    xcopy "Angular\Tuto-Angular\src\environments" "%backup_path%\environments" /E /I /Q
)

call :success "Sauvegarde terminée: %backup_path%"
goto :eof

REM Fonction pour nettoyer les logs
:clean_logs
call :log "Nettoyage des logs..."

REM Nettoyer les logs anciens (plus de 30 jours)
forfiles /p "Angular\Tuto-Angular\logs" /m "*.log" /d -30 /c "cmd /c del @path" 2>nul
forfiles /p "Angular\Tuto-Angular\backend\logs" /m "*.log" /d -30 /c "cmd /c del @path" 2>nul
forfiles /p "%LOG_DIR%" /m "*.log" /d -30 /c "cmd /c del @path" 2>nul

REM Nettoyer les logs de taille importante (plus de 100MB)
for /r "Angular\Tuto-Angular\logs" %%f in (*.log) do (
    if %%~zf gtr 104857600 del "%%f"
)
for /r "Angular\Tuto-Angular\backend\logs" %%f in (*.log) do (
    if %%~zf gtr 104857600 del "%%f"
)
for /r "%LOG_DIR%" %%f in (*.log) do (
    if %%~zf gtr 104857600 del "%%f"
)

call :success "Logs nettoyés!"
goto :eof

REM Fonction pour nettoyer les fichiers temporaires
:clean_temp_files
call :log "Nettoyage des fichiers temporaires..."

REM Nettoyer le frontend
if exist "Angular\Tuto-Angular\dist" rmdir /s /q "Angular\Tuto-Angular\dist"
if exist "Angular\Tuto-Angular\out-tsc" rmdir /s /q "Angular\Tuto-Angular\out-tsc"
if exist "Angular\Tuto-Angular\node_modules\.cache" rmdir /s /q "Angular\Tuto-Angular\node_modules\.cache"

REM Nettoyer le backend
for /d /r "Angular\Tuto-Angular\backend" %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
for /r "Angular\Tuto-Angular\backend" %%f in (*.pyc) do @if exist "%%f" del "%%f"
for /r "Angular\Tuto-Angular\backend" %%f in (*.pyo) do @if exist "%%f" del "%%f"
for /r "Angular\Tuto-Angular\backend" %%f in (*.pyd) do @if exist "%%f" del "%%f"

REM Nettoyer les fichiers temporaires système
if exist "%TEMP%\tuto-angular*" rmdir /s /q "%TEMP%\tuto-angular*"
if exist "%LOCALAPPDATA%\cache\tuto-angular*" rmdir /s /q "%LOCALAPPDATA%\cache\tuto-angular*"

call :success "Fichiers temporaires nettoyés!"
goto :eof

REM Fonction pour nettoyer les images Docker
:clean_docker_images
call :log "Nettoyage des images Docker..."

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "Docker n'est pas installé. Nettoyage Docker ignoré."
    goto :eof
)

REM Nettoyer les images non utilisées
docker image prune -f

REM Nettoyer les conteneurs arrêtés
docker container prune -f

REM Nettoyer les volumes non utilisés
docker volume prune -f

REM Nettoyer les réseaux non utilisés
docker network prune -f

call :success "Images Docker nettoyées!"
goto :eof

REM Fonction pour mettre à jour les dépendances
:update_dependencies
call :log "Mise à jour des dépendances..."

REM Frontend
call :log "Mise à jour des dépendances frontend..."
cd Angular\Tuto-Angular
call npm update
call npm audit fix
cd ..\..

REM Backend
call :log "Mise à jour des dépendances backend..."
cd Angular\Tuto-Angular\backend
call pip install --upgrade pip
call pip install --upgrade -r requirements.txt
cd ..\..\..

call :success "Dépendances mises à jour!"
goto :eof

REM Fonction pour vérifier la santé de l'application
:check_health
call :log "Vérification de la santé de l'application..."

REM Vérifier les dépendances
call :log "Vérification des dépendances..."

REM Frontend
cd Angular\Tuto-Angular
call npm audit
cd ..\..

REM Backend
cd Angular\Tuto-Angular\backend
call pip check
cd ..\..\..

REM Vérifier la base de données
where psql >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Vérification de la base de données..."
    psql -d tuto_angular -c "SELECT version();" >nul 2>&1
    if %errorlevel% neq 0 (
        call :warning "Connexion à la base de données échouée"
    )
)

REM Vérifier les services Docker
where docker >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Vérification des services Docker..."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
)

call :success "Vérification de santé terminée!"
goto :eof

REM Fonction pour générer un rapport de maintenance
:generate_maintenance_report
call :log "Génération du rapport de maintenance..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "report_file=%LOG_DIR%\maintenance_report_%timestamp%.txt"

echo Rapport de maintenance - Tuto Angular n-tier > "%report_file%"
echo Généré le: %date% %time% >> "%report_file%"
echo Type de maintenance: %MAINTENANCE_TYPE% >> "%report_file%"
echo. >> "%report_file%"
echo === Informations système === >> "%report_file%"
echo OS: %OS% >> "%report_file%"
echo Architecture: %PROCESSOR_ARCHITECTURE% >> "%report_file%"
echo Node.js: >> "%report_file%"
node --version >> "%report_file%"
echo npm: >> "%report_file%"
npm --version >> "%report_file%"
echo Python: >> "%report_file%"
python --version >> "%report_file%"
echo pip: >> "%report_file%"
pip --version >> "%report_file%"
echo. >> "%report_file%"
echo === Espace disque === >> "%report_file%"
dir C:\ /-c >> "%report_file%"
echo. >> "%report_file%"
echo === Mémoire === >> "%report_file%"
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value >> "%report_file%"
echo. >> "%report_file%"
echo === Processus === >> "%report_file%"
tasklist /fo table >> "%report_file%"
echo. >> "%report_file%"
echo === Services Docker === >> "%report_file%"
where docker >nul 2>&1
if %errorlevel% equ 0 (
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "%report_file%"
) else (
    echo Docker non disponible >> "%report_file%"
)
echo. >> "%report_file%"
echo === Base de données === >> "%report_file%"
where psql >nul 2>&1
if %errorlevel% equ 0 (
    psql -d tuto_angular -c "SELECT version();" >> "%report_file%"
) else (
    echo PostgreSQL non disponible >> "%report_file%"
)
echo. >> "%report_file%"
echo === Logs récents === >> "%report_file%"
if exist "Angular\Tuto-Angular\logs\*.log" (
    type "Angular\Tuto-Angular\logs\*.log" >> "%report_file%"
) else (
    echo Aucun log récent >> "%report_file%"
)
echo. >> "%report_file%"
echo === Erreurs récentes === >> "%report_file%"
if exist "Angular\Tuto-Angular\logs\*.log" (
    findstr /i "error" "Angular\Tuto-Angular\logs\*.log" >> "%report_file%"
) else (
    echo Aucune erreur récente >> "%report_file%"
)

call :success "Rapport de maintenance généré: %report_file%"
goto :eof

REM Fonction pour restaurer depuis une sauvegarde
:restore_from_backup
call :log "Restauration depuis une sauvegarde..."

set "backup_path=%~2"
if "%backup_path%"=="" (
    call :error "Chemin de sauvegarde non spécifié"
    exit /b 1
)

if not exist "%backup_path%" (
    call :error "Répertoire de sauvegarde non trouvé: %backup_path%"
    exit /b 1
)

REM Restaurer le code source
call :log "Restauration du code source..."
if exist "%backup_path%\source_code.zip" (
    powershell -Command "Expand-Archive -Path '%backup_path%\source_code.zip' -DestinationPath '.' -Force"
)

REM Restaurer la base de données
if exist "%backup_path%\database.sql" (
    where psql >nul 2>&1
    if %errorlevel% equ 0 (
        call :log "Restauration de la base de données..."
        psql -d tuto_angular < "%backup_path%\database.sql"
    )
)

REM Restaurer les logs
if exist "%backup_path%\logs.zip" (
    call :log "Restauration des logs..."
    powershell -Command "Expand-Archive -Path '%backup_path%\logs.zip' -DestinationPath 'Angular\Tuto-Angular\logs' -Force"
)

REM Restaurer les configurations
if exist "%backup_path%\config.env" (
    call :log "Restauration des configurations..."
    copy "%backup_path%\config.env" "Angular\Tuto-Angular\backend\"
)
if exist "%backup_path%\environments" (
    xcopy "%backup_path%\environments" "Angular\Tuto-Angular\src\environments" /E /I /Q
)

call :success "Restauration terminée!"
goto :eof

REM Fonction pour surveiller les performances
:monitor_performance
call :log "Surveillance des performances..."

REM Surveiller l'utilisation CPU
call :log "Utilisation CPU:"
wmic cpu get loadpercentage /value

REM Surveiller l'utilisation mémoire
call :log "Utilisation mémoire:"
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value

REM Surveiller l'espace disque
call :log "Espace disque:"
dir C:\ /-c

REM Surveiller les processus
call :log "Processus les plus gourmands:"
tasklist /fo table /fi "cputime gt 00:00:01"

call :success "Surveillance des performances terminée!"
goto :eof

REM Fonction pour nettoyer
:cleanup
call :log "Nettoyage complet..."

call :clean_logs
call :clean_temp_files
call :clean_docker_images

call :success "Nettoyage complet terminé!"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %0 [MAINTENANCE_TYPE] [OPTIONS]
echo.
echo Maintenance Types:
echo   all         Toutes les tâches de maintenance (défaut)
echo   backup      Sauvegarde des données
echo   clean       Nettoyage des fichiers temporaires
echo   logs        Nettoyage des logs
echo   docker      Nettoyage des images Docker
echo   update      Mise à jour des dépendances
echo   health      Vérification de la santé
echo   report      Génération du rapport de maintenance
echo   restore     Restauration depuis une sauvegarde
echo   monitor     Surveillance des performances
echo   help        Afficher cette aide
echo.
echo Options:
echo   BACKUP_DIR  Répertoire de sauvegarde (défaut: backups)
echo   LOG_DIR     Répertoire des logs (défaut: logs)
echo.
echo Examples:
echo   %0 backup
echo   %0 clean
echo   %0 restore C:\path\to\backup
echo   set BACKUP_DIR=C:\custom\backup ^& %0 all
goto :eof

REM Fonction principale
:main
if "%MAINTENANCE_TYPE%"=="all" goto :run_all_maintenance
if "%MAINTENANCE_TYPE%"=="backup" goto :run_backup_maintenance
if "%MAINTENANCE_TYPE%"=="clean" goto :run_clean_maintenance
if "%MAINTENANCE_TYPE%"=="logs" goto :run_logs_maintenance
if "%MAINTENANCE_TYPE%"=="docker" goto :run_docker_maintenance
if "%MAINTENANCE_TYPE%"=="update" goto :run_update_maintenance
if "%MAINTENANCE_TYPE%"=="health" goto :run_health_maintenance
if "%MAINTENANCE_TYPE%"=="report" goto :run_report_maintenance
if "%MAINTENANCE_TYPE%"=="restore" goto :run_restore_maintenance
if "%MAINTENANCE_TYPE%"=="monitor" goto :run_monitor_maintenance
if "%MAINTENANCE_TYPE%"=="help" goto :show_help
if "%MAINTENANCE_TYPE%"=="--help" goto :show_help
if "%MAINTENANCE_TYPE%"=="-h" goto :show_help

call :error "Type de maintenance inconnu: %MAINTENANCE_TYPE%"
call :show_help
exit /b 1

:run_all_maintenance
call :check_prerequisites
call :create_directories
call :backup_data
call :clean_logs
call :clean_temp_files
call :clean_docker_images
call :update_dependencies
call :check_health
call :generate_maintenance_report
goto :eof

:run_backup_maintenance
call :check_prerequisites
call :create_directories
call :backup_data
goto :eof

:run_clean_maintenance
call :clean_temp_files
call :clean_docker_images
goto :eof

:run_logs_maintenance
call :clean_logs
goto :eof

:run_docker_maintenance
call :clean_docker_images
goto :eof

:run_update_maintenance
call :check_prerequisites
call :update_dependencies
goto :eof

:run_health_maintenance
call :check_health
goto :eof

:run_report_maintenance
call :create_directories
call :generate_maintenance_report
goto :eof

:run_restore_maintenance
call :restore_from_backup %*
goto :eof

:run_monitor_maintenance
call :monitor_performance
goto :eof

:help
call :show_help
exit /b 0

REM Exécuter la fonction principale
call :main %1 %2
