import React, { useState, useEffect } from 'react'

// 应用状态
let appState = {
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

  // 新订单提醒
  newOrderCount: 0,

  // 音效开关
  soundEnabled: true,
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
  setSystemInfo: (info: typeof appState.systemInfo) => {
    setState({ systemInfo: info })
  },

  setNetworkType: (type: string) => {
    setState({ networkType: type })
  },

  setNewOrderCount: (count: number) => {
    setState({ newOrderCount: count })
  },

  incrementNewOrderCount: () => {
    setState({ newOrderCount: appState.newOrderCount + 1 })
  },

  clearNewOrderCount: () => {
    setState({ newOrderCount: 0 })
  },

  setSoundEnabled: (enabled: boolean) => {
    setState({ soundEnabled: enabled })
  },
}

// Hook to use app store
export function useAppStore() {
  const [, forceUpdate] = useState({})

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
