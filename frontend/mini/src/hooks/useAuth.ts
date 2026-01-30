import React, { useCallback } from 'react'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores'
import { PAGES } from '@/constants'
import { getCurrentPageUrl } from '@/utils/route'

/**
 * 登录认证Hook
 */
export function useAuth() {
  const { isLoggedIn, user, login, logout, loading } = useUserStore()

  /**
   * 检查登录状态，未登录则跳转登录
   */
  const checkLogin = useCallback(
    (callback?: () => void, redirectTo?: string) => {
      if (isLoggedIn) {
        callback?.()
        return true
      }

      const currentUrl = redirectTo || getCurrentPageUrl()
      const loginUrl = `${PAGES.LOGIN}${currentUrl ? `?redirectTo=${encodeURIComponent(currentUrl)}` : ''}`

      Taro.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: loginUrl })
          }
        },
      })
      return false
    },
    [isLoggedIn]
  )

  /**
   * 需要登录的操作装饰器
   */
  const withAuth = useCallback(
    <T extends (...args: any[]) => any>(fn: T, redirectTo?: string) => {
      return (...args: Parameters<T>) => {
        if (checkLogin(undefined, redirectTo)) {
          return fn(...args)
        }
      }
    },
    [checkLogin]
  )

  /**
   * 执行登录
   */
  const doLogin = useCallback(async () => {
    const success = await login()
    if (success) {
      Taro.showToast({ title: '登录成功', icon: 'success' })
    }
    return success
  }, [login])

  /**
   * 执行退出登录
   */
  const doLogout = useCallback(() => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      },
    })
  }, [logout])

  return {
    isLoggedIn,
    user,
    loading,
    checkLogin,
    withAuth,
    login: doLogin,
    logout: doLogout,
  }
}
