# 🚀 Projet Angular n-tier - Racine du Projet

## 📁 Structure du Projet

```
Angular/                           # ← RACINE du projet Angular
├── Tuto-Angular/                  # Application Angular principale
│   ├── src/                       # Code source Angular
│   ├── docs/                      # Documentation complète
│   ├── backend/                   # API Python/FastAPI
│   └── ...
├── scripts/                       # Scripts d'automatisation
│   ├── bash/                      # Scripts Bash (Linux/macOS)
│   ├── windows/                   # Scripts Batch (Windows)
│   ├── powershell/                # Scripts PowerShell (Windows)
│   └── deployment/                # Scripts de déploiement VPS
├── run.sh                         # Raccourci Bash
├── run.bat                        # Raccourci Batch
├── run.ps1                        # Raccourci PowerShell
├── docker-compose.prod.yml        # Configuration Docker production
├── SCRIPTS_README.md              # Documentation des scripts
└── VPS_DEPLOYMENT_GUIDE.md        # Guide de déploiement VPS
```

## 🎯 Utilisation Rapide

### Développement
```bash
# Démarrer l'environnement de développement
./run.sh dev

# Exécuter les tests
./run.sh test

# Construire l'application
./run.sh build
```

### Déploiement VPS
```bash
# Déploiement automatisé
scripts/deployment/deploy-vps.sh production VOTRE_IP_VPS

# Avec domaine
DOMAIN=votre-domaine.com scripts/deployment/deploy-vps.sh production VOTRE_IP_VPS
```

## 📚 Documentation Complète

- **`README.md`** : Ce fichier - Guide principal du projet Angular
- **`QUICK_START.md`** : Guide de démarrage rapide et installation
- **`TUTORIAL_GUIDE.md`** : Guide complet du tutoriel avec tous les modules
- **`EXERCISES_PRACTICAL.md`** : Exercices pratiques avec solutions
- **`TO-DO.md`** : Liste des tâches et fonctionnalités à définir
- **`SCRIPTS_README.md`** : Documentation des scripts d'automatisation
- **`VPS_DEPLOYMENT_GUIDE.md`** : Guide de déploiement sur VPS privé

## 🔧 Architecture n-tier

### Frontend (Angular)
- **Présentation** : Components, Templates, Directives
- **Application** : Services, Guards, Interceptors
- **Domaine** : Models, Interfaces, Types
- **Infrastructure** : HTTP, Storage, External APIs

### Backend (Python/FastAPI)
- **Présentation** : API Routes, Controllers
- **Application** : Services, Business Logic
- **Domaine** : Models, Entities, Repositories
- **Infrastructure** : Database, External Services

## 🚀 Démarrage Rapide

1. **Installation des dépendances** :
   ```bash
   cd Tuto-Angular
   npm install
   ```

2. **Démarrage du développement** :
   ```bash
   ./run.sh dev
   ```

3. **Accès à l'application** :
   - Frontend : http://localhost:4200
   - Backend : http://localhost:8000
   - Documentation API : http://localhost:8000/docs

## 📋 Modules d'Apprentissage

1. **Module 1** : Bases Angular (Components, Binding, Directives, Signals)
2. **Module 2** : Routing & Navigation
3. **Module 3** : Services & Dependency Injection
4. **Module 4** : Formulaires Réactifs
5. **Module 5** : Authentification JWT
6. **Module 6** : Intégration API Python
7. **Module 7** : Features Avancées
8. **Module 8** : Déploiement & Production

## 🎓 Objectifs d'Apprentissage

- ✅ **Angular** : Framework complet avec architecture n-tier
- ✅ **TypeScript** : Langage typé pour JavaScript
- ✅ **PostgreSQL** : Base de données relationnelle
- ✅ **Python API** : FastAPI pour les APIs REST
- ✅ **Déploiement** : Automatisation VPS avec Docker

## 🆘 Support

- **Documentation** : `Tuto-Angular/docs/`
- **Scripts** : `SCRIPTS_README.md`
- **Déploiement** : `VPS_DEPLOYMENT_GUIDE.md`
- **Exercices** : `Tuto-Angular/docs/EXERCISES_SOLUTIONS.md`

---

**Bienvenue dans votre tutoriel Angular n-tier complet ! 🎉**

*Ce projet vous accompagnera dans l'apprentissage d'Angular, TypeScript, PostgreSQL et Python API avec une architecture professionnelle n-tier.*
