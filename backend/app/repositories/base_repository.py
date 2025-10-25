"""
Base Repository Pattern
Fournit les opérations CRUD génériques pour tous les repositories
"""
from typing import TypeVar, Generic, Type, Optional, List, Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from ..db import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Repository de base avec opérations CRUD génériques"""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get_by_id(self, id: int) -> Optional[ModelType]:
        """Récupérer une entité par ID"""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None
    ) -> List[ModelType]:
        """Récupérer toutes les entités avec pagination et filtres"""
        query = self.db.query(self.model)
        
        # Appliquer les filtres
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        
        # Appliquer le tri
        if order_by and hasattr(self.model, order_by):
            query = query.order_by(getattr(self.model, order_by))
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, obj: ModelType) -> ModelType:
        """Créer une nouvelle entité"""
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def update(self, id: int, data: Dict[str, Any]) -> Optional[ModelType]:
        """Mettre à jour une entité"""
        obj = self.get_by_id(id)
        if not obj:
            return None
        
        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def delete(self, id: int) -> bool:
        """Supprimer une entité (soft delete si possible)"""
        obj = self.get_by_id(id)
        if not obj:
            return False
        
        # Soft delete si le modèle a un champ deleted_at
        if hasattr(obj, 'deleted_at'):
            from datetime import datetime
            obj.deleted_at = datetime.utcnow()
            self.db.commit()
        else:
            self.db.delete(obj)
            self.db.commit()
        
        return True
    
    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Compter le nombre d'entités"""
        query = self.db.query(self.model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        
        return query.count()
    
    def exists(self, id: int) -> bool:
        """Vérifier si une entité existe"""
        return self.db.query(self.model).filter(self.model.id == id).count() > 0
    
    def get_by_field(self, field: str, value: Any) -> Optional[ModelType]:
        """Récupérer une entité par un champ spécifique"""
        if not hasattr(self.model, field):
            return None
        return self.db.query(self.model).filter(getattr(self.model, field) == value).first()
    
    def get_many_by_field(
        self, 
        field: str, 
        value: Any,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """Récupérer plusieurs entités par un champ spécifique"""
        if not hasattr(self.model, field):
            return []
        return (
            self.db.query(self.model)
            .filter(getattr(self.model, field) == value)
            .offset(skip)
            .limit(limit)
            .all()
        )

