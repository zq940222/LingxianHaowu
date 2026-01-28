"""商品相关模型"""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DECIMAL, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import TimestampMixin


class Category(TimestampMixin):
    """商品分类表"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="分类ID")
    name = Column(String(50), nullable=False, comment="分类名称")
    parent_id = Column(Integer, comment="父分类ID")
    icon = Column(String(255), comment="图标URL")
    sort_order = Column(Integer, default=0, comment="排序")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-禁用 1-正常")

    # 关系
    products = relationship("Product", back_populates="category")


class Product(TimestampMixin):
    """商品表"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="商品ID")
    merchant_id = Column(Integer, ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, comment="商家ID")
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), comment="分类ID")
    name = Column(String(100), nullable=False, comment="商品名称")
    description = Column(Text, comment="商品描述")
    original_price = Column(DECIMAL(10, 2), nullable=False, comment="原价")
    price = Column(DECIMAL(10, 2), nullable=False, comment="售价")
    stock = Column(Integer, default=0, nullable=False, comment="库存")
    sales_count = Column(Integer, default=0, comment="销量")
    unit = Column(String(20), comment="单位")
    status = Column(Integer, default=1, nullable=False, comment="状态 0-下架 1-上架")
    is_recommended = Column(Boolean, default=False, comment="是否推荐")
    is_hot = Column(Boolean, default=False, comment="是否热销")
    is_group_buy = Column(Boolean, default=False, comment="是否拼团")
    group_buy_price = Column(DECIMAL(10, 2), comment="拼团价")
    group_buy_min_count = Column(Integer, comment="拼团最少人数")
    tags = Column(Text, comment="标签 JSON数组")

    # 关系
    merchant = relationship("Merchant", back_populates="products")
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")


class ProductImage(TimestampMixin):
    """商品图片表"""
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="图片ID")
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, comment="商品ID")
    image_url = Column(String(255), nullable=False, comment="图片URL")
    sort_order = Column(Integer, default=0, comment="排序")

    # 关系
    product = relationship("Product", back_populates="images")
