# 📁 Organisation des Scripts

## 🗂️ Structure des Répertoires

```
scripts/
├── bash/           # Scripts Bash (Linux/macOS)
├── windows/        # Scripts Batch (Windows)
├── powershell/     # Scripts PowerShell (Windows)
└── deployment/     # Scripts de déploiement VPS
```

## 🚀 Scripts de Raccourci

### Linux/macOS
```bash
./run.sh dev          # Environnement de développement
./run.sh test         # Exécuter les tests
./run.sh build        # Construire l'application
./run.sh deploy       # Déployer l'application
```

### Windows (Batch)
```cmd
run.bat dev           # Environnement de développement
run.bat test          # Exécuter les tests
run.bat build         # Construire l'application
run.bat deploy        # Déployer l'application
```

### Windows (PowerShell)
```powershell
.\run.ps1 dev         # Environnement de développement
.\run.ps1 test        # Exécuter les tests
.\run.ps1 build       # Construire l'application
.\run.ps1 deploy      # Déployer l'application
```

## 📋 Scripts Disponibles

### 🔧 Développement
- **dev.sh/bat/ps1** : Environnement de développement complet
- **test.sh/bat/ps1** : Exécution des tests unitaires et e2e
- **build.sh/bat/ps1** : Construction de l'application

### 🚀 Déploiement
- **deploy.sh/bat/ps1** : Déploiement local
- **deploy-vps.sh/ps1** : Déploiement automatisé sur VPS

### ⚙️ Configuration
- **config.sh/bat/ps1** : Configuration de l'environnement
- **security.sh/bat/ps1** : Vérifications de sécurité
- **backup.sh/bat/ps1** : Sauvegarde des données

### 📊 Monitoring
- **monitoring.sh/bat/ps1** : Surveillance du système
- **maintenance.sh/bat/ps1** : Tâches de maintenance
- **docs.sh/bat/ps1** : Génération de documentation

## 🎯 Utilisation Recommandée

### Développement Quotidien
```bash
# Démarrer l'environnement de développement
./run.sh dev

# Exécuter les tests
./run.sh test

# Construire pour la production
./run.sh build
```

### Déploiement VPS
```bash
# Déploiement automatisé
scripts/deployment/deploy-vps.sh production VOTRE_IP_VPS

# Avec domaine
DOMAIN=votre-domaine.com scripts/deployment/deploy-vps.sh production VOTRE_IP_VPS
```

### Maintenance
```bash
# Sauvegarde
./run.sh backup

# Vérifications de sécurité
./run.sh security

# Monitoring
./run.sh monitoring
```

## 🔍 Avantages de cette Organisation

1. **Clarté** : Chaque type de script dans son répertoire
2. **Maintenance** : Plus facile de trouver et modifier les scripts
3. **Portabilité** : Scripts adaptés à chaque plateforme
4. **Simplicité** : Scripts de raccourci pour l'utilisation quotidienne
5. **Professionnalisme** : Structure organisée et documentée

## 📝 Notes Importantes

- Les scripts de raccourci (`run.*`) sont à la racine pour faciliter l'utilisation
- Les scripts spécifiques sont dans leurs répertoires respectifs
- Tous les scripts sont documentés et commentés
- Les scripts de déploiement VPS sont dans `scripts/deployment/`

## 🆘 Aide

Pour voir tous les scripts disponibles :
```bash
./run.sh help
# ou
run.bat help
# ou
.\run.ps1 help
```
