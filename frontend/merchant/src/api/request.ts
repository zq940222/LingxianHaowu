import Taro from '@tarojs/taro'
import { API_BASE_URL, STORAGE_KEYS, PAGES } from '@/constants'
import { storage } from '@/utils/storage'
import type { ApiResponse } from '@/types'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
}

/**
 * 封装请求方法
 */
export async function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = false,
    showError = true,
  } = options

  // 获取token
  const token = storage.get<string>(STORAGE_KEYS.TOKEN)
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  // 设置Content-Type
  if (!header['Content-Type']) {
    header['Content-Type'] = 'application/json'
  }

  if (showLoading) {
    Taro.showLoading({ title: '加载中...', mask: true })
  }

  try {
    const response = await Taro.request<ApiResponse<T>>({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header,
      timeout: 30000,
    })

    if (showLoading) {
      Taro.hideLoading()
    }

    const { statusCode, data: responseData } = response

    // HTTP错误
    if (statusCode < 200 || statusCode >= 300) {
      // 401未授权，跳转登录
      if (statusCode === 401) {
        storage.remove(STORAGE_KEYS.TOKEN)
        storage.remove(STORAGE_KEYS.MERCHANT_INFO)
        Taro.reLaunch({ url: PAGES.INDEX })
        throw new Error('登录已过期，请重新登录')
      }

      const errorMsg = responseData?.message || `请求失败(${statusCode})`
      if (showError) {
        Taro.showToast({ title: errorMsg, icon: 'none' })
      }
      throw new Error(errorMsg)
    }

    // 业务错误
    if (responseData.code !== 0 && responseData.code !== 200) {
      const errorMsg = responseData.message || '操作失败'
      if (showError) {
        Taro.showToast({ title: errorMsg, icon: 'none' })
      }
      throw new Error(errorMsg)
    }

    return responseData.data
  } catch (error: any) {
    if (showLoading) {
      Taro.hideLoading()
    }

    // 网络错误
    if (error.errMsg?.includes('request:fail')) {
      const errorMsg = '网络连接失败，请检查网络'
      if (showError) {
        Taro.showToast({ title: errorMsg, icon: 'none' })
      }
      throw new Error(errorMsg)
    }

    throw error
  }
}

// 便捷方法
export const get = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'GET', data, ...options })

export const post = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'POST', data, ...options })

export const put = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'PUT', data, ...options })

export const del = <T = any>(url: string, data?: any, options?: Partial<RequestOptions>) =>
  request<T>({ url, method: 'DELETE', data, ...options })
