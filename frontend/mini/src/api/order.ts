import { get, post, put } from './request'
import type { Order, PaginatedData, DeliveryTimeSlot, PickupPoint } from '@/types'

/**
 * 创建订单
 */
export function createOrder(data: {
  items: { product_id: number; quantity: number; spec?: string }[]
  address_id?: number
  pickup_point_id?: number
  delivery_type: 'delivery' | 'pickup'
  delivery_time?: string
  coupon_id?: number
  remark?: string
  use_points?: number
}) {
  // 后端标准：delivery_type 1=配送 2=自提；delivery_time_slot 字段名不同
  return post<{ order_id: number; order_no: string; final_amount?: number }>(
    '/orders',
    {
      delivery_type: data.delivery_type === 'delivery' ? 1 : 2,
      address_id: data.address_id,
      pickup_point_id: data.pickup_point_id,
      delivery_time_slot: data.delivery_time,
      items: data.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      coupon_id: data.coupon_id,
      points_used: data.use_points || 0,
      remark: data.remark,
    },
    { showLoading: true }
  )
}

/**
 * 获取订单列表
 */
export function getOrderList(params: {
  page?: number
  size?: number
  status?: string
}) {
  return get<PaginatedData<Order>>('/orders', params)
}

/**
 * 获取订单详情
 */
export function getOrderDetail(id: number) {
  return get<Order>(`/orders/${id}`)
}

/**
 * 取消订单
 */
export function cancelOrder(id: number, reason?: string) {
  return put(`/orders/${id}/cancel`, { reason })
}

/**
 * 确认收货
 */
export function confirmOrder(id: number) {
  return put(`/orders/${id}/confirm`)
}

/**
 * 申请退款
 */
export function applyRefund(id: number, data: { reason: string; description?: string }) {
  return post(`/orders/${id}/refund`, data)
}

/**
 * 获取订单预览 (计算价格)
 */
export function previewOrder(data: {
  items: { product_id: number; quantity: number; spec?: string }[]
  address_id?: number
  pickup_point_id?: number
  delivery_type: 'delivery' | 'pickup'
  coupon_id?: number
  use_points?: number
}) {
  return post<{
    total_amount: number
    freight_amount: number
    discount_amount: number
    points_discount: number
    pay_amount: number
    available_coupons: number
  }>('/orders/preview', {
    delivery_type: data.delivery_type === 'delivery' ? 1 : 2,
    address_id: data.address_id,
    pickup_point_id: data.pickup_point_id,
    items: data.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    coupon_id: data.coupon_id,
    points_used: data.use_points || 0,
  })
}

/**
 * 获取配送时间段
 */
export function getDeliveryTimeSlots(address_id?: number) {
  // 后端标准：POST /delivery/time-slots，body 需要 date
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const date = `${y}-${m}-${d}`

  return post<{
    date: string
    zone_id?: number
    time_slots: { id: number; label: string; available: boolean }[]
  }>('/delivery/time-slots', { date, zone_id: undefined }).then((res) => {
    const slots = (res.time_slots || []).map((t) => {
      const [start, end] = String(t.label || '').split('-')
      return {
        start: start || t.label,
        end: end || '',
        available: !!t.available,
      }
    })
    return [{ date: res.date || date, slots }]
  })
}

/**
 * 获取自提点列表
 */
export function getPickupPoints() {
  return get<PickupPoint[]>('/delivery/pickup-points')
}

/**
 * 获取订单状态统计
 */
export function getOrderStatusCount() {
  return get<{
    pending_payment: number
    pending_delivery: number
    delivering: number
    pending_pickup: number
  }>('/orders/status-count')
}

/**
 * 发起支付
 */
export function createPayment(orderId: number) {
  // 后端标准：POST /payments/wx-pay
  return post<{
    payment_id: number
    prepay_id: string
    payment_params: {
      timeStamp: string
      nonceStr: string
      package: string
      signType: string
      paySign: string
    }
  }>('/payments/wx-pay', { order_id: orderId }, { showLoading: true }).then((res) => {
    return {
      appId: '',
      ...res.payment_params,
    }
  })
}

/**
 * 查询支付状态
 */
export function getPaymentStatus(orderId: number) {
  // 暂无后端对应订单支付状态接口，后续统一为 /payments/{id}/status 或 /orders/{id}
  return get<{ paid: boolean; status: string }>(`/orders/${orderId}/payment-status`)
}
