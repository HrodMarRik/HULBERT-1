#!/bin/bash
# Script de sauvegarde automatique HULBERT-1
# Usage: ./backup.sh [options]

set -e

# Configuration
PROJECT_NAME="hulbert-1"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"
LOG_DIR="/opt/$PROJECT_NAME/logs"
RETENTION_DAYS=30
COMPRESSION_LEVEL=6

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
    
    # Vérifier que PostgreSQL est en cours d'exécution
    if ! docker-compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
        log_error "PostgreSQL n'est pas en cours d'exécution"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Fonction de création du répertoire de sauvegarde
create_backup_directory() {
    log_info "Création du répertoire de sauvegarde..."
    
    # Créer le répertoire de sauvegarde s'il n'existe pas
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    
    log_success "Répertoire de sauvegarde créé: $BACKUP_DIR"
}

# Fonction de sauvegarde de la base de données
backup_database() {
    log_info "Sauvegarde de la base de données PostgreSQL..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/hulbert_db_$TIMESTAMP.sql.gz"
    
    # Sauvegarder la base de données
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
        -U hulbert \
        -h localhost \
        -p 5432 \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file=/tmp/backup.sql \
        hulbert_db
    
    # Copier le fichier de sauvegarde
    docker cp "$(docker-compose -f docker-compose.prod.yml ps -q postgres):/tmp/backup.sql" "$BACKUP_FILE"
    
    # Supprimer le fichier temporaire du conteneur
    docker-compose -f docker-compose.prod.yml exec postgres rm -f /tmp/backup.sql
    
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_success "Sauvegarde de la base de données créée: $BACKUP_FILE ($BACKUP_SIZE)"
        echo "$BACKUP_FILE"
    else
        log_error "Échec de la sauvegarde de la base de données"
        exit 1
    fi
}

# Fonction de sauvegarde des fichiers de configuration
backup_configuration() {
    log_info "Sauvegarde des fichiers de configuration..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CONFIG_BACKUP="$BACKUP_DIR/hulbert_config_$TIMESTAMP.tar.gz"
    
    # Créer une archive des fichiers de configuration
    tar -czf "$CONFIG_BACKUP" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='logs' \
        --exclude='*.log' \
        docker-compose.prod.yml \
        docker-compose.dev.yml \
        env.example \
        .env \
        infra/ \
        scripts/ \
        backend/alembic/ \
        backend/requirements.txt \
        backend/requirements-dev.txt \
        domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio/package.json \
        domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio/angular.json \
        2>/dev/null || true
    
    if [ -f "$CONFIG_BACKUP" ]; then
        CONFIG_SIZE=$(du -h "$CONFIG_BACKUP" | cut -f1)
        log_success "Sauvegarde de la configuration créée: $CONFIG_BACKUP ($CONFIG_SIZE)"
        echo "$CONFIG_BACKUP"
    else
        log_warning "Échec de la sauvegarde de la configuration"
    fi
}

# Fonction de sauvegarde des logs
backup_logs() {
    log_info "Sauvegarde des logs..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    LOGS_BACKUP="$BACKUP_DIR/hulbert_logs_$TIMESTAMP.tar.gz"
    
    # Créer une archive des logs
    tar -czf "$LOGS_BACKUP" \
        -C "$LOG_DIR" \
        . 2>/dev/null || true
    
    if [ -f "$LOGS_BACKUP" ]; then
        LOGS_SIZE=$(du -h "$LOGS_BACKUP" | cut -f1)
        log_success "Sauvegarde des logs créée: $LOGS_BACKUP ($LOGS_SIZE)"
        echo "$LOGS_BACKUP"
    else
        log_warning "Aucun log à sauvegarder"
    fi
}

# Fonction de nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    log_info "Nettoyage des anciennes sauvegardes (plus de $RETENTION_DAYS jours)..."
    
    # Compter les sauvegardes avant nettoyage
    BACKUP_COUNT_BEFORE=$(find "$BACKUP_DIR" -name "hulbert_*.gz" -type f | wc -l)
    
    # Supprimer les sauvegardes anciennes
    find "$BACKUP_DIR" -name "hulbert_*.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # Compter les sauvegardes après nettoyage
    BACKUP_COUNT_AFTER=$(find "$BACKUP_DIR" -name "hulbert_*.gz" -type f | wc -l)
    
    DELETED_COUNT=$((BACKUP_COUNT_BEFORE - BACKUP_COUNT_AFTER))
    
    if [ $DELETED_COUNT -gt 0 ]; then
        log_success "$DELETED_COUNT anciennes sauvegardes supprimées"
    else
        log_info "Aucune ancienne sauvegarde à supprimer"
    fi
}

# Fonction de vérification de l'intégrité des sauvegardes
verify_backups() {
    log_info "Vérification de l'intégrité des sauvegardes..."
    
    # Vérifier les sauvegardes de base de données
    for backup in "$BACKUP_DIR"/hulbert_db_*.sql.gz; do
        if [ -f "$backup" ]; then
            if gzip -t "$backup" 2>/dev/null; then
                log_success "Sauvegarde DB valide: $(basename "$backup")"
            else
                log_error "Sauvegarde DB corrompue: $(basename "$backup")"
            fi
        fi
    done
    
    # Vérifier les sauvegardes de configuration
    for backup in "$BACKUP_DIR"/hulbert_config_*.tar.gz; do
        if [ -f "$backup" ]; then
            if tar -tzf "$backup" >/dev/null 2>&1; then
                log_success "Sauvegarde config valide: $(basename "$backup")"
            else
                log_error "Sauvegarde config corrompue: $(basename "$backup")"
            fi
        fi
    done
}

# Fonction de génération du rapport
generate_report() {
    log_info "Génération du rapport de sauvegarde..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    REPORT_FILE="$LOG_DIR/backup_report_$TIMESTAMP.log"
    
    {
        echo "=== RAPPORT DE SAUVEGARDE HULBERT-1 ==="
        echo "Date: $(date)"
        echo "Serveur: $(hostname)"
        echo "Répertoire de sauvegarde: $BACKUP_DIR"
        echo ""
        echo "=== SAUVEGARDES CRÉÉES ==="
        ls -lh "$BACKUP_DIR"/hulbert_*_$TIMESTAMP.* 2>/dev/null || echo "Aucune sauvegarde créée"
        echo ""
        echo "=== STATISTIQUES ==="
        echo "Nombre total de sauvegardes: $(find "$BACKUP_DIR" -name "hulbert_*.gz" -type f | wc -l)"
        echo "Espace utilisé: $(du -sh "$BACKUP_DIR" | cut -f1)"
        echo "Sauvegardes supprimées: $DELETED_COUNT"
        echo ""
        echo "=== ÉTAT DES SERVICES ==="
        docker-compose -f docker-compose.prod.yml ps
        echo ""
        echo "=== FIN DU RAPPORT ==="
    } > "$REPORT_FILE"
    
    log_success "Rapport généré: $REPORT_FILE"
}

# Fonction de notification (optionnelle)
send_notification() {
    local status=$1
    local message=$2
    
    # Ici vous pouvez ajouter l'envoi d'email, Slack, etc.
    # Exemple avec curl pour Slack:
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"$message\"}" \
    #     "$SLACK_WEBHOOK_URL"
    
    log_info "Notification: $message"
}

# Fonction principale
main() {
    log_info "🔄 Démarrage de la sauvegarde HULBERT-1"
    
    # Vérifier les prérequis
    check_prerequisites
    
    # Créer le répertoire de sauvegarde
    create_backup_directory
    
    # Sauvegarder la base de données
    DB_BACKUP=$(backup_database)
    
    # Sauvegarder la configuration
    CONFIG_BACKUP=$(backup_configuration)
    
    # Sauvegarder les logs
    LOGS_BACKUP=$(backup_logs)
    
    # Nettoyer les anciennes sauvegardes
    cleanup_old_backups
    
    # Vérifier l'intégrité
    verify_backups
    
    # Générer le rapport
    generate_report
    
    # Envoyer une notification
    send_notification "success" "Sauvegarde HULBERT-1 terminée avec succès"
    
    log_success "✅ Sauvegarde terminée avec succès!"
    
    # Afficher le résumé
    echo ""
    log_info "📊 Résumé de la sauvegarde:"
    echo "  - Base de données: $DB_BACKUP"
    echo "  - Configuration: $CONFIG_BACKUP"
    echo "  - Logs: $LOGS_BACKUP"
    echo "  - Répertoire: $BACKUP_DIR"
    echo "  - Rétention: $RETENTION_DAYS jours"
    echo ""
}

# Gestion des signaux
trap 'log_error "Sauvegarde interrompue"; exit 1' INT TERM

# Exécuter la sauvegarde
main "$@"
