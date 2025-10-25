# Backend Python/FastAPI + PostgreSQL - Architecture n-tier

## Structure du projet

```
backend/
├── main.py                 # Point d'entrée FastAPI
├── requirements.txt        # Dépendances Python
├── .env                   # Variables d'environnement
├── database/
│   ├── __init__.py
│   ├── connection.py      # Configuration base de données
│   └── models.py         # Modèles SQLAlchemy
├── repositories/
│   ├── __init__.py
│   ├── base_repository.py # Repository de base
│   ├── user_repository.py # Repository utilisateurs
│   ├── product_repository.py # Repository produits
│   └── order_repository.py # Repository commandes
├── services/
│   ├── __init__.py
│   ├── auth_service.py    # Service d'authentification
│   ├── user_service.py    # Service utilisateurs
│   ├── product_service.py # Service produits
│   └── order_service.py   # Service commandes
├── api/
│   ├── __init__.py
│   ├── dependencies.py    # Dépendances FastAPI
│   ├── auth.py           # Routes d'authentification
│   ├── users.py          # Routes utilisateurs
│   ├── products.py       # Routes produits
│   └── orders.py         # Routes commandes
├── schemas/
│   ├── __init__.py
│   ├── user_schemas.py    # Schémas Pydantic utilisateurs
│   ├── product_schemas.py # Schémas Pydantic produits
│   └── order_schemas.py   # Schémas Pydantic commandes
└── utils/
    ├── __init__.py
    ├── security.py        # JWT, hash passwords
    └── exceptions.py      # Exceptions personnalisées
```

## Architecture n-tier expliquée

1. **Couche API** (`api/`) : Routes FastAPI, validation des entrées
2. **Couche Service** (`services/`) : Logique métier, orchestration
3. **Couche Repository** (`repositories/`) : Accès aux données, requêtes SQL
4. **Couche Données** (`database/`) : Modèles SQLAlchemy, configuration DB

Cette architecture sépare clairement les responsabilités et facilite les tests et la maintenance.
