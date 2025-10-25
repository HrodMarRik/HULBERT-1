#!/bin/bash

# Script de build pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_TYPE=${1:-all}
BUILD_ENV=${2:-production}
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
    log "Vérification des prérequis de build..."
    
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
    
    if ! command -v docker >/dev/null 2>&1; then
        warning "Docker n'est pas installé. Le build Docker sera ignoré."
    fi
    
    success "Prérequis de build vérifiés!"
}

# Fonction pour installer les dépendances
install_dependencies() {
    log "Installation des dépendances..."
    
    # Frontend
    log "Installation des dépendances frontend..."
    cd Angular/Tuto-Angular
    npm ci --only=production
    cd ../..
    
    # Backend
    log "Installation des dépendances backend..."
    cd Angular/Tuto-Angular/backend
    pip install -r requirements.txt
    cd ../../..
    
    success "Dépendances installées!"
}

# Fonction pour construire le frontend
build_frontend() {
    log "Construction du frontend..."
    
    cd Angular/Tuto-Angular
    
    # Nettoyer le build précédent
    rm -rf dist/
    
    # Build selon l'environnement
    case "$BUILD_ENV" in
        development)
            npm run build
            ;;
        production)
            npm run build:prod
            ;;
        staging)
            npm run build:prod
            ;;
        *)
            error "Environnement de build inconnu: $BUILD_ENV"
            exit 1
            ;;
    esac
    
    # Vérifier que le build a réussi
    if [ ! -d "dist/tuto-angular" ]; then
        error "Build frontend échoué"
        exit 1
    fi
    
    cd ../..
    
    success "Frontend construit avec succès!"
}

# Fonction pour construire le backend
build_backend() {
    log "Construction du backend..."
    
    cd Angular/Tuto-Angular/backend
    
    # Nettoyer les fichiers Python compilés
    find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    
    # Vérifier la syntaxe Python
    python -m py_compile main.py
    
    # Vérifier que les dépendances sont installées
    python -c "import fastapi, uvicorn, sqlalchemy, psycopg2"
    
    cd ../../..
    
    success "Backend construit avec succès!"
}

# Fonction pour construire les images Docker
build_docker_images() {
    log "Construction des images Docker..."
    
    if ! command -v docker >/dev/null 2>&1; then
        warning "Docker n'est pas installé. Construction des images ignorée."
        return
    fi
    
    # Frontend
    log "Construction de l'image Docker frontend..."
    docker build -t ${DOCKER_REGISTRY}/tuto-angular-frontend:${IMAGE_TAG} .
    
    # Backend
    log "Construction de l'image Docker backend..."
    docker build -t ${DOCKER_REGISTRY}/tuto-angular-backend:${IMAGE_TAG} ./backend
    
    success "Images Docker construites avec succès!"
}

# Fonction pour optimiser les assets
optimize_assets() {
    log "Optimisation des assets..."
    
    cd Angular/Tuto-Angular/dist/tuto-angular
    
    # Optimiser les images
    if command -v imagemin >/dev/null 2>&1; then
        log "Optimisation des images..."
        find . -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | while read file; do
            imagemin "$file" --out-dir="$(dirname "$file")" --plugin=pngquant --plugin=mozjpeg
        done
    else
        warning "imagemin n'est pas installé. Optimisation des images ignorée."
    fi
    
    # Minifier les CSS et JS
    if command -v uglifyjs >/dev/null 2>&1; then
        log "Minification des fichiers JavaScript..."
        find . -name "*.js" | while read file; do
            uglifyjs "$file" -o "$file" -c -m
        done
    else
        warning "uglifyjs n'est pas installé. Minification JavaScript ignorée."
    fi
    
    if command -v cleancss >/dev/null 2>&1; then
        log "Minification des fichiers CSS..."
        find . -name "*.css" | while read file; do
            cleancss -o "$file" "$file"
        done
    else
        warning "cleancss n'est pas installé. Minification CSS ignorée."
    fi
    
    cd ../../..
    
    success "Assets optimisés!"
}

# Fonction pour générer les manifestes
generate_manifests() {
    log "Génération des manifestes..."
    
    # Manifeste Docker Compose
    cat > docker-compose.${BUILD_ENV}.yml << EOF
version: '3.8'

services:
  frontend:
    image: ${DOCKER_REGISTRY}/tuto-angular-frontend:${IMAGE_TAG}
    ports:
      - "80:80"
    environment:
      - NODE_ENV=${BUILD_ENV}
    depends_on:
      - backend

  backend:
    image: ${DOCKER_REGISTRY}/tuto-angular-backend:${IMAGE_TAG}
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=${BUILD_ENV}
      - DATABASE_URL=postgresql://user:password@postgres:5432/tuto_angular
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tuto_angular
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF
    
    # Manifeste Kubernetes
    cat > k8s/deployment.${BUILD_ENV}.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tuto-angular-frontend
  namespace: tuto-angular
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tuto-angular-frontend
  template:
    metadata:
      labels:
        app: tuto-angular-frontend
    spec:
      containers:
      - name: frontend
        image: ${DOCKER_REGISTRY}/tuto-angular-frontend:${IMAGE_TAG}
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "${BUILD_ENV}"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tuto-angular-backend
  namespace: tuto-angular
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tuto-angular-backend
  template:
    metadata:
      labels:
        app: tuto-angular-backend
    spec:
      containers:
      - name: backend
        image: ${DOCKER_REGISTRY}/tuto-angular-backend:${IMAGE_TAG}
        ports:
        - containerPort: 8000
        env:
        - name: NODE_ENV
          value: "${BUILD_ENV}"
        - name: DATABASE_URL
          value: "postgresql://user:password@postgres:5432/tuto_angular"
EOF
    
    success "Manifestes générés!"
}

# Fonction pour créer l'archive de déploiement
create_deployment_archive() {
    log "Création de l'archive de déploiement..."
    
    # Créer le répertoire de déploiement
    mkdir -p deploy/${BUILD_ENV}
    
    # Copier les fichiers nécessaires
    cp -r Angular/Tuto-Angular/dist/tuto-angular deploy/${BUILD_ENV}/frontend
    cp -r Angular/Tuto-Angular/backend deploy/${BUILD_ENV}/backend
    cp docker-compose.${BUILD_ENV}.yml deploy/${BUILD_ENV}/
    cp k8s/deployment.${BUILD_ENV}.yaml deploy/${BUILD_ENV}/
    cp nginx.conf deploy/${BUILD_ENV}/
    
    # Créer l'archive
    tar -czf deploy/tuto-angular-${BUILD_ENV}-${IMAGE_TAG}.tar.gz -C deploy/${BUILD_ENV} .
    
    success "Archive de déploiement créée: deploy/tuto-angular-${BUILD_ENV}-${IMAGE_TAG}.tar.gz"
}

# Fonction pour nettoyer
cleanup() {
    log "Nettoyage des fichiers temporaires..."
    
    # Nettoyer le frontend
    rm -rf Angular/Tuto-Angular/dist
    rm -rf Angular/Tuto-Angular/out-tsc
    rm -rf Angular/Tuto-Angular/node_modules
    
    # Nettoyer le backend
    find Angular/Tuto-Angular/backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find Angular/Tuto-Angular/backend -type f -name "*.pyc" -delete 2>/dev/null || true
    
    # Nettoyer les images Docker
    if command -v docker >/dev/null 2>&1; then
        docker image prune -f
    fi
    
    success "Nettoyage terminé!"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [BUILD_TYPE] [BUILD_ENV]"
    echo ""
    echo "Build Types:"
    echo "  all         Tout construire (défaut)"
    echo "  frontend    Frontend seulement"
    echo "  backend     Backend seulement"
    echo "  docker      Images Docker seulement"
    echo "  optimize    Optimisation des assets seulement"
    echo "  manifest    Génération des manifestes seulement"
    echo "  archive     Création de l'archive de déploiement seulement"
    echo "  clean       Nettoyage seulement"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Build Environments:"
    echo "  production  Environnement de production (défaut)"
    echo "  staging     Environnement de staging"
    echo "  development Environnement de développement"
    echo ""
    echo "Environment Variables:"
    echo "  DOCKER_REGISTRY  Registry Docker (défaut: your-registry.com)"
    echo "  IMAGE_TAG        Tag de l'image Docker (défaut: latest)"
    echo ""
    echo "Examples:"
    echo "  $0 all production"
    echo "  $0 frontend staging"
    echo "  DOCKER_REGISTRY=my-registry.com IMAGE_TAG=v1.0.0 $0 docker"
}

# Fonction principale
main() {
    case "$BUILD_TYPE" in
        all)
            check_prerequisites
            install_dependencies
            build_frontend
            build_backend
            build_docker_images
            optimize_assets
            generate_manifests
            create_deployment_archive
            ;;
        frontend)
            check_prerequisites
            install_dependencies
            build_frontend
            ;;
        backend)
            check_prerequisites
            install_dependencies
            build_backend
            ;;
        docker)
            check_prerequisites
            build_docker_images
            ;;
        optimize)
            optimize_assets
            ;;
        manifest)
            generate_manifests
            ;;
        archive)
            create_deployment_archive
            ;;
        clean)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Type de build inconnu: $BUILD_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
