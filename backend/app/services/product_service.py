"""商品服务层"""
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_

from app.models.product import Product, ProductImage, Category
from app.models.merchant import Merchant
from app.core.crud import CRUDBase
from app.schemas.product import ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate


class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    async def get_by_merchant(
        self,
        db: AsyncSession,
        merchant_id: int,
        skip: int = 0,
        limit: int = 100
    ):
        """获取商家商品列表"""
        return await self.get_multi(db, skip=skip, limit=limit, merchant_id=merchant_id)

    async def search_products(
        self,
        db: AsyncSession,
        keyword: Optional[str] = None,
        category_id: Optional[int] = None,
        is_recommended: Optional[bool] = None,
        is_hot: Optional[bool] = None,
        is_group_buy: Optional[bool] = None,
        merchant_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ):
        """搜索商品"""
        query = select(Product).where(Product.status == 1)

        if keyword:
            query = query.where(Product.name.contains(keyword))

        if category_id:
            query = query.where(Product.category_id == category_id)

        if is_recommended is not None:
            query = query.where(Product.is_recommended == is_recommended)

        if is_hot is not None:
            query = query.where(Product.is_hot == is_hot)

        if is_group_buy is not None:
            query = query.where(Product.is_group_buy == is_group_buy)

        if merchant_id:
            query = query.where(Product.merchant_id == merchant_id)

        # 获取总数
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar()

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        items = result.scalars().all()

        return list(items), total

    async def get_product_detail(self, db: AsyncSession, product_id: int) -> Optional[Dict[str, Any]]:
        """获取商品详情（含图片）"""
        product = await self.get(db, product_id)
        if not product:
            return None

        # 获取商品图片
        result = await db.execute(
            select(ProductImage).where(ProductImage.product_id == product_id)
        )
        images = result.scalars().all()

        return {
            "product": product,
            "images": list(images)
        }


class CRUDCategory(CRUDBase[Category, CategoryCreate, CategoryUpdate]):
    async def get_parent_categories(self, db: AsyncSession):
        """获取父级分类"""
        result = await db.execute(
            select(Category).where(Category.parent_id.is_(None)).order_by(Category.sort_order)
        )
        return result.scalars().all()

    async def get_subcategories(self, db: AsyncSession, parent_id: int):
        """获取子分类"""
        result = await db.execute(
            select(Category).where(Category.parent_id == parent_id).order_by(Category.sort_order)
        )
        return result.scalars().all()


class CRUDProductImage(CRUDBase[ProductImage, dict, dict]):
    async def get_product_images(self, db: AsyncSession, product_id: int):
        """获取商品图片列表"""
        return await self.get_multi(db, product_id=product_id)


# 导出实例
product = CRUDProduct(Product)
category = CRUDCategory(Category)
product_image = CRUDProductImage(ProductImage)
