import React, { useState, useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useMerchantStore, useOrderStore } from '@/stores'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import './index.scss'

export default function My() {
  const { isLoggedIn, merchant, login, logout, loading } = useMerchantStore()
  const { statistics, fetchStatistics } = useOrderStore()

  useDidShow(() => {
    if (isLoggedIn) {
      fetchStatistics()
    }
  })

  const handleLogin = async () => {
    const success = await login()
    if (success) {
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '登录失败', icon: 'none' })
    }
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.showToast({ title: '已退出登录', icon: 'success' })
        }
      },
    })
  }

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url })
  }

  if (!isLoggedIn) {
    return (
      <View className='my my--login'>
        <View className='my__login-card'>
          <View className='my__login-icon'>
            <Text className='my__login-icon-text'>🏪</Text>
          </View>
          <Text className='my__login-title'>灵鲜好物商家端</Text>
          <Text className='my__login-desc'>请登录以管理您的店铺</Text>
          <View className='my__login-btn' onClick={handleLogin}>
            <Text className='my__login-btn-text'>
              {loading ? '登录中...' : '微信授权登录'}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='my'>
      {/* 头部信息 */}
      <View className='my__header'>
        <Image
          className='my__avatar'
          src={merchant?.avatar || PLACEHOLDER_IMAGE}
          mode='aspectFill'
        />
        <View className='my__info'>
          <Text className='my__name'>{merchant?.store_name || '店铺名称'}</Text>
          <Text className='my__phone'>{merchant?.phone || '暂无手机号'}</Text>
        </View>
      </View>

      {/* 订单统计 */}
      <View className='my__stats'>
        <View
          className='my__stat-item'
          onClick={() => Taro.switchTab({ url: PAGES.ORDER_LIST })}
        >
          <Text className='my__stat-value'>
            {statistics?.pending_confirm || 0}
          </Text>
          <Text className='my__stat-label'>待确认</Text>
        </View>
        <View
          className='my__stat-item'
          onClick={() => Taro.switchTab({ url: PAGES.ORDER_LIST })}
        >
          <Text className='my__stat-value'>
            {statistics?.pending_delivery || 0}
          </Text>
          <Text className='my__stat-label'>待配送</Text>
        </View>
        <View
          className='my__stat-item'
          onClick={() => Taro.switchTab({ url: PAGES.ORDER_LIST })}
        >
          <Text className='my__stat-value'>
            {statistics?.delivering || 0}
          </Text>
          <Text className='my__stat-label'>配送中</Text>
        </View>
        <View
          className='my__stat-item'
          onClick={() => Taro.switchTab({ url: PAGES.ORDER_LIST })}
        >
          <Text className='my__stat-value'>
            {statistics?.refunding || 0}
          </Text>
          <Text className='my__stat-label'>退款中</Text>
        </View>
      </View>

      {/* 菜单列表 */}
      <View className='my__menu'>
        <View
          className='my__menu-item'
          onClick={() => navigateTo(PAGES.STATISTICS)}
        >
          <View className='my__menu-left'>
            <Text className='my__menu-icon'>📊</Text>
            <Text className='my__menu-text'>数据统计</Text>
          </View>
          <Text className='my__menu-arrow'>›</Text>
        </View>

        <View
          className='my__menu-item'
          onClick={() => navigateTo(PAGES.SETTINGS)}
        >
          <View className='my__menu-left'>
            <Text className='my__menu-icon'>⚙️</Text>
            <Text className='my__menu-text'>店铺设置</Text>
          </View>
          <Text className='my__menu-arrow'>›</Text>
        </View>

        <View className='my__menu-item'>
          <View className='my__menu-left'>
            <Text className='my__menu-icon'>🖨️</Text>
            <Text className='my__menu-text'>打印设置</Text>
          </View>
          <Text className='my__menu-arrow'>›</Text>
        </View>

        <View className='my__menu-item'>
          <View className='my__menu-left'>
            <Text className='my__menu-icon'>🔔</Text>
            <Text className='my__menu-text'>消息通知</Text>
          </View>
          <Text className='my__menu-arrow'>›</Text>
        </View>

        <View className='my__menu-item'>
          <View className='my__menu-left'>
            <Text className='my__menu-icon'>❓</Text>
            <Text className='my__menu-text'>帮助中心</Text>
          </View>
          <Text className='my__menu-arrow'>›</Text>
        </View>

        <View className='my__menu-item'>
          <View className='my__menu-left'>
            <Text className='my__menu-icon'>📞</Text>
            <Text className='my__menu-text'>联系客服</Text>
          </View>
          <Text className='my__menu-arrow'>›</Text>
        </View>
      </View>

      {/* 退出登录 */}
      <View className='my__logout' onClick={handleLogout}>
        <Text className='my__logout-text'>退出登录</Text>
      </View>
    </View>
  )
}
