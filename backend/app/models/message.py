"""消息相关模型"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class TemplateMessage(TimestampMixin):
    """模板消息配置表"""
    __tablename__ = "template_messages"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="模板ID")
    template_id = Column(String(64), unique=True, nullable=False, comment="微信模板ID")
    title = Column(String(100), nullable=False, comment="模板标题")
    content = Column(Text, nullable=False, comment="模板内容")
    example = Column(Text, comment="示例")
    type = Column(Integer, nullable=False, comment="类型 1-订单 2-支付 3-配送 4-其他")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-启用")


class MessageLog(TimestampMixin):
    """消息发送记录表"""
    __tablename__ = "message_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    message_type = Column(Integer, nullable=False, comment="消息类型 1-模板消息 2-短信 3-站内消息")
    template_id = Column(String(64), comment="模板ID")
    content = Column(Text, comment="消息内容")
    data = Column(Text, comment="模板数据(JSON)")
    send_status = Column(Integer, default=0, nullable=False, comment="发送状态 0-待发送 1-发送成功 2-发送失败")
    error_msg = Column(Text, comment="错误信息")
    send_time = Column(DateTime, comment="发送时间")
    scene_type = Column(Integer, comment="场景类型 1-订单创建 2-支付成功 3-订单发货 4-订单完成")

    # 关系
    user = relationship("User", backref="message_logs")


class InternalMessage(TimestampMixin):
    """站内消息表"""
    __tablename__ = "internal_messages"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="消息ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    title = Column(String(100), nullable=False, comment="消息标题")
    content = Column(Text, nullable=False, comment="消息内容")
    message_type = Column(Integer, default=1, nullable=False, comment="消息类型 1-系统通知 2-订单 3-活动")
    is_read = Column(Boolean, default=False, nullable=False, comment="是否已读")
    read_time = Column(DateTime, comment="阅读时间")
    scene_type = Column(Integer, comment="场景类型")
    scene_id = Column(Integer, comment="场景ID")

    # 关系
    user = relationship("User", backref="internal_messages")


class SmsLog(TimestampMixin):
    """短信发送记录表"""
    __tablename__ = "sms_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    phone = Column(String(20), nullable=False, comment="手机号")
    template_code = Column(String(50), comment="短信模板代码")
    content = Column(Text, nullable=False, comment="短信内容")
    send_status = Column(Integer, default=0, nullable=False, comment="发送状态 0-待发送 1-发送成功 2-发送失败")
    error_msg = Column(Text, comment="错误信息")
    send_time = Column(DateTime, comment="发送时间")
