"""订单相关模型"""
from datetime import datetime
from sqlalchemy import DateTime,  Column, String, Integer, Text, DECIMAL, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class Order(TimestampMixin):
    """订单表"""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="订单ID")
    order_no = Column(String(32), unique=True, nullable=False, index=True, comment="订单号")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    total_amount = Column(DECIMAL(10, 2), nullable=False, comment="订单总金额")
    discount_amount = Column(DECIMAL(10, 2), default=0.00, comment="优惠金额")
    delivery_fee = Column(DECIMAL(10, 2), default=0.00, comment="配送费")
    final_amount = Column(DECIMAL(10, 2), nullable=False, comment="实付金额")
    status = Column(SQLEnum(
        'pending', 'paid', 'preparing', 'ready', 'delivering', 'completed', 'cancelled', 'refunding', 'refunded',
        name='order_status'
    ), default='pending', nullable=False, comment="订单状态")
    delivery_type = Column(Integer, nullable=False, comment="配送方式 1-配送 2-自提")
    delivery_address = Column(Text, comment="配送地址")
    pickup_point_id = Column(Integer, ForeignKey("pickup_points.id", ondelete="SET NULL"), comment="自提点ID")
    delivery_time_slot = Column(String(50), comment="配送时间段")
    remark = Column(Text, comment="订单备注")
    cancelled_at = Column(DateTime, comment="取消时间")
    cancel_reason = Column(String(255), comment="取消原因")
    completed_at = Column(DateTime, comment="完成时间")

    # 关系
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    logs = relationship("OrderLog", back_populates="order", cascade="all, delete-orphan")
    pickup_point = relationship("PickupPoint", back_populates="orders")


class OrderItem(TimestampMixin):
    """订单商品表"""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, comment="订单ID")
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), comment="商品ID")
    product_name = Column(String(100), nullable=False, comment="商品名称")
    product_image = Column(String(255), comment="商品图片")
    price = Column(DECIMAL(10, 2), nullable=False, comment="单价")
    quantity = Column(Integer, nullable=False, comment="数量")
    subtotal = Column(DECIMAL(10, 2), nullable=False, comment="小计")

    # 关系
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class OrderLog(TimestampMixin):
    """订单日志表"""
    __tablename__ = "order_logs"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="日志ID")
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, comment="订单ID")
    status = Column(String(20), nullable=False, comment="订单状态")
    operator = Column(String(50), comment="操作人")
    remark = Column(Text, comment="备注")

    # 关系
    order = relationship("Order", back_populates="logs")
