"""
订单相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import random

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.services.order_service import order, order_item, order_log
from app.services.product_service import product as product_service
from app.services.delivery_service import delivery_zone
from app.services.points_service import point_rule
from app.models.order import Order
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderItemCreate, OrderUpdate, OrderDetailResponse

router = APIRouter()


# 当前用户依赖
async def get_current_user_id() -> int:
    """获取当前登录用户ID"""
    # TODO: 从JWT Token中获取
    return 1  # 模拟用户ID


# 管理员依赖
async def get_admin_id() -> int:
    """获取当前管理员ID"""
    return 1  # 模拟管理员ID


class OrderCreateRequest(BaseModel):
    """创建订单请求"""
    delivery_type: int  # 1-配送 2-自提
    address_id: Optional[int] = None  # 配送地址ID（配送类型必填）
    pickup_point_id: Optional[int] = None  # 自提点ID（自提类型必填）
    delivery_time_slot: Optional[str] = None  # 配送时间段
    items: List[dict]  # 商品列表 [{product_id, quantity}]
    coupon_id: Optional[int] = None  # 优惠券ID
    points_used: int = 0  # 使用积分
    remark: Optional[str] = None  # 备注


class OrderUpdateStatusRequest(BaseModel):
    """更新订单状态请求"""
    status: str
    remark: Optional[str] = None


@router.post("/")
async def create_order(
    request: OrderCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    创建订单

    Args:
        request: 订单创建请求

    Returns:
        dict
    """
    # 1. 验证配送方式
    if request.delivery_type == 1 and not request.address_id:
        return error_response(message="配送类型需选择收货地址")
    if request.delivery_type == 2 and not request.pickup_point_id:
        return error_response(message="自提类型需选择自提点")

    # 2. 验证商品并计算金额
    total_amount = 0.0
    items_data = []
    
    for item in request.items:
        product_obj = await product_service.get(db, item["product_id"])
        if not product_obj:
            return error_response(message=f"商品不存在: {item['product_id']}")
        
        if product_obj.stock < item["quantity"]:
            return error_response(message=f"商品库存不足: {product_obj.name}")
        
        subtotal = float(product_obj.price) * item["quantity"]
        total_amount += subtotal
        
        # 获取商品主图
        images_result = await db.execute(
            select(product_service.models.ProductImage)
            .where(product_service.models.ProductImage.product_id == item["product_id"])
            .order_by(product_service.models.ProductImage.sort_order)
            .limit(1)
        )
        main_image = images_result.scalar_one_or_none()
        
        items_data.append({
            "product_id": item["product_id"],
            "product_name": product_obj.name,
            "product_image": main_image.image_url if main_image else None,
            "price": float(product_obj.price),
            "quantity": item["quantity"],
            "subtotal": subtotal
        })

    # 3. 计算优惠
    discount_amount = 0.0
    
    # 优惠券优惠（TODO: 实现优惠券计算逻辑）
    if request.coupon_id:
        pass
    
    # 积分抵扣（TODO: 实现积分抵扣逻辑）
    if request.points_used > 0:
        pass
    
    # 4. 计算配送费
    delivery_fee = 0.0
    if request.delivery_type == 1:
        # 获取地址所在配送区域
        from app.services.user_service import address as address_service
        addr = await address_service.get(db, request.address_id)
        if addr and addr.zone_id:
            delivery_fee = await delivery_zone.calculate_delivery_fee(
                db, addr.zone_id, total_amount
            )

    # 5. 计算最终金额
    final_amount = total_amount - discount_amount + delivery_fee
    if final_amount < 0:
        final_amount = 0.0

    # 6. 获取配送地址
    delivery_address = None
    if request.delivery_type == 1 and request.address_id:
        from app.services.user_service import address as address_service
        addr = await address_service.get(db, request.address_id)
        if addr:
            delivery_address = f"{addr.province}{addr.city}{addr.district or ''}{addr.detail_address}"

    # 7. 生成订单号
    order_no = datetime.now().strftime("%Y%m%d%H%M%S") + str(random.randint(1000, 9999))

    # 8. 创建订单
    order_data = {
        "order_no": order_no,
        "user_id": current_user_id,
        "total_amount": round(total_amount, 2),
        "discount_amount": round(discount_amount, 2),
        "delivery_fee": round(delivery_fee, 2),
        "final_amount": round(final_amount, 2),
        "delivery_type": request.delivery_type,
        "delivery_address": delivery_address,
        "pickup_point_id": request.pickup_point_id,
        "delivery_time_slot": request.delivery_time_slot,
        "remark": request.remark,
        "status": "pending"
    }
    
    new_order = await order.create_order(db, current_user_id, order_data, items_data)

    # 9. 扣减库存
    for item in items_data:
        prod = await product_service.get(db, item["product_id"])
        if prod:
            prod.stock -= item["quantity"]
            db.add(prod)
    await db.commit()

    return success_response(
        data={
            "order_id": new_order.id,
            "order_no": new_order.order_no,
            "final_amount": float(new_order.final_amount)
        },
        message="订单创建成功"
    )


@router.get("/")
async def get_orders(
    status: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取订单列表

    Args:
        status: 订单状态
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    items, total = await order.get_user_orders(
        db, user_id=current_user_id, status=status, skip=skip, limit=size
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


@router.get("/{order_id}")
async def get_order_detail(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取订单详情

    Args:
        order_id: 订单ID

    Returns:
        dict
    """
    order_obj = await order.get(db, order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    if order_obj.user_id != current_user_id:
        return error_response(message="无权限查看此订单")

    # 获取订单商品
    items, _ = await order_item.get_order_items(db, order_id)

    # 获取订单日志
    logs, _ = await order_log.get_order_logs(db, order_id)

    return success_response(
        data={
            "order": order_obj,
            "items": items,
            "logs": logs
        }
    )


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: int,
    reason: str = "",
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    取消订单

    Args:
        order_id: 订单ID
        reason: 取消原因

    Returns:
        dict
    """
    order_obj = await order.get(db, order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    if order_obj.user_id != current_user_id:
        return error_response(message="无权限操作此订单")

    if order_obj.status not in ["pending", "paid"]:
        return error_response(message="当前订单状态不允许取消")

    # 更新订单状态
    await order.update_order_status(
        db, order_obj, "cancelled", operator="用户", remark=reason or "用户取消"
    )

    # 恢复库存
    items, _ = await order_item.get_order_items(db, order_id)
    for item in items:
        prod = await product_service.get(db, item.product_id)
        if prod:
            prod.stock += item.quantity
            db.add(prod)
    await db.commit()

    return success_response(message="订单已取消")


@router.post("/{order_id}/confirm")
async def confirm_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    确认收货

    Args:
        order_id: 订单ID

    Returns:
        dict
    """
    order_obj = await order.get(db, order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    if order_obj.user_id != current_user_id:
        return error_response(message="无权限操作此订单")

    if order_obj.status != "delivering":
        return error_response(message="当前订单状态不允许确认收货")

    # 更新订单状态
    await order.update_order_status(
        db, order_obj, "completed", operator="用户", remark="确认收货"
    )

    # 赠送积分
    rule = await point_rule.get_rule_by_type(db, rule_type=2)  # 2-订单
    points_gained = 0
    if rule and rule.points > 0:
        from app.services.user_service import user as user_service
        from app.models.user import User
        user_obj = await user_service.get(db, current_user_id)
        if user_obj:
            points = int(float(order_obj.final_amount) * rule.points / 100)  # 按比例计算
            await user_service.update_points(
                db, user_obj, points, 1, 2, "订单完成", order_id
            )
            points_gained = points

    return success_response(
        data={"points_gained": points_gained},
        message="收货成功"
    )


@router.get("/{order_id}/logs")
async def get_order_logs(
    order_id: int,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取订单日志

    Args:
        order_id: 订单ID
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    order_obj = await order.get(db, order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    if order_obj.user_id != current_user_id:
        return error_response(message="无权限查看此订单")

    skip = (page - 1) * size
    logs, total = await order_log.get_order_logs(db, order_id)

    return success_response(
        data={
            "items": logs,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


# 管理员接口

@router.get("/admin/list")
async def get_all_orders(
    status: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    获取所有订单（管理员）

    Args:
        status: 订单状态
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    filters = {}
    if status:
        filters["status"] = status

    items, total = await order.get_multi(db, skip=skip, limit=size, **filters)

    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.put("/admin/{order_id}/status")
async def update_order_status(
    order_id: int,
    request: OrderUpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    更新订单状态（管理员）

    Args:
        order_id: 订单ID
        request: 状态更新请求

    Returns:
        dict
    """
    order_obj = await order.get(db, order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    # 更新订单状态
    await order.update_order_status(
        db, order_obj, request.status, operator="管理员", remark=request.remark
    )

    return success_response(message="订单状态已更新")
