import React, { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { Loading } from '@/components'
import { orderApi } from '@/api'
import { formatPriceYuan, formatDateTime } from '@/utils/format'
import { ORDER_STATUS_MAP, PLACEHOLDER_IMAGE } from '@/constants'
import type { Order } from '@/types'
import './detail.scss'

export default function OrderDetail() {
  const router = useRouter()
  const orderId = Number(router.params.id)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useLoad(() => {
    if (orderId) {
      fetchOrderDetail()
    }
  })

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)
      const data = await orderApi.getOrderDetail(orderId)
      setOrder(data)
    } catch (error) {
      console.error('获取订单详情失败:', error)
      Taro.showToast({ title: '获取订单失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    Taro.showModal({
      title: '确认订单',
      content: '确定要确认此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          setActionLoading(true)
          try {
            const updated = await orderApi.confirmOrder(orderId)
            setOrder(updated)
            Taro.showToast({ title: '订单已确认', icon: 'success' })
          } catch (error) {
            console.error('确认订单失败:', error)
          } finally {
            setActionLoading(false)
          }
        }
      },
    })
  }

  const handleDelivery = async () => {
    Taro.showModal({
      title: '开始配送',
      content: '确定要开始配送此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          setActionLoading(true)
          try {
            const updated = await orderApi.startDelivery(orderId)
            setOrder(updated)
            Taro.showToast({ title: '已开始配送', icon: 'success' })
          } catch (error) {
            console.error('开始配送失败:', error)
          } finally {
            setActionLoading(false)
          }
        }
      },
    })
  }

  const handleComplete = async () => {
    Taro.showModal({
      title: '完成配送',
      content: '确定订单已送达吗？',
      success: async (res) => {
        if (res.confirm) {
          setActionLoading(true)
          try {
            const updated = await orderApi.completeDelivery(orderId)
            setOrder(updated)
            Taro.showToast({ title: '配送完成', icon: 'success' })
          } catch (error) {
            console.error('完成配送失败:', error)
          } finally {
            setActionLoading(false)
          }
        }
      },
    })
  }

  const handlePickup = async () => {
    Taro.showModal({
      title: '确认自提',
      content: '确定用户已自提此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          setActionLoading(true)
          try {
            const updated = await orderApi.confirmPickup(orderId)
            setOrder(updated)
            Taro.showToast({ title: '自提完成', icon: 'success' })
          } catch (error) {
            console.error('确认自提失败:', error)
          } finally {
            setActionLoading(false)
          }
        }
      },
    })
  }

  const handleCancel = async () => {
    Taro.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          setActionLoading(true)
          try {
            const updated = await orderApi.cancelOrder(orderId, '商家取消')
            setOrder(updated)
            Taro.showToast({ title: '订单已取消', icon: 'success' })
          } catch (error) {
            console.error('取消订单失败:', error)
          } finally {
            setActionLoading(false)
          }
        }
      },
    })
  }

  const handlePrint = async () => {
    try {
      await orderApi.printOrder(orderId)
      Taro.showToast({ title: '打印成功', icon: 'success' })
    } catch (error) {
      console.error('打印失败:', error)
    }
  }

  const handleCall = () => {
    if (order?.address.phone) {
      Taro.makePhoneCall({
        phoneNumber: order.address.phone,
      })
    }
  }

  if (loading) {
    return <Loading fullScreen text='加载中...' />
  }

  if (!order) {
    return (
      <View className='order-detail order-detail--empty'>
        <Text className='order-detail__empty-text'>订单不存在</Text>
      </View>
    )
  }

  const statusInfo = ORDER_STATUS_MAP[order.status] || { text: '未知', color: '#8c8c8c' }

  const renderActionButtons = () => {
    const buttons: JSX.Element[] = []

    if (order.status === 'pending_confirm') {
      buttons.push(
        <View key='cancel' className='order-detail__action' onClick={handleCancel}>
          <Text className='order-detail__action-text'>取消订单</Text>
        </View>
      )
      buttons.push(
        <View
          key='confirm'
          className='order-detail__action order-detail__action--primary'
          onClick={handleConfirm}
        >
          <Text className='order-detail__action-text'>确认订单</Text>
        </View>
      )
    }

    if (order.status === 'pending_delivery') {
      buttons.push(
        <View
          key='delivery'
          className='order-detail__action order-detail__action--primary'
          onClick={handleDelivery}
        >
          <Text className='order-detail__action-text'>开始配送</Text>
        </View>
      )
    }

    if (order.status === 'delivering') {
      buttons.push(
        <View
          key='complete'
          className='order-detail__action order-detail__action--primary'
          onClick={handleComplete}
        >
          <Text className='order-detail__action-text'>完成配送</Text>
        </View>
      )
    }

    if (order.status === 'pending_pickup') {
      buttons.push(
        <View
          key='pickup'
          className='order-detail__action order-detail__action--primary'
          onClick={handlePickup}
        >
          <Text className='order-detail__action-text'>确认自提</Text>
        </View>
      )
    }

    return buttons
  }

  return (
    <View className='order-detail'>
      <ScrollView scrollY className='order-detail__scroll'>
        {/* 状态 */}
        <View
          className='order-detail__status'
          style={{ backgroundColor: statusInfo.color }}
        >
          <Text className='order-detail__status-text'>{statusInfo.text}</Text>
          {order.delivery_time && (
            <Text className='order-detail__status-time'>
              期望送达: {order.delivery_time}
            </Text>
          )}
        </View>

        {/* 收货信息 */}
        <View className='order-detail__section'>
          <View className='order-detail__address'>
            <View className='order-detail__address-header'>
              <View className='order-detail__address-type'>
                <Text className='order-detail__address-type-text'>
                  {order.delivery_type === 'pickup' ? '自提' : '配送'}
                </Text>
              </View>
              <View className='order-detail__address-contact'>
                <Text className='order-detail__address-name'>
                  {order.address.name}
                </Text>
                <Text
                  className='order-detail__address-phone'
                  onClick={handleCall}
                >
                  {order.address.phone} 📞
                </Text>
              </View>
            </View>
            <Text className='order-detail__address-detail'>
              {order.delivery_type === 'pickup'
                ? order.pickup_point
                : order.address.full_address}
            </Text>
          </View>
        </View>

        {/* 商品列表 */}
        <View className='order-detail__section'>
          <Text className='order-detail__section-title'>商品信息</Text>
          <View className='order-detail__products'>
            {order.items.map((item) => (
              <View key={item.id} className='order-detail__product'>
                <Image
                  className='order-detail__product-image'
                  src={item.product_image || PLACEHOLDER_IMAGE}
                  mode='aspectFill'
                />
                <View className='order-detail__product-info'>
                  <Text className='order-detail__product-name'>
                    {item.product_name}
                  </Text>
                  {item.spec && (
                    <Text className='order-detail__product-spec'>{item.spec}</Text>
                  )}
                  <View className='order-detail__product-bottom'>
                    <Text className='order-detail__product-price'>
                      {formatPriceYuan(item.price)}
                    </Text>
                    <Text className='order-detail__product-quantity'>
                      x{item.quantity}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 订单金额 */}
        <View className='order-detail__section'>
          <Text className='order-detail__section-title'>订单金额</Text>
          <View className='order-detail__amount-list'>
            <View className='order-detail__amount-row'>
              <Text className='order-detail__amount-label'>商品总额</Text>
              <Text className='order-detail__amount-value'>
                {formatPriceYuan(order.total_amount)}
              </Text>
            </View>
            {order.discount_amount > 0 && (
              <View className='order-detail__amount-row'>
                <Text className='order-detail__amount-label'>优惠</Text>
                <Text className='order-detail__amount-value order-detail__amount-value--discount'>
                  -{formatPriceYuan(order.discount_amount)}
                </Text>
              </View>
            )}
            <View className='order-detail__amount-row'>
              <Text className='order-detail__amount-label'>配送费</Text>
              <Text className='order-detail__amount-value'>
                {order.delivery_fee > 0 ? formatPriceYuan(order.delivery_fee) : '免运费'}
              </Text>
            </View>
            <View className='order-detail__amount-row order-detail__amount-row--total'>
              <Text className='order-detail__amount-label'>实付款</Text>
              <Text className='order-detail__amount-value order-detail__amount-value--total'>
                {formatPriceYuan(order.pay_amount)}
              </Text>
            </View>
          </View>
        </View>

        {/* 订单信息 */}
        <View className='order-detail__section'>
          <Text className='order-detail__section-title'>订单信息</Text>
          <View className='order-detail__info-list'>
            <View className='order-detail__info-row'>
              <Text className='order-detail__info-label'>订单编号</Text>
              <Text className='order-detail__info-value'>{order.order_no}</Text>
            </View>
            <View className='order-detail__info-row'>
              <Text className='order-detail__info-label'>下单时间</Text>
              <Text className='order-detail__info-value'>
                {formatDateTime(order.created_at)}
              </Text>
            </View>
            {order.payment_time && (
              <View className='order-detail__info-row'>
                <Text className='order-detail__info-label'>支付时间</Text>
                <Text className='order-detail__info-value'>
                  {formatDateTime(order.payment_time)}
                </Text>
              </View>
            )}
            {order.remark && (
              <View className='order-detail__info-row'>
                <Text className='order-detail__info-label'>备注</Text>
                <Text className='order-detail__info-value order-detail__info-value--remark'>
                  {order.remark}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      {renderActionButtons().length > 0 && (
        <View className='order-detail__footer safe-area-bottom'>
          <View className='order-detail__footer-left'>
            <View className='order-detail__footer-btn' onClick={handlePrint}>
              <Text className='order-detail__footer-btn-text'>🖨️ 打印</Text>
            </View>
          </View>
          <View className='order-detail__footer-right'>
            {renderActionButtons()}
          </View>
        </View>
      )}

      {actionLoading && <Loading fullScreen text='处理中...' />}
    </View>
  )
}
