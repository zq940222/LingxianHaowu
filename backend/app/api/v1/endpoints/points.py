"""
积分相关端点
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.core.security import get_current_user
from app.models.user import User
from app.services.points_service import point_rule, points_record, sign_in_record

router = APIRouter()


@router.post("/sign-in")
async def user_sign_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    每日签到

    Returns:
        dict: 包含获得的积分、连续签到天数等信息
    """
    # 检查今天是否已签到
    has_signed = await sign_in_record.check_today_signed(db, current_user.id)
    if has_signed:
        return error_response(message="今日已签到，请明天再来")

    # 获取签到积分规则
    rule = await point_rule.get_rule_by_type(db, rule_type=1)
    if not rule:
        return error_response(message="签到积分规则未配置")

    # 执行签到
    record = await sign_in_record.sign_in(db, current_user.id, rule.points)

    # 获取连续签到天数
    summary = await points_record.get_user_summary(db, current_user.id)

    return success_response(
        data={
            "points_gained": record.points,
            "consecutive_days": summary["consecutive_days"],
            "total_points": current_user.total_points,
            "sign_date": record.sign_date
        },
        message="签到成功"
    )


@router.get("/records")
async def get_points_records(
    change_type: Optional[int] = Query(None, description="类型 1-获得 2-消耗"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取积分记录

    Args:
        change_type: 类型筛选 (可选)
        page: 页码
        size: 每页数量

    Returns:
        dict: 积分记录列表
    """
    skip = (page - 1) * size
    records, total = await points_record.get_user_records(
        db,
        current_user.id,
        change_type=change_type,
        skip=skip,
        limit=size
    )

    return success_response(
        data={
            "items": records,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    )


@router.get("/rules")
async def get_points_rules(
    db: AsyncSession = Depends(get_db)
):
    """
    获取积分规则

    Returns:
        dict: 积分规则列表
    """
    rules = await point_rule.get_all_rules(db)

    # 格式化规则类型名称
    type_names = {
        1: "签到",
        2: "订单",
        3: "活动"
    }

    formatted_rules = []
    for rule in rules:
        rule_dict = {
            "id": rule.id,
            "rule_type": rule.rule_type,
            "type_name": type_names.get(rule.rule_type, "未知"),
            "points": rule.points,
            "description": rule.description,
            "created_at": rule.created_at,
            "updated_at": rule.updated_at
        }
        formatted_rules.append(rule_dict)

    return success_response(data=formatted_rules)


@router.post("/rules")
async def create_point_rule(
    rule_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    创建积分规则（管理员）

    Args:
        rule_data: 规则数据
            - rule_type: 规则类型 (1-签到 2-订单 3-活动)
            - points: 积分数
            - description: 描述

    Returns:
        dict: 创建的规则
    """
    # 检查规则类型是否已存在
    existing = await point_rule.get_rule_by_type(db, rule_data["rule_type"])
    if existing:
        return error_response(message=f"规则类型 {rule_data['rule_type']} 已存在")

    from app.schemas.points import PointRuleCreate
    rule_schema = PointRuleCreate(**rule_data)
    rule = await point_rule.create(db, obj_in=rule_schema)

    return success_response(data=rule, message="积分规则创建成功")


@router.put("/rules/{rule_id}")
async def update_point_rule(
    rule_id: int,
    rule_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """
    更新积分规则（管理员）

    Args:
        rule_id: 规则ID
        rule_data: 更新数据

    Returns:
        dict: 更新后的规则
    """
    rule = await point_rule.get(db, rule_id)
    if not rule:
        return error_response(message="积分规则不存在")

    from app.schemas.points import PointRuleUpdate
    update_schema = PointRuleUpdate(**rule_data)
    updated_rule = await point_rule.update(db, db_obj=rule, obj_in=update_schema)

    return success_response(data=updated_rule, message="积分规则更新成功")


@router.delete("/rules/{rule_id}")
async def delete_point_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    删除积分规则（管理员）

    Args:
        rule_id: 规则ID

    Returns:
        dict: 删除结果
    """
    rule = await point_rule.delete(db, id=rule_id)
    if not rule:
        return error_response(message="积分规则不存在")

    return success_response(message="积分规则删除成功")


@router.get("/summary")
async def get_points_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    获取积分汇总

    Returns:
        dict: 积分汇总信息
    """
    summary = await points_record.get_user_summary(db, current_user.id)

    return success_response(data=summary)
