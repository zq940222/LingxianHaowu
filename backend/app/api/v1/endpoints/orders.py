"""
订单相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
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
from app.schemas.order import OrderCreate, OrderItemCreate, OrderUpdate, OrderDetailResponse, OrderResponse

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


class OrderRefundRequest(BaseModel):
    """用户申请退款"""
    reason: str
    description: Optional[str] = None


class OrderPreviewRequest(BaseModel):
    """订单预览请求（不落库，仅计算金额）"""
    delivery_type: int  # 1-配送 2-自提
    address_id: Optional[int] = None
    pickup_point_id: Optional[int] = None
    items: List[dict]  # [{product_id, quantity}]
    coupon_id: Optional[int] = None
    points_used: int = 0


@router.post("/preview")
async def preview_order(
    request: OrderPreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """订单预览：计算金额（不创建订单）"""
    # 1. 验证配送方式
    if request.delivery_type == 1 and not request.address_id:
        return error_response(message="配送类型需选择收货地址")
    if request.delivery_type == 2 and not request.pickup_point_id:
        return error_response(message="自提类型需选择自提点")

    # 2. 计算商品金额
    total_amount = 0.0
    for item in request.items:
        product_obj = await product_service.get(db, item["product_id"])
        if not product_obj:
            return error_response(message=f"商品不存在: {item['product_id']}")
        subtotal = float(product_obj.price) * item["quantity"]
        total_amount += subtotal

    # 3. 优惠（暂不实现，返回0）
    discount_amount = 0.0
    points_discount = 0.0

    # 4. 配送费
    freight_amount = 0.0
    if request.delivery_type == 1 and request.address_id:
        from app.services.user_service import address as address_service
        addr = await address_service.get(db, request.address_id)
        if addr and getattr(addr, "zone_id", None):
            freight_amount = await delivery_zone.calculate_delivery_fee(
                db, addr.zone_id, total_amount
            )

    pay_amount = total_amount - discount_amount - points_discount + freight_amount
    if pay_amount < 0:
        pay_amount = 0.0

    return success_response(
        data={
            "total_amount": round(total_amount, 2),
            "freight_amount": round(freight_amount, 2),
            "discount_amount": round(discount_amount, 2),
            "points_discount": round(points_discount, 2),
            "pay_amount": round(pay_amount, 2),
            "available_coupons": 0,
        }
    )


@router.get("/status-count")
async def get_order_status_count(
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """订单状态数量统计（用于“我的”页角标）

    由于后端订单状态枚举与前端展示状态不完全一致，这里做一个简单映射：
    - pending -> pending_payment
    - paid/preparing/ready -> pending_delivery
    - delivering -> delivering
    - 其余 -> 0
    """
    result = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(Order.user_id == current_user_id)
        .group_by(Order.status)
    )
    rows = result.all()
    counts = {status: int(cnt) for status, cnt in rows}

    pending_payment = counts.get("pending", 0)
    pending_delivery = counts.get("paid", 0) + counts.get("preparing", 0) + counts.get("ready", 0)
    delivering = counts.get("delivering", 0)
    pending_pickup = 0

    return success_response(
        data={
            "pending_payment": pending_payment,
            "pending_delivery": pending_delivery,
            "delivering": delivering,
            "pending_pickup": pending_pickup,
        }
    )


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


def _map_backend_status_to_front(status: str) -> str:
    """后端细粒度状态 -> 前端聚合展示状态"""
    if status == "pending":
        return "pending_payment"
    if status in ("paid", "preparing", "ready"):
        return "pending_delivery"
    if status == "delivering":
        return "delivering"
    if status == "completed":
        return "completed"
    if status == "cancelled":
        return "cancelled"
    if status == "refunding":
        return "refunding"
    if status == "refunded":
        return "refunded"
    return status


def _front_status_name(display_status: str) -> str:
    mapping = {
        "pending_payment": "待支付",
        "pending_delivery": "待配送",
        "delivering": "配送中",
        "completed": "已完成",
        "cancelled": "已取消",
        "refunding": "退款中",
        "refunded": "已退款",
    }
    return mapping.get(display_status, display_status)


def _serialize_order_with_display(order_obj: Order) -> dict:
    data = OrderResponse.model_validate(order_obj).model_dump()
    display_status = _map_backend_status_to_front(order_obj.status)
    data["display_status"] = display_status
    data["display_status_name"] = _front_status_name(display_status)
    return data


def _map_front_status_to_backend(status: Optional[str]):
    """前端聚合状态 -> 后端细粒度状态列表/单值

    约定：
    - pending_payment -> [pending]
    - pending_delivery -> [paid, preparing, ready]
    - delivering -> [delivering]
    - completed -> [completed]
    - cancelled -> [cancelled]
    - refunding -> [refunding]
    - refunded -> [refunded]

    兼容：
    - 传入细粒度状态则原样返回
    - 传入逗号分隔则拆分为列表
    """
    if not status:
        return None

    s = status.strip()
    if "," in s:
        parts = [p.strip() for p in s.split(",") if p.strip()]
        return parts or None

    mapping = {
        "pending_payment": ["pending"],
        "pending_delivery": ["paid", "preparing", "ready"],
        "delivering": ["delivering"],
        "completed": ["completed"],
        "cancelled": ["cancelled"],
        "refunding": ["refunding"],
        "refunded": ["refunded"],
    }

    return mapping.get(s, s)


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

    backend_status = _map_front_status_to_backend(status)

    items, total = await order.get_user_orders(
        db, user_id=current_user_id, status=backend_status, skip=skip, limit=size
    )

    return success_response(
        data={
            "items": [_serialize_order_with_display(o) for o in items],
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
            "order": _serialize_order_with_display(order_obj),
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


@router.post("/{order_id}/refund")
async def request_refund(
    order_id: int,
    request: OrderRefundRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """用户申请退款（两段式）

    申请后进入 refunding，等待管理员确认/第三方回调后再进入 refunded。
    """
    from app.services.payment_service import payment as payment_service

    order_obj = await order.get(db, order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    if order_obj.user_id != current_user_id:
        return error_response(message="无权限操作此订单")

    if order_obj.status not in ["paid", "preparing", "ready", "delivering", "completed"]:
        return error_response(message="当前订单状态不允许退款")

    payment_obj = await payment_service.get_by_field(db, field_name="order_id", field_value=order_id)
    if not payment_obj:
        return error_response(message="支付记录不存在")

    if payment_obj.status != "paid":
        return error_response(message="当前支付状态不允许退款")

    # 1) 订单进入退款中
    await order.update_order_status(
        db, order_obj, "refunding", operator="用户", remark=f"申请退款: {request.reason}"
    )

    # 2) 支付进入退款中（记录退款原因/金额）
    refund_amount = float(payment_obj.amount)
    await payment_service.request_refund(db, payment_obj, refund_amount, request.reason)

    return success_response(message="退款申请已提交")


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
            "items": [_serialize_order_with_display(o) for o in items],
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.post("/admin/{order_id}/refund/confirm")
async def admin_confirm_refund(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """管理员确认退款成功

    - order: refunding -> refunded
    - payment: refunding -> refunded
    - 恢复库存
    """
    from app.services.payment_service import payment as payment_service

    order_obj = await order.get(db, order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    if order_obj.status != "refunding":
        return error_response(message="当前订单不处于退款中")

    payment_obj = await payment_service.get_by_field(db, field_name="order_id", field_value=order_id)
    if not payment_obj:
        return error_response(message="支付记录不存在")

    if payment_obj.status != "refunding":
        return error_response(message="当前支付不处于退款中")

    await payment_service.confirm_refund(db, payment_obj)
    await order.update_order_status(db, order_obj, "refunded", operator="管理员", remark="确认退款")

    # 恢复库存
    items, _ = await order_item.get_order_items(db, order_id)
    for item in items:
        prod = await product_service.get(db, item.product_id)
        if prod:
            prod.stock += item.quantity
            db.add(prod)
    await db.commit()

    return success_response(message="退款已确认")


@router.put("/admin/{order_id}/status")
async def update_order_status(
    order_id: int,
    request: OrderUpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """更新订单状态（管理员）

    这里做一个最小可用的状态机校验，避免状态随意跳转。
    """
    order_obj = await order.get(db, order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    current = order_obj.status
    target = request.status

    allowed_next = {
        "pending": ["cancelled"],
        "paid": ["preparing", "cancelled", "refunding", "refunded"],
        "preparing": ["ready", "refunding", "refunded"],
        "ready": ["delivering", "refunding", "refunded"],
        "delivering": ["completed", "refunding", "refunded"],
        "completed": ["refunding", "refunded"],
        "refunding": ["refunded"],
        "refunded": [],
        "cancelled": [],
    }

    if target != current:
        if target not in allowed_next.get(current, []):
            return error_response(message=f"状态不允许从 {current} 变更为 {target}")

    await order.update_order_status(
        db, order_obj, target, operator="管理员", remark=request.remark
    )

    return success_response(message="订单状态已更新")
