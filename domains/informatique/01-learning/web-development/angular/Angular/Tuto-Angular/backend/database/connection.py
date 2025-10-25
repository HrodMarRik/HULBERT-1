from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv("config.env")

# Configuration de la base de données
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tutorial.db")

# Créer le moteur de base de données
if DATABASE_URL.startswith("sqlite"):
    # Configuration pour SQLite (développement)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # Configuration pour PostgreSQL (production)
    engine = create_engine(DATABASE_URL)

# Créer la session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base pour les modèles
Base = declarative_base()

# Métadonnées pour les migrations
metadata = MetaData()

def get_db():
    """
    Générateur de session de base de données pour FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """
    Créer toutes les tables dans la base de données
    """
    Base.metadata.create_all(bind=engine)
