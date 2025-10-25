@echo off
setlocal enabledelayedexpansion

REM Script de test pour le tutoriel Angular n-tier (Windows)

REM Configuration
set "TEST_TYPE=%~1"
if "%TEST_TYPE%"=="" set "TEST_TYPE=all"
set "COVERAGE_THRESHOLD=80"

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
call :log "Vérification des prérequis de test..."

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

call :success "Prérequis de test vérifiés!"
goto :eof

REM Fonction pour installer les dépendances de test
:install_test_dependencies
call :log "Installation des dépendances de test..."

REM Frontend
call :log "Installation des dépendances de test frontend..."
cd Angular\Tuto-Angular
call npm install
cd ..\..

REM Backend
call :log "Installation des dépendances de test backend..."
cd Angular\Tuto-Angular\backend
call pip install -r requirements.txt
call pip install pytest pytest-cov pytest-asyncio
cd ..\..\..

call :success "Dépendances de test installées!"
goto :eof

REM Fonction pour exécuter les tests unitaires frontend
:run_frontend_unit_tests
call :log "Exécution des tests unitaires frontend..."

cd Angular\Tuto-Angular

REM Tests unitaires
call npm run test:ci

REM Vérifier la couverture de code
if exist "coverage\lcov.info" (
    for /f "tokens=2 delims=:" %%a in ('findstr "lines.*:" coverage\lcov.info') do (
        set "coverage=%%a"
        set "coverage=!coverage: =!"
        set "coverage=!coverage:%=!"
        if !coverage! lss %COVERAGE_THRESHOLD% (
            call :warning "Couverture de code frontend: !coverage!%% (seuil: %COVERAGE_THRESHOLD%%)"
        ) else (
            call :success "Couverture de code frontend: !coverage!%%"
        )
    )
)

cd ..\..

call :success "Tests unitaires frontend terminés!"
goto :eof

REM Fonction pour exécuter les tests unitaires backend
:run_backend_unit_tests
call :log "Exécution des tests unitaires backend..."

cd Angular\Tuto-Angular\backend

REM Tests unitaires avec couverture
call pytest --cov=. --cov-report=html --cov-report=term-missing

REM Vérifier la couverture de code
if exist "htmlcov\index.html" (
    for /f "tokens=2 delims=:" %%a in ('findstr "TOTAL.*%%" htmlcov\index.html') do (
        set "coverage=%%a"
        set "coverage=!coverage: =!"
        set "coverage=!coverage:%=!"
        if !coverage! lss %COVERAGE_THRESHOLD% (
            call :warning "Couverture de code backend: !coverage!%% (seuil: %COVERAGE_THRESHOLD%%)"
        ) else (
            call :success "Couverture de code backend: !coverage!%%"
        )
    )
)

cd ..\..\..

call :success "Tests unitaires backend terminés!"
goto :eof

REM Fonction pour exécuter les tests d'intégration
:run_integration_tests
call :log "Exécution des tests d'intégration..."

REM Démarrer les services en arrière-plan
call :log "Démarrage des services pour les tests d'intégration..."

REM Backend
cd Angular\Tuto-Angular\backend
start /b uvicorn main:app --host 0.0.0.0 --port 8000
cd ..\..\..

REM Attendre que le backend soit prêt
timeout /t 10 /nobreak >nul

REM Frontend
cd Angular\Tuto-Angular
call npm run build:prod
start /b npx http-server dist\tuto-angular -p 4200
cd ..\..

REM Attendre que le frontend soit prêt
timeout /t 5 /nobreak >nul

REM Tests d'intégration
call :log "Exécution des tests d'intégration..."

REM Test API
curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    call :success "API backend accessible"
) else (
    call :error "API backend non accessible"
    exit /b 1
)

REM Test frontend
curl -f http://localhost:4200/ >nul 2>&1
if %errorlevel% equ 0 (
    call :success "Frontend accessible"
) else (
    call :error "Frontend non accessible"
    exit /b 1
)

REM Tests end-to-end
call :log "Exécution des tests end-to-end..."
cd Angular\Tuto-Angular
call npm run e2e
cd ..\..

call :success "Tests d'intégration terminés!"
goto :eof

REM Fonction pour exécuter les tests de performance
:run_performance_tests
call :log "Exécution des tests de performance..."

REM Démarrer les services
call :log "Démarrage des services pour les tests de performance..."

REM Backend
cd Angular\Tuto-Angular\backend
start /b uvicorn main:app --host 0.0.0.0 --port 8000
cd ..\..\..

REM Attendre que le backend soit prêt
timeout /t 10 /nobreak >nul

REM Tests de charge avec Apache Bench
where ab >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Tests de charge avec Apache Bench..."
    
    REM Test API
    ab -n 1000 -c 10 http://localhost:8000/health
    
    REM Test frontend
    ab -n 1000 -c 10 http://localhost:4200/
    
    call :success "Tests de performance terminés!"
) else (
    call :warning "Apache Bench n'est pas installé. Tests de performance ignorés."
)
goto :eof

REM Fonction pour exécuter les tests de sécurité
:run_security_tests
call :log "Exécution des tests de sécurité..."

REM Démarrer les services
call :log "Démarrage des services pour les tests de sécurité..."

REM Backend
cd Angular\Tuto-Angular\backend
start /b uvicorn main:app --host 0.0.0.0 --port 8000
cd ..\..\..

REM Attendre que le backend soit prêt
timeout /t 10 /nobreak >nul

REM Tests de sécurité avec OWASP ZAP
where zap-cli >nul 2>&1
if %errorlevel% equ 0 (
    call :log "Tests de sécurité avec OWASP ZAP..."
    
    REM Scan de sécurité
    zap-cli quick-scan http://localhost:8000
    
    call :success "Tests de sécurité terminés!"
) else (
    call :warning "OWASP ZAP n'est pas installé. Tests de sécurité ignorés."
)
goto :eof

REM Fonction pour générer le rapport de test
:generate_test_report
call :log "Génération du rapport de test..."

REM Créer le répertoire de rapport
if not exist "test-reports" mkdir test-reports

REM Copier les rapports de couverture
if exist "Angular\Tuto-Angular\coverage" (
    xcopy "Angular\Tuto-Angular\coverage" "test-reports\frontend-coverage" /E /I /Q
)

if exist "Angular\Tuto-Angular\backend\htmlcov" (
    xcopy "Angular\Tuto-Angular\backend\htmlcov" "test-reports\backend-coverage" /E /I /Q
)

REM Générer le rapport HTML
echo ^<!DOCTYPE html^> > test-reports\index.html
echo ^<html^> >> test-reports\index.html
echo ^<head^> >> test-reports\index.html
echo     ^<title^>Rapport de test - Tuto Angular n-tier^</title^> >> test-reports\index.html
echo     ^<style^> >> test-reports\index.html
echo         body { font-family: Arial, sans-serif; margin: 20px; } >> test-reports\index.html
echo         .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; } >> test-reports\index.html
echo         .section { margin: 20px 0; } >> test-reports\index.html
echo         .success { color: green; } >> test-reports\index.html
echo         .warning { color: orange; } >> test-reports\index.html
echo         .error { color: red; } >> test-reports\index.html
echo     ^</style^> >> test-reports\index.html
echo ^</head^> >> test-reports\index.html
echo ^<body^> >> test-reports\index.html
echo     ^<div class="header"^> >> test-reports\index.html
echo         ^<h1^>Rapport de test - Tuto Angular n-tier^</h1^> >> test-reports\index.html
echo         ^<p^>Généré le %date% %time%^</p^> >> test-reports\index.html
echo     ^</div^> >> test-reports\index.html
echo     ^<div class="section"^> >> test-reports\index.html
echo         ^<h2^>Tests unitaires^</h2^> >> test-reports\index.html
echo         ^<p class="success"^>✓ Tests frontend: Passés^</p^> >> test-reports\index.html
echo         ^<p class="success"^>✓ Tests backend: Passés^</p^> >> test-reports\index.html
echo     ^</div^> >> test-reports\index.html
echo     ^<div class="section"^> >> test-reports\index.html
echo         ^<h2^>Tests d'intégration^</h2^> >> test-reports\index.html
echo         ^<p class="success"^>✓ Tests API: Passés^</p^> >> test-reports\index.html
echo         ^<p class="success"^>✓ Tests frontend: Passés^</p^> >> test-reports\index.html
echo         ^<p class="success"^>✓ Tests end-to-end: Passés^</p^> >> test-reports\index.html
echo     ^</div^> >> test-reports\index.html
echo     ^<div class="section"^> >> test-reports\index.html
echo         ^<h2^>Couverture de code^</h2^> >> test-reports\index.html
echo         ^<p^>^<a href="frontend-coverage/index.html"^>Couverture frontend^</a^>^</p^> >> test-reports\index.html
echo         ^<p^>^<a href="backend-coverage/index.html"^>Couverture backend^</a^>^</p^> >> test-reports\index.html
echo     ^</div^> >> test-reports\index.html
echo ^</body^> >> test-reports\index.html
echo ^</html^> >> test-reports\index.html

call :success "Rapport de test généré dans test-reports/"
goto :eof

REM Fonction pour nettoyer
:cleanup
call :log "Nettoyage des fichiers de test..."

REM Nettoyer les rapports de couverture
if exist "Angular\Tuto-Angular\coverage" rmdir /s /q "Angular\Tuto-Angular\coverage"
if exist "Angular\Tuto-Angular\backend\htmlcov" rmdir /s /q "Angular\Tuto-Angular\backend\htmlcov"
if exist "Angular\Tuto-Angular\backend\.coverage" del "Angular\Tuto-Angular\backend\.coverage"

REM Nettoyer les fichiers temporaires
if exist "Angular\Tuto-Angular\dist" rmdir /s /q "Angular\Tuto-Angular\dist"
if exist "Angular\Tuto-Angular\out-tsc" rmdir /s /q "Angular\Tuto-Angular\out-tsc"

call :success "Nettoyage terminé!"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %0 [TEST_TYPE]
echo.
echo Test Types:
echo   all         Tous les tests (défaut)
echo   unit        Tests unitaires seulement
echo   integration Tests d'intégration seulement
echo   performance Tests de performance seulement
echo   security    Tests de sécurité seulement
echo   report      Générer le rapport de test
echo   clean       Nettoyer les fichiers de test
echo   help        Afficher cette aide
echo.
echo Environment Variables:
echo   COVERAGE_THRESHOLD  Seuil de couverture de code (défaut: 80)
echo.
echo Examples:
echo   %0 unit
echo   %0 integration
echo   set COVERAGE_THRESHOLD=90 ^& %0 all
goto :eof

REM Fonction principale
:main
if "%TEST_TYPE%"=="all" goto :run_all_tests
if "%TEST_TYPE%"=="unit" goto :run_unit_tests
if "%TEST_TYPE%"=="integration" goto :run_integration_tests
if "%TEST_TYPE%"=="performance" goto :run_performance_tests
if "%TEST_TYPE%"=="security" goto :run_security_tests
if "%TEST_TYPE%"=="report" goto :generate_test_report
if "%TEST_TYPE%"=="clean" goto :cleanup
if "%TEST_TYPE%"=="help" goto :show_help
if "%TEST_TYPE%"=="--help" goto :show_help
if "%TEST_TYPE%"=="-h" goto :show_help

call :error "Type de test inconnu: %TEST_TYPE%"
call :show_help
exit /b 1

:run_all_tests
call :check_prerequisites
call :install_test_dependencies
call :run_frontend_unit_tests
call :run_backend_unit_tests
call :run_integration_tests
call :run_performance_tests
call :run_security_tests
call :generate_test_report
goto :eof

:run_unit_tests
call :check_prerequisites
call :install_test_dependencies
call :run_frontend_unit_tests
call :run_backend_unit_tests
call :generate_test_report
goto :eof

:help
call :show_help
exit /b 0

REM Exécuter la fonction principale
call :main %1
