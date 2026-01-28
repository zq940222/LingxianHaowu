import { get } from '@/utils/request'
import type { DashboardStats } from '@/types'

export async function getDashboardStats(): Promise<DashboardStats> {
  return get('/admin/dashboard/stats')
}

export async function getOrderTrend(days: number = 7): Promise<{
  date: string
  order_count: number
  amount: number
}[]> {
  return get('/admin/dashboard/order-trend', { days })
}

export async function getTopProducts(limit: number = 10): Promise<{
  id: number
  name: string
  sales: number
  amount: number
}[]> {
  return get('/admin/dashboard/top-products', { limit })
}

export async function getCategoryStats(): Promise<{
  category_id: number
  category_name: string
  sales: number
  amount: number
}[]> {
  return get('/admin/dashboard/category-stats')
}
