"""支付服务层"""
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.payment import Payment
from app.models.order import Order
from app.core.crud import CRUDBase
from app.schemas.payment import PaymentCreate, PaymentUpdate


class CRUDPayment(CRUDBase[Payment, PaymentCreate, PaymentUpdate]):
    async def get_by_transaction_id(
        self,
        db: AsyncSession,
        transaction_id: str
    ) -> Optional[Payment]:
        """根据微信交易号获取支付记录"""
        return await self.get_by_field(db, field_name="transaction_id", field_value=transaction_id)

    async def create_payment(
        self,
        db: AsyncSession,
        order_id: int,
        prepay_id: str,
        amount: float
    ) -> Payment:
        """创建支付记录"""
        payment = Payment(
            order_id=order_id,
            prepay_id=prepay_id,
            amount=amount,
            status="pending"
        )
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment

    async def handle_payment_success(
        self,
        db: AsyncSession,
        payment: Payment,
        transaction_id: str
    ) -> Payment:
        """处理支付成功"""
        payment.transaction_id = transaction_id
        payment.status = "paid"
        payment.paid_at = datetime.utcnow()
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment

    async def refund(
        self,
        db: AsyncSession,
        payment: Payment,
        refund_amount: float,
        refund_reason: str
    ) -> Payment:
        """处理退款"""
        payment.status = "refunded"
        payment.refund_amount = refund_amount
        payment.refund_reason = refund_reason
        payment.refunded_at = datetime.utcnow()
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment


# 导出实例
payment = CRUDPayment(Payment)
