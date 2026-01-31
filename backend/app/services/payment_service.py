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

    async def request_refund(
        self,
        db: AsyncSession,
        payment: Payment,
        refund_amount: float,
        refund_reason: str
    ) -> Payment:
        """发起退款申请（进入 refunding）

        说明：真实业务一般是“申请退款 -> 退款中(refunding) -> 退款成功(refunded)”
        这里先把状态置为 refunding，等待管理员确认或第三方回调。
        """
        payment.status = "refunding"
        payment.refund_amount = refund_amount
        payment.refund_reason = refund_reason
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment

    async def confirm_refund(self, db: AsyncSession, payment: Payment) -> Payment:
        """确认退款成功（进入 refunded）"""
        payment.status = "refunded"
        payment.refunded_at = datetime.utcnow()
        db.add(payment)
        await db.commit()
        await db.refresh(payment)
        return payment


# 导出实例
payment = CRUDPayment(Payment)
