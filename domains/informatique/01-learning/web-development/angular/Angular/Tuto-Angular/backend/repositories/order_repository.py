from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import Optional, List
from database.models import Order, OrderItem
from repositories.base_repository import BaseRepository
from schemas.order_schemas import OrderCreate, OrderUpdate

class OrderRepository(BaseRepository[Order, OrderCreate, OrderUpdate]):
    """
    Repository commande - Couche Accès Données
    Gère l'accès aux données commande
    """
    
    def __init__(self):
        super().__init__(Order)
    
    def get_user_orders(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
        """Récupérer les commandes d'un utilisateur"""
        return db.query(Order).filter(Order.user_id == user_id).order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    def get_orders_by_status(self, db: Session, status: str, skip: int = 0, limit: int = 100) -> List[Order]:
        """Récupérer les commandes par statut"""
        return db.query(Order).filter(Order.status == status).order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    def get_recent_orders(self, db: Session, days: int = 30, skip: int = 0, limit: int = 100) -> List[Order]:
        """Récupérer les commandes récentes"""
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        return db.query(Order).filter(Order.created_at >= cutoff_date).order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    def update_order_status(self, db: Session, order_id: int, status: str) -> Optional[Order]:
        """Mettre à jour le statut d'une commande"""
        order = self.get(db, order_id)
        if order:
            order.status = status
            db.commit()
            db.refresh(order)
        return order
    
    def get_order_with_items(self, db: Session, order_id: int) -> Optional[Order]:
        """Récupérer une commande avec ses éléments"""
        return db.query(Order).filter(Order.id == order_id).first()
    
    def get_total_sales(self, db: Session) -> float:
        """Calculer le total des ventes"""
        from sqlalchemy import func
        result = db.query(func.sum(Order.total_amount)).filter(Order.status.in_(["confirmed", "shipped", "delivered"])).scalar()
        return result or 0.0
    
    def get_monthly_sales(self, db: Session, year: int, month: int) -> float:
        """Calculer les ventes mensuelles"""
        from sqlalchemy import func
        from datetime import datetime
        
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        result = db.query(func.sum(Order.total_amount)).filter(
            and_(
                Order.created_at >= start_date,
                Order.created_at < end_date,
                Order.status.in_(["confirmed", "shipped", "delivered"])
            )
        ).scalar()
        
        return result or 0.0

class OrderItemRepository:
    """
    Repository élément de commande - Couche Accès Données
    """
    
    def create_order_item(self, db: Session, order_id: int, product_id: int, quantity: int, unit_price: float) -> OrderItem:
        """Créer un élément de commande"""
        total_price = quantity * unit_price
        order_item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price
        )
        db.add(order_item)
        db.commit()
        db.refresh(order_item)
        return order_item
    
    def get_order_items(self, db: Session, order_id: int) -> List[OrderItem]:
        """Récupérer les éléments d'une commande"""
        return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    def delete_order_items(self, db: Session, order_id: int) -> int:
        """Supprimer tous les éléments d'une commande"""
        deleted_count = db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
        db.commit()
        return deleted_count
