"""用户相关Schemas"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class UserBase(BaseModel):
    """用户基础模型"""
    openid: str = Field(..., description="微信openid")
    nickname: str = Field(..., max_length=50, description="昵称")
    avatar: Optional[str] = Field(None, description="头像URL")
    phone: Optional[str] = Field(None, max_length=20, description="手机号")


class UserCreate(UserBase):
    """创建用户"""
    pass


class UserUpdate(BaseModel):
    """更新用户"""
    nickname: Optional[str] = Field(None, max_length=50)
    avatar: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)


class UserResponse(UserBase):
    """用户响应"""
    id: int
    total_points: int
    status: int
    last_sign_in_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AddressBase(BaseModel):
    """地址基础模型"""
    receiver_name: str = Field(..., max_length=50, description="收货人姓名")
    receiver_phone: str = Field(..., max_length=20, description="收货人电话")
    province: str = Field(..., max_length=50, description="省份")
    city: str = Field(..., max_length=50, description="城市")
    district: Optional[str] = Field(None, max_length=50, description="区县")
    detail_address: str = Field(..., max_length=255, description="详细地址")
    zone_id: Optional[int] = Field(None, description="配送区域ID")


class AddressCreate(AddressBase):
    """创建地址"""
    is_default: bool = False


class AddressUpdate(BaseModel):
    """更新地址"""
    receiver_name: Optional[str] = Field(None, max_length=50)
    receiver_phone: Optional[str] = Field(None, max_length=20)
    province: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=50)
    district: Optional[str] = Field(None, max_length=50)
    detail_address: Optional[str] = Field(None, max_length=255)
    is_default: Optional[bool] = None
    zone_id: Optional[int] = None


class AddressResponse(AddressBase):
    """地址响应"""
    id: int
    user_id: int
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SignInResponse(BaseModel):
    """签到响应"""
    id: int
    user_id: int
    sign_date: str
    points: int
    created_at: datetime

    class Config:
        from_attributes = True


class PointsRecordResponse(BaseModel):
    """积分记录响应"""
    id: int
    user_id: int
    change_type: int
    points: int
    source_type: int
    source_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
