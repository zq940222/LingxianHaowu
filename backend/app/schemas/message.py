"""消息相关Schemas"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TemplateMessageBase(BaseModel):
    """模板消息基础模型"""
    template_id: str = Field(..., max_length=64, description="模板ID")
    title: str = Field(..., max_length=100, description="模板标题")
    content: str = Field(..., description="模板内容")
    example: Optional[str] = Field(None, description="示例")
    type: int = Field(..., description="类型 1-订单 2-支付 3-配送 4-其他")


class TemplateMessageCreate(TemplateMessageBase):
    """创建模板消息"""
    pass


class TemplateMessageUpdate(BaseModel):
    """更新模板消息"""
    title: Optional[str] = Field(None, max_length=100)
    content: Optional[str] = None
    example: Optional[str] = None
    type: Optional[int] = None
    status: Optional[int] = None


class TemplateMessageResponse(TemplateMessageBase):
    """模板消息响应"""
    id: int
    status: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InternalMessageBase(BaseModel):
    """站内消息基础模型"""
    title: str = Field(..., max_length=100, description="消息标题")
    content: str = Field(..., description="消息内容")
    message_type: int = Field(..., description="消息类型 1-系统通知 2-订单 3-活动")


class InternalMessageCreate(InternalMessageBase):
    """创建站内消息"""
    user_id: int
    scene_type: Optional[int] = None
    scene_id: Optional[int] = None


class InternalMessageResponse(InternalMessageBase):
    """站内消息响应"""
    id: int
    user_id: int
    is_read: bool
    read_time: Optional[datetime] = None
    scene_type: Optional[int] = None
    scene_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    """发送消息请求"""
    user_id: int
    message_type: int = Field(..., description="消息类型 1-模板消息 2-短信 3-站内消息")
    scene_type: int = Field(..., description="场景类型 1-订单创建 2-支付成功 3-订单发货 4-订单完成")
    scene_id: int = Field(..., description="场景ID")
    data: Optional[dict] = Field(None, description="模板数据")


class SmsSendRequest(BaseModel):
    """发送短信请求"""
    phone: str = Field(..., max_length=20, description="手机号")
    template_code: str = Field(..., max_length=50, description="短信模板代码")
    params: Optional[dict] = Field(None, description="模板参数")
