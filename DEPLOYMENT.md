# Guide de Déploiement HULBERT-1

## 🎯 VPS Recommandé

### Spécifications Minimales
- **CPU**: 2 vCPU
- **RAM**: 4 GB
- **Storage**: 40 GB SSD
- **Network**: 1 Gbps
- **OS**: Debian 12 - Docker (recommandé)

### Spécifications Optimales
- **CPU**: 4 vCPU
- **RAM**: 8 GB
- **Storage**: 80 GB SSD
- **Network**: 1 Gbps
- **OS**: Debian 12 - Docker

### Spécifications Production
- **CPU**: 8 vCPU
- **RAM**: 16 GB
- **Storage**: 160 GB SSD
- **Network**: 1 Gbps
- **OS**: Debian 12 - Docker

## 🚀 Installation Automatique

### Script d'Installation VPS

```bash
# Se connecter au VPS
ssh root@your-vps-ip

# Télécharger et exécuter le script d'installation
wget https://raw.githubusercontent.com/your-repo/HULBERT-1/main/ci-cd/scripts/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh
```

Le script installe automatiquement :
- PostgreSQL 15
- Python 3.11
- Node.js 20
- Nginx
- Docker & Docker Compose
- Certbot (SSL)
- Configuration firewall (UFW)
- Scripts de maintenance

## 🔧 Configuration Manuelle

### 1. Prérequis Système

```bash
# Mise à jour
apt update && apt upgrade -y

# Installation des dépendances
apt install -y curl wget git unzip htop nano vim ufw fail2ban cron logrotate rsync openssh-server

# Installation PostgreSQL
apt install -y postgresql-15 postgresql-client-15 postgresql-contrib-15

# Installation Python
apt install -y python3.11 python3.11-pip python3.11-venv python3.11-dev

# Installation Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installation Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 2. Configuration PostgreSQL

```bash
# Créer la base de données et l'utilisateur
sudo -u postgres psql << EOF
CREATE DATABASE hulbert_db;
CREATE USER hulbert WITH ENCRYPTED PASSWORD 'hulbert_password';
GRANT ALL PRIVILEGES ON DATABASE hulbert_db TO hulbert;
ALTER USER hulbert CREATEDB;
\q
EOF
```

### 3. Configuration Firewall

```bash
# Activer UFW
ufw --force enable

# Règles de base
ufw default deny incoming
ufw default allow outgoing

# Ports essentiels
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5432/tcp  # PostgreSQL (si exposé)
```

## 🐳 Déploiement avec Docker

### 1. Cloner le Repository

```bash
# Créer l'utilisateur du projet
useradd -m -s /bin/bash hulbert
usermod -aG docker hulbert

# Cloner le repository
sudo -u hulbert git clone https://github.com/your-repo/HULBERT-1.git /opt/hulbert-1
cd /opt/hulbert-1
```

### 2. Configuration des Variables d'Environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer avec vos valeurs
nano .env
```

Variables importantes à configurer :
```bash
# Base de données
DATABASE_URL="postgresql://hulbert:hulbert_password@postgres:5432/hulbert_db"
DB_PASSWORD=hulbert_password

# Sécurité
JWT_SECRET=your-production-secret-key-change-this

# Domaine
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Feature Flags (garder false pour l'optimisation)
FEATURE_RSS_READER=false
FEATURE_EMAIL_CAMPAIGNS=false
# etc.
```

### 3. Premier Déploiement

```bash
# Construire et démarrer les conteneurs
docker-compose -f docker-compose.prod.yml up -d

# Vérifier les logs
docker-compose logs -f

# Exécuter les migrations
docker-compose exec backend alembic upgrade head

# Vérifier la santé
curl -f http://localhost/api/health
```

## 🔒 Configuration SSL

### 1. Obtenir un Certificat SSL

```bash
# Arrêter temporairement Nginx
docker-compose stop nginx

# Obtenir le certificat
certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copier les certificats
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem

# Redémarrer Nginx
docker-compose up -d nginx
```

### 2. Renouvellement Automatique

```bash
# Ajouter à crontab
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

## 📊 Monitoring et Maintenance

### Scripts de Maintenance

Le script d'installation crée automatiquement :

#### Script de Sauvegarde (`/opt/hulbert-1/backup.sh`)
```bash
#!/bin/bash
BACKUP_DIR="/opt/hulbert-1/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hulbert_backup_$DATE.sql.gz"

# Sauvegarder la base de données
docker exec hulbert-postgres pg_dump -U hulbert hulbert_db | gzip > "$BACKUP_FILE"

# Supprimer les sauvegardes anciennes (plus de 30 jours)
find "$BACKUP_DIR" -name "hulbert_backup_*.sql.gz" -mtime +30 -delete

echo "Sauvegarde créée: $BACKUP_FILE"
```

#### Script de Monitoring (`/opt/hulbert-1/monitor.sh`)
```bash
#!/bin/bash
LOG_FILE="/opt/hulbert-1/logs/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Vérifier Docker
if ! docker ps | grep -q hulbert-backend; then
    echo "$DATE - ERREUR: Backend n'est pas actif" >> "$LOG_FILE"
fi

# Vérifier PostgreSQL
if ! docker ps | grep -q hulbert-postgres; then
    echo "$DATE - ERREUR: PostgreSQL n'est pas actif" >> "$LOG_FILE"
fi

# Vérifier l'espace disque
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "$DATE - ATTENTION: Espace disque à ${DISK_USAGE}%" >> "$LOG_FILE"
fi
```

#### Script de Déploiement (`/opt/hulbert-1/deploy.sh`)
```bash
#!/bin/bash
cd /opt/hulbert-1

# Créer une sauvegarde
./backup.sh

# Mettre à jour le code
git pull origin main

# Mettre à jour les images Docker
docker-compose -f docker-compose.prod.yml pull

# Déployer
docker-compose -f docker-compose.prod.yml up -d

# Exécuter les migrations
docker-compose exec backend alembic upgrade head

# Vérifier la santé
sleep 30
curl -f http://localhost/api/health || exit 1

echo "Déploiement réussi!"
```

### Configuration des Tâches Cron

```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/hulbert-1/backup.sh

# Monitoring toutes les 5 minutes
*/5 * * * * /opt/hulbert-1/monitor.sh

# Renouvellement SSL automatique
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Commandes Utiles

### Gestion des Services

```bash
# Vérifier le statut des conteneurs
docker ps

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Redémarrer les services
docker-compose restart backend
docker-compose restart frontend

# Mettre à jour les images
docker-compose pull
docker-compose up -d
```

### Gestion de la Base de Données

```bash
# Se connecter à PostgreSQL
docker exec -it hulbert-postgres psql -U hulbert hulbert_db

# Sauvegarder la base de données
docker exec hulbert-postgres pg_dump -U hulbert hulbert_db > backup.sql

# Restaurer la base de données
docker exec -i hulbert-postgres psql -U hulbert hulbert_db < backup.sql

# Exécuter les migrations
docker-compose exec backend alembic upgrade head
```

### Monitoring

```bash
# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h

# Vérifier les processus
htop

# Vérifier les logs système
journalctl -u docker -f
```

## 🚨 Dépannage

### Problèmes Courants

#### Conteneurs ne démarrent pas
```bash
# Vérifier les logs
docker-compose logs backend
docker-compose logs frontend

# Vérifier les ressources
docker system df
docker system prune -f
```

#### Base de données inaccessible
```bash
# Vérifier la connexion
docker exec hulbert-postgres pg_isready -U hulbert

# Vérifier les logs PostgreSQL
docker logs hulbert-postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
```

#### SSL ne fonctionne pas
```bash
# Vérifier les certificats
ls -la ./ssl/

# Tester SSL
openssl s_client -connect your-domain.com:443

# Renouveler les certificats
certbot renew --force-renewal
```

### Commandes de Diagnostic

```bash
# Santé générale
curl -f http://localhost/api/health
curl -f http://localhost/health

# Vérifier les ports
netstat -tlnp | grep :80
netstat -tlnp | grep :443
netstat -tlnp | grep :8000

# Vérifier les processus Docker
docker ps -a
docker images
```

## 📈 Optimisation

### Performance

```bash
# Optimiser PostgreSQL
# Éditer docker-compose.prod.yml
environment:
  POSTGRES_SHARED_BUFFERS: 256MB
  POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
  POSTGRES_WORK_MEM: 4MB
```

### Sécurité

```bash
# Configurer fail2ban
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
EOF

systemctl restart fail2ban
```

## ✅ Checklist de Déploiement

### Avant le Déploiement
- [ ] VPS configuré avec Debian 12 - Docker
- [ ] Script d'installation exécuté
- [ ] Utilisateur du projet créé
- [ ] PostgreSQL configuré
- [ ] Firewall configuré
- [ ] Domaine pointant vers le VPS

### Pendant le Déploiement
- [ ] Repository cloné
- [ ] Variables d'environnement configurées
- [ ] Conteneurs Docker démarrés
- [ ] Migrations exécutées
- [ ] Tests de santé passés

### Après le Déploiement
- [ ] Application accessible via HTTPS
- [ ] SSL configuré et fonctionnel
- [ ] Sauvegardes automatiques configurées
- [ ] Monitoring configuré
- [ ] Scripts de maintenance créés
- [ ] Documentation mise à jour

## 📞 Support

Pour toute question sur le déploiement :
1. Consulter ce guide
2. Vérifier les logs : `docker-compose logs -f`
3. Vérifier les conteneurs : `docker ps`
4. Vérifier la santé : `curl -f http://localhost/api/health`
5. Utiliser le rollback : `./rollback.sh`

---

**Dernière mise à jour** : 2025-10-25  
**Version** : 1.0.0  
**OS Supporté** : Debian 12 - Docker
