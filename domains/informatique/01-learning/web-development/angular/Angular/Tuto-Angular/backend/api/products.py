from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database.connection import get_db
from database.models import User
from repositories.product_repository import ProductRepository
from schemas.product_schemas import (
    ProductCreate, ProductUpdate, Product as ProductSchema, 
    ProductSearch, ProductStockUpdate
)
from services.product_service import ProductService
from api.dependencies import get_current_user, get_current_admin_user, get_optional_current_user
from utils.exceptions import ProductNotFoundException, InsufficientStockException

# Créer le routeur
router = APIRouter()

# Services
product_service = ProductService()

@router.get("/", response_model=list[ProductSchema])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: str = Query(None),
    search: str = Query(None),
    min_price: float = Query(None, ge=0),
    max_price: float = Query(None, gt=0),
    db: Session = Depends(get_db)
):
    """
    Obtenir la liste des produits avec filtres
    """
    search_params = ProductSearch(
        query=search,
        category=category,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=limit
    )
    
    products = product_service.search_products(db, search_params)
    return products

@router.get("/categories", response_model=list[str])
async def get_categories(db: Session = Depends(get_db)):
    """
    Obtenir toutes les catégories de produits
    """
    categories = product_service.get_categories(db)
    return categories

@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtenir un produit par ID
    """
    try:
        product = product_service.get_product(db, product_id)
        return product
    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau produit (admin seulement)
    """
    product = product_service.create_product(db, product_data)
    return product

@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour un produit (admin seulement)
    """
    try:
        updated_product = product_service.update_product(db, product_id, product_update)
        return updated_product
    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Supprimer un produit (admin seulement)
    """
    try:
        product_service.delete_product(db, product_id)
        return {"message": "Produit supprimé avec succès"}
    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.patch("/{product_id}/stock", response_model=ProductSchema)
async def update_product_stock(
    product_id: int,
    stock_update: ProductStockUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Mettre à jour le stock d'un produit (admin seulement)
    """
    try:
        updated_product = product_service.update_stock(
            db, product_id, stock_update.quantity_change
        )
        return updated_product
    except ProductNotFoundException as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )

@router.get("/low-stock/list", response_model=list[ProductSchema])
async def get_low_stock_products(
    threshold: int = Query(10, ge=0),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtenir les produits en rupture de stock (admin seulement)
    """
    products = product_service.get_low_stock_products(db, threshold)
    return products

@router.get("/category/{category}", response_model=list[ProductSchema])
async def get_products_by_category(
    category: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Obtenir les produits par catégorie
    """
    products = product_service.get_products_by_category(db, category, skip, limit)
    return products
