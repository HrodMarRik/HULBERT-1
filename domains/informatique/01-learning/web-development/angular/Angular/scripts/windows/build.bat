@echo off
setlocal enabledelayedexpansion

REM Script de build pour le tutoriel Angular n-tier (Windows)

REM Configuration
set "BUILD_TYPE=%~1"
if "%BUILD_TYPE%"=="" set "BUILD_TYPE=all"
set "BUILD_ENV=%~2"
if "%BUILD_ENV%"=="" set "BUILD_ENV=production"
set "DOCKER_REGISTRY=your-registry.com"
set "IMAGE_TAG=latest"

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
call :log "Vérification des prérequis de build..."

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
    call :warning "Docker n'est pas installé. Le build Docker sera ignoré."
)

call :success "Prérequis de build vérifiés!"
goto :eof

REM Fonction pour installer les dépendances
:install_dependencies
call :log "Installation des dépendances..."

REM Frontend
call :log "Installation des dépendances frontend..."
cd Angular\Tuto-Angular
call npm ci --only=production
cd ..\..

REM Backend
call :log "Installation des dépendances backend..."
cd Angular\Tuto-Angular\backend
call pip install -r requirements.txt
cd ..\..\..

call :success "Dépendances installées!"
goto :eof

REM Fonction pour construire le frontend
:build_frontend
call :log "Construction du frontend..."

cd Angular\Tuto-Angular

REM Nettoyer le build précédent
if exist "dist" rmdir /s /q "dist"

REM Build selon l'environnement
if "%BUILD_ENV%"=="development" (
    call npm run build
) else if "%BUILD_ENV%"=="production" (
    call npm run build:prod
) else if "%BUILD_ENV%"=="staging" (
    call npm run build:prod
) else (
    call :error "Environnement de build inconnu: %BUILD_ENV%"
    exit /b 1
)

REM Vérifier que le build a réussi
if not exist "dist\tuto-angular" (
    call :error "Build frontend échoué"
    exit /b 1
)

cd ..\..

call :success "Frontend construit avec succès!"
goto :eof

REM Fonction pour construire le backend
:build_backend
call :log "Construction du backend..."

cd Angular\Tuto-Angular\backend

REM Nettoyer les fichiers Python compilés
for /d /r . %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
for /r . %%f in (*.pyc) do @if exist "%%f" del "%%f"

REM Vérifier la syntaxe Python
python -m py_compile main.py

REM Vérifier que les dépendances sont installées
python -c "import fastapi, uvicorn, sqlalchemy, psycopg2"

cd ..\..\..

call :success "Backend construit avec succès!"
goto :eof

REM Fonction pour construire les images Docker
:build_docker_images
call :log "Construction des images Docker..."

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "Docker n'est pas installé. Construction des images ignorée."
    goto :eof
)

REM Frontend
call :log "Construction de l'image Docker frontend..."
docker build -t %DOCKER_REGISTRY%/tuto-angular-frontend:%IMAGE_TAG% .

REM Backend
call :log "Construction de l'image Docker backend..."
docker build -t %DOCKER_REGISTRY%/tuto-angular-backend:%IMAGE_TAG% ./backend

call :success "Images Docker construites avec succès!"
goto :eof

REM Fonction pour optimiser les assets
:optimize_assets
call :log "Optimisation des assets..."

cd Angular\Tuto-Angular\dist\tuto-angular

REM Optimiser les images
where imagemin >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Optimisation des images..."
    for /r . %%f in (*.png *.jpg *.jpeg) do (
        imagemin "%%f" --out-dir="%%~dpf" --plugin=pngquant --plugin=mozjpeg
    )
) else (
    call :warning "imagemin n'est pas installé. Optimisation des images ignorée."
)

REM Minifier les CSS et JS
where uglifyjs >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Minification des fichiers JavaScript..."
    for /r . %%f in (*.js) do (
        uglifyjs "%%f" -o "%%f" -c -m
    )
) else (
    call :warning "uglifyjs n'est pas installé. Minification JavaScript ignorée."
)

where cleancss >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Minification des fichiers CSS..."
    for /r . %%f in (*.css) do (
        cleancss -o "%%f" "%%f"
    )
) else (
    call :warning "cleancss n'est pas installé. Minification CSS ignorée."
)

cd ..\..\..

call :success "Assets optimisés!"
goto :eof

REM Fonction pour générer les manifestes
:generate_manifests
call :log "Génération des manifestes..."

REM Manifeste Docker Compose
echo version: '3.8' > docker-compose.%BUILD_ENV%.yml
echo. >> docker-compose.%BUILD_ENV%.yml
echo services: >> docker-compose.%BUILD_ENV%.yml
echo   frontend: >> docker-compose.%BUILD_ENV%.yml
echo     image: %DOCKER_REGISTRY%/tuto-angular-frontend:%IMAGE_TAG% >> docker-compose.%BUILD_ENV%.yml
echo     ports: >> docker-compose.%BUILD_ENV%.yml
echo       - "80:80" >> docker-compose.%BUILD_ENV%.yml
echo     environment: >> docker-compose.%BUILD_ENV%.yml
echo       - NODE_ENV=%BUILD_ENV% >> docker-compose.%BUILD_ENV%.yml
echo     depends_on: >> docker-compose.%BUILD_ENV%.yml
echo       - backend >> docker-compose.%BUILD_ENV%.yml
echo. >> docker-compose.%BUILD_ENV%.yml
echo   backend: >> docker-compose.%BUILD_ENV%.yml
echo     image: %DOCKER_REGISTRY%/tuto-angular-backend:%IMAGE_TAG% >> docker-compose.%BUILD_ENV%.yml
echo     ports: >> docker-compose.%BUILD_ENV%.yml
echo       - "8000:8000" >> docker-compose.%BUILD_ENV%.yml
echo     environment: >> docker-compose.%BUILD_ENV%.yml
echo       - NODE_ENV=%BUILD_ENV% >> docker-compose.%BUILD_ENV%.yml
echo       - DATABASE_URL=postgresql://user:password@postgres:5432/tuto_angular >> docker-compose.%BUILD_ENV%.yml
echo     depends_on: >> docker-compose.%BUILD_ENV%.yml
echo       - postgres >> docker-compose.%BUILD_ENV%.yml
echo. >> docker-compose.%BUILD_ENV%.yml
echo   postgres: >> docker-compose.%BUILD_ENV%.yml
echo     image: postgres:15-alpine >> docker-compose.%BUILD_ENV%.yml
echo     environment: >> docker-compose.%BUILD_ENV%.yml
echo       - POSTGRES_DB=tuto_angular >> docker-compose.%BUILD_ENV%.yml
echo       - POSTGRES_USER=user >> docker-compose.%BUILD_ENV%.yml
echo       - POSTGRES_PASSWORD=password >> docker-compose.%BUILD_ENV%.yml
echo     volumes: >> docker-compose.%BUILD_ENV%.yml
echo       - postgres_data:/var/lib/postgresql/data >> docker-compose.%BUILD_ENV%.yml
echo. >> docker-compose.%BUILD_ENV%.yml
echo volumes: >> docker-compose.%BUILD_ENV%.yml
echo   postgres_data: >> docker-compose.%BUILD_ENV%.yml

REM Manifeste Kubernetes
if not exist "k8s" mkdir k8s
echo apiVersion: apps/v1 > k8s\deployment.%BUILD_ENV%.yaml
echo kind: Deployment >> k8s\deployment.%BUILD_ENV%.yaml
echo metadata: >> k8s\deployment.%BUILD_ENV%.yaml
echo   name: tuto-angular-frontend >> k8s\deployment.%BUILD_ENV%.yaml
echo   namespace: tuto-angular >> k8s\deployment.%BUILD_ENV%.yaml
echo spec: >> k8s\deployment.%BUILD_ENV%.yaml
echo   replicas: 3 >> k8s\deployment.%BUILD_ENV%.yaml
echo   selector: >> k8s\deployment.%BUILD_ENV%.yaml
echo     matchLabels: >> k8s\deployment.%BUILD_ENV%.yaml
echo       app: tuto-angular-frontend >> k8s\deployment.%BUILD_ENV%.yaml
echo   template: >> k8s\deployment.%BUILD_ENV%.yaml
echo     metadata: >> k8s\deployment.%BUILD_ENV%.yaml
echo       labels: >> k8s\deployment.%BUILD_ENV%.yaml
echo         app: tuto-angular-frontend >> k8s\deployment.%BUILD_ENV%.yaml
echo     spec: >> k8s\deployment.%BUILD_ENV%.yaml
echo       containers: >> k8s\deployment.%BUILD_ENV%.yaml
echo       - name: frontend >> k8s\deployment.%BUILD_ENV%.yaml
echo         image: %DOCKER_REGISTRY%/tuto-angular-frontend:%IMAGE_TAG% >> k8s\deployment.%BUILD_ENV%.yaml
echo         ports: >> k8s\deployment.%BUILD_ENV%.yaml
echo         - containerPort: 80 >> k8s\deployment.%BUILD_ENV%.yaml
echo         env: >> k8s\deployment.%BUILD_ENV%.yaml
echo         - name: NODE_ENV >> k8s\deployment.%BUILD_ENV%.yaml
echo           value: "%BUILD_ENV%" >> k8s\deployment.%BUILD_ENV%.yaml
echo --- >> k8s\deployment.%BUILD_ENV%.yaml
echo apiVersion: apps/v1 >> k8s\deployment.%BUILD_ENV%.yaml
echo kind: Deployment >> k8s\deployment.%BUILD_ENV%.yaml
echo metadata: >> k8s\deployment.%BUILD_ENV%.yaml
echo   name: tuto-angular-backend >> k8s\deployment.%BUILD_ENV%.yaml
echo   namespace: tuto-angular >> k8s\deployment.%BUILD_ENV%.yaml
echo spec: >> k8s\deployment.%BUILD_ENV%.yaml
echo   replicas: 2 >> k8s\deployment.%BUILD_ENV%.yaml
echo   selector: >> k8s\deployment.%BUILD_ENV%.yaml
echo     matchLabels: >> k8s\deployment.%BUILD_ENV%.yaml
echo       app: tuto-angular-backend >> k8s\deployment.%BUILD_ENV%.yaml
echo   template: >> k8s\deployment.%BUILD_ENV%.yaml
echo     metadata: >> k8s\deployment.%BUILD_ENV%.yaml
echo       labels: >> k8s\deployment.%BUILD_ENV%.yaml
echo         app: tuto-angular-backend >> k8s\deployment.%BUILD_ENV%.yaml
echo     spec: >> k8s\deployment.%BUILD_ENV%.yaml
echo       containers: >> k8s\deployment.%BUILD_ENV%.yaml
echo       - name: backend >> k8s\deployment.%BUILD_ENV%.yaml
echo         image: %DOCKER_REGISTRY%/tuto-angular-backend:%IMAGE_TAG% >> k8s\deployment.%BUILD_ENV%.yaml
echo         ports: >> k8s\deployment.%BUILD_ENV%.yaml
echo         - containerPort: 8000 >> k8s\deployment.%BUILD_ENV%.yaml
echo         env: >> k8s\deployment.%BUILD_ENV%.yaml
echo         - name: NODE_ENV >> k8s\deployment.%BUILD_ENV%.yaml
echo           value: "%BUILD_ENV%" >> k8s\deployment.%BUILD_ENV%.yaml
echo         - name: DATABASE_URL >> k8s\deployment.%BUILD_ENV%.yaml
echo           value: "postgresql://user:password@postgres:5432/tuto_angular" >> k8s\deployment.%BUILD_ENV%.yaml

call :success "Manifestes générés!"
goto :eof

REM Fonction pour créer l'archive de déploiement
:create_deployment_archive
call :log "Création de l'archive de déploiement..."

REM Créer le répertoire de déploiement
if not exist "deploy\%BUILD_ENV%" mkdir "deploy\%BUILD_ENV%"

REM Copier les fichiers nécessaires
xcopy "Angular\Tuto-Angular\dist\tuto-angular" "deploy\%BUILD_ENV%\frontend" /E /I /Q
xcopy "Angular\Tuto-Angular\backend" "deploy\%BUILD_ENV%\backend" /E /I /Q
copy "docker-compose.%BUILD_ENV%.yml" "deploy\%BUILD_ENV%\"
copy "k8s\deployment.%BUILD_ENV%.yaml" "deploy\%BUILD_ENV%\"
copy "nginx.conf" "deploy\%BUILD_ENV%\"

REM Créer l'archive
powershell -Command "Compress-Archive -Path 'deploy\%BUILD_ENV%\*' -DestinationPath 'deploy\tuto-angular-%BUILD_ENV%-%IMAGE_TAG%.zip' -Force"

call :success "Archive de déploiement créée: deploy\tuto-angular-%BUILD_ENV%-%IMAGE_TAG%.zip"
goto :eof

REM Fonction pour nettoyer
:cleanup
call :log "Nettoyage des fichiers temporaires..."

REM Nettoyer le frontend
if exist "Angular\Tuto-Angular\dist" rmdir /s /q "Angular\Tuto-Angular\dist"
if exist "Angular\Tuto-Angular\out-tsc" rmdir /s /q "Angular\Tuto-Angular\out-tsc"
if exist "Angular\Tuto-Angular\node_modules" rmdir /s /q "Angular\Tuto-Angular\node_modules"

REM Nettoyer le backend
for /d /r "Angular\Tuto-Angular\backend" %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
for /r "Angular\Tuto-Angular\backend" %%f in (*.pyc) do @if exist "%%f" del "%%f"

REM Nettoyer les images Docker
where docker >nul 2>&1
if %errorlevel% equ 0 (
    docker image prune -f
)

call :success "Nettoyage terminé!"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %0 [BUILD_TYPE] [BUILD_ENV]
echo.
echo Build Types:
echo   all         Tout construire (défaut)
echo   frontend    Frontend seulement
echo   backend     Backend seulement
echo   docker      Images Docker seulement
echo   optimize    Optimisation des assets seulement
echo   manifest    Génération des manifestes seulement
echo   archive     Création de l'archive de déploiement seulement
echo   clean       Nettoyage seulement
echo   help        Afficher cette aide
echo.
echo Build Environments:
echo   production  Environnement de production (défaut)
echo   staging     Environnement de staging
echo   development Environnement de développement
echo.
echo Environment Variables:
echo   DOCKER_REGISTRY  Registry Docker (défaut: your-registry.com)
echo   IMAGE_TAG        Tag de l'image Docker (défaut: latest)
echo.
echo Examples:
echo   %0 all production
echo   %0 frontend staging
echo   set DOCKER_REGISTRY=my-registry.com ^& set IMAGE_TAG=v1.0.0 ^& %0 docker
goto :eof

REM Fonction principale
:main
if "%BUILD_TYPE%"=="all" goto :run_all_builds
if "%BUILD_TYPE%"=="frontend" goto :run_frontend_build
if "%BUILD_TYPE%"=="backend" goto :run_backend_build
if "%BUILD_TYPE%"=="docker" goto :run_docker_build
if "%BUILD_TYPE%"=="optimize" goto :run_optimize_build
if "%BUILD_TYPE%"=="manifest" goto :run_manifest_build
if "%BUILD_TYPE%"=="archive" goto :run_archive_build
if "%BUILD_TYPE%"=="clean" goto :run_clean_build
if "%BUILD_TYPE%"=="help" goto :show_help
if "%BUILD_TYPE%"=="--help" goto :show_help
if "%BUILD_TYPE%"=="-h" goto :show_help

call :error "Type de build inconnu: %BUILD_TYPE%"
call :show_help
exit /b 1

:run_all_builds
call :check_prerequisites
call :install_dependencies
call :build_frontend
call :build_backend
call :build_docker_images
call :optimize_assets
call :generate_manifests
call :create_deployment_archive
goto :eof

:run_frontend_build
call :check_prerequisites
call :install_dependencies
call :build_frontend
goto :eof

:run_backend_build
call :check_prerequisites
call :install_dependencies
call :build_backend
goto :eof

:run_docker_build
call :check_prerequisites
call :build_docker_images
goto :eof

:run_optimize_build
call :optimize_assets
goto :eof

:run_manifest_build
call :generate_manifests
goto :eof

:run_archive_build
call :create_deployment_archive
goto :eof

:run_clean_build
call :cleanup
goto :eof

:help
call :show_help
exit /b 0

REM Exécuter la fonction principale
call :main %1 %2
