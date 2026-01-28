"""
用户相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.services.user_service import (
    user, address, sign_in_record, points_record
)
from app.services.points_service import point_rule
from app.schemas.user import (
    UserUpdate, AddressCreate, AddressUpdate, AddressResponse,
    SignInResponse, PointsRecordResponse
)

router = APIRouter()


class AddressUpdateRequest(BaseModel):
    """更新地址请求"""
    receiver_name: Optional[str] = None
    receiver_phone: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    detail_address: Optional[str] = None
    is_default: Optional[bool] = None
    zone_id: Optional[int] = None


# TODO: 依赖注入获取当前用户
async def get_current_user_id() -> int:
    """获取当前登录用户ID"""
    # TODO: 从JWT Token中获取
    return 1  # 模拟用户ID


@router.get("/info")
async def get_user_info(
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取用户信息
    
    Returns:
        UserResponse
    """
    user_obj = await user.get(db, current_user_id)
    if not user_obj:
        return error_response(message="用户不存在")
    
    return success_response(data=user_obj)


@router.put("/info")
async def update_user_info(
    request: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    更新用户信息
    
    Args:
        request: 用户信息更新请求
    
    Returns:
        UserResponse
    """
    user_obj = await user.get(db, current_user_id)
    if not user_obj:
        return error_response(message="用户不存在")
    
    updated_user = await user.update(db, db_obj=user_obj, obj_in=request)
    return success_response(data=updated_user, message="更新成功")


@router.get("/addresses")
async def get_addresses(
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取用户地址列表
    
    Args:
        page: 页码
        size: 每页数量
    
    Returns:
        dict
    """
    skip = (page - 1) * size
    items, total = await address.get_user_addresses(
        db, user_id=current_user_id, skip=skip, limit=size
    )
    
    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.post("/addresses")
async def create_address(
    request: AddressCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    添加收货地址
    
    Args:
        request: 地址创建请求
    
    Returns:
        AddressResponse
    """
    address_data = request.model_dump()
    address_data["user_id"] = current_user_id
    
    new_address = await address.create(db, obj_in=address_data)
    
    # 设置为默认地址
    if request.is_default:
        await address.set_default_address(db, new_address, current_user_id)
    
    return success_response(data=new_address, message="添加成功")


@router.put("/addresses/{address_id}")
async def update_address(
    address_id: int,
    request: AddressUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    更新收货地址
    
    Args:
        address_id: 地址ID
        request: 地址更新请求
    
    Returns:
        AddressResponse
    """
    address_obj = await address.get(db, address_id)
    if not address_obj:
        return error_response(message="地址不存在")
    
    if address_obj.user_id != current_user_id:
        return error_response(message="无权限操作")
    
    updated_address = await address.update(db, db_obj=address_obj, obj_in=request)
    
    # 设置为默认地址
    if request.is_default:
        await address.set_default_address(db, updated_address, current_user_id)
    
    return success_response(data=updated_address, message="更新成功")


@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    删除收货地址
    
    Args:
        address_id: 地址ID
    
    Returns:
        dict
    """
    address_obj = await address.get(db, address_id)
    if not address_obj:
        return error_response(message="地址不存在")
    
    if address_obj.user_id != current_user_id:
        return error_response(message="无权限操作")
    
    await address.delete(db, id=address_id)
    return success_response(message="删除成功")


@router.post("/sign-in")
async def sign_in(
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    每日签到
    
    Returns:
        dict
    """
    # 检查今日是否已签到
    has_signed = await sign_in_record.has_signed_today(db, current_user_id)
    if has_signed:
        return error_response(message="今日已签到")
    
    # 获取签到积分规则
    rule = await point_rule.get_rule_by_type(db, rule_type=1)  # 1-签到
    if not rule:
        return error_response(message="签到规则配置错误")
    
    # 获取用户
    user_obj = await user.get(db, current_user_id)
    if not user_obj:
        return error_response(message="用户不存在")
    
    # 更新积分
    updated_user = await user_service.update_points(
        db, user_obj, rule.points, 1, 1, "每日签到"
    )
    
    # 记录签到
    from datetime import date
    sign_in_data = {
        "user_id": current_user_id,
        "sign_date": date.today().strftime("%Y-%m-%d"),
        "points": rule.points
    }
    sign_record = await sign_in_record.create(db, obj_in=sign_in_data)
    
    return success_response(
        data={
            "points_gained": rule.points,
            "total_points": updated_user.total_points,
            "record": sign_record
        },
        message="签到成功"
    )


@router.get("/points-records")
async def get_points_records(
    type: Optional[int] = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取积分记录
    
    Args:
        type: 类型筛选 1-获得 2-消耗
        page: 页码
        size: 每页数量
    
    Returns:
        dict
    """
    skip = (page - 1) * size
    
    if type is not None:
        items, total = await points_record.get_multi(
            db, user_id=current_user_id, change_type=type, skip=skip, limit=size
        )
    else:
        items, total = await points_record.get_multi(
            db, user_id=current_user_id, skip=skip, limit=size
        )
    
    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )
