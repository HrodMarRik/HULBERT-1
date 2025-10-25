import logging
import requests
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models import PortfolioAsset, PortfolioTransaction, PortfolioPriceHistory
from app.schemas import (
    PortfolioAssetCreate, PortfolioAssetUpdate,
    PortfolioTransactionCreate, PortfolioTransactionUpdate
)

logger = logging.getLogger(__name__)


class PortfolioManagementService:
    def __init__(self, db: Session):
        self.db = db
        # API keys would be in environment variables in production
        self.alpha_vantage_key = "demo"  # Replace with real API key
        self.coingecko_api = "https://api.coingecko.com/api/v3"

    # --- Assets ---
    def create_asset(self, asset: PortfolioAssetCreate, user_id: int) -> PortfolioAsset:
        """Créer un nouvel actif"""
        db_asset = PortfolioAsset(**asset.dict(), user_id=user_id)
        self.db.add(db_asset)
        self.db.commit()
        self.db.refresh(db_asset)
        
        # Fetch current price if symbol provided
        if db_asset.symbol:
            self.update_asset_price(db_asset.id, user_id)
        
        return db_asset

    def get_assets(self, user_id: int, asset_type: Optional[str] = None) -> List[PortfolioAsset]:
        """Liste des actifs"""
        query = self.db.query(PortfolioAsset).filter(PortfolioAsset.user_id == user_id)
        
        if asset_type:
            query = query.filter(PortfolioAsset.type == asset_type)
        
        return query.order_by(desc(PortfolioAsset.created_at)).all()

    def get_asset(self, asset_id: int, user_id: int) -> Optional[PortfolioAsset]:
        """Obtenir un actif"""
        return self.db.query(PortfolioAsset).filter(
            PortfolioAsset.id == asset_id,
            PortfolioAsset.user_id == user_id
        ).first()

    def update_asset(self, asset_id: int, asset: PortfolioAssetUpdate, user_id: int) -> Optional[PortfolioAsset]:
        """Mettre à jour un actif"""
        db_asset = self.get_asset(asset_id, user_id)
        if not db_asset:
            return None
        
        for key, value in asset.dict(exclude_unset=True).items():
            setattr(db_asset, key, value)
        
        db_asset.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(db_asset)
        return db_asset

    def delete_asset(self, asset_id: int, user_id: int) -> bool:
        """Supprimer un actif"""
        db_asset = self.get_asset(asset_id, user_id)
        if not db_asset:
            return False
        
        self.db.delete(db_asset)
        self.db.commit()
        return True

    def update_asset_price(self, asset_id: int, user_id: int) -> Optional[PortfolioAsset]:
        """Mettre à jour le prix d'un actif"""
        db_asset = self.get_asset(asset_id, user_id)
        if not db_asset or not db_asset.symbol:
            return None
        
        try:
            current_price = self.fetch_current_price(db_asset.symbol, db_asset.type)
            if current_price:
                db_asset.current_price = current_price
                db_asset.updated_at = datetime.utcnow()
                
                # Add to price history
                price_history = PortfolioPriceHistory(
                    asset_id=asset_id,
                    price=current_price
                )
                self.db.add(price_history)
                
                self.db.commit()
                self.db.refresh(db_asset)
                
                logger.info(f"Updated price for {db_asset.symbol}: {current_price}")
                return db_asset
        except Exception as e:
            logger.error(f"Error updating price for asset {asset_id}: {e}")
        
        return None

    def fetch_current_price(self, symbol: str, asset_type: str) -> Optional[float]:
        """Récupérer le prix actuel depuis les APIs"""
        try:
            if asset_type == "crypto":
                return self.fetch_crypto_price(symbol)
            elif asset_type in ["stock", "etf"]:
                return self.fetch_stock_price(symbol)
            else:
                # For other types, return None (manual price entry)
                return None
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {e}")
            return None

    def fetch_crypto_price(self, symbol: str) -> Optional[float]:
        """Récupérer le prix crypto depuis CoinGecko"""
        try:
            # Map common symbols to CoinGecko IDs
            symbol_map = {
                "BTC": "bitcoin",
                "ETH": "ethereum",
                "ADA": "cardano",
                "DOT": "polkadot",
                "LINK": "chainlink"
            }
            
            coin_id = symbol_map.get(symbol.upper(), symbol.lower())
            response = requests.get(f"{self.coingecko_api}/simple/price", params={
                "ids": coin_id,
                "vs_currencies": "eur"
            }, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if coin_id in data:
                    return data[coin_id]["eur"]
        except Exception as e:
            logger.error(f"Error fetching crypto price for {symbol}: {e}")
        
        return None

    def fetch_stock_price(self, symbol: str) -> Optional[float]:
        """Récupérer le prix action depuis Alpha Vantage"""
        try:
            response = requests.get("https://www.alphavantage.co/query", params={
                "function": "GLOBAL_QUOTE",
                "symbol": symbol,
                "apikey": self.alpha_vantage_key
            }, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "Global Quote" in data:
                    price_str = data["Global Quote"]["05. price"]
                    return float(price_str)
        except Exception as e:
            logger.error(f"Error fetching stock price for {symbol}: {e}")
        
        return None

    # --- Transactions ---
    def create_transaction(self, transaction: PortfolioTransactionCreate, user_id: int) -> PortfolioTransaction:
        """Créer une transaction"""
        db_transaction = PortfolioTransaction(**transaction.dict(), user_id=user_id)
        self.db.add(db_transaction)
        
        # Update asset quantity
        asset = self.get_asset(transaction.asset_id, user_id)
        if asset:
            if transaction.type == "buy":
                asset.quantity += transaction.quantity
            elif transaction.type == "sell":
                asset.quantity -= transaction.quantity
            
            asset.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_transaction)
        return db_transaction

    def get_transactions(self, user_id: int, asset_id: Optional[int] = None, limit: int = 50) -> List[PortfolioTransaction]:
        """Liste des transactions"""
        query = self.db.query(PortfolioTransaction).filter(PortfolioTransaction.user_id == user_id)
        
        if asset_id:
            query = query.filter(PortfolioTransaction.asset_id == asset_id)
        
        return query.order_by(desc(PortfolioTransaction.date)).limit(limit).all()

    def get_transaction(self, transaction_id: int, user_id: int) -> Optional[PortfolioTransaction]:
        """Obtenir une transaction"""
        return self.db.query(PortfolioTransaction).filter(
            PortfolioTransaction.id == transaction_id,
            PortfolioTransaction.user_id == user_id
        ).first()

    def update_transaction(self, transaction_id: int, transaction: PortfolioTransactionUpdate, user_id: int) -> Optional[PortfolioTransaction]:
        """Mettre à jour une transaction"""
        db_transaction = self.get_transaction(transaction_id, user_id)
        if not db_transaction:
            return None
        
        # Store old values for quantity adjustment
        old_type = db_transaction.type
        old_quantity = db_transaction.quantity
        
        for key, value in transaction.dict(exclude_unset=True).items():
            setattr(db_transaction, key, value)
        
        # Adjust asset quantity if type or quantity changed
        if old_type != db_transaction.type or old_quantity != db_transaction.quantity:
            asset = self.get_asset(db_transaction.asset_id, user_id)
            if asset:
                # Reverse old transaction
                if old_type == "buy":
                    asset.quantity -= old_quantity
                elif old_type == "sell":
                    asset.quantity += old_quantity
                
                # Apply new transaction
                if db_transaction.type == "buy":
                    asset.quantity += db_transaction.quantity
                elif db_transaction.type == "sell":
                    asset.quantity -= db_transaction.quantity
                
                asset.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_transaction)
        return db_transaction

    def delete_transaction(self, transaction_id: int, user_id: int) -> bool:
        """Supprimer une transaction"""
        db_transaction = self.get_transaction(transaction_id, user_id)
        if not db_transaction:
            return False
        
        # Adjust asset quantity
        asset = self.get_asset(db_transaction.asset_id, user_id)
        if asset:
            if db_transaction.type == "buy":
                asset.quantity -= db_transaction.quantity
            elif db_transaction.type == "sell":
                asset.quantity += db_transaction.quantity
            
            asset.updated_at = datetime.utcnow()
        
        self.db.delete(db_transaction)
        self.db.commit()
        return True

    # --- Price History ---
    def get_price_history(self, asset_id: int, user_id: int, days: int = 30) -> List[PortfolioPriceHistory]:
        """Historique des prix"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        return self.db.query(PortfolioPriceHistory).join(PortfolioAsset).filter(
            PortfolioPriceHistory.asset_id == asset_id,
            PortfolioAsset.user_id == user_id,
            PortfolioPriceHistory.date >= start_date
        ).order_by(PortfolioPriceHistory.date).all()

    # --- Summary & Performance ---
    def get_portfolio_summary(self, user_id: int) -> Dict[str, Any]:
        """Résumé du portefeuille"""
        assets = self.get_assets(user_id)
        
        total_value = 0
        total_invested = 0
        asset_performance = []
        
        for asset in assets:
            current_value = asset.quantity * (asset.current_price or 0)
            invested_value = asset.quantity * (asset.purchase_price or 0)
            
            total_value += current_value
            total_invested += invested_value
            
            if invested_value > 0:
                pnl = current_value - invested_value
                pnl_percentage = (pnl / invested_value) * 100
                
                asset_performance.append({
                    "asset_id": asset.id,
                    "name": asset.name,
                    "symbol": asset.symbol,
                    "current_value": current_value,
                    "invested_value": invested_value,
                    "pnl": pnl,
                    "pnl_percentage": pnl_percentage
                })
        
        total_pnl = total_value - total_invested
        pnl_percentage = (total_pnl / total_invested * 100) if total_invested > 0 else 0
        
        # Sort by performance
        asset_performance.sort(key=lambda x: x["pnl_percentage"], reverse=True)
        
        return {
            "total_value": total_value,
            "total_invested": total_invested,
            "total_pnl": total_pnl,
            "pnl_percentage": pnl_percentage,
            "asset_count": len(assets),
            "transaction_count": self.db.query(PortfolioTransaction).filter(
                PortfolioTransaction.user_id == user_id
            ).count(),
            "top_performers": asset_performance[:5],
            "worst_performers": asset_performance[-5:] if len(asset_performance) > 5 else []
        }

    def get_portfolio_performance(self, user_id: int, days: int = 30) -> Dict[str, Any]:
        """Performance du portefeuille sur une période"""
        # This would require more complex calculations with historical data
        # For now, return basic performance data
        summary = self.get_portfolio_summary(user_id)
        
        return {
            "period": f"{days} days",
            "start_value": summary["total_invested"],
            "end_value": summary["total_value"],
            "pnl": summary["total_pnl"],
            "pnl_percentage": summary["pnl_percentage"],
            "daily_returns": []  # Would be calculated from historical data
        }

    # --- Auto Update Prices ---
    def update_all_prices(self) -> None:
        """Mettre à jour tous les prix (pour job background)"""
        assets = self.db.query(PortfolioAsset).filter(
            PortfolioAsset.symbol.isnot(None),
            PortfolioAsset.symbol != ""
        ).all()
        
        for asset in assets:
            try:
                self.update_asset_price(asset.id, asset.user_id)
            except Exception as e:
                logger.error(f"Error updating price for asset {asset.id}: {e}")
