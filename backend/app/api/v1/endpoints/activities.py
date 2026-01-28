"""
活动相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.core.security import get_current_user
from app.models.user import User
from app.services.activity_service import activity, discount, user_coupon

router = APIRouter()


@router.get("/popup")
async def get_activity_popup(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取活动弹窗

    Returns:
        dict: 活动弹窗信息，如果没有活动则返回null
    """
    popup = await activity.get_popup_for_user(db, current_user.id)

    if not popup:
        return success_response(data=None)

    return success_response(
        data={
            "id": popup.id,
            "title": popup.title,
            "description": popup.description,
            "image_url": popup.image_url,
            "link_url": popup.link_url,
            "link_type": popup.link_type,
            "display_type": popup.display_type
        }
    )


@router.post("/record/{activity_id}")
async def record_activity_view(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    记录活动查看

    Args:
        activity_id: 活动ID

    Returns:
        dict: 记录结果
    """
    # 检查活动是否存在
    act = await activity.get(db, activity_id)
    if not act:
        return error_response(message="活动不存在")

    await activity.record_activity_display(db, current_user.id, activity_id)

    return success_response(message="记录成功")


@router.get("")
async def get_activities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取活动列表

    Returns:
        dict: 活动列表
    """
    activities = await activity.get_active_activities(db)
    return success_response(data=activities)


@router.get("/{activity_id}/stats")
async def get_activity_statistics(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取活动统计（管理员）

    Args:
        activity_id: 活动ID

    Returns:
        dict: 活动统计数据
    """
    act = await activity.get(db, activity_id)
    if not act:
        return error_response(message="活动不存在")

    stats = await activity.get_activity_stats(db, activity_id)

    return success_response(data=stats)


@router.post("")
async def create_activity(
    activity_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建活动（管理员）

    Args:
        activity_data: 活动数据

    Returns:
        dict: 创建的活动
    """
    from app.schemas.activity import ActivityCreate
    activity_schema = ActivityCreate(**activity_data)
    act = await activity.create(db, obj_in=activity_schema)

    return success_response(data=act, message="活动创建成功")


@router.put("/{activity_id}")
async def update_activity(
    activity_id: int,
    activity_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新活动（管理员）

    Args:
        activity_id: 活动ID
        activity_data: 更新数据

    Returns:
        dict: 更新后的活动
    """
    act = await activity.get(db, activity_id)
    if not act:
        return error_response(message="活动不存在")

    from app.schemas.activity import ActivityUpdate
    update_schema = ActivityUpdate(**activity_data)
    updated_act = await activity.update(db, db_obj=act, obj_in=update_schema)

    return success_response(data=updated_act, message="活动更新成功")


@router.delete("/{activity_id}")
async def delete_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    删除活动（管理员）

    Args:
        activity_id: 活动ID

    Returns:
        dict: 删除结果
    """
    act = await activity.delete(db, id=activity_id)
    if not act:
        return error_response(message="活动不存在")

    return success_response(message="活动删除成功")


@router.get("/coupons/list")
async def get_coupons(
    db: AsyncSession = Depends(get_db)
):
    """
    获取可领取的优惠券列表

    Returns:
        dict: 优惠券列表
    """
    coupons = await discount.get_active_coupons(db)
    return success_response(data=coupons)


@router.get("/coupons/{coupon_id}")
async def get_coupon_detail(
    coupon_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    获取优惠券详情

    Args:
        coupon_id: 优惠券ID

    Returns:
        dict: 优惠券详情
    """
    coupon = await discount.get(db, coupon_id)
    if not coupon:
        return error_response(message="优惠券不存在")

    return success_response(data=coupon)


@router.get("/coupons")
async def get_user_coupons(
    status: Optional[int] = Query(None, description="状态 0-未使用 1-已使用 2-已过期"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取用户优惠券列表

    Args:
        status: 状态筛选
        page: 页码
        size: 每页数量

    Returns:
        dict: 用户优惠券列表
    """
    skip = (page - 1) * size
    coupons, total = await discount.get_user_coupons_paginated(
        db,
        current_user.id,
        status=status,
        skip=skip,
        limit=size
    )

    return success_response(
        data={
            "items": coupons,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.post("/coupons/{coupon_id}/claim")
async def claim_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    领取优惠券

    Args:
        coupon_id: 优惠券ID

    Returns:
        dict: 领取结果
    """
    user_coupon = await user_coupon.issue_coupon(db, current_user.id, coupon_id)

    if not user_coupon:
        # 检查原因
        coupon = await discount.get(db, coupon_id)
        if not coupon or coupon.status != 1:
            return error_response(message="优惠券不存在或已失效")

        # 检查是否已领取
        from sqlalchemy import select
        result = await db.execute(
            select(user_coupon.model).where(
                user_coupon.model.user_id == current_user.id,
                user_coupon.model.coupon_id == coupon_id
            )
        )
        if result.scalar_one_or_none():
            return error_response(message="您已领取过此优惠券")

        # 检查是否发完
        if coupon.total_quantity > 0 and coupon.used_quantity >= coupon.total_quantity:
            return error_response(message="优惠券已领完")

        return error_response(message="领取失败，请稍后重试")

    return success_response(
        data={
            "user_coupon_id": user_coupon.id,
            "expire_at": user_coupon.expire_at
        },
        message="领取成功"
    )


@router.delete("/coupons/{user_coupon_id}")
async def delete_user_coupon(
    user_coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    删除用户优惠券

    Args:
        user_coupon_id: 用户优惠券ID

    Returns:
        dict: 删除结果
    """
    uc = await user_coupon.get(db, user_coupon_id)
    if not uc:
        return error_response(message="优惠券不存在")

    if uc.user_id != current_user.id:
        return error_response(message="无权限操作")

    # 只能删除未使用的
    if uc.status != 0:
        return error_response(message="只能删除未使用的优惠券")

    await user_coupon.delete(db, id=user_coupon_id)

    return success_response(message="删除成功")


@router.post("/coupons/create")
async def create_coupon(
    coupon_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建优惠券（管理员）

    Args:
        coupon_data: 优惠券数据

    Returns:
        dict: 创建的优惠券
    """
    from app.schemas.activity import CouponCreate
    coupon_schema = CouponCreate(**coupon_data)
    coupon = await discount.create(db, obj_in=coupon_schema)

    return success_response(data=coupon, message="优惠券创建成功")


@router.put("/coupons/{coupon_id}")
async def update_coupon(
    coupon_id: int,
    coupon_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新优惠券（管理员）

    Args:
        coupon_id: 优惠券ID
        coupon_data: 更新数据

    Returns:
        dict: 更新后的优惠券
    """
    coupon = await discount.get(db, coupon_id)
    if not coupon:
        return error_response(message="优惠券不存在")

    from app.schemas.activity import CouponUpdate
    update_schema = CouponUpdate(**coupon_data)
    updated_coupon = await discount.update(db, db_obj=coupon, obj_in=update_schema)

    return success_response(data=updated_coupon, message="优惠券更新成功")


@router.delete("/coupons/{coupon_id}/delete")
async def delete_coupon(
    coupon_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    删除优惠券（管理员）

    Args:
        coupon_id: 优惠券ID

    Returns:
        dict: 删除结果
    """
    coupon = await discount.delete(db, id=coupon_id)
    if not coupon:
        return error_response(message="优惠券不存在")

    return success_response(message="优惠券删除成功")
