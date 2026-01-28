"""
认证相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.response import success_response, error_response
from app.models.user import User
from app.services.user_service import user as user_service
from app.schemas.user import UserResponse

router = APIRouter()


class LoginRequest(BaseModel):
    """登录请求"""
    code: str
    nickname: str
    avatar: str = None


class TokenResponse(BaseModel):
    """Token响应"""
    token: str
    user: UserResponse


@router.post("/login")
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    微信小程序登录
    
    Args:
        request: 登录请求
        db: 数据库会话
    
    Returns:
        TokenResponse
    """
    # TODO: 1. 使用code换取openid和session_key
    # 暂时使用code作为openid模拟
    
    openid = f"mock_openid_{request.code}"  # 模拟openid
    
    # 2. 查询或创建用户
    existing_user = await user_service.get_by_openid(db, openid)
    
    if existing_user:
        # 更新用户信息
        user = existing_user
        if request.nickname:
            user.nickname = request.nickname
        if request.avatar:
            user.avatar = request.avatar
        db.add(user)
        await db.commit()
    else:
        # 创建新用户
        user_data = {
            "openid": openid,
            "nickname": request.nickname or "用户",
            "avatar": request.avatar or ""
        }
        user = await user_service.create(db, obj_in=user_data)
    
    # 3. 生成JWT Token
    token = create_access_token(user_id=user.id)
    
    # 4. 返回Token和用户信息
    return success_response(
        data={
            "token": token,
            "user": user
        }
    )


@router.post("/refresh")
async def refresh_token(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    刷新Token
    
    Args:
        token: 当前Token
    
    Returns:
        dict
    """
    # TODO: 实现Token刷新逻辑
    from app.core.security import decode_token
    
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        
        user = await user_service.get(db, user_id)
        if not user:
            return error_response(message="用户不存在")
        
        new_token = create_access_token(user_id=user.id)
        return success_response(data={"token": new_token})
    except Exception as e:
        return error_response(message="Token无效")


@router.post("/logout")
async def logout():
    """
    登出
    
    Returns:
        dict
    """
    # TODO: 实现登出逻辑（Token黑名单）
    return success_response(message="登出成功")
