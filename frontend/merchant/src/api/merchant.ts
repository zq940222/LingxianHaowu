import { get, post, put } from './request'
import type { Merchant } from '@/types'

/**
 * 商家登录（微信授权）
 */
export async function wxLogin(code: string): Promise<{ token: string; merchant: Merchant }> {
  return post('/merchant/login/wx', { code })
}

/**
 * 获取商家信息
 */
export async function getMerchantInfo(): Promise<Merchant> {
  return get('/merchant/info')
}

/**
 * 更新商家信息
 */
export async function updateMerchantInfo(data: Partial<Merchant>): Promise<Merchant> {
  return put('/merchant/info', data)
}

/**
 * 修改密码
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return post('/merchant/password', { old_password: oldPassword, new_password: newPassword })
}

/**
 * 获取商家设置
 */
export async function getSettings(): Promise<{
  auto_confirm: boolean
  notify_new_order: boolean
  notify_refund: boolean
}> {
  return get('/merchant/settings')
}

/**
 * 更新商家设置
 */
export async function updateSettings(data: {
  auto_confirm?: boolean
  notify_new_order?: boolean
  notify_refund?: boolean
}): Promise<void> {
  return put('/merchant/settings', data)
}
