import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { StatCard, OrderCard, Loading } from '@/components'
import { useMerchantStore, useOrderStore } from '@/stores'
import { statisticsApi, orderApi } from '@/api'
import { formatPriceYuan, priceToYuan } from '@/utils/format'
import { PAGES, ORDER_STATUS_MAP } from '@/constants'
import type { Order, OrderStatistics } from '@/types'
import './index.scss'

export default function Index() {
  const { isLoggedIn, merchant, login, loading: loginLoading } = useMerchantStore()
  const { statistics, fetchStatistics } = useOrderStore()

  const [overview, setOverview] = useState({
    today_order_count: 0,
    today_amount: 0,
    pending_order_count: 0,
    low_stock_count: 0,
  })
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  useDidShow(() => {
    if (isLoggedIn) {
      fetchData()
    }
  })

  usePullDownRefresh(async () => {
    await fetchData()
    Taro.stopPullDownRefresh()
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [overviewData, orderResult] = await Promise.all([
        statisticsApi.getOverview().catch(() => overview),
        orderApi.getOrderList({ status: 'pending_confirm', page_size: 5 }).catch(() => ({ items: [] })),
        fetchStatistics(),
      ])
      setOverview(overviewData)
      setPendingOrders(orderResult.items)
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    const success = await login()
    if (success) {
      Taro.showToast({ title: '登录成功', icon: 'success' })
      fetchData()
    } else {
      Taro.showToast({ title: '登录失败', icon: 'none' })
    }
  }

  const handleOrderAction = async (order: Order, action: string) => {
    try {
      if (action === 'confirm') {
        await orderApi.confirmOrder(order.id)
        Taro.showToast({ title: '订单已确认', icon: 'success' })
      }
      fetchData()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const navigateToOrderList = (status?: string) => {
    Taro.switchTab({ url: PAGES.ORDER_LIST })
  }

  const navigateToStatistics = () => {
    Taro.navigateTo({ url: PAGES.STATISTICS })
  }

  const navigateToProductList = () => {
    Taro.switchTab({ url: PAGES.PRODUCT_LIST })
  }

  // 未登录状态
  if (!isLoggedIn) {
    return (
      <View className='index index--login'>
        <View className='index__login-card'>
          <View className='index__login-icon'>
            <Text className='index__login-icon-text'>🏪</Text>
          </View>
          <Text className='index__login-title'>灵鲜好物商家端</Text>
          <Text className='index__login-desc'>请登录以管理您的店铺</Text>
          <View
            className='index__login-btn'
            onClick={handleLogin}
          >
            <Text className='index__login-btn-text'>
              {loginLoading ? '登录中...' : '微信授权登录'}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  if (loading && !overview.today_order_count) {
    return <Loading fullScreen text='加载中...' />
  }

  return (
    <View className='index'>
      <ScrollView scrollY className='index__scroll'>
        {/* 欢迎语 */}
        <View className='index__header'>
          <Text className='index__welcome'>
            {merchant?.store_name || '欢迎使用商家端'}
          </Text>
          <Text className='index__date'>
            {new Date().toLocaleDateString('zh-CN', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </View>

        {/* 今日数据 */}
        <View className='index__section'>
          <View className='index__section-header' onClick={navigateToStatistics}>
            <Text className='index__section-title'>今日数据</Text>
            <Text className='index__section-more'>查看详情 ›</Text>
          </View>
          <View className='index__stats'>
            <View className='index__stat-item'>
              <Text className='index__stat-value'>{overview.today_order_count}</Text>
              <Text className='index__stat-label'>今日订单</Text>
            </View>
            <View className='index__stat-divider' />
            <View className='index__stat-item'>
              <Text className='index__stat-value index__stat-value--amount'>
                {priceToYuan(overview.today_amount).toFixed(2)}
              </Text>
              <Text className='index__stat-label'>今日营收(元)</Text>
            </View>
          </View>
        </View>

        {/* 订单概览 */}
        <View className='index__section'>
          <View className='index__section-header' onClick={() => navigateToOrderList()}>
            <Text className='index__section-title'>订单概览</Text>
            <Text className='index__section-more'>全部订单 ›</Text>
          </View>
          <View className='index__order-stats'>
            <View
              className='index__order-stat'
              onClick={() => navigateToOrderList('pending_confirm')}
            >
              <Text className='index__order-stat-value'>
                {statistics?.pending_confirm || 0}
              </Text>
              <Text className='index__order-stat-label'>待确认</Text>
            </View>
            <View
              className='index__order-stat'
              onClick={() => navigateToOrderList('pending_delivery')}
            >
              <Text className='index__order-stat-value'>
                {statistics?.pending_delivery || 0}
              </Text>
              <Text className='index__order-stat-label'>待配送</Text>
            </View>
            <View
              className='index__order-stat'
              onClick={() => navigateToOrderList('delivering')}
            >
              <Text className='index__order-stat-value'>
                {statistics?.delivering || 0}
              </Text>
              <Text className='index__order-stat-label'>配送中</Text>
            </View>
            <View
              className='index__order-stat'
              onClick={() => navigateToOrderList('refunding')}
            >
              <Text className='index__order-stat-value'>
                {statistics?.refunding || 0}
              </Text>
              <Text className='index__order-stat-label'>退款中</Text>
            </View>
          </View>
        </View>

        {/* 快捷入口 */}
        <View className='index__section'>
          <Text className='index__section-title'>快捷操作</Text>
          <View className='index__shortcuts'>
            <View className='index__shortcut' onClick={() => navigateToOrderList()}>
              <View className='index__shortcut-icon index__shortcut-icon--order'>
                <Text className='index__shortcut-icon-text'>📋</Text>
              </View>
              <Text className='index__shortcut-text'>订单管理</Text>
            </View>
            <View className='index__shortcut' onClick={navigateToProductList}>
              <View className='index__shortcut-icon index__shortcut-icon--product'>
                <Text className='index__shortcut-icon-text'>📦</Text>
              </View>
              <Text className='index__shortcut-text'>商品管理</Text>
            </View>
            <View className='index__shortcut' onClick={navigateToStatistics}>
              <View className='index__shortcut-icon index__shortcut-icon--stat'>
                <Text className='index__shortcut-icon-text'>📊</Text>
              </View>
              <Text className='index__shortcut-text'>数据统计</Text>
            </View>
            <View
              className='index__shortcut'
              onClick={() => {
                if (overview.low_stock_count > 0) {
                  navigateToProductList()
                }
              }}
            >
              <View className='index__shortcut-icon index__shortcut-icon--stock'>
                <Text className='index__shortcut-icon-text'>⚠️</Text>
              </View>
              <Text className='index__shortcut-text'>
                库存预警({overview.low_stock_count})
              </Text>
            </View>
          </View>
        </View>

        {/* 待处理订单 */}
        {pendingOrders.length > 0 && (
          <View className='index__section'>
            <View className='index__section-header'>
              <Text className='index__section-title'>待确认订单</Text>
              <Text
                className='index__section-more'
                onClick={() => navigateToOrderList('pending_confirm')}
              >
                查看全部 ›
              </Text>
            </View>
            <View className='index__pending-orders'>
              {pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onConfirm={(o) => handleOrderAction(o, 'confirm')}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
