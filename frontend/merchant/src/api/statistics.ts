import { get } from './request'
import type { DailyStatistics, SalesStatistics } from '@/types'

/**
 * 获取今日统计
 */
export async function getTodayStatistics(): Promise<SalesStatistics> {
  return get('/merchant/statistics/today')
}

/**
 * 获取销售统计
 */
export async function getSalesStatistics(params: {
  start_date: string
  end_date: string
}): Promise<DailyStatistics[]> {
  return get('/merchant/statistics/sales', params)
}

/**
 * 获取热销商品
 */
export async function getHotProducts(params: {
  start_date?: string
  end_date?: string
  limit?: number
}): Promise<{
  id: number
  name: string
  cover_image: string
  sales: number
  amount: number
}[]> {
  return get('/merchant/statistics/hot-products', params)
}

/**
 * 获取订单趋势
 */
export async function getOrderTrend(params: {
  days?: number
}): Promise<{
  date: string
  order_count: number
  amount: number
}[]> {
  return get('/merchant/statistics/order-trend', params)
}

/**
 * 获取概览数据
 */
export async function getOverview(): Promise<{
  today_order_count: number
  today_amount: number
  pending_order_count: number
  low_stock_count: number
}> {
  return get('/merchant/statistics/overview')
}
