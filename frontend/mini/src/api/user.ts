import { get, post, put, del } from './request'
import type { User, Address, SignInRecord, PointsRecord, PaginatedData } from '@/types'

/**
 * 微信登录
 */
export function wxLogin(code: string) {
  // 后端统一标准：/api/v1/auth/login
  // 目前先用默认昵称/头像占位，后续再接入获取微信用户信息
  return post<{ token: string; user: User }>('/auth/login', {
    code,
    nickname: '微信用户',
    avatar: '',
  })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return get<User>('/user/info')
}

/**
 * 更新用户信息
 */
export function updateUserInfo(data: Partial<Pick<User, 'nickname' | 'avatar'>>) {
  return put<User>('/user/info', data)
}

/**
 * 绑定手机号
 */
export function bindPhone(data: { code: string; encryptedData: string; iv: string }) {
  return post<User>('/user/bindPhone', data)
}

/**
 * 获取地址列表
 */
export function getAddressList() {
  return get<Address[]>('/user/addresses')
}

/**
 * 获取地址详情
 */
export function getAddressDetail(id: number) {
  return get<Address>(`/user/addresses/${id}`)
}

/**
 * 新增地址
 */
export function addAddress(data: Omit<Address, 'id' | 'user_id'>) {
  return post<Address>('/user/addresses', data)
}

/**
 * 更新地址
 */
export function updateAddress(id: number, data: Partial<Omit<Address, 'id' | 'user_id'>>) {
  return put<Address>(`/user/addresses/${id}`, data)
}

/**
 * 删除地址
 */
export function deleteAddress(id: number) {
  return del(`/user/addresses/${id}`)
}

/**
 * 设置默认地址
 */
export function setDefaultAddress(id: number) {
  return put(`/user/addresses/${id}/default`)
}

/**
 * 每日签到
 */
export function signIn() {
  return post<{ points: number; consecutive_days: number }>('/user/sign-in')
}

/**
 * 获取签到状态
 */
export function getSignInStatus() {
  return get<{ signed_today: boolean; consecutive_days: number; calendar: SignInRecord[] }>('/user/sign-in/status')
}

/**
 * 获取积分记录
 */
export function getPointsRecords(params: { page?: number; page_size?: number }) {
  return get<PaginatedData<PointsRecord>>('/user/points/records', params)
}

/**
 * 获取用户积分
 */
export function getUserPoints() {
  return get<{ points: number }>('/user/points')
}
