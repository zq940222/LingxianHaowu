import React, { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useRouter, usePullDownRefresh } from '@tarojs/taro'
import { EmptyState, Loading } from '@/components'
import { orderApi } from '@/api'
import { usePagination } from '@/hooks/useRequest'
import { formatPriceYuan, formatDate } from '@/utils/format'
import { PAGES, ORDER_STATUS_MAP, PLACEHOLDER_IMAGE } from '@/constants'
import type { Order } from '@/types'
import './list.scss'

const STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '待付款', value: 'pending_payment' },
  { label: '待配送', value: 'pending_delivery,pending_pickup' },
  { label: '配送中', value: 'delivering' },
  { label: '已完成', value: 'completed' },
]

export default function OrderList() {
  const router = useRouter()
  const { status: initStatus } = router.params

  const [currentTab, setCurrentTab] = useState(initStatus || '')

  const {
    list: orders,
    loading,
    hasMore,
    run: loadOrders,
    loadMore,
    refresh,
  } = usePagination(
    (params) => orderApi.getOrderList({ ...params, status: currentTab || undefined }),
    { manual: true }
  )

  useLoad(() => {
    loadOrders()
  })

  usePullDownRefresh(async () => {
    await refresh()
    Taro.stopPullDownRefresh()
  })

  const handleTabChange = (value: string) => {
    setCurrentTab(value)
    loadOrders({ status: value || undefined })
  }

  const handleOrderClick = (order: Order) => {
    Taro.navigateTo({
      url: `${PAGES.ORDER_DETAIL}?id=${order.id}`,
    })
  }

  const handlePay = async (order: Order, e: any) => {
    e.stopPropagation()
    try {
      const paymentData = await orderApi.createPayment(order.id)
      Taro.requestPayment({
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType as 'MD5' | 'HMAC-SHA256' | 'RSA',
        paySign: paymentData.paySign,
        success: () => {
          Taro.showToast({ title: '支付成功', icon: 'success' })
          refresh()
        },
        fail: () => {
          Taro.showToast({ title: '支付取消', icon: 'none' })
        },
      })
    } catch (error) {
      console.error('发起支付失败:', error)
    }
  }

  const handleCancel = async (order: Order, e: any) => {
    e.stopPropagation()
    Taro.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderApi.cancelOrder(order.id)
            Taro.showToast({ title: '订单已取消', icon: 'success' })
            refresh()
          } catch (error) {
            console.error('取消订单失败:', error)
          }
        }
      },
    })
  }

  const handleConfirm = async (order: Order, e: any) => {
    e.stopPropagation()
    Taro.showModal({
      title: '提示',
      content: '确定已收到商品？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderApi.confirmOrder(order.id)
            Taro.showToast({ title: '确认收货成功', icon: 'success' })
            refresh()
          } catch (error) {
            console.error('确认收货失败:', error)
          }
        }
      },
    })
  }

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight } = e.detail
    if (scrollHeight - scrollTop < 1000 && hasMore && !loading) {
      loadMore()
    }
  }

  return (
    <View className='order-list'>
      {/* 状态筛选 */}
      <View className='order-list__tabs'>
        <ScrollView scrollX className='order-list__tabs-scroll'>
          {STATUS_TABS.map((tab) => (
            <View
              key={tab.value}
              className={`order-list__tab ${currentTab === tab.value ? 'order-list__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.value)}
            >
              <Text className='order-list__tab-text'>{tab.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 订单列表 */}
      <ScrollView
        scrollY
        className='order-list__content'
        onScroll={handleScroll}
      >
        {orders.length === 0 && !loading ? (
          <EmptyState
            icon='order'
            title='暂无订单'
            description='快去挑选心仪的商品吧'
            buttonText='去购物'
            onButtonClick={() => Taro.switchTab({ url: PAGES.INDEX })}
          />
        ) : (
          <>
            {orders.map((order) => (
              <View
                key={order.id}
                className='order-list__item'
                onClick={() => handleOrderClick(order)}
              >
                <View className='order-list__item-header'>
                  <Text className='order-list__item-no'>订单号: {order.order_no}</Text>
                  <Text
                    className='order-list__item-status'
                    style={{ color: ORDER_STATUS_MAP[order.status]?.color }}
                  >
                    {ORDER_STATUS_MAP[order.status]?.text}
                  </Text>
                </View>

                <View className='order-list__item-products'>
                  {order.items.slice(0, 3).map((item) => (
                    <Image
                      key={item.id}
                      className='order-list__item-image'
                      src={item.product_image || PLACEHOLDER_IMAGE}
                      mode='aspectFill'
                    />
                  ))}
                  {order.items.length > 3 && (
                    <View className='order-list__item-more'>
                      <Text className='order-list__item-more-text'>
                        +{order.items.length - 3}
                      </Text>
                    </View>
                  )}
                </View>

                <View className='order-list__item-footer'>
                  <Text className='order-list__item-count'>
                    共{order.items.reduce((sum, item) => sum + item.quantity, 0)}件商品
                  </Text>
                  <View className='order-list__item-total'>
                    <Text className='order-list__item-total-label'>实付:</Text>
                    <Text className='order-list__item-total-price'>
                      {formatPriceYuan(order.pay_amount)}
                    </Text>
                  </View>
                </View>

                <View className='order-list__item-actions'>
                  <Text className='order-list__item-time'>
                    {formatDate(order.created_at, 'YYYY-MM-DD HH:mm')}
                  </Text>
                  <View className='order-list__item-buttons'>
                    {order.status === 'pending_payment' && (
                      <>
                        <View
                          className='order-list__item-btn order-list__item-btn--cancel'
                          onClick={(e) => handleCancel(order, e)}
                        >
                          <Text className='order-list__item-btn-text'>取消</Text>
                        </View>
                        <View
                          className='order-list__item-btn order-list__item-btn--pay'
                          onClick={(e) => handlePay(order, e)}
                        >
                          <Text className='order-list__item-btn-text'>去支付</Text>
                        </View>
                      </>
                    )}
                    {(order.status === 'delivering' || order.status === 'pending_pickup') && (
                      <View
                        className='order-list__item-btn order-list__item-btn--confirm'
                        onClick={(e) => handleConfirm(order, e)}
                      >
                        <Text className='order-list__item-btn-text'>确认收货</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {loading && (
              <View className='order-list__loading'>
                <Text className='order-list__loading-text'>加载中...</Text>
              </View>
            )}

            {!hasMore && orders.length > 0 && (
              <View className='order-list__no-more'>
                <Text className='order-list__no-more-text'>— 没有更多了 —</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}
