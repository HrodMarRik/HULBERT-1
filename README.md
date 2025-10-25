# HULBERT-1 - Plateforme de Gestion d'Entreprise

## 🏢 Description

HULBERT-1 est une plateforme complète de gestion d'entreprise développée avec Angular et FastAPI. Elle offre des modules intégrés pour la comptabilité, la facturation, la paie, la gestion de projets et l'analyse concurrentielle.

## 🏗️ Architecture

- **Frontend**: Angular 20 avec TypeScript
- **Backend**: FastAPI (Python) avec SQLAlchemy
- **Base de données**: PostgreSQL (production) / SQLite (développement)
- **Infrastructure**: Docker + Nginx
- **Cache**: Redis (optionnel)

## 📦 Modules Principaux

### 🏠 Dashboard
- Vue d'ensemble des métriques clés
- Widgets personnalisables
- Statistiques en temps réel

### 💰 Comptabilité
- **Facturation**: Création et gestion des factures
- **Paie**: Calcul automatique des salaires et charges
- **Déclarations sociales**: Génération automatique des DSN
- **Rapports**: Bilan, compte de résultat, flux de trésorerie

### 🎫 Tickets
- Système de tickets intégré
- Assignation et suivi des tâches
- Historique et notifications

### 📋 Projets
- Gestion complète des projets
- Suivi des budgets et délais
- Timeline et jalons

### 👥 Contacts & Entreprises
- Base de données clients/fournisseurs
- Historique des interactions
- Gestion des contrats

### 📊 Analyse Concurrentielle
- Questionnaire détaillé (70+ questions)
- Génération de rapports stratégiques
- Recommandations personnalisées

## 🚀 Installation et Déploiement

### Prérequis
- Docker & Docker Compose
- Node.js 20+ (pour le développement)
- Python 3.11+ (pour le développement)
- PostgreSQL 15+ (pour la production)

### Développement Local

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio
npm install
npm start
```

### Production avec Docker

```bash
# Cloner le repository
git clone https://github.com/votre-username/HULBERT-1.git
cd HULBERT-1

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration

### Variables d'environnement

Voir `.env.example` pour la liste complète des variables.

### Base de données

Le projet utilise PostgreSQL en production et SQLite en développement.

### Feature Flags

Certains modules peuvent être désactivés via les feature flags dans `backend/app/core/config.py` :

```python
FEATURE_RSS_READER: bool = False
FEATURE_EMAIL_CAMPAIGNS: bool = False
FEATURE_EMAIL_SECURITY: bool = False
# ... autres flags
```

## 📚 Documentation API

Une fois le backend démarré, la documentation API est disponible à :
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🧪 Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio
npm test
```

## 📈 Performance

- **Backend**: Connection pooling PostgreSQL, cache Redis
- **Frontend**: Lazy loading, OnPush change detection
- **Infrastructure**: Nginx reverse proxy, gzip compression

## 🔒 Sécurité

- Authentification JWT
- Validation des données avec Pydantic
- CORS configuré
- Headers de sécurité
- Rate limiting

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation API
- Vérifier les logs Docker : `docker-compose logs -f`

## 🗺️ Roadmap

- [ ] Module CRM avancé
- [ ] Intégration comptable externe
- [ ] Application mobile
- [ ] API webhooks
- [ ] Multi-tenancy
- [ ] Module e-commerce

---

**Développé avec ❤️ pour simplifier la gestion d'entreprise**