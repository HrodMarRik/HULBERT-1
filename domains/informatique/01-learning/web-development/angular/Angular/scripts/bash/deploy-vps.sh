#!/bin/bash

# Script de déploiement automatisé sur VPS privé
# Usage: ./deploy-vps.sh [environment] [server-ip]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SERVER_IP=${2:-""}
SSH_USER=${SSH_USER:-"root"}
SSH_PORT=${SSH_PORT:-22}
APP_NAME=${APP_NAME:-"tuto-angular-ntier"}
DOMAIN=${DOMAIN:-""}

# Répertoires
LOCAL_DIR=$(pwd)
REMOTE_DIR="/opt/$APP_NAME"
BACKUP_DIR="/opt/backups/$APP_NAME"

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
    log "Vérification des prérequis de déploiement..."
    
    # Vérifier SSH
    if ! command -v ssh >/dev/null 2>&1; then
        error "SSH n'est pas installé"
        exit 1
    fi
    
    # Vérifier rsync
    if ! command -v rsync >/dev/null 2>&1; then
        error "rsync n'est pas installé"
        exit 1
    fi
    
    # Vérifier Docker
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker n'est pas installé localement"
        exit 1
    fi
    
    # Vérifier Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        error "Docker Compose n'est pas installé localement"
        exit 1
    fi
    
    # Vérifier l'IP du serveur
    if [ -z "$SERVER_IP" ]; then
        error "Adresse IP du serveur non spécifiée"
        echo "Usage: $0 [environment] [server-ip]"
        exit 1
    fi
    
    success "Prérequis vérifiés!"
}

# Fonction pour tester la connexion SSH
test_ssh_connection() {
    log "Test de la connexion SSH vers $SERVER_IP..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SSH_PORT $SSH_USER@$SERVER_IP "echo 'Connexion SSH OK'" >/dev/null 2>&1; then
        success "Connexion SSH établie!"
    else
        error "Impossible de se connecter au serveur $SERVER_IP"
        echo "Vérifiez :"
        echo "  - L'adresse IP du serveur"
        echo "  - Les clés SSH"
        echo "  - Le port SSH ($SSH_PORT)"
        echo "  - L'utilisateur SSH ($SSH_USER)"
        exit 1
    fi
}

# Fonction pour préparer le serveur distant
prepare_remote_server() {
    log "Préparation du serveur distant..."
    
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << 'EOF'
        # Mise à jour du système
        apt update && apt upgrade -y
        
        # Installation des dépendances
        apt install -y curl wget git nginx certbot python3-certbot-nginx
        
        # Installation de Docker
        if ! command -v docker >/dev/null 2>&1; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            usermod -aG docker $USER
        fi
        
        # Installation de Docker Compose
        if ! command -v docker-compose >/dev/null 2>&1; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # Création des répertoires
        mkdir -p /opt/backups
        mkdir -p /opt/ssl
        mkdir -p /var/log/nginx
        
        # Configuration du pare-feu
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        
        echo "Serveur préparé avec succès!"
EOF
    
    success "Serveur distant préparé!"
}

# Fonction pour créer un backup avant déploiement
create_backup() {
    log "Création d'un backup avant déploiement..."
    
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << EOF
        if [ -d "$REMOTE_DIR" ]; then
            BACKUP_NAME="backup_\$(date +%Y%m%d_%H%M%S)"
            tar -czf "$BACKUP_DIR/\$BACKUP_NAME.tar.gz" -C "$REMOTE_DIR" .
            echo "Backup créé: \$BACKUP_NAME.tar.gz"
        else
            echo "Aucun déploiement précédent trouvé"
        fi
EOF
    
    success "Backup créé!"
}

# Fonction pour construire l'application localement
build_application() {
    log "Construction de l'application..."
    
    # Build Angular
    if [ -d "Angular/Tuto-Angular" ]; then
        log "Construction du frontend Angular..."
        cd Angular/Tuto-Angular
        npm install
        npm run build --prod
        cd ../..
    fi
    
    # Build Docker images
    log "Construction des images Docker..."
    docker-compose build
    
    success "Application construite!"
}

# Fonction pour déployer sur le serveur
deploy_to_server() {
    log "Déploiement sur le serveur $SERVER_IP..."
    
    # Créer le répertoire distant
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"
    
    # Synchroniser les fichiers
    log "Synchronisation des fichiers..."
    rsync -avz --delete \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='dist' \
        --exclude='venv' \
        --exclude='__pycache__' \
        -e "ssh -p $SSH_PORT" \
        $LOCAL_DIR/ $SSH_USER@$SERVER_IP:$REMOTE_DIR/
    
    # Copier les fichiers de configuration spécifiques à l'environnement
    if [ -f "docker-compose.prod.yml" ]; then
        ssh -p $SSH_PORT $SSH_USER@$SERVER_IP "cp $REMOTE_DIR/docker-compose.prod.yml $REMOTE_DIR/docker-compose.yml"
    fi
    
    success "Fichiers synchronisés!"
}

# Fonction pour configurer l'environnement de production
configure_production() {
    log "Configuration de l'environnement de production..."
    
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << EOF
        cd $REMOTE_DIR
        
        # Configuration des variables d'environnement
        cat > .env << 'ENVEOF'
# Configuration de production
NODE_ENV=production
API_URL=https://$DOMAIN/api/v1
DATABASE_URL=postgresql://postgres:secure_password@db:5432/tuto_angular
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuration Docker
POSTGRES_DB=tuto_angular
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
ENVEOF
        
        # Configuration Nginx
        cat > nginx.conf << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirection HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # Configuration SSL
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend Angular
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
NGINXEOF
        
        echo "Configuration de production créée!"
EOF
    
    success "Environnement de production configuré!"
}

# Fonction pour démarrer les services
start_services() {
    log "Démarrage des services..."
    
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << EOF
        cd $REMOTE_DIR
        
        # Arrêter les services existants
        docker-compose down || true
        
        # Démarrer les services
        docker-compose up -d
        
        # Attendre que les services soient prêts
        sleep 30
        
        # Vérifier le statut
        docker-compose ps
        
        echo "Services démarrés!"
EOF
    
    success "Services démarrés!"
}

# Fonction pour configurer SSL avec Let's Encrypt
setup_ssl() {
    if [ -n "$DOMAIN" ]; then
        log "Configuration SSL avec Let's Encrypt..."
        
        ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << EOF
            # Arrêter temporairement Nginx
            docker-compose stop nginx
            
            # Obtenir le certificat SSL
            certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
            
            # Redémarrer Nginx avec SSL
            docker-compose up -d nginx
            
            # Configurer le renouvellement automatique
            echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
            
            echo "SSL configuré pour $DOMAIN!"
EOF
        
        success "SSL configuré!"
    else
        warning "Domaine non spécifié, SSL ignoré"
    fi
}

# Fonction pour vérifier le déploiement
verify_deployment() {
    log "Vérification du déploiement..."
    
    # Vérifier les conteneurs
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP "cd $REMOTE_DIR && docker-compose ps"
    
    # Vérifier les logs
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP "cd $REMOTE_DIR && docker-compose logs --tail=20"
    
    # Test de connectivité
    if [ -n "$DOMAIN" ]; then
        log "Test de connectivité sur https://$DOMAIN"
        if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
            success "Application accessible sur https://$DOMAIN"
        else
            warning "Application non accessible, vérifiez les logs"
        fi
    fi
    
    success "Vérification terminée!"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [environment] [server-ip] [options]"
    echo ""
    echo "Arguments:"
    echo "  environment    Environnement de déploiement (production, staging)"
    echo "  server-ip      Adresse IP du serveur VPS"
    echo ""
    echo "Variables d'environnement:"
    echo "  SSH_USER       Utilisateur SSH (défaut: root)"
    echo "  SSH_PORT       Port SSH (défaut: 22)"
    echo "  APP_NAME       Nom de l'application (défaut: tuto-angular-ntier)"
    echo "  DOMAIN         Domaine pour SSL (optionnel)"
    echo ""
    echo "Examples:"
    echo "  $0 production 192.168.1.100"
    echo "  DOMAIN=monapp.com $0 production 192.168.1.100"
    echo "  SSH_USER=ubuntu $0 production 192.168.1.100"
}

# Fonction principale
main() {
    case "${1:-help}" in
        help|--help|-h)
            show_help
            ;;
        *)
            check_prerequisites
            test_ssh_connection
            prepare_remote_server
            create_backup
            build_application
            deploy_to_server
            configure_production
            start_services
            setup_ssl
            verify_deployment
            
            success "Déploiement terminé avec succès!"
            echo ""
            echo "🌐 Application accessible sur:"
            if [ -n "$DOMAIN" ]; then
                echo "   https://$DOMAIN"
            else
                echo "   http://$SERVER_IP"
            fi
            echo ""
            echo "📊 Monitoring:"
            echo "   ssh $SSH_USER@$SERVER_IP 'cd $REMOTE_DIR && docker-compose logs -f'"
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
