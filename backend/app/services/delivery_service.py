"""配送服务层"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.delivery import DeliveryZone, PickupPoint
from app.core.crud import CRUDBase
from app.schemas.delivery import DeliveryZoneCreate, DeliveryZoneUpdate, PickupPointCreate, PickupPointUpdate


class CRUDDeliveryZone(CRUDBase[DeliveryZone, DeliveryZoneCreate, DeliveryZoneUpdate]):
    async def get_active_zones(self, db: AsyncSession):
        """获取启用的配送区域"""
        result = await db.execute(
            select(DeliveryZone).where(DeliveryZone.status == 1).order_by(DeliveryZone.sort_order)
        )
        return result.scalars().all()

    async def calculate_delivery_fee(
        self,
        db: AsyncSession,
        zone_id: int,
        order_amount: float
    ) -> float:
        """计算配送费"""
        zone = await self.get(db, zone_id)
        if not zone:
            return 0.0

        # 检查是否满额免运费
        if zone.free_threshold and order_amount >= zone.free_threshold:
            return 0.0

        return float(zone.base_fee)


class CRUDPickupPoint(CRUDBase[PickupPoint, PickupPointCreate, PickupPointUpdate]):
    async def get_by_zone(self, db: AsyncSession, zone_id: int):
        """根据配送区域获取自提点"""
        return await self.get_multi(db, zone_id=zone_id)

    async def get_active_points(self, db: AsyncSession):
        """获取启用的自提点"""
        result = await db.execute(
            select(PickupPoint).where(PickupPoint.status == 1)
        )
        return result.scalars().all()


# 导出实例
delivery_zone = CRUDDeliveryZone(DeliveryZone)
pickup_point = CRUDPickupPoint(PickupPoint)
