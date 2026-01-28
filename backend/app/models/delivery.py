"""配送相关模型"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DECIMAL, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class DeliveryZone(TimestampMixin):
    """配送区域表"""
    __tablename__ = "delivery_zones"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="区域ID")
    name = Column(String(50), nullable=False, comment="区域名称")
    area_code = Column(String(20), comment="区域编码")
    base_fee = Column(DECIMAL(10, 2), nullable=False, comment="基础配送费")
    free_threshold = Column(DECIMAL(10, 2), comment="满额免配送费")
    delivery_days = Column(String(100), comment="配送日期")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-启用")
    sort_order = Column(Integer, default=0, comment="排序")

    # 关系
    addresses = relationship("UserAddress", back_populates="zone")
    pickup_points = relationship("PickupPoint", back_populates="zone")


class PickupPoint(TimestampMixin):
    """自提点表"""
    __tablename__ = "pickup_points"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="自提点ID")
    zone_id = Column(Integer, ForeignKey("delivery_zones.id", ondelete="CASCADE"), nullable=False, comment="配送区域ID")
    name = Column(String(100), nullable=False, comment="自提点名称")
    address = Column(String(255), nullable=False, comment="自提点地址")
    contact_phone = Column(String(20), comment="联系电话")
    business_hours = Column(String(100), comment="营业时间")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-启用")

    # 关系
    zone = relationship("DeliveryZone", back_populates="pickup_points")
    orders = relationship("Order", back_populates="pickup_point")
