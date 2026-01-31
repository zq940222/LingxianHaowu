"""订单服务层"""
from datetime import datetime
from typing import Optional, Union, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from app.models.order import Order, OrderItem, OrderLog
from app.core.crud import CRUDBase
from app.schemas.order import OrderCreate, OrderUpdate


class CRUDOrder(CRUDBase[Order, OrderCreate, OrderUpdate]):
    async def get_by_order_no(self, db: AsyncSession, order_no: str) -> Optional[Order]:
        """根据订单号获取订单"""
        return await self.get_by_field(db, field_name="order_no", field_value=order_no)

    async def get_user_orders(
        self,
        db: AsyncSession,
        user_id: int,
        status: Optional[Union[str, List[str]]] = None,
        skip: int = 0,
        limit: int = 100
    ):
        """获取用户订单列表

        支持：
        - status=None：不筛选
        - status="pending"：单状态
        - status=["paid","preparing"]：多状态（IN 查询）
        """
        # 多状态：走手写查询（CRUDBase.get_multi 只支持等值过滤）
        if isinstance(status, list):
            query = select(self.model).where(self.model.user_id == user_id)
            if status:
                query = query.where(self.model.status.in_(status))

            count_query = select(func.count()).select_from(query.subquery())
            total = (await db.execute(count_query)).scalar() or 0

            query = query.offset(skip).limit(limit)
            result = await db.execute(query)
            items = result.scalars().all()
            return list(items), int(total)

        # 单状态/不筛选：沿用通用 CRUD
        filters = {"user_id": user_id}
        if status:
            filters["status"] = status
        return await self.get_multi(db, skip=skip, limit=limit, **filters)

    async def create_order(
        self,
        db: AsyncSession,
        user_id: int,
        order_data: dict,
        items_data: list
    ) -> Order:
        """创建订单（含商品明细）"""
        # 创建订单
        order = Order(**order_data)
        db.add(order)
        await db.flush()  # 获取订单ID

        # 创建订单商品明细
        total_amount = 0
        for item_data in items_data:
            item = OrderItem(order_id=order.id, **item_data)
            total_amount += item.subtotal
            db.add(item)

        # 记录订单日志
        log = OrderLog(
            order_id=order.id,
            status="pending",
            remark="订单创建"
        )
        db.add(log)

        await db.commit()
        await db.refresh(order)
        return order

    async def update_order_status(
        self,
        db: AsyncSession,
        order: Order,
        new_status: str,
        operator: Optional[str] = None,
        remark: Optional[str] = None
    ) -> Order:
        """更新订单状态"""
        old_status = order.status
        order.status = new_status

        # 根据状态更新时间字段
        if new_status == "cancelled" and not order.cancelled_at:
            order.cancelled_at = datetime.utcnow()
        elif new_status == "completed" and not order.completed_at:
            order.completed_at = datetime.utcnow()

        db.add(order)

        # 记录日志
        log = OrderLog(
            order_id=order.id,
            status=new_status,
            operator=operator,
            remark=remark or f"订单状态从 {old_status} 变更为 {new_status}"
        )
        db.add(log)

        await db.commit()
        await db.refresh(order)
        return order


class CRUDOrderItem(CRUDBase[OrderItem, dict, dict]):
    async def get_order_items(self, db: AsyncSession, order_id: int):
        """获取订单商品明细"""
        return await self.get_multi(db, order_id=order_id)


class CRUDOrderLog(CRUDBase[OrderLog, dict, dict]):
    async def get_order_logs(self, db: AsyncSession, order_id: int):
        """获取订单日志"""
        return await self.get_multi(db, order_id=order_id)


# 导出实例
order = CRUDOrder(Order)
order_item = CRUDOrderItem(OrderItem)
order_log = CRUDOrderLog(OrderLog)
