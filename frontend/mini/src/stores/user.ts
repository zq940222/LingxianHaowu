import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants'
import { userApi } from '@/api'
import type { User, Address } from '@/types'

// 简单的状态管理 - 使用闭包实现
let userState = {
  user: storage.get<User>(STORAGE_KEYS.USER_INFO),
  token: storage.get<string>(STORAGE_KEYS.TOKEN),
  addresses: [] as Address[],
  defaultAddress: storage.get<Address>(STORAGE_KEYS.SELECTED_ADDRESS),
  isLoggedIn: !!storage.get(STORAGE_KEYS.TOKEN),
  loading: false,
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function setState(newState: Partial<typeof userState>) {
  userState = { ...userState, ...newState }
  notifyListeners()
}

// 用户操作
const userActions = {
  setUser: (user: User | null) => {
    setState({ user, isLoggedIn: !!user })
    if (user) {
      storage.set(STORAGE_KEYS.USER_INFO, user)
    } else {
      storage.remove(STORAGE_KEYS.USER_INFO)
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
      const { token, user } = await userApi.wxLogin(code)

      // 保存登录状态
      userActions.setToken(token)
      userActions.setUser(user)

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
      user: null,
      token: null,
      isLoggedIn: false,
      addresses: [],
      defaultAddress: null,
    })
    storage.remove(STORAGE_KEYS.TOKEN)
    storage.remove(STORAGE_KEYS.USER_INFO)
    storage.remove(STORAGE_KEYS.SELECTED_ADDRESS)
  },

  fetchUserInfo: async () => {
    if (!userState.isLoggedIn) return

    try {
      const user = await userApi.getUserInfo()
      userActions.setUser(user)
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  },

  fetchAddresses: async () => {
    if (!userState.isLoggedIn) return

    try {
      const addresses = await userApi.getAddressList()
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0] || null

      setState({ addresses, defaultAddress: defaultAddr })

      if (defaultAddr) {
        storage.set(STORAGE_KEYS.SELECTED_ADDRESS, defaultAddr)
      }
    } catch (error) {
      console.error('获取地址列表失败:', error)
    }
  },

  setDefaultAddress: (address: Address) => {
    setState({ defaultAddress: address })
    storage.set(STORAGE_KEYS.SELECTED_ADDRESS, address)
  },

  updatePoints: (points: number) => {
    const user = userState.user
    if (user) {
      const updatedUser = { ...user, points }
      userActions.setUser(updatedUser)
    }
  },
}

// Hook to use user store
export function useUserStore() {
  const [, forceUpdate] = useState({})

  // Subscribe to state changes
  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    ...userState,
    ...userActions,
  }
}

// 直接导出状态和操作供非组件使用
export const getUserState = () => userState
export { userActions }
