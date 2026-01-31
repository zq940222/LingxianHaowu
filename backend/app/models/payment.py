"""支付相关模型"""
from datetime import datetime
from sqlalchemy import DateTime,  Column, String, Integer, DECIMAL, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class Payment(TimestampMixin):
    """支付记录表"""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="支付ID")
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True, comment="订单ID")
    transaction_id = Column(String(64), comment="微信支付交易号")
    prepay_id = Column(String(64), comment="预支付ID")
    amount = Column(DECIMAL(10, 2), nullable=False, comment="支付金额")
    status = Column(SQLEnum(
        'pending', 'paid', 'refunding', 'refunded', 'failed', 'cancelled',
        name='payment_status'
    ), default='pending', nullable=False, comment="支付状态")
    paid_at = Column(DateTime, comment="支付时间")
    refunded_at = Column(DateTime, comment="退款时间")
    refund_amount = Column(DECIMAL(10, 2), comment="退款金额")
    refund_reason = Column(String(255), comment="退款原因")

    # 关系
    order = relationship("Order", back_populates="payment")
