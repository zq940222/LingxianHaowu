import Taro from '@tarojs/taro'

/**
 * 获取当前页面的完整路径（包含 querystring），用于登录回跳。
 * 例：/pages/order/confirm?orderId=1
 */
export function getCurrentPageUrl(): string {
  try {
    const pages = Taro.getCurrentPages()
    const current = pages?.[pages.length - 1] as any
    const route = current?.route as string | undefined
    const options = (current?.options || {}) as Record<string, any>

    if (!route) return ''

    const query = Object.keys(options)
      .filter((k) => options[k] !== undefined && options[k] !== null && options[k] !== '')
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(options[k]))}`)
      .join('&')

    return `/${route}${query ? `?${query}` : ''}`
  } catch {
    return ''
  }
}
