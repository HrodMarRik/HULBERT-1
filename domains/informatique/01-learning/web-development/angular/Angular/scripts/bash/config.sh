#!/bin/bash

# Script de configuration pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONFIG_TYPE=${1:-all}
CONFIG_DIR=${CONFIG_DIR:-"config"}
TEMPLATE_DIR=${TEMPLATE_DIR:-"templates"}

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
    log "Vérification des prérequis de configuration..."
    
    if ! command -v node >/dev/null 2>&1; then
        warning "Node.js n'est pas installé. Certaines configurations seront limitées."
    fi
    
    if ! command -v npm >/dev/null 2>&1; then
        warning "npm n'est pas installé. Certaines configurations seront limitées."
    fi
    
    if ! command -v python3 >/dev/null 2>&1; then
        warning "Python 3 n'est pas installé. Certaines configurations seront limitées."
    fi
    
    if ! command -v pip3 >/dev/null 2>&1; then
        warning "pip3 n'est pas installé. Certaines configurations seront limitées."
    fi
    
    success "Prérequis de configuration vérifiés!"
}

# Fonction pour créer les répertoires nécessaires
create_directories() {
    log "Création des répertoires nécessaires..."
    
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$TEMPLATE_DIR"
    mkdir -p "$CONFIG_DIR/environments"
    mkdir -p "$CONFIG_DIR/database"
    mkdir -p "$CONFIG_DIR/nginx"
    mkdir -p "$CONFIG_DIR/docker"
    mkdir -p "$CONFIG_DIR/ci-cd"
    
    success "Répertoires créés!"
}

# Fonction pour configurer l'environnement de développement
configure_development() {
    log "Configuration de l'environnement de développement..."
    
    # Configuration Angular
    if [ -f "Angular/Tuto-Angular/package.json" ]; then
        log "Configuration du projet Angular..."
        
        # Installer les dépendances
        cd "Angular/Tuto-Angular"
        npm install || {
            error "Échec de l'installation des dépendances Angular"
            return 1
        }
        cd - > /dev/null
        
        success "Projet Angular configuré!"
    else
        warning "Projet Angular non trouvé. Configuration ignorée."
    fi
    
    # Configuration Python
    if [ -f "backend/requirements.txt" ]; then
        log "Configuration du projet Python..."
        
        # Créer un environnement virtuel
        python3 -m venv backend/venv || {
            error "Échec de la création de l'environnement virtuel Python"
            return 1
        }
        
        # Activer l'environnement virtuel et installer les dépendances
        source backend/venv/bin/activate
        pip install -r backend/requirements.txt || {
            error "Échec de l'installation des dépendances Python"
            return 1
        }
        deactivate
        
        success "Projet Python configuré!"
    else
        warning "Projet Python non trouvé. Configuration ignorée."
    fi
}

# Fonction pour configurer la base de données
configure_database() {
    log "Configuration de la base de données..."
    
    # Configuration PostgreSQL
    if command -v psql >/dev/null 2>&1; then
        log "Configuration de PostgreSQL..."
        
        # Créer la base de données
        createdb tuto_angular || {
            warning "Base de données 'tuto_angular' existe déjà ou erreur de création"
        }
        
        # Créer les tables
        if [ -f "backend/database/models.py" ]; then
            log "Création des tables..."
            
            # Activer l'environnement virtuel et exécuter les migrations
            source backend/venv/bin/activate
            python -c "
from backend.database.models import Base
from backend.database.connection import engine
Base.metadata.create_all(bind=engine)
print('Tables créées avec succès!')
" || {
                error "Échec de la création des tables"
                return 1
            }
            deactivate
            
            success "Tables créées avec succès!"
        else
            warning "Fichier models.py non trouvé. Création des tables ignorée."
        fi
        
        success "PostgreSQL configuré!"
    else
        warning "PostgreSQL n'est pas installé. Configuration de la base de données ignorée."
    fi
}

# Fonction pour configurer Docker
configure_docker() {
    log "Configuration de Docker..."
    
    if command -v docker >/dev/null 2>&1; then
        # Construire les images Docker
        if [ -f "docker-compose.yml" ]; then
            log "Construction des images Docker..."
            
            docker-compose build || {
                error "Échec de la construction des images Docker"
                return 1
            }
            
            success "Images Docker construites!"
        else
            warning "Fichier docker-compose.yml non trouvé. Construction des images ignorée."
        fi
        
        success "Docker configuré!"
    else
        warning "Docker n'est pas installé. Configuration Docker ignorée."
    fi
}

# Fonction pour configurer Nginx
configure_nginx() {
    log "Configuration de Nginx..."
    
    if command -v nginx >/dev/null 2>&1; then
        # Copier la configuration Nginx
        if [ -f "nginx.conf" ]; then
            log "Copie de la configuration Nginx..."
            
            sudo cp nginx.conf /etc/nginx/sites-available/tuto-angular || {
                warning "Échec de la copie de la configuration Nginx"
                return 1
            }
            
            # Créer un lien symbolique
            sudo ln -sf /etc/nginx/sites-available/tuto-angular /etc/nginx/sites-enabled/ || {
                warning "Échec de la création du lien symbolique Nginx"
                return 1
            }
            
            # Tester la configuration
            sudo nginx -t || {
                error "Configuration Nginx invalide"
                return 1
            }
            
            success "Configuration Nginx copiée et testée!"
        else
            warning "Fichier nginx.conf non trouvé. Configuration Nginx ignorée."
        fi
        
        success "Nginx configuré!"
    else
        warning "Nginx n'est pas installé. Configuration Nginx ignorée."
    fi
}

# Fonction pour configurer CI/CD
configure_cicd() {
    log "Configuration de CI/CD..."
    
    # Configuration GitHub Actions
    if [ -d ".github/workflows" ]; then
        log "Configuration de GitHub Actions..."
        
        # Vérifier que les fichiers de workflow existent
        if [ -f ".github/workflows/ci-cd.yml" ]; then
            success "Workflow GitHub Actions configuré!"
        else
            warning "Fichier de workflow GitHub Actions non trouvé."
        fi
    else
        warning "Répertoire .github/workflows non trouvé. Configuration CI/CD ignorée."
    fi
    
    success "CI/CD configuré!"
}

# Fonction pour configurer les environnements
configure_environments() {
    log "Configuration des environnements..."
    
    # Configuration de l'environnement de développement
    if [ -f "Angular/Tuto-Angular/src/environments/environment.ts" ]; then
        log "Configuration de l'environnement de développement..."
        
        # Vérifier que la configuration est correcte
        if grep -q "apiUrl.*localhost" "Angular/Tuto-Angular/src/environments/environment.ts"; then
            success "Environnement de développement configuré!"
        else
            warning "Configuration de l'environnement de développement à vérifier."
        fi
    else
        warning "Fichier environment.ts non trouvé. Configuration de l'environnement ignorée."
    fi
    
    # Configuration de l'environnement de production
    if [ -f "Angular/Tuto-Angular/src/environments/environment.prod.ts" ]; then
        log "Configuration de l'environnement de production..."
        
        # Vérifier que la configuration est correcte
        if grep -q "apiUrl.*yourdomain" "Angular/Tuto-Angular/src/environments/environment.prod.ts"; then
            success "Environnement de production configuré!"
        else
            warning "Configuration de l'environnement de production à vérifier."
        fi
    else
        warning "Fichier environment.prod.ts non trouvé. Configuration de l'environnement ignorée."
    fi
    
    success "Environnements configurés!"
}

# Fonction pour configurer les outils de développement
configure_dev_tools() {
    log "Configuration des outils de développement..."
    
    # Configuration ESLint
    if [ -f "Angular/Tuto-Angular/.eslintrc.json" ]; then
        log "Configuration d'ESLint..."
        
        # Installer ESLint globalement si nécessaire
        if ! command -v eslint >/dev/null 2>&1; then
            npm install -g eslint || {
                warning "Échec de l'installation globale d'ESLint"
            }
        fi
        
        success "ESLint configuré!"
    else
        warning "Fichier .eslintrc.json non trouvé. Configuration ESLint ignorée."
    fi
    
    # Configuration Prettier
    if [ -f "Angular/Tuto-Angular/.prettierrc" ]; then
        log "Configuration de Prettier..."
        
        # Installer Prettier globalement si nécessaire
        if ! command -v prettier >/dev/null 2>&1; then
            npm install -g prettier || {
                warning "Échec de l'installation globale de Prettier"
            }
        fi
        
        success "Prettier configuré!"
    else
        warning "Fichier .prettierrc non trouvé. Configuration Prettier ignorée."
    fi
    
    success "Outils de développement configurés!"
}

# Fonction pour configurer tout
configure_all() {
    log "Configuration complète..."
    
    configure_development
    configure_database
    configure_docker
    configure_nginx
    configure_cicd
    configure_environments
    configure_dev_tools
    
    success "Configuration complète terminée!"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [CONFIG_TYPE] [OPTIONS]"
    echo ""
    echo "Configuration Types:"
    echo "  all         Toutes les configurations (défaut)"
    echo "  development Configuration de l'environnement de développement"
    echo "  database    Configuration de la base de données"
    echo "  docker      Configuration de Docker"
    echo "  nginx       Configuration de Nginx"
    echo "  cicd        Configuration de CI/CD"
    echo "  environments Configuration des environnements"
    echo "  dev-tools   Configuration des outils de développement"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Options:"
    echo "  CONFIG_DIR    Répertoire de configuration (défaut: config)"
    echo "  TEMPLATE_DIR  Répertoire des modèles (défaut: templates)"
    echo ""
    echo "Examples:"
    echo "  $0 all"
    echo "  $0 development"
    echo "  CONFIG_DIR=/custom/config $0 all"
}

# Fonction principale
main() {
    case "$CONFIG_TYPE" in
        all)
            check_prerequisites
            create_directories
            configure_all
            ;;
        development)
            check_prerequisites
            create_directories
            configure_development
            ;;
        database)
            check_prerequisites
            create_directories
            configure_database
            ;;
        docker)
            check_prerequisites
            create_directories
            configure_docker
            ;;
        nginx)
            check_prerequisites
            create_directories
            configure_nginx
            ;;
        cicd)
            check_prerequisites
            create_directories
            configure_cicd
            ;;
        environments)
            check_prerequisites
            create_directories
            configure_environments
            ;;
        dev-tools)
            check_prerequisites
            create_directories
            configure_dev_tools
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Type de configuration inconnu: $CONFIG_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"