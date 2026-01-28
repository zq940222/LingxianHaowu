"""配送相关Schemas"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DeliveryZoneBase(BaseModel):
    """配送区域基础模型"""
    name: str = Field(..., max_length=50, description="区域名称")
    area_code: Optional[str] = Field(None, max_length=20, description="区域编码")
    base_fee: float = Field(..., ge=0, description="基础配送费")
    free_threshold: Optional[float] = Field(None, gt=0, description="满额免配送费")
    delivery_days: Optional[str] = Field(None, max_length=100, description="配送日期")


class DeliveryZoneCreate(DeliveryZoneBase):
    """创建配送区域"""
    pass


class DeliveryZoneUpdate(BaseModel):
    """更新配送区域"""
    name: Optional[str] = Field(None, max_length=50)
    area_code: Optional[str] = Field(None, max_length=20)
    base_fee: Optional[float] = Field(None, ge=0)
    free_threshold: Optional[float] = Field(None, gt=0)
    delivery_days: Optional[str] = Field(None, max_length=100)
    status: Optional[int] = None
    sort_order: Optional[int] = None


class DeliveryZoneResponse(DeliveryZoneBase):
    """配送区域响应"""
    id: int
    status: int
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PickupPointBase(BaseModel):
    """自提点基础模型"""
    zone_id: int
    name: str = Field(..., max_length=100, description="自提点名称")
    address: str = Field(..., max_length=255, description="自提点地址")
    contact_phone: Optional[str] = Field(None, max_length=20, description="联系电话")
    business_hours: Optional[str] = Field(None, max_length=100, description="营业时间")


class PickupPointCreate(PickupPointBase):
    """创建自提点"""
    pass


class PickupPointUpdate(BaseModel):
    """更新自提点"""
    name: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=20)
    business_hours: Optional[str] = Field(None, max_length=100)
    status: Optional[int] = None


class PickupPointResponse(PickupPointBase):
    """自提点响应"""
    id: int
    status: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
