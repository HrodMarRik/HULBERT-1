from sqlalchemy.orm import Session
from typing import Generic, TypeVar, Type, Optional, List
from pydantic import BaseModel

# Type générique pour les modèles
ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Repository de base - Couche Accès Données
    Implémente les opérations CRUD communes
    """
    
    def __init__(self, model: Type[ModelType]):
        self.model = model
    
    def get(self, db: Session, id: int) -> Optional[ModelType]:
        """Récupérer un élément par ID"""
        return db.query(self.model).filter(self.model.id == id).first()
    
    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Récupérer plusieurs éléments avec pagination"""
        return db.query(self.model).offset(skip).limit(limit).all()
    
    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        """Créer un nouvel élément"""
        obj_data = obj_in.model_dump() if hasattr(obj_in, 'model_dump') else obj_in.dict()
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(self, db: Session, db_obj: ModelType, obj_in: UpdateSchemaType) -> ModelType:
        """Mettre à jour un élément existant"""
        obj_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, 'model_dump') else obj_in.dict(exclude_unset=True)
        
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def delete(self, db: Session, id: int) -> Optional[ModelType]:
        """Supprimer un élément par ID"""
        obj = db.query(self.model).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
    
    def count(self, db: Session) -> int:
        """Compter le nombre total d'éléments"""
        return db.query(self.model).count()
    
    def exists(self, db: Session, id: int) -> bool:
        """Vérifier si un élément existe"""
        return db.query(self.model).filter(self.model.id == id).first() is not None
