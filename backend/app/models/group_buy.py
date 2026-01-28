"""拼团相关模型"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class GroupBuy(TimestampMixin):
    """拼团表"""
    __tablename__ = "group_buys"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="拼团ID")
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True, comment="发起订单ID")
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="商品ID")
    group_buy_code = Column(String(32), unique=True, nullable=False, index=True, comment="拼团码")
    leader_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), comment="团长用户ID")
    required_count = Column(Integer, nullable=False, comment="需要人数")
    current_count = Column(Integer, default=1, nullable=False, comment="当前人数")
    expire_at = Column(DateTime, nullable=False, comment="过期时间")
    status = Column(SQLEnum(
        'ongoing', 'completed', 'failed',
        name='group_buy_status'
    ), default='ongoing', nullable=False, comment="拼团状态")

    # 关系
    order = relationship("Order", uselist=False)
    product = relationship("Product")
    leader = relationship("User")
    members = relationship("GroupBuyMember", back_populates="group_buy", cascade="all, delete-orphan")


class GroupBuyMember(TimestampMixin):
    """拼团成员表"""
    __tablename__ = "group_buy_members"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="成员ID")
    group_buy_id = Column(Integer, ForeignKey("group_buys.id", ondelete="CASCADE"), nullable=False, comment="拼团ID")
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), comment="订单ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    join_time = Column(DateTime, default=datetime.utcnow, nullable=False, comment="加入时间")

    # 关系
    group_buy = relationship("GroupBuy", back_populates="members")
    order = relationship("Order")
    user = relationship("User")
