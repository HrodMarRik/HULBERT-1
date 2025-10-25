from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User
from repositories.user_repository import UserRepository
from schemas.user_schemas import UserCreate, UserUpdate, User as UserSchema, UserLogin, Token, UserPasswordChange
from services.auth_service import AuthService
from services.user_service import UserService
from api.dependencies import get_current_user, get_current_admin_user
from utils.exceptions import UserAlreadyExistsException, UserNotFoundException, InvalidCredentialsException

# Créer le routeur
router = APIRouter()

# Services
auth_service = AuthService()
user_service = UserService()

@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Enregistrer un nouvel utilisateur
    """
    try:
        user = auth_service.register_user(db, user_data)
        return user
    except UserAlreadyExistsException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Connexion utilisateur
    """
    try:
        token_data = auth_service.login_user(db, user_credentials)
        return token_data
    except InvalidCredentialsException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.get("/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Obtenir les informations de l'utilisateur actuel
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour les informations de l'utilisateur actuel
    """
    try:
        updated_user = user_service.update_user(db, current_user.id, user_update)
        return updated_user
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.post("/change-password")
async def change_password(
    password_data: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Changer le mot de passe de l'utilisateur actuel
    """
    try:
        auth_service.change_password(db, current_user.id, password_data)
        return {"message": "Mot de passe modifié avec succès"}
    except InvalidCredentialsException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.post("/logout")
async def logout_user():
    """
    Déconnexion utilisateur (côté client)
    """
    return {"message": "Déconnexion réussie"}

@router.get("/users", response_model=list[UserSchema])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir tous les utilisateurs (admin seulement)
    """
    users = user_service.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/users/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir un utilisateur par ID (admin seulement)
    """
    try:
        user = user_service.get_user(db, user_id)
        return user
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour un utilisateur par ID (admin seulement)
    """
    try:
        updated_user = user_service.update_user(db, user_id, user_update)
        return updated_user
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Supprimer un utilisateur par ID (admin seulement)
    """
    try:
        user_service.delete_user(db, user_id)
        return {"message": "Utilisateur supprimé avec succès"}
    except UserNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
