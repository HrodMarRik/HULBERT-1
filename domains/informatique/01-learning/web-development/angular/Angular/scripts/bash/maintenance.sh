#!/bin/bash

# Script de maintenance pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAINTENANCE_TYPE=${1:-all}
BACKUP_DIR=${BACKUP_DIR:-"backups"}
LOG_DIR=${LOG_DIR:-"logs"}

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
    log "Vérification des prérequis de maintenance..."
    
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
        warning "Docker n'est pas installé. La maintenance Docker sera ignorée."
    fi
    
    if ! command -v psql >/dev/null 2>&1; then
        warning "PostgreSQL n'est pas installé. La maintenance de la base de données sera ignorée."
    fi
    
    success "Prérequis de maintenance vérifiés!"
}

# Fonction pour créer les répertoires nécessaires
create_directories() {
    log "Création des répertoires nécessaires..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "Angular/Tuto-Angular/logs"
    mkdir -p "Angular/Tuto-Angular/backend/logs"
    
    success "Répertoires créés!"
}

# Fonction pour sauvegarder les données
backup_data() {
    log "Sauvegarde des données..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_path="$BACKUP_DIR/backup_$timestamp"
    
    mkdir -p "$backup_path"
    
    # Sauvegarder le code source
    log "Sauvegarde du code source..."
    tar -czf "$backup_path/source_code.tar.gz" --exclude=node_modules --exclude=dist --exclude=__pycache__ --exclude=.git .
    
    # Sauvegarder la base de données
    if command -v psql >/dev/null 2>&1; then
        log "Sauvegarde de la base de données..."
        pg_dump tuto_angular > "$backup_path/database.sql"
    else
        warning "PostgreSQL n'est pas installé. Sauvegarde de la base de données ignorée."
    fi
    
    # Sauvegarder les logs
    log "Sauvegarde des logs..."
    if [ -d "Angular/Tuto-Angular/logs" ]; then
        tar -czf "$backup_path/logs.tar.gz" Angular/Tuto-Angular/logs Angular/Tuto-Angular/backend/logs
    fi
    
    # Sauvegarder les configurations
    log "Sauvegarde des configurations..."
    cp -r Angular/Tuto-Angular/backend/config.env "$backup_path/" 2>/dev/null || true
    cp -r Angular/Tuto-Angular/src/environments "$backup_path/" 2>/dev/null || true
    
    success "Sauvegarde terminée: $backup_path"
}

# Fonction pour nettoyer les logs
clean_logs() {
    log "Nettoyage des logs..."
    
    # Nettoyer les logs anciens (plus de 30 jours)
    find Angular/Tuto-Angular/logs -name "*.log" -mtime +30 -delete 2>/dev/null || true
    find Angular/Tuto-Angular/backend/logs -name "*.log" -mtime +30 -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    # Nettoyer les logs de taille importante (plus de 100MB)
    find Angular/Tuto-Angular/logs -name "*.log" -size +100M -delete 2>/dev/null || true
    find Angular/Tuto-Angular/backend/logs -name "*.log" -size +100M -delete 2>/dev/null || true
    find "$LOG_DIR" -name "*.log" -size +100M -delete 2>/dev/null || true
    
    success "Logs nettoyés!"
}

# Fonction pour nettoyer les fichiers temporaires
clean_temp_files() {
    log "Nettoyage des fichiers temporaires..."
    
    # Nettoyer le frontend
    rm -rf Angular/Tuto-Angular/dist
    rm -rf Angular/Tuto-Angular/out-tsc
    rm -rf Angular/Tuto-Angular/node_modules/.cache
    
    # Nettoyer le backend
    find Angular/Tuto-Angular/backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    find Angular/Tuto-Angular/backend -type f -name "*.pyc" -delete 2>/dev/null || true
    find Angular/Tuto-Angular/backend -type f -name "*.pyo" -delete 2>/dev/null || true
    find Angular/Tuto-Angular/backend -type f -name "*.pyd" -delete 2>/dev/null || true
    
    # Nettoyer les fichiers temporaires système
    rm -rf /tmp/tuto-angular* 2>/dev/null || true
    rm -rf ~/.cache/tuto-angular* 2>/dev/null || true
    
    success "Fichiers temporaires nettoyés!"
}

# Fonction pour nettoyer les images Docker
clean_docker_images() {
    log "Nettoyage des images Docker..."
    
    if ! command -v docker >/dev/null 2>&1; then
        warning "Docker n'est pas installé. Nettoyage Docker ignoré."
        return
    fi
    
    # Nettoyer les images non utilisées
    docker image prune -f
    
    # Nettoyer les conteneurs arrêtés
    docker container prune -f
    
    # Nettoyer les volumes non utilisés
    docker volume prune -f
    
    # Nettoyer les réseaux non utilisés
    docker network prune -f
    
    success "Images Docker nettoyées!"
}

# Fonction pour mettre à jour les dépendances
update_dependencies() {
    log "Mise à jour des dépendances..."
    
    # Frontend
    log "Mise à jour des dépendances frontend..."
    cd Angular/Tuto-Angular
    npm update
    npm audit fix
    cd ../..
    
    # Backend
    log "Mise à jour des dépendances backend..."
    cd Angular/Tuto-Angular/backend
    pip install --upgrade pip
    pip install --upgrade -r requirements.txt
    cd ../../..
    
    success "Dépendances mises à jour!"
}

# Fonction pour vérifier la santé de l'application
check_health() {
    log "Vérification de la santé de l'application..."
    
    # Vérifier les dépendances
    log "Vérification des dépendances..."
    
    # Frontend
    cd Angular/Tuto-Angular
    npm audit
    cd ../..
    
    # Backend
    cd Angular/Tuto-Angular/backend
    pip check
    cd ../../..
    
    # Vérifier la base de données
    if command -v psql >/dev/null 2>&1; then
        log "Vérification de la base de données..."
        psql -d tuto_angular -c "SELECT version();" >/dev/null 2>&1 || {
            warning "Connexion à la base de données échouée"
        }
    fi
    
    # Vérifier les services Docker
    if command -v docker >/dev/null 2>&1; then
        log "Vérification des services Docker..."
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
    
    success "Vérification de santé terminée!"
}

# Fonction pour générer un rapport de maintenance
generate_maintenance_report() {
    log "Génération du rapport de maintenance..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$LOG_DIR/maintenance_report_$timestamp.txt"
    
    cat > "$report_file" << EOF
Rapport de maintenance - Tuto Angular n-tier
Généré le: $(date)
Type de maintenance: $MAINTENANCE_TYPE

=== Informations système ===
OS: $(uname -a)
Node.js: $(node --version)
npm: $(npm --version)
Python: $(python3 --version)
pip: $(pip --version)

=== Espace disque ===
$(df -h)

=== Mémoire ===
$(free -h)

=== Processus ===
$(ps aux | head -20)

=== Services Docker ===
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker non disponible")

=== Base de données ===
$(psql -d tuto_angular -c "SELECT version();" 2>/dev/null || echo "PostgreSQL non disponible")

=== Logs récents ===
$(tail -50 Angular/Tuto-Angular/logs/*.log 2>/dev/null || echo "Aucun log récent")

=== Erreurs récentes ===
$(grep -i error Angular/Tuto-Angular/logs/*.log 2>/dev/null | tail -20 || echo "Aucune erreur récente")
EOF
    
    success "Rapport de maintenance généré: $report_file"
}

# Fonction pour restaurer depuis une sauvegarde
restore_from_backup() {
    log "Restauration depuis une sauvegarde..."
    
    local backup_path=${2:-""}
    
    if [ -z "$backup_path" ]; then
        error "Chemin de sauvegarde non spécifié"
        exit 1
    fi
    
    if [ ! -d "$backup_path" ]; then
        error "Répertoire de sauvegarde non trouvé: $backup_path"
        exit 1
    fi
    
    # Restaurer le code source
    log "Restauration du code source..."
    tar -xzf "$backup_path/source_code.tar.gz"
    
    # Restaurer la base de données
    if [ -f "$backup_path/database.sql" ] && command -v psql >/dev/null 2>&1; then
        log "Restauration de la base de données..."
        psql -d tuto_angular < "$backup_path/database.sql"
    fi
    
    # Restaurer les logs
    if [ -f "$backup_path/logs.tar.gz" ]; then
        log "Restauration des logs..."
        tar -xzf "$backup_path/logs.tar.gz"
    fi
    
    # Restaurer les configurations
    if [ -f "$backup_path/config.env" ]; then
        log "Restauration des configurations..."
        cp "$backup_path/config.env" Angular/Tuto-Angular/backend/
    fi
    
    success "Restauration terminée!"
}

# Fonction pour surveiller les performances
monitor_performance() {
    log "Surveillance des performances..."
    
    # Surveiller l'utilisation CPU
    log "Utilisation CPU:"
    top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
    
    # Surveiller l'utilisation mémoire
    log "Utilisation mémoire:"
    free -h | grep "Mem:" | awk '{print $3 "/" $2}'
    
    # Surveiller l'espace disque
    log "Espace disque:"
    df -h | grep -E "(/$|/home|/var)"
    
    # Surveiller les processus
    log "Processus les plus gourmands:"
    ps aux --sort=-%cpu | head -10
    
    success "Surveillance des performances terminée!"
}

# Fonction pour nettoyer
cleanup() {
    log "Nettoyage complet..."
    
    clean_logs
    clean_temp_files
    clean_docker_images
    
    success "Nettoyage complet terminé!"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [MAINTENANCE_TYPE] [OPTIONS]"
    echo ""
    echo "Maintenance Types:"
    echo "  all         Toutes les tâches de maintenance (défaut)"
    echo "  backup      Sauvegarde des données"
    echo "  clean       Nettoyage des fichiers temporaires"
    echo "  logs        Nettoyage des logs"
    echo "  docker      Nettoyage des images Docker"
    echo "  update      Mise à jour des dépendances"
    echo "  health      Vérification de la santé"
    echo "  report      Génération du rapport de maintenance"
    echo "  restore     Restauration depuis une sauvegarde"
    echo "  monitor     Surveillance des performances"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Options:"
    echo "  BACKUP_DIR  Répertoire de sauvegarde (défaut: backups)"
    echo "  LOG_DIR     Répertoire des logs (défaut: logs)"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 clean"
    echo "  $0 restore /path/to/backup"
    echo "  BACKUP_DIR=/custom/backup $0 all"
}

# Fonction principale
main() {
    case "$MAINTENANCE_TYPE" in
        all)
            check_prerequisites
            create_directories
            backup_data
            clean_logs
            clean_temp_files
            clean_docker_images
            update_dependencies
            check_health
            generate_maintenance_report
            ;;
        backup)
            check_prerequisites
            create_directories
            backup_data
            ;;
        clean)
            clean_temp_files
            clean_docker_images
            ;;
        logs)
            clean_logs
            ;;
        docker)
            clean_docker_images
            ;;
        update)
            check_prerequisites
            update_dependencies
            ;;
        health)
            check_health
            ;;
        report)
            create_directories
            generate_maintenance_report
            ;;
        restore)
            restore_from_backup "$@"
            ;;
        monitor)
            monitor_performance
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Type de maintenance inconnu: $MAINTENANCE_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
