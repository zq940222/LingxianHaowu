import React, { useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { Loading } from '@/components'
import { orderApi } from '@/api'
import { formatPriceYuan, formatDate, formatAddress, formatPhone } from '@/utils/format'
import { PAGES, ORDER_STATUS_MAP, DELIVERY_TYPES, PLACEHOLDER_IMAGE } from '@/constants'
import type { Order } from '@/types'
import './detail.scss'

export default function OrderDetail() {
  const router = useRouter()
  const { id } = router.params

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useLoad(() => {
    if (id) {
      fetchOrder(Number(id))
    }
  })

  const fetchOrder = async (orderId: number) => {
    try {
      setLoading(true)
      const res = await orderApi.getOrderDetail(orderId)
      setOrder(res)
    } catch (error) {
      console.error('获取订单详情失败:', error)
      Taro.showToast({ title: '订单不存在', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!order) return
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
          fetchOrder(order.id)
        },
        fail: () => {
          Taro.showToast({ title: '支付取消', icon: 'none' })
        },
      })
    } catch (error) {
      console.error('发起支付失败:', error)
    }
  }

  const handleCancel = () => {
    if (!order) return
    Taro.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderApi.cancelOrder(order.id)
            Taro.showToast({ title: '订单已取消', icon: 'success' })
            fetchOrder(order.id)
          } catch (error) {
            console.error('取消订单失败:', error)
          }
        }
      },
    })
  }

  const handleConfirm = () => {
    if (!order) return
    Taro.showModal({
      title: '提示',
      content: '确定已收到商品？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderApi.confirmOrder(order.id)
            Taro.showToast({ title: '确认收货成功', icon: 'success' })
            fetchOrder(order.id)
          } catch (error) {
            console.error('确认收货失败:', error)
          }
        }
      },
    })
  }

  const handleRefund = () => {
    if (!order) return
    Taro.showModal({
      title: '申请退款',
      content: '确定要申请退款吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await orderApi.applyRefund(order.id, { reason: '用户申请退款' })
            Taro.showToast({ title: '退款申请已提交', icon: 'success' })
            fetchOrder(order.id)
          } catch (error) {
            console.error('申请退款失败:', error)
          }
        }
      },
    })
  }

  const handleCopyOrderNo = () => {
    if (!order) return
    Taro.setClipboardData({
      data: order.order_no,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'success' })
      },
    })
  }

  if (loading) {
    return <Loading fullscreen />
  }

  if (!order) {
    return (
      <View className='order-detail__empty'>
        <Text>订单不存在</Text>
      </View>
    )
  }

  const statusInfo = ORDER_STATUS_MAP[order.status]

  return (
    <View className='order-detail'>
      <ScrollView scrollY className='order-detail__content'>
        {/* 订单状态 */}
        <View className='order-detail__status' style={{ backgroundColor: statusInfo?.color }}>
          <Text className='order-detail__status-text'>{statusInfo?.text}</Text>
          {order.status === 'pending_payment' && (
            <Text className='order-detail__status-tip'>请在30分钟内完成支付</Text>
          )}
        </View>

        {/* 收货信息 */}
        <View className='order-detail__address'>
          <View className='order-detail__address-icon'>
            {order.delivery_type === 'delivery' ? '📍' : '🏪'}
          </View>
          <View className='order-detail__address-content'>
            {order.delivery_type === 'delivery' && order.address ? (
              <>
                <View className='order-detail__address-header'>
                  <Text className='order-detail__address-name'>{order.address.name}</Text>
                  <Text className='order-detail__address-phone'>
                    {formatPhone(order.address.phone)}
                  </Text>
                </View>
                <Text className='order-detail__address-detail'>
                  {formatAddress(order.address)}
                </Text>
              </>
            ) : (
              <Text className='order-detail__address-detail'>到店自提</Text>
            )}
            <Text className='order-detail__address-type'>
              {DELIVERY_TYPES[order.delivery_type]}
            </Text>
          </View>
        </View>

        {/* 商品列表 */}
        <View className='order-detail__products'>
          <View className='order-detail__products-header'>
            <Text className='order-detail__products-title'>商品信息</Text>
          </View>
          {order.items.map((item) => (
            <View
              key={item.id}
              className='order-detail__product'
              onClick={() => Taro.navigateTo({ url: `${PAGES.PRODUCT_DETAIL}?id=${item.product_id}` })}
            >
              <Image
                className='order-detail__product-image'
                src={item.product_image || PLACEHOLDER_IMAGE}
                mode='aspectFill'
              />
              <View className='order-detail__product-content'>
                <Text className='order-detail__product-name'>{item.product_name}</Text>
                {item.spec && (
                  <Text className='order-detail__product-spec'>{item.spec}</Text>
                )}
                <View className='order-detail__product-footer'>
                  <Text className='order-detail__product-price'>
                    {formatPriceYuan(item.price)}
                  </Text>
                  <Text className='order-detail__product-quantity'>x{item.quantity}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 订单金额 */}
        <View className='order-detail__summary'>
          <View className='order-detail__summary-row'>
            <Text className='order-detail__summary-label'>商品金额</Text>
            <Text className='order-detail__summary-value'>
              {formatPriceYuan(order.total_amount)}
            </Text>
          </View>
          <View className='order-detail__summary-row'>
            <Text className='order-detail__summary-label'>配送费</Text>
            <Text className='order-detail__summary-value'>
              {order.freight_amount > 0 ? formatPriceYuan(order.freight_amount) : '免运费'}
            </Text>
          </View>
          {order.discount_amount > 0 && (
            <View className='order-detail__summary-row'>
              <Text className='order-detail__summary-label'>优惠</Text>
              <Text className='order-detail__summary-value order-detail__summary-value--discount'>
                -{formatPriceYuan(order.discount_amount)}
              </Text>
            </View>
          )}
          <View className='order-detail__summary-row order-detail__summary-row--total'>
            <Text className='order-detail__summary-label'>实付金额</Text>
            <Text className='order-detail__summary-value order-detail__summary-value--total'>
              {formatPriceYuan(order.pay_amount)}
            </Text>
          </View>
        </View>

        {/* 订单信息 */}
        <View className='order-detail__info'>
          <View className='order-detail__info-header'>
            <Text className='order-detail__info-title'>订单信息</Text>
          </View>
          <View className='order-detail__info-row'>
            <Text className='order-detail__info-label'>订单编号</Text>
            <View className='order-detail__info-value-wrapper'>
              <Text className='order-detail__info-value'>{order.order_no}</Text>
              <Text className='order-detail__info-copy' onClick={handleCopyOrderNo}>
                复制
              </Text>
            </View>
          </View>
          <View className='order-detail__info-row'>
            <Text className='order-detail__info-label'>下单时间</Text>
            <Text className='order-detail__info-value'>
              {formatDate(order.created_at, 'YYYY-MM-DD HH:mm:ss')}
            </Text>
          </View>
          {order.paid_at && (
            <View className='order-detail__info-row'>
              <Text className='order-detail__info-label'>支付时间</Text>
              <Text className='order-detail__info-value'>
                {formatDate(order.paid_at, 'YYYY-MM-DD HH:mm:ss')}
              </Text>
            </View>
          )}
          {order.remark && (
            <View className='order-detail__info-row'>
              <Text className='order-detail__info-label'>订单备注</Text>
              <Text className='order-detail__info-value'>{order.remark}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      {(order.status === 'pending_payment' ||
        order.status === 'delivering' ||
        order.status === 'pending_pickup' ||
        order.status === 'pending_delivery') && (
        <View className='order-detail__footer'>
          {order.status === 'pending_payment' && (
            <>
              <View className='order-detail__footer-btn order-detail__footer-btn--cancel' onClick={handleCancel}>
                <Text className='order-detail__footer-btn-text'>取消订单</Text>
              </View>
              <View className='order-detail__footer-btn order-detail__footer-btn--pay' onClick={handlePay}>
                <Text className='order-detail__footer-btn-text'>立即支付</Text>
              </View>
            </>
          )}
          {order.status === 'pending_delivery' && (
            <View className='order-detail__footer-btn order-detail__footer-btn--refund' onClick={handleRefund}>
              <Text className='order-detail__footer-btn-text'>申请退款</Text>
            </View>
          )}
          {(order.status === 'delivering' || order.status === 'pending_pickup') && (
            <View className='order-detail__footer-btn order-detail__footer-btn--confirm' onClick={handleConfirm}>
              <Text className='order-detail__footer-btn-text'>确认收货</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
