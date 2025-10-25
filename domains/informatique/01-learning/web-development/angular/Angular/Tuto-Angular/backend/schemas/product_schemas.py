from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    """Schéma de base pour un produit"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=50)
    stock_quantity: int = Field(0, ge=0)

class ProductCreate(ProductBase):
    """Schéma pour créer un produit"""
    pass

class ProductUpdate(BaseModel):
    """Schéma pour mettre à jour un produit"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    stock_quantity: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class ProductInDB(ProductBase):
    """Schéma produit en base de données"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Product(ProductBase):
    """Schéma produit pour les réponses API"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProductSearch(BaseModel):
    """Schéma pour la recherche de produits"""
    query: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, gt=0)
    skip: int = Field(0, ge=0)
    limit: int = Field(100, ge=1, le=1000)

class ProductStockUpdate(BaseModel):
    """Schéma pour mettre à jour le stock"""
    quantity_change: int
