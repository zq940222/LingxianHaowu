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
 * 封装的请求方法
 */
async function request<T = any>(options: RequestOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    showLoading = false,
    showError = true,
  } = options

  // 显示加载提示
  if (showLoading) {
    Taro.showLoading({ title: '加载中...', mask: true })
  }

  // 获取token
  const token = storage.get<string>(STORAGE_KEYS.TOKEN)
  if (token) {
    header['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await Taro.request<ApiResponse<T>>({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header,
      },
    })

    // 隐藏加载提示
    if (showLoading) {
      Taro.hideLoading()
    }

    const { statusCode, data: responseData } = response

    // HTTP错误
    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(`HTTP Error: ${statusCode}`)
    }

    // 业务错误码处理
    if (responseData.code !== 0 && responseData.code !== 200) {
      // 登录态失效
      if (responseData.code === 401 || responseData.code === 1001) {
        storage.remove(STORAGE_KEYS.TOKEN)
        storage.remove(STORAGE_KEYS.USER_INFO)

        Taro.showModal({
          title: '提示',
          content: '登录已过期，请重新登录',
          showCancel: false,
          success: () => {
            Taro.navigateTo({ url: PAGES.MY })
          },
        })
        throw new Error('登录已过期')
      }

      // 其他业务错误
      if (showError) {
        Taro.showToast({
          title: responseData.message || '请求失败',
          icon: 'none',
          duration: 2000,
        })
      }
      throw new Error(responseData.message || '请求失败')
    }

    return responseData.data
  } catch (error: any) {
    if (showLoading) {
      Taro.hideLoading()
    }

    // 网络错误
    if (error.errMsg?.includes('request:fail')) {
      if (showError) {
        Taro.showToast({
          title: '网络连接失败，请检查网络',
          icon: 'none',
          duration: 2000,
        })
      }
    }

    throw error
  }
}

/**
 * GET请求
 */
export function get<T = any>(url: string, params?: Record<string, any>, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>): Promise<T> {
  // 处理query参数
  let fullUrl = url
  if (params) {
    const queryString = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  return request<T>({ url: fullUrl, method: 'GET', ...options })
}

/**
 * POST请求
 */
export function post<T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>): Promise<T> {
  return request<T>({ url, method: 'POST', data, ...options })
}

/**
 * PUT请求
 */
export function put<T = any>(url: string, data?: any, options?: Omit<RequestOptions, 'url' | 'method' | 'data'>): Promise<T> {
  return request<T>({ url, method: 'PUT', data, ...options })
}

/**
 * DELETE请求
 */
export function del<T = any>(url: string, options?: Omit<RequestOptions, 'url' | 'method'>): Promise<T> {
  return request<T>({ url, method: 'DELETE', ...options })
}

/**
 * 上传文件
 */
export async function upload(filePath: string, name = 'file'): Promise<string> {
  const token = storage.get<string>(STORAGE_KEYS.TOKEN)

  Taro.showLoading({ title: '上传中...', mask: true })

  try {
    const response = await Taro.uploadFile({
      url: `${API_BASE_URL}/upload`,
      filePath,
      name,
      header: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })

    Taro.hideLoading()

    const data: ApiResponse<{ url: string }> = JSON.parse(response.data)
    if (data.code !== 0 && data.code !== 200) {
      throw new Error(data.message || '上传失败')
    }

    return data.data.url
  } catch (error) {
    Taro.hideLoading()
    Taro.showToast({ title: '上传失败', icon: 'none' })
    throw error
  }
}
