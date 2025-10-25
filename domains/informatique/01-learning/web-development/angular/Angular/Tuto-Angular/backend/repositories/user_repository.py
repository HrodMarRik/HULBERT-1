from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from database.models import User
from repositories.base_repository import BaseRepository
from schemas.user_schemas import UserCreate, UserUpdate

class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    """
    Repository utilisateur - Couche Accès Données
    Gère l'accès aux données utilisateur
    """
    
    def __init__(self):
        super().__init__(User)
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """Récupérer un utilisateur par email"""
        return db.query(User).filter(User.email == email).first()
    
    def get_by_username(self, db: Session, username: str) -> Optional[User]:
        """Récupérer un utilisateur par nom d'utilisateur"""
        return db.query(User).filter(User.username == username).first()
    
    def search_users(self, db: Session, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """Rechercher des utilisateurs par nom ou email"""
        return db.query(User).filter(
            or_(
                User.first_name.ilike(f"%{query}%"),
                User.last_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
                User.username.ilike(f"%{query}%")
            )
        ).offset(skip).limit(limit).all()
    
    def get_active_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Récupérer les utilisateurs actifs"""
        return db.query(User).filter(User.is_active == True).offset(skip).limit(limit).all()
    
    def get_admin_users(self, db: Session) -> List[User]:
        """Récupérer les utilisateurs administrateurs"""
        return db.query(User).filter(User.is_admin == True).all()
    
    def update_password(self, db: Session, user_id: int, hashed_password: str) -> Optional[User]:
        """Mettre à jour le mot de passe d'un utilisateur"""
        user = self.get(db, user_id)
        if user:
            user.hashed_password = hashed_password
            db.commit()
            db.refresh(user)
        return user
    
    def deactivate_user(self, db: Session, user_id: int) -> Optional[User]:
        """Désactiver un utilisateur"""
        user = self.get(db, user_id)
        if user:
            user.is_active = False
            db.commit()
            db.refresh(user)
        return user
    
    def activate_user(self, db: Session, user_id: int) -> Optional[User]:
        """Activer un utilisateur"""
        user = self.get(db, user_id)
        if user:
            user.is_active = True
            db.commit()
            db.refresh(user)
        return user
