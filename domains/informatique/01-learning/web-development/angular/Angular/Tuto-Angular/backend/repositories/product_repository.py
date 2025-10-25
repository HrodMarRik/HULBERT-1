from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List
from database.models import Product
from repositories.base_repository import BaseRepository
from schemas.product_schemas import ProductCreate, ProductUpdate

class ProductRepository(BaseRepository[Product, ProductCreate, ProductUpdate]):
    """
    Repository produit - Couche Accès Données
    Gère l'accès aux données produit
    """
    
    def __init__(self):
        super().__init__(Product)
    
    def get_by_category(self, db: Session, category: str, skip: int = 0, limit: int = 100) -> List[Product]:
        """Récupérer les produits par catégorie"""
        return db.query(Product).filter(
            and_(Product.category == category, Product.is_active == True)
        ).offset(skip).limit(limit).all()
    
    def search_products(self, db: Session, query: str, skip: int = 0, limit: int = 100) -> List[Product]:
        """Rechercher des produits par nom ou description"""
        return db.query(Product).filter(
            and_(
                Product.is_active == True,
                or_(
                    Product.name.ilike(f"%{query}%"),
                    Product.description.ilike(f"%{query}%")
                )
            )
        ).offset(skip).limit(limit).all()
    
    def get_active_products(self, db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
        """Récupérer les produits actifs"""
        return db.query(Product).filter(Product.is_active == True).offset(skip).limit(limit).all()
    
    def get_low_stock_products(self, db: Session, threshold: int = 10) -> List[Product]:
        """Récupérer les produits en rupture de stock"""
        return db.query(Product).filter(
            and_(
                Product.stock_quantity <= threshold,
                Product.is_active == True
            )
        ).all()
    
    def update_stock(self, db: Session, product_id: int, quantity_change: int) -> Optional[Product]:
        """Mettre à jour le stock d'un produit"""
        product = self.get(db, product_id)
        if product:
            product.stock_quantity += quantity_change
            if product.stock_quantity < 0:
                product.stock_quantity = 0
            db.commit()
            db.refresh(product)
        return product
    
    def get_categories(self, db: Session) -> List[str]:
        """Récupérer toutes les catégories distinctes"""
        categories = db.query(Product.category).filter(Product.is_active == True).distinct().all()
        return [category[0] for category in categories]
    
    def get_price_range_products(self, db: Session, min_price: float, max_price: float, skip: int = 0, limit: int = 100) -> List[Product]:
        """Récupérer les produits dans une fourchette de prix"""
        return db.query(Product).filter(
            and_(
                Product.price >= min_price,
                Product.price <= max_price,
                Product.is_active == True
            )
        ).offset(skip).limit(limit).all()
