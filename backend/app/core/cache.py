import redis.asyncio as aioredis
from typing import Optional, Any, Union
import json
import logging
from .config import get_settings

logger = logging.getLogger(__name__)

class CacheService:
    """Service de cache Redis pour HULBERT-1"""
    
    def __init__(self):
        self.settings = get_settings()
        self.redis_client: Optional[aioredis.Redis] = None
        self._connection_pool: Optional[aioredis.ConnectionPool] = None
    
    async def connect(self):
        """Établir la connexion Redis"""
        try:
            self._connection_pool = aioredis.ConnectionPool.from_url(
                self.settings.REDIS_URL,
                max_connections=20,
                retry_on_timeout=True
            )
            self.redis_client = aioredis.Redis(connection_pool=self._connection_pool)
            
            # Test de connexion
            await self.redis_client.ping()
            logger.info("Connexion Redis établie avec succès")
        except Exception as e:
            logger.error(f"Erreur de connexion Redis: {e}")
            self.redis_client = None
    
    async def disconnect(self):
        """Fermer la connexion Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Connexion Redis fermée")
    
    async def get(self, key: str) -> Optional[Any]:
        """Récupérer une valeur du cache"""
        if not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Erreur lors de la récupération du cache {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Stocker une valeur dans le cache"""
        if not self.redis_client:
            return False
        
        try:
            serialized_value = json.dumps(value, default=str)
            await self.redis_client.setex(key, expire, serialized_value)
            return True
        except Exception as e:
            logger.error(f"Erreur lors du stockage en cache {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Supprimer une valeur du cache"""
        if not self.redis_client:
            return False
        
        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du cache {key}: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """Supprimer toutes les clés correspondant au pattern"""
        if not self.redis_client:
            return 0
        
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                return await self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du pattern {pattern}: {e}")
            return 0
    
    async def exists(self, key: str) -> bool:
        """Vérifier si une clé existe"""
        if not self.redis_client:
            return False
        
        try:
            return await self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Erreur lors de la vérification de l'existence de {key}: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Incrémenter une valeur numérique"""
        if not self.redis_client:
            return None
        
        try:
            return await self.redis_client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Erreur lors de l'incrémentation de {key}: {e}")
            return None
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Définir l'expiration d'une clé"""
        if not self.redis_client:
            return False
        
        try:
            return await self.redis_client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Erreur lors de la définition de l'expiration de {key}: {e}")
            return False

# Instance globale du service de cache
cache_service = CacheService()

# Fonctions utilitaires pour le cache
async def get_cached(key: str) -> Optional[Any]:
    """Récupérer une valeur du cache"""
    return await cache_service.get(key)

async def set_cached(key: str, value: Any, expire: int = 3600) -> bool:
    """Stocker une valeur dans le cache"""
    return await cache_service.set(key, value, expire)

async def delete_cached(key: str) -> bool:
    """Supprimer une valeur du cache"""
    return await cache_service.delete(key)

async def cache_invalidate_pattern(pattern: str) -> int:
    """Invalider le cache selon un pattern"""
    return await cache_service.delete_pattern(pattern)

# Décorateur pour le cache automatique
def cached(expire: int = 3600, key_prefix: str = ""):
    """Décorateur pour mettre en cache automatiquement les résultats de fonction"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Générer la clé de cache
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Essayer de récupérer du cache
            cached_result = await get_cached(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Exécuter la fonction et mettre en cache
            result = await func(*args, **kwargs)
            await set_cached(cache_key, result, expire)
            return result
        
        return wrapper
    return decorator
