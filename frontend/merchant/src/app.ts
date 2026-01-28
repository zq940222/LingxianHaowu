import React, { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'
import { appActions } from '@/stores/app'
import { merchantActions, getMerchantState } from '@/stores/merchant'
import { orderActions } from '@/stores/order'

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

    // 如果已登录，刷新商家信息和订单统计
    const merchantState = getMerchantState()
    if (merchantState.isLoggedIn) {
      merchantActions.fetchMerchantInfo()
      orderActions.fetchStatistics()
    }

    console.log('灵鲜好物商家端启动')
  })

  return children
}

export default App
