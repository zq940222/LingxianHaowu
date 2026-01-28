"""支付相关Schemas"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    """支付基础模型"""
    amount: float = Field(..., gt=0, description="支付金额")


class PaymentCreate(PaymentBase):
    """创建支付"""
    order_id: int
    prepay_id: str


class PaymentUpdate(BaseModel):
    """更新支付"""
    status: Optional[str] = None
    refund_amount: Optional[float] = None
    refund_reason: Optional[str] = None


class PaymentResponse(PaymentBase):
    """支付响应"""
    id: int
    order_id: int
    transaction_id: Optional[str] = None
    prepay_id: Optional[str] = None
    status: str
    paid_at: Optional[datetime] = None
    refunded_at: Optional[datetime] = None
    refund_amount: Optional[float] = None
    refund_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WxPayRequest(BaseModel):
    """微信支付请求"""
    order_id: int


class WxPayResponse(BaseModel):
    """微信支付响应"""
    prepay_id: str
    payment_params: dict  # 小程序支付参数
