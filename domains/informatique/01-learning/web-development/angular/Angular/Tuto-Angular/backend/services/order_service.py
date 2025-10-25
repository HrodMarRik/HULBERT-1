from sqlalchemy.orm import Session
from typing import List, Optional
from database.models import Order, OrderItem, Product
from repositories.order_repository import OrderRepository, OrderItemRepository
from schemas.order_schemas import (
    OrderCreate, OrderUpdate, Order as OrderSchema, 
    OrderWithItems, OrderSummary, OrderStats
)
from services.product_service import ProductService
from utils.exceptions import OrderNotFoundException, InsufficientStockException
from datetime import datetime

class OrderService:
    """
    Service commande - Couche Métier
    Gère la logique métier des commandes
    """
    
    def __init__(self):
        self.order_repo = OrderRepository()
        self.order_item_repo = OrderItemRepository()
        self.product_service = ProductService()
    
    def get_order(self, db: Session, order_id: int, user_id: int) -> OrderSchema:
        """
        Obtenir une commande par ID pour un utilisateur spécifique
        """
        order = self.order_repo.get(db, order_id)
        if not order:
            raise OrderNotFoundException(order_id)
        
        # Vérifier que l'utilisateur peut accéder à cette commande
        if order.user_id != user_id:
            raise OrderNotFoundException(order_id)
        
        return OrderSchema.model_validate(order)
    
    def get_order_with_items(self, db: Session, order_id: int, user_id: int) -> OrderWithItems:
        """
        Obtenir une commande avec ses éléments
        """
        order = self.order_repo.get_order_with_items(db, order_id)
        if not order:
            raise OrderNotFoundException(order_id)
        
        # Vérifier que l'utilisateur peut accéder à cette commande
        if order.user_id != user_id:
            raise OrderNotFoundException(order_id)
        
        # Construire la réponse avec les détails des produits
        order_with_items = OrderWithItems.model_validate(order)
        order_with_items.items = []
        
        for item in order.order_items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            item_with_product = {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
                "product_name": product.name if product else "Produit supprimé",
                "product_description": product.description if product else None
            }
            order_with_items.items.append(item_with_product)
        
        return order_with_items
    
    def get_user_orders(self, db: Session, user_id: int, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[OrderSchema]:
        """
        Obtenir les commandes d'un utilisateur
        """
        if status:
            orders = self.order_repo.get_orders_by_status(db, status)
            # Filtrer par utilisateur
            orders = [order for order in orders if order.user_id == user_id]
            orders = orders[skip:skip+limit]
        else:
            orders = self.order_repo.get_user_orders(db, user_id, skip, limit)
        
        return [OrderSchema.model_validate(order) for order in orders]
    
    def get_all_orders(self, db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[OrderSchema]:
        """
        Obtenir toutes les commandes (admin)
        """
        if status:
            orders = self.order_repo.get_orders_by_status(db, status)
            orders = orders[skip:skip+limit]
        else:
            orders = self.order_repo.get_multi(db, skip, limit)
        
        return [OrderSchema.model_validate(order) for order in orders]
    
    def create_order(self, db: Session, order_data: OrderCreate, user_id: int) -> OrderSchema:
        """
        Créer une nouvelle commande
        """
        # Calculer le montant total et vérifier le stock
        total_amount = 0.0
        order_items_data = []
        
        for item_data in order_data.items:
            # Vérifier que le produit existe et est disponible
            product = self.product_service.get_product(db, item_data.product_id)
            
            # Vérifier le stock
            if product.stock_quantity < item_data.quantity:
                raise InsufficientStockException(
                    product.name, item_data.quantity, product.stock_quantity
                )
            
            # Calculer le prix total de l'élément
            item_total = item_data.quantity * item_data.unit_price
            total_amount += item_total
            
            order_items_data.append({
                "product_id": item_data.product_id,
                "quantity": item_data.quantity,
                "unit_price": item_data.unit_price,
                "total_price": item_total
            })
        
        # Créer la commande
        order_create_data = OrderCreate(
            shipping_address=order_data.shipping_address,
            notes=order_data.notes,
            items=[]  # Les éléments seront créés séparément
        )
        
        # Créer la commande avec le montant total calculé
        order_data_dict = order_create_data.model_dump()
        order_data_dict.update({
            "user_id": user_id,
            "total_amount": total_amount,
            "status": "pending"
        })
        
        # Créer la commande en base
        order = Order(**order_data_dict)
        db.add(order)
        db.commit()
        db.refresh(order)
        
        # Créer les éléments de commande et réserver le stock
        for item_data in order_items_data:
            # Créer l'élément de commande
            order_item = self.order_item_repo.create_order_item(
                db, order.id, item_data["product_id"], 
                item_data["quantity"], item_data["unit_price"]
            )
            
            # Réserver le stock
            self.product_service.reserve_stock(db, item_data["product_id"], item_data["quantity"])
        
        return OrderSchema.model_validate(order)
    
    def update_order(self, db: Session, order_id: int, order_update: OrderUpdate, user_id: int) -> OrderSchema:
        """
        Mettre à jour une commande
        """
        order = self.order_repo.get(db, order_id)
        if not order:
            raise OrderNotFoundException(order_id)
        
        # Vérifier que l'utilisateur peut modifier cette commande
        if order.user_id != user_id:
            raise OrderNotFoundException(order_id)
        
        # Vérifier que la commande peut être modifiée
        if order.status not in ["pending"]:
            raise OrderNotFoundException(order_id)  # Commande non modifiable
        
        updated_order = self.order_repo.update(db, order, order_update)
        return OrderSchema.model_validate(updated_order)
    
    def update_order_status(self, db: Session, order_id: int, status: str) -> OrderSchema:
        """
        Mettre à jour le statut d'une commande (admin)
        """
        order = self.order_repo.get(db, order_id)
        if not order:
            raise OrderNotFoundException(order_id)
        
        updated_order = self.order_repo.update_order_status(db, order_id, status)
        return OrderSchema.model_validate(updated_order)
    
    def cancel_order(self, db: Session, order_id: int, user_id: int) -> None:
        """
        Annuler une commande
        """
        order = self.order_repo.get(db, order_id)
        if not order:
            raise OrderNotFoundException(order_id)
        
        # Vérifier que l'utilisateur peut annuler cette commande
        if order.user_id != user_id:
            raise OrderNotFoundException(order_id)
        
        # Vérifier que la commande peut être annulée
        if order.status not in ["pending", "confirmed"]:
            raise OrderNotFoundException(order_id)  # Commande non annulable
        
        # Libérer le stock réservé
        for item in order.order_items:
            self.product_service.release_stock(db, item.product_id, item.quantity)
        
        # Mettre à jour le statut
        self.order_repo.update_order_status(db, order_id, "cancelled")
    
    def get_user_orders_summary(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[OrderSummary]:
        """
        Obtenir le résumé des commandes d'un utilisateur
        """
        orders = self.order_repo.get_user_orders(db, user_id, skip, limit)
        
        summaries = []
        for order in orders:
            item_count = len(order.order_items)
            summary = OrderSummary(
                id=order.id,
                total_amount=order.total_amount,
                status=order.status,
                item_count=item_count,
                created_at=order.created_at
            )
            summaries.append(summary)
        
        return summaries
    
    def get_order_stats(self, db: Session) -> OrderStats:
        """
        Obtenir les statistiques des commandes
        """
        total_orders = self.order_repo.count(db)
        total_sales = self.order_repo.get_total_sales(db)
        
        # Compter par statut
        pending_orders = len(self.order_repo.get_orders_by_status(db, "pending"))
        confirmed_orders = len(self.order_repo.get_orders_by_status(db, "confirmed"))
        shipped_orders = len(self.order_repo.get_orders_by_status(db, "shipped"))
        delivered_orders = len(self.order_repo.get_orders_by_status(db, "delivered"))
        cancelled_orders = len(self.order_repo.get_orders_by_status(db, "cancelled"))
        
        return OrderStats(
            total_orders=total_orders,
            total_sales=total_sales,
            pending_orders=pending_orders,
            confirmed_orders=confirmed_orders,
            shipped_orders=shipped_orders,
            delivered_orders=delivered_orders,
            cancelled_orders=cancelled_orders
        )
