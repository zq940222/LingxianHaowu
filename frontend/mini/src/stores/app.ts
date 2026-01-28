import React, { useState, useEffect } from 'react'
import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants'
import type { DeliveryZone, Activity } from '@/types'

// 应用状态
let appState = {
  // 配送区域
  deliveryZone: storage.get<DeliveryZone>(STORAGE_KEYS.DELIVERY_ZONE),

  // 活动弹窗
  activityPopup: null as Activity | null,
  hasShownPopup: false,

  // 搜索历史
  searchHistory: storage.get<string[]>(STORAGE_KEYS.SEARCH_HISTORY) || [],

  // 系统信息
  systemInfo: null as {
    statusBarHeight: number
    screenWidth: number
    screenHeight: number
    windowHeight: number
    safeArea: { bottom: number }
  } | null,

  // 网络状态
  networkType: 'unknown',
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function setState(newState: Partial<typeof appState>) {
  appState = { ...appState, ...newState }
  notifyListeners()
}

// 应用操作
const appActions = {
  setDeliveryZone: (zone: DeliveryZone | null) => {
    setState({ deliveryZone: zone })
    if (zone) {
      storage.set(STORAGE_KEYS.DELIVERY_ZONE, zone)
    } else {
      storage.remove(STORAGE_KEYS.DELIVERY_ZONE)
    }
  },

  setActivityPopup: (activity: Activity | null) => {
    setState({ activityPopup: activity })
  },

  setHasShownPopup: (shown: boolean) => {
    setState({ hasShownPopup: shown })
  },

  addSearchHistory: (keyword: string) => {
    const trimmed = keyword.trim()
    if (!trimmed) return

    // 移除重复项，并将新关键词放到最前面
    const history = [
      trimmed,
      ...appState.searchHistory.filter((h) => h !== trimmed),
    ].slice(0, 10) // 最多保存10条

    setState({ searchHistory: history })
    storage.set(STORAGE_KEYS.SEARCH_HISTORY, history)
  },

  clearSearchHistory: () => {
    setState({ searchHistory: [] })
    storage.remove(STORAGE_KEYS.SEARCH_HISTORY)
  },

  setSystemInfo: (info: typeof appState.systemInfo) => {
    setState({ systemInfo: info })
  },

  setNetworkType: (type: string) => {
    setState({ networkType: type })
  },
}

// Hook to use app store
export function useAppStore() {
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
    ...appState,
    ...appActions,
  }
}

// 直接导出状态和操作供非组件使用
export const getAppState = () => appState
export { appActions }
