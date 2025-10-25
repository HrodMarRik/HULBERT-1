from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from typing import Optional
import uuid
import time
import os

from ..db import get_db
from .. import models
from ..schemas import LoginRequest
from ..security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    rate_limit,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])  # Force reload

# 2FA disabled: no temp token storage is required


@router.post("/login")
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    try:
        client_ip = getattr(request.client, 'host', 'unknown') if request.client else 'unknown'
        
        # Temporairement désactivé pour debug
        # if not rate_limit(f"login:{client_ip}", 60, 10):
        #     raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts")

        user: Optional[models.User] = db.query(models.User).filter(models.User.username == payload.username).first()
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        # Issue tokens directly and set refresh cookie
        access = create_access_token(str(user.id))
        refresh = create_refresh_token(str(user.id))
        response.set_cookie(
            key="refreshToken",
            value=refresh,
            httponly=True,
            secure=False,  # set True behind HTTPS/Nginx in prod
            samesite="lax",
            path="/",
            max_age=60 * 60 * 24 * 7,
        )
        return {"accessToken": access}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Login service error")


@router.post("/totp/enroll")
def enroll_totp(request: Request):
    # 2FA disabled globally
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="2FA is disabled")


@router.post("/totp/verify")
def verify_totp():
    # 2FA disabled globally
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="2FA is disabled")


@router.post("/refresh")
def refresh_token(request: Request):
    cookie = request.cookies.get("refreshToken")
    if not cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh cookie")
    payload = decode_token(cookie)
    if not payload or payload.get("typ") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    sub = payload.get("sub")
    return {"accessToken": create_access_token(sub)}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refreshToken", path="/")
    return {"ok": True}


@router.get("/me")
def me(user: models.User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username}




@router.post("/bootstrap-admin")
def bootstrap_admin(username: str = "admin", password: str = "change-me", db: Session = Depends(get_db)):
    """
    TEMPORARY: Creates initial admin if missing and returns TOTP provisioning URI.
    Controlled by AUTH_BOOTSTRAP_ENABLED env (default: 'true'). Disable in prod.
    """
    if os.getenv("AUTH_BOOTSTRAP_ENABLED", "true").lower() != "true":
        raise HTTPException(status_code=403, detail="Bootstrap disabled")

    user: Optional[models.User] = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        user = models.User(username=username, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2FA disabled: no TOTP provisioning
    return {"username": username}
