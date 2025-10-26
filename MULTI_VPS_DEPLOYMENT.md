# Guide de Déploiement Multi-VPS HULBERT-1

## 📋 Architecture

**Architecture séparée Frontend/Backend :**

- **VPS Frontend** (51.210.6.15) : Angular + Nginx sur **hulbert.fr** (ports 80, 443)
- **VPS Backend** (51.178.24.242) : FastAPI + PostgreSQL + Redis + Nginx sur **hrodmarrik.fr** (ports 80, 443)

## 🌐 Configuration DNS

Avant de déployer, configurez vos enregistrements DNS :

### Frontend (hulbert.fr)
```
Type A: hulbert.fr → 51.210.6.15
Type A: www.hulbert.fr → 51.210.6.15
```

### Backend (hrodmarrik.fr)
```
Type A: hrodmarrik.fr → 51.178.24.242
Type A: www.hrodmarrik.fr → 51.178.24.242
```

**Temps de propagation DNS** : 5 minutes à 48 heures (généralement 1-2 heures)

## 🔐 Configuration SSH

### 1. Clés SSH créées

**Frontend :**
- Clé privée : `~/.ssh/hulbert_frontend_key`
- Clé publique : `~/.ssh/hulbert_frontend_key.pub`
- **À ajouter au VPS** : `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEeFZNY015A0F0sFtEqniEQFrBCAQWgXHJqkKMRntsVs`

**Backend :**
- Clé privée : `~/.ssh/hulbert_ovh_key`
- Déjà configurée sur le VPS 51.178.24.242

### 2. Configuration SSH locale

Le fichier `~/.ssh/config` a été mis à jour avec :
```ssh
Host hrodmarrik-backend
    HostName 51.178.24.242
    User debian
    IdentityFile ~/.ssh/hulbert_ovh_key

Host hulbert-frontend
    HostName 51.210.6.15
    User root
    IdentityFile ~/.ssh/hulbert_frontend_key
```

## 🚀 Configuration VPS Frontend (51.210.6.15)

### 1. Connexion au VPS

```bash
ssh hulbert-frontend
```

### 2. Installation des dépendances

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Installer Docker Compose
apt install -y docker-compose

# Installer Git
apt install -y git

# Créer le répertoire de déploiement
mkdir -p /opt/hulbert
```

### 3. Ajouter la clé SSH publique

**Copiez cette clé sur le VPS :**
```bash
# Sur votre machine locale
cat ~/.ssh/hulbert_frontend_key.pub
```

**Sur le VPS :**
```bash
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEeFZNY015A0F0sFtEqniEQFrBCAQWgXHJqkKMRntsVs hulbert-frontend@deployment" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### 4. Configuration Firewall

```bash
# Installer UFW
apt install -y ufw

# Autoriser SSH
ufw allow 22/tcp

# Autoriser HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le firewall
ufw enable

# Vérifier l'état
ufw status
```

## 🔧 Configuration VPS Backend (51.178.24.242)

### 1. Connexion au VPS

```bash
ssh hrodmarrik-backend
```

### 2. Vérification Docker

```bash
# Vérifier que Docker est installé
docker --version
docker-compose --version

# Créer le répertoire de déploiement
mkdir -p /opt/hulbert-backend
```

### 3. Configuration Firewall

```bash
# Autoriser le port backend
ufw allow 8000/tcp

# Vérifier l'état
ufw status
```

## 📦 Déploiement

### Option 1 : Déploiement Automatique Complet

```bash
# Depuis votre machine locale
bash scripts/deploy-full.sh
```

### Option 2 : Déploiement Manuel

#### A. Backend

```bash
# Depuis votre machine locale
bash scripts/deploy-backend.sh
```

#### B. Frontend

```bash
# Depuis votre machine locale
bash scripts/deploy-frontend.sh
```

### Option 3 : Déploiement Manuel sur VPS

#### A. VPS Frontend

```bash
# Se connecter au VPS
ssh hulbert-frontend

# Cloner le projet
cd /opt
git clone https://github.com/HrodMarRik/HULBERT-1.git hulbert

cd hulbert

# Créer le dossier dist
mkdir -p dist

# Copier l'image Angular depuis votre machine
# (depuis votre machine locale)
rsync -avz --progress dist/ root@51.210.6.15:/opt/hulbert/dist/

# Copier les fichiers de configuration
scp docker-compose.frontend.yml nginx/frontend.conf root@51.210.6.15:/opt/hulbert/

# Démarrage
cd /opt/hulbert
docker-compose -f docker-compose.frontend.yml up -d
```

#### B. VPS Backend

```bash
# Se connecter au VPS
ssh hrodmarrik-backend

# Cloner le projet
cd /opt
git clone https://github.com/HrodMarRik/HULBERT-1.git hulbert-backend

cd hulbert-backend

# Créer .env
cat > .env << EOF
POSTGRES_DB=hulbert_db
POSTGRES_USER=hulbert
POSTGRES_PASSWORD=changez_moi_ca
SECRET_KEY=changez_moi_ca_aussi
JWT_SECRET=changez_moi_egalement
EOF

# Démarrage
docker-compose -f docker-compose.backend.yml up -d

# Migration
docker-compose -f docker-compose.backend.yml exec backend alembic upgrade head
```

## 🔄 Configuration CORS

Le backend doit accepter les requêtes depuis le frontend :

**Fichier : `backend/app/config.py`**

```python
class Settings:
    CORS_ORIGINS = [
        "http://51.210.6.15",
        "https://your-frontend-domain.com",
    ]
```

## 🌐 Variables d'Environnement

### Frontend (env.frontend.example)
```env
# Backend API URL
BACKEND_API_URL=https://hrodmarrik.fr
ENVIRONMENT=production
```

### Backend (env.backend.example)
```env
# Database
POSTGRES_DB=hulbert_db
POSTGRES_USER=hulbert
POSTGRES_PASSWORD=changez_moi_production

# Security
SECRET_KEY=changez_moi_secret_key_production
JWT_SECRET=changez_moi_jwt_secret_production

# Frontend URL for CORS
FRONTEND_URL=https://hulbert.fr

# Environment
ENVIRONMENT=production
```

## 🗄️ Structure des Fichiers

```
HULBERT-1/
├── docker-compose.frontend.yml    # Config Frontend VPS
├── docker-compose.backend.yml     # Config Backend VPS
├── nginx/
│   ├── frontend.conf              # Nginx Frontend
│   └── backend.conf               # Nginx Backend
├── scripts/
│   ├── deploy-frontend.sh         # Déploiement Frontend
│   ├── deploy-backend.sh          # Déploiement Backend
│   └── deploy-full.sh             # Déploiement Complet
└── backend/
    └── Dockerfile                 # Image Backend
```

## ✅ Vérification

### Test Frontend
```bash
curl http://hulbert.fr
curl http://hulbert.fr/health
curl https://hulbert.fr  # Après configuration SSL
```

### Test Backend
```bash
curl http://hrodmarrik.fr/api/health
curl https://hrodmarrik.fr/api/health  # Après configuration SSL
```

### Test CORS (depuis le navigateur)
Ouvrir https://hulbert.fr et tester le login - les requêtes vers hrodmarrik.fr doivent fonctionner.

## 🔒 Configuration SSL (Optionnel)

### Frontend
```bash
ssh hulbert-frontend

# Installer Certbot
apt install -y certbot python3-certbot-nginx

# Générer certificat SSL
certbot --nginx -d your-frontend-domain.com

# SSL configuré automatiquement
```

### Backend
```bash
ssh hrodmarrik-backend

# Si vous exposez backend avec domaine
certbot --nginx -d api.your-domain.com
```

## 📊 Monitoring

### Logs Frontend
```bash
ssh hulbert-frontend
cd /opt/hulbert
docker-compose -f docker-compose.frontend.yml logs -f
```

### Logs Backend
```bash
ssh hrodmarrik-backend
cd /opt/hulbert-backend
docker-compose -f docker-compose.backend.yml logs -f
```

## 🐛 Troubleshooting

### Frontend ne se connecte pas au Backend
1. Vérifier que le backend écoute sur 8000 : `curl http://51.178.24.242:8000/api/health`
2. Vérifier le firewall : `ufw status`
3. Vérifier la configuration nginx : `docker exec hulbert-frontend cat /etc/nginx/nginx.conf`

### Backend ne démarre pas
1. Vérifier les logs : `docker-compose -f docker-compose.backend.yml logs backend`
2. Vérifier .env : `cat .env`
3. Vérifier la connexion DB : `docker-compose exec postgres psql -U hulbert -d hulbert_db`

### CORS Error
1. Mettre à jour `FRONTEND_URL` dans .env backend
2. Redémarrer backend : `docker-compose restart backend`

## 📝 Maintenance

### Mise à jour Frontend
```bash
bash scripts/deploy-frontend.sh
```

### Mise à jour Backend
```bash
bash scripts/deploy-backend.sh
```

### Backup Backend
```bash
ssh hrodmarrik-backend
cd /opt/hulbert-backend
docker-compose exec postgres pg_dump -U hulbert hulbert_db > backup_$(date +%Y%m%d).sql
```

## 🎯 Prochaines Étapes

1. ✅ Configurer les domaines DNS
2. ✅ Configurer SSL avec Certbot
3. ✅ Configurer les backups automatiques
4. ✅ Ajouter monitoring (Prometheus + Grafana)
5. ✅ Configurer les alertes

## 📞 Support

- Documentation complète : `README.md`
- Guide Docker : `docker/DOCKER_GUIDE.md`
- Guide CI/CD : `ci-cd/CI_CD_GUIDE.md`

