import { get, post, put } from '@/utils/request'
import type { Order, OrderStatus, PaginatedResponse } from '@/types'

interface OrderListParams {
  page?: number
  page_size?: number
  status?: OrderStatus
  keyword?: string
  start_date?: string
  end_date?: string
}

export async function getOrderList(params: OrderListParams = {}): Promise<PaginatedResponse<Order>> {
  return get('/admin/orders', params)
}

export async function getOrderDetail(id: number): Promise<Order> {
  return get(`/admin/orders/${id}`)
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  return put(`/admin/orders/${id}/status`, { status })
}

export async function cancelOrder(id: number, reason: string): Promise<Order> {
  return post(`/admin/orders/${id}/cancel`, { reason })
}

export async function handleRefund(id: number, action: 'approve' | 'reject', reason?: string): Promise<Order> {
  return post(`/admin/orders/${id}/refund`, { action, reason })
}

export async function exportOrders(params: OrderListParams): Promise<{ url: string }> {
  return get('/admin/orders/export', params)
}
