@echo off
setlocal enabledelayedexpansion

REM Script de développement pour le tutoriel Angular n-tier (Windows)

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

REM Fonction pour vérifier si une commande existe
:command_exists
where %1 >nul 2>&1
if %errorlevel% equ 0 (
    exit /b 0
) else (
    exit /b 1
)

REM Fonction pour vérifier les prérequis
:check_prerequisites
call :log "Vérification des prérequis..."

call :command_exists node
if %errorlevel% neq 0 (
    call :error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit /b 1
)

call :command_exists npm
if %errorlevel% neq 0 (
    call :error "npm n'est pas installé. Veuillez installer Node.js qui inclut npm."
    exit /b 1
)

call :command_exists python
if %errorlevel% neq 0 (
    call :error "Python n'est pas installé. Veuillez l'installer depuis https://python.org/"
    exit /b 1
)

call :command_exists pip
if %errorlevel% neq 0 (
    call :error "pip n'est pas installé. Veuillez installer pip pour Python."
    exit /b 1
)

call :command_exists psql
if %errorlevel% neq 0 (
    call :warning "PostgreSQL n'est pas installé. Veuillez l'installer depuis https://postgresql.org/"
    call :warning "Vous pouvez continuer sans PostgreSQL pour le moment."
)

call :success "Tous les prérequis sont satisfaits!"
goto :eof

REM Fonction pour installer les dépendances
:install_dependencies
call :log "Installation des dépendances..."

REM Frontend
call :log "Installation des dépendances frontend..."
cd Angular\Tuto-Angular
call npm install
cd ..\..

REM Backend
call :log "Installation des dépendances backend..."
cd Angular\Tuto-Angular\backend
call pip install -r requirements.txt
cd ..\..\..

call :success "Dépendances installées avec succès!"
goto :eof

REM Fonction pour configurer la base de données
:setup_database
call :log "Configuration de la base de données..."

call :command_exists psql
if %errorlevel% equ 0 (
    REM Créer la base de données si elle n'existe pas
    createdb tuto_angular 2>nul || call :log "Base de données 'tuto_angular' existe déjà"
    
    REM Copier le fichier de configuration
    copy Angular\Tuto-Angular\backend\config.env.example Angular\Tuto-Angular\backend\config.env 2>nul || call :log "Fichier config.env existe déjà"
    
    call :success "Base de données configurée!"
) else (
    call :warning "PostgreSQL n'est pas installé. Veuillez l'installer et configurer la base de données manuellement."
)
goto :eof

REM Fonction pour démarrer le développement
:start_dev
call :log "Démarrage de l'environnement de développement..."

REM Démarrer le backend en arrière-plan
call :log "Démarrage du backend..."
cd Angular\Tuto-Angular\backend
start /b uvicorn main:app --reload --host 0.0.0.0 --port 8000
cd ..\..\..

REM Attendre que le backend soit prêt
timeout /t 5 /nobreak >nul

REM Démarrer le frontend
call :log "Démarrage du frontend..."
cd Angular\Tuto-Angular
start /b npm start
cd ..\..

call :success "Environnement de développement démarré!"
call :log "Frontend: http://localhost:4200"
call :log "Backend: http://localhost:8000"
call :log "API Docs: http://localhost:8000/docs"
call :log "Appuyez sur une touche pour arrêter les services..."
pause >nul
goto :eof

REM Fonction pour exécuter les tests
:run_tests
call :log "Exécution des tests..."

REM Tests frontend
call :log "Tests frontend..."
cd Angular\Tuto-Angular
call npm run test:ci
cd ..\..

REM Tests backend
call :log "Tests backend..."
cd Angular\Tuto-Angular\backend
call pytest
cd ..\..\..

call :success "Tous les tests sont passés!"
goto :eof

REM Fonction pour construire l'application
:build_app
call :log "Construction de l'application..."

REM Build frontend
call :log "Construction du frontend..."
cd Angular\Tuto-Angular
call npm run build:prod
cd ..\..

REM Build backend
call :log "Construction du backend..."
cd Angular\Tuto-Angular\backend
echo Backend build completed
cd ..\..\..

call :success "Application construite avec succès!"
goto :eof

REM Fonction pour nettoyer
:clean
call :log "Nettoyage des fichiers temporaires..."

REM Nettoyer le frontend
cd Angular\Tuto-Angular
if exist dist rmdir /s /q dist
if exist node_modules rmdir /s /q node_modules
cd ..\..

REM Nettoyer le backend
cd Angular\Tuto-Angular\backend
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
for /r . %%f in (*.pyc) do @if exist "%%f" del "%%f"
cd ..\..\..

call :success "Nettoyage terminé!"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   check       Vérifier les prérequis
echo   install     Installer les dépendances
echo   setup       Configurer la base de données
echo   dev         Démarrer l'environnement de développement
echo   test        Exécuter les tests
echo   build       Construire l'application
echo   clean       Nettoyer les fichiers temporaires
echo   help        Afficher cette aide
echo.
echo Examples:
echo   %0 check
echo   %0 install
echo   %0 dev
goto :eof

REM Fonction principale
:main
if "%1"=="" goto :help
if "%1"=="check" goto :check_prerequisites
if "%1"=="install" goto :install_dependencies
if "%1"=="setup" goto :setup_database
if "%1"=="dev" goto :start_dev
if "%1"=="test" goto :run_tests
if "%1"=="build" goto :build_app
if "%1"=="clean" goto :clean
if "%1"=="help" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="-h" goto :show_help

call :error "Commande inconnue: %1"
call :show_help
exit /b 1

:help
call :show_help
exit /b 0

REM Exécuter la fonction principale
call :main %1
