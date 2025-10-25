#!/bin/bash
# Script de monitoring HULBERT-1
# Usage: ./monitor.sh [options]

set -e

# Configuration
PROJECT_NAME="hulbert-1"
LOG_DIR="/opt/$PROJECT_NAME/logs"
ALERT_EMAIL="admin@hulbert.com"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=80
THRESHOLD_DISK=85
CHECK_INTERVAL=300  # 5 minutes

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

# Fonction de vérification des conteneurs Docker
check_containers() {
    log_info "Vérification des conteneurs Docker..."
    
    local issues=0
    
    # Vérifier que tous les conteneurs sont en cours d'exécution
    local containers=("hulbert-postgres" "hulbert-redis" "hulbert-backend" "hulbert-frontend" "hulbert-nginx")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            log_success "Conteneur $container: OK"
        else
            log_error "Conteneur $container: ARRÊTÉ"
            ((issues++))
        fi
    done
    
    return $issues
}

# Fonction de vérification de la santé des services
check_health() {
    log_info "Vérification de la santé des services..."
    
    local issues=0
    
    # Vérifier le backend
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        log_success "Backend API: OK"
    else
        log_error "Backend API: ÉCHEC"
        ((issues++))
    fi
    
    # Vérifier le frontend
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "Frontend: OK"
    else
        log_error "Frontend: ÉCHEC"
        ((issues++))
    fi
    
    # Vérifier PostgreSQL
    if docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U hulbert > /dev/null 2>&1; then
        log_success "PostgreSQL: OK"
    else
        log_error "PostgreSQL: ÉCHEC"
        ((issues++))
    fi
    
    # Vérifier Redis
    if docker-compose -f docker-compose.prod.yml exec redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis: OK"
    else
        log_error "Redis: ÉCHEC"
        ((issues++))
    fi
    
    return $issues
}

# Fonction de vérification des ressources système
check_resources() {
    log_info "Vérification des ressources système..."
    
    local issues=0
    
    # Vérifier l'utilisation CPU
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$cpu_usage > $THRESHOLD_CPU" | bc -l) )); then
        log_warning "CPU: ${cpu_usage}% (seuil: ${THRESHOLD_CPU}%)"
        ((issues++))
    else
        log_success "CPU: ${cpu_usage}%"
    fi
    
    # Vérifier l'utilisation mémoire
    local memory_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ "$memory_usage" -gt "$THRESHOLD_MEMORY" ]; then
        log_warning "Mémoire: ${memory_usage}% (seuil: ${THRESHOLD_MEMORY}%)"
        ((issues++))
    else
        log_success "Mémoire: ${memory_usage}%"
    fi
    
    # Vérifier l'utilisation disque
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt "$THRESHOLD_DISK" ]; then
        log_warning "Disque: ${disk_usage}% (seuil: ${THRESHOLD_DISK}%)"
        ((issues++))
    else
        log_success "Disque: ${disk_usage}%"
    fi
    
    return $issues
}

# Fonction de vérification des logs d'erreur
check_logs() {
    log_info "Vérification des logs d'erreur..."
    
    local issues=0
    
    # Vérifier les logs Docker
    local error_count=$(docker-compose -f docker-compose.prod.yml logs --tail=100 2>&1 | grep -i "error\|exception\|failed" | wc -l)
    
    if [ "$error_count" -gt 0 ]; then
        log_warning "$error_count erreurs trouvées dans les logs Docker"
        ((issues++))
    else
        log_success "Aucune erreur dans les logs Docker"
    fi
    
    # Vérifier les logs système
    local system_errors=$(journalctl --since "1 hour ago" --priority=err --no-pager | wc -l)
    
    if [ "$system_errors" -gt 0 ]; then
        log_warning "$system_errors erreurs système dans la dernière heure"
        ((issues++))
    else
        log_success "Aucune erreur système récente"
    fi
    
    return $issues
}

# Fonction de vérification de la connectivité réseau
check_network() {
    log_info "Vérification de la connectivité réseau..."
    
    local issues=0
    
    # Vérifier la connectivité Internet
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        log_success "Connectivité Internet: OK"
    else
        log_error "Connectivité Internet: ÉCHEC"
        ((issues++))
    fi
    
    # Vérifier les ports ouverts
    local ports=("80" "443" "8000" "5432" "6379")
    
    for port in "${ports[@]}"; do
        if netstat -tlnp | grep -q ":$port "; then
            log_success "Port $port: OUVERT"
        else
            log_error "Port $port: FERMÉ"
            ((issues++))
        fi
    done
    
    return $issues
}

# Fonction de vérification des sauvegardes
check_backups() {
    log_info "Vérification des sauvegardes..."
    
    local issues=0
    local backup_dir="/opt/$PROJECT_NAME/backups"
    
    if [ -d "$backup_dir" ]; then
        # Vérifier qu'il y a des sauvegardes récentes (moins de 24h)
        local recent_backups=$(find "$backup_dir" -name "hulbert_db_*.sql.gz" -mtime -1 | wc -l)
        
        if [ "$recent_backups" -gt 0 ]; then
            log_success "$recent_backups sauvegardes récentes trouvées"
        else
            log_warning "Aucune sauvegarde récente (dernières 24h)"
            ((issues++))
        fi
        
        # Vérifier l'espace disque des sauvegardes
        local backup_size=$(du -sh "$backup_dir" | cut -f1)
        log_info "Taille des sauvegardes: $backup_size"
    else
        log_error "Répertoire de sauvegarde introuvable: $backup_dir"
        ((issues++))
    fi
    
    return $issues
}

# Fonction d'envoi d'alerte
send_alert() {
    local message=$1
    local severity=$2
    
    log_error "ALERTE $severity: $message"
    
    # Ici vous pouvez ajouter l'envoi d'email, Slack, etc.
    # Exemple avec curl pour Slack:
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"🚨 ALERTE HULBERT-1: $message\"}" \
    #     "$SLACK_WEBHOOK_URL"
    
    # Exemple avec email:
    # echo "$message" | mail -s "ALERTE HULBERT-1 - $severity" "$ALERT_EMAIL"
}

# Fonction de génération du rapport
generate_report() {
    local total_issues=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local report_file="$LOG_DIR/monitor_report_$timestamp.log"
    
    {
        echo "=== RAPPORT DE MONITORING HULBERT-1 ==="
        echo "Date: $(date)"
        echo "Serveur: $(hostname)"
        echo "Problèmes détectés: $total_issues"
        echo ""
        echo "=== ÉTAT DES CONTENEURS ==="
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "=== RESSOURCES SYSTÈME ==="
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
        echo "Mémoire: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
        echo "Disque: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
        echo ""
        echo "=== CONNECTIVITÉ ==="
        netstat -tlnp | grep -E ":(80|443|8000|5432|6379) "
        echo ""
        echo "=== FIN DU RAPPORT ==="
    } > "$report_file"
    
    log_info "Rapport généré: $report_file"
}

# Fonction de monitoring continu
monitor_continuous() {
    log_info "Démarrage du monitoring continu (intervalle: ${CHECK_INTERVAL}s)"
    
    while true; do
        local total_issues=0
        
        echo ""
        log_info "=== VÉRIFICATION $(date) ==="
        
        # Vérifier les conteneurs
        if ! check_containers; then
            ((total_issues++))
        fi
        
        # Vérifier la santé des services
        if ! check_health; then
            ((total_issues++))
        fi
        
        # Vérifier les ressources
        if ! check_resources; then
            ((total_issues++))
        fi
        
        # Vérifier les logs
        if ! check_logs; then
            ((total_issues++))
        fi
        
        # Vérifier le réseau
        if ! check_network; then
            ((total_issues++))
        fi
        
        # Vérifier les sauvegardes
        if ! check_backups; then
            ((total_issues++))
        fi
        
        # Générer le rapport
        generate_report $total_issues
        
        # Envoyer une alerte si nécessaire
        if [ $total_issues -gt 0 ]; then
            send_alert "$total_issues problèmes détectés" "WARNING"
        fi
        
        log_info "Prochaine vérification dans ${CHECK_INTERVAL} secondes..."
        sleep $CHECK_INTERVAL
    done
}

# Fonction principale
main() {
    local mode=${1:-single}
    
    log_info "🔍 Démarrage du monitoring HULBERT-1"
    log_info "Mode: $mode"
    
    # Créer le répertoire de logs s'il n'existe pas
    mkdir -p "$LOG_DIR"
    
    if [ "$mode" = "continuous" ]; then
        monitor_continuous
    else
        local total_issues=0
        
        # Vérifier les conteneurs
        if ! check_containers; then
            ((total_issues++))
        fi
        
        # Vérifier la santé des services
        if ! check_health; then
            ((total_issues++))
        fi
        
        # Vérifier les ressources
        if ! check_resources; then
            ((total_issues++))
        fi
        
        # Vérifier les logs
        if ! check_logs; then
            ((total_issues++))
        fi
        
        # Vérifier le réseau
        if ! check_network; then
            ((total_issues++))
        fi
        
        # Vérifier les sauvegardes
        if ! check_backups; then
            ((total_issues++))
        fi
        
        # Générer le rapport
        generate_report $total_issues
        
        if [ $total_issues -eq 0 ]; then
            log_success "✅ Tous les systèmes sont opérationnels"
        else
            log_warning "⚠️  $total_issues problèmes détectés"
            send_alert "$total_issues problèmes détectés" "WARNING"
        fi
    fi
}

# Gestion des signaux
trap 'log_info "Monitoring arrêté"; exit 0' INT TERM

# Exécuter le monitoring
main "$@"
