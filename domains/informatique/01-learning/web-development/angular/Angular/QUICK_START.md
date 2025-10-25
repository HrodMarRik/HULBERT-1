# Tutoriel Angular n-tier - Guide de Démarrage Rapide

## 🚀 Installation et Configuration

### Prérequis
- Node.js (version 18 ou supérieure)
- npm (version 9 ou supérieure)
- Python 3.8+
- PostgreSQL 12+
- Git

### Installation des outils

#### 1. Node.js et npm
```bash
# Télécharger depuis https://nodejs.org/
# Ou utiliser un gestionnaire de paquets

# Vérifier l'installation
node --version
npm --version
```

#### 2. Angular CLI
```bash
npm install -g @angular/cli

# Vérifier l'installation
ng version
```

#### 3. Python et pip
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Windows
# Télécharger depuis https://python.org/

# Vérifier l'installation
python3 --version
pip3 --version
```

#### 4. PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# Windows
# Télécharger depuis https://postgresql.org/

# Vérifier l'installation
psql --version
```

## 📁 Structure du Projet

```
tutoriel-angular-ntier/
├── Angular/
│   └── Tuto-Angular/          # Projet Angular
├── backend/                   # API Python/FastAPI
├── docs/                      # Documentation
├── scripts/                   # Scripts d'automatisation
└── README.md
```

## 🛠️ Configuration du Projet

### 1. Cloner le projet
```bash
git clone <repository-url>
cd tutoriel-angular-ntier
```

### 2. Configuration du Frontend (Angular)
```bash
cd Angular/Tuto-Angular
npm install
ng serve
```

### 3. Configuration du Backend (Python)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

pip install -r requirements.txt
uvicorn main:app --reload
```

### 4. Configuration de la Base de Données
```bash
# Créer la base de données
createdb tuto_angular

# Exécuter les migrations
python -c "
from database.models import Base
from database.connection import engine
Base.metadata.create_all(bind=engine)
print('Tables créées!')
"
```

## 🎯 Démarrage Rapide

### Scripts d'automatisation
Le projet inclut des scripts pour automatiser les tâches courantes :

#### Scripts Bash (Linux/Mac)
```bash
# Développement
./dev.sh

# Tests
./test.sh

# Build
./build.sh

# Déploiement
./deploy.sh

# Configuration
./config.sh

# Backup
./backup.sh

# Sécurité
./security.sh

# Documentation
./docs.sh

# Monitoring
./monitoring.sh

# Maintenance
./maintenance.sh
```

#### Scripts Windows
```cmd
# Développement
dev.bat

# Tests
test.bat

# Build
build.bat

# Déploiement
deploy.bat

# Configuration
config.bat

# Backup
backup.bat

# Sécurité
security.bat

# Documentation
docs.bat

# Monitoring
monitoring.bat

# Maintenance
maintenance.bat
```

#### Scripts PowerShell
```powershell
# Développement
.\dev.ps1

# Tests
.\test.ps1

# Build
.\build.ps1

# Déploiement
.\deploy.ps1

# Configuration
.\config.ps1

# Backup
.\backup.ps1

# Sécurité
.\security.ps1

# Documentation
.\docs.ps1

# Monitoring
.\monitoring.ps1

# Maintenance
.\maintenance.ps1
```

## 📚 Modules d'Apprentissage

### Module 1: Bases Angular
- Composants et templates
- Data binding
- Directives
- Signals

### Module 2: Routing & Navigation
- Configuration des routes
- Navigation
- Guards
- Lazy loading

### Module 3: Services & DI
- Services
- Dependency Injection
- HTTP Client
- Interceptors

### Module 4: Formulaires Réactifs
- FormGroup et FormControl
- Validation
- Validateurs personnalisés
- Gestion des erreurs

### Module 5: Authentification JWT
- Service d'authentification
- Guards
- Intercepteurs
- Gestion des tokens

### Module 6: Intégration API
- Services API
- Gestion des erreurs
- États de chargement
- Cache

### Module 7: Features Avancées
- Performance
- State management
- PWA
- Tests

## 🧪 Tests

### Tests Unitaires
```bash
# Angular
ng test

# Python
pytest
```

### Tests E2E
```bash
# Angular
ng e2e

# Python
pytest tests/e2e/
```

## 🚀 Déploiement

### Développement
```bash
# Frontend
ng serve

# Backend
uvicorn main:app --reload

# Base de données
psql -d tuto_angular
```

### Production
```bash
# Build
ng build --prod

# Docker
docker-compose up -d

# Nginx
sudo systemctl start nginx
```

## 🔧 Configuration des Outils

### ESLint
```bash
npm install -g eslint
eslint --init
```

### Prettier
```bash
npm install -g prettier
```

### Git Hooks
```bash
npm install -g husky
npx husky install
```

## 📖 Ressources

### Documentation
- [Angular](https://angular.io/docs)
- [TypeScript](https://typescriptlang.org/docs)
- [FastAPI](https://fastapi.tiangolo.com/)
- [PostgreSQL](https://postgresql.org/docs/)

### Outils
- [Angular CLI](https://angular.io/cli)
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://postman.com/)
- [Docker](https://docker.com/)

## 🆘 Dépannage

### Problèmes Courants

#### 1. Erreur de port
```bash
# Changer le port
ng serve --port 4201
uvicorn main:app --port 8001
```

#### 2. Erreur de base de données
```bash
# Vérifier la connexion
psql -h localhost -U postgres -d tuto_angular

# Recréer la base
dropdb tuto_angular
createdb tuto_angular
```

#### 3. Erreur de dépendances
```bash
# Nettoyer le cache
npm cache clean --force
pip cache purge

# Réinstaller
rm -rf node_modules package-lock.json
npm install

rm -rf venv
python3 -m venv venv
pip install -r requirements.txt
```

#### 4. Erreur de permissions
```bash
# Linux/Mac
sudo chown -R $USER:$USER .
chmod +x *.sh

# Windows
# Exécuter en tant qu'administrateur
```

### Logs et Debug
```bash
# Angular
ng serve --verbose

# Python
uvicorn main:app --log-level debug

# PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log
```

## 📞 Support

### Communauté
- [Angular Discord](https://discord.gg/angular)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/angular)
- [Reddit r/Angular](https://reddit.com/r/Angular)

### Ressources d'Aide
- [Angular University](https://angular-university.io/)
- [Angular DevTools](https://angular.io/guide/devtools)
- [Angular Material](https://material.angular.io/)

## 🎓 Prochaines Étapes

1. **Compléter les modules** dans l'ordre
2. **Faire les exercices** pratiques
3. **Expérimenter** avec le code
4. **Construire** votre propre projet
5. **Partager** vos réalisations

## 📝 Notes

- Gardez ce guide à portée de main
- Consultez la documentation officielle
- N'hésitez pas à expérimenter
- Partagez vos questions et découvertes

---

**Bon apprentissage ! 🚀**