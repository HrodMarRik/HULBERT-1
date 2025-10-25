from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv("config.env")

# Import des dépendances
from database.connection import get_db, create_tables
from api.auth import router as auth_router
from api.users import router as users_router
from api.products import router as products_router
from api.orders import router as orders_router

# Configuration CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:4200").split(",")

# Créer l'application FastAPI
app = FastAPI(
    title=os.getenv("APP_NAME", "Angular Tutorial API"),
    version=os.getenv("APP_VERSION", "1.0.0"),
    description="API REST pour le tutoriel Angular avec architecture n-tier",
    debug=os.getenv("DEBUG", "False").lower() == "true"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Créer les tables au démarrage
@app.on_event("startup")
async def startup_event():
    create_tables()

# Routes de base
@app.get("/")
async def root():
    """Point d'entrée de l'API"""
    return {
        "message": "API Angular Tutorial",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Vérification de l'état de l'API"""
    return {"status": "healthy", "message": "API is running"}

# Inclure les routeurs
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(products_router, prefix="/api/products", tags=["Products"])
app.include_router(orders_router, prefix="/api/orders", tags=["Orders"])

# Gestionnaire d'erreurs global
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
