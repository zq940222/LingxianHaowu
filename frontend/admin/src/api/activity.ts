import { get, post, put, del } from '@/utils/request'
import type { Activity, Coupon, PaginatedResponse } from '@/types'

// 活动
interface ActivityListParams {
  page?: number
  page_size?: number
  type?: string
  is_active?: boolean
}

export async function getActivityList(params: ActivityListParams = {}): Promise<PaginatedResponse<Activity>> {
  return get('/admin/activities', params)
}

export async function getActivityDetail(id: number): Promise<Activity> {
  return get(`/admin/activities/${id}`)
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  return post('/admin/activities', data)
}

export async function updateActivity(id: number, data: Partial<Activity>): Promise<Activity> {
  return put(`/admin/activities/${id}`, data)
}

export async function deleteActivity(id: number): Promise<void> {
  return del(`/admin/activities/${id}`)
}

// 优惠券
interface CouponListParams {
  page?: number
  page_size?: number
  is_active?: boolean
}

export async function getCouponList(params: CouponListParams = {}): Promise<PaginatedResponse<Coupon>> {
  return get('/admin/coupons', params)
}

export async function getCouponDetail(id: number): Promise<Coupon> {
  return get(`/admin/coupons/${id}`)
}

export async function createCoupon(data: Partial<Coupon>): Promise<Coupon> {
  return post('/admin/coupons', data)
}

export async function updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon> {
  return put(`/admin/coupons/${id}`, data)
}

export async function deleteCoupon(id: number): Promise<void> {
  return del(`/admin/coupons/${id}`)
}
