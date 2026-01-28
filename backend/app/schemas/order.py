"""订单相关Schemas"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from decimal import Decimal


class OrderItemBase(BaseModel):
    """订单商品基础模型"""
    product_id: int
    product_name: str = Field(..., max_length=100)
    product_image: Optional[str] = None
    price: float = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    subtotal: float = Field(..., ge=0)


class OrderItemCreate(OrderItemBase):
    """创建订单商品"""
    pass


class OrderItemResponse(OrderItemBase):
    """订单商品响应"""
    id: int
    order_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    """订单基础模型"""
    user_id: int
    total_amount: float = Field(..., ge=0)
    discount_amount: float = Field(0.00, ge=0)
    delivery_fee: float = Field(0.00, ge=0)
    final_amount: float = Field(..., ge=0)
    delivery_type: int = Field(..., description="配送方式 1-配送 2-自提")
    delivery_address: Optional[str] = None
    pickup_point_id: Optional[int] = None
    delivery_time_slot: Optional[str] = None
    remark: Optional[str] = None


class OrderCreate(OrderBase):
    """创建订单"""
    items: list[OrderItemCreate]


class OrderUpdate(BaseModel):
    """更新订单"""
    status: Optional[str] = None
    cancel_reason: Optional[str] = None


class OrderResponse(OrderBase):
    """订单响应"""
    id: int
    order_no: str
    status: str
    cancelled_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderDetailResponse(OrderResponse):
    """订单详情响应"""
    items: list[OrderItemResponse]


class OrderLogResponse(BaseModel):
    """订单日志响应"""
    id: int
    order_id: int
    status: str
    operator: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
