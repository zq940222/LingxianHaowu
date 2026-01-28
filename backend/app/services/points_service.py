"""积分服务层"""
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func

from app.models.config import PointRule
from app.models.user import User, PointsRecord, SignInRecord
from app.core.crud import CRUDBase
from app.schemas.points import PointRuleCreate, PointRuleUpdate


class CRUDPointRule(CRUDBase[PointRule, PointRuleCreate, PointRuleUpdate]):
    """积分规则CRUD"""

    async def get_rule_by_type(self, db: AsyncSession, rule_type: int) -> Optional[PointRule]:
        """根据规则类型获取积分规则"""
        return await self.get_by_field(db, field_name="rule_type", field_value=rule_type)

    async def get_all_rules(self, db: AsyncSession) -> List[PointRule]:
        """获取所有积分规则"""
        result = await db.execute(select(PointRule).order_by(PointRule.rule_type))
        return result.scalars().all()


class CRUDPointsRecord(CRUDBase):
    """积分记录CRUD"""

    async def get_user_records(
        self,
        db: AsyncSession,
        user_id: int,
        *,
        change_type: Optional[int] = None,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[PointsRecord], int]:
        """
        获取用户积分记录
        change_type: 1-获得 2-消耗
        """
        query = select(PointsRecord).where(PointsRecord.user_id == user_id)

        if change_type is not None:
            query = query.where(PointsRecord.change_type == change_type)

        # 获取总数
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar()

        # 分页并按时间倒序
        query = query.order_by(desc(PointsRecord.created_at))
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        items = result.scalars().all()

        return list(items), total

    async def get_user_summary(self, db: AsyncSession, user_id: int) -> dict:
        """获取用户积分汇总"""
        # 获得积分
        earned_result = await db.execute(
            select(func.sum(PointsRecord.points)).where(
                and_(
                    PointsRecord.user_id == user_id,
                    PointsRecord.change_type == 1
                )
            )
        )
        earned = earned_result.scalar() or 0

        # 消耗积分
        spent_result = await db.execute(
            select(func.sum(PointsRecord.points)).where(
                and_(
                    PointsRecord.user_id == user_id,
                    PointsRecord.change_type == 2
                )
            )
        )
        spent = spent_result.scalar() or 0

        # 签到次数
        sign_count_result = await db.execute(
            select(func.count()).where(SignInRecord.user_id == user_id)
        )
        sign_count = sign_count_result.scalar() or 0

        # 当前连续签到天数
        consecutive_days = await self._get_consecutive_days(db, user_id)

        return {
            "total_points": earned - spent,
            "earned_points": earned,
            "spent_points": spent,
            "sign_count": sign_count,
            "consecutive_days": consecutive_days
        }

    async def _get_consecutive_days(self, db: AsyncSession, user_id: int) -> int:
        """计算连续签到天数"""
        result = await db.execute(
            select(SignInRecord.sign_date)
            .where(SignInRecord.user_id == user_id)
            .order_by(desc(SignInRecord.sign_date))
        )
        dates = result.scalars().all()

        if not dates:
            return 0

        consecutive = 1
        today = datetime.now().strftime("%Y-%m-%d")

        # 检查最后签到日期
        if dates[0] != today:
            # 如果今天没签到，检查昨天
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            if dates[0] != yesterday:
                return 0

        # 计算连续天数
        for i in range(1, len(dates)):
            current_date = datetime.strptime(dates[i-1], "%Y-%m-%d")
            prev_date = datetime.strptime(dates[i], "%Y-%m-%d")
            if (current_date - prev_date).days == 1:
                consecutive += 1
            else:
                break

        return consecutive

    async def add_points(
        self,
        db: AsyncSession,
        user_id: int,
        points: int,
        change_type: int,
        source_type: int,
        source_id: Optional[int] = None,
        description: Optional[str] = None
    ) -> PointsRecord:
        """添加积分记录并更新用户积分"""
        record = PointsRecord(
            user_id=user_id,
            change_type=change_type,
            points=points,
            source_type=source_type,
            source_id=source_id,
            description=description
        )
        db.add(record)

        # 更新用户总积分
        if change_type == 1:  # 获得积分
            await db.execute(
                select(User).where(User.id == user_id)
            )
            user_result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                user.total_points += points
        else:  # 消耗积分
            user_result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            if user:
                user.total_points -= points

        await db.commit()
        await db.refresh(record)
        return record


class CRUDSignInRecord(CRUDBase):
    """签到记录CRUD"""

    async def check_today_signed(self, db: AsyncSession, user_id: int) -> bool:
        """检查今天是否已签到"""
        today = datetime.now().strftime("%Y-%m-%d")
        result = await db.execute(
            select(SignInRecord).where(
                and_(
                    SignInRecord.user_id == user_id,
                    SignInRecord.sign_date == today
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def sign_in(
        self,
        db: AsyncSession,
        user_id: int,
        points: int
    ) -> SignInRecord:
        """签到并记录"""
        today = datetime.now().strftime("%Y-%m-%d")
        record = SignInRecord(
            user_id=user_id,
            sign_date=today,
            points=points
        )
        db.add(record)

        # 更新用户最后签到时间
        user_result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.last_sign_in_at = datetime.now()
            user.total_points += points

        await db.commit()
        await db.refresh(record)
        return record


# 导出实例
point_rule = CRUDPointRule(PointRule)
points_record = CRUDPointsRecord(PointsRecord)
sign_in_record = CRUDSignInRecord(SignInRecord)
