"""
API v1 路由聚合
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    admin,
    users,
    products,
    orders,
    payments,
    delivery,
    points,
    activities,
    messages
)

# 创建v1路由
api_v1_router = APIRouter()

# 注册各模块路由
api_v1_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_v1_router.include_router(admin.router, prefix="/admin", tags=["管理员"])
api_v1_router.include_router(users.router, prefix="/user", tags=["用户"])
api_v1_router.include_router(products.router, prefix="/products", tags=["商品"])
api_v1_router.include_router(orders.router, prefix="/orders", tags=["订单"])
api_v1_router.include_router(payments.router, prefix="/payments", tags=["支付"])
api_v1_router.include_router(delivery.router, prefix="/delivery", tags=["配送"])
api_v1_router.include_router(points.router, prefix="/points", tags=["积分"])
api_v1_router.include_router(activities.router, prefix="/activities", tags=["活动"])
api_v1_router.include_router(messages.router, prefix="/messages", tags=["消息"])
