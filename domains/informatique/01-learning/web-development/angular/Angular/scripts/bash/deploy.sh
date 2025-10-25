#!/bin/bash

# Script de déploiement pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

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
    log "Vérification des prérequis de déploiement..."
    
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker n'est pas installé. Veuillez l'installer."
        exit 1
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
        error "Docker Compose n'est pas installé. Veuillez l'installer."
        exit 1
    fi
    
    if ! command -v kubectl >/dev/null 2>&1; then
        warning "kubectl n'est pas installé. Le déploiement Kubernetes sera ignoré."
    fi
    
    success "Prérequis de déploiement vérifiés!"
}

# Fonction pour construire les images Docker
build_images() {
    log "Construction des images Docker..."
    
    # Frontend
    log "Construction de l'image frontend..."
    docker build -t ${DOCKER_REGISTRY}/tuto-angular-frontend:${IMAGE_TAG} .
    
    # Backend
    log "Construction de l'image backend..."
    docker build -t ${DOCKER_REGISTRY}/tuto-angular-backend:${IMAGE_TAG} ./backend
    
    success "Images Docker construites avec succès!"
}

# Fonction pour pousser les images
push_images() {
    log "Poussée des images vers le registry..."
    
    docker push ${DOCKER_REGISTRY}/tuto-angular-frontend:${IMAGE_TAG}
    docker push ${DOCKER_REGISTRY}/tuto-angular-backend:${IMAGE_TAG}
    
    success "Images poussées vers le registry!"
}

# Fonction pour déployer avec Docker Compose
deploy_docker_compose() {
    log "Déploiement avec Docker Compose..."
    
    # Arrêter les services existants
    docker-compose down || true
    
    # Démarrer les nouveaux services
    docker-compose up -d
    
    # Attendre que les services soient prêts
    log "Attente du démarrage des services..."
    sleep 30
    
    # Vérifier la santé des services
    check_health
    
    success "Déploiement Docker Compose terminé!"
}

# Fonction pour déployer avec Kubernetes
deploy_kubernetes() {
    log "Déploiement avec Kubernetes..."
    
    if ! command -v kubectl >/dev/null 2>&1; then
        warning "kubectl n'est pas installé. Déploiement Kubernetes ignoré."
        return
    fi
    
    # Appliquer les configurations Kubernetes
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/ingress.yaml
    
    # Attendre que les pods soient prêts
    kubectl wait --for=condition=ready pod -l app=tuto-angular-frontend --timeout=300s
    kubectl wait --for=condition=ready pod -l app=tuto-angular-backend --timeout=300s
    
    success "Déploiement Kubernetes terminé!"
}

# Fonction pour vérifier la santé des services
check_health() {
    log "Vérification de la santé des services..."
    
    # Vérifier le frontend
    if curl -f http://localhost:80/health >/dev/null 2>&1; then
        success "Frontend est en ligne"
    else
        error "Frontend n'est pas accessible"
        exit 1
    fi
    
    # Vérifier le backend
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        success "Backend est en ligne"
    else
        error "Backend n'est pas accessible"
        exit 1
    fi
    
    success "Tous les services sont en ligne!"
}

# Fonction pour effectuer des tests de régression
run_regression_tests() {
    log "Exécution des tests de régression..."
    
    # Tests API
    log "Tests API..."
    curl -f http://localhost:8000/api/v1/health || {
        error "Tests API échoués"
        exit 1
    }
    
    # Tests frontend
    log "Tests frontend..."
    curl -f http://localhost:80/ || {
        error "Tests frontend échoués"
        exit 1
    }
    
    success "Tests de régression passés!"
}

# Fonction pour effectuer un rollback
rollback() {
    log "Rollback vers la version précédente..."
    
    # Rollback Docker Compose
    docker-compose down
    docker-compose -f docker-compose.previous.yml up -d
    
    # Rollback Kubernetes
    if command -v kubectl >/dev/null 2>&1; then
        kubectl rollout undo deployment/tuto-angular-frontend
        kubectl rollout undo deployment/tuto-angular-backend
    fi
    
    success "Rollback terminé!"
}

# Fonction pour nettoyer
cleanup() {
    log "Nettoyage des ressources..."
    
    # Nettoyer les images Docker non utilisées
    docker image prune -f
    
    # Nettoyer les volumes Docker non utilisés
    docker volume prune -f
    
    success "Nettoyage terminé!"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [ENVIRONMENT] [COMMAND]"
    echo ""
    echo "Environments:"
    echo "  staging     Environnement de staging (défaut)"
    echo "  production  Environnement de production"
    echo ""
    echo "Commands:"
    echo "  build       Construire les images Docker"
    echo "  push        Pousser les images vers le registry"
    echo "  deploy      Déployer l'application"
    echo "  health      Vérifier la santé des services"
    echo "  test        Exécuter les tests de régression"
    echo "  rollback    Effectuer un rollback"
    echo "  cleanup     Nettoyer les ressources"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Examples:"
    echo "  $0 staging build"
    echo "  $0 production deploy"
    echo "  $0 staging health"
}

# Fonction principale
main() {
    local command=${2:-deploy}
    
    case "$command" in
        build)
            check_prerequisites
            build_images
            ;;
        push)
            check_prerequisites
            push_images
            ;;
        deploy)
            check_prerequisites
            build_images
            push_images
            deploy_docker_compose
            deploy_kubernetes
            check_health
            ;;
        health)
            check_health
            ;;
        test)
            run_regression_tests
            ;;
        rollback)
            rollback
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Commande inconnue: $command"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
