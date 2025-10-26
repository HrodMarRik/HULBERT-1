# 🚀 Prompt Configuration VPS Frontend HULBERT-1

## Contexte
Je configure mon **nouveau VPS Frontend** pour déployer l'application HULBERT-1 en séparant Frontend et Backend sur deux serveurs différents.

## VPS Frontend (51.210.6.15)

**Informations VPS :**
- IP : **51.210.6.15**
- OS : Debian (mode rescue pour le moment)
- Mot de passe root : **TDT8g8Shgfbr** (motsdePASSE pour debian)
- Utilisateur : **root** (à changer en `debian` si possible)

**État actuel :**
- ✅ VPS accessible en mode rescue
- ❌ Docker non installé
- ❌ Git non installé
- ❌ Application non déployée

## 🎯 Objectif

Configurer ce VPS pour servir le **Frontend Angular** avec Nginx en reverse proxy vers le Backend qui sera sur l'autre VPS (51.178.24.242).

## 📋 Architecture

```
VPS Frontend (51.210.6.15)
├── Port 80 (HTTP)
├── Port 443 (HTTPS - à configurer)
├── Nginx (reverse proxy vers backend)
└── Angular App (fichiers statiques)

VPS Backend (51.178.24.242) 
├── Port 8000 (FastAPI)
├── PostgreSQL
└── Redis
```

## 📝 Tâches à Accomplir

### 1. Sortir du Mode Rescue et Installer Debian

**Objectif :** Installer Debian 12 Docker stable sur le VPS

```bash
# Vous êtes actuellement en mode rescue
# Sortir du mode rescue depuis l'interface OVH
# Réinstaller Debian 12 Docker
```

**Actions :**
1. Se connecter à l'interface OVH
2. VPS → Serveurs → Réinstaller
3. Sélectionner "Debian 12 Docker"
4. Configurer le mot de passe (motsdePASSE)
5. Attendre la fin de l'installation (~5 minutes)

### 2. Premier Accès (Installation Docker)

**Objectif :** Se connecter et installer les dépendances

```bash
# Se connecter
ssh root@51.210.6.15
# Mot de passe : motsdePASSE

# Mettre à jour
apt update && apt upgrade -y

# Installer Docker (déjà inclus avec Debian Docker mais vérifier)
docker --version

# Installer Docker Compose
apt install -y docker-compose

# Installer Git
apt install -y git curl
```

### 3. Configuration Sécurité

**Objectif :** Sécuriser le VPS

```bash
# Créer utilisateur non-root
adduser debian
usermod -aG sudo debian
usermod -aG docker debian

# Configurer SSH
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Ajouter la clé SSH publique
mkdir -p /home/debian/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEeFZNY015A0F0sFtEqniEQFrBCAQWgXHJqkKMRntsVs hulbert-frontend@deployment" >> /home/debian/.ssh/authorized_keys
chmod 700 /home/debian/.ssh
chmod 600 /home/debian/.ssh/authorized_keys
chown -R debian:debian /home/debian/.ssh

# Redémarrer SSH
systemctl restart sshd

# Configurer Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

### 4. Cloner et Configurer le Projet

**Objectif :** Récupérer le projet HULBERT-1

```bash
# Se connecter avec l'utilisateur debian
ssh debian@51.210.6.15

# Créer le répertoire
sudo mkdir -p /opt/hulbert
sudo chown -R debian:debian /opt/hulbert
cd /opt/hulbert

# Cloner le projet
git clone https://github.com/HrodMarRik/HULBERT-1.git .
```

### 5. Préparer les Fichiers Frontend

**Objectif :** Build Angular en local et copier sur le VPS

```bash
# Sur votre machine locale
cd domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio

# Installer les dépendances et build
npm ci
npm run build -- --configuration production

# Copier les fichiers build sur le VPS
cd ../../../../../
rsync -avz --progress dist/ debian@51.210.6.15:/opt/hulbert/dist/

# Copier les fichiers de configuration
scp docker-compose.frontend.yml nginx/frontend.conf debian@51.210.6.15:/opt/hulbert/
```

### 6. Démarrer les Services

**Objectif :** Lancer le Frontend avec Docker

```bash
# Sur le VPS
ssh debian@51.210.6.15
cd /opt/hulbert

# Créer le dossier SSL (vide pour le moment)
mkdir -p ssl

# Démarrer
docker-compose -f docker-compose.frontend.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.frontend.yml logs -f
```

### 7. Vérification

**Objectif :** Tester que tout fonctionne

```bash
# Test HTTP
curl http://51.210.6.15

# Test Health
curl http://51.210.6.15/health

# Test API (devrait proxy vers backend)
curl http://51.210.6.15/api/health
```

## 🔐 Clé SSH Publique

**À copier sur le VPS :**

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEeFZNY015A0F0sFtEqniEQFrBCAQWgXHJqkKMRntsVs hulbert-frontend@deployment
```

## 📦 Fichiers Créés

Le projet contient déjà :
- `docker-compose.frontend.yml` - Configuration Docker Frontend
- `nginx/frontend.conf` - Configuration Nginx
- `scripts/deploy-frontend.sh` - Script de déploiement automatique
- `MULTI_VPS_DEPLOYMENT.md` - Documentation complète

## ✅ Résultat Attendu

**À la fin de cette configuration :**
- ✅ VPS accessible en SSH avec utilisateur `debian`
- ✅ Docker et Docker Compose installés
- ✅ Firewall configuré (ports 80, 443, 22)
- ✅ Application Angular servie sur http://51.210.6.15
- ✅ Nginx reverse proxy vers backend sur 51.178.24.242:8000
- ✅ Logs accessibles via `docker-compose logs`

## 🚨 Points d'Attention

1. **Mode Rescue :** Sortir du mode rescue depuis OVH avant de continuer
2. **Mot de passe :** Utiliser `motsdePASSE` pendant l'installation
3. **Utilisateur :** Créer `debian` et désactiver `root`
4. **CORS :** Backend doit accepter les requêtes depuis 51.210.6.15
5. **Frontend Build :** Doit être fait en local (node_modules requis)

## 📞 Support

- Documentation : `MULTI_VPS_DEPLOYMENT.md`
- Scripts : `scripts/deploy-frontend.sh`
- Docker : `docker-compose.frontend.yml`

---

**Commence par me guider pour sortir du mode rescue et installer Debian 12 Docker, puis on configure le reste.**

