from fastapi import HTTPException, status

class CustomException(Exception):
    """Exception personnalisée de base"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class UserNotFoundException(CustomException):
    """Exception quand un utilisateur n'est pas trouvé"""
    def __init__(self, user_id: int):
        super().__init__(
            f"Utilisateur avec l'ID {user_id} non trouvé",
            status_code=status.HTTP_404_NOT_FOUND
        )

class UserAlreadyExistsException(CustomException):
    """Exception quand un utilisateur existe déjà"""
    def __init__(self, field: str, value: str):
        super().__init__(
            f"Utilisateur avec {field} '{value}' existe déjà",
            status_code=status.HTTP_409_CONFLICT
        )

class ProductNotFoundException(CustomException):
    """Exception quand un produit n'est pas trouvé"""
    def __init__(self, product_id: int):
        super().__init__(
            f"Produit avec l'ID {product_id} non trouvé",
            status_code=status.HTTP_404_NOT_FOUND
        )

class OrderNotFoundException(CustomException):
    """Exception quand une commande n'est pas trouvée"""
    def __init__(self, order_id: int):
        super().__init__(
            f"Commande avec l'ID {order_id} non trouvée",
            status_code=status.HTTP_404_NOT_FOUND
        )

class InsufficientStockException(CustomException):
    """Exception quand le stock est insuffisant"""
    def __init__(self, product_name: str, requested: int, available: int):
        super().__init__(
            f"Stock insuffisant pour '{product_name}': demandé {requested}, disponible {available}",
            status_code=status.HTTP_400_BAD_REQUEST
        )

class InvalidCredentialsException(CustomException):
    """Exception pour des identifiants invalides"""
    def __init__(self):
        super().__init__(
            "Nom d'utilisateur ou mot de passe incorrect",
            status_code=status.HTTP_401_UNAUTHORIZED
        )

class InactiveUserException(CustomException):
    """Exception pour un utilisateur inactif"""
    def __init__(self):
        super().__init__(
            "Compte utilisateur désactivé",
            status_code=status.HTTP_403_FORBIDDEN
        )

class UnauthorizedException(CustomException):
    """Exception pour un accès non autorisé"""
    def __init__(self, message: str = "Accès non autorisé"):
        super().__init__(
            message,
            status_code=status.HTTP_403_FORBIDDEN
        )

class ValidationException(CustomException):
    """Exception pour des erreurs de validation"""
    def __init__(self, message: str):
        super().__init__(
            message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

def handle_exception(e: Exception) -> HTTPException:
    """
    Convertir les exceptions personnalisées en HTTPException
    """
    if isinstance(e, CustomException):
        return HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
    else:
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne du serveur"
        )
