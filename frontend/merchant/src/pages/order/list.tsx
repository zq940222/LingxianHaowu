import React, { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { OrderCard, EmptyState, Loading } from '@/components'
import { useOrderStore } from '@/stores'
import { orderApi } from '@/api'
import { ORDER_TABS, PAGES } from '@/constants'
import type { Order, OrderStatus } from '@/types'
import './list.scss'

export default function OrderList() {
  const {
    orders,
    statistics,
    currentTab,
    loading,
    hasMore,
    setCurrentTab,
    fetchOrders,
    fetchStatistics,
    confirmOrder,
    startDelivery,
    completeDelivery,
    confirmPickup,
  } = useOrderStore()

  useDidShow(() => {
    fetchOrders(true)
    fetchStatistics()
  })

  usePullDownRefresh(async () => {
    await fetchOrders(true)
    await fetchStatistics()
    Taro.stopPullDownRefresh()
  })

  useReachBottom(() => {
    if (hasMore && !loading) {
      fetchOrders(false)
    }
  })

  const handleTabChange = (tab: OrderStatus | 'all') => {
    setCurrentTab(tab)
    fetchOrders(true)
  }

  const handleConfirm = async (order: Order) => {
    Taro.showModal({
      title: '确认订单',
      content: '确定要确认此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await confirmOrder(order.id)
          if (success) {
            Taro.showToast({ title: '订单已确认', icon: 'success' })
          }
        }
      },
    })
  }

  const handleDelivery = async (order: Order) => {
    Taro.showModal({
      title: '开始配送',
      content: '确定要开始配送此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await startDelivery(order.id)
          if (success) {
            Taro.showToast({ title: '已开始配送', icon: 'success' })
          }
        }
      },
    })
  }

  const handleComplete = async (order: Order) => {
    Taro.showModal({
      title: '完成配送',
      content: '确定订单已送达吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await completeDelivery(order.id)
          if (success) {
            Taro.showToast({ title: '配送完成', icon: 'success' })
          }
        }
      },
    })
  }

  const handlePickup = async (order: Order) => {
    Taro.showModal({
      title: '确认自提',
      content: '确定用户已自提此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await confirmPickup(order.id)
          if (success) {
            Taro.showToast({ title: '自提完成', icon: 'success' })
          }
        }
      },
    })
  }

  const getTabCount = (key: string): number => {
    if (!statistics) return 0
    switch (key) {
      case 'pending_confirm':
        return statistics.pending_confirm
      case 'pending_delivery':
        return statistics.pending_delivery
      case 'delivering':
        return statistics.delivering
      default:
        return 0
    }
  }

  return (
    <View className='order-list'>
      {/* Tab栏 */}
      <View className='order-list__tabs'>
        <ScrollView scrollX className='order-list__tabs-scroll'>
          {ORDER_TABS.map((tab) => (
            <View
              key={tab.key}
              className={`order-list__tab ${currentTab === tab.key ? 'order-list__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.key as OrderStatus | 'all')}
            >
              <Text className='order-list__tab-text'>{tab.title}</Text>
              {getTabCount(tab.key) > 0 && (
                <View className='order-list__tab-badge'>
                  <Text className='order-list__tab-badge-text'>
                    {getTabCount(tab.key)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 订单列表 */}
      <ScrollView scrollY className='order-list__content'>
        {orders.length === 0 && !loading ? (
          <EmptyState
            title='暂无订单'
            description='当前没有符合条件的订单'
          />
        ) : (
          <View className='order-list__items'>
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onConfirm={handleConfirm}
                onDelivery={handleDelivery}
                onComplete={handleComplete}
                onPickup={handlePickup}
              />
            ))}
            {loading && (
              <View className='order-list__loading'>
                <Loading text='加载中...' />
              </View>
            )}
            {!hasMore && orders.length > 0 && (
              <View className='order-list__no-more'>
                <Text className='order-list__no-more-text'>— 没有更多了 —</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
