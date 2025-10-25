import os
import time
import base64
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
import logging

import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .db import get_db
from . import models


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")
JWT_ALG = "HS256"
ACCESS_TTL_MIN = int(os.getenv("ACCESS_TTL_MIN", "60"))  # Increased to 60 minutes for dev
REFRESH_TTL_DAYS = int(os.getenv("REFRESH_TTL_DAYS", "7"))

# TOTP functionality removed - 2FA disabled
http_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": subject, "iat": int(now.timestamp()), "exp": int((now + timedelta(minutes=ACCESS_TTL_MIN)).timestamp())}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": subject, "iat": int(now.timestamp()), "exp": int((now + timedelta(days=REFRESH_TTL_DAYS)).timestamp()), "typ": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> Optional[dict]:
    try:
        result = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        logging.getLogger("auth").info(f"Token decoded successfully: {result}")
        return result
    except jwt.ExpiredSignatureError:
        logging.getLogger("auth").warning("JWT token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logging.getLogger("auth").warning(f"Invalid JWT token: {e}")
        return None
    except Exception as e:
        logging.getLogger("auth").warning(f"JWT decode error: {e}")
        return None


# Simple in-memory rate limiting placeholder (per process)
_rate_store: dict[str, list[float]] = {}


def rate_limit(key: str, window_seconds: int, max_calls: int) -> bool:
    now = time.time()
    calls = _rate_store.get(key, [])
    calls = [t for t in calls if now - t < window_seconds]
    if len(calls) >= max_calls:
        _rate_store[key] = calls
        return False
    calls.append(now)
    _rate_store[key] = calls
    return True


# TOTP helpers removed - 2FA disabled


# Auth dependency

def get_current_user(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> models.User:
    token: Optional[str] = None
    if creds is not None and creds.scheme.lower() == "bearer":
        token = creds.credentials
    else:
        # Dev-friendly fallbacks: query param or custom header
        token = request.query_params.get("access_token") or request.headers.get("X-Access-Token")
    
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    decoded = decode_token(token)
    if not decoded:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT presented")

    user_id = decoded.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT presented")

    try:
        # Convert user_id to int if it's a string
        user_id_int = int(user_id) if isinstance(user_id, str) else user_id
        user = db.query(models.User).filter(models.User.id == user_id_int).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT presented")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT presented")
    except Exception as e:
        logging.getLogger("auth").error(f"Database error in get_current_user: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Authentication service error")

    return user
