#!/bin/bash

# Script de backup pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_TYPE=${1:-all}
BACKUP_DIR=${BACKUP_DIR:-"backups"}
RETENTION_DAYS=${RETENTION_DAYS:-30}
COMPRESS=${COMPRESS:-true}

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
    log "Vérification des prérequis de backup..."
    
    if ! command -v tar >/dev/null 2>&1; then
        error "tar n'est pas installé. Veuillez l'installer."
        exit 1
    fi
    
    if ! command -v gzip >/dev/null 2>&1; then
        warning "gzip n'est pas installé. La compression sera limitée."
    fi
    
    if ! command -v psql >/dev/null 2>&1; then
        warning "PostgreSQL n'est pas installé. Le backup de la base de données sera ignoré."
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        warning "Docker n'est pas installé. Le backup des images Docker sera ignoré."
    fi
    
    success "Prérequis de backup vérifiés!"
}

# Fonction pour créer les répertoires nécessaires
create_directories() {
    log "Création des répertoires nécessaires..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/code"
    mkdir -p "$BACKUP_DIR/database"
    mkdir -p "$BACKUP_DIR/logs"
    mkdir -p "$BACKUP_DIR/config"
    mkdir -p "$BACKUP_DIR/docker"
    
    success "Répertoires créés!"
}

# Fonction pour créer un timestamp
create_timestamp() {
    date +"%Y%m%d_%H%M%S"
}

# Fonction pour sauvegarder le code source
backup_code() {
    log "Sauvegarde du code source..."
    
    local timestamp=$(create_timestamp)
    local backup_file="$BACKUP_DIR/code/source_code_$timestamp.tar.gz"
    
    # Exclure les fichiers/dossiers non nécessaires
    tar --exclude='node_modules' \
        --exclude='dist' \
        --exclude='out-tsc' \
        --exclude='__pycache__' \
        --exclude='*.pyc' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='*.tmp' \
        --exclude='*.swp' \
        --exclude='*.swo' \
        --exclude='*~' \
        --exclude='.DS_Store' \
        --exclude='Thumbs.db' \
        -czf "$backup_file" \
        Angular/ \
        backend/ \
        docs/ \
        *.md \
        *.json \
        *.sh \
        *.bat \
        *.ps1 \
        *.yml \
        *.yaml \
        *.conf \
        *.env \
        *.example 2>/dev/null || true
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        success "Code source sauvegardé: $backup_file (Taille: $size)"
    else
        error "Échec de la sauvegarde du code source"
        return 1
    fi
}

# Fonction pour sauvegarder la base de données
backup_database() {
    log "Sauvegarde de la base de données..."
    
    if ! command -v psql >/dev/null 2>&1; then
        warning "PostgreSQL n'est pas installé. Sauvegarde de la base de données ignorée."
        return 0
    fi
    
    local timestamp=$(create_timestamp)
    local backup_file="$BACKUP_DIR/database/database_$timestamp.sql"
    
    # Sauvegarde complète
    pg_dump -h localhost -U postgres -d tuto_angular > "$backup_file" 2>/dev/null || {
        error "Échec de la sauvegarde de la base de données"
        return 1
    }
    
    # Compresser si demandé
    if [ "$COMPRESS" = "true" ] && command -v gzip >/dev/null 2>&1; then
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
    fi
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        success "Base de données sauvegardée: $backup_file (Taille: $size)"
    else
        error "Échec de la sauvegarde de la base de données"
        return 1
    fi
}

# Fonction pour sauvegarder les logs
backup_logs() {
    log "Sauvegarde des logs..."
    
    local timestamp=$(create_timestamp)
    local backup_file="$BACKUP_DIR/logs/logs_$timestamp.tar.gz"
    
    # Créer un fichier temporaire pour lister les logs
    local temp_file=$(mktemp)
    
    # Trouver tous les fichiers de log
    find . -name "*.log" -type f 2>/dev/null > "$temp_file"
    find . -name "*.out" -type f 2>/dev/null >> "$temp_file"
    find . -name "*.err" -type f 2>/dev/null >> "$temp_file"
    
    if [ -s "$temp_file" ]; then
        tar -czf "$backup_file" -T "$temp_file" 2>/dev/null || {
            error "Échec de la sauvegarde des logs"
            rm -f "$temp_file"
            return 1
        }
        
        local size=$(du -h "$backup_file" | cut -f1)
        success "Logs sauvegardés: $backup_file (Taille: $size)"
    else
        warning "Aucun fichier de log trouvé"
    fi
    
    rm -f "$temp_file"
}

# Fonction pour sauvegarder les configurations
backup_config() {
    log "Sauvegarde des configurations..."
    
    local timestamp=$(create_timestamp)
    local backup_file="$BACKUP_DIR/config/config_$timestamp.tar.gz"
    
    # Créer un fichier temporaire pour lister les configurations
    local temp_file=$(mktemp)
    
    # Trouver tous les fichiers de configuration
    find . -name "*.env" -type f 2>/dev/null > "$temp_file"
    find . -name "*.conf" -type f 2>/dev/null >> "$temp_file"
    find . -name "*.config" -type f 2>/dev/null >> "$temp_file"
    find . -name "*.ini" -type f 2>/dev/null >> "$temp_file"
    find . -name "*.yaml" -type f 2>/dev/null >> "$temp_file"
    find . -name "*.yml" -type f 2>/dev/null >> "$temp_file"
    find . -name "*.json" -type f 2>/dev/null >> "$temp_file"
    find . -name "*.xml" -type f 2>/dev/null >> "$temp_file"
    find . -name "*.properties" -type f 2>/dev/null >> "$temp_file"
    
    if [ -s "$temp_file" ]; then
        tar -czf "$backup_file" -T "$temp_file" 2>/dev/null || {
            error "Échec de la sauvegarde des configurations"
            rm -f "$temp_file"
            return 1
        }
        
        local size=$(du -h "$backup_file" | cut -f1)
        success "Configurations sauvegardées: $backup_file (Taille: $size)"
    else
        warning "Aucun fichier de configuration trouvé"
    fi
    
    rm -f "$temp_file"
}

# Fonction pour sauvegarder les images Docker
backup_docker() {
    log "Sauvegarde des images Docker..."
    
    if ! command -v docker >/dev/null 2>&1; then
        warning "Docker n'est pas installé. Sauvegarde des images Docker ignorée."
        return 0
    fi
    
    local timestamp=$(create_timestamp)
    local backup_file="$BACKUP_DIR/docker/docker_images_$timestamp.tar"
    
    # Sauvegarder les images Docker
    docker save -o "$backup_file" $(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>") 2>/dev/null || {
        error "Échec de la sauvegarde des images Docker"
        return 1
    }
    
    # Compresser si demandé
    if [ "$COMPRESS" = "true" ] && command -v gzip >/dev/null 2>&1; then
        gzip "$backup_file"
        backup_file="${backup_file}.gz"
    fi
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        success "Images Docker sauvegardées: $backup_file (Taille: $size)"
    else
        error "Échec de la sauvegarde des images Docker"
        return 1
    fi
}

# Fonction pour créer un backup complet
backup_all() {
    log "Création d'un backup complet..."
    
    local timestamp=$(create_timestamp)
    local backup_file="$BACKUP_DIR/complete_backup_$timestamp.tar.gz"
    
    # Créer un fichier temporaire pour lister les fichiers à sauvegarder
    local temp_file=$(mktemp)
    
    # Lister tous les fichiers à sauvegarder
    find . -type f \
        -not -path "./$BACKUP_DIR/*" \
        -not -path "./node_modules/*" \
        -not -path "./dist/*" \
        -not -path "./out-tsc/*" \
        -not -path "./__pycache__/*" \
        -not -path "./.git/*" \
        -not -name "*.log" \
        -not -name "*.tmp" \
        -not -name "*.swp" \
        -not -name "*.swo" \
        -not -name "*~" \
        -not -name ".DS_Store" \
        -not -name "Thumbs.db" \
        > "$temp_file" 2>/dev/null
    
    if [ -s "$temp_file" ]; then
        tar -czf "$backup_file" -T "$temp_file" 2>/dev/null || {
            error "Échec de la sauvegarde complète"
            rm -f "$temp_file"
            return 1
        }
        
        local size=$(du -h "$backup_file" | cut -f1)
        success "Backup complet créé: $backup_file (Taille: $size)"
    else
        error "Aucun fichier à sauvegarder"
        rm -f "$temp_file"
        return 1
    fi
    
    rm -f "$temp_file"
}

# Fonction pour nettoyer les anciens backups
cleanup_old_backups() {
    log "Nettoyage des anciens backups..."
    
    local deleted_count=0
    
    # Nettoyer les backups de code
    if [ -d "$BACKUP_DIR/code" ]; then
        deleted_count=$((deleted_count + $(find "$BACKUP_DIR/code" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)))
    fi
    
    # Nettoyer les backups de base de données
    if [ -d "$BACKUP_DIR/database" ]; then
        deleted_count=$((deleted_count + $(find "$BACKUP_DIR/database" -name "*.sql*" -mtime +$RETENTION_DAYS -delete -print | wc -l)))
    fi
    
    # Nettoyer les backups de logs
    if [ -d "$BACKUP_DIR/logs" ]; then
        deleted_count=$((deleted_count + $(find "$BACKUP_DIR/logs" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)))
    fi
    
    # Nettoyer les backups de configuration
    if [ -d "$BACKUP_DIR/config" ]; then
        deleted_count=$((deleted_count + $(find "$BACKUP_DIR/config" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)))
    fi
    
    # Nettoyer les backups Docker
    if [ -d "$BACKUP_DIR/docker" ]; then
        deleted_count=$((deleted_count + $(find "$BACKUP_DIR/docker" -name "*.tar*" -mtime +$RETENTION_DAYS -delete -print | wc -l)))
    fi
    
    # Nettoyer les backups complets
    if [ -d "$BACKUP_DIR" ]; then
        deleted_count=$((deleted_count + $(find "$BACKUP_DIR" -name "complete_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)))
    fi
    
    if [ "$deleted_count" -gt 0 ]; then
        success "Anciens backups nettoyés: $deleted_count fichiers supprimés"
    else
        log "Aucun ancien backup à nettoyer"
    fi
}

# Fonction pour vérifier l'intégrité des backups
verify_backups() {
    log "Vérification de l'intégrité des backups..."
    
    local verified_count=0
    local failed_count=0
    
    # Vérifier les backups de code
    if [ -d "$BACKUP_DIR/code" ]; then
        for backup in "$BACKUP_DIR/code"/*.tar.gz; do
            if [ -f "$backup" ]; then
                if tar -tzf "$backup" >/dev/null 2>&1; then
                    verified_count=$((verified_count + 1))
                else
                    failed_count=$((failed_count + 1))
                    warning "Backup corrompu: $backup"
                fi
            fi
        done
    fi
    
    # Vérifier les backups de base de données
    if [ -d "$BACKUP_DIR/database" ]; then
        for backup in "$BACKUP_DIR/database"/*.sql*; do
            if [ -f "$backup" ]; then
                if [ "${backup##*.}" = "gz" ]; then
                    if gzip -t "$backup" 2>/dev/null; then
                        verified_count=$((verified_count + 1))
                    else
                        failed_count=$((failed_count + 1))
                        warning "Backup corrompu: $backup"
                    fi
                else
                    verified_count=$((verified_count + 1))
                fi
            fi
        done
    fi
    
    # Vérifier les backups de logs
    if [ -d "$BACKUP_DIR/logs" ]; then
        for backup in "$BACKUP_DIR/logs"/*.tar.gz; do
            if [ -f "$backup" ]; then
                if tar -tzf "$backup" >/dev/null 2>&1; then
                    verified_count=$((verified_count + 1))
                else
                    failed_count=$((failed_count + 1))
                    warning "Backup corrompu: $backup"
                fi
            fi
        done
    fi
    
    # Vérifier les backups de configuration
    if [ -d "$BACKUP_DIR/config" ]; then
        for backup in "$BACKUP_DIR/config"/*.tar.gz; do
            if [ -f "$backup" ]; then
                if tar -tzf "$backup" >/dev/null 2>&1; then
                    verified_count=$((verified_count + 1))
                else
                    failed_count=$((failed_count + 1))
                    warning "Backup corrompu: $backup"
                fi
            fi
        done
    fi
    
    # Vérifier les backups Docker
    if [ -d "$BACKUP_DIR/docker" ]; then
        for backup in "$BACKUP_DIR/docker"/*.tar*; do
            if [ -f "$backup" ]; then
                if [ "${backup##*.}" = "gz" ]; then
                    if gzip -t "$backup" 2>/dev/null; then
                        verified_count=$((verified_count + 1))
                    else
                        failed_count=$((failed_count + 1))
                        warning "Backup corrompu: $backup"
                    fi
                else
                    verified_count=$((verified_count + 1))
                fi
            fi
        done
    fi
    
    # Vérifier les backups complets
    if [ -d "$BACKUP_DIR" ]; then
        for backup in "$BACKUP_DIR"/complete_backup_*.tar.gz; do
            if [ -f "$backup" ]; then
                if tar -tzf "$backup" >/dev/null 2>&1; then
                    verified_count=$((verified_count + 1))
                else
                    failed_count=$((failed_count + 1))
                    warning "Backup corrompu: $backup"
                fi
            fi
        done
    fi
    
    if [ "$failed_count" -eq 0 ]; then
        success "Tous les backups sont intègres ($verified_count fichiers vérifiés)"
    else
        warning "Backups vérifiés: $verified_count OK, $failed_count corrompus"
    fi
}

# Fonction pour lister les backups
list_backups() {
    log "Liste des backups disponibles..."
    
    echo "=== Backups de code ==="
    if [ -d "$BACKUP_DIR/code" ]; then
        ls -lh "$BACKUP_DIR/code"/*.tar.gz 2>/dev/null || echo "Aucun backup de code"
    else
        echo "Aucun backup de code"
    fi
    
    echo "=== Backups de base de données ==="
    if [ -d "$BACKUP_DIR/database" ]; then
        ls -lh "$BACKUP_DIR/database"/*.sql* 2>/dev/null || echo "Aucun backup de base de données"
    else
        echo "Aucun backup de base de données"
    fi
    
    echo "=== Backups de logs ==="
    if [ -d "$BACKUP_DIR/logs" ]; then
        ls -lh "$BACKUP_DIR/logs"/*.tar.gz 2>/dev/null || echo "Aucun backup de logs"
    else
        echo "Aucun backup de logs"
    fi
    
    echo "=== Backups de configuration ==="
    if [ -d "$BACKUP_DIR/config" ]; then
        ls -lh "$BACKUP_DIR/config"/*.tar.gz 2>/dev/null || echo "Aucun backup de configuration"
    else
        echo "Aucun backup de configuration"
    fi
    
    echo "=== Backups Docker ==="
    if [ -d "$BACKUP_DIR/docker" ]; then
        ls -lh "$BACKUP_DIR/docker"/*.tar* 2>/dev/null || echo "Aucun backup Docker"
    else
        echo "Aucun backup Docker"
    fi
    
    echo "=== Backups complets ==="
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/complete_backup_*.tar.gz 2>/dev/null || echo "Aucun backup complet"
    else
        echo "Aucun backup complet"
    fi
}

# Fonction pour restaurer un backup
restore_backup() {
    local backup_file="$2"
    
    if [ -z "$backup_file" ]; then
        error "Fichier de backup non spécifié"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Fichier de backup non trouvé: $backup_file"
        exit 1
    fi
    
    log "Restauration du backup: $backup_file"
    
    # Déterminer le type de backup
    if [[ "$backup_file" == *"complete_backup"* ]]; then
        log "Restauration d'un backup complet..."
        tar -xzf "$backup_file" -C . || {
            error "Échec de la restauration du backup complet"
            exit 1
        }
    elif [[ "$backup_file" == *"source_code"* ]]; then
        log "Restauration du code source..."
        tar -xzf "$backup_file" -C . || {
            error "Échec de la restauration du code source"
            exit 1
        }
    elif [[ "$backup_file" == *"database"* ]]; then
        log "Restauration de la base de données..."
        if [ "${backup_file##*.}" = "gz" ]; then
            gunzip -c "$backup_file" | psql -d tuto_angular || {
                error "Échec de la restauration de la base de données"
                exit 1
            }
        else
            psql -d tuto_angular < "$backup_file" || {
                error "Échec de la restauration de la base de données"
                exit 1
            }
        fi
    elif [[ "$backup_file" == *"logs"* ]]; then
        log "Restauration des logs..."
        tar -xzf "$backup_file" -C . || {
            error "Échec de la restauration des logs"
            exit 1
        }
    elif [[ "$backup_file" == *"config"* ]]; then
        log "Restauration des configurations..."
        tar -xzf "$backup_file" -C . || {
            error "Échec de la restauration des configurations"
            exit 1
        }
    elif [[ "$backup_file" == *"docker"* ]]; then
        log "Restauration des images Docker..."
        if [ "${backup_file##*.}" = "gz" ]; then
            gunzip -c "$backup_file" | docker load || {
                error "Échec de la restauration des images Docker"
                exit 1
            }
        else
            docker load < "$backup_file" || {
                error "Échec de la restauration des images Docker"
                exit 1
            }
        fi
    else
        error "Type de backup non reconnu: $backup_file"
        exit 1
    fi
    
    success "Backup restauré avec succès: $backup_file"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [BACKUP_TYPE] [OPTIONS]"
    echo ""
    echo "Backup Types:"
    echo "  all         Tous les types de backup (défaut)"
    echo "  code        Code source seulement"
    echo "  database    Base de données seulement"
    echo "  logs        Logs seulement"
    echo "  config      Configurations seulement"
    echo "  docker      Images Docker seulement"
    echo "  complete    Backup complet"
    echo "  cleanup     Nettoyer les anciens backups"
    echo "  verify      Vérifier l'intégrité des backups"
    echo "  list        Lister les backups disponibles"
    echo "  restore     Restaurer un backup"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Options:"
    echo "  BACKUP_DIR     Répertoire de backup (défaut: backups)"
    echo "  RETENTION_DAYS Jours de rétention (défaut: 30)"
    echo "  COMPRESS       Compression (défaut: true)"
    echo ""
    echo "Examples:"
    echo "  $0 all"
    echo "  $0 code"
    echo "  $0 restore /path/to/backup.tar.gz"
    echo "  BACKUP_DIR=/custom/backup $0 all"
}

# Fonction principale
main() {
    case "$BACKUP_TYPE" in
        all)
            check_prerequisites
            create_directories
            backup_code
            backup_database
            backup_logs
            backup_config
            backup_docker
            cleanup_old_backups
            ;;
        code)
            check_prerequisites
            create_directories
            backup_code
            ;;
        database)
            check_prerequisites
            create_directories
            backup_database
            ;;
        logs)
            check_prerequisites
            create_directories
            backup_logs
            ;;
        config)
            check_prerequisites
            create_directories
            backup_config
            ;;
        docker)
            check_prerequisites
            create_directories
            backup_docker
            ;;
        complete)
            check_prerequisites
            create_directories
            backup_all
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        verify)
            verify_backups
            ;;
        list)
            list_backups
            ;;
        restore)
            restore_backup "$@"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Type de backup inconnu: $BACKUP_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
