import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.dependencies import get_current_user
from app.services.portfolio_management_service import PortfolioManagementService
from app.schemas import (
    PortfolioAssetCreate, PortfolioAssetUpdate, PortfolioAssetResponse,
    PortfolioTransactionCreate, PortfolioTransactionUpdate, PortfolioTransactionResponse,
    PortfolioPriceHistoryResponse, PortfolioSummaryResponse, PortfolioPerformanceResponse
)

router = APIRouter(prefix="/api/portfolio-management", tags=["Portfolio Management"])
logger = logging.getLogger(__name__)


# --- Assets ---
@router.post("/assets", response_model=PortfolioAssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset: PortfolioAssetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouvel actif"""
    service = PortfolioManagementService(db)
    try:
        db_asset = service.create_asset(asset, current_user.id)
        return db_asset
    except Exception as e:
        logger.error(f"Error creating asset: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/assets", response_model=List[PortfolioAssetResponse])
def get_assets(
    asset_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des actifs"""
    service = PortfolioManagementService(db)
    assets = service.get_assets(current_user.id, asset_type=asset_type)
    return assets


@router.get("/assets/{asset_id}", response_model=PortfolioAssetResponse)
def get_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir un actif"""
    service = PortfolioManagementService(db)
    asset = service.get_asset(asset_id, current_user.id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return asset


@router.patch("/assets/{asset_id}", response_model=PortfolioAssetResponse)
def update_asset(
    asset_id: int,
    asset: PortfolioAssetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un actif"""
    service = PortfolioManagementService(db)
    updated_asset = service.update_asset(asset_id, asset, current_user.id)
    if not updated_asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return updated_asset


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un actif"""
    service = PortfolioManagementService(db)
    success = service.delete_asset(asset_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")


@router.post("/assets/{asset_id}/update-price", response_model=PortfolioAssetResponse)
def update_asset_price(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour le prix d'un actif"""
    service = PortfolioManagementService(db)
    updated_asset = service.update_asset_price(asset_id, current_user.id)
    if not updated_asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found or price update failed")
    return updated_asset


# --- Transactions ---
@router.post("/transactions", response_model=PortfolioTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: PortfolioTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une transaction"""
    service = PortfolioManagementService(db)
    try:
        db_transaction = service.create_transaction(transaction, current_user.id)
        return db_transaction
    except Exception as e:
        logger.error(f"Error creating transaction: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/transactions", response_model=List[PortfolioTransactionResponse])
def get_transactions(
    asset_id: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste des transactions"""
    service = PortfolioManagementService(db)
    transactions = service.get_transactions(current_user.id, asset_id=asset_id, limit=limit)
    return transactions


@router.get("/transactions/{transaction_id}", response_model=PortfolioTransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir une transaction"""
    service = PortfolioManagementService(db)
    transaction = service.get_transaction(transaction_id, current_user.id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


@router.patch("/transactions/{transaction_id}", response_model=PortfolioTransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction: PortfolioTransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour une transaction"""
    service = PortfolioManagementService(db)
    updated_transaction = service.update_transaction(transaction_id, transaction, current_user.id)
    if not updated_transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return updated_transaction


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une transaction"""
    service = PortfolioManagementService(db)
    success = service.delete_transaction(transaction_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")


# --- Price History ---
@router.get("/assets/{asset_id}/price-history", response_model=List[PortfolioPriceHistoryResponse])
def get_price_history(
    asset_id: int,
    days: int = Query(30, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Historique des prix d'un actif"""
    service = PortfolioManagementService(db)
    # Verify asset belongs to user
    asset = service.get_asset(asset_id, current_user.id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    
    history = service.get_price_history(asset_id, current_user.id, days=days)
    return history


# --- Summary & Performance ---
@router.get("/summary", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Résumé du portefeuille"""
    service = PortfolioManagementService(db)
    summary = service.get_portfolio_summary(current_user.id)
    return summary


@router.get("/performance", response_model=PortfolioPerformanceResponse)
def get_portfolio_performance(
    days: int = Query(30, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Performance du portefeuille"""
    service = PortfolioManagementService(db)
    performance = service.get_portfolio_performance(current_user.id, days=days)
    return performance


# --- Bulk Operations ---
@router.post("/update-all-prices")
def update_all_prices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour tous les prix"""
    service = PortfolioManagementService(db)
    service.update_all_prices()
    return {"message": "Price update initiated"}
