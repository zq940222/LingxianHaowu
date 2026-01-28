"""活动服务层"""
from datetime import datetime, date, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func

from app.models.activity import Activity, ActivityRecord, Coupon, UserCoupon
from app.core.crud import CRUDBase
from app.schemas.activity import (
    ActivityCreate, ActivityUpdate,
    CouponCreate, CouponUpdate,
    UserCouponCreate, UserCouponUpdate
)


class CRUDActivity(CRUDBase[Activity, ActivityCreate, ActivityUpdate]):
    """活动CRUD"""

    async def get_active_activities(self, db: AsyncSession) -> List[Activity]:
        """获取当前有效的活动"""
        now = datetime.utcnow()
        result = await db.execute(
            select(Activity).where(
                Activity.status == 1,
                Activity.start_at <= now,
                Activity.end_at >= now
            ).order_by(Activity.sort_order.desc(), Activity.created_at.desc())
        )
        return result.scalars().all()

    async def get_activity_for_user(
        self,
        db: AsyncSession,
        user_id: int,
        activity: Activity
    ) -> Optional[Activity]:
        """
        获取用户应该显示的活动
        display_type=1: 每日一次
        display_type=2: 首次进入
        """
        today = date.today().strftime("%Y-%m-%d")

        # 检查今日是否已展示
        result = await db.execute(
            select(ActivityRecord).where(
                ActivityRecord.user_id == user_id,
                ActivityRecord.activity_id == activity.id,
                ActivityRecord.record_date == today
            )
        )
        record = result.scalar_one_or_none()

        if record:
            # 已展示过，检查是否每日一次
            if activity.display_type == 1:
                return None  # 每日一次，今日不再展示
        else:
            # 首次进入
            if activity.display_type == 2:
                return activity  # 首次进入需要展示

        return activity

    async def get_popup_for_user(self, db: AsyncSession, user_id: int) -> Optional[Activity]:
        """获取用户应该展示的活动弹窗"""
        active_activities = await self.get_active_activities(db)

        for activity in active_activities:
            popup = await self.get_activity_for_user(db, user_id, activity)
            if popup:
                return popup

        return None

    async def record_activity_display(
        self,
        db: AsyncSession,
        user_id: int,
        activity_id: int
    ):
        """记录活动展示"""
        today = date.today().strftime("%Y-%m-%d")

        result = await db.execute(
            select(ActivityRecord).where(
                ActivityRecord.user_id == user_id,
                ActivityRecord.activity_id == activity_id,
                ActivityRecord.record_date == today
            )
        )
        record = result.scalar_one_or_none()

        if record:
            record.display_count += 1
            db.add(record)
        else:
            record = ActivityRecord(
                user_id=user_id,
                activity_id=activity_id,
                record_date=today,
                display_count=1
            )
            db.add(record)

        await db.commit()

    async def get_activity_stats(self, db: AsyncSession, activity_id: int) -> dict:
        """获取活动统计数据"""
        # 总展示次数
        display_result = await db.execute(
            select(func.sum(ActivityRecord.display_count)).where(
                ActivityRecord.activity_id == activity_id
            )
        )
        total_displays = display_result.scalar() or 0

        # 独立用户数
        unique_users_result = await db.execute(
            select(func.count(func.distinct(ActivityRecord.user_id))).where(
                ActivityRecord.activity_id == activity_id
            )
        )
        unique_users = unique_users_result.scalar() or 0

        # 今日展示次数
        today = date.today().strftime("%Y-%m-%d")
        today_result = await db.execute(
            select(func.sum(ActivityRecord.display_count)).where(
                and_(
                    ActivityRecord.activity_id == activity_id,
                    ActivityRecord.record_date == today
                )
            )
        )
        today_displays = today_result.scalar() or 0

        return {
            "total_displays": total_displays,
            "unique_users": unique_users,
            "today_displays": today_displays
        }


class CRUDDiscount(CRUDBase[Coupon, CouponCreate, CouponUpdate]):
    """优惠券CRUD"""

    async def get_active_coupons(self, db: AsyncSession) -> List[Coupon]:
        """获取有效的优惠券"""
        now = datetime.utcnow()
        result = await db.execute(
            select(Coupon).where(
                Coupon.status == 1,
                (Coupon.start_at.is_(None)) | (Coupon.start_at <= now),
                (Coupon.end_at.is_(None)) | (Coupon.end_at >= now)
            ).order_by(Coupon.created_at.desc())
        )
        return result.scalars().all()

    async def get_user_coupons_with_status(
        self,
        db: AsyncSession,
        user_id: int,
        status: Optional[int] = None
    ) -> List[UserCoupon]:
        """获取用户优惠券（含状态过滤）"""
        query = select(UserCoupon).where(UserCoupon.user_id == user_id)

        if status is not None:
            query = query.where(UserCoupon.status == status)

        # 如果未指定状态，过滤已过期的
        if status is None or status == 0:
            now = datetime.utcnow()
            query = query.where(
                and_(
                    UserCoupon.status == 0,
                    UserCoupon.expire_at > now
                )
            )

        query = query.order_by(UserCoupon.expire_at.asc(), UserCoupon.created_at.desc())
        result = await db.execute(query)
        return result.scalars().all()

    async def get_user_coupons_paginated(
        self,
        db: AsyncSession,
        user_id: int,
        status: Optional[int] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[UserCoupon], int]:
        """分页获取用户优惠券"""
        query = select(UserCoupon).where(UserCoupon.user_id == user_id)

        if status is not None:
            query = query.where(UserCoupon.status == status)

        # 获取总数
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar()

        # 分页
        query = query.order_by(UserCoupon.expire_at.asc(), UserCoupon.created_at.desc())
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        items = result.scalars().all()

        return list(items), total


class CRUDUserCoupon(CRUDBase[UserCoupon, UserCouponCreate, UserCouponUpdate]):
    """用户优惠券CRUD"""

    async def issue_coupon(
        self,
        db: AsyncSession,
        user_id: int,
        coupon_id: int
    ) -> Optional[UserCoupon]:
        """发放优惠券给用户"""
        coupon = await discount.get(db, coupon_id)
        if not coupon or coupon.status != 1:
            return None

        # 检查是否超过发放总数
        if coupon.total_quantity > 0 and coupon.used_quantity >= coupon.total_quantity:
            return None

        # 检查是否已领取
        result = await db.execute(
            select(UserCoupon).where(
                UserCoupon.user_id == user_id,
                UserCoupon.coupon_id == coupon_id
            )
        )
        if result.scalar_one_or_none():
            return None  # 已领取

        # 计算过期时间
        if coupon.valid_days:
            expire_at = datetime.utcnow() + timedelta(days=coupon.valid_days)
        else:
            expire_at = coupon.end_at

        # 创建用户优惠券
        user_coupon = UserCoupon(
            user_id=user_id,
            coupon_id=coupon_id,
            expire_at=expire_at
        )
        db.add(user_coupon)

        # 更新已使用数量
        coupon.used_quantity += 1
        db.add(coupon)

        await db.commit()
        await db.refresh(user_coupon)
        return user_coupon

    async def use_coupon(
        self,
        db: AsyncSession,
        user_coupon: UserCoupon,
        order_id: int
    ) -> UserCoupon:
        """使用优惠券"""
        user_coupon.status = 1  # 已使用
        user_coupon.used_at = datetime.utcnow()
        user_coupon.used_order_id = order_id
        db.add(user_coupon)
        await db.commit()
        await db.refresh(user_coupon)
        return user_coupon

    async def check_coupon_available(self, db: AsyncSession, user_coupon_id: int, order_amount: float) -> Tuple[bool, Optional[str]]:
        """检查优惠券是否可用"""
        user_coupon = await self.get(db, user_coupon_id)
        if not user_coupon:
            return False, "优惠券不存在"

        if user_coupon.status == 1:
            return False, "优惠券已使用"

        if user_coupon.status == 2:
            return False, "优惠券已过期"

        now = datetime.utcnow()
        if user_coupon.expire_at < now:
            # 标记为已过期
            user_coupon.status = 2
            db.add(user_coupon)
            await db.commit()
            return False, "优惠券已过期"

        # 检查最低消费金额
        coupon = await discount.get(db, user_coupon.coupon_id)
        if coupon and coupon.min_amount and order_amount < coupon.min_amount:
            return False, f"最低消费{coupon.min_amount}元"

        return True, None


# 导出实例
activity = CRUDActivity(Activity)
activity_record = CRUDBase[ActivityRecord, dict, dict](ActivityRecord)
discount = CRUDDiscount(Coupon)
user_coupon = CRUDUserCoupon(UserCoupon)
