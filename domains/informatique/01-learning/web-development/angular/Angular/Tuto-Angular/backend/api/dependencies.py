from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User
from repositories.user_repository import UserRepository
from utils.security import verify_token
from utils.exceptions import UnauthorizedException, InactiveUserException

# Configuration du schéma d'authentification
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dépendance pour obtenir l'utilisateur actuel à partir du token JWT
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise UnauthorizedException("Token invalide")
    
    username: str = payload.get("sub")
    if username is None:
        raise UnauthorizedException("Token invalide")
    
    user_repo = UserRepository()
    user = user_repo.get_by_username(db, username=username)
    
    if user is None:
        raise UnauthorizedException("Utilisateur non trouvé")
    
    if not user.is_active:
        raise InactiveUserException()
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dépendance pour obtenir l'utilisateur actuel actif
    """
    if not current_user.is_active:
        raise InactiveUserException()
    return current_user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dépendance pour obtenir l'utilisateur administrateur actuel
    """
    if not current_user.is_admin:
        raise UnauthorizedException("Accès administrateur requis")
    return current_user

def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User | None:
    """
    Dépendance optionnelle pour obtenir l'utilisateur actuel
    Retourne None si aucun token ou token invalide
    """
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        if payload is None:
            return None
        
        username: str = payload.get("sub")
        if username is None:
            return None
        
        user_repo = UserRepository()
        user = user_repo.get_by_username(db, username=username)
        
        if user is None or not user.is_active:
            return None
        
        return user
    except:
        return None
