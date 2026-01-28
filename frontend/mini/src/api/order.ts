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
  return post<{ order_id: number; order_no: string }>('/orders', data, { showLoading: true })
}

/**
 * 获取订单列表
 */
export function getOrderList(params: {
  page?: number
  page_size?: number
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
  }>('/orders/preview', data)
}

/**
 * 获取配送时间段
 */
export function getDeliveryTimeSlots(address_id?: number) {
  return get<DeliveryTimeSlot[]>('/delivery/time-slots', { address_id })
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
  return post<{
    appId: string
    timeStamp: string
    nonceStr: string
    package: string
    signType: string
    paySign: string
  }>(`/orders/${orderId}/pay`, {}, { showLoading: true })
}

/**
 * 查询支付状态
 */
export function getPaymentStatus(orderId: number) {
  return get<{ paid: boolean; status: string }>(`/orders/${orderId}/payment-status`)
}
