"""
支付相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import hashlib
import json

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.core.config import settings
from app.services.payment_service import payment
from app.services.order_service import order as order_service
from app.models.payment import Payment
from app.models.order import Order
from app.schemas.payment import PaymentCreate

router = APIRouter()


# 当前用户依赖
async def get_current_user_id() -> int:
    """获取当前登录用户ID"""
    return 1  # 模拟用户ID


# 管理员依赖
async def get_admin_id() -> int:
    """获取当前管理员ID"""
    return 1  # 模拟管理员ID


class WxPayRequest(BaseModel):
    """微信支付请求"""
    order_id: int


class RefundRequest(BaseModel):
    """退款请求"""
    order_id: int
    refund_amount: float
    refund_reason: str = ""


@router.post("/wx-pay")
async def create_wx_payment(
    request: WxPayRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    创建微信支付

    Args:
        request: 支付创建请求

    Returns:
        dict
    """
    # 1. 获取订单
    order_obj = await order_service.get(db, request.order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    if order_obj.user_id != current_user_id:
        return error_response(message="无权限操作此订单")

    if order_obj.status != "pending":
        return error_response(message="订单状态不允许支付")

    # 2. 检查是否已创建支付记录
    existing_payment = await payment.get_by_field(db, field_name="order_id", field_value=request.order_id)
    if existing_payment and existing_payment.status == "paid":
        return error_response(message="订单已支付")

    # 3. 调用微信支付统一下单API
    # TODO: 实际项目中需要调用微信支付API
    # 这里模拟生成prepay_id
    prepay_id = f"wx{int(datetime.now().timestamp())}{request.order_id}"

    # 4. 创建或更新支付记录
    if existing_payment:
        existing_payment.prepay_id = prepay_id
        existing_payment.amount = float(order_obj.final_amount)
        existing_payment.status = "pending"
        db.add(existing_payment)
        await db.commit()
        payment_obj = existing_payment
    else:
        payment_obj = await payment.create_payment(
            db,
            order_id=request.order_id,
            prepay_id=prepay_id,
            amount=float(order_obj.final_amount)
        )

    # 5. 生成小程序支付参数
    # TODO: 实际项目中需要使用微信支付SDK生成签名
    payment_params = {
        "timeStamp": str(int(datetime.now().timestamp())),
        "nonceStr": "mock_nonce_str",
        "package": f"prepay_id={prepay_id}",
        "signType": "RSA",
        "paySign": "mock_pay_sign"  # 实际需要使用微信支付私钥签名
    }

    # MOCK：开发阶段默认当作支付成功（你要求“支付默认成功”）
    if settings.DEBUG:
        mock_txn = f"mock_txn_{prepay_id}"
        await payment.handle_payment_success(db, payment_obj, mock_txn)

        # 同步更新订单状态
        if order_obj.status == "pending":
            await order_service.update_order_status(
                db, order_obj, "paid", operator="系统", remark="模拟支付成功"
            )

    return success_response(
        data={
            "payment_id": payment_obj.id,
            "prepay_id": prepay_id,
            "payment_params": payment_params,
            "mock": settings.DEBUG,
        },
        message="支付订单创建成功"
    )


@router.get("/{payment_id}")
async def get_payment_detail(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    获取支付详情

    Args:
        payment_id: 支付ID

    Returns:
        dict
    """
    payment_obj = await payment.get(db, payment_id)
    if not payment_obj:
        return error_response(message="支付记录不存在")

    # 获取订单信息
    order_obj = await order_service.get(db, payment_obj.order_id)
    if not order_obj or order_obj.user_id != current_user_id:
        return error_response(message="无权限查看此支付记录")

    return success_response(data=payment_obj)


@router.get("/{payment_id}/status")
async def get_payment_status(
    payment_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    查询支付状态

    Args:
        payment_id: 支付ID

    Returns:
        dict
    """
    payment_obj = await payment.get(db, payment_id)
    if not payment_obj:
        return error_response(message="支付记录不存在")

    # TODO: 调用微信支付查询API获取实时状态
    # 这里直接返回数据库状态

    status_map = {
        "pending": {"code": 0, "name": "待支付"},
        "paid": {"code": 1, "name": "已支付"},
        "refunded": {"code": 2, "name": "已退款"},
        "failed": {"code": 3, "name": "支付失败"},
        "cancelled": {"code": 4, "name": "已取消"}
    }

    status_info = status_map.get(payment_obj.status, {"code": -1, "name": "未知"})

    return success_response(
        data={
            "payment_id": payment_obj.id,
            "order_id": payment_obj.order_id,
            "status": payment_obj.status,
            "status_name": status_info["name"],
            "amount": float(payment_obj.amount),
            "transaction_id": payment_obj.transaction_id,
            "paid_at": payment_obj.paid_at.isoformat() if payment_obj.paid_at else None
        }
    )


@router.post("/callback/wx")
async def wx_payment_callback(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    微信支付回调

    Args:
        request: 请求对象

    Returns:
        dict
    """
    try:
        # 1. 获取回调数据
        callback_data = await request.json()

        # 2. 验证签名（TODO: 实际项目中需要验证微信签名）
        # verify_sign = verify_wx_sign(callback_data)
        # if not verify_sign:
        #     return {"code": "FAIL", "message": "签名验证失败"}

        # 3. 解析回调数据
        event_type = callback_data.get("event_type")
        
        if event_type == "TRANSACTION.SUCCESS":
            # 支付成功
            resource = callback_data.get("resource", {})
            decrypt_data = json.loads(resource.get("ciphertext", "{}"))
            
            transaction_id = decrypt_data.get("transaction_id")
            out_trade_no = decrypt_data.get("out_trade_no")  # 商户订单号
            total_amount = decrypt_data.get("amount", {}).get("total", 0) / 100  # 单位：分→元

            # 4. 查找支付记录（通过订单号）
            # TODO: 这里需要根据实际业务逻辑关联订单
            # 简化处理，假设可以通过订单ID查找
            from sqlalchemy import select
            payment_result = await db.execute(
                select(Payment).where(
                    Payment.prepay_id.contains(transaction_id)
                )
            )
            payment_obj = payment_result.scalar_one_or_none()

            if not payment_obj:
                return {"code": "FAIL", "message": "支付记录不存在"}

            # 5. 更新支付状态
            await payment.handle_payment_success(db, payment_obj, transaction_id)

            # 6. 更新订单状态
            order_obj = await order_service.get(db, payment_obj.order_id)
            if order_obj and order_obj.status == "pending":
                await order_service.update_order_status(
                    db, order_obj, "paid", operator="系统", remark="支付成功"
                )

        # 7. 返回成功响应
        return {"code": "SUCCESS", "message": "成功"}

    except Exception as e:
        return {"code": "FAIL", "message": f"处理失败: {str(e)}"}


@router.post("/refund")
async def create_refund(
    request: RefundRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    """
    申请退款

    Args:
        request: 退款请求

    Returns:
        dict
    """
    # 1. 获取订单
    order_obj = await order_service.get(db, request.order_id)
    if not order_obj:
        return error_response(message="订单不存在")

    if order_obj.user_id != current_user_id:
        return error_response(message="无权限操作此订单")

    # 2. 获取支付记录
    payment_obj = await payment.get_by_field(db, field_name="order_id", field_value=request.order_id)
    if not payment_obj:
        return error_response(message="支付记录不存在")

    if payment_obj.status != "paid":
        return error_response(message="当前支付状态不允许退款")

    # 3. 验证退款金额
    if request.refund_amount > float(payment_obj.amount):
        return error_response(message="退款金额不能超过支付金额")

    # 4. 调用微信退款API
    # TODO: 实际项目中需要调用微信退款API
    # refund_result = wxpay.refund(...)

    # 5. 更新支付记录
    await payment.refund(
        db, payment_obj, request.refund_amount, request.refund_reason
    )

    # 6. 更新订单状态
    await order_service.update_order_status(
        db, order_obj, "refunded", operator="用户", remark=f"退款: {request.refund_reason}"
    )

    # 7. 恢复库存
    from app.services.product_service import product as product_service
    from app.services.order_service import order_item
    items, _ = await order_item.get_order_items(db, request.order_id)
    for item in items:
        prod = await product_service.get(db, item.product_id)
        if prod:
            prod.stock += item.quantity
            db.add(prod)
    await db.commit()

    return success_response(
        data={
            "refund_amount": request.refund_amount,
            "refund_status": "success"
        },
        message="退款申请已提交"
    )


# 管理员接口

@router.get("/admin/list")
async def get_all_payments(
    status: Optional[str] = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    获取所有支付记录（管理员）

    Args:
        status: 支付状态
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    filters = {}
    if status:
        filters["status"] = status

    items, total = await payment.get_multi(db, skip=skip, limit=size, **filters)

    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )
