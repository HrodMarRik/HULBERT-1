# Tuto Angular n-tier - Guide complet d'apprentissage

## 🎯 Objectif
Ce tutoriel complet vous guide dans l'apprentissage d'Angular avec une architecture n-tier, incluant TypeScript, PostgreSQL et Python FastAPI.

## 📚 Prérequis
- Connaissance de Python, SQL et JavaScript
- Node.js et npm installés
- PostgreSQL installé
- Python 3.8+ installé

## 🏗️ Architecture du projet

### Frontend (Angular)
```
src/
├── app/
│   ├── core/           # Services, guards, interceptors
│   ├── features/       # Modules métier
│   ├── shared/         # Composants partagés
│   └── layout/         # Layout principal
├── environments/        # Configuration environnement
└── assets/            # Ressources statiques
```

### Backend (Python FastAPI)
```
backend/
├── api/               # Endpoints API
├── core/              # Configuration core
├── database/          # Modèles et connexion
├── repositories/      # Couche d'accès aux données
├── schemas/           # Validation Pydantic
├── services/          # Logique métier
└── utils/             # Utilitaires
```

## 🚀 Installation et démarrage

### 1. Installation des dépendances
```bash
# Frontend
cd Angular/Tuto-Angular
npm install

# Backend
cd backend
pip install -r requirements.txt
```

### 2. Configuration de la base de données
```bash
# Créer la base de données PostgreSQL
createdb tuto_angular

# Configurer les variables d'environnement
cp backend/config.env.example backend/config.env
# Éditer config.env avec vos paramètres
```

### 3. Démarrage des services
```bash
# Backend (terminal 1)
cd backend
uvicorn main:app --reload

# Frontend (terminal 2)
cd Angular/Tuto-Angular
ng serve
```

## 📖 Modules d'apprentissage

### Module 1 : Bases d'Angular
- [x] Composants et templates
- [x] Data binding et directives
- [x] Services et injection de dépendance
- [x] Signals et réactivité

### Module 2 : Routing et navigation
- [x] Configuration des routes
- [x] Navigation programmatique
- [x] Guards et protection des routes
- [x] Lazy loading

### Module 3 : Services et HTTP
- [x] Services Angular
- [x] HttpClient et API calls
- [x] Interceptors HTTP
- [x] Gestion d'état

### Module 4 : Forms et validation
- [x] Reactive Forms
- [x] Validation synchrone et asynchrone
- [x] Custom validators
- [x] Gestion des erreurs

### Module 5 : Authentification
- [x] JWT authentication
- [x] Login et registration
- [x] Token management
- [x] Protected routes

### Module 6 : Intégration API
- [x] Configuration environnement
- [x] Services API
- [x] Gestion des erreurs
- [x] Loading states

### Module 7 : Features avancées
- [x] Signals avancés
- [x] Change detection
- [x] Performance optimization
- [x] PWA et i18n

### Module 8 : Déploiement
- [x] Configuration production
- [x] CI/CD pipeline
- [x] Docker
- [x] Monitoring

## 🛠️ Technologies utilisées

### Frontend
- **Angular 17+** - Framework principal
- **TypeScript** - Langage de programmation
- **RxJS** - Programmation réactive
- **Angular Material** - Composants UI
- **Angular CLI** - Outils de développement

### Backend
- **FastAPI** - Framework web Python
- **SQLAlchemy** - ORM Python
- **PostgreSQL** - Base de données
- **Pydantic** - Validation des données
- **JWT** - Authentification

### Outils
- **Docker** - Containerisation
- **GitHub Actions** - CI/CD
- **Nginx** - Serveur web
- **PM2** - Process manager

## 📁 Structure des fichiers

```
Tuto-Angular/
├── Angular/
│   └── Tuto-Angular/          # Projet Angular
│       ├── src/
│       ├── docs/              # Documentation des modules
│       └── package.json
├── backend/                   # API Python FastAPI
│   ├── api/
│   ├── database/
│   ├── services/
│   └── main.py
├── docs/                      # Documentation générale
│   ├── TYPESCRIPT_GUIDE.md
│   ├── N_TIER_ARCHITECTURE.md
│   └── MODULE_*.md
└── README.md
```

## 🎯 Objectifs d'apprentissage

### Compétences techniques
- [ ] Maîtrise d'Angular et TypeScript
- [ ] Architecture n-tier
- [ ] Intégration API REST
- [ ] Gestion d'état avancée
- [ ] Testing et déploiement

### Compétences métier
- [ ] Développement d'applications web modernes
- [ ] Gestion de projets complexes
- [ ] Bonnes pratiques de développement
- [ ] Architecture scalable

## 🚀 Prochaines étapes

1. **Compléter les exercices** de chaque module
2. **Implémenter les features** manquantes
3. **Ajouter des tests** unitaires et d'intégration
4. **Optimiser les performances**
5. **Déployer en production**

## 📚 Ressources supplémentaires

### Documentation officielle
- [Angular Documentation](https://angular.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Tutoriels recommandés
- [Angular University](https://angular-university.io/)
- [Angular Material](https://material.angular.io/)
- [RxJS Marbles](https://rxmarbles.com/)

## 🤝 Contribution

Ce projet est un tutoriel d'apprentissage. N'hésitez pas à :
- Proposer des améliorations
- Signaler des erreurs
- Ajouter des exemples
- Partager vos retours

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

**Bon apprentissage ! 🎉**