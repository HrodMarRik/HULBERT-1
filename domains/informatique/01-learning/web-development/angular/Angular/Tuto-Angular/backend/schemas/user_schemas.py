from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Schémas de base
class UserBase(BaseModel):
    """Schéma de base pour un utilisateur"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)

class UserCreate(UserBase):
    """Schéma pour créer un utilisateur"""
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    """Schéma pour mettre à jour un utilisateur"""
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    """Schéma utilisateur en base de données"""
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class User(UserBase):
    """Schéma utilisateur pour les réponses API"""
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    """Schéma pour la connexion"""
    username: str
    password: str

class UserPasswordChange(BaseModel):
    """Schéma pour changer le mot de passe"""
    current_password: str
    new_password: str = Field(..., min_length=6)

class Token(BaseModel):
    """Schéma pour le token JWT"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class TokenData(BaseModel):
    """Schéma pour les données du token"""
    username: Optional[str] = None
