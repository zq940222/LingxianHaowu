import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useAuth } from '@/hooks'
import { useUserStore } from '@/stores'
import { orderApi } from '@/api'
import React, { useState, useEffect } from 'react'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import './index.scss'

interface OrderStatusCount {
  pending_payment: number
  pending_delivery: number
  delivering: number
  pending_pickup: number
}

const ORDER_STATUS_ENTRIES = [
  { key: 'pending_payment', label: '待付款', icon: '💳', status: 'pending_payment' },
  { key: 'pending_delivery', label: '待配送', icon: '📦', status: 'pending_delivery,pending_pickup' },
  { key: 'delivering', label: '配送中', icon: '🚚', status: 'delivering' },
]

const MENU_ITEMS = [
  { icon: '📍', label: '收货地址', path: PAGES.ADDRESS_LIST },
  { icon: '🎫', label: '我的优惠券', path: PAGES.COUPON_LIST },
  { icon: '💰', label: '积分中心', path: PAGES.POINTS },
]

export default function MyPage() {
  const { isLoggedIn, user, login, logout, loading } = useAuth()
  const { fetchUserInfo } = useUserStore()
  const [orderCount, setOrderCount] = useState<OrderStatusCount>({
    pending_payment: 0,
    pending_delivery: 0,
    delivering: 0,
    pending_pickup: 0,
  })

  useDidShow(() => {
    if (isLoggedIn) {
      fetchUserInfo()
      fetchOrderCount()
    }
  })

  const fetchOrderCount = async () => {
    try {
      const res = await orderApi.getOrderStatusCount()
      setOrderCount(res)
    } catch (error) {
      console.error('获取订单统计失败:', error)
    }
  }

  const handleLogin = async () => {
    await login()
  }

  const handleOrderClick = (status?: string) => {
    if (!isLoggedIn) {
      // 回跳到订单列表
      const target = `${PAGES.ORDER_LIST}${status ? `?status=${status}` : ''}`
      Taro.navigateTo({ url: `${PAGES.LOGIN}?redirectTo=${encodeURIComponent(target)}` })
      return
    }
    Taro.navigateTo({
      url: `${PAGES.ORDER_LIST}${status ? `?status=${status}` : ''}`,
    })
  }

  const handleMenuClick = (path: string) => {
    if (!isLoggedIn) {
      Taro.navigateTo({ url: `${PAGES.LOGIN}?redirectTo=${encodeURIComponent(path)}` })
      return
    }
    Taro.navigateTo({ url: path })
  }

  return (
    <View className='my'>
      {/* 用户信息 */}
      <View className='my__header'>
        <View className='my__user'>
          <Image
            className='my__avatar'
            src={user?.avatar || PLACEHOLDER_IMAGE}
            mode='aspectFill'
          />
          {isLoggedIn ? (
            <View className='my__info'>
              <Text className='my__nickname'>{user?.nickname || '用户'}</Text>
              <View className='my__points'>
                <Text className='my__points-icon'>💎</Text>
                <Text className='my__points-value'>{user?.points || 0}</Text>
                <Text className='my__points-label'>积分</Text>
              </View>
            </View>
          ) : (
            <Button
              className='my__login-btn'
              onClick={handleLogin}
              loading={loading}
            >
              点击登录
            </Button>
          )}
        </View>
      </View>

      {/* 订单入口 */}
      <View className='my__orders'>
        <View className='my__orders-header'>
          <Text className='my__orders-title'>我的订单</Text>
          <View className='my__orders-all' onClick={() => handleOrderClick()}>
            <Text className='my__orders-all-text'>全部订单</Text>
            <Text className='my__orders-all-arrow'>›</Text>
          </View>
        </View>
        <View className='my__orders-list'>
          {ORDER_STATUS_ENTRIES.map((item) => (
            <View
              key={item.key}
              className='my__orders-item'
              onClick={() => handleOrderClick(item.status)}
            >
              <View className='my__orders-icon-wrapper'>
                <Text className='my__orders-icon'>{item.icon}</Text>
                {orderCount[item.key as keyof OrderStatusCount] > 0 && (
                  <View className='my__orders-badge'>
                    <Text className='my__orders-badge-text'>
                      {orderCount[item.key as keyof OrderStatusCount] > 99
                        ? '99+'
                        : orderCount[item.key as keyof OrderStatusCount]}
                    </Text>
                  </View>
                )}
              </View>
              <Text className='my__orders-label'>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 功能菜单 */}
      <View className='my__menu'>
        {MENU_ITEMS.map((item, index) => (
          <View
            key={index}
            className='my__menu-item'
            onClick={() => handleMenuClick(item.path)}
          >
            <Text className='my__menu-icon'>{item.icon}</Text>
            <Text className='my__menu-label'>{item.label}</Text>
            <Text className='my__menu-arrow'>›</Text>
          </View>
        ))}
      </View>

      {/* 退出登录 */}
      {isLoggedIn && (
        <View className='my__logout' onClick={logout}>
          <Text className='my__logout-text'>退出登录</Text>
        </View>
      )}
    </View>
  )
}
