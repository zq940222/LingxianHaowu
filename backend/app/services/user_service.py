"""用户服务层"""
from typing import Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserAddress, SignInRecord, PointsRecord
from app.core.crud import CRUDBase
from app.schemas.user import UserCreate, UserUpdate, AddressCreate, AddressUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_openid(self, db: AsyncSession, openid: str) -> Optional[User]:
        """根据openid获取用户"""
        return await self.get_by_field(db, field_name="openid", field_value=openid)

    async def update_points(
        self,
        db: AsyncSession,
        user: User,
        points: int,
        change_type: int,
        source_type: int,
        description: str,
        source_id: Optional[int] = None
    ) -> User:
        """更新用户积分"""
        user.total_points += points
        db.add(user)
        await db.commit()

        # 记录积分变化
        points_record = PointsRecord(
            user_id=user.id,
            change_type=change_type,
            points=points,
            source_type=source_type,
            source_id=source_id,
            description=description
        )
        db.add(points_record)
        await db.commit()

        return user


class CRUDAddress(CRUDBase[UserAddress, AddressCreate, AddressUpdate]):
    async def get_user_addresses(
        self,
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ):
        """获取用户地址列表"""
        return await self.get_multi(db, skip=skip, limit=limit, user_id=user_id)

    async def set_default_address(self, db: AsyncSession, address: UserAddress, user_id: int):
        """设置默认地址"""
        # 取消其他默认地址
        from sqlalchemy import update
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == user_id)
            .values(is_default=False)
        )
        # 设置当前地址为默认
        address.is_default = True
        db.add(address)
        await db.commit()


class CRUDSignInRecord(CRUDBase[SignInRecord, dict, dict]):
    async def has_signed_today(self, db: AsyncSession, user_id: int) -> bool:
        """检查今天是否已签到"""
        today = date.today().strftime("%Y-%m-%d")
        result = await db.execute(
            select(SignInRecord).where(
                SignInRecord.user_id == user_id,
                SignInRecord.sign_date == today
            )
        )
        return result.scalar_one_or_none() is not None


class CRUDPointsRecord(CRUDBase[PointsRecord, dict, dict]):
    async def get_user_points_records(
        self,
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ):
        """获取用户积分记录"""
        return await self.get_multi(db, skip=skip, limit=limit, user_id=user_id)


# 导出实例
user = CRUDUser(User)
address = CRUDAddress(UserAddress)
sign_in_record = CRUDSignInRecord(SignInRecord)
points_record = CRUDPointsRecord(PointsRecord)
