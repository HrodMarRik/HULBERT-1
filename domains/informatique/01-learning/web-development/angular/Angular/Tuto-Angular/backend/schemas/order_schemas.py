from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class OrderItemBase(BaseModel):
    """Schéma de base pour un élément de commande"""
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)

class OrderItemCreate(OrderItemBase):
    """Schéma pour créer un élément de commande"""
    pass

class OrderItem(OrderItemBase):
    """Schéma élément de commande pour les réponses API"""
    id: int
    total_price: float
    
    class Config:
        from_attributes = True

class OrderItemWithProduct(OrderItem):
    """Schéma élément de commande avec détails du produit"""
    product_name: str
    product_description: Optional[str] = None

class OrderBase(BaseModel):
    """Schéma de base pour une commande"""
    shipping_address: Optional[str] = None
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    """Schéma pour créer une commande"""
    items: List[OrderItemCreate] = Field(..., min_items=1)

class OrderUpdate(BaseModel):
    """Schéma pour mettre à jour une commande"""
    status: Optional[str] = Field(None, regex="^(pending|confirmed|shipped|delivered|cancelled)$")
    shipping_address: Optional[str] = None
    notes: Optional[str] = None

class OrderInDB(OrderBase):
    """Schéma commande en base de données"""
    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Order(OrderBase):
    """Schéma commande pour les réponses API"""
    id: int
    user_id: int
    total_amount: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class OrderWithItems(Order):
    """Schéma commande avec ses éléments"""
    items: List[OrderItemWithProduct] = []

class OrderWithUser(Order):
    """Schéma commande avec détails utilisateur"""
    user_username: str
    user_email: str

class OrderSummary(BaseModel):
    """Schéma résumé de commande"""
    id: int
    total_amount: float
    status: str
    item_count: int
    created_at: datetime

class OrderStats(BaseModel):
    """Schéma statistiques de commandes"""
    total_orders: int
    total_sales: float
    pending_orders: int
    confirmed_orders: int
    shipped_orders: int
    delivered_orders: int
    cancelled_orders: int
