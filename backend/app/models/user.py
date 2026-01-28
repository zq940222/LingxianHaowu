"""用户相关模型"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, BigInteger, Boolean, DateTime, Text, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class User(TimestampMixin):
    """用户表"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="用户ID")
    openid = Column(String(64), unique=True, nullable=False, index=True, comment="微信openid")
    nickname = Column(String(50), nullable=False, comment="昵称")
    avatar = Column(String(255), comment="头像URL")
    phone = Column(String(20), comment="手机号")
    total_points = Column(Integer, default=0, nullable=False, comment="总积分")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-正常")
    last_sign_in_at = Column(DateTime, comment="最后签到时间")

    # 关系
    addresses = relationship("UserAddress", back_populates="user", cascade="all, delete-orphan")
    sign_in_records = relationship("SignInRecord", back_populates="user", cascade="all, delete-orphan")
    points_records = relationship("PointsRecord", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    user_coupons = relationship("UserCoupon", back_populates="user", cascade="all, delete-orphan")
    activity_records = relationship("ActivityRecord", back_populates="user", cascade="all, delete-orphan")


class UserAddress(TimestampMixin):
    """用户地址表"""
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="地址ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    receiver_name = Column(String(50), nullable=False, comment="收货人姓名")
    receiver_phone = Column(String(20), nullable=False, comment="收货人电话")
    province = Column(String(50), nullable=False, comment="省份")
    city = Column(String(50), nullable=False, comment="城市")
    district = Column(String(50), comment="区县")
    detail_address = Column(String(255), nullable=False, comment="详细地址")
    is_default = Column(Boolean, default=False, nullable=False, comment="是否默认地址")
    zone_id = Column(Integer, ForeignKey("delivery_zones.id", ondelete="SET NULL"), comment="配送区域ID")

    # 关系
    user = relationship("User", back_populates="addresses")
    zone = relationship("DeliveryZone", back_populates="addresses")


class SignInRecord(TimestampMixin):
    """签到记录表"""
    __tablename__ = "sign_in_records"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    sign_date = Column(String(10), nullable=False, comment="签到日期 YYYY-MM-DD")
    points = Column(Integer, nullable=False, comment="获得积分数")

    # 关系
    user = relationship("User", back_populates="sign_in_records")


class PointsRecord(TimestampMixin):
    """积分记录表"""
    __tablename__ = "points_records"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    change_type = Column(Integer, nullable=False, comment="类型 1-获得 2-消耗")
    points = Column(Integer, nullable=False, comment="积分数")
    source_type = Column(Integer, nullable=False, comment="来源类型 1-签到 2-订单 3-活动")
    source_id = Column(Integer, comment="来源ID")
    description = Column(String(255), comment="描述")

    # 关系
    user = relationship("User", back_populates="points_records")
