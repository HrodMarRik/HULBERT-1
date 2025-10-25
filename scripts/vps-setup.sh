#!/bin/bash
# Script d'installation automatique VPS pour HULBERT-1
# Usage: ./vps-setup.sh

set -e

# Configuration
PROJECT_NAME="hulbert-1"
PROJECT_DIR="/opt/$PROJECT_NAME"
USER_NAME="hulbert"
REPO_URL="https://github.com/your-repo/HULBERT-1.git"

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
    
    # Vérifier que nous sommes root
    if [ "$EUID" -ne 0 ]; then
        log_error "Ce script doit être exécuté en tant que root"
        exit 1
    fi
    
    # Vérifier la distribution
    if [ -f /etc/debian_version ]; then
        DISTRO="debian"
        log_success "Distribution détectée: Debian"
    elif [ -f /etc/redhat-release ]; then
        DISTRO="redhat"
        log_success "Distribution détectée: RedHat/CentOS"
    else
        log_error "Distribution non supportée"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Fonction de mise à jour du système
update_system() {
    log_info "Mise à jour du système..."
    
    if [ "$DISTRO" = "debian" ]; then
        apt update && apt upgrade -y
    elif [ "$DISTRO" = "redhat" ]; then
        yum update -y
    fi
    
    log_success "Système mis à jour"
}

# Fonction d'installation des dépendances de base
install_basic_dependencies() {
    log_info "Installation des dépendances de base..."
    
    if [ "$DISTRO" = "debian" ]; then
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
            openssh-server \
            bc \
            net-tools \
            software-properties-common \
            apt-transport-https \
            ca-certificates \
            gnupg \
            lsb-release
    elif [ "$DISTRO" = "redhat" ]; then
        yum install -y \
            curl \
            wget \
            git \
            unzip \
            htop \
            nano \
            vim \
            firewalld \
            fail2ban \
            cronie \
            logrotate \
            rsync \
            openssh-server \
            bc \
            net-tools \
            yum-utils \
            device-mapper-persistent-data \
            lvm2
    fi
    
    log_success "Dépendances de base installées"
}

# Fonction d'installation de PostgreSQL
install_postgresql() {
    log_info "Installation de PostgreSQL..."
    
    if [ "$DISTRO" = "debian" ]; then
        # Ajouter le repository PostgreSQL officiel
        wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
        echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
        apt update
        apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15
    elif [ "$DISTRO" = "redhat" ]; then
        yum install -y postgresql15-server postgresql15
        postgresql-setup --initdb
    fi
    
    # Démarrer et activer PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    log_success "PostgreSQL installé"
}

# Fonction d'installation de Python
install_python() {
    log_info "Installation de Python 3.11..."
    
    if [ "$DISTRO" = "debian" ]; then
        apt install -y python3.11 python3.11-pip python3.11-venv python3.11-dev python3.11-distutils
        update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
        update-alternatives --install /usr/bin/pip3 pip3 /usr/bin/pip3 1
    elif [ "$DISTRO" = "redhat" ]; then
        yum install -y python3.11 python3.11-pip python3.11-devel
    fi
    
    log_success "Python installé"
}

# Fonction d'installation de Node.js
install_nodejs() {
    log_info "Installation de Node.js 20..."
    
    # Ajouter le repository NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    if [ "$DISTRO" = "debian" ]; then
        apt install -y nodejs
    elif [ "$DISTRO" = "redhat" ]; then
        yum install -y nodejs npm
    fi
    
    log_success "Node.js installé"
}

# Fonction d'installation de Docker
install_docker() {
    log_info "Installation de Docker..."
    
    # Installer Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Installer Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Démarrer et activer Docker
    systemctl start docker
    systemctl enable docker
    
    log_success "Docker installé"
}

# Fonction d'installation de Nginx
install_nginx() {
    log_info "Installation de Nginx..."
    
    if [ "$DISTRO" = "debian" ]; then
        apt install -y nginx
    elif [ "$DISTRO" = "redhat" ]; then
        yum install -y nginx
    fi
    
    # Démarrer et activer Nginx
    systemctl start nginx
    systemctl enable nginx
    
    log_success "Nginx installé"
}

# Fonction d'installation de Certbot
install_certbot() {
    log_info "Installation de Certbot..."
    
    if [ "$DISTRO" = "debian" ]; then
        apt install -y certbot python3-certbot-nginx
    elif [ "$DISTRO" = "redhat" ]; then
        yum install -y certbot python3-certbot-nginx
    fi
    
    log_success "Certbot installé"
}

# Fonction de configuration du firewall
configure_firewall() {
    log_info "Configuration du firewall..."
    
    if [ "$DISTRO" = "debian" ]; then
        # Configurer UFW
        ufw --force enable
        ufw default deny incoming
        ufw default allow outgoing
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
    elif [ "$DISTRO" = "redhat" ]; then
        # Configurer firewalld
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
    fi
    
    log_success "Firewall configuré"
}

# Fonction de configuration de fail2ban
configure_fail2ban() {
    log_info "Configuration de fail2ban..."
    
    # Créer la configuration fail2ban
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF
    
    # Démarrer et activer fail2ban
    systemctl start fail2ban
    systemctl enable fail2ban
    
    log_success "Fail2ban configuré"
}

# Fonction de création de l'utilisateur du projet
create_project_user() {
    log_info "Création de l'utilisateur du projet..."
    
    # Créer l'utilisateur s'il n'existe pas
    if ! id "$USER_NAME" &>/dev/null; then
        useradd -m -s /bin/bash "$USER_NAME"
        usermod -aG docker "$USER_NAME"
        usermod -aG sudo "$USER_NAME"
        log_success "Utilisateur $USER_NAME créé"
    else
        log_info "Utilisateur $USER_NAME existe déjà"
    fi
}

# Fonction de clonage du repository
clone_repository() {
    log_info "Clonage du repository..."
    
    # Créer le répertoire du projet
    mkdir -p "$PROJECT_DIR"
    
    # Cloner le repository
    git clone "$REPO_URL" "$PROJECT_DIR"
    
    # Changer les permissions
    chown -R "$USER_NAME:$USER_NAME" "$PROJECT_DIR"
    
    log_success "Repository cloné"
}

# Fonction de configuration de PostgreSQL
configure_postgresql() {
    log_info "Configuration de PostgreSQL..."
    
    # Créer la base de données et l'utilisateur
    sudo -u postgres psql << EOF
CREATE DATABASE hulbert_db;
CREATE USER hulbert WITH ENCRYPTED PASSWORD 'hulbert_password';
GRANT ALL PRIVILEGES ON DATABASE hulbert_db TO hulbert;
ALTER USER hulbert CREATEDB;
\q
EOF
    
    log_success "PostgreSQL configuré"
}

# Fonction de création des scripts de maintenance
create_maintenance_scripts() {
    log_info "Création des scripts de maintenance..."
    
    # Créer le répertoire des scripts
    mkdir -p "$PROJECT_DIR/scripts"
    
    # Rendre les scripts exécutables
    chmod +x "$PROJECT_DIR/scripts"/*.sh
    
    # Créer les tâches cron
    cat > /etc/cron.d/hulbert-maintenance << EOF
# Sauvegarde quotidienne à 2h du matin
0 2 * * * $USER_NAME $PROJECT_DIR/scripts/backup.sh

# Monitoring toutes les 5 minutes
*/5 * * * * $USER_NAME $PROJECT_DIR/scripts/monitor.sh

# Renouvellement SSL automatique
0 12 * * * root /usr/bin/certbot renew --quiet
EOF
    
    log_success "Scripts de maintenance créés"
}

# Fonction de configuration des logs
configure_logging() {
    log_info "Configuration des logs..."
    
    # Créer le répertoire des logs
    mkdir -p "$PROJECT_DIR/logs"
    chown -R "$USER_NAME:$USER_NAME" "$PROJECT_DIR/logs"
    
    # Configurer logrotate
    cat > /etc/logrotate.d/hulbert << EOF
$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER_NAME $USER_NAME
    postrotate
        systemctl reload nginx
    endscript
}
EOF
    
    log_success "Logs configurés"
}

# Fonction de génération du rapport d'installation
generate_installation_report() {
    log_info "Génération du rapport d'installation..."
    
    local report_file="$PROJECT_DIR/INSTALLATION_REPORT.txt"
    
    {
        echo "=== RAPPORT D'INSTALLATION HULBERT-1 ==="
        echo "Date: $(date)"
        echo "Serveur: $(hostname)"
        echo "Distribution: $DISTRO"
        echo "Utilisateur: $USER_NAME"
        echo "Répertoire: $PROJECT_DIR"
        echo ""
        echo "=== SERVICES INSTALLÉS ==="
        echo "PostgreSQL: $(systemctl is-active postgresql)"
        echo "Docker: $(systemctl is-active docker)"
        echo "Nginx: $(systemctl is-active nginx)"
        echo "Fail2ban: $(systemctl is-active fail2ban)"
        echo ""
        echo "=== VERSIONS ==="
        echo "Python: $(python3 --version)"
        echo "Node.js: $(node --version)"
        echo "Docker: $(docker --version)"
        echo "Docker Compose: $(docker-compose --version)"
        echo "PostgreSQL: $(psql --version)"
        echo ""
        echo "=== PROCHAINES ÉTAPES ==="
        echo "1. Configurer les variables d'environnement dans $PROJECT_DIR/.env"
        echo "2. Exécuter le déploiement: cd $PROJECT_DIR && ./scripts/deploy.sh"
        echo "3. Configurer SSL avec Certbot"
        echo "4. Vérifier le monitoring: $PROJECT_DIR/scripts/monitor.sh"
        echo ""
        echo "=== FIN DU RAPPORT ==="
    } > "$report_file"
    
    chown "$USER_NAME:$USER_NAME" "$report_file"
    
    log_success "Rapport d'installation généré: $report_file"
}

# Fonction principale
main() {
    log_info "🚀 Démarrage de l'installation VPS HULBERT-1"
    
    # Vérifier les prérequis
    check_prerequisites
    
    # Mettre à jour le système
    update_system
    
    # Installer les dépendances
    install_basic_dependencies
    install_postgresql
    install_python
    install_nodejs
    install_docker
    install_nginx
    install_certbot
    
    # Configurer les services
    configure_firewall
    configure_fail2ban
    configure_postgresql
    
    # Créer l'utilisateur et cloner le repository
    create_project_user
    clone_repository
    
    # Configurer la maintenance
    create_maintenance_scripts
    configure_logging
    
    # Générer le rapport
    generate_installation_report
    
    log_success "✅ Installation VPS terminée avec succès!"
    
    echo ""
    log_info "📋 Prochaines étapes:"
    echo "  1. Configurer les variables d'environnement:"
    echo "     nano $PROJECT_DIR/.env"
    echo ""
    echo "  2. Déployer l'application:"
    echo "     cd $PROJECT_DIR"
    echo "     ./scripts/deploy.sh"
    echo ""
    echo "  3. Configurer SSL (remplacer your-domain.com):"
    echo "     certbot --nginx -d your-domain.com -d www.your-domain.com"
    echo ""
    echo "  4. Vérifier le monitoring:"
    echo "     $PROJECT_DIR/scripts/monitor.sh"
    echo ""
    log_info "📊 Rapport d'installation: $PROJECT_DIR/INSTALLATION_REPORT.txt"
}

# Gestion des signaux
trap 'log_error "Installation interrompue"; exit 1' INT TERM

# Exécuter l'installation
main "$@"
