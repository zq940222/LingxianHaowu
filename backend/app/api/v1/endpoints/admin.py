"""
管理员相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.response import success_response, error_response
from app.models.config import Admin

router = APIRouter()


class AdminLoginRequest(BaseModel):
    """管理员登录请求"""
    username: str
    password: str


class AdminResponse(BaseModel):
    """管理员信息响应"""
    id: int
    username: str
    real_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    role: int

    class Config:
        from_attributes = True


class AdminLoginResponse(BaseModel):
    """管理员登录响应"""
    token: str
    admin: AdminResponse


@router.post("/login")
async def admin_login(
    request: AdminLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    管理员登录

    Args:
        request: 登录请求
        db: 数据库会话

    Returns:
        TokenResponse
    """
    # 查询管理员
    result = await db.execute(
        select(Admin).where(Admin.username == request.username)
    )
    admin = result.scalar_one_or_none()

    if not admin:
        return error_response(message="用户名或密码错误", code=1001)

    # 检查状态
    if admin.status != 1:
        return error_response(message="账号已被禁用", code=1002)

    # 验证密码
    if not verify_password(request.password, admin.password_hash):
        return error_response(message="用户名或密码错误", code=1001)

    # 生成JWT Token
    token = create_access_token(data={"sub": str(admin.id), "type": "admin"})

    return success_response(
        data={
            "token": token,
            "admin": {
                "id": admin.id,
                "username": admin.username,
                "real_name": admin.real_name,
                "phone": admin.phone,
                "email": admin.email,
                "role": admin.role
            }
        }
    )


@router.post("/logout")
async def admin_logout():
    """
    管理员登出

    Returns:
        dict
    """
    return success_response(message="登出成功")


@router.get("/info")
async def get_admin_info(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取当前管理员信息

    Args:
        current_user: 当前用户信息
        db: 数据库会话

    Returns:
        AdminResponse
    """
    admin_id = int(current_user.get("sub"))

    result = await db.execute(
        select(Admin).where(Admin.id == admin_id)
    )
    admin = result.scalar_one_or_none()

    if not admin:
        return error_response(message="管理员不存在", code=1003)

    return success_response(
        data={
            "id": admin.id,
            "username": admin.username,
            "real_name": admin.real_name,
            "phone": admin.phone,
            "email": admin.email,
            "role": admin.role
        }
    )


@router.post("/password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    修改密码

    Args:
        old_password: 旧密码
        new_password: 新密码
        current_user: 当前用户信息
        db: 数据库会话

    Returns:
        dict
    """
    admin_id = int(current_user.get("sub"))

    result = await db.execute(
        select(Admin).where(Admin.id == admin_id)
    )
    admin = result.scalar_one_or_none()

    if not admin:
        return error_response(message="管理员不存在", code=1003)

    # 验证旧密码
    if not verify_password(old_password, admin.password_hash):
        return error_response(message="旧密码错误", code=1004)

    # 更新密码
    admin.password_hash = get_password_hash(new_password)
    db.add(admin)
    await db.commit()

    return success_response(message="密码修改成功")
