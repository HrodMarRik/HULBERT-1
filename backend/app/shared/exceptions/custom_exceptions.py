"""
Exceptions personnalisées pour l'application
"""
from typing import Any, Optional


class AppException(Exception):
    """Exception de base pour l'application"""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Any] = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class NotFoundException(AppException):
    """Exception levée quand une ressource n'est pas trouvée"""
    def __init__(self, resource: str, identifier: Any):
        message = f"{resource} with identifier '{identifier}' not found"
        super().__init__(message, status_code=404)


class ValidationException(AppException):
    """Exception levée pour les erreurs de validation"""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, status_code=422, details=details)


class BusinessException(AppException):
    """Exception levée pour les erreurs de logique métier"""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, status_code=400, details=details)


class UnauthorizedException(AppException):
    """Exception levée pour les erreurs d'authentification"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401)


class ForbiddenException(AppException):
    """Exception levée pour les erreurs d'autorisation"""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status_code=403)


class ConflictException(AppException):
    """Exception levée pour les conflits (ex: duplicate)"""
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(message, status_code=409, details=details)


class ExternalServiceException(AppException):
    """Exception levée quand un service externe échoue"""
    def __init__(self, service: str, message: str):
        full_message = f"External service '{service}' error: {message}"
        super().__init__(full_message, status_code=503)


class RateLimitException(AppException):
    """Exception levée quand la limite de taux est dépassée"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status_code=429)

