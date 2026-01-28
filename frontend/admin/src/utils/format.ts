import dayjs from 'dayjs'

/**
 * 格式化价格（分转元）
 */
export function formatPrice(price: number): string {
  return `¥${(price / 100).toFixed(2)}`
}

/**
 * 价格分转元
 */
export function priceToYuan(price: number): number {
  return price / 100
}

/**
 * 价格元转分
 */
export function priceToFen(price: number): number {
  return Math.round(price * 100)
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化日期
 */
export function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD')
}

/**
 * 格式化手机号
 */
export function formatPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

/**
 * 格式化金额（大数字）
 */
export function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(2)}亿`
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(2)}万`
  }
  return amount.toFixed(2)
}
