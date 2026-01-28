"""
商品相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.services.product_service import product, category, product_image
from app.schemas.product import (
    ProductCreate, ProductUpdate, CategoryCreate, CategoryUpdate,
    ProductDetailResponse, CategoryResponse
)

router = APIRouter()


# 管理员依赖（TODO：实际项目中需要实现）
async def get_admin_id() -> int:
    """获取当前管理员ID"""
    return 1  # 模拟管理员ID


class ProductCreateRequest(BaseModel):
    """创建商品请求"""
    merchant_id: int
    category_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    original_price: float
    price: float
    stock: int = 0
    unit: Optional[str] = None
    is_recommended: bool = False
    is_hot: bool = False
    is_group_buy: bool = False
    group_buy_price: Optional[float] = None
    group_buy_min_count: Optional[int] = None
    tags: Optional[str] = None
    images: List[str] = []


class ProductUpdateRequest(BaseModel):
    """更新商品请求"""
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    unit: Optional[str] = None
    status: Optional[int] = None
    is_recommended: Optional[bool] = None
    is_hot: Optional[bool] = None
    is_group_buy: Optional[bool] = None
    group_buy_price: Optional[float] = None
    group_buy_min_count: Optional[int] = None
    tags: Optional[str] = None


@router.get("/")
async def get_products(
    keyword: Optional[str] = None,
    category_id: Optional[int] = None,
    is_recommended: Optional[bool] = None,
    is_hot: Optional[bool] = None,
    is_group_buy: Optional[bool] = None,
    merchant_id: Optional[int] = None,
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    获取商品列表（支持搜索和筛选）

    Args:
        keyword: 搜索关键词
        category_id: 分类ID
        is_recommended: 是否推荐
        is_hot: 是否热销
        is_group_buy: 是否拼团
        merchant_id: 商家ID
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    items, total = await product.search_products(
        db=db,
        keyword=keyword,
        category_id=category_id,
        is_recommended=is_recommended,
        is_hot=is_hot,
        is_group_buy=is_group_buy,
        merchant_id=merchant_id,
        skip=skip,
        limit=size
    )

    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.get("/recommended")
async def get_recommended_products(
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    获取推荐商品列表

    Args:
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    items, total = await product.search_products(
        db=db,
        is_recommended=True,
        skip=skip,
        limit=size
    )

    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.get("/hot")
async def get_hot_products(
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    获取热销商品列表

    Args:
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    items, total = await product.search_products(
        db=db,
        is_hot=True,
        skip=skip,
        limit=size
    )

    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.get("/group-buy")
async def get_group_buy_products(
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """
    获取拼团商品列表

    Args:
        page: 页码
        size: 每页数量

    Returns:
        dict
    """
    skip = (page - 1) * size

    items, total = await product.search_products(
        db=db,
        is_group_buy=True,
        skip=skip,
        limit=size
    )

    return success_response(
        data={
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.get("/{product_id}")
async def get_product_detail(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    获取商品详情（含图片）

    Args:
        product_id: 商品ID

    Returns:
        dict
    """
    product_detail = await product.get_product_detail(db, product_id)

    if not product_detail:
        return error_response(message="商品不存在")

    return success_response(data=product_detail)


@router.post("/")
async def create_product(
    request: ProductCreateRequest,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    创建商品（管理员）

    Args:
        request: 商品创建请求

    Returns:
        dict
    """
    product_data = request.model_dump(exclude={"images"})
    new_product = await product.create(db, obj_in=product_data)

    # 添加商品图片
    if request.images:
        for idx, image_url in enumerate(request.images):
            image_data = {
                "product_id": new_product.id,
                "image_url": image_url,
                "sort_order": idx
            }
            await product_image.create(db, obj_in=image_data)

    # 重新获取含图片的商品详情
    product_detail = await product.get_product_detail(db, new_product.id)

    return success_response(data=product_detail, message="创建成功")


@router.put("/{product_id}")
async def update_product(
    product_id: int,
    request: ProductUpdateRequest,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    更新商品（管理员）

    Args:
        product_id: 商品ID
        request: 商品更新请求

    Returns:
        dict
    """
    product_obj = await product.get(db, product_id)
    if not product_obj:
        return error_response(message="商品不存在")

    updated_product = await product.update(db, db_obj=product_obj, obj_in=request)

    return success_response(data=updated_product, message="更新成功")


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    删除商品（管理员）

    Args:
        product_id: 商品ID

    Returns:
        dict
    """
    product_obj = await product.get(db, product_id)
    if not product_obj:
        return error_response(message="商品不存在")

    await product.delete(db, id=product_id)

    return success_response(message="删除成功")


@router.get("/categories/list")
async def get_categories(
    parent_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    获取商品分类列表

    Args:
        parent_id: 父分类ID（不传则获取所有）

    Returns:
        List[dict]
    """
    if parent_id is None:
        # 获取父级分类
        categories = await category.get_parent_categories(db)
    else:
        # 获取子分类
        categories = await category.get_subcategories(db, parent_id)

    return success_response(data=categories)


@router.post("/categories/")
async def create_category(
    request: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    创建分类（管理员）

    Args:
        request: 分类创建请求

    Returns:
        dict
    """
    new_category = await category.create(db, obj_in=request)

    return success_response(data=new_category, message="创建成功")


@router.put("/categories/{category_id}")
async def update_category(
    category_id: int,
    request: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    更新分类（管理员）

    Args:
        category_id: 分类ID
        request: 分类更新请求

    Returns:
        dict
    """
    category_obj = await category.get(db, category_id)
    if not category_obj:
        return error_response(message="分类不存在")

    updated_category = await category.update(db, db_obj=category_obj, obj_in=request)

    return success_response(data=updated_category, message="更新成功")


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    admin_id: int = Depends(get_admin_id)
):
    """
    删除分类（管理员）

    Args:
        category_id: 分类ID

    Returns:
        dict
    """
    category_obj = await category.get(db, category_id)
    if not category_obj:
        return error_response(message="分类不存在")

    await category.delete(db, id=category_id)

    return success_response(message="删除成功")
