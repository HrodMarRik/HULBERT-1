from sqlalchemy.orm import Session
from typing import List, Optional
from database.models import Product
from repositories.product_repository import ProductRepository
from schemas.product_schemas import ProductCreate, ProductUpdate, Product as ProductSchema, ProductSearch
from utils.exceptions import ProductNotFoundException, InsufficientStockException

class ProductService:
    """
    Service produit - Couche Métier
    Gère la logique métier des produits
    """
    
    def __init__(self):
        self.product_repo = ProductRepository()
    
    def get_product(self, db: Session, product_id: int) -> ProductSchema:
        """
        Obtenir un produit par ID
        """
        product = self.product_repo.get(db, product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        return ProductSchema.model_validate(product)
    
    def get_products(self, db: Session, skip: int = 0, limit: int = 100) -> List[ProductSchema]:
        """
        Obtenir la liste des produits avec pagination
        """
        products = self.product_repo.get_multi(db, skip=skip, limit=limit)
        return [ProductSchema.model_validate(product) for product in products]
    
    def create_product(self, db: Session, product_data: ProductCreate) -> ProductSchema:
        """
        Créer un nouveau produit
        """
        product = self.product_repo.create(db, product_data)
        return ProductSchema.model_validate(product)
    
    def update_product(self, db: Session, product_id: int, product_update: ProductUpdate) -> ProductSchema:
        """
        Mettre à jour un produit
        """
        product = self.product_repo.get(db, product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        
        updated_product = self.product_repo.update(db, product, product_update)
        return ProductSchema.model_validate(updated_product)
    
    def delete_product(self, db: Session, product_id: int) -> None:
        """
        Supprimer un produit (soft delete - désactivation)
        """
        product = self.product_repo.get(db, product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        
        # Soft delete - désactiver le produit au lieu de le supprimer
        product_update = ProductUpdate(is_active=False)
        self.product_repo.update(db, product, product_update)
    
    def search_products(self, db: Session, search_params: ProductSearch) -> List[ProductSchema]:
        """
        Rechercher des produits avec filtres
        """
        if search_params.query:
            products = self.product_repo.search_products(
                db, search_params.query, search_params.skip, search_params.limit
            )
        elif search_params.category:
            products = self.product_repo.get_by_category(
                db, search_params.category, search_params.skip, search_params.limit
            )
        elif search_params.min_price is not None and search_params.max_price is not None:
            products = self.product_repo.get_price_range_products(
                db, search_params.min_price, search_params.max_price, 
                search_params.skip, search_params.limit
            )
        else:
            products = self.product_repo.get_active_products(
                db, search_params.skip, search_params.limit
            )
        
        return [ProductSchema.model_validate(product) for product in products]
    
    def get_products_by_category(self, db: Session, category: str, skip: int = 0, limit: int = 100) -> List[ProductSchema]:
        """
        Obtenir les produits par catégorie
        """
        products = self.product_repo.get_by_category(db, category, skip, limit)
        return [ProductSchema.model_validate(product) for product in products]
    
    def get_categories(self, db: Session) -> List[str]:
        """
        Obtenir toutes les catégories
        """
        return self.product_repo.get_categories(db)
    
    def update_stock(self, db: Session, product_id: int, quantity_change: int) -> ProductSchema:
        """
        Mettre à jour le stock d'un produit
        """
        product = self.product_repo.get(db, product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        
        # Vérifier si la réduction de stock est possible
        if quantity_change < 0 and product.stock_quantity + quantity_change < 0:
            raise InsufficientStockException(
                product.name, 
                abs(quantity_change), 
                product.stock_quantity
            )
        
        updated_product = self.product_repo.update_stock(db, product_id, quantity_change)
        return ProductSchema.model_validate(updated_product)
    
    def get_low_stock_products(self, db: Session, threshold: int = 10) -> List[ProductSchema]:
        """
        Obtenir les produits en rupture de stock
        """
        products = self.product_repo.get_low_stock_products(db, threshold)
        return [ProductSchema.model_validate(product) for product in products]
    
    def get_product_stats(self, db: Session) -> dict:
        """
        Obtenir les statistiques des produits
        """
        total_products = self.product_repo.count(db)
        active_products = len(self.product_repo.get_active_products(db, limit=10000))
        low_stock_products = len(self.product_repo.get_low_stock_products(db, 10))
        categories = self.product_repo.get_categories(db)
        
        return {
            "total_products": total_products,
            "active_products": active_products,
            "inactive_products": total_products - active_products,
            "low_stock_products": low_stock_products,
            "total_categories": len(categories),
            "categories": categories
        }
    
    def reserve_stock(self, db: Session, product_id: int, quantity: int) -> ProductSchema:
        """
        Réserver du stock pour une commande
        """
        product = self.product_repo.get(db, product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        
        if product.stock_quantity < quantity:
            raise InsufficientStockException(
                product.name, quantity, product.stock_quantity
            )
        
        # Réserver le stock (réduction temporaire)
        updated_product = self.product_repo.update_stock(db, product_id, -quantity)
        return ProductSchema.model_validate(updated_product)
    
    def release_stock(self, db: Session, product_id: int, quantity: int) -> ProductSchema:
        """
        Libérer du stock réservé
        """
        product = self.product_repo.get(db, product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        
        # Libérer le stock (augmentation)
        updated_product = self.product_repo.update_stock(db, product_id, quantity)
        return ProductSchema.model_validate(updated_product)
