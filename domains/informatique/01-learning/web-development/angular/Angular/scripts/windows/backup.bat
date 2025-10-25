@echo off
setlocal enabledelayedexpansion

REM Script de backup pour le tutoriel Angular n-tier (Windows)

set "BACKUP_TYPE=%~1"
if "%BACKUP_TYPE%"=="" set "BACKUP_TYPE=all"

set "BACKUP_DIR=%BACKUP_DIR%"
if "%BACKUP_DIR%"=="" set "BACKUP_DIR=backups"

set "RETENTION_DAYS=%RETENTION_DAYS%"
if "%RETENTION_DAYS%"=="" set "RETENTION_DAYS=30"

set "COMPRESS=%COMPRESS%"
if "%COMPRESS%"=="" set "COMPRESS=true"

REM Fonction pour afficher les messages
:log
echo [INFO] %~1
goto :eof

:success
echo [SUCCESS] %~1
goto :eof

:warning
echo [WARNING] %~1
goto :eof

:error
echo [ERROR] %~1
goto :eof

REM Fonction pour vérifier les prérequis
:check_prerequisites
call :log "Vérification des prérequis de backup..."

where tar >nul 2>&1
if %errorlevel% neq 0 (
    call :error "tar n'est pas installé. Veuillez l'installer."
    exit /b 1
)

where gzip >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "gzip n'est pas installé. La compression sera limitée."
)

where psql >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "PostgreSQL n'est pas installé. Le backup de la base de données sera ignoré."
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "Docker n'est pas installé. Le backup des images Docker sera ignoré."
)

call :success "Prérequis de backup vérifiés!"
goto :eof

REM Fonction pour créer les répertoires nécessaires
:create_directories
call :log "Création des répertoires nécessaires..."

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%\code" mkdir "%BACKUP_DIR%\code"
if not exist "%BACKUP_DIR%\database" mkdir "%BACKUP_DIR%\database"
if not exist "%BACKUP_DIR%\logs" mkdir "%BACKUP_DIR%\logs"
if not exist "%BACKUP_DIR%\config" mkdir "%BACKUP_DIR%\config"
if not exist "%BACKUP_DIR%\docker" mkdir "%BACKUP_DIR%\docker"

call :success "Répertoires créés!"
goto :eof

REM Fonction pour créer un timestamp
:create_timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
goto :eof

REM Fonction pour sauvegarder le code source
:backup_code
call :log "Sauvegarde du code source..."

call :create_timestamp
set "backup_file=%BACKUP_DIR%\code\source_code_%timestamp%.tar.gz"

REM Créer un fichier temporaire pour lister les fichiers à exclure
set "exclude_file=%TEMP%\backup_exclude.txt"
echo node_modules > "%exclude_file%"
echo dist >> "%exclude_file%"
echo out-tsc >> "%exclude_file%"
echo __pycache__ >> "%exclude_file%"
echo *.pyc >> "%exclude_file%"
echo .git >> "%exclude_file%"
echo *.log >> "%exclude_file%"
echo *.tmp >> "%exclude_file%"
echo *.swp >> "%exclude_file%"
echo *.swo >> "%exclude_file%"
echo *~ >> "%exclude_file%"
echo .DS_Store >> "%exclude_file%"
echo Thumbs.db >> "%exclude_file%"

REM Créer le backup
tar --exclude-from="%exclude_file%" -czf "%backup_file%" Angular\ backend\ docs\ *.md *.json *.sh *.bat *.ps1 *.yml *.yaml *.conf *.env *.example 2>nul

if exist "%backup_file%" (
    for %%A in ("%backup_file%") do set "size=%%~zA"
    call :success "Code source sauvegardé: %backup_file% (Taille: %size% bytes)"
) else (
    call :error "Échec de la sauvegarde du code source"
    del "%exclude_file%" 2>nul
    exit /b 1
)

del "%exclude_file%" 2>nul
goto :eof

REM Fonction pour sauvegarder la base de données
:backup_database
call :log "Sauvegarde de la base de données..."

where psql >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "PostgreSQL n'est pas installé. Sauvegarde de la base de données ignorée."
    goto :eof
)

call :create_timestamp
set "backup_file=%BACKUP_DIR%\database\database_%timestamp%.sql"

REM Sauvegarde complète
pg_dump -h localhost -U postgres -d tuto_angular > "%backup_file%" 2>nul
if %errorlevel% neq 0 (
    call :error "Échec de la sauvegarde de la base de données"
    exit /b 1
)

REM Compresser si demandé
if "%COMPRESS%"=="true" (
    where gzip >nul 2>&1
    if %errorlevel% equ 0 (
        gzip "%backup_file%"
        set "backup_file=%backup_file%.gz"
    )
)

if exist "%backup_file%" (
    for %%A in ("%backup_file%") do set "size=%%~zA"
    call :success "Base de données sauvegardée: %backup_file% (Taille: %size% bytes)"
) else (
    call :error "Échec de la sauvegarde de la base de données"
    exit /b 1
)
goto :eof

REM Fonction pour sauvegarder les logs
:backup_logs
call :log "Sauvegarde des logs..."

call :create_timestamp
set "backup_file=%BACKUP_DIR%\logs\logs_%timestamp%.tar.gz"

REM Créer un fichier temporaire pour lister les logs
set "temp_file=%TEMP%\backup_logs.txt"

REM Trouver tous les fichiers de log
dir /s /b *.log > "%temp_file%" 2>nul
dir /s /b *.out >> "%temp_file%" 2>nul
dir /s /b *.err >> "%temp_file%" 2>nul

if exist "%temp_file%" (
    for %%A in ("%temp_file%") do set "file_size=%%~zA"
    if !file_size! gtr 0 (
        tar -czf "%backup_file%" -T "%temp_file%" 2>nul
        if exist "%backup_file%" (
            for %%A in ("%backup_file%") do set "size=%%~zA"
            call :success "Logs sauvegardés: %backup_file% (Taille: %size% bytes)"
        ) else (
            call :error "Échec de la sauvegarde des logs"
            del "%temp_file%" 2>nul
            exit /b 1
        )
    ) else (
        call :warning "Aucun fichier de log trouvé"
    )
) else (
    call :warning "Aucun fichier de log trouvé"
)

del "%temp_file%" 2>nul
goto :eof

REM Fonction pour sauvegarder les configurations
:backup_config
call :log "Sauvegarde des configurations..."

call :create_timestamp
set "backup_file=%BACKUP_DIR%\config\config_%timestamp%.tar.gz"

REM Créer un fichier temporaire pour lister les configurations
set "temp_file=%TEMP%\backup_config.txt"

REM Trouver tous les fichiers de configuration
dir /s /b *.env > "%temp_file%" 2>nul
dir /s /b *.conf >> "%temp_file%" 2>nul
dir /s /b *.config >> "%temp_file%" 2>nul
dir /s /b *.ini >> "%temp_file%" 2>nul
dir /s /b *.yaml >> "%temp_file%" 2>nul
dir /s /b *.yml >> "%temp_file%" 2>nul
dir /s /b *.json >> "%temp_file%" 2>nul
dir /s /b *.xml >> "%temp_file%" 2>nul
dir /s /b *.properties >> "%temp_file%" 2>nul

if exist "%temp_file%" (
    for %%A in ("%temp_file%") do set "file_size=%%~zA"
    if !file_size! gtr 0 (
        tar -czf "%backup_file%" -T "%temp_file%" 2>nul
        if exist "%backup_file%" (
            for %%A in ("%backup_file%") do set "size=%%~zA"
            call :success "Configurations sauvegardées: %backup_file% (Taille: %size% bytes)"
        ) else (
            call :error "Échec de la sauvegarde des configurations"
            del "%temp_file%" 2>nul
            exit /b 1
        )
    ) else (
        call :warning "Aucun fichier de configuration trouvé"
    )
) else (
    call :warning "Aucun fichier de configuration trouvé"
)

del "%temp_file%" 2>nul
goto :eof

REM Fonction pour sauvegarder les images Docker
:backup_docker
call :log "Sauvegarde des images Docker..."

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "Docker n'est pas installé. Sauvegarde des images Docker ignorée."
    goto :eof
)

call :create_timestamp
set "backup_file=%BACKUP_DIR%\docker\docker_images_%timestamp%.tar"

REM Sauvegarder les images Docker
docker save -o "%backup_file%" $(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>") 2>nul
if %errorlevel% neq 0 (
    call :error "Échec de la sauvegarde des images Docker"
    exit /b 1
)

REM Compresser si demandé
if "%COMPRESS%"=="true" (
    where gzip >nul 2>&1
    if %errorlevel% equ 0 (
        gzip "%backup_file%"
        set "backup_file=%backup_file%.gz"
    )
)

if exist "%backup_file%" (
    for %%A in ("%backup_file%") do set "size=%%~zA"
    call :success "Images Docker sauvegardées: %backup_file% (Taille: %size% bytes)"
) else (
    call :error "Échec de la sauvegarde des images Docker"
    exit /b 1
)
goto :eof

REM Fonction pour créer un backup complet
:backup_all
call :log "Création d'un backup complet..."

call :create_timestamp
set "backup_file=%BACKUP_DIR%\complete_backup_%timestamp%.tar.gz"

REM Créer un fichier temporaire pour lister les fichiers à sauvegarder
set "temp_file=%TEMP%\backup_all.txt"

REM Lister tous les fichiers à sauvegarder
dir /s /b /a-d > "%temp_file%" 2>nul

REM Filtrer les fichiers à exclure
set "filtered_file=%TEMP%\backup_all_filtered.txt"
for /f "delims=" %%i in ('type "%temp_file%"') do (
    set "file=%%i"
    set "exclude=false"
    
    REM Vérifier les exclusions
    echo !file! | findstr /i "node_modules" >nul && set "exclude=true"
    echo !file! | findstr /i "dist" >nul && set "exclude=true"
    echo !file! | findstr /i "out-tsc" >nul && set "exclude=true"
    echo !file! | findstr /i "__pycache__" >nul && set "exclude=true"
    echo !file! | findstr /i ".git" >nul && set "exclude=true"
    echo !file! | findstr /i "%BACKUP_DIR%" >nul && set "exclude=true"
    echo !file! | findstr /i ".log" >nul && set "exclude=true"
    echo !file! | findstr /i ".tmp" >nul && set "exclude=true"
    echo !file! | findstr /i ".swp" >nul && set "exclude=true"
    echo !file! | findstr /i ".swo" >nul && set "exclude=true"
    echo !file! | findstr /i "~" >nul && set "exclude=true"
    echo !file! | findstr /i ".DS_Store" >nul && set "exclude=true"
    echo !file! | findstr /i "Thumbs.db" >nul && set "exclude=true"
    
    if "!exclude!"=="false" echo !file! >> "%filtered_file%"
)

if exist "%filtered_file%" (
    for %%A in ("%filtered_file%") do set "file_size=%%~zA"
    if !file_size! gtr 0 (
        tar -czf "%backup_file%" -T "%filtered_file%" 2>nul
        if exist "%backup_file%" (
            for %%A in ("%backup_file%") do set "size=%%~zA"
            call :success "Backup complet créé: %backup_file% (Taille: %size% bytes)"
        ) else (
            call :error "Échec de la sauvegarde complète"
            del "%temp_file%" 2>nul
            del "%filtered_file%" 2>nul
            exit /b 1
        )
    ) else (
        call :error "Aucun fichier à sauvegarder"
        del "%temp_file%" 2>nul
        del "%filtered_file%" 2>nul
        exit /b 1
    )
) else (
    call :error "Aucun fichier à sauvegarder"
    del "%temp_file%" 2>nul
    exit /b 1
)

del "%temp_file%" 2>nul
del "%filtered_file%" 2>nul
goto :eof

REM Fonction pour nettoyer les anciens backups
:cleanup_old_backups
call :log "Nettoyage des anciens backups..."

set "deleted_count=0"

REM Nettoyer les backups de code
if exist "%BACKUP_DIR%\code" (
    forfiles /p "%BACKUP_DIR%\code" /m *.tar.gz /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
    for /f %%i in ('forfiles /p "%BACKUP_DIR%\code" /m *.tar.gz /d -%RETENTION_DAYS% /c "cmd /c echo @path" 2^>nul') do set /a deleted_count+=1
)

REM Nettoyer les backups de base de données
if exist "%BACKUP_DIR%\database" (
    forfiles /p "%BACKUP_DIR%\database" /m *.sql* /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
    for /f %%i in ('forfiles /p "%BACKUP_DIR%\database" /m *.sql* /d -%RETENTION_DAYS% /c "cmd /c echo @path" 2^>nul') do set /a deleted_count+=1
)

REM Nettoyer les backups de logs
if exist "%BACKUP_DIR%\logs" (
    forfiles /p "%BACKUP_DIR%\logs" /m *.tar.gz /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
    for /f %%i in ('forfiles /p "%BACKUP_DIR%\logs" /m *.tar.gz /d -%RETENTION_DAYS% /c "cmd /c echo @path" 2^>nul') do set /a deleted_count+=1
)

REM Nettoyer les backups de configuration
if exist "%BACKUP_DIR%\config" (
    forfiles /p "%BACKUP_DIR%\config" /m *.tar.gz /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
    for /f %%i in ('forfiles /p "%BACKUP_DIR%\config" /m *.tar.gz /d -%RETENTION_DAYS% /c "cmd /c echo @path" 2^>nul') do set /a deleted_count+=1
)

REM Nettoyer les backups Docker
if exist "%BACKUP_DIR%\docker" (
    forfiles /p "%BACKUP_DIR%\docker" /m *.tar* /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
    for /f %%i in ('forfiles /p "%BACKUP_DIR%\docker" /m *.tar* /d -%RETENTION_DAYS% /c "cmd /c echo @path" 2^>nul') do set /a deleted_count+=1
)

REM Nettoyer les backups complets
if exist "%BACKUP_DIR%" (
    forfiles /p "%BACKUP_DIR%" /m complete_backup_*.tar.gz /d -%RETENTION_DAYS% /c "cmd /c del @path" 2>nul
    for /f %%i in ('forfiles /p "%BACKUP_DIR%" /m complete_backup_*.tar.gz /d -%RETENTION_DAYS% /c "cmd /c echo @path" 2^>nul') do set /a deleted_count+=1
)

if %deleted_count% gtr 0 (
    call :success "Anciens backups nettoyés: %deleted_count% fichiers supprimés"
) else (
    call :log "Aucun ancien backup à nettoyer"
)
goto :eof

REM Fonction pour vérifier l'intégrité des backups
:verify_backups
call :log "Vérification de l'intégrité des backups..."

set "verified_count=0"
set "failed_count=0"

REM Vérifier les backups de code
if exist "%BACKUP_DIR%\code" (
    for %%f in ("%BACKUP_DIR%\code\*.tar.gz") do (
        tar -tzf "%%f" >nul 2>&1
        if %errorlevel% equ 0 (
            set /a verified_count+=1
        ) else (
            set /a failed_count+=1
            call :warning "Backup corrompu: %%f"
        )
    )
)

REM Vérifier les backups de base de données
if exist "%BACKUP_DIR%\database" (
    for %%f in ("%BACKUP_DIR%\database\*.sql*") do (
        if "%%~xf"==".gz" (
            gzip -t "%%f" >nul 2>&1
            if %errorlevel% equ 0 (
                set /a verified_count+=1
            ) else (
                set /a failed_count+=1
                call :warning "Backup corrompu: %%f"
            )
        ) else (
            set /a verified_count+=1
        )
    )
)

REM Vérifier les backups de logs
if exist "%BACKUP_DIR%\logs" (
    for %%f in ("%BACKUP_DIR%\logs\*.tar.gz") do (
        tar -tzf "%%f" >nul 2>&1
        if %errorlevel% equ 0 (
            set /a verified_count+=1
        ) else (
            set /a failed_count+=1
            call :warning "Backup corrompu: %%f"
        )
    )
)

REM Vérifier les backups de configuration
if exist "%BACKUP_DIR%\config" (
    for %%f in ("%BACKUP_DIR%\config\*.tar.gz") do (
        tar -tzf "%%f" >nul 2>&1
        if %errorlevel% equ 0 (
            set /a verified_count+=1
        ) else (
            set /a failed_count+=1
            call :warning "Backup corrompu: %%f"
        )
    )
)

REM Vérifier les backups Docker
if exist "%BACKUP_DIR%\docker" (
    for %%f in ("%BACKUP_DIR%\docker\*.tar*") do (
        if "%%~xf"==".gz" (
            gzip -t "%%f" >nul 2>&1
            if %errorlevel% equ 0 (
                set /a verified_count+=1
            ) else (
                set /a failed_count+=1
                call :warning "Backup corrompu: %%f"
            )
        ) else (
            set /a verified_count+=1
        )
    )
)

REM Vérifier les backups complets
if exist "%BACKUP_DIR%" (
    for %%f in ("%BACKUP_DIR%\complete_backup_*.tar.gz") do (
        tar -tzf "%%f" >nul 2>&1
        if %errorlevel% equ 0 (
            set /a verified_count+=1
        ) else (
            set /a failed_count+=1
            call :warning "Backup corrompu: %%f"
        )
    )
)

if %failed_count% equ 0 (
    call :success "Tous les backups sont intègres (%verified_count% fichiers vérifiés)"
) else (
    call :warning "Backups vérifiés: %verified_count% OK, %failed_count% corrompus"
)
goto :eof

REM Fonction pour lister les backups
:list_backups
call :log "Liste des backups disponibles..."

echo === Backups de code ===
if exist "%BACKUP_DIR%\code" (
    dir /b "%BACKUP_DIR%\code\*.tar.gz" 2>nul || echo Aucun backup de code
) else (
    echo Aucun backup de code
)

echo === Backups de base de données ===
if exist "%BACKUP_DIR%\database" (
    dir /b "%BACKUP_DIR%\database\*.sql*" 2>nul || echo Aucun backup de base de données
) else (
    echo Aucun backup de base de données
)

echo === Backups de logs ===
if exist "%BACKUP_DIR%\logs" (
    dir /b "%BACKUP_DIR%\logs\*.tar.gz" 2>nul || echo Aucun backup de logs
) else (
    echo Aucun backup de logs
)

echo === Backups de configuration ===
if exist "%BACKUP_DIR%\config" (
    dir /b "%BACKUP_DIR%\config\*.tar.gz" 2>nul || echo Aucun backup de configuration
) else (
    echo Aucun backup de configuration
)

echo === Backups Docker ===
if exist "%BACKUP_DIR%\docker" (
    dir /b "%BACKUP_DIR%\docker\*.tar*" 2>nul || echo Aucun backup Docker
) else (
    echo Aucun backup Docker
)

echo === Backups complets ===
if exist "%BACKUP_DIR%" (
    dir /b "%BACKUP_DIR%\complete_backup_*.tar.gz" 2>nul || echo Aucun backup complet
) else (
    echo Aucun backup complet
)
goto :eof

REM Fonction pour restaurer un backup
:restore_backup
set "backup_file=%~2"

if "%backup_file%"=="" (
    call :error "Fichier de backup non spécifié"
    exit /b 1
)

if not exist "%backup_file%" (
    call :error "Fichier de backup non trouvé: %backup_file%"
    exit /b 1
)

call :log "Restauration du backup: %backup_file%"

REM Déterminer le type de backup
echo "%backup_file%" | findstr /i "complete_backup" >nul
if %errorlevel% equ 0 (
    call :log "Restauration d'un backup complet..."
    tar -xzf "%backup_file%" -C . 2>nul
    if %errorlevel% neq 0 (
        call :error "Échec de la restauration du backup complet"
        exit /b 1
    )
) else (
    echo "%backup_file%" | findstr /i "source_code" >nul
    if %errorlevel% equ 0 (
        call :log "Restauration du code source..."
        tar -xzf "%backup_file%" -C . 2>nul
        if %errorlevel% neq 0 (
            call :error "Échec de la restauration du code source"
            exit /b 1
        )
    ) else (
        echo "%backup_file%" | findstr /i "database" >nul
        if %errorlevel% equ 0 (
            call :log "Restauration de la base de données..."
            if "%~xf"==".gz" (
                gunzip -c "%backup_file%" | psql -d tuto_angular 2>nul
                if %errorlevel% neq 0 (
                    call :error "Échec de la restauration de la base de données"
                    exit /b 1
                )
            ) else (
                psql -d tuto_angular < "%backup_file%" 2>nul
                if %errorlevel% neq 0 (
                    call :error "Échec de la restauration de la base de données"
                    exit /b 1
                )
            )
        ) else (
            echo "%backup_file%" | findstr /i "logs" >nul
            if %errorlevel% equ 0 (
                call :log "Restauration des logs..."
                tar -xzf "%backup_file%" -C . 2>nul
                if %errorlevel% neq 0 (
                    call :error "Échec de la restauration des logs"
                    exit /b 1
                )
            ) else (
                echo "%backup_file%" | findstr /i "config" >nul
                if %errorlevel% equ 0 (
                    call :log "Restauration des configurations..."
                    tar -xzf "%backup_file%" -C . 2>nul
                    if %errorlevel% neq 0 (
                        call :error "Échec de la restauration des configurations"
                        exit /b 1
                    )
                ) else (
                    echo "%backup_file%" | findstr /i "docker" >nul
                    if %errorlevel% equ 0 (
                        call :log "Restauration des images Docker..."
                        if "%~xf"==".gz" (
                            gunzip -c "%backup_file%" | docker load 2>nul
                            if %errorlevel% neq 0 (
                                call :error "Échec de la restauration des images Docker"
                                exit /b 1
                            )
                        ) else (
                            docker load < "%backup_file%" 2>nul
                            if %errorlevel% neq 0 (
                                call :error "Échec de la restauration des images Docker"
                                exit /b 1
                            )
                        )
                    ) else (
                        call :error "Type de backup non reconnu: %backup_file%"
                        exit /b 1
                    )
                )
            )
        )
    )
)

call :success "Backup restauré avec succès: %backup_file%"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %~nx0 [BACKUP_TYPE] [OPTIONS]
echo.
echo Backup Types:
echo   all         Tous les types de backup (défaut)
echo   code        Code source seulement
echo   database    Base de données seulement
echo   logs        Logs seulement
echo   config      Configurations seulement
echo   docker      Images Docker seulement
echo   complete    Backup complet
echo   cleanup     Nettoyer les anciens backups
echo   verify      Vérifier l'intégrité des backups
echo   list        Lister les backups disponibles
echo   restore     Restaurer un backup
echo   help        Afficher cette aide
echo.
echo Options:
echo   BACKUP_DIR     Répertoire de backup (défaut: backups)
echo   RETENTION_DAYS Jours de rétention (défaut: 30)
echo   COMPRESS       Compression (défaut: true)
echo.
echo Examples:
echo   %~nx0 all
echo   %~nx0 code
echo   %~nx0 restore /path/to/backup.tar.gz
echo   set BACKUP_DIR=/custom/backup && %~nx0 all
goto :eof

REM Fonction principale
:main
if "%BACKUP_TYPE%"=="all" (
    call :check_prerequisites
    call :create_directories
    call :backup_code
    call :backup_database
    call :backup_logs
    call :backup_config
    call :backup_docker
    call :cleanup_old_backups
) else if "%BACKUP_TYPE%"=="code" (
    call :check_prerequisites
    call :create_directories
    call :backup_code
) else if "%BACKUP_TYPE%"=="database" (
    call :check_prerequisites
    call :create_directories
    call :backup_database
) else if "%BACKUP_TYPE%"=="logs" (
    call :check_prerequisites
    call :create_directories
    call :backup_logs
) else if "%BACKUP_TYPE%"=="config" (
    call :check_prerequisites
    call :create_directories
    call :backup_config
) else if "%BACKUP_TYPE%"=="docker" (
    call :check_prerequisites
    call :create_directories
    call :backup_docker
) else if "%BACKUP_TYPE%"=="complete" (
    call :check_prerequisites
    call :create_directories
    call :backup_all
) else if "%BACKUP_TYPE%"=="cleanup" (
    call :cleanup_old_backups
) else if "%BACKUP_TYPE%"=="verify" (
    call :verify_backups
) else if "%BACKUP_TYPE%"=="list" (
    call :list_backups
) else if "%BACKUP_TYPE%"=="restore" (
    call :restore_backup %*
) else if "%BACKUP_TYPE%"=="help" (
    call :show_help
) else if "%BACKUP_TYPE%"=="--help" (
    call :show_help
) else if "%BACKUP_TYPE%"=="-h" (
    call :show_help
) else (
    call :error "Type de backup inconnu: %BACKUP_TYPE%"
    call :show_help
    exit /b 1
)
goto :eof

REM Exécuter la fonction principale
call :main
