import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '@/types'

const instance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 业务错误
    if (data.code !== 0 && data.code !== 200) {
      message.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message))
    }

    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      if (status === 401) {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_info')
        window.location.href = '/login'
        return Promise.reject(new Error('登录已过期'))
      }

      message.error(data?.message || `请求失败(${status})`)
    } else if (error.message?.includes('timeout')) {
      message.error('请求超时')
    } else {
      message.error('网络错误')
    }

    return Promise.reject(error)
  }
)

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await instance.request<ApiResponse<T>>(config)
  return response.data.data
}

export const get = <T>(url: string, params?: object) =>
  request<T>({ method: 'GET', url, params })

export const post = <T>(url: string, data?: object) =>
  request<T>({ method: 'POST', url, data })

export const put = <T>(url: string, data?: object) =>
  request<T>({ method: 'PUT', url, data })

export const del = <T>(url: string, data?: object) =>
  request<T>({ method: 'DELETE', url, data })

export default instance
