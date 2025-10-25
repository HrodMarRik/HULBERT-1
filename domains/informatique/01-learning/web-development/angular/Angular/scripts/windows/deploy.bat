@echo off
setlocal enabledelayedexpansion

REM Script de déploiement pour le tutoriel Angular n-tier (Windows)

REM Configuration
set "ENVIRONMENT=%~1"
if "%ENVIRONMENT%"=="" set "ENVIRONMENT=staging"
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
call :log "Vérification des prérequis de déploiement..."

where docker >nul 2>&1
if %errorlevel% neq 0 (
    call :error "Docker n'est pas installé. Veuillez l'installer."
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    call :error "Docker Compose n'est pas installé. Veuillez l'installer."
    exit /b 1
)

where kubectl >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "kubectl n'est pas installé. Le déploiement Kubernetes sera ignoré."
)

call :success "Prérequis de déploiement vérifiés!"
goto :eof

REM Fonction pour construire les images Docker
:build_images
call :log "Construction des images Docker..."

REM Frontend
call :log "Construction de l'image frontend..."
docker build -t %DOCKER_REGISTRY%/tuto-angular-frontend:%IMAGE_TAG% .

REM Backend
call :log "Construction de l'image backend..."
docker build -t %DOCKER_REGISTRY%/tuto-angular-backend:%IMAGE_TAG% ./backend

call :success "Images Docker construites avec succès!"
goto :eof

REM Fonction pour pousser les images
:push_images
call :log "Poussée des images vers le registry..."

docker push %DOCKER_REGISTRY%/tuto-angular-frontend:%IMAGE_TAG%
docker push %DOCKER_REGISTRY%/tuto-angular-backend:%IMAGE_TAG%

call :success "Images poussées vers le registry!"
goto :eof

REM Fonction pour déployer avec Docker Compose
:deploy_docker_compose
call :log "Déploiement avec Docker Compose..."

REM Arrêter les services existants
docker-compose down 2>nul

REM Démarrer les nouveaux services
docker-compose up -d

REM Attendre que les services soient prêts
call :log "Attente du démarrage des services..."
timeout /t 30 /nobreak >nul

REM Vérifier la santé des services
call :check_health

call :success "Déploiement Docker Compose terminé!"
goto :eof

REM Fonction pour déployer avec Kubernetes
:deploy_kubernetes
call :log "Déploiement avec Kubernetes..."

where kubectl >nul 2>&1
if %errorlevel% neq 0 (
    call :warning "kubectl n'est pas installé. Déploiement Kubernetes ignoré."
    goto :eof
)

REM Appliquer les configurations Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

REM Attendre que les pods soient prêts
kubectl wait --for=condition=ready pod -l app=tuto-angular-frontend --timeout=300s
kubectl wait --for=condition=ready pod -l app=tuto-angular-backend --timeout=300s

call :success "Déploiement Kubernetes terminé!"
goto :eof

REM Fonction pour vérifier la santé des services
:check_health
call :log "Vérification de la santé des services..."

REM Vérifier le frontend
curl -f http://localhost:80/health >nul 2>&1
if %errorlevel% equ 0 (
    call :success "Frontend est en ligne"
) else (
    call :error "Frontend n'est pas accessible"
    exit /b 1
)

REM Vérifier le backend
curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    call :success "Backend est en ligne"
) else (
    call :error "Backend n'est pas accessible"
    exit /b 1
)

call :success "Tous les services sont en ligne!"
goto :eof

REM Fonction pour effectuer des tests de régression
:run_regression_tests
call :log "Exécution des tests de régression..."

REM Tests API
call :log "Tests API..."
curl -f http://localhost:8000/api/v1/health >nul 2>&1
if %errorlevel% neq 0 (
    call :error "Tests API échoués"
    exit /b 1
)

REM Tests frontend
call :log "Tests frontend..."
curl -f http://localhost:80/ >nul 2>&1
if %errorlevel% neq 0 (
    call :error "Tests frontend échoués"
    exit /b 1
)

call :success "Tests de régression passés!"
goto :eof

REM Fonction pour effectuer un rollback
:rollback
call :log "Rollback vers la version précédente..."

REM Rollback Docker Compose
docker-compose down
docker-compose -f docker-compose.previous.yml up -d

REM Rollback Kubernetes
where kubectl >nul 2>&1
if %errorlevel% equ 0 (
    kubectl rollout undo deployment/tuto-angular-frontend
    kubectl rollout undo deployment/tuto-angular-backend
)

call :success "Rollback terminé!"
goto :eof

REM Fonction pour nettoyer
:cleanup
call :log "Nettoyage des ressources..."

REM Nettoyer les images Docker non utilisées
docker image prune -f

REM Nettoyer les volumes Docker non utilisés
docker volume prune -f

call :success "Nettoyage terminé!"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %0 [ENVIRONMENT] [COMMAND]
echo.
echo Environments:
echo   staging     Environnement de staging (défaut)
echo   production  Environnement de production
echo.
echo Commands:
echo   build       Construire les images Docker
echo   push        Pousser les images vers le registry
echo   deploy      Déployer l'application
echo   health      Vérifier la santé des services
echo   test        Exécuter les tests de régression
echo   rollback    Effectuer un rollback
echo   cleanup     Nettoyer les ressources
echo   help        Afficher cette aide
echo.
echo Examples:
echo   %0 staging build
echo   %0 production deploy
echo   %0 staging health
goto :eof

REM Fonction principale
:main
set "command=%~2"
if "%command%"=="" set "command=deploy"

if "%command%"=="build" goto :build_images
if "%command%"=="push" goto :push_images
if "%command%"=="deploy" goto :deploy_all
if "%command%"=="health" goto :check_health
if "%command%"=="test" goto :run_regression_tests
if "%command%"=="rollback" goto :rollback
if "%command%"=="cleanup" goto :cleanup
if "%command%"=="help" goto :show_help
if "%command%"=="--help" goto :show_help
if "%command%"=="-h" goto :show_help

call :error "Commande inconnue: %command%"
call :show_help
exit /b 1

:deploy_all
call :check_prerequisites
call :build_images
call :push_images
call :deploy_docker_compose
call :deploy_kubernetes
call :check_health
goto :eof

:help
call :show_help
exit /b 0

REM Exécuter la fonction principale
call :main %1 %2
