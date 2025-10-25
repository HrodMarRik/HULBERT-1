#!/bin/bash
# Script d'installation automatique VPS - HULBERT-1
# Compatible avec Debian 12 - Docker

set -e

# Configuration
PROJECT_NAME="hulbert-1"
PROJECT_USER="hulbert"
PROJECT_DIR="/opt/$PROJECT_NAME"
BACKUP_DIR="/opt/$PROJECT_NAME/backups"
LOG_DIR="/opt/$PROJECT_NAME/logs"

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

# Vérifier que le script est exécuté en tant que root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "Ce script doit être exécuté en tant que root"
        log_info "Utilisez: sudo $0"
        exit 1
    fi
}

# Mettre à jour le système
update_system() {
    log_info "Mise à jour du système..."
    
    apt update
    apt upgrade -y
    
    log_success "Système mis à jour"
}

# Installer les dépendances de base
install_base_dependencies() {
    log_info "Installation des dépendances de base..."
    
    apt install -y \
        curl \
        wget \
        git \
        unzip \
        htop \
        nano \
        vim \
        ufw \
        fail2ban \
        cron \
        logrotate \
        rsync \
        openssh-server
    
    log_success "Dépendances de base installées"
}

# Configurer le firewall
configure_firewall() {
    log_info "Configuration du firewall..."
    
    # Activer UFW
    ufw --force enable
    
    # Règles de base
    ufw default deny incoming
    ufw default allow outgoing
    
    # Ports essentiels
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw allow 8000/tcp  # Backend (si exposé)
    
    # Ports pour Docker (optionnel)
    ufw allow 5432/tcp  # PostgreSQL (si exposé)
    ufw allow 6379/tcp  # Redis (si exposé)
    
    log_success "Firewall configuré"
}

# Installer PostgreSQL
install_postgresql() {
    log_info "Installation de PostgreSQL..."
    
    # Installer PostgreSQL 15
    apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15
    
    # Démarrer et activer PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Créer la base de données et l'utilisateur
    sudo -u postgres psql << EOF
CREATE DATABASE hulbert_db;
CREATE USER hulbert WITH ENCRYPTED PASSWORD 'hulbert_password';
GRANT ALL PRIVILEGES ON DATABASE hulbert_db TO hulbert;
ALTER USER hulbert CREATEDB;
\q
EOF
    
    log_success "PostgreSQL installé et configuré"
}

# Installer Python 3.11
install_python() {
    log_info "Installation de Python 3.11..."
    
    # Installer Python 3.11 et pip
    apt install -y python3.11 python3.11-pip python3.11-venv python3.11-dev
    
    # Créer un lien symbolique pour python3
    ln -sf /usr/bin/python3.11 /usr/bin/python3
    
    # Installer pip
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
    
    log_success "Python 3.11 installé"
}

# Installer Node.js 20
install_nodejs() {
    log_info "Installation de Node.js 20..."
    
    # Ajouter le repository NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    # Installer Node.js
    apt install -y nodejs
    
    # Installer npm globalement
    npm install -g npm@latest
    
    log_success "Node.js 20 installé"
}

# Installer Nginx
install_nginx() {
    log_info "Installation de Nginx..."
    
    apt install -y nginx
    
    # Démarrer et activer Nginx
    systemctl start nginx
    systemctl enable nginx
    
    # Configuration de base
    cat > /etc/nginx/sites-available/hulbert << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Redirection vers HTTPS (à configurer après SSL)
    # return 301 https://$server_name$request_uri;
    
    # Configuration temporaire pour HTTP
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Servir les fichiers statiques du frontend
    location /static/ {
        alias /opt/hulbert-1/frontend/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Activer le site
    ln -sf /etc/nginx/sites-available/hulbert /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Tester la configuration
    nginx -t
    
    # Recharger Nginx
    systemctl reload nginx
    
    log_success "Nginx installé et configuré"
}

# Installer Certbot pour SSL
install_certbot() {
    log_info "Installation de Certbot..."
    
    apt install -y certbot python3-certbot-nginx
    
    log_success "Certbot installé"
}

# Créer l'utilisateur du projet
create_project_user() {
    log_info "Création de l'utilisateur du projet..."
    
    # Créer l'utilisateur
    useradd -m -s /bin/bash $PROJECT_USER
    
    # Ajouter l'utilisateur au groupe docker
    usermod -aG docker $PROJECT_USER
    
    # Créer les répertoires du projet
    mkdir -p $PROJECT_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    
    # Changer le propriétaire
    chown -R $PROJECT_USER:$PROJECT_USER $PROJECT_DIR
    
    log_success "Utilisateur du projet créé"
}

# Configurer Docker
configure_docker() {
    log_info "Configuration de Docker..."
    
    # Vérifier que Docker est installé
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Démarrer et activer Docker
    systemctl start docker
    systemctl enable docker
    
    # Configurer Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_info "Installation de Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    log_success "Docker configuré"
}

# Configurer les logs et la rotation
configure_logging() {
    log_info "Configuration des logs..."
    
    # Configuration de logrotate pour HULBERT-1
    cat > /etc/logrotate.d/hulbert << 'EOF'
/opt/hulbert-1/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 hulbert hulbert
    postrotate
        systemctl reload nginx
    endscript
}
EOF
    
    log_success "Logs configurés"
}

# Configurer les sauvegardes automatiques
configure_backups() {
    log_info "Configuration des sauvegardes automatiques..."
    
    # Script de sauvegarde
    cat > /opt/hulbert-1/backup.sh << 'EOF'
#!/bin/bash
# Script de sauvegarde HULBERT-1

BACKUP_DIR="/opt/hulbert-1/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hulbert_backup_$DATE.sql.gz"

# Sauvegarder la base de données
pg_dump -h localhost -U hulbert hulbert_db | gzip > "$BACKUP_FILE"

# Supprimer les sauvegardes anciennes (plus de 30 jours)
find "$BACKUP_DIR" -name "hulbert_backup_*.sql.gz" -mtime +30 -delete

echo "Sauvegarde créée: $BACKUP_FILE"
EOF
    
    chmod +x /opt/hulbert-1/backup.sh
    chown hulbert:hulbert /opt/hulbert-1/backup.sh
    
    # Ajouter à crontab (sauvegarde quotidienne à 2h du matin)
    (crontab -u hulbert -l 2>/dev/null; echo "0 2 * * * /opt/hulbert-1/backup.sh") | crontab -u hulbert -
    
    log_success "Sauvegardes automatiques configurées"
}

# Configurer le monitoring de base
configure_monitoring() {
    log_info "Configuration du monitoring de base..."
    
    # Script de monitoring
    cat > /opt/hulbert-1/monitor.sh << 'EOF'
#!/bin/bash
# Script de monitoring HULBERT-1

LOG_FILE="/opt/hulbert-1/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Vérifier Docker
if ! systemctl is-active --quiet docker; then
    echo "$DATE - ERREUR: Docker n'est pas actif" >> "$LOG_FILE"
    systemctl start docker
fi

# Vérifier PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    echo "$DATE - ERREUR: PostgreSQL n'est pas actif" >> "$LOG_FILE"
    systemctl start postgresql
fi

# Vérifier Nginx
if ! systemctl is-active --quiet nginx; then
    echo "$DATE - ERREUR: Nginx n'est pas actif" >> "$LOG_FILE"
    systemctl start nginx
fi

# Vérifier l'espace disque
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$DATE - ATTENTION: Espace disque à ${DISK_USAGE}%" >> "$LOG_FILE"
fi

# Vérifier la mémoire
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    echo "$DATE - ATTENTION: Mémoire utilisée à ${MEMORY_USAGE}%" >> "$LOG_FILE"
fi
EOF
    
    chmod +x /opt/hulbert-1/monitor.sh
    chown hulbert:hulbert /opt/hulbert-1/monitor.sh
    
    # Ajouter à crontab (vérification toutes les 5 minutes)
    (crontab -u hulbert -l 2>/dev/null; echo "*/5 * * * * /opt/hulbert-1/monitor.sh") | crontab -u hulbert -
    
    log_success "Monitoring de base configuré"
}

# Créer le script de déploiement
create_deployment_script() {
    log_info "Création du script de déploiement..."
    
    cat > /opt/hulbert-1/deploy.sh << 'EOF'
#!/bin/bash
# Script de déploiement HULBERT-1

set -e

PROJECT_DIR="/opt/hulbert-1"
BACKUP_DIR="/opt/hulbert-1/backups"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Fonction principale
main() {
    log_info "Démarrage du déploiement HULBERT-1..."
    
    cd "$PROJECT_DIR"
    
    # Créer une sauvegarde
    log_info "Création d'une sauvegarde..."
    ./backup.sh
    
    # Mettre à jour le code
    log_info "Mise à jour du code..."
    git pull origin main
    
    # Mettre à jour les images Docker
    log_info "Mise à jour des images Docker..."
    docker-compose -f docker/docker-compose.prod.yml pull
    
    # Déployer
    log_info "Déploiement..."
    docker-compose -f docker/docker-compose.prod.yml up -d
    
    # Exécuter les migrations
    log_info "Exécution des migrations..."
    docker-compose -f docker/docker-compose.prod.yml exec backend alembic upgrade head
    
    # Vérifier la santé
    log_info "Vérification de la santé..."
    sleep 30
    if curl -f http://localhost:8000/api/health; then
        log_success "Déploiement réussi!"
    else
        log_error "Échec du déploiement"
        exit 1
    fi
}

main "$@"
EOF
    
    chmod +x /opt/hulbert-1/deploy.sh
    chown hulbert:hulbert /opt/hulbert-1/deploy.sh
    
    log_success "Script de déploiement créé"
}

# Créer le script de rollback
create_rollback_script() {
    log_info "Création du script de rollback..."
    
    cat > /opt/hulbert-1/rollback.sh << 'EOF'
#!/bin/bash
# Script de rollback HULBERT-1

set -e

PROJECT_DIR="/opt/hulbert-1"
BACKUP_DIR="/opt/hulbert-1/backups"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Fonction principale
main() {
    log_info "Démarrage du rollback HULBERT-1..."
    
    cd "$PROJECT_DIR"
    
    # Trouver la dernière sauvegarde
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/hulbert_backup_*.sql.gz | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "Aucune sauvegarde trouvée"
        exit 1
    fi
    
    log_info "Utilisation de la sauvegarde: $LATEST_BACKUP"
    
    # Arrêter les services
    log_info "Arrêt des services..."
    docker-compose -f docker/docker-compose.prod.yml down
    
    # Restaurer la base de données
    log_info "Restauration de la base de données..."
    gunzip -c "$LATEST_BACKUP" | psql -h localhost -U hulbert hulbert_db
    
    # Redémarrer les services
    log_info "Redémarrage des services..."
    docker-compose -f docker/docker-compose.prod.yml up -d
    
    # Vérifier la santé
    log_info "Vérification de la santé..."
    sleep 30
    if curl -f http://localhost:8000/api/health; then
        log_success "Rollback réussi!"
    else
        log_error "Échec du rollback"
        exit 1
    fi
}

main "$@"
EOF
    
    chmod +x /opt/hulbert-1/rollback.sh
    chown hulbert:hulbert /opt/hulbert-1/rollback.sh
    
    log_success "Script de rollback créé"
}

# Configurer SSH
configure_ssh() {
    log_info "Configuration de SSH..."
    
    # Configuration SSH sécurisée
    cat > /etc/ssh/sshd_config.d/hulbert.conf << 'EOF'
# Configuration SSH pour HULBERT-1
Port 22
Protocol 2
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
EOF
    
    # Redémarrer SSH
    systemctl restart ssh
    
    log_success "SSH configuré"
}

# Afficher le résumé
show_summary() {
    log_info "=== RÉSUMÉ DE L'INSTALLATION ==="
    echo ""
    echo "✅ Système mis à jour"
    echo "✅ Dépendances de base installées"
    echo "✅ Firewall configuré"
    echo "✅ PostgreSQL 15 installé et configuré"
    echo "✅ Python 3.11 installé"
    echo "✅ Node.js 20 installé"
    echo "✅ Nginx installé et configuré"
    echo "✅ Certbot installé"
    echo "✅ Utilisateur du projet créé"
    echo "✅ Docker configuré"
    echo "✅ Logs configurés"
    echo "✅ Sauvegardes automatiques configurées"
    echo "✅ Monitoring de base configuré"
    echo "✅ Scripts de déploiement et rollback créés"
    echo "✅ SSH configuré"
    echo ""
    echo "📁 Répertoires créés:"
    echo "   - $PROJECT_DIR"
    echo "   - $BACKUP_DIR"
    echo "   - $LOG_DIR"
    echo ""
    echo "👤 Utilisateur créé: $PROJECT_USER"
    echo "🐳 Docker: Prêt à utiliser"
    echo "🗄️  PostgreSQL: hulbert_db créé"
    echo "🌐 Nginx: Configuré pour HULBERT-1"
    echo ""
    echo "🚀 Prochaines étapes:"
    echo "   1. Cloner le repository HULBERT-1 dans $PROJECT_DIR"
    echo "   2. Configurer les variables d'environnement"
    echo "   3. Exécuter le premier déploiement"
    echo "   4. Configurer SSL avec Certbot"
    echo ""
    echo "📋 Commandes utiles:"
    echo "   - Déploiement: sudo -u $PROJECT_USER $PROJECT_DIR/deploy.sh"
    echo "   - Rollback: sudo -u $PROJECT_USER $PROJECT_DIR/rollback.sh"
    echo "   - Sauvegarde: sudo -u $PROJECT_USER $PROJECT_DIR/backup.sh"
    echo "   - Monitoring: sudo -u $PROJECT_USER $PROJECT_DIR/monitor.sh"
    echo ""
    log_success "Installation terminée avec succès!"
}

# Fonction principale
main() {
    log_info "Démarrage de l'installation VPS HULBERT-1..."
    log_info "OS: Debian 12 - Docker"
    log_info "Projet: $PROJECT_NAME"
    
    check_root
    update_system
    install_base_dependencies
    configure_firewall
    install_postgresql
    install_python
    install_nodejs
    install_nginx
    install_certbot
    create_project_user
    configure_docker
    configure_logging
    configure_backups
    configure_monitoring
    create_deployment_script
    create_rollback_script
    configure_ssh
    show_summary
}

# Exécuter l'installation
main "$@"
