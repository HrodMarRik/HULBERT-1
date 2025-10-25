@echo off
setlocal enabledelayedexpansion

REM Script de configuration pour le tutoriel Angular n-tier (Windows)

set "CONFIG_TYPE=%~1"
if "%CONFIG_TYPE%"=="" set "CONFIG_TYPE=all"

set "CONFIG_DIR=%CONFIG_DIR%"
if "%CONFIG_DIR%"=="" set "CONFIG_DIR=config"

set "TEMPLATE_DIR=%TEMPLATE_DIR%"
if "%TEMPLATE_DIR%"=="" set "TEMPLATE_DIR=templates"

REM Fonction pour afficher les messages
:log
echo [INFO] %~1
goto :eof

:success
echo [SUCCESS] %~1
goto :eof

:warn
echo [WARNING] %~1
goto :eof

:error
echo [ERROR] %~1
goto :eof

REM Fonction pour vérifier les prérequis
:check_prerequisites
call :log "Vérification des prérequis de configuration..."

where node >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "Node.js n'est pas installé. Certaines configurations seront limitées."
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "npm n'est pas installé. Certaines configurations seront limitées."
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "Python n'est pas installé. Certaines configurations seront limitées."
)

where pip >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "pip n'est pas installé. Certaines configurations seront limitées."
)

call :success "Prérequis de configuration vérifiés!"
goto :eof

REM Fonction pour créer les répertoires nécessaires
:create_directories
call :log "Création des répertoires nécessaires..."

if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"
if not exist "%TEMPLATE_DIR%" mkdir "%TEMPLATE_DIR%"
if not exist "%CONFIG_DIR%\environments" mkdir "%CONFIG_DIR%\environments"
if not exist "%CONFIG_DIR%\database" mkdir "%CONFIG_DIR%\database"
if not exist "%CONFIG_DIR%\nginx" mkdir "%CONFIG_DIR%\nginx"
if not exist "%CONFIG_DIR%\docker" mkdir "%CONFIG_DIR%\docker"
if not exist "%CONFIG_DIR%\ci-cd" mkdir "%CONFIG_DIR%\ci-cd"

call :success "Répertoires créés!"
goto :eof

REM Fonction pour configurer l'environnement de développement
:configure_development
call :log "Configuration de l'environnement de développement..."

REM Configuration Angular
if exist "Angular\Tuto-Angular\package.json" (
    call :log "Configuration du projet Angular..."
    
    REM Installer les dépendances
    cd "Angular\Tuto-Angular"
    npm install
    if %errorlevel% neq 0 (
        call :error "Échec de l'installation des dépendances Angular"
        exit /b 1
    )
    cd /d "%~dp0"
    
    call :success "Projet Angular configuré!"
) else (
    call :warn "Projet Angular non trouvé. Configuration ignorée."
)

REM Configuration Python
if exist "backend\requirements.txt" (
    call :log "Configuration du projet Python..."
    
    REM Créer un environnement virtuel
    python -m venv backend\venv
    if %errorlevel% neq 0 (
        call :error "Échec de la création de l'environnement virtuel Python"
        exit /b 1
    )
    
    REM Activer l'environnement virtuel et installer les dépendances
    call backend\venv\Scripts\activate.bat
    pip install -r backend\requirements.txt
    if %errorlevel% neq 0 (
        call :error "Échec de l'installation des dépendances Python"
        exit /b 1
    )
    call backend\venv\Scripts\deactivate.bat
    
    call :success "Projet Python configuré!"
) else (
    call :warn "Projet Python non trouvé. Configuration ignorée."
)
goto :eof

REM Fonction pour configurer la base de données
:configure_database
call :log "Configuration de la base de données..."

REM Configuration PostgreSQL
where psql >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Configuration de PostgreSQL..."
    
    REM Créer la base de données
    createdb tuto_angular
    if %errorlevel% neq 0 (
        call :warn "Base de données 'tuto_angular' existe déjà ou erreur de création"
    )
    
    REM Créer les tables
    if exist "backend\database\models.py" (
        call :log "Création des tables..."
        
        REM Activer l'environnement virtuel et exécuter les migrations
        call backend\venv\Scripts\activate.bat
        python -c "from backend.database.models import Base; from backend.database.connection import engine; Base.metadata.create_all(bind=engine); print('Tables créées avec succès!')"
        if %errorlevel% neq 0 (
            call :error "Échec de la création des tables"
            exit /b 1
        )
        call backend\venv\Scripts\deactivate.bat
        
        call :success "Tables créées avec succès!"
    ) else (
        call :warn "Fichier models.py non trouvé. Création des tables ignorée."
    )
    
    call :success "PostgreSQL configuré!"
) else (
    call :warn "PostgreSQL n'est pas installé. Configuration de la base de données ignorée."
)
goto :eof

REM Fonction pour configurer Docker
:configure_docker
call :log "Configuration de Docker..."

where docker >nul 2>&1
if %errorlevel% equ 0 (
    REM Construire les images Docker
    if exist "docker-compose.yml" (
        call :log "Construction des images Docker..."
        
        docker-compose build
        if %errorlevel% neq 0 (
            call :error "Échec de la construction des images Docker"
            exit /b 1
        )
        
        call :success "Images Docker construites!"
    ) else (
        call :warn "Fichier docker-compose.yml non trouvé. Construction des images ignorée."
    )
    
    call :success "Docker configuré!"
) else (
    call :warn "Docker n'est pas installé. Configuration Docker ignorée."
)
goto :eof

REM Fonction pour configurer Nginx
:configure_nginx
call :log "Configuration de Nginx..."

where nginx >nul 2>&1
if %errorlevel% equ 0 (
    REM Copier la configuration Nginx
    if exist "nginx.conf" (
        call :log "Copie de la configuration Nginx..."
        
        copy nginx.conf "%CONFIG_DIR%\nginx\"
        if %errorlevel% neq 0 (
            call :warn "Échec de la copie de la configuration Nginx"
            exit /b 1
        )
        
        call :success "Configuration Nginx copiée!"
    ) else (
        call :warn "Fichier nginx.conf non trouvé. Configuration Nginx ignorée."
    )
    
    call :success "Nginx configuré!"
) else (
    call :warn "Nginx n'est pas installé. Configuration Nginx ignorée."
)
goto :eof

REM Fonction pour configurer CI/CD
:configure_cicd
call :log "Configuration de CI/CD..."

REM Configuration GitHub Actions
if exist ".github\workflows" (
    call :log "Configuration de GitHub Actions..."
    
    REM Vérifier que les fichiers de workflow existent
    if exist ".github\workflows\ci-cd.yml" (
        call :success "Workflow GitHub Actions configuré!"
    ) else (
        call :warn "Fichier de workflow GitHub Actions non trouvé."
    )
) else (
    call :warn "Répertoire .github\workflows non trouvé. Configuration CI/CD ignorée."
)

call :success "CI/CD configuré!"
goto :eof

REM Fonction pour configurer les environnements
:configure_environments
call :log "Configuration des environnements..."

REM Configuration de l'environnement de développement
if exist "Angular\Tuto-Angular\src\environments\environment.ts" (
    call :log "Configuration de l'environnement de développement..."
    
    REM Vérifier que la configuration est correcte
    findstr /i "apiUrl.*localhost" "Angular\Tuto-Angular\src\environments\environment.ts" >nul
    if %errorlevel% equ 0 (
        call :success "Environnement de développement configuré!"
    ) else (
        call :warn "Configuration de l'environnement de développement à vérifier."
    )
) else (
    call :warn "Fichier environment.ts non trouvé. Configuration de l'environnement ignorée."
)

REM Configuration de l'environnement de production
if exist "Angular\Tuto-Angular\src\environments\environment.prod.ts" (
    call :log "Configuration de l'environnement de production..."
    
    REM Vérifier que la configuration est correcte
    findstr /i "apiUrl.*yourdomain" "Angular\Tuto-Angular\src\environments\environment.prod.ts" >nul
    if %errorlevel% equ 0 (
        call :success "Environnement de production configuré!"
    ) else (
        call :warn "Configuration de l'environnement de production à vérifier."
    )
) else (
    call :warn "Fichier environment.prod.ts non trouvé. Configuration de l'environnement ignorée."
)

call :success "Environnements configurés!"
goto :eof

REM Fonction pour configurer les outils de développement
:configure_dev_tools
call :log "Configuration des outils de développement..."

REM Configuration ESLint
if exist "Angular\Tuto-Angular\.eslintrc.json" (
    call :log "Configuration d'ESLint..."
    
    REM Installer ESLint globalement si nécessaire
    where eslint >nul 2>&1
    if %errorlevel% neq 0 (
        npm install -g eslint
        if %errorlevel% neq 0 (
            call :warn "Échec de l'installation globale d'ESLint"
        )
    )
    
    call :success "ESLint configuré!"
) else (
    call :warn "Fichier .eslintrc.json non trouvé. Configuration ESLint ignorée."
)

REM Configuration Prettier
if exist "Angular\Tuto-Angular\.prettierrc" (
    call :log "Configuration de Prettier..."
    
    REM Installer Prettier globalement si nécessaire
    where prettier >nul 2>&1
    if %errorlevel% neq 0 (
        npm install -g prettier
        if %errorlevel% neq 0 (
            call :warn "Échec de l'installation globale de Prettier"
        )
    )
    
    call :success "Prettier configuré!"
) else (
    call :warn "Fichier .prettierrc non trouvé. Configuration Prettier ignorée."
)

call :success "Outils de développement configurés!"
goto :eof

REM Fonction pour configurer tout
:configure_all
call :log "Configuration complète..."

call :configure_development
call :configure_database
call :configure_docker
call :configure_nginx
call :configure_cicd
call :configure_environments
call :configure_dev_tools

call :success "Configuration complète terminée!"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %~nx0 [CONFIG_TYPE] [OPTIONS]
echo.
echo Configuration Types:
echo   all         Toutes les configurations (défaut)
echo   development Configuration de l'environnement de développement
echo   database    Configuration de la base de données
echo   docker      Configuration de Docker
echo   nginx       Configuration de Nginx
echo   cicd        Configuration de CI/CD
echo   environments Configuration des environnements
echo   dev-tools   Configuration des outils de développement
echo   help        Afficher cette aide
echo.
echo Options:
echo   CONFIG_DIR    Répertoire de configuration (défaut: config)
echo   TEMPLATE_DIR  Répertoire des modèles (défaut: templates)
echo.
echo Examples:
echo   %~nx0 all
echo   %~nx0 development
echo   set CONFIG_DIR=/custom/config && %~nx0 all
goto :eof

REM Fonction principale
:main
if "%CONFIG_TYPE%"=="all" (
    call :check_prerequisites
    call :create_directories
    call :configure_all
) else if "%CONFIG_TYPE%"=="development" (
    call :check_prerequisites
    call :create_directories
    call :configure_development
) else if "%CONFIG_TYPE%"=="database" (
    call :check_prerequisites
    call :create_directories
    call :configure_database
) else if "%CONFIG_TYPE%"=="docker" (
    call :check_prerequisites
    call :create_directories
    call :configure_docker
) else if "%CONFIG_TYPE%"=="nginx" (
    call :check_prerequisites
    call :create_directories
    call :configure_nginx
) else if "%CONFIG_TYPE%"=="cicd" (
    call :check_prerequisites
    call :create_directories
    call :configure_cicd
) else if "%CONFIG_TYPE%"=="environments" (
    call :check_prerequisites
    call :create_directories
    call :configure_environments
) else if "%CONFIG_TYPE%"=="dev-tools" (
    call :check_prerequisites
    call :create_directories
    call :configure_dev_tools
) else if "%CONFIG_TYPE%"=="help" (
    call :show_help
) else if "%CONFIG_TYPE%"=="--help" (
    call :show_help
) else if "%CONFIG_TYPE%"=="-h" (
    call :show_help
) else (
    call :error "Type de configuration inconnu: %CONFIG_TYPE%"
    call :show_help
    exit /b 1
)
goto :eof

REM Exécuter la fonction principale
call :main
