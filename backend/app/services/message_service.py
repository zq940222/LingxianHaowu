"""消息服务层"""
import json
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc

from app.models.message import TemplateMessage, MessageLog, InternalMessage, SmsLog
from app.models.user import User
from app.core.crud import CRUDBase
from app.schemas.message import (
    TemplateMessageCreate, TemplateMessageUpdate,
    InternalMessageCreate
)


class CRUDTemplateMessage(CRUDBase[TemplateMessage, TemplateMessageCreate, TemplateMessageUpdate]):
    """模板消息CRUD"""

    async def get_by_type(self, db: AsyncSession, message_type: int) -> Optional[TemplateMessage]:
        """根据类型获取模板消息"""
        result = await db.execute(
            select(TemplateMessage).where(
                TemplateMessage.type == message_type,
                TemplateMessage.status == 1
            )
        )
        return result.scalar_one_or_none()

    async def get_all_active(self, db: AsyncSession) -> List[TemplateMessage]:
        """获取所有启用的模板消息"""
        result = await db.execute(
            select(TemplateMessage).where(
                TemplateMessage.status == 1
            ).order_by(TemplateMessage.type)
        )
        return result.scalars().all()


class CRUDInternalMessage(CRUDBase):
    """站内消息CRUD"""

    async def get_user_messages(
        self,
        db: AsyncSession,
        user_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[List[InternalMessage], int]:
        """获取用户站内消息（分页）"""
        query = select(InternalMessage).where(InternalMessage.user_id == user_id)

        # 获取总数
        count_query = select(InternalMessage.id).where(InternalMessage.user_id == user_id)
        total = (await db.execute(select(count_query.subquery().count()))).scalar()

        # 分页并按时间倒序
        query = query.order_by(desc(InternalMessage.created_at))
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        items = result.scalars().all()

        return list(items), total

    async def get_unread_count(self, db: AsyncSession, user_id: int) -> int:
        """获取未读消息数量"""
        result = await db.execute(
            select(InternalMessage.id).where(
                InternalMessage.user_id == user_id,
                InternalMessage.is_read == False
            )
        )
        return len(result.all())

    async def mark_as_read(
        self,
        db: AsyncSession,
        message_id: int,
        user_id: int
    ) -> Optional[InternalMessage]:
        """标记消息为已读"""
        result = await db.execute(
            select(InternalMessage).where(
                InternalMessage.id == message_id,
                InternalMessage.user_id == user_id
            )
        )
        message = result.scalar_one_or_none()

        if message and not message.is_read:
            message.is_read = True
            message.read_time = datetime.utcnow()
            db.add(message)
            await db.commit()
            await db.refresh(message)

        return message

    async def mark_all_read(self, db: AsyncSession, user_id: int) -> int:
        """标记所有消息为已读"""
        now = datetime.utcnow()
        result = await db.execute(
            update(InternalMessage).where(
                InternalMessage.user_id == user_id,
                InternalMessage.is_read == False
            ).values(
                is_read=True,
                read_time=now
            )
        )
        await db.commit()
        return result.rowcount


class MessageService:
    """消息服务"""

    async def send_template_message(
        self,
        db: AsyncSession,
        user_id: int,
        scene_type: int,
        scene_id: int,
        data: Optional[dict] = None
    ) -> bool:
        """
        发送模板消息

        Args:
            db: 数据库会话
            user_id: 用户ID
            scene_type: 场景类型
            scene_id: 场景ID
            data: 模板数据

        Returns:
            bool: 是否发送成功
        """
        # 获取用户openid
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            return False

        # 获取模板消息
        template = await template_message.get_by_type(db, scene_type)
        if not template:
            return False

        # 创建发送记录
        log = MessageLog(
            user_id=user_id,
            message_type=1,
            template_id=template.template_id,
            content=template.content,
            data=json.dumps(data) if data else None,
            scene_type=scene_type
        )
        db.add(log)

        # TODO: 实际调用微信模板消息API
        # 这里是模拟实现
        send_success = True
        error_msg = None

        # 更新发送状态
        log.send_status = 1 if send_success else 2
        log.error_msg = error_msg
        log.send_time = datetime.utcnow()

        await db.commit()
        await db.refresh(log)

        return send_success

    async def send_internal_message(
        self,
        db: AsyncSession,
        user_id: int,
        title: str,
        content: str,
        message_type: int = 1,
        scene_type: Optional[int] = None,
        scene_id: Optional[int] = None
    ) -> InternalMessage:
        """
        发送站内消息

        Args:
            db: 数据库会话
            user_id: 用户ID
            title: 消息标题
            content: 消息内容
            message_type: 消息类型
            scene_type: 场景类型
            scene_id: 场景ID

        Returns:
            InternalMessage: 创建的消息
        """
        message = InternalMessage(
            user_id=user_id,
            title=title,
            content=content,
            message_type=message_type,
            scene_type=scene_type,
            scene_id=scene_id
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)

        return message

    async def send_sms(
        self,
        db: AsyncSession,
        phone: str,
        template_code: str,
        content: str,
        params: Optional[dict] = None
    ) -> bool:
        """
        发送短信

        Args:
            db: 数据库会话
            phone: 手机号
            template_code: 短信模板代码
            content: 短信内容
            params: 模板参数

        Returns:
            bool: 是否发送成功
        """
        # 创建发送记录
        log = SmsLog(
            phone=phone,
            template_code=template_code,
            content=content
        )
        db.add(log)

        # TODO: 实际调用短信服务API（如阿里云短信、腾讯云短信）
        # 这里是模拟实现
        send_success = True
        error_msg = None

        # 更新发送状态
        log.send_status = 1 if send_success else 2
        log.error_msg = error_msg
        log.send_time = datetime.utcnow()

        await db.commit()
        await db.refresh(log)

        return send_success

    async def send_order_message(
        self,
        db: AsyncSession,
        user_id: int,
        order_id: int,
        scene_type: int
    ):
        """
        发送订单相关消息

        Args:
            db: 数据库会话
            user_id: 用户ID
            order_id: 订单ID
            scene_type: 场景类型 (2-支付成功 3-订单发货 4-订单完成)
        """
        # 获取订单信息
        from app.models.order import Order
        order_result = await db.execute(select(Order).where(Order.id == order_id))
        order = order_result.scalar_one_or_none()
        if not order:
            return

        # 场景文案映射
        scene_texts = {
            2: {"title": "支付成功", "content": f"您的订单{order.order_no}支付成功，金额¥{order.final_amount}"},
            3: {"title": "订单发货", "content": f"您的订单{order.order_no}已发货，请注意查收"},
            4: {"title": "订单完成", "content": f"您的订单{order.order_no}已完成，感谢您的购买"}
        }

        scene_text = scene_texts.get(scene_type)
        if not scene_text:
            return

        # 发送站内消息
        await self.send_internal_message(
            db, user_id,
            scene_text["title"],
            scene_text["content"],
            message_type=2,
            scene_type=scene_type,
            scene_id=order_id
        )

        # 发送模板消息
        await self.send_template_message(
            db, user_id, scene_type, order_id,
            {"order_no": order.order_no, "amount": str(order.final_amount)}
        )


# 导出实例
template_message = CRUDTemplateMessage(TemplateMessage)
internal_message = CRUDInternalMessage(InternalMessage)
message_service = MessageService()
