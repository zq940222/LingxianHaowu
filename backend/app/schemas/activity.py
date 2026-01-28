"""活动相关Schemas"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ActivityBase(BaseModel):
    """活动基础模型"""
    title: str = Field(..., max_length=100, description="活动标题")
    description: Optional[str] = Field(None, description="活动描述")
    image_url: Optional[str] = Field(None, description="弹窗图片URL")
    link_url: Optional[str] = Field(None, description="跳转链接")
    link_type: Optional[int] = Field(None, description="链接类型 1-商品页 2-活动页 3-外部链接")
    display_type: int = Field(..., description="展示类型 1-每日一次 2-首次进入")
    start_at: datetime = Field(..., description="开始时间")
    end_at: datetime = Field(..., description="结束时间")


class ActivityCreate(ActivityBase):
    """创建活动"""
    pass


class ActivityUpdate(BaseModel):
    """更新活动"""
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    link_type: Optional[int] = None
    display_type: Optional[int] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: Optional[int] = None
    sort_order: Optional[int] = None


class ActivityResponse(ActivityBase):
    """活动响应"""
    id: int
    status: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CouponBase(BaseModel):
    """优惠券基础模型"""
    name: str = Field(..., max_length=100, description="优惠券名称")
    description: Optional[str] = Field(None, description="优惠券描述")
    coupon_type: int = Field(..., description="优惠券类型 1-满减券 2-折扣券")
    discount_amount: Optional[float] = Field(None, ge=0, description="减免金额")
    discount_rate: Optional[float] = Field(None, gt=0, description="折扣率")
    min_amount: Optional[float] = Field(None, gt=0, description="最低消费金额")
    total_quantity: int = Field(0, ge=0, description="发放总数")
    valid_days: Optional[int] = Field(None, gt=0, description="有效天数")
    start_at: Optional[datetime] = Field(None, description="开始时间")
    end_at: Optional[datetime] = Field(None, description="结束时间")


class CouponCreate(CouponBase):
    """创建优惠券"""
    pass


class CouponUpdate(BaseModel):
    """更新优惠券"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    coupon_type: Optional[int] = None
    discount_amount: Optional[float] = Field(None, ge=0)
    discount_rate: Optional[float] = Field(None, gt=0)
    min_amount: Optional[float] = Field(None, gt=0)
    total_quantity: Optional[int] = Field(None, ge=0)
    valid_days: Optional[int] = Field(None, gt=0)
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    status: Optional[int] = None


class CouponResponse(CouponBase):
    """优惠券响应"""
    id: int
    used_quantity: int
    status: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserCouponBase(BaseModel):
    """用户优惠券基础模型"""
    user_id: int
    coupon_id: int


class UserCouponCreate(UserCouponBase):
    """创建用户优惠券"""
    pass


class UserCouponUpdate(BaseModel):
    """更新用户优惠券"""
    status: Optional[int] = None


class UserCouponResponse(UserCouponBase):
    """用户优惠券响应"""
    id: int
    status: int
    used_at: Optional[datetime] = None
    used_order_id: Optional[int] = None
    expire_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
