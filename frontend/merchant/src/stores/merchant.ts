import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants'
import { merchantApi } from '@/api'
import type { Merchant } from '@/types'

// 商家状态
let merchantState = {
  merchant: storage.get<Merchant>(STORAGE_KEYS.MERCHANT_INFO),
  token: storage.get<string>(STORAGE_KEYS.TOKEN),
  isLoggedIn: !!storage.get(STORAGE_KEYS.TOKEN),
  loading: false,
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function setState(newState: Partial<typeof merchantState>) {
  merchantState = { ...merchantState, ...newState }
  notifyListeners()
}

// 商家操作
const merchantActions = {
  setMerchant: (merchant: Merchant | null) => {
    setState({ merchant, isLoggedIn: !!merchant })
    if (merchant) {
      storage.set(STORAGE_KEYS.MERCHANT_INFO, merchant)
    } else {
      storage.remove(STORAGE_KEYS.MERCHANT_INFO)
    }
  },

  setToken: (token: string | null) => {
    setState({ token, isLoggedIn: !!token })
    if (token) {
      storage.set(STORAGE_KEYS.TOKEN, token)
    } else {
      storage.remove(STORAGE_KEYS.TOKEN)
    }
  },

  login: async () => {
    try {
      setState({ loading: true })

      // 获取微信登录code
      const { code } = await Taro.login()

      // 调用后端登录接口
      const { token, merchant } = await merchantApi.wxLogin(code)

      // 保存登录状态
      merchantActions.setToken(token)
      merchantActions.setMerchant(merchant)

      return true
    } catch (error) {
      console.error('登录失败:', error)
      return false
    } finally {
      setState({ loading: false })
    }
  },

  logout: () => {
    setState({
      merchant: null,
      token: null,
      isLoggedIn: false,
    })
    storage.remove(STORAGE_KEYS.TOKEN)
    storage.remove(STORAGE_KEYS.MERCHANT_INFO)
  },

  fetchMerchantInfo: async () => {
    if (!merchantState.isLoggedIn) return

    try {
      const merchant = await merchantApi.getMerchantInfo()
      merchantActions.setMerchant(merchant)
    } catch (error) {
      console.error('获取商家信息失败:', error)
    }
  },
}

// Hook to use merchant store
export function useMerchantStore() {
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    ...merchantState,
    ...merchantActions,
  }
}

// 直接导出状态和操作供非组件使用
export const getMerchantState = () => merchantState
export { merchantActions }
