import { get, post, put } from './request'
import type { Order, OrderStatus, OrderStatistics, PaginatedResponse } from '@/types'

interface OrderListParams {
  page?: number
  page_size?: number
  status?: OrderStatus | 'all'
  keyword?: string
  start_date?: string
  end_date?: string
}

/**
 * 获取订单列表
 */
export async function getOrderList(params: OrderListParams = {}): Promise<PaginatedResponse<Order>> {
  return get('/merchant/orders', params)
}

/**
 * 获取订单详情
 */
export async function getOrderDetail(id: number): Promise<Order> {
  return get(`/merchant/orders/${id}`)
}

/**
 * 获取订单统计（各状态数量）
 */
export async function getOrderStatistics(): Promise<OrderStatistics> {
  return get('/merchant/orders/statistics')
}

/**
 * 确认订单
 */
export async function confirmOrder(id: number): Promise<Order> {
  return post(`/merchant/orders/${id}/confirm`)
}

/**
 * 开始配送
 */
export async function startDelivery(id: number): Promise<Order> {
  return post(`/merchant/orders/${id}/delivery`)
}

/**
 * 完成配送
 */
export async function completeDelivery(id: number): Promise<Order> {
  return post(`/merchant/orders/${id}/complete`)
}

/**
 * 确认自提
 */
export async function confirmPickup(id: number): Promise<Order> {
  return post(`/merchant/orders/${id}/pickup`)
}

/**
 * 取消订单
 */
export async function cancelOrder(id: number, reason: string): Promise<Order> {
  return post(`/merchant/orders/${id}/cancel`, { reason })
}

/**
 * 处理退款申请
 */
export async function handleRefund(
  id: number,
  action: 'approve' | 'reject',
  reason?: string
): Promise<Order> {
  return post(`/merchant/orders/${id}/refund`, { action, reason })
}

/**
 * 更新订单备注
 */
export async function updateOrderRemark(id: number, remark: string): Promise<Order> {
  return put(`/merchant/orders/${id}/remark`, { remark })
}

/**
 * 打印订单
 */
export async function printOrder(id: number): Promise<{ success: boolean }> {
  return post(`/merchant/orders/${id}/print`)
}
