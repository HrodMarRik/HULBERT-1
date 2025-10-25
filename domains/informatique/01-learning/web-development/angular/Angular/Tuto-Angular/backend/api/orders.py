from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User
from repositories.order_repository import OrderRepository, OrderItemRepository
from schemas.order_schemas import (
    OrderCreate, OrderUpdate, Order as OrderSchema, 
    OrderWithItems, OrderSummary, OrderStats
)
from services.order_service import OrderService
from api.dependencies import get_current_user, get_current_admin_user
from utils.exceptions import OrderNotFoundException, InsufficientStockException

# Créer le routeur
router = APIRouter()

# Services
order_service = OrderService()

@router.get("/", response_model=list[OrderSchema])
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir les commandes de l'utilisateur actuel
    """
    orders = order_service.get_user_orders(db, current_user.id, skip, limit, status)
    return orders

@router.get("/admin", response_model=list[OrderSchema])
async def get_all_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: str = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir toutes les commandes (admin seulement)
    """
    orders = order_service.get_all_orders(db, skip, limit, status)
    return orders

@router.get("/stats", response_model=OrderStats)
async def get_order_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir les statistiques des commandes (admin seulement)
    """
    stats = order_service.get_order_stats(db)
    return stats

@router.get("/{order_id}", response_model=OrderWithItems)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir une commande par ID avec ses éléments
    """
    try:
        order = order_service.get_order_with_items(db, order_id, current_user.id)
        return order
    except OrderNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.post("/", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Créer une nouvelle commande
    """
    try:
        order = order_service.create_order(db, order_data, current_user.id)
        return order
    except InsufficientStockException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.put("/{order_id}", response_model=OrderSchema)
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour une commande
    """
    try:
        updated_order = order_service.update_order(db, order_id, order_update, current_user.id)
        return updated_order
    except OrderNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.patch("/{order_id}/status", response_model=OrderSchema)
async def update_order_status(
    order_id: int,
    status: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour le statut d'une commande (admin seulement)
    """
    try:
        updated_order = order_service.update_order_status(db, order_id, status)
        return updated_order
    except OrderNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.delete("/{order_id}")
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Annuler une commande
    """
    try:
        order_service.cancel_order(db, order_id, current_user.id)
        return {"message": "Commande annulée avec succès"}
    except OrderNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.get("/user/{user_id}", response_model=list[OrderSummary])
async def get_user_orders_summary(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir le résumé des commandes d'un utilisateur (admin seulement)
    """
    orders = order_service.get_user_orders_summary(db, user_id, skip, limit)
    return orders
