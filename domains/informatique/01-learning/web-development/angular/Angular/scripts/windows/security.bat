@echo off
setlocal enabledelayedexpansion

REM Script de sécurité pour le tutoriel Angular n-tier (Windows)

set "SECURITY_TYPE=%~1"
if "%SECURITY_TYPE%"=="" set "SECURITY_TYPE=all"

set "SECURITY_DIR=%SECURITY_DIR%"
if "%SECURITY_DIR%"=="" set "SECURITY_DIR=security"

set "LOG_FILE=%LOG_FILE%"
if "%LOG_FILE%"=="" set "LOG_FILE=security.log"

REM Fonction pour afficher les messages
:log
echo [INFO] %~1 | tee -a "%LOG_FILE%"
goto :eof

:success
echo [SUCCESS] %~1 | tee -a "%LOG_FILE%"
goto :eof

:warn
echo [WARNING] %~1 | tee -a "%LOG_FILE%"
goto :eof

:error
echo [ERROR] %~1 | tee -a "%LOG_FILE%"
goto :eof

REM Fonction pour vérifier les prérequis
:check_prerequisites
call :log "Vérification des prérequis de sécurité..."

where nmap >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "nmap n'est pas installé. Certaines vérifications de sécurité seront limitées."
)

where openssl >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "OpenSSL n'est pas installé. Certaines vérifications de sécurité seront limitées."
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "Docker n'est pas installé. Certaines vérifications de sécurité seront limitées."
)

call :success "Prérequis de sécurité vérifiés!"
goto :eof

REM Fonction pour créer les répertoires nécessaires
:create_directories
call :log "Création des répertoires nécessaires..."

if not exist "%SECURITY_DIR%" mkdir "%SECURITY_DIR%"
if not exist "%SECURITY_DIR%\scans" mkdir "%SECURITY_DIR%\scans"
if not exist "%SECURITY_DIR%\reports" mkdir "%SECURITY_DIR%\reports"
if not exist "%SECURITY_DIR%\certificates" mkdir "%SECURITY_DIR%\certificates"
if not exist "%SECURITY_DIR%\keys" mkdir "%SECURITY_DIR%\keys"
if not exist "%SECURITY_DIR%\policies" mkdir "%SECURITY_DIR%\policies"

call :success "Répertoires créés!"
goto :eof

REM Fonction pour scanner les ports ouverts
:scan_ports
call :log "Scan des ports ouverts..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "scan_file=%SECURITY_DIR%\scans\port_scan_%timestamp%.txt"

where nmap >nul 2>&1
if %errorlevel% equ 0 (
    nmap -sS -O -sV localhost > "%scan_file%" 2>&1
    if %errorlevel% equ 0 (
        call :success "Scan des ports terminé: %scan_file%"
    ) else (
        call :error "Échec du scan des ports"
        exit /b 1
    )
) else (
    call :warn "nmap n'est pas installé. Scan des ports ignoré."
)
goto :eof

REM Fonction pour vérifier les certificats SSL
:check_ssl_certificates
call :log "Vérification des certificats SSL..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "cert_file=%SECURITY_DIR%\reports\ssl_certificates_%timestamp%.txt"

where openssl >nul 2>&1
if %errorlevel% equ 0 (
    REM Vérifier les certificats locaux
    for /r %%f in (*.crt *.pem *.key) do (
        echo === %%f === >> "%cert_file%"
        openssl x509 -in "%%f" -text -noout >> "%cert_file%" 2>&1
        echo. >> "%cert_file%"
    )
    
    call :success "Vérification des certificats SSL terminée: %cert_file%"
) else (
    call :warn "OpenSSL n'est pas installé. Vérification des certificats SSL ignorée."
)
goto :eof

REM Fonction pour vérifier les vulnérabilités Docker
:check_docker_security
call :log "Vérification de la sécurité Docker..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "docker_file=%SECURITY_DIR%\reports\docker_security_%timestamp%.txt"

where docker >nul 2>&1
if %errorlevel% equ 0 (
    REM Vérifier les images Docker
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" > "%docker_file%" 2>&1
    
    REM Vérifier les conteneurs en cours d'exécution
    echo === Conteneurs en cours d'exécution === >> "%docker_file%"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" >> "%docker_file%" 2>&1
    
    REM Vérifier les volumes
    echo === Volumes Docker === >> "%docker_file%"
    docker volume ls >> "%docker_file%" 2>&1
    
    REM Vérifier les réseaux
    echo === Réseaux Docker === >> "%docker_file%"
    docker network ls >> "%docker_file%" 2>&1
    
    call :success "Vérification de la sécurité Docker terminée: %docker_file%"
) else (
    call :warn "Docker n'est pas installé. Vérification de la sécurité Docker ignorée."
)
goto :eof

REM Fonction pour vérifier les permissions des fichiers
:check_file_permissions
call :log "Vérification des permissions des fichiers..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "perm_file=%SECURITY_DIR%\reports\file_permissions_%timestamp%.txt"

REM Vérifier les fichiers avec des permissions trop permissives
for /r %%f in (*) do (
    set "file=%%f"
    set "perm=%%~af"
    if "!perm!"=="777" echo !file! >> "%perm_file%"
    if "!perm!"=="666" echo !file! >> "%perm_file%"
    if "!perm!"=="644" echo !file! >> "%perm_file%"
)

call :success "Vérification des permissions des fichiers terminée: %perm_file%"
goto :eof

REM Fonction pour vérifier les mots de passe faibles
:check_weak_passwords
call :log "Vérification des mots de passe faibles..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "password_file=%SECURITY_DIR%\reports\weak_passwords_%timestamp%.txt"

REM Rechercher les mots de passe dans les fichiers de configuration
findstr /s /i "password passwd pwd" *.env *.conf *.config *.json *.yaml *.yml 2>nul >> "%password_file%"

call :success "Vérification des mots de passe faibles terminée: %password_file%"
goto :eof

REM Fonction pour vérifier les dépendances vulnérables
:check_vulnerable_dependencies
call :log "Vérification des dépendances vulnérables..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "deps_file=%SECURITY_DIR%\reports\vulnerable_dependencies_%timestamp%.txt"

REM Vérifier les dépendances npm
if exist "package.json" (
    echo === Dépendances npm === >> "%deps_file%"
    npm audit --json >> "%deps_file%" 2>&1
)

REM Vérifier les dépendances Python
if exist "requirements.txt" (
    echo === Dépendances Python === >> "%deps_file%"
    pip-audit >> "%deps_file%" 2>&1
)

call :success "Vérification des dépendances vulnérables terminée: %deps_file%"
goto :eof

REM Fonction pour générer un rapport de sécurité
:generate_security_report
call :log "Génération du rapport de sécurité..."

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%_%dt:~8,6%"
set "report_file=%SECURITY_DIR%\reports\security_report_%timestamp%.txt"

echo === Rapport de sécurité === > "%report_file%"
echo Date: %date% %time% >> "%report_file%"
echo Utilisateur: %USERNAME% >> "%report_file%"
echo Système: %COMPUTERNAME% >> "%report_file%"
echo. >> "%report_file%"

REM Résumé des vérifications
echo === Résumé des vérifications === >> "%report_file%"
echo Scan des ports: %SECURITY_DIR%\scans\*.txt >> "%report_file%"
echo Certificats SSL: %SECURITY_DIR%\reports\*ssl_certificates*.txt >> "%report_file%"
echo Sécurité Docker: %SECURITY_DIR%\reports\*docker_security*.txt >> "%report_file%"
echo Permissions fichiers: %SECURITY_DIR%\reports\*file_permissions*.txt >> "%report_file%"
echo Mots de passe faibles: %SECURITY_DIR%\reports\*weak_passwords*.txt >> "%report_file%"
echo Dépendances vulnérables: %SECURITY_DIR%\reports\*vulnerable_dependencies*.txt >> "%report_file%"
echo. >> "%report_file%"

REM Recommandations
echo === Recommandations === >> "%report_file%"
echo 1. Mettre à jour régulièrement les dépendances >> "%report_file%"
echo 2. Utiliser des mots de passe forts >> "%report_file%"
echo 3. Configurer correctement les permissions des fichiers >> "%report_file%"
echo 4. Surveiller les ports ouverts >> "%report_file%"
echo 5. Maintenir les certificats SSL à jour >> "%report_file%"
echo 6. Surveiller les conteneurs Docker >> "%report_file%"
echo. >> "%report_file%"

call :success "Rapport de sécurité généré: %report_file%"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %~nx0 [SECURITY_TYPE] [OPTIONS]
echo.
echo Security Types:
echo   all         Toutes les vérifications de sécurité (défaut)
echo   ports       Scan des ports ouverts
echo   ssl         Vérification des certificats SSL
echo   docker      Vérification de la sécurité Docker
echo   permissions Vérification des permissions des fichiers
echo   passwords   Vérification des mots de passe faibles
echo   dependencies Vérification des dépendances vulnérables
echo   report      Génération du rapport de sécurité
echo   help        Afficher cette aide
echo.
echo Options:
echo   SECURITY_DIR Répertoire de sécurité (défaut: security)
echo   LOG_FILE     Fichier de log (défaut: security.log)
echo.
echo Examples:
echo   %~nx0 all
echo   %~nx0 ports
echo   set SECURITY_DIR=/custom/security && %~nx0 all
goto :eof

REM Fonction principale
:main
if "%SECURITY_TYPE%"=="all" (
    call :check_prerequisites
    call :create_directories
    call :scan_ports
    call :check_ssl_certificates
    call :check_docker_security
    call :check_file_permissions
    call :check_weak_passwords
    call :check_vulnerable_dependencies
    call :generate_security_report
) else if "%SECURITY_TYPE%"=="ports" (
    call :check_prerequisites
    call :create_directories
    call :scan_ports
) else if "%SECURITY_TYPE%"=="ssl" (
    call :check_prerequisites
    call :create_directories
    call :check_ssl_certificates
) else if "%SECURITY_TYPE%"=="docker" (
    call :check_prerequisites
    call :create_directories
    call :check_docker_security
) else if "%SECURITY_TYPE%"=="permissions" (
    call :check_prerequisites
    call :create_directories
    call :check_file_permissions
) else if "%SECURITY_TYPE%"=="passwords" (
    call :check_prerequisites
    call :create_directories
    call :check_weak_passwords
) else if "%SECURITY_TYPE%"=="dependencies" (
    call :check_prerequisites
    call :create_directories
    call :check_vulnerable_dependencies
) else if "%SECURITY_TYPE%"=="report" (
    call :generate_security_report
) else if "%SECURITY_TYPE%"=="help" (
    call :show_help
) else if "%SECURITY_TYPE%"=="--help" (
    call :show_help
) else if "%SECURITY_TYPE%"=="-h" (
    call :show_help
) else (
    call :error "Type de vérification de sécurité inconnu: %SECURITY_TYPE%"
    call :show_help
    exit /b 1
)
goto :eof

REM Exécuter la fonction principale
call :main
