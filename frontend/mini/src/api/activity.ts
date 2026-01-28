import { get, post } from './request'
import type { Activity, Coupon, UserCoupon, GroupBuy, PaginatedData, PointRule } from '@/types'

/**
 * 获取活动弹窗
 */
export function getActivityPopup() {
  return get<Activity | null>('/activities/popup')
}

/**
 * 获取活动列表
 */
export function getActivityList(params?: { page?: number; page_size?: number }) {
  return get<PaginatedData<Activity>>('/activities', params)
}

/**
 * 获取优惠券列表 (可领取)
 */
export function getCouponList(params?: { page?: number; page_size?: number }) {
  return get<PaginatedData<Coupon>>('/coupons', params)
}

/**
 * 领取优惠券
 */
export function receiveCoupon(couponId: number) {
  return post<UserCoupon>(`/coupons/${couponId}/receive`)
}

/**
 * 获取用户优惠券列表
 */
export function getUserCoupons(params?: {
  page?: number
  page_size?: number
  status?: 'unused' | 'used' | 'expired'
}) {
  return get<PaginatedData<UserCoupon>>('/user/coupons', params)
}

/**
 * 获取可用优惠券 (下单时)
 */
export function getAvailableCoupons(amount: number) {
  return get<UserCoupon[]>('/user/coupons/available', { amount })
}

/**
 * 获取拼团活动列表
 */
export function getGroupBuyList(params?: { page?: number; page_size?: number }) {
  return get<PaginatedData<GroupBuy>>('/group-buys', params)
}

/**
 * 获取拼团详情
 */
export function getGroupBuyDetail(id: number) {
  return get<GroupBuy>(`/group-buys/${id}`)
}

/**
 * 发起拼团
 */
export function createGroupBuy(productId: number) {
  return post<GroupBuy>(`/group-buys`, { product_id: productId })
}

/**
 * 参与拼团
 */
export function joinGroupBuy(id: number) {
  return post<GroupBuy>(`/group-buys/${id}/join`)
}

/**
 * 获取积分规则
 */
export function getPointRules() {
  return get<PointRule[]>('/points/rules')
}
