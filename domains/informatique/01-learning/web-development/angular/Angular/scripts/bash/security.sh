#!/bin/bash

# Script de sécurité pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SECURITY_TYPE=${1:-all}
SECURITY_DIR=${SECURITY_DIR:-"security"}
LOG_FILE=${LOG_FILE:-"security.log"}

# Fonction pour afficher les messages
log() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis de sécurité..."
    
    if ! command -v nmap >/dev/null 2>&1; then
        warning "nmap n'est pas installé. Certaines vérifications de sécurité seront limitées."
    fi
    
    if ! command -v openssl >/dev/null 2>&1; then
        warning "OpenSSL n'est pas installé. Certaines vérifications de sécurité seront limitées."
    fi
    
    if ! command -v docker >/dev/null 2>&1; then
        warning "Docker n'est pas installé. Certaines vérifications de sécurité seront limitées."
    fi
    
    success "Prérequis de sécurité vérifiés!"
}

# Fonction pour créer les répertoires nécessaires
create_directories() {
    log "Création des répertoires nécessaires..."
    
    mkdir -p "$SECURITY_DIR"
    mkdir -p "$SECURITY_DIR/scans"
    mkdir -p "$SECURITY_DIR/reports"
    mkdir -p "$SECURITY_DIR/certificates"
    mkdir -p "$SECURITY_DIR/keys"
    mkdir -p "$SECURITY_DIR/policies"
    
    success "Répertoires créés!"
}

# Fonction pour scanner les ports ouverts
scan_ports() {
    log "Scan des ports ouverts..."
    
    local scan_file="$SECURITY_DIR/scans/port_scan_$(date +%Y%m%d_%H%M%S).txt"
    
    if command -v nmap >/dev/null 2>&1; then
        nmap -sS -O -sV localhost > "$scan_file" 2>&1 || {
            error "Échec du scan des ports"
            return 1
        }
        
        success "Scan des ports terminé: $scan_file"
    else
        warning "nmap n'est pas installé. Scan des ports ignoré."
    fi
}

# Fonction pour vérifier les certificats SSL
check_ssl_certificates() {
    log "Vérification des certificats SSL..."
    
    local cert_file="$SECURITY_DIR/reports/ssl_certificates_$(date +%Y%m%d_%H%M%S).txt"
    
    if command -v openssl >/dev/null 2>&1; then
        # Vérifier les certificats locaux
        find . -name "*.crt" -o -name "*.pem" -o -name "*.key" | while read -r cert; do
            echo "=== $cert ===" >> "$cert_file"
            openssl x509 -in "$cert" -text -noout >> "$cert_file" 2>&1 || true
            echo "" >> "$cert_file"
        done
        
        success "Vérification des certificats SSL terminée: $cert_file"
    else
        warning "OpenSSL n'est pas installé. Vérification des certificats SSL ignorée."
    fi
}

# Fonction pour vérifier les vulnérabilités Docker
check_docker_security() {
    log "Vérification de la sécurité Docker..."
    
    local docker_file="$SECURITY_DIR/reports/docker_security_$(date +%Y%m%d_%H%M%S).txt"
    
    if command -v docker >/dev/null 2>&1; then
        # Vérifier les images Docker
        docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" > "$docker_file" 2>&1
        
        # Vérifier les conteneurs en cours d'exécution
        echo "=== Conteneurs en cours d'exécution ===" >> "$docker_file"
        docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" >> "$docker_file" 2>&1
        
        # Vérifier les volumes
        echo "=== Volumes Docker ===" >> "$docker_file"
        docker volume ls >> "$docker_file" 2>&1
        
        # Vérifier les réseaux
        echo "=== Réseaux Docker ===" >> "$docker_file"
        docker network ls >> "$docker_file" 2>&1
        
        success "Vérification de la sécurité Docker terminée: $docker_file"
    else
        warning "Docker n'est pas installé. Vérification de la sécurité Docker ignorée."
    fi
}

# Fonction pour vérifier les permissions des fichiers
check_file_permissions() {
    log "Vérification des permissions des fichiers..."
    
    local perm_file="$SECURITY_DIR/reports/file_permissions_$(date +%Y%m%d_%H%M%S).txt"
    
    # Vérifier les fichiers avec des permissions trop permissives
    find . -type f -perm 777 -o -perm 666 -o -perm 644 | while read -r file; do
        echo "$file" >> "$perm_file"
    done
    
    # Vérifier les fichiers avec des permissions d'exécution
    find . -type f -perm +111 | while read -r file; do
        echo "$file" >> "$perm_file"
    done
    
    success "Vérification des permissions des fichiers terminée: $perm_file"
}

# Fonction pour vérifier les mots de passe faibles
check_weak_passwords() {
    log "Vérification des mots de passe faibles..."
    
    local password_file="$SECURITY_DIR/reports/weak_passwords_$(date +%Y%m%d_%H%M%S).txt"
    
    # Rechercher les mots de passe dans les fichiers de configuration
    grep -r -i "password\|passwd\|pwd" . --include="*.env" --include="*.conf" --include="*.config" --include="*.json" --include="*.yaml" --include="*.yml" 2>/dev/null | while read -r line; do
        echo "$line" >> "$password_file"
    done
    
    success "Vérification des mots de passe faibles terminée: $password_file"
}

# Fonction pour vérifier les dépendances vulnérables
check_vulnerable_dependencies() {
    log "Vérification des dépendances vulnérables..."
    
    local deps_file="$SECURITY_DIR/reports/vulnerable_dependencies_$(date +%Y%m%d_%H%M%S).txt"
    
    # Vérifier les dépendances npm
    if [ -f "package.json" ]; then
        echo "=== Dépendances npm ===" >> "$deps_file"
        npm audit --json >> "$deps_file" 2>&1 || true
    fi
    
    # Vérifier les dépendances Python
    if [ -f "requirements.txt" ]; then
        echo "=== Dépendances Python ===" >> "$deps_file"
        pip-audit >> "$deps_file" 2>&1 || true
    fi
    
    success "Vérification des dépendances vulnérables terminée: $deps_file"
}

# Fonction pour générer un rapport de sécurité
generate_security_report() {
    log "Génération du rapport de sécurité..."
    
    local report_file="$SECURITY_DIR/reports/security_report_$(date +%Y%m%d_%H%M%S).txt"
    
    echo "=== Rapport de sécurité ===" > "$report_file"
    echo "Date: $(date)" >> "$report_file"
    echo "Utilisateur: $(whoami)" >> "$report_file"
    echo "Système: $(uname -a)" >> "$report_file"
    echo "" >> "$report_file"
    
    # Résumé des vérifications
    echo "=== Résumé des vérifications ===" >> "$report_file"
    echo "Scan des ports: $(ls -1 "$SECURITY_DIR/scans"/*.txt 2>/dev/null | wc -l) fichiers" >> "$report_file"
    echo "Certificats SSL: $(ls -1 "$SECURITY_DIR/reports"/*ssl_certificates*.txt 2>/dev/null | wc -l) fichiers" >> "$report_file"
    echo "Sécurité Docker: $(ls -1 "$SECURITY_DIR/reports"/*docker_security*.txt 2>/dev/null | wc -l) fichiers" >> "$report_file"
    echo "Permissions fichiers: $(ls -1 "$SECURITY_DIR/reports"/*file_permissions*.txt 2>/dev/null | wc -l) fichiers" >> "$report_file"
    echo "Mots de passe faibles: $(ls -1 "$SECURITY_DIR/reports"/*weak_passwords*.txt 2>/dev/null | wc -l) fichiers" >> "$report_file"
    echo "Dépendances vulnérables: $(ls -1 "$SECURITY_DIR/reports"/*vulnerable_dependencies*.txt 2>/dev/null | wc -l) fichiers" >> "$report_file"
    echo "" >> "$report_file"
    
    # Recommandations
    echo "=== Recommandations ===" >> "$report_file"
    echo "1. Mettre à jour régulièrement les dépendances" >> "$report_file"
    echo "2. Utiliser des mots de passe forts" >> "$report_file"
    echo "3. Configurer correctement les permissions des fichiers" >> "$report_file"
    echo "4. Surveiller les ports ouverts" >> "$report_file"
    echo "5. Maintenir les certificats SSL à jour" >> "$report_file"
    echo "6. Surveiller les conteneurs Docker" >> "$report_file"
    echo "" >> "$report_file"
    
    success "Rapport de sécurité généré: $report_file"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [SECURITY_TYPE] [OPTIONS]"
    echo ""
    echo "Security Types:"
    echo "  all         Toutes les vérifications de sécurité (défaut)"
    echo "  ports       Scan des ports ouverts"
    echo "  ssl         Vérification des certificats SSL"
    echo "  docker      Vérification de la sécurité Docker"
    echo "  permissions Vérification des permissions des fichiers"
    echo "  passwords   Vérification des mots de passe faibles"
    echo "  dependencies Vérification des dépendances vulnérables"
    echo "  report      Génération du rapport de sécurité"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Options:"
    echo "  SECURITY_DIR Répertoire de sécurité (défaut: security)"
    echo "  LOG_FILE     Fichier de log (défaut: security.log)"
    echo ""
    echo "Examples:"
    echo "  $0 all"
    echo "  $0 ports"
    echo "  SECURITY_DIR=/custom/security $0 all"
}

# Fonction principale
main() {
    case "$SECURITY_TYPE" in
        all)
            check_prerequisites
            create_directories
            scan_ports
            check_ssl_certificates
            check_docker_security
            check_file_permissions
            check_weak_passwords
            check_vulnerable_dependencies
            generate_security_report
            ;;
        ports)
            check_prerequisites
            create_directories
            scan_ports
            ;;
        ssl)
            check_prerequisites
            create_directories
            check_ssl_certificates
            ;;
        docker)
            check_prerequisites
            create_directories
            check_docker_security
            ;;
        permissions)
            check_prerequisites
            create_directories
            check_file_permissions
            ;;
        passwords)
            check_prerequisites
            create_directories
            check_weak_passwords
            ;;
        dependencies)
            check_prerequisites
            create_directories
            check_vulnerable_dependencies
            ;;
        report)
            generate_security_report
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Type de vérification de sécurité inconnu: $SECURITY_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
