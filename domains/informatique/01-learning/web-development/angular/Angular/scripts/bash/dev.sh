#!/bin/bash

# Script de développement pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Fonction pour vérifier si une commande existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    if ! command_exists node; then
        error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
        exit 1
    fi
    
    if ! command_exists npm; then
        error "npm n'est pas installé. Veuillez installer Node.js qui inclut npm."
        exit 1
    fi
    
    if ! command_exists python3; then
        error "Python 3 n'est pas installé. Veuillez l'installer depuis https://python.org/"
        exit 1
    fi
    
    if ! command_exists pip; then
        error "pip n'est pas installé. Veuillez installer pip pour Python."
        exit 1
    fi
    
    if ! command_exists psql; then
        warning "PostgreSQL n'est pas installé. Veuillez l'installer depuis https://postgresql.org/"
        warning "Vous pouvez continuer sans PostgreSQL pour le moment."
    fi
    
    success "Tous les prérequis sont satisfaits!"
}

# Fonction pour installer les dépendances
install_dependencies() {
    log "Installation des dépendances..."
    
    # Frontend
    log "Installation des dépendances frontend..."
    cd Angular/Tuto-Angular
    npm install
    cd ../..
    
    # Backend
    log "Installation des dépendances backend..."
    cd Angular/Tuto-Angular/backend
    pip install -r requirements.txt
    cd ../../..
    
    success "Dépendances installées avec succès!"
}

# Fonction pour configurer la base de données
setup_database() {
    log "Configuration de la base de données..."
    
    if command_exists psql; then
        # Créer la base de données si elle n'existe pas
        createdb tuto_angular 2>/dev/null || log "Base de données 'tuto_angular' existe déjà"
        
        # Copier le fichier de configuration
        cp Angular/Tuto-Angular/backend/config.env.example Angular/Tuto-Angular/backend/config.env 2>/dev/null || log "Fichier config.env existe déjà"
        
        success "Base de données configurée!"
    else
        warning "PostgreSQL n'est pas installé. Veuillez l'installer et configurer la base de données manuellement."
    fi
}

# Fonction pour démarrer le développement
start_dev() {
    log "Démarrage de l'environnement de développement..."
    
    # Démarrer le backend en arrière-plan
    log "Démarrage du backend..."
    cd Angular/Tuto-Angular/backend
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ../../..
    
    # Attendre que le backend soit prêt
    sleep 5
    
    # Démarrer le frontend
    log "Démarrage du frontend..."
    cd Angular/Tuto-Angular
    npm start &
    FRONTEND_PID=$!
    cd ../..
    
    success "Environnement de développement démarré!"
    log "Frontend: http://localhost:4200"
    log "Backend: http://localhost:8000"
    log "API Docs: http://localhost:8000/docs"
    
    # Attendre que l'utilisateur arrête les services
    log "Appuyez sur Ctrl+C pour arrêter les services..."
    trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
    wait
}

# Fonction pour exécuter les tests
run_tests() {
    log "Exécution des tests..."
    
    # Tests frontend
    log "Tests frontend..."
    cd Angular/Tuto-Angular
    npm run test:ci
    cd ../..
    
    # Tests backend
    log "Tests backend..."
    cd Angular/Tuto-Angular/backend
    pytest
    cd ../../..
    
    success "Tous les tests sont passés!"
}

# Fonction pour construire l'application
build_app() {
    log "Construction de l'application..."
    
    # Build frontend
    log "Construction du frontend..."
    cd Angular/Tuto-Angular
    npm run build:prod
    cd ../..
    
    # Build backend
    log "Construction du backend..."
    cd Angular/Tuto-Angular/backend
    echo "Backend build completed"
    cd ../../..
    
    success "Application construite avec succès!"
}

# Fonction pour nettoyer
clean() {
    log "Nettoyage des fichiers temporaires..."
    
    # Nettoyer le frontend
    cd Angular/Tuto-Angular
    rm -rf dist/
    rm -rf node_modules/
    cd ../..
    
    # Nettoyer le backend
    cd Angular/Tuto-Angular/backend
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    cd ../../..
    
    success "Nettoyage terminé!"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  check       Vérifier les prérequis"
    echo "  install     Installer les dépendances"
    echo "  setup       Configurer la base de données"
    echo "  dev         Démarrer l'environnement de développement"
    echo "  test        Exécuter les tests"
    echo "  build       Construire l'application"
    echo "  clean       Nettoyer les fichiers temporaires"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Examples:"
    echo "  $0 check"
    echo "  $0 install"
    echo "  $0 dev"
}

# Fonction principale
main() {
    case "${1:-help}" in
        check)
            check_prerequisites
            ;;
        install)
            check_prerequisites
            install_dependencies
            ;;
        setup)
            setup_database
            ;;
        dev)
            start_dev
            ;;
        test)
            run_tests
            ;;
        build)
            build_app
            ;;
        clean)
            clean
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Commande inconnue: $1"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
