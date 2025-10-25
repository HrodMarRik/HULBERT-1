import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import logging

from ..services.logger import accounting_logger

class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware pour logger toutes les requêtes API"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Générer un ID unique pour cette requête
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        
        # Démarrer le chronomètre
        start_time = time.time()
        
        # Extraire les informations de la requête
        method = request.method
        url = str(request.url)
        client_ip = request.client.host if request.client else "unknown"
        
        # Essayer d'extraire l'utilisateur depuis le token JWT
        user_id = None
        try:
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                # Ici on pourrait décoder le JWT pour extraire l'user_id
                # Pour l'instant on garde None
                pass
        except:
            pass
        
        # Logger la requête entrante
        accounting_logger.api_logger.info(
            f"REQUEST [{request_id}] | {method} {url} | IP: {client_ip} | User: {user_id or 'anonymous'}"
        )
        
        # Traiter la requête
        try:
            response = await call_next(request)
            
            # Calculer la durée
            duration = time.time() - start_time
            
            # Logger la réponse
            accounting_logger.log_api_request(
                method=method,
                url=url,
                status_code=response.status_code,
                duration=duration,
                user_id=user_id
            )
            
            # Ajouter l'ID de requête dans les headers de réponse
            response.headers["X-Request-ID"] = request_id
            
            return response
            
        except Exception as e:
            # Logger l'erreur
            duration = time.time() - start_time
            accounting_logger.log_error(
                error=e,
                context=f"API Request [{request_id}] | {method} {url}",
                user_id=user_id
            )
            
            # Re-lever l'exception pour que FastAPI la gère
            raise