from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.db import get_db
from app.models import User
from app.security import get_current_user as security_get_current_user


def get_current_user(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(security_get_current_user)
) -> User:
    """
    Dependency to get the current authenticated user.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user
