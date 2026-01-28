"""商品相关Schemas"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """分类基础模型"""
    name: str = Field(..., max_length=50, description="分类名称")
    parent_id: Optional[int] = Field(None, description="父分类ID")
    icon: Optional[str] = Field(None, description="图标URL")
    sort_order: int = Field(0, description="排序")


class CategoryCreate(CategoryBase):
    """创建分类"""
    pass


class CategoryUpdate(BaseModel):
    """更新分类"""
    name: Optional[str] = Field(None, max_length=50)
    icon: Optional[str] = None
    sort_order: Optional[int] = None
    status: Optional[int] = None


class CategoryResponse(CategoryBase):
    """分类响应"""
    id: int
    status: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    """商品基础模型"""
    merchant_id: int = Field(..., description="商家ID")
    category_id: Optional[int] = Field(None, description="分类ID")
    name: str = Field(..., max_length=100, description="商品名称")
    description: Optional[str] = Field(None, description="商品描述")
    original_price: float = Field(..., gt=0, description="原价")
    price: float = Field(..., gt=0, description="售价")
    stock: int = Field(0, ge=0, description="库存")
    unit: Optional[str] = Field(None, max_length=20, description="单位")
    is_recommended: bool = False
    is_hot: bool = False
    is_group_buy: bool = False
    group_buy_price: Optional[float] = Field(None, gt=0, description="拼团价")
    group_buy_min_count: Optional[int] = Field(None, gt=0, description="拼团最少人数")
    tags: Optional[str] = Field(None, description="标签 JSON数组")


class ProductCreate(ProductBase):
    """创建商品"""
    pass


class ProductUpdate(BaseModel):
    """更新商品"""
    category_id: Optional[int] = None
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    original_price: Optional[float] = Field(None, gt=0)
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=20)
    status: Optional[int] = None
    is_recommended: Optional[bool] = None
    is_hot: Optional[bool] = None
    is_group_buy: Optional[bool] = None
    group_buy_price: Optional[float] = Field(None, gt=0)
    group_buy_min_count: Optional[int] = Field(None, gt=0)
    tags: Optional[str] = None


class ProductResponse(ProductBase):
    """商品响应"""
    id: int
    sales_count: int
    status: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductDetailResponse(ProductResponse):
    """商品详情响应"""
    images: list = Field(default_factory=list)


class ProductImageResponse(BaseModel):
    """商品图片响应"""
    id: int
    product_id: int
    image_url: str
    sort_order: int
    created_at: datetime

    class Config:
        from_attributes = True
