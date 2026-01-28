"""
配送相关端点
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.services.delivery_service import delivery_zone, pickup_point
from app.schemas.delivery import (
    DeliveryZoneCreate, DeliveryZoneUpdate, DeliveryZoneResponse,
    PickupPointCreate, PickupPointUpdate, PickupPointResponse
)

router = APIRouter()


# 当前用户依赖
async def get_current_user_id() -> int:
    """获取当前登录用户ID"""
    return 1  # 模拟用户ID


# 管理员依赖
async def get_admin_id() -> int:
    """获取当前管理员ID"""
    return 1  # 模拟管理员ID


class DeliveryFeeRequest(BaseModel):
    """配送费计算请求"""
    zone_id: Optional[int] = None
    address_id: Optional[int] = None
    order_amount: float


class TimeSlotRequest(BaseModel):
    """配送时间段请求"""
    zone_id: Optional[int] = None
    date: str  # 格式: YYYY-MM-DD


class RoutePlanRequest(BaseModel):
    """路线规划请求"""
    pickup_point_ids: List[int]
    order_ids: List[int]


# 用户端接口

@router.get("/zones")
async def get_delivery_zones(
    db: AsyncSession = Depends(get_db)
):
    """
    获取配送区域列表（用户）

    Returns:
        List[dict]
    """
    zones = await delivery_zone.get_active_zones(db)
    
    return success_response(data=zones)


@router.get("/zones/{zone_id}")
async def get_delivery_zone_detail(
    zone_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    获取配送区域详情

    Args:
        zone_id: 区域ID

    Returns:
        dict
    """
    zone = await delivery_zone.get(db, zone_id)
    if not zone:
        return error_response(message="配送区域不存在")

    # 获取该区域的自提点
    points = await pickup_point.get_by_zone(db, zone_id)

    return success_response(
        data={
            "zone": zone,
            "pickup_points": points[0]
        }
    )


@router.get("/pickup-points")
async def get_pickup_points(
    zone_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    获取自提点列表（用户）

    Args:
        zone_id: 配送区域ID（可选）

    Returns:
        List[dict]
    """
    if zone_id:
        points, _ = await pickup_point.get_by_zone(db, zone_id)
    else:
        points = await pickup_point.get_active_points(db)

    return success_response(data=points)


@router.get("/pickup-points/{point_id}")
async def get_pickup_point_detail(
    point_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    获取自提点详情

    Args:
        point_id: 自提点ID

    Returns:
        dict
    """
    point = await pickup_point.get(db, point_id)
    if not point:
        return error_response(message="自提点不存在")

    return success_response(data=point)


@router.post("/calculate-fee")
async def calculate_delivery_fee(
    request: DeliveryFeeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    计算配送费

    Args:
        request: 配送费计算请求

    Returns:
        dict
    """
    # 根据地址ID获取区域ID
    if request.address_id:
        from app.services.user_service import address as address_service
        addr = await address_service.get(db, request.address_id)
        if not addr:
            return error_response(message="地址不存在")
        zone_id = addr.zone_id
    else:
        zone_id = request.zone_id

    if not zone_id:
        return error_response(message="配送区域不能为空")

    # 计算配送费
    fee = await delivery_zone.calculate_delivery_fee(
        db, zone_id, request.order_amount
    )

    # 获取区域信息
    zone = await delivery_zone.get(db, zone_id)

    return success_response(
        data={
            "delivery_fee": fee,
            "zone_id": zone_id,
            "zone_name": zone.name if zone else None,
            "free_threshold": float(zone.free_threshold) if zone and zone.free_threshold else None,
            "is_free_delivery": fee == 0.0
        }
    )


@router.post("/time-slots")
async def get_delivery_time_slots(
    request: TimeSlotRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    获取可用的配送时间段

    Args:
        request: 配送时间段请求

    Returns:
        dict
    """
    # 配送时间段（固定时间段，实际项目中可能需要动态计算）
    time_slots = [
        {"id": 1, "label": "08:00-10:00", "available": True},
        {"id": 2, "label": "10:00-12:00", "available": True},
        {"id": 3, "label": "12:00-14:00", "available": True},
        {"id": 4, "label": "14:00-16:00", "available": True},
        {"id": 5, "label": "16:00-18:00", "available": True},
        {"id": 6, "label": "18:00-20:00", "available": True},
    ]

    # TODO: 根据当前时间、配送区域、订单量等动态调整可用性
    # 当前所有时间段都可用

    return success_response(
        data={
            "date": request.date,
            "zone_id": request.zone_id,
            "time_slots": time_slots
        }
    )


@router.post("/route-plan")
async def plan_delivery_route(
    request: RoutePlanRequest,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    配送路线规划（管理员）

    Args:
        request: 路线规划请求

    Returns:
        dict
    """
    # TODO: 实现路线规划算法
    # 可以使用Google Maps API、百度地图API等

    # 获取自提点位置
    points_data = []
    for point_id in request.pickup_point_ids:
        point = await pickup_point.get(db, point_id)
        if point:
            points_data.append({
                "id": point.id,
                "name": point.name,
                "address": point.address
            })

    # 简化路线规划（按ID排序）
    route_order = request.pickup_point_ids

    return success_response(
        data={
            "route_order": route_order,
            "points": points_data,
            "total_distance": 0,  # TODO: 计算实际距离
            "estimated_time": 0  # TODO: 估算配送时间
        },
        message="路线规划成功"
    )


# 管理员接口

@router.get("/admin/zones")
async def get_all_zones(
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    获取所有配送区域（管理员）

    Args:
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    items, total = await delivery_zone.get_multi(db, skip=skip, limit=size)

    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.post("/admin/zones")
async def create_delivery_zone(
    request: DeliveryZoneCreate,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    创建配送区域（管理员）

    Args:
        request: 配送区域创建请求

    Returns:
        dict
    """
    new_zone = await delivery_zone.create(db, obj_in=request)

    return success_response(data=new_zone, message="创建成功")


@router.put("/admin/zones/{zone_id}")
async def update_delivery_zone(
    zone_id: int,
    request: DeliveryZoneUpdate,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    更新配送区域（管理员）

    Args:
        zone_id: 区域ID
        request: 配送区域更新请求

    Returns:
        dict
    """
    zone = await delivery_zone.get(db, zone_id)
    if not zone:
        return error_response(message="配送区域不存在")

    updated_zone = await delivery_zone.update(db, db_obj=zone, obj_in=request)

    return success_response(data=updated_zone, message="更新成功")


@router.delete("/admin/zones/{zone_id}")
async def delete_delivery_zone(
    zone_id: int,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    删除配送区域（管理员）

    Args:
        zone_id: 区域ID

    Returns:
        dict
    """
    zone = await delivery_zone.get(db, zone_id)
    if not zone:
        return error_response(message="配送区域不存在")

    await delivery_zone.delete(db, id=zone_id)

    return success_response(message="删除成功")


@router.get("/admin/pickup-points")
async def get_all_pickup_points(
    zone_id: Optional[int] = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    获取所有自提点（管理员）

    Args:
        zone_id: 配送区域ID
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    if zone_id:
        items, total = await pickup_point.get_by_zone(db, zone_id, skip=skip, limit=size)
    else:
        items, total = await pickup_point.get_multi(db, skip=skip, limit=size)

    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.post("/admin/pickup-points")
async def create_pickup_point(
    request: PickupPointCreate,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    创建自提点（管理员）

    Args:
        request: 自提点创建请求

    Returns:
        dict
    """
    new_point = await pickup_point.create(db, obj_in=request)

    return success_response(data=new_point, message="创建成功")


@router.put("/admin/pickup-points/{point_id}")
async def update_pickup_point(
    point_id: int,
    request: PickupPointUpdate,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    更新自提点（管理员）

    Args:
        point_id: 自提点ID
        request: 自提点更新请求

    Returns:
        dict
    """
    point = await pickup_point.get(db, point_id)
    if not point:
        return error_response(message="自提点不存在")

    updated_point = await pickup_point.update(db, db_obj=point, obj_in=request)

    return success_response(data=updated_point, message="更新成功")


@router.delete("/admin/pickup-points/{point_id}")
async def delete_pickup_point(
    point_id: int,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    删除自提点（管理员）

    Args:
        point_id: 自提点ID

    Returns:
        dict
    """
    point = await pickup_point.get(db, point_id)
    if not point:
        return error_response(message="自提点不存在")

    await pickup_point.delete(db, id=point_id)

    return success_response(message="删除成功")
