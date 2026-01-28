"""配置相关模型"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text
from .base import TimestampMixin


class PointRule(TimestampMixin):
    """积分规则表"""
    __tablename__ = "point_rules"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="规则ID")
    rule_type = Column(Integer, nullable=False, unique=True, comment="规则类型 1-签到 2-订单 3-活动")
    points = Column(Integer, nullable=False, comment="积分数")
    description = Column(String(255), comment="描述")


class Admin(TimestampMixin):
    """管理员表"""
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="管理员ID")
    username = Column(String(50), unique=True, nullable=False, comment="用户名")
    password_hash = Column(String(255), nullable=False, comment="密码哈希")
    real_name = Column(String(50), comment="真实姓名")
    phone = Column(String(20), comment="手机号")
    email = Column(String(100), comment="邮箱")
    role = Column(Integer, default=1, nullable=False, comment="角色 1-超级管理员 2-普通管理员")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-正常")
