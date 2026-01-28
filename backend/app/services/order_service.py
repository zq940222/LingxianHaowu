"""订单服务层"""
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

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
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ):
        """获取用户订单列表"""
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
