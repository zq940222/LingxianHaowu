"""积分相关Schemas"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PointRuleBase(BaseModel):
    """积分规则基础模型"""
    rule_type: int = Field(..., description="规则类型 1-签到 2-订单 3-活动")
    points: int = Field(..., description="积分数")
    description: Optional[str] = Field(None, max_length=255, description="描述")


class PointRuleCreate(PointRuleBase):
    """创建积分规则"""
    pass


class PointRuleUpdate(BaseModel):
    """更新积分规则"""
    points: Optional[int] = None
    description: Optional[str] = Field(None, max_length=255)


class PointRuleResponse(PointRuleBase):
    """积分规则响应"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SignInRequest(BaseModel):
    """签到请求"""
    pass


class SignInResponse(BaseModel):
    """签到响应"""
    success: bool
    points: int
    message: str
    record: Optional[dict] = None


class PointsRecordRequest(BaseModel):
    """积分记录请求"""
    skip: int = 0
    limit: int = 20
