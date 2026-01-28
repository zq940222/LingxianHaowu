"""活动相关模型"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Boolean, DECIMAL
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class Activity(TimestampMixin):
    """活动弹窗表"""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="活动ID")
    title = Column(String(100), nullable=False, comment="活动标题")
    description = Column(Text, comment="活动描述")
    image_url = Column(String(255), comment="弹窗图片URL")
    link_url = Column(String(255), comment="跳转链接")
    link_type = Column(Integer, comment="链接类型 1-商品页 2-活动页 3-外部链接")
    display_type = Column(Integer, nullable=False, comment="展示类型 1-每日一次 2-首次进入")
    start_at = Column(DateTime, nullable=False, comment="开始时间")
    end_at = Column(DateTime, nullable=False, comment="结束时间")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-启用")
    sort_order = Column(Integer, default=0, comment="排序")

    # 关系
    activity_records = relationship("ActivityRecord", back_populates="activity", cascade="all, delete-orphan")


class ActivityRecord(TimestampMixin):
    """用户活动记录表"""
    __tablename__ = "activity_records"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False, comment="活动ID")
    record_date = Column(String(10), nullable=False, comment="记录日期 YYYY-MM-DD")
    display_count = Column(Integer, default=1, comment="展示次数")

    # 关系
    user = relationship("User", back_populates="activity_records")
    activity = relationship("Activity", back_populates="activity_records")


class Coupon(TimestampMixin):
    """优惠券表"""
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="优惠券ID")
    name = Column(String(100), nullable=False, comment="优惠券名称")
    description = Column(Text, comment="优惠券描述")
    coupon_type = Column(Integer, nullable=False, comment="优惠券类型 1-满减券 2-折扣券")
    discount_amount = Column(DECIMAL(10, 2), comment="减免金额")
    discount_rate = Column(DECIMAL(5, 2), comment="折扣率")
    min_amount = Column(DECIMAL(10, 2), comment="最低消费金额")
    total_quantity = Column(Integer, default=0, comment="发放总数")
    used_quantity = Column(Integer, default=0, comment="已使用数量")
    valid_days = Column(Integer, comment="有效天数")
    start_at = Column(DateTime, comment="开始时间")
    end_at = Column(DateTime, comment="结束时间")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-启用")

    # 关系
    user_coupons = relationship("UserCoupon", back_populates="coupon", cascade="all, delete-orphan")


class UserCoupon(TimestampMixin):
    """用户优惠券表"""
    __tablename__ = "user_coupons"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, comment="用户ID")
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False, comment="优惠券ID")
    status = Column(Integer, default=0, nullable=False, comment="状态 0-未使用 1-已使用 2-已过期")
    used_at = Column(DateTime, comment="使用时间")
    used_order_id = Column(Integer, comment="使用订单ID")
    expire_at = Column(DateTime, nullable=False, comment="过期时间")

    # 关系
    user = relationship("User", back_populates="user_coupons")
    coupon = relationship("Coupon", back_populates="user_coupons")
