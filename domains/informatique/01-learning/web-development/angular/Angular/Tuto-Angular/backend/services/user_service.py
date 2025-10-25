from sqlalchemy.orm import Session
from typing import List, Optional
from database.models import User
from repositories.user_repository import UserRepository
from schemas.user_schemas import UserCreate, UserUpdate, User as UserSchema
from utils.exceptions import UserNotFoundException, UserAlreadyExistsException

class UserService:
    """
    Service utilisateur - Couche Métier
    Gère la logique métier des utilisateurs
    """
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def get_user(self, db: Session, user_id: int) -> UserSchema:
        """
        Obtenir un utilisateur par ID
        """
        user = self.user_repo.get(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        return UserSchema.model_validate(user)
    
    def get_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[UserSchema]:
        """
        Obtenir la liste des utilisateurs avec pagination
        """
        users = self.user_repo.get_multi(db, skip=skip, limit=limit)
        return [UserSchema.model_validate(user) for user in users]
    
    def create_user(self, db: Session, user_data: UserCreate) -> UserSchema:
        """
        Créer un nouvel utilisateur
        """
        # Vérifier si l'utilisateur existe déjà
        existing_user = self.user_repo.get_by_email(db, user_data.email)
        if existing_user:
            raise UserAlreadyExistsException("email", user_data.email)
        
        existing_user = self.user_repo.get_by_username(db, user_data.username)
        if existing_user:
            raise UserAlreadyExistsException("username", user_data.username)
        
        user = self.user_repo.create(db, user_data)
        return UserSchema.model_validate(user)
    
    def update_user(self, db: Session, user_id: int, user_update: UserUpdate) -> UserSchema:
        """
        Mettre à jour un utilisateur
        """
        user = self.user_repo.get(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        
        # Vérifier les conflits d'email si l'email est modifié
        if user_update.email and user_update.email != user.email:
            existing_user = self.user_repo.get_by_email(db, user_update.email)
            if existing_user:
                raise UserAlreadyExistsException("email", user_update.email)
        
        # Vérifier les conflits de nom d'utilisateur si le nom est modifié
        if user_update.username and user_update.username != user.username:
            existing_user = self.user_repo.get_by_username(db, user_update.username)
            if existing_user:
                raise UserAlreadyExistsException("username", user_update.username)
        
        updated_user = self.user_repo.update(db, user, user_update)
        return UserSchema.model_validate(updated_user)
    
    def delete_user(self, db: Session, user_id: int) -> None:
        """
        Supprimer un utilisateur
        """
        user = self.user_repo.get(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        
        self.user_repo.delete(db, user_id)
    
    def search_users(self, db: Session, query: str, skip: int = 0, limit: int = 100) -> List[UserSchema]:
        """
        Rechercher des utilisateurs
        """
        users = self.user_repo.search_users(db, query, skip, limit)
        return [UserSchema.model_validate(user) for user in users]
    
    def get_active_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[UserSchema]:
        """
        Obtenir les utilisateurs actifs
        """
        users = self.user_repo.get_active_users(db, skip, limit)
        return [UserSchema.model_validate(user) for user in users]
    
    def activate_user(self, db: Session, user_id: int) -> UserSchema:
        """
        Activer un utilisateur
        """
        user = self.user_repo.get(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        
        activated_user = self.user_repo.activate_user(db, user_id)
        return UserSchema.model_validate(activated_user)
    
    def deactivate_user(self, db: Session, user_id: int) -> UserSchema:
        """
        Désactiver un utilisateur
        """
        user = self.user_repo.get(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        
        deactivated_user = self.user_repo.deactivate_user(db, user_id)
        return UserSchema.model_validate(deactivated_user)
    
    def get_user_stats(self, db: Session) -> dict:
        """
        Obtenir les statistiques des utilisateurs
        """
        total_users = self.user_repo.count(db)
        active_users = len(self.user_repo.get_active_users(db, limit=1000))
        admin_users = len(self.user_repo.get_admin_users(db))
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "admin_users": admin_users,
            "regular_users": active_users - admin_users
        }
