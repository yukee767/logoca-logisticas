"""
app/utils/security.py — JWT + passlib (bcrypt)
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _expires_delta(expires: str) -> timedelta:
    """Parse '7d', '30d', '24h', '60m', '3600s'"""
    if not expires:
        return timedelta(days=7)
    unit = expires[-1].lower()
    try:
        value = int(expires[:-1])
    except ValueError:
        # raw seconds
        try:
            return timedelta(seconds=int(expires))
        except ValueError:
            return timedelta(days=7)
    if unit == "d":
        return timedelta(days=value)
    if unit == "h":
        return timedelta(hours=value)
    if unit == "m":
        return timedelta(minutes=value)
    if unit == "s":
        return timedelta(seconds=value)
    return timedelta(days=7)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or _expires_delta(settings.jwt_expires_in))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + _expires_delta(settings.jwt_refresh_secret and "30d" or "30d")
    # Usa secret separado se configurado
    secret = settings.jwt_refresh_secret or settings.jwt_secret
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc), "type": "refresh"})
    return jwt.encode(to_encode, secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str, verify_exp: bool = True) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_exp": verify_exp},
        )
        return payload
    except JWTError as e:
        # tenta refresh secret
        try:
            payload = jwt.decode(
                token,
                settings.jwt_refresh_secret,
                algorithms=[settings.jwt_algorithm],
                options={"verify_exp": verify_exp},
            )
            return payload
        except JWTError:
            raise e


# ── FastAPI dependencies ──
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token não fornecido")
    try:
        payload = decode_token(credentials.credentials)
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")


async def require_role(required_roles: list[str]):
    async def _checker(payload: Dict[str, Any] = Depends(get_current_user_token)):
        role = payload.get("role") or payload.get("user_role") or "CUSTOMER"
        if role not in required_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Acesso negado. Roles permitidas: {required_roles}")
        return payload

    return _checker
