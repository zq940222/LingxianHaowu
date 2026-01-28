"""
消息相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.core.security import get_current_user
from app.models.user import User
from app.services.message_service import (
    template_message, internal_message, message_service
)
from app.schemas.message import (
    TemplateMessageCreate, TemplateMessageUpdate,
    InternalMessageCreate, SendMessageRequest, SmsSendRequest
)

router = APIRouter()


@router.get("/internal")
async def get_internal_messages(
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取站内消息列表

    Args:
        skip: 跳过数量
        limit: 每页数量

    Returns:
        dict: 站内消息列表
    """
    messages, total = await internal_message.get_user_messages(
        db, current_user.id, skip, limit
    )

    return success_response(
        data={
            "items": messages,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    )


@router.get("/internal/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取未读消息数量

    Returns:
        dict: 未读消息数量
    """
    count = await internal_message.get_unread_count(db, current_user.id)

    return success_response(data={"unread_count": count})


@router.post("/internal/{message_id}/read")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    标记消息为已读

    Args:
        message_id: 消息ID

    Returns:
        dict: 操作结果
    """
    message = await internal_message.mark_as_read(db, message_id, current_user.id)
    if not message:
        return error_response(message="消息不存在")

    return success_response(message="标记成功")


@router.post("/internal/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    标记所有消息为已读

    Returns:
        dict: 操作结果
    """
    count = await internal_message.mark_all_read(db, current_user.id)

    return success_response(
        data={"marked_count": count},
        message=f"已标记{count}条消息为已读"
    )


@router.delete("/internal/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    删除站内消息

    Args:
        message_id: 消息ID

    Returns:
        dict: 操作结果
    """
    # 检查消息是否属于当前用户
    from app.models.message import InternalMessage
    result = await db.execute(
        select(InternalMessage).where(
            InternalMessage.id == message_id,
            InternalMessage.user_id == current_user.id
        )
    )
    message = result.scalar_one_or_none()
    if not message:
        return error_response(message="消息不存在或无权操作")

    await internal_message.delete(db, id=message_id)

    return success_response(message="删除成功")


@router.get("/templates")
async def get_template_messages(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取模板消息列表（管理员）

    Returns:
        dict: 模板消息列表
    """
    templates = await template_message.get_all_active(db)

    return success_response(data=templates)


@router.get("/templates/{template_id}")
async def get_template_detail(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取模板消息详情（管理员）

    Args:
        template_id: 模板ID

    Returns:
        dict: 模板消息详情
    """
    template = await template_message.get(db, template_id)
    if not template:
        return error_response(message="模板消息不存在")

    return success_response(data=template)


@router.post("/templates")
async def create_template(
    template_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建模板消息（管理员）

    Args:
        template_data: 模板数据

    Returns:
        dict: 创建的模板消息
    """
    from app.schemas.message import TemplateMessageCreate
    template_schema = TemplateMessageCreate(**template_data)
    template = await template_message.create(db, obj_in=template_schema)

    return success_response(data=template, message="模板消息创建成功")


@router.put("/templates/{template_id}")
async def update_template(
    template_id: int,
    template_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    更新模板消息（管理员）

    Args:
        template_id: 模板ID
        template_data: 更新数据

    Returns:
        dict: 更新后的模板消息
    """
    template = await template_message.get(db, template_id)
    if not template:
        return error_response(message="模板消息不存在")

    from app.schemas.message import TemplateMessageUpdate
    update_schema = TemplateMessageUpdate(**template_data)
    updated_template = await template_message.update(
        db, db_obj=template, obj_in=update_schema
    )

    return success_response(data=updated_template, message="模板消息更新成功")


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    删除模板消息（管理员）

    Args:
        template_id: 模板ID

    Returns:
        dict: 删除结果
    """
    template = await template_message.delete(db, id=template_id)
    if not template:
        return error_response(message="模板消息不存在")

    return success_response(message="模板消息删除成功")


@router.post("/send")
async def send_message(
    request_data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    发送消息（管理员）

    Args:
        request_data: 发送请求数据

    Returns:
        dict: 发送结果
    """
    success = await message_service.send_template_message(
        db,
        request_data.user_id,
        request_data.scene_type,
        request_data.scene_id,
        request_data.data
    )

    if not success:
        return error_response(message="发送失败")

    return success_response(message="发送成功")


@router.post("/sms/send")
async def send_sms(
    request_data: SmsSendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    发送短信（管理员）

    Args:
        request_data: 短信请求数据

    Returns:
        dict: 发送结果
    """
    # 根据模板代码和参数生成短信内容
    content = generate_sms_content(request_data.template_code, request_data.params)

    success = await message_service.send_sms(
        db,
        request_data.phone,
        request_data.template_code,
        content,
        request_data.params
    )

    if not success:
        return error_response(message="短信发送失败")

    return success_response(message="短信发送成功")


def generate_sms_content(template_code: str, params: Optional[dict]) -> str:
    """
    根据模板代码生成短信内容

    Args:
        template_code: 模板代码
        params: 参数

    Returns:
        str: 短信内容
    """
    templates = {
        "order_created": "您的订单{order_no}已创建，请及时支付",
        "payment_success": "您的订单{order_no}支付成功，金额¥{amount}",
        "order_shipped": "您的订单{order_no}已发货",
        "order_completed": "您的订单{order_no}已完成，感谢您的购买"
    }

    template = templates.get(template_code, "")
    if params:
        content = template.format(**params)
    else:
        content = template

    return content


@router.post("/internal/create")
async def create_internal_message(
    message_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    创建站内消息（管理员）

    Args:
        message_data: 消息数据

    Returns:
        dict: 创建的消息
    """
    from app.schemas.message import InternalMessageCreate
    message_schema = InternalMessageCreate(**message_data)
    message = await message_service.send_internal_message(
        db,
        message_schema.user_id,
        message_schema.title,
        message_schema.content,
        message_schema.message_type,
        message_schema.scene_type,
        message_schema.scene_id
    )

    return success_response(data=message, message="站内消息创建成功")


@router.get("/logs")
async def get_message_logs(
    user_id: Optional[int] = Query(None, description="用户ID"),
    message_type: Optional[int] = Query(None, description="消息类型"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取消息发送记录（管理员）

    Args:
        user_id: 用户ID
        message_type: 消息类型
        skip: 跳过数量
        limit: 每页数量

    Returns:
        dict: 消息日志列表
    """
    from app.models.message import MessageLog
    from sqlalchemy import select, desc

    query = select(MessageLog)

    if user_id:
        query = query.where(MessageLog.user_id == user_id)
    if message_type:
        query = query.where(MessageLog.message_type == message_type)

    # 获取总数
    total_query = select(MessageLog.id).where(
        MessageLog.user_id == user_id if user_id else True,
        MessageLog.message_type == message_type if message_type else True
    )
    total = (await db.execute(total_query)).scalar()

    # 分页并按时间倒序
    query = query.order_by(desc(MessageLog.created_at))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return success_response(
        data={
            "items": items,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    )


@router.get("/sms/logs")
async def get_sms_logs(
    phone: Optional[str] = Query(None, description="手机号"),
    skip: int = Query(0, ge=0, description="跳过数量"),
    limit: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取短信发送记录（管理员）

    Args:
        phone: 手机号
        skip: 跳过数量
        limit: 每页数量

    Returns:
        dict: 短信日志列表
    """
    from app.models.message import SmsLog
    from sqlalchemy import select, desc

    query = select(SmsLog)

    if phone:
        query = query.where(SmsLog.phone == phone)

    # 获取总数
    total_query = select(SmsLog.id).where(
        SmsLog.phone == phone if phone else True
    )
    total = (await db.execute(total_query)).scalar()

    # 分页并按时间倒序
    query = query.order_by(desc(SmsLog.created_at))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return success_response(
        data={
            "items": items,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    )
