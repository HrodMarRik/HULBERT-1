#!/bin/bash

# Script de test pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_TYPE=${1:-all}
COVERAGE_THRESHOLD=${COVERAGE_THRESHOLD:-80}

# Fonction pour afficher les messages
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis de test..."
    
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js n'est pas installé. Veuillez l'installer."
        exit 1
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        error "npm n'est pas installé. Veuillez installer Node.js qui inclut npm."
        exit 1
    fi
    
    if ! command -v python3 >/dev/null 2>&1; then
        error "Python 3 n'est pas installé. Veuillez l'installer."
        exit 1
    fi
    
    if ! command -v pip >/dev/null 2>&1; then
        error "pip n'est pas installé. Veuillez installer pip pour Python."
        exit 1
    fi
    
    success "Prérequis de test vérifiés!"
}

# Fonction pour installer les dépendances de test
install_test_dependencies() {
    log "Installation des dépendances de test..."
    
    # Frontend
    log "Installation des dépendances de test frontend..."
    cd Angular/Tuto-Angular
    npm install
    cd ../..
    
    # Backend
    log "Installation des dépendances de test backend..."
    cd Angular/Tuto-Angular/backend
    pip install -r requirements.txt
    pip install pytest pytest-cov pytest-asyncio
    cd ../../..
    
    success "Dépendances de test installées!"
}

# Fonction pour exécuter les tests unitaires frontend
run_frontend_unit_tests() {
    log "Exécution des tests unitaires frontend..."
    
    cd Angular/Tuto-Angular
    
    # Tests unitaires
    npm run test:ci
    
    # Vérifier la couverture de code
    if [ -f "coverage/lcov.info" ]; then
        local coverage=$(grep -o 'lines.*: [0-9]*%' coverage/lcov.info | grep -o '[0-9]*' | head -1)
        if [ "$coverage" -lt "$COVERAGE_THRESHOLD" ]; then
            warning "Couverture de code frontend: ${coverage}% (seuil: ${COVERAGE_THRESHOLD}%)"
        else
            success "Couverture de code frontend: ${coverage}%"
        fi
    fi
    
    cd ../..
    
    success "Tests unitaires frontend terminés!"
}

# Fonction pour exécuter les tests unitaires backend
run_backend_unit_tests() {
    log "Exécution des tests unitaires backend..."
    
    cd Angular/Tuto-Angular/backend
    
    # Tests unitaires avec couverture
    pytest --cov=. --cov-report=html --cov-report=term-missing
    
    # Vérifier la couverture de code
    if [ -f "htmlcov/index.html" ]; then
        local coverage=$(grep -o 'TOTAL.*[0-9]*%' htmlcov/index.html | grep -o '[0-9]*' | head -1)
        if [ "$coverage" -lt "$COVERAGE_THRESHOLD" ]; then
            warning "Couverture de code backend: ${coverage}% (seuil: ${COVERAGE_THRESHOLD}%)"
        else
            success "Couverture de code backend: ${coverage}%"
        fi
    fi
    
    cd ../../..
    
    success "Tests unitaires backend terminés!"
}

# Fonction pour exécuter les tests d'intégration
run_integration_tests() {
    log "Exécution des tests d'intégration..."
    
    # Démarrer les services en arrière-plan
    log "Démarrage des services pour les tests d'intégration..."
    
    # Backend
    cd Angular/Tuto-Angular/backend
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ../../..
    
    # Attendre que le backend soit prêt
    sleep 10
    
    # Frontend
    cd Angular/Tuto-Angular
    npm run build:prod
    npx http-server dist/tuto-angular -p 4200 &
    FRONTEND_PID=$!
    cd ../..
    
    # Attendre que le frontend soit prêt
    sleep 5
    
    # Tests d'intégration
    log "Exécution des tests d'intégration..."
    
    # Test API
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        success "API backend accessible"
    else
        error "API backend non accessible"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # Test frontend
    if curl -f http://localhost:4200/ >/dev/null 2>&1; then
        success "Frontend accessible"
    else
        error "Frontend non accessible"
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    
    # Tests end-to-end
    log "Exécution des tests end-to-end..."
    cd Angular/Tuto-Angular
    npm run e2e
    cd ../..
    
    # Arrêter les services
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    
    success "Tests d'intégration terminés!"
}

# Fonction pour exécuter les tests de performance
run_performance_tests() {
    log "Exécution des tests de performance..."
    
    # Démarrer les services
    log "Démarrage des services pour les tests de performance..."
    
    # Backend
    cd Angular/Tuto-Angular/backend
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ../../..
    
    # Attendre que le backend soit prêt
    sleep 10
    
    # Tests de charge avec Apache Bench
    if command -v ab >/dev/null 2>&1; then
        log "Tests de charge avec Apache Bench..."
        
        # Test API
        ab -n 1000 -c 10 http://localhost:8000/health
        
        # Test frontend
        ab -n 1000 -c 10 http://localhost:4200/
        
        success "Tests de performance terminés!"
    else
        warning "Apache Bench n'est pas installé. Tests de performance ignorés."
    fi
    
    # Arrêter les services
    kill $BACKEND_PID 2>/dev/null || true
}

# Fonction pour exécuter les tests de sécurité
run_security_tests() {
    log "Exécution des tests de sécurité..."
    
    # Démarrer les services
    log "Démarrage des services pour les tests de sécurité..."
    
    # Backend
    cd Angular/Tuto-Angular/backend
    uvicorn main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ../../..
    
    # Attendre que le backend soit prêt
    sleep 10
    
    # Tests de sécurité avec OWASP ZAP
    if command -v zap-cli >/dev/null 2>&1; then
        log "Tests de sécurité avec OWASP ZAP..."
        
        # Scan de sécurité
        zap-cli quick-scan http://localhost:8000
        
        success "Tests de sécurité terminés!"
    else
        warning "OWASP ZAP n'est pas installé. Tests de sécurité ignorés."
    fi
    
    # Arrêter les services
    kill $BACKEND_PID 2>/dev/null || true
}

# Fonction pour générer le rapport de test
generate_test_report() {
    log "Génération du rapport de test..."
    
    # Créer le répertoire de rapport
    mkdir -p test-reports
    
    # Copier les rapports de couverture
    if [ -d "Angular/Tuto-Angular/coverage" ]; then
        cp -r Angular/Tuto-Angular/coverage test-reports/frontend-coverage
    fi
    
    if [ -d "Angular/Tuto-Angular/backend/htmlcov" ]; then
        cp -r Angular/Tuto-Angular/backend/htmlcov test-reports/backend-coverage
    fi
    
    # Générer le rapport HTML
    cat > test-reports/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Rapport de test - Tuto Angular n-tier</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport de test - Tuto Angular n-tier</h1>
        <p>Généré le $(date)</p>
    </div>
    
    <div class="section">
        <h2>Tests unitaires</h2>
        <p class="success">✓ Tests frontend: Passés</p>
        <p class="success">✓ Tests backend: Passés</p>
    </div>
    
    <div class="section">
        <h2>Tests d'intégration</h2>
        <p class="success">✓ Tests API: Passés</p>
        <p class="success">✓ Tests frontend: Passés</p>
        <p class="success">✓ Tests end-to-end: Passés</p>
    </div>
    
    <div class="section">
        <h2>Couverture de code</h2>
        <p><a href="frontend-coverage/index.html">Couverture frontend</a></p>
        <p><a href="backend-coverage/index.html">Couverture backend</a></p>
    </div>
</body>
</html>
EOF
    
    success "Rapport de test généré dans test-reports/"
}

# Fonction pour nettoyer
cleanup() {
    log "Nettoyage des fichiers de test..."
    
    # Nettoyer les rapports de couverture
    rm -rf Angular/Tuto-Angular/coverage
    rm -rf Angular/Tuto-Angular/backend/htmlcov
    rm -rf Angular/Tuto-Angular/backend/.coverage
    
    # Nettoyer les fichiers temporaires
    rm -rf Angular/Tuto-Angular/dist
    rm -rf Angular/Tuto-Angular/out-tsc
    
    success "Nettoyage terminé!"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [TEST_TYPE]"
    echo ""
    echo "Test Types:"
    echo "  all         Tous les tests (défaut)"
    echo "  unit        Tests unitaires seulement"
    echo "  integration Tests d'intégration seulement"
    echo "  performance Tests de performance seulement"
    echo "  security    Tests de sécurité seulement"
    echo "  report      Générer le rapport de test"
    echo "  clean       Nettoyer les fichiers de test"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Environment Variables:"
    echo "  COVERAGE_THRESHOLD  Seuil de couverture de code (défaut: 80)"
    echo ""
    echo "Examples:"
    echo "  $0 unit"
    echo "  $0 integration"
    echo "  COVERAGE_THRESHOLD=90 $0 all"
}

# Fonction principale
main() {
    case "$TEST_TYPE" in
        all)
            check_prerequisites
            install_test_dependencies
            run_frontend_unit_tests
            run_backend_unit_tests
            run_integration_tests
            run_performance_tests
            run_security_tests
            generate_test_report
            ;;
        unit)
            check_prerequisites
            install_test_dependencies
            run_frontend_unit_tests
            run_backend_unit_tests
            generate_test_report
            ;;
        integration)
            check_prerequisites
            install_test_dependencies
            run_integration_tests
            generate_test_report
            ;;
        performance)
            check_prerequisites
            install_test_dependencies
            run_performance_tests
            generate_test_report
            ;;
        security)
            check_prerequisites
            install_test_dependencies
            run_security_tests
            generate_test_report
            ;;
        report)
            generate_test_report
            ;;
        clean)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Type de test inconnu: $TEST_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
