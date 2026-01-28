import React, { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { appActions, getAppState } from '@/stores/app'
import { userActions, getUserState } from '@/stores/user'
import { cartActions } from '@/stores/cart'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    // 获取系统信息
    const systemInfo = Taro.getSystemInfoSync()
    appActions.setSystemInfo({
      statusBarHeight: systemInfo.statusBarHeight || 0,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      windowHeight: systemInfo.windowHeight,
      safeArea: systemInfo.safeArea || { bottom: 0 },
    })

    // 获取网络状态
    Taro.getNetworkType({
      success: (res) => {
        appActions.setNetworkType(res.networkType)
      },
    })

    // 监听网络状态变化
    Taro.onNetworkStatusChange((res) => {
      appActions.setNetworkType(res.networkType)
      if (!res.isConnected) {
        Taro.showToast({
          title: '网络已断开',
          icon: 'none',
        })
      }
    })

    // 如果已登录，刷新用户信息和购物车
    const userState = getUserState()
    if (userState.isLoggedIn) {
      userActions.fetchUserInfo()
      cartActions.fetchCart()
    }

    console.log('灵鲜好物小程序启动')
  })

  // children 是将要会渲染的页面
  return children
}

export default App
