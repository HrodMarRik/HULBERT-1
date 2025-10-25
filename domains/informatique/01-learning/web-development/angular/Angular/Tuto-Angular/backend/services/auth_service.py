from sqlalchemy.orm import Session
from typing import Optional, List
from database.models import User
from repositories.user_repository import UserRepository
from schemas.user_schemas import UserCreate, UserUpdate, User as UserSchema, UserLogin, Token, UserPasswordChange
from utils.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from utils.exceptions import UserAlreadyExistsException, UserNotFoundException, InvalidCredentialsException
from datetime import timedelta

class AuthService:
    """
    Service d'authentification - Couche Métier
    Gère l'authentification et l'autorisation
    """
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def register_user(self, db: Session, user_data: UserCreate) -> UserSchema:
        """
        Enregistrer un nouvel utilisateur
        """
        # Vérifier si l'utilisateur existe déjà
        existing_user = self.user_repo.get_by_email(db, user_data.email)
        if existing_user:
            raise UserAlreadyExistsException("email", user_data.email)
        
        existing_user = self.user_repo.get_by_username(db, user_data.username)
        if existing_user:
            raise UserAlreadyExistsException("username", user_data.username)
        
        # Hacher le mot de passe
        hashed_password = get_password_hash(user_data.password)
        
        # Créer l'utilisateur
        user_create_data = UserCreate(
            username=user_data.username,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
        user_create_data.hashed_password = hashed_password
        
        user = self.user_repo.create(db, user_create_data)
        return UserSchema.model_validate(user)
    
    def login_user(self, db: Session, user_credentials: UserLogin) -> Token:
        """
        Connexion utilisateur
        """
        # Trouver l'utilisateur
        user = self.user_repo.get_by_username(db, user_credentials.username)
        if not user:
            raise InvalidCredentialsException()
        
        # Vérifier le mot de passe
        if not verify_password(user_credentials.password, user.hashed_password):
            raise InvalidCredentialsException()
        
        # Vérifier si l'utilisateur est actif
        if not user.is_active:
            raise InvalidCredentialsException()
        
        # Créer le token d'accès
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        # Créer le token de rafraîchissement
        refresh_token = create_refresh_token(data={"sub": user.username})
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=access_token_expires.seconds
        )
    
    def change_password(self, db: Session, user_id: int, password_data: UserPasswordChange) -> None:
        """
        Changer le mot de passe d'un utilisateur
        """
        user = self.user_repo.get(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        
        # Vérifier l'ancien mot de passe
        if not verify_password(password_data.current_password, user.hashed_password):
            raise InvalidCredentialsException()
        
        # Hacher le nouveau mot de passe
        new_hashed_password = get_password_hash(password_data.new_password)
        
        # Mettre à jour le mot de passe
        self.user_repo.update_password(db, user_id, new_hashed_password)
    
    def verify_token(self, token: str) -> Optional[User]:
        """
        Vérifier un token et retourner l'utilisateur
        """
        from utils.security import verify_token as verify_jwt_token
        
        payload = verify_jwt_token(token)
        if payload is None:
            return None
        
        username: str = payload.get("sub")
        if username is None:
            return None
        
        # Note: Cette méthode nécessite une session DB, 
        # mais pour simplifier, on retourne None
        # Dans un vrai projet, vous devriez passer la session DB
        return None
