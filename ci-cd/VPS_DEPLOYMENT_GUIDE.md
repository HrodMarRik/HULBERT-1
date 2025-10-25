# 🚀 Guide de Déploiement VPS - HULBERT-1

## 📋 Recommandation OS

### ✅ **Debian 12 - Docker** (Recommandé)

**Pourquoi Debian 12 - Docker ?**
- **Docker pré-installé** : Plus besoin d'installer Docker manuellement
- **Docker Compose inclus** : Parfait pour votre `docker-compose.prod.yml`
- **Optimisé pour les conteneurs** : Performance optimale pour votre stack
- **PostgreSQL** : Support natif et optimisé
- **Python 3.11** : Disponible dans les repos officiels
- **Node.js 20** : Installation facile via NodeSource
- **Nginx** : Configuration optimale pour votre reverse proxy
- **Léger et rapide** : Moins de ressources système utilisées
- **Stable** : Debian est réputé pour sa stabilité
- **Sécurisé** : Mises à jour de sécurité régulières

---

## 🖥️ Configuration VPS Recommandée

### **Spécifications Minimales**
```bash
CPU: 2 vCPU
RAM: 4 GB
Storage: 40 GB SSD
Network: 1 Gbps
OS: Debian 12 - Docker
```

### **Spécifications Optimales**
```bash
CPU: 4 vCPU
RAM: 8 GB
Storage: 80 GB SSD
Network: 1 Gbps
OS: Debian 12 - Docker
```

### **Spécifications pour Production**
```bash
CPU: 8 vCPU
RAM: 16 GB
Storage: 160 GB SSD
Network: 1 Gbps
OS: Debian 12 - Docker
```

---

## 🚀 Installation Automatique

### **1. Télécharger le Script d'Installation**

```bash
# Se connecter au VPS
ssh root@your-vps-ip

# Télécharger le script
wget https://raw.githubusercontent.com/your-repo/HULBERT-1/main/ci-cd/scripts/vps-setup.sh

# Rendre le script exécutable
chmod +x vps-setup.sh

# Exécuter l'installation
./vps-setup.sh
```

### **2. Installation Manuelle (Alternative)**

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Installer les dépendances
apt install -y curl wget git unzip htop nano vim ufw fail2ban cron logrotate rsync openssh-server

# Installer PostgreSQL 15
apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Installer Python 3.11
apt install -y python3.11 python3.11-pip python3.11-venv python3.11-dev

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installer Nginx
apt install -y nginx

# Installer Certbot
apt install -y certbot python3-certbot-nginx

# Configurer le firewall
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 8000/tcp # Backend
```

---

## 🔧 Configuration Post-Installation

### **1. Créer l'Utilisateur du Projet**

```bash
# Créer l'utilisateur
useradd -m -s /bin/bash hulbert

# Ajouter au groupe docker
usermod -aG docker hulbert

# Créer les répertoires
mkdir -p /opt/hulbert-1
mkdir -p /opt/hulbert-1/backups
mkdir -p /opt/hulbert-1/logs

# Changer le propriétaire
chown -R hulbert:hulbert /opt/hulbert-1
```

### **2. Configurer PostgreSQL**

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur
CREATE DATABASE hulbert_db;
CREATE USER hulbert WITH ENCRYPTED PASSWORD 'hulbert_password';
GRANT ALL PRIVILEGES ON DATABASE hulbert_db TO hulbert;
ALTER USER hulbert CREATEDB;
\q
```

### **3. Configurer Nginx**

```bash
# Créer la configuration
cat > /etc/nginx/sites-available/hulbert << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirection vers HTTPS (après SSL)
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
```

---

## 🐳 Déploiement avec Docker

### **1. Cloner le Repository**

```bash
# Se connecter en tant qu'utilisateur hulbert
sudo -u hulbert -i

# Aller dans le répertoire du projet
cd /opt/hulbert-1

# Cloner le repository
git clone https://github.com/your-repo/HULBERT-1.git .

# Changer le propriétaire
sudo chown -R hulbert:hulbert /opt/hulbert-1
```

### **2. Configurer les Variables d'Environnement**

```bash
# Créer le fichier .env
cat > .env << 'EOF'
# Core Settings
ENVIRONMENT=production
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
DOMAINS_ROOT=../domains
JWT_SECRET=your-production-secret-key

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://hulbert:hulbert_password@localhost:5432/hulbert_db"
DATABASE_URL_ASYNC="postgresql+asyncpg://hulbert:hulbert_password@localhost:5432/hulbert_db"
TEST_DATABASE_URL="postgresql://hulbert:hulbert_password@localhost:5432/hulbert_test_db"

# Feature Flags
FEATURE_RSS_READER=false
FEATURE_EMAIL_CAMPAIGNS=false
FEATURE_EMAIL_SECURITY=false
FEATURE_PORTFOLIO_CMS=false
FEATURE_BUSINESS_PLAN=false
FEATURE_AGENTS=false
FEATURE_DIAGRAMS=false
FEATURE_CODE_LIBRARY=false
FEATURE_FILE_MANAGER=false
FEATURE_WISHLIST=false
FEATURE_DOMAINS=false
FEATURE_PORTFOLIO_MANAGEMENT=false

# Company Info
COMPANY_NAME="Votre Entreprise"
COMPANY_ADDRESS="123 Rue de la Paix"
COMPANY_CITY="Paris"
COMPANY_POSTAL_CODE="75001"
COMPANY_SIRET="12345678901234"
COMPANY_VAT_NUMBER="FR12345678901"
COMPANY_NAF_CODE="6201Z"
COMPANY_PHONE="+33 1 23 45 67 89"
COMPANY_EMAIL="contact@entreprise.fr"
COMPANY_WEBSITE="https://www.entreprise.fr"
COMPANY_LOGO_PATH=

# Accounting Settings
DEFAULT_CURRENCY=EUR
FISCAL_YEAR_START_MONTH=1
DECIMAL_PLACES=2
AUTO_CREATE_ACCOUNTING_ENTRIES=true
REQUIRE_ACCOUNTING_ENTRY_VALIDATION=true

# Payroll Settings
DEFAULT_WORK_HOURS_PER_WEEK=35.0
PMSS_2024=13284.00
SMALL_COMPANY_THRESHOLD=20
AUTO_CALCULATE_PAYSLIPS=true
REQUIRE_PAYSLIP_VALIDATION=true

# Invoicing Settings
DEFAULT_PAYMENT_TERMS="Net 30 jours"
DEFAULT_QUOTE_VALIDITY_DAYS=30
AUTO_GENERATE_INVOICE_NUMBERS=true
INVOICE_NUMBER_PREFIX=INV
QUOTE_NUMBER_PREFIX=QUO
DEFAULT_TAX_RATE=20.0
INCLUDE_LOGO_IN_PDFS=true

# Social Declarations Settings
DSN_SUBMISSION_DEADLINE_DAYS=5
AUTO_GENERATE_DSN=false
DSN_XML_SCHEMA_VALIDATION=true
EOF
```

### **3. Premier Déploiement**

```bash
# Construire et démarrer les conteneurs
docker-compose -f docker/docker-compose.prod.yml up -d

# Exécuter les migrations
docker-compose -f docker/docker-compose.prod.yml exec backend alembic upgrade head

# Vérifier la santé
curl -f http://localhost:8000/api/health
```

---

## 🔒 Configuration SSL avec Certbot

### **1. Obtenir un Certificat SSL**

```bash
# Obtenir le certificat SSL
certbot --nginx -d your-domain.com -d www.your-domain.com

# Tester le renouvellement automatique
certbot renew --dry-run
```

### **2. Configurer le Renouvellement Automatique**

```bash
# Ajouter à crontab
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

### **3. Mettre à Jour la Configuration Nginx**

```bash
# La configuration SSL sera automatiquement ajoutée par Certbot
# Vérifier la configuration
nginx -t

# Recharger Nginx
systemctl reload nginx
```

---

## 📊 Monitoring et Maintenance

### **1. Scripts de Maintenance Créés**

#### **Script de Sauvegarde**
```bash
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
```

#### **Script de Monitoring**
```bash
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
```

#### **Script de Déploiement**
```bash
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
```

#### **Script de Rollback**
```bash
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
```

### **2. Configuration des Tâches Cron**

```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/hulbert-1/backup.sh

# Monitoring toutes les 5 minutes
*/5 * * * * /opt/hulbert-1/monitor.sh

# Renouvellement SSL automatique
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 Commandes Utiles

### **Gestion des Services**

```bash
# Vérifier le statut des services
systemctl status docker
systemctl status postgresql
systemctl status nginx

# Démarrer/arrêter/redémarrer les services
systemctl start docker
systemctl stop docker
systemctl restart docker

# Vérifier les logs
journalctl -u docker -f
journalctl -u postgresql -f
journalctl -u nginx -f
```

### **Gestion Docker**

```bash
# Voir les conteneurs
docker ps

# Voir les logs
docker logs hulbert-backend
docker logs hulbert-frontend

# Redémarrer les conteneurs
docker-compose -f docker/docker-compose.prod.yml restart

# Mettre à jour les images
docker-compose -f docker/docker-compose.prod.yml pull

# Nettoyer les ressources
docker system prune -f
```

### **Gestion de la Base de Données**

```bash
# Se connecter à PostgreSQL
psql -h localhost -U hulbert hulbert_db

# Sauvegarder la base de données
pg_dump -h localhost -U hulbert hulbert_db > backup.sql

# Restaurer la base de données
psql -h localhost -U hulbert hulbert_db < backup.sql

# Voir les bases de données
sudo -u postgres psql -l
```

### **Gestion des Logs**

```bash
# Voir les logs du projet
tail -f /opt/hulbert-1/logs/monitor.log

# Voir les logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Voir les logs PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 🚨 Dépannage

### **Problèmes Courants**

#### **Docker ne démarre pas**
```bash
# Vérifier le statut
systemctl status docker

# Redémarrer Docker
systemctl restart docker

# Vérifier les logs
journalctl -u docker -f
```

#### **PostgreSQL ne démarre pas**
```bash
# Vérifier le statut
systemctl status postgresql

# Redémarrer PostgreSQL
systemctl restart postgresql

# Vérifier les logs
journalctl -u postgresql -f
```

#### **Nginx ne démarre pas**
```bash
# Tester la configuration
nginx -t

# Vérifier les logs
journalctl -u nginx -f

# Redémarrer Nginx
systemctl restart nginx
```

#### **Application non accessible**
```bash
# Vérifier les conteneurs
docker ps

# Vérifier les logs des conteneurs
docker logs hulbert-backend
docker logs hulbert-frontend

# Vérifier la santé de l'API
curl -f http://localhost:8000/api/health

# Vérifier Nginx
curl -f http://localhost/
```

### **Commandes de Diagnostic**

```bash
# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h

# Vérifier les processus
htop

# Vérifier les ports ouverts
netstat -tlnp

# Vérifier les connexions réseau
ss -tlnp
```

---

## 📈 Optimisation

### **Performance**

```bash
# Optimiser PostgreSQL
# Éditer /etc/postgresql/15/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Optimiser Nginx
# Éditer /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;
```

### **Sécurité**

```bash
# Configurer fail2ban
# Éditer /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

# Configurer UFW
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
```

---

## 🎯 Checklist de Déploiement

### **Avant le Déploiement**
- [ ] VPS configuré avec Debian 12 - Docker
- [ ] Script d'installation exécuté
- [ ] Utilisateur du projet créé
- [ ] PostgreSQL configuré
- [ ] Nginx configuré
- [ ] Firewall configuré
- [ ] SSL configuré (optionnel)

### **Pendant le Déploiement**
- [ ] Repository cloné
- [ ] Variables d'environnement configurées
- [ ] Conteneurs Docker démarrés
- [ ] Migrations exécutées
- [ ] Tests de santé passés

### **Après le Déploiement**
- [ ] Application accessible
- [ ] SSL configuré
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring configuré
- [ ] Scripts de maintenance créés
- [ ] Documentation mise à jour

---

## 📞 Support

Pour toute question sur le déploiement VPS :
1. Consulter ce guide
2. Vérifier les logs : `journalctl -u service-name -f`
3. Vérifier les conteneurs : `docker ps`
4. Vérifier la santé : `curl -f http://localhost:8000/api/health`
5. Utiliser le rollback : `./rollback.sh`

---

**Dernière mise à jour** : 2025-10-25  
**Version** : 1.0.0  
**OS Supporté** : Debian 12 - Docker
