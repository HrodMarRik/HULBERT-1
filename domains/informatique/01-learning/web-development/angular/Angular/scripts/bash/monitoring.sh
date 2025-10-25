#!/bin/bash

# Script de monitoring pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITORING_TYPE=${1:-all}
INTERVAL=${2:-60}
LOG_FILE=${LOG_FILE:-"logs/monitoring.log"}
ALERT_EMAIL=${ALERT_EMAIL:-""}

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
    log "Vérification des prérequis de monitoring..."
    
    if ! command -v curl >/dev/null 2>&1; then
        error "curl n'est pas installé. Veuillez l'installer."
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        warning "jq n'est pas installé. Le parsing JSON sera limité."
    fi
    
    if ! command -v mail >/dev/null 2>&1; then
        warning "mail n'est pas installé. Les alertes par email seront ignorées."
    fi
    
    success "Prérequis de monitoring vérifiés!"
}

# Fonction pour créer les répertoires nécessaires
create_directories() {
    log "Création des répertoires nécessaires..."
    
    mkdir -p logs
    mkdir -p alerts
    
    success "Répertoires créés!"
}

# Fonction pour vérifier la santé du frontend
check_frontend_health() {
    log "Vérification de la santé du frontend..."
    
    local frontend_url="http://localhost:4200"
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$frontend_url" || echo "000")
    
    if [ "$response_code" = "200" ]; then
        success "Frontend accessible (HTTP $response_code)"
        return 0
    else
        error "Frontend non accessible (HTTP $response_code)"
        return 1
    fi
}

# Fonction pour vérifier la santé du backend
check_backend_health() {
    log "Vérification de la santé du backend..."
    
    local backend_url="http://localhost:8000/health"
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$backend_url" || echo "000")
    
    if [ "$response_code" = "200" ]; then
        success "Backend accessible (HTTP $response_code)"
        return 0
    else
        error "Backend non accessible (HTTP $response_code)"
        return 1
    fi
}

# Fonction pour vérifier la santé de la base de données
check_database_health() {
    log "Vérification de la santé de la base de données..."
    
    if ! command -v psql >/dev/null 2>&1; then
        warning "PostgreSQL n'est pas installé. Vérification de la base de données ignorée."
        return 0
    fi
    
    if psql -d tuto_angular -c "SELECT 1;" >/dev/null 2>&1; then
        success "Base de données accessible"
        return 0
    else
        error "Base de données non accessible"
        return 1
    fi
}

# Fonction pour vérifier les services Docker
check_docker_services() {
    log "Vérification des services Docker..."
    
    if ! command -v docker >/dev/null 2>&1; then
        warning "Docker n'est pas installé. Vérification des services Docker ignorée."
        return 0
    fi
    
    local running_containers=$(docker ps --format "{{.Names}}" | wc -l)
    
    if [ "$running_containers" -gt 0 ]; then
        success "Services Docker en cours d'exécution ($running_containers conteneurs)"
        return 0
    else
        warning "Aucun service Docker en cours d'exécution"
        return 1
    fi
}

# Fonction pour surveiller les performances système
monitor_system_performance() {
    log "Surveillance des performances système..."
    
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    log "Utilisation CPU: ${cpu_usage}%"
    log "Utilisation mémoire: ${memory_usage}%"
    log "Utilisation disque: ${disk_usage}%"
    
    # Vérifier les seuils d'alerte
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        warning "Utilisation CPU élevée: ${cpu_usage}%"
        send_alert "CPU" "Utilisation CPU élevée: ${cpu_usage}%"
    fi
    
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        warning "Utilisation mémoire élevée: ${memory_usage}%"
        send_alert "Mémoire" "Utilisation mémoire élevée: ${memory_usage}%"
    fi
    
    if [ "$disk_usage" -gt 80 ]; then
        warning "Utilisation disque élevée: ${disk_usage}%"
        send_alert "Disque" "Utilisation disque élevée: ${disk_usage}%"
    fi
}

# Fonction pour surveiller les performances de l'application
monitor_application_performance() {
    log "Surveillance des performances de l'application..."
    
    # Temps de réponse du frontend
    local frontend_response_time=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:4200 || echo "0")
    log "Temps de réponse frontend: ${frontend_response_time}s"
    
    # Temps de réponse du backend
    local backend_response_time=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:8000/health || echo "0")
    log "Temps de réponse backend: ${backend_response_time}s"
    
    # Vérifier les seuils d'alerte
    if (( $(echo "$frontend_response_time > 5" | bc -l) )); then
        warning "Temps de réponse frontend élevé: ${frontend_response_time}s"
        send_alert "Performance" "Temps de réponse frontend élevé: ${frontend_response_time}s"
    fi
    
    if (( $(echo "$backend_response_time > 2" | bc -l) )); then
        warning "Temps de réponse backend élevé: ${backend_response_time}s"
        send_alert "Performance" "Temps de réponse backend élevé: ${backend_response_time}s"
    fi
}

# Fonction pour surveiller les logs d'erreur
monitor_error_logs() {
    log "Surveillance des logs d'erreur..."
    
    local error_count=0
    
    # Compter les erreurs dans les logs
    if [ -d "Angular/Tuto-Angular/logs" ]; then
        error_count=$((error_count + $(grep -c "ERROR\|FATAL" Angular/Tuto-Angular/logs/*.log 2>/dev/null || echo "0")))
    fi
    
    if [ -d "Angular/Tuto-Angular/backend/logs" ]; then
        error_count=$((error_count + $(grep -c "ERROR\|FATAL" Angular/Tuto-Angular/backend/logs/*.log 2>/dev/null || echo "0")))
    fi
    
    if [ "$error_count" -gt 0 ]; then
        warning "Erreurs détectées dans les logs: $error_count"
        send_alert "Logs" "Erreurs détectées dans les logs: $error_count"
    else
        success "Aucune erreur dans les logs"
    fi
}

# Fonction pour surveiller l'espace disque
monitor_disk_space() {
    log "Surveillance de l'espace disque..."
    
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    local available_space=$(df / | tail -1 | awk '{print $4}')
    
    log "Espace disque utilisé: ${disk_usage}%"
    log "Espace disque disponible: ${available_space}KB"
    
    if [ "$disk_usage" -gt 90 ]; then
        error "Espace disque critique: ${disk_usage}%"
        send_alert "Disque" "Espace disque critique: ${disk_usage}%"
    elif [ "$disk_usage" -gt 80 ]; then
        warning "Espace disque faible: ${disk_usage}%"
        send_alert "Disque" "Espace disque faible: ${disk_usage}%"
    fi
}

# Fonction pour surveiller la mémoire
monitor_memory() {
    log "Surveillance de la mémoire..."
    
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local available_memory=$(free | grep Mem | awk '{print $7}')
    
    log "Mémoire utilisée: ${memory_usage}%"
    log "Mémoire disponible: ${available_memory}KB"
    
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        error "Mémoire critique: ${memory_usage}%"
        send_alert "Mémoire" "Mémoire critique: ${memory_usage}%"
    elif (( $(echo "$memory_usage > 80" | bc -l) )); then
        warning "Mémoire faible: ${memory_usage}%"
        send_alert "Mémoire" "Mémoire faible: ${memory_usage}%"
    fi
}

# Fonction pour surveiller le CPU
monitor_cpu() {
    log "Surveillance du CPU..."
    
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local load_average=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | cut -d',' -f1)
    
    log "Utilisation CPU: ${cpu_usage}%"
    log "Charge moyenne: ${load_average}"
    
    if (( $(echo "$cpu_usage > 90" | bc -l) )); then
        error "CPU critique: ${cpu_usage}%"
        send_alert "CPU" "CPU critique: ${cpu_usage}%"
    elif (( $(echo "$cpu_usage > 80" | bc -l) )); then
        warning "CPU élevé: ${cpu_usage}%"
        send_alert "CPU" "CPU élevé: ${cpu_usage}%"
    fi
}

# Fonction pour surveiller les processus
monitor_processes() {
    log "Surveillance des processus..."
    
    local process_count=$(ps aux | wc -l)
    local zombie_count=$(ps aux | grep -c "<defunct>" || echo "0")
    
    log "Nombre de processus: $process_count"
    log "Processus zombies: $zombie_count"
    
    if [ "$zombie_count" -gt 0 ]; then
        warning "Processus zombies détectés: $zombie_count"
        send_alert "Processus" "Processus zombies détectés: $zombie_count"
    fi
}

# Fonction pour surveiller les connexions réseau
monitor_network() {
    log "Surveillance des connexions réseau..."
    
    local established_connections=$(netstat -an | grep -c ESTABLISHED || echo "0")
    local listening_ports=$(netstat -an | grep -c LISTEN || echo "0")
    
    log "Connexions établies: $established_connections"
    log "Ports en écoute: $listening_ports"
    
    # Vérifier les ports critiques
    local critical_ports=("80" "443" "8000" "4200" "5432")
    
    for port in "${critical_ports[@]}"; do
        if ! netstat -an | grep -q ":$port "; then
            warning "Port critique non accessible: $port"
            send_alert "Réseau" "Port critique non accessible: $port"
        fi
    done
}

# Fonction pour envoyer une alerte
send_alert() {
    local alert_type="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Enregistrer l'alerte dans le fichier de log
    echo "[$timestamp] ALERTE [$alert_type]: $message" >> "$LOG_FILE"
    
    # Envoyer l'alerte par email si configuré
    if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        echo "Alerte de monitoring - $timestamp" | mail -s "[ALERTE] $alert_type" "$ALERT_EMAIL" << EOF
Type d'alerte: $alert_type
Message: $message
Timestamp: $timestamp
Serveur: $(hostname)
EOF
    fi
    
    # Enregistrer l'alerte dans un fichier séparé
    echo "[$timestamp] $alert_type: $message" >> "alerts/alerts.log"
}

# Fonction pour générer un rapport de monitoring
generate_monitoring_report() {
    log "Génération du rapport de monitoring..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="logs/monitoring_report_$timestamp.txt"
    
    cat > "$report_file" << EOF
Rapport de monitoring - Tuto Angular n-tier
Généré le: $(date)
Type de monitoring: $MONITORING_TYPE

=== Santé des services ===
Frontend: $(check_frontend_health && echo "OK" || echo "ERREUR")
Backend: $(check_backend_health && echo "OK" || echo "ERREUR")
Base de données: $(check_database_health && echo "OK" || echo "ERREUR")
Services Docker: $(check_docker_services && echo "OK" || echo "ERREUR")

=== Performances système ===
CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%
Mémoire: $(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')%
Disque: $(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)%

=== Performances application ===
Temps de réponse frontend: $(curl -s -o /dev/null -w "%{time_total}" http://localhost:4200 || echo "0")s
Temps de réponse backend: $(curl -s -o /dev/null -w "%{time_total}" http://localhost:8000/health || echo "0")s

=== Connexions réseau ===
Connexions établies: $(netstat -an | grep -c ESTABLISHED || echo "0")
Ports en écoute: $(netstat -an | grep -c LISTEN || echo "0")

=== Processus ===
Nombre de processus: $(ps aux | wc -l)
Processus zombies: $(ps aux | grep -c "<defunct>" || echo "0")

=== Logs d'erreur ===
Erreurs récentes: $(grep -c "ERROR\|FATAL" Angular/Tuto-Angular/logs/*.log 2>/dev/null || echo "0")

=== Alertes récentes ===
$(tail -20 alerts/alerts.log 2>/dev/null || echo "Aucune alerte récente")
EOF
    
    success "Rapport de monitoring généré: $report_file"
}

# Fonction pour démarrer le monitoring continu
start_continuous_monitoring() {
    log "Démarrage du monitoring continu (intervalle: ${INTERVAL}s)..."
    
    while true; do
        log "=== Cycle de monitoring $(date) ==="
        
        case "$MONITORING_TYPE" in
            all)
                check_frontend_health
                check_backend_health
                check_database_health
                check_docker_services
                monitor_system_performance
                monitor_application_performance
                monitor_error_logs
                monitor_disk_space
                monitor_memory
                monitor_cpu
                monitor_processes
                monitor_network
                ;;
            health)
                check_frontend_health
                check_backend_health
                check_database_health
                check_docker_services
                ;;
            performance)
                monitor_system_performance
                monitor_application_performance
                ;;
            resources)
                monitor_disk_space
                monitor_memory
                monitor_cpu
                ;;
            network)
                monitor_network
                ;;
            logs)
                monitor_error_logs
                ;;
            *)
                error "Type de monitoring inconnu: $MONITORING_TYPE"
                exit 1
                ;;
        esac
        
        log "Attente de ${INTERVAL}s avant le prochain cycle..."
        sleep "$INTERVAL"
    done
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [MONITORING_TYPE] [INTERVAL]"
    echo ""
    echo "Monitoring Types:"
    echo "  all         Tous les types de monitoring (défaut)"
    echo "  health      Santé des services seulement"
    echo "  performance Performances système et application"
    echo "  resources   Ressources système (CPU, mémoire, disque)"
    echo "  network     Connexions réseau"
    echo "  logs        Logs d'erreur"
    echo "  report      Générer un rapport de monitoring"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Parameters:"
    echo "  INTERVAL    Intervalle en secondes pour le monitoring continu (défaut: 60)"
    echo ""
    echo "Environment Variables:"
    echo "  LOG_FILE    Fichier de log (défaut: logs/monitoring.log)"
    echo "  ALERT_EMAIL Adresse email pour les alertes"
    echo ""
    echo "Examples:"
    echo "  $0 all 30"
    echo "  $0 health"
    echo "  ALERT_EMAIL=admin@example.com $0 all"
}

# Fonction principale
main() {
    case "$MONITORING_TYPE" in
        all|health|performance|resources|network|logs)
            check_prerequisites
            create_directories
            start_continuous_monitoring
            ;;
        report)
            check_prerequisites
            create_directories
            generate_monitoring_report
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Type de monitoring inconnu: $MONITORING_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
