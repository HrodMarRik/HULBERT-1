#!/bin/bash
# Script de déploiement automatique HULBERT-1
# Usage: ./deploy.sh [environment] [options]

set -e

# Configuration
PROJECT_NAME="hulbert-1"
PROJECT_DIR="/opt/$PROJECT_NAME"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"
LOG_DIR="/opt/$PROJECT_NAME/logs"
ENVIRONMENT=${1:-production}
DRY_RUN=${2:-false}

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction de vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé"
        exit 1
    fi
    
    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -f "docker-compose.prod.yml" ]; then
        log_error "Ce script doit être exécuté depuis la racine du projet"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Fonction de sauvegarde
create_backup() {
    log_info "Création d'une sauvegarde..."
    
    BACKUP_FILE="$BACKUP_DIR/hulbert_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Sauvegarde créée: $BACKUP_FILE"
        return 0
    fi
    
    # Créer le répertoire de sauvegarde s'il n'existe pas
    mkdir -p "$BACKUP_DIR"
    
    # Sauvegarder la base de données
    if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U hulbert hulbert_db | gzip > "$BACKUP_FILE"
        log_success "Sauvegarde créée: $BACKUP_FILE"
    else
        log_warning "PostgreSQL n'est pas en cours d'exécution, pas de sauvegarde"
    fi
}

# Fonction de mise à jour du code
update_code() {
    log_info "Mise à jour du code..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Code mis à jour"
        return 0
    fi
    
    # Sauvegarder les modifications locales
    git stash push -m "Auto-stash before deployment $(date)"
    
    # Récupérer les dernières modifications
    git fetch origin
    git reset --hard origin/main
    
    log_success "Code mis à jour"
}

# Fonction de construction des images
build_images() {
    log_info "Construction des images Docker..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Images construites"
        return 0
    fi
    
    # Construire les images
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    log_success "Images construites"
}

# Fonction de déploiement
deploy_services() {
    log_info "Déploiement des services..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Services déployés"
        return 0
    fi
    
    # Arrêter les services existants
    docker-compose -f docker-compose.prod.yml down
    
    # Démarrer les nouveaux services
    docker-compose -f docker-compose.prod.yml up -d
    
    log_success "Services déployés"
}

# Fonction d'exécution des migrations
run_migrations() {
    log_info "Exécution des migrations de base de données..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Migrations exécutées"
        return 0
    fi
    
    # Attendre que PostgreSQL soit prêt
    sleep 10
    
    # Exécuter les migrations
    docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
    
    log_success "Migrations exécutées"
}

# Fonction de vérification de santé
health_check() {
    log_info "Vérification de la santé des services..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Vérification de santé effectuée"
        return 0
    fi
    
    # Attendre que les services soient prêts
    sleep 30
    
    # Vérifier le backend
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        log_success "Backend: OK"
    else
        log_error "Backend: ÉCHEC"
        return 1
    fi
    
    # Vérifier le frontend
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "Frontend: OK"
    else
        log_error "Frontend: ÉCHEC"
        return 1
    fi
    
    # Vérifier PostgreSQL
    if docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U hulbert > /dev/null 2>&1; then
        log_success "PostgreSQL: OK"
    else
        log_error "PostgreSQL: ÉCHEC"
        return 1
    fi
    
    # Vérifier Redis
    if docker-compose -f docker-compose.prod.yml exec redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis: OK"
    else
        log_error "Redis: ÉCHEC"
        return 1
    fi
    
    log_success "Tous les services sont opérationnels"
}

# Fonction de nettoyage
cleanup() {
    log_info "Nettoyage des ressources..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Nettoyage effectué"
        return 0
    fi
    
    # Nettoyer les images Docker inutilisées
    docker image prune -f
    
    # Nettoyer les conteneurs arrêtés
    docker container prune -f
    
    # Nettoyer les volumes inutilisés
    docker volume prune -f
    
    log_success "Nettoyage terminé"
}

# Fonction de rollback
rollback() {
    log_error "Échec du déploiement, rollback en cours..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Rollback effectué"
        return 0
    fi
    
    # Restaurer la sauvegarde la plus récente
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/hulbert_backup_*.sql.gz 2>/dev/null | head -n1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        log_info "Restauration de la sauvegarde: $LATEST_BACKUP"
        
        # Arrêter les services
        docker-compose -f docker-compose.prod.yml down
        
        # Restaurer la base de données
        gunzip -c "$LATEST_BACKUP" | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U hulbert hulbert_db
        
        # Redémarrer les services
        docker-compose -f docker-compose.prod.yml up -d
        
        log_success "Rollback terminé"
    else
        log_error "Aucune sauvegarde trouvée pour le rollback"
    fi
}

# Fonction principale
main() {
    log_info "🚀 Démarrage du déploiement HULBERT-1"
    log_info "Environnement: $ENVIRONMENT"
    log_info "Mode DRY RUN: $DRY_RUN"
    
    # Vérifier les prérequis
    check_prerequisites
    
    # Créer une sauvegarde
    create_backup
    
    # Mettre à jour le code
    update_code
    
    # Construire les images
    build_images
    
    # Déployer les services
    deploy_services
    
    # Exécuter les migrations
    run_migrations
    
    # Vérifier la santé
    if health_check; then
        # Nettoyer les ressources
        cleanup
        
        log_success "✅ Déploiement terminé avec succès!"
        
        # Afficher les informations de déploiement
        echo ""
        log_info "📊 Informations de déploiement:"
        echo "  - Environnement: $ENVIRONMENT"
        echo "  - Date: $(date)"
        echo "  - Commit: $(git rev-parse --short HEAD)"
        echo "  - Branch: $(git branch --show-current)"
        echo ""
        log_info "🔗 URLs:"
        echo "  - Application: http://localhost"
        echo "  - API: http://localhost:8000"
        echo "  - Documentation API: http://localhost:8000/docs"
        echo ""
    else
        # Rollback en cas d'échec
        rollback
        log_error "❌ Déploiement échoué, rollback effectué"
        exit 1
    fi
}

# Gestion des signaux
trap 'log_error "Déploiement interrompu"; rollback; exit 1' INT TERM

# Exécuter le déploiement
main "$@"
