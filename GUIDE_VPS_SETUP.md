# 🔧 Guide de Configuration VPS Frontend (51.210.6.15)

## Étape 1 : Sortir du Mode Rescue

### Via l'Interface OVH

1. **Se connecter à votre espace OVH**
   - URL : https://www.ovh.com/manager/
   - Connexion avec vos identifiants OVH

2. **Accéder à votre VPS**
   - Menu : **Bare Metal Cloud** → **IPMI**
   - Sélectionner votre VPS : `vps-d47edc07`

3. **Sortir du mode rescue**
   - Dans l'interface IPMI, chercher le bouton **"Exit Rescue Mode"** ou **"Quitter le mode rescue"**
   - Cliquer dessus
   - Le VPS va redémarrer automatiquement

4. **Réinstaller le système d'exploitation**
   - Si vous n'avez pas d'OS installé, aller dans **Bare Metal Cloud** → **Installer/Réinstaller**
   - Sélectionner : **Debian 12 - Docker**
   - Configurer le mot de passe root : `motsdePASSE` (ou celui que vous voulez)
   - Confirmer l'installation (environ 5-10 minutes)

### Alternative : Via le gestionnaire VPS

Si l'interface IPMI ne fonctionne pas :

1. **OVH Manager** → **Bare Metal Cloud** → **Serveurs** → Votre VPS
2. **Installer/Réinstaller** dans le menu latéral
3. Sélectionner **Debian 12 - Docker**
4. Mot de passe : `motsdePASSE`
5. Confirmer et attendre (~10 minutes)

## Étape 2 : Premier Accès au VPS

Une fois le VPS réinstallé :

```bash
# Se connecter avec root (mot de passe: motsdePASSE)
ssh root@51.210.6.15
```

**Si vous ne pouvez pas utiliser `ssh root@51.210.6.15`**, vous devrez peut-être récupérer les identifiants depuis OVH :

- OVH Manager → Votre VPS → Informations → **Identifiants**

## Étape 3 : Configuration Initiale

Une fois connecté en SSH :

### 3.1 Vérifier et installer les dépendances

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Vérifier Docker (déjà installé avec Debian Docker)
docker --version
docker-compose --version

# Installer Docker Compose si nécessaire
apt install -y docker-compose

# Installer Git, Curl, et autres outils
apt install -y git curl wget vim ufw

# Installer Nginx (pour servir le frontend plus tard)
apt install -y nginx
```

### 3.2 Créer un utilisateur non-root

```bash
# Créer l'utilisateur debian
adduser debian
# Entrer le mot de passe : motsdePASSE
# Confirmer et laisser les autres champs vides

# Ajouter aux groupes nécessaires
usermod -aG sudo debian
usermod -aG docker debian

# Tester le nouveau compte (dans un nouveau terminal local)
# ssh debian@51.210.6.15
```

### 3.3 Configurer SSH pour la sécurité

```bash
# Éditer la configuration SSH
vim /etc/ssh/sshd_config

# Modifier ces lignes :
# PermitRootLogin no
# PasswordAuthentication no
# PubkeyAuthentication yes
# ChallengeResponseAuthentication no

# Sauvegarder et redémarrer SSH
systemctl restart sshd
```

⚠️ **ATTENTION** : Assurez-vous d'avoir ajouté votre clé SSH avant de désactiver PasswordAuthentication !

### 3.4 Ajouter votre clé SSH publique

Sur votre machine locale (Windows) :

```powershell
# Lire votre clé publique
Get-Content C:\Users\somos\.ssh\hulbert_frontend_key.pub
```

Sur le VPS, ajouter la clé :

```bash
# Comme utilisateur root
mkdir -p /home/debian/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEeFZNY015A0F0sFtEqniEQFrBCAQWgXHJqkKMRntsVs hulbert-frontend@deployment" >> /home/debian/.ssh/authorized_keys

# Définir les bonnes permissions
chmod 700 /home/debian/.ssh
chmod 600 /home/debian/.ssh/authorized_keys
chown -R debian:debian /home/debian/.ssh
```

### 3.5 Configurer le Firewall

```bash
# Configurer UFW
ufw default deny incoming
ufw default allow outgoing

# Autoriser SSH
ufw allow 22/tcp

# Autoriser HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le firewall
ufw enable

# Vérifier l'état
ufw status verbose
```

### 3.6 Créer le répertoire de déploiement

```bash
# Créer le répertoire pour l'application
mkdir -p /opt/hulbert
chown -R debian:debian /opt/hulbert

# Autoriser l'utilisateur debian à utiliser Docker sans sudo
usermod -aG docker debian
```

## Étape 4 : Vérification

Après toutes ces étapes, testez :

### 4.1 Connexion avec l'utilisateur debian

Depuis votre machine locale :

```bash
# Windows PowerShell
ssh debian@51.210.6.15
# Utiliser la clé SSH automatiquement

# Tester Docker
sudo docker ps
docker ps  # Devrait fonctionner sans sudo après ajout au groupe

# Test permissions
mkdir -p /opt/hulbert/test
echo "OK" > /opt/hulbert/test.txt
cat /opt/hulbert/test.txt
# Devrait afficher "OK"
```

### 4.2 Vérifier les ports ouverts

```bash
# Depuis le VPS
ss -tuln | grep -E ':(22|80|443)'

# Depuis votre machine locale
telnet 51.210.6.15 22    # Devrait réussir
curl -I http://51.210.6.15  # Devrait retourner une erreur 403 (normal, pas de site pour le moment)
```

## Étape 5 : Préparer le VPS pour le déploiement

```bash
# Se connecter avec debian
ssh debian@51.210.6.15

# Créer le répertoire de travail
cd /opt/hulbert

# Créer les sous-dossiers nécessaires
mkdir -p dist nginx ssl

# Vérifier que Docker fonctionne
docker --version
docker-compose --version
```

## 🎯 Résultat Attendu

À la fin de cette configuration, vous devez avoir :

- ✅ VPS sorti du mode rescue
- ✅ Debian 12 Docker installé
- ✅ Utilisateur `debian` créé avec accès sudo et docker
- ✅ Mot de passe configuré : `motsdePASSE`
- ✅ SSH configuré en clé publique uniquement
- ✅ Firewall actif (ports 22, 80, 443)
- ✅ Docker et Docker Compose fonctionnels
- ✅ Répertoire `/opt/hulbert` créé et accessible

## 🔐 Identifiants Récapitulatifs

**VPS Frontend (51.210.6.15) :**
- Utilisateur root (temporaire) : root / motsdePASSE
- Utilisateur debian : debian / motsdePASSE
- Port SSH : 22
- Ports HTTP : 80, 443
- Clé SSH : `~/.ssh/hulbert_frontend_key`

## 📞 Commandes Utiles

```bash
# Voir les logs du système
journalctl -xe

# Voir l'état des services
systemctl status docker
systemctl status ssh

# Voir l'espace disque
df -h

# Voir la mémoire
free -h

# Voir les utilisateurs
cat /etc/passwd

# Voir les groupes Docker
getent group docker
```

## 🚨 Troubleshooting

### Erreur : Permission denied (publickey)
**Solution :** Vous n'avez pas ajouté votre clé SSH. Voir étape 3.4

### Erreur : Connection refused
**Solution :** Le VPS n'est pas encore sorti du mode rescue. Attendre que l'installation de Debian soit terminée.

### Erreur : mot de passe incorrect
**Solution :** Utiliser le mot de passe défini lors de la réinstallation depuis OVH Manager.

### Erreur : Cannot connect to Docker daemon
**Solution :** 
```bash
sudo usermod -aG docker $USER
newgrp docker  # ou se déconnecter/reconnecter
```

## 🎬 Prochaine Étape

Une fois cette configuration terminée, vous pourrez cloner le projet HULBERT-1 et déployer le frontend !

