/**
 * 格式化价格 (分转元)
 */
export function formatPrice(price: number, showSymbol = true): string {
  const yuan = (price / 100).toFixed(2)
  return showSymbol ? `¥${yuan}` : yuan
}

/**
 * 格式化价格 (已经是元)
 */
export function formatPriceYuan(price: number, showSymbol = true): string {
  const yuan = price.toFixed(2)
  return showSymbol ? `¥${yuan}` : yuan
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date, format = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return formatDate(d, 'YYYY-MM-DD')
  } else if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

/**
 * 格式化手机号 (中间4位隐藏)
 */
export function formatPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone
  return `${phone.slice(0, 3)}****${phone.slice(7)}`
}

/**
 * 格式化地址
 */
export function formatAddress(address: {
  province: string
  city: string
  district: string
  detail: string
}): string {
  return `${address.province}${address.city}${address.district}${address.detail}`
}

/**
 * 格式化数量 (超过10000显示万)
 */
export function formatCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`
  }
  return String(count)
}

/**
 * 格式化倒计时
 */
export function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (hours > 0) {
    parts.push(`${hours}时`)
  }
  parts.push(`${String(minutes).padStart(2, '0')}分`)
  parts.push(`${String(secs).padStart(2, '0')}秒`)

  return parts.join('')
}

/**
 * 格式化优惠券金额
 */
export function formatCouponValue(type: 'fixed' | 'percent', value: number): string {
  if (type === 'fixed') {
    return `¥${value}`
  }
  return `${value}折`
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
