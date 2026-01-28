"""商家相关模型"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DECIMAL
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class Merchant(TimestampMixin):
    """商家表"""
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="商家ID")
    name = Column(String(100), nullable=False, comment="商家名称")
    description = Column(Text, comment="商家描述")
    logo = Column(String(255), comment="Logo URL")
    contact_phone = Column(String(20), nullable=False, comment="联系电话")
    address = Column(String(255), comment="地址")
    business_hours = Column(String(100), comment="营业时间")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-正常")
    sort_order = Column(Integer, default=0, comment="排序")

    # 关系
    products = relationship("Product", back_populates="merchant", cascade="all, delete-orphan")
