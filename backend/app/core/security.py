"""
JWT认证工具
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码

    Args:
        plain_password: 明文密码
        hashed_password: 哈希密码

    Returns:
        bool: 密码是否正确
    """
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


def get_password_hash(password: str) -> str:
    """
    生成密码哈希

    Args:
        password: 明文密码

    Returns:
        str: 哈希后的密码
    """
    return bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')


def create_access_token(
    data: Optional[dict] = None,
    expires_delta: Optional[timedelta] = None,
    user_id: Optional[int] = None,
) -> str:
    """创建访问Token（兼容两种调用方式）

    历史代码里有两种常见写法：
    - create_access_token({"sub": "1", ...})
    - create_access_token(user_id=1)

    为了让项目“能跑起来”，这里做向后兼容。
    """
    if data is None:
        data = {}

    to_encode = dict(data)

    # 兼容：直接传 user_id
    if user_id is not None and "sub" not in to_encode:
        to_encode["sub"] = str(user_id)
        to_encode["user_id"] = user_id

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """解码访问Token"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


# 兼容旧调用名
decode_token = decode_access_token


# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    从JWT Token中获取当前用户信息

    Args:
        credentials: HTTP授权凭证

    Returns:
        dict: 用户信息（包含user_id等）

    Raises:
        HTTPException: Token无效或过期
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    if "sub" not in payload:
        raise credentials_exception

    return payload
