# Guide de Déploiement Automatisé sur VPS Privé

## 🚀 Vue d'Ensemble

Ce guide vous explique comment déployer automatiquement votre application Angular n-tier sur un VPS privé en utilisant les scripts d'automatisation créés.

## 📋 Prérequis

### Serveur VPS
- **OS** : Ubuntu 20.04+ ou Debian 11+
- **RAM** : Minimum 2GB (recommandé 4GB+)
- **CPU** : Minimum 2 cœurs
- **Stockage** : Minimum 20GB SSD
- **Réseau** : Accès internet + IP publique

### Local (Machine de développement)
- **OS** : Windows, Linux, ou macOS
- **Outils** : SSH, Docker, Docker Compose
- **Accès** : Clés SSH configurées pour le VPS

## 🔧 Configuration Initiale

### 1. Préparation du VPS

```bash
# Connexion au VPS
ssh root@VOTRE_IP_VPS

# Mise à jour du système
apt update && apt upgrade -y

# Installation des outils de base
apt install -y curl wget git vim htop
```

### 2. Configuration SSH (si nécessaire)

```bash
# Génération de clés SSH (sur votre machine locale)
ssh-keygen -t rsa -b 4096 -C "votre-email@example.com"

# Copie de la clé publique sur le VPS
ssh-copy-id root@VOTRE_IP_VPS
```

### 3. Configuration DNS (optionnel)

Si vous avez un domaine :
```bash
# Enregistrement DNS
# A    votre-domaine.com    -> VOTRE_IP_VPS
# A    www.votre-domaine.com -> VOTRE_IP_VPS
```

## 🚀 Déploiement Automatisé

### Option 1: Script Bash (Linux/macOS)

```bash
# Déploiement basique
./deploy-vps.sh production VOTRE_IP_VPS

# Déploiement avec domaine
DOMAIN=votre-domaine.com ./deploy-vps.sh production VOTRE_IP_VPS

# Déploiement avec utilisateur personnalisé
SSH_USER=ubuntu ./deploy-vps.sh production VOTRE_IP_VPS
```

### Option 2: Script PowerShell (Windows)

```powershell
# Déploiement basique
.\deploy-vps.ps1 -ServerIP VOTRE_IP_VPS

# Déploiement avec domaine
.\deploy-vps.ps1 -ServerIP VOTRE_IP_VPS -Domain votre-domaine.com

# Déploiement avec utilisateur personnalisé
.\deploy-vps.ps1 -ServerIP VOTRE_IP_VPS -SSHUser ubuntu
```

### Option 3: Variables d'Environnement

```bash
# Configuration des variables
export SSH_USER="ubuntu"
export SSH_PORT="22"
export APP_NAME="tuto-angular-ntier"
export DOMAIN="votre-domaine.com"

# Déploiement
./deploy-vps.sh production VOTRE_IP_VPS
```

## 📊 Architecture de Déploiement

### Services Déployés

```
VPS (VOTRE_IP_VPS)
├── Nginx (Port 80/443)     # Reverse proxy + SSL
├── Frontend Angular (Port 80) # Application web
├── Backend FastAPI (Port 8000) # API REST
├── PostgreSQL (Port 5432) # Base de données
├── Prometheus (Port 9090) # Monitoring
└── Grafana (Port 3000)    # Dashboards
```

### Flux de Données

```
Internet → Nginx → Frontend Angular
                → Backend FastAPI → PostgreSQL
```

## 🔒 Sécurité

### Configuration SSL Automatique

Le script configure automatiquement :
- **Let's Encrypt** pour les certificats SSL
- **Renouvellement automatique** des certificats
- **Redirection HTTPS** forcée
- **Headers de sécurité** (HSTS, CSP, etc.)

### Pare-feu

```bash
# Configuration automatique du pare-feu
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
```

### Variables d'Environnement Sécurisées

```bash
# Fichier .env généré automatiquement
SECRET_KEY=your-super-secret-key-change-this
POSTGRES_PASSWORD=secure_password
GRAFANA_PASSWORD=admin123
```

## 📈 Monitoring et Logs

### Accès aux Services

```bash
# Application principale
https://votre-domaine.com

# Monitoring
https://votre-domaine.com:3000 (Grafana)
https://votre-domaine.com:9090 (Prometheus)

# Logs en temps réel
ssh root@VOTRE_IP_VPS 'cd /opt/tuto-angular-ntier && docker-compose logs -f'
```

### Dashboards Grafana

- **Performance** : CPU, RAM, Disk
- **Application** : Requêtes HTTP, erreurs
- **Base de données** : Connexions, requêtes lentes
- **Sécurité** : Tentatives de connexion, erreurs

## 🔄 Maintenance et Mises à Jour

### Mise à Jour de l'Application

```bash
# Sur votre machine locale
git pull origin main
./deploy-vps.sh production VOTRE_IP_VPS
```

### Sauvegarde Automatique

```bash
# Sauvegarde avant chaque déploiement
/opt/backups/tuto-angular-ntier/backup_YYYYMMDD_HHMMSS.tar.gz

# Restauration
ssh root@VOTRE_IP_VPS 'cd /opt/tuto-angular-ntier && tar -xzf /opt/backups/tuto-angular-ntier/backup_YYYYMMDD_HHMMSS.tar.gz'
```

### Monitoring des Ressources

```bash
# Vérification des ressources
ssh root@VOTRE_IP_VPS 'htop'

# Vérification des conteneurs
ssh root@VOTRE_IP_VPS 'cd /opt/tuto-angular-ntier && docker-compose ps'
```

## 🆘 Dépannage

### Problèmes Courants

#### 1. Erreur de Connexion SSH
```bash
# Vérifier la connectivité
ping VOTRE_IP_VPS

# Tester SSH
ssh -v root@VOTRE_IP_VPS
```

#### 2. Services Non Démarrés
```bash
# Vérifier les logs
ssh root@VOTRE_IP_VPS 'cd /opt/tuto-angular-ntier && docker-compose logs'

# Redémarrer les services
ssh root@VOTRE_IP_VPS 'cd /opt/tuto-angular-ntier && docker-compose restart'
```

#### 3. Problème SSL
```bash
# Vérifier les certificats
ssh root@VOTRE_IP_VPS 'certbot certificates'

# Renouveler manuellement
ssh root@VOTRE_IP_VPS 'certbot renew --force-renewal'
```

#### 4. Base de Données
```bash
# Vérifier la connexion
ssh root@VOTRE_IP_VPS 'cd /opt/tuto-angular-ntier && docker-compose exec db psql -U postgres -d tuto_angular'
```

### Logs Importants

```bash
# Logs Nginx
ssh root@VOTRE_IP_VPS 'tail -f /var/log/nginx/access.log'
ssh root@VOTRE_IP_VPS 'tail -f /var/log/nginx/error.log'

# Logs Docker
ssh root@VOTRE_IP_VPS 'cd /opt/tuto-angular-ntier && docker-compose logs nginx'
ssh root@VOTRE_IP_VPS 'cd /opt/tuto-angular-ntier && docker-compose logs backend'
```

## 📋 Checklist de Déploiement

### Avant le Déploiement
- [ ] VPS configuré et accessible
- [ ] Clés SSH configurées
- [ ] Domaine configuré (si applicable)
- [ ] Variables d'environnement définies

### Pendant le Déploiement
- [ ] Connexion SSH établie
- [ ] Serveur préparé (Docker, Nginx, etc.)
- [ ] Backup créé
- [ ] Application construite
- [ ] Fichiers synchronisés
- [ ] Services démarrés
- [ ] SSL configuré (si domaine)

### Après le Déploiement
- [ ] Application accessible
- [ ] SSL fonctionnel
- [ ] Monitoring opérationnel
- [ ] Logs vérifiés
- [ ] Performance testée

## 🎯 Optimisations Avancées

### Performance

```bash
# Configuration Nginx optimisée
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_comp_level 6;
```

### Sécurité Renforcée

```bash
# Fail2ban pour la protection SSH
apt install fail2ban
systemctl enable fail2ban

# Configuration automatique
fail2ban-client status sshd
```

### Sauvegarde Automatisée

```bash
# Cron job pour sauvegarde quotidienne
0 2 * * * /opt/tuto-angular-ntier/backup.sh daily
```

## 📞 Support

### Ressources
- **Documentation Docker** : https://docs.docker.com/
- **Documentation Nginx** : https://nginx.org/en/docs/
- **Let's Encrypt** : https://letsencrypt.org/docs/

### Contact
- **Email** : support@tutorial-angular-ntier.com
- **GitHub** : Issues et Discussions
- **Discord** : #deployment-support

---

**Déploiement réussi ! 🚀**

*Votre application Angular n-tier est maintenant accessible sur votre VPS privé avec SSL, monitoring et sauvegarde automatique.*
