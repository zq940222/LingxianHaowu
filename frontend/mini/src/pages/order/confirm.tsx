import React, { useState, useEffect } from 'react'
import { View, Text, Image, Textarea } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { AddressSelector, CouponCard, Loading } from '@/components'
import { orderApi, activityApi } from '@/api'
import { useUserStore, useCartStore } from '@/stores'
import { formatPriceYuan, formatAddress } from '@/utils/format'
import { PAGES, PLACEHOLDER_IMAGE, DELIVERY_TYPES } from '@/constants'
import type { Address, CartItem, UserCoupon, PickupPoint, DeliveryTimeSlot } from '@/types'
import './confirm.scss'

export default function OrderConfirm() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<CartItem[]>([])
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [showAddressSelector, setShowAddressSelector] = useState(false)
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([])
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupPoint | null>(null)
  const [timeSlots, setTimeSlots] = useState<DeliveryTimeSlot[]>([])
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [showTimeSelector, setShowTimeSelector] = useState(false)
  const [coupons, setCoupons] = useState<UserCoupon[]>([])
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null)
  const [showCouponSelector, setShowCouponSelector] = useState(false)
  const [remark, setRemark] = useState('')
  const [orderPreview, setOrderPreview] = useState<{
    total_amount: number
    freight_amount: number
    discount_amount: number
    pay_amount: number
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { defaultAddress, fetchAddresses } = useUserStore()
  const { getSelectedItems } = useCartStore()

  useLoad(async () => {
    // 获取订单商品
    const storedItems = Taro.getStorageSync('orderItems')
    const cartItems = getSelectedItems()

    if (storedItems && storedItems.length > 0) {
      setItems(storedItems)
      Taro.removeStorageSync('orderItems')
    } else if (cartItems.length > 0) {
      setItems(cartItems)
    } else {
      Taro.showToast({ title: '请选择商品', icon: 'none' })
      Taro.navigateBack()
      return
    }

    // 加载地址
    await fetchAddresses()

    // 加载配送时间和自提点
    loadDeliveryOptions()

    setLoading(false)
  })

  useEffect(() => {
    setSelectedAddress(defaultAddress)
  }, [defaultAddress])

  useEffect(() => {
    if (items.length > 0) {
      loadCoupons()
      loadOrderPreview()
    }
  }, [items, selectedAddress, selectedCoupon, deliveryType])

  const loadDeliveryOptions = async () => {
    try {
      const [timeSlotsRes, pickupPointsRes] = await Promise.all([
        orderApi.getDeliveryTimeSlots().catch(() => []),
        orderApi.getPickupPoints().catch(() => []),
      ])
      setTimeSlots(timeSlotsRes)
      setPickupPoints(pickupPointsRes)
      if (pickupPointsRes.length > 0) {
        setSelectedPickupPoint(pickupPointsRes[0])
      }
    } catch (error) {
      console.error('加载配送选项失败:', error)
    }
  }

  const loadCoupons = async () => {
    try {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      )
      const res = await activityApi.getAvailableCoupons(totalAmount)
      setCoupons(res)
    } catch (error) {
      console.error('加载优惠券失败:', error)
    }
  }

  const loadOrderPreview = async () => {
    try {
      const res = await orderApi.previewOrder({
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          spec: item.spec,
        })),
        address_id: deliveryType === 'delivery' ? selectedAddress?.id : undefined,
        pickup_point_id: deliveryType === 'pickup' ? selectedPickupPoint?.id : undefined,
        delivery_type: deliveryType,
        coupon_id: selectedCoupon?.id,
      })
      setOrderPreview(res)
    } catch (error) {
      console.error('加载订单预览失败:', error)
    }
  }

  const handleSubmitOrder = async () => {
    if (deliveryType === 'delivery' && !selectedAddress) {
      Taro.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }

    if (deliveryType === 'pickup' && !selectedPickupPoint) {
      Taro.showToast({ title: '请选择自提点', icon: 'none' })
      return
    }

    try {
      setSubmitting(true)

      const res = await orderApi.createOrder({
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          spec: item.spec,
        })),
        address_id: deliveryType === 'delivery' ? selectedAddress?.id : undefined,
        pickup_point_id: deliveryType === 'pickup' ? selectedPickupPoint?.id : undefined,
        delivery_type: deliveryType,
        delivery_time: selectedTime || undefined,
        coupon_id: selectedCoupon?.id,
        remark: remark || undefined,
      })

      // 发起支付
      const paymentData = await orderApi.createPayment(res.order_id)

      // 调用微信支付
      Taro.requestPayment({
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType as 'MD5' | 'HMAC-SHA256' | 'RSA',
        paySign: paymentData.paySign,
        success: () => {
          Taro.redirectTo({
            url: `${PAGES.ORDER_RESULT}?status=success&orderId=${res.order_id}`,
          })
        },
        fail: () => {
          Taro.redirectTo({
            url: `${PAGES.ORDER_RESULT}?status=fail&orderId=${res.order_id}`,
          })
        },
      })
    } catch (error) {
      console.error('提交订单失败:', error)
      Taro.showToast({ title: '提交订单失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loading fullscreen />
  }

  return (
    <View className='order-confirm'>
      {/* 配送方式 */}
      <View className='order-confirm__delivery-type'>
        <View
          className={`order-confirm__delivery-type-item ${deliveryType === 'delivery' ? 'order-confirm__delivery-type-item--active' : ''}`}
          onClick={() => setDeliveryType('delivery')}
        >
          <Text className='order-confirm__delivery-type-text'>送货上门</Text>
        </View>
        <View
          className={`order-confirm__delivery-type-item ${deliveryType === 'pickup' ? 'order-confirm__delivery-type-item--active' : ''}`}
          onClick={() => setDeliveryType('pickup')}
        >
          <Text className='order-confirm__delivery-type-text'>到店自提</Text>
        </View>
      </View>

      {/* 收货地址/自提点 */}
      {deliveryType === 'delivery' ? (
        <View
          className='order-confirm__address'
          onClick={() => setShowAddressSelector(true)}
        >
          {selectedAddress ? (
            <>
              <View className='order-confirm__address-icon'>📍</View>
              <View className='order-confirm__address-content'>
                <View className='order-confirm__address-header'>
                  <Text className='order-confirm__address-name'>
                    {selectedAddress.name}
                  </Text>
                  <Text className='order-confirm__address-phone'>
                    {selectedAddress.phone}
                  </Text>
                </View>
                <Text className='order-confirm__address-detail'>
                  {formatAddress(selectedAddress)}
                </Text>
              </View>
              <Text className='order-confirm__address-arrow'>›</Text>
            </>
          ) : (
            <View className='order-confirm__address-empty'>
              <Text className='order-confirm__address-empty-text'>
                请选择收货地址
              </Text>
              <Text className='order-confirm__address-arrow'>›</Text>
            </View>
          )}
        </View>
      ) : (
        <View className='order-confirm__pickup'>
          {selectedPickupPoint ? (
            <>
              <View className='order-confirm__pickup-icon'>🏪</View>
              <View className='order-confirm__pickup-content'>
                <Text className='order-confirm__pickup-name'>
                  {selectedPickupPoint.name}
                </Text>
                <Text className='order-confirm__pickup-address'>
                  {selectedPickupPoint.address}
                </Text>
                <Text className='order-confirm__pickup-time'>
                  营业时间: {selectedPickupPoint.business_hours}
                </Text>
              </View>
            </>
          ) : (
            <Text className='order-confirm__pickup-empty'>暂无自提点</Text>
          )}
        </View>
      )}

      {/* 商品列表 */}
      <View className='order-confirm__products'>
        <View className='order-confirm__products-header'>
          <Text className='order-confirm__products-title'>商品清单</Text>
          <Text className='order-confirm__products-count'>共{items.length}件</Text>
        </View>
        {items.map((item) => (
          <View key={item.id} className='order-confirm__product'>
            <Image
              className='order-confirm__product-image'
              src={item.product.cover_image || PLACEHOLDER_IMAGE}
              mode='aspectFill'
            />
            <View className='order-confirm__product-content'>
              <Text className='order-confirm__product-name'>{item.product.name}</Text>
              {item.spec && (
                <Text className='order-confirm__product-spec'>{item.spec}</Text>
              )}
              <View className='order-confirm__product-footer'>
                <Text className='order-confirm__product-price'>
                  {formatPriceYuan(item.product.price)}
                </Text>
                <Text className='order-confirm__product-quantity'>x{item.quantity}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 配送时间 */}
      <View
        className='order-confirm__cell'
        onClick={() => setShowTimeSelector(true)}
      >
        <Text className='order-confirm__cell-label'>配送时间</Text>
        <Text className='order-confirm__cell-value'>
          {selectedTime || '请选择配送时间'}
        </Text>
        <Text className='order-confirm__cell-arrow'>›</Text>
      </View>

      {/* 优惠券 */}
      <View
        className='order-confirm__cell'
        onClick={() => setShowCouponSelector(true)}
      >
        <Text className='order-confirm__cell-label'>优惠券</Text>
        <Text
          className={`order-confirm__cell-value ${selectedCoupon ? 'order-confirm__cell-value--highlight' : ''}`}
        >
          {selectedCoupon
            ? `-¥${selectedCoupon.coupon.value}`
            : coupons.length > 0
            ? `${coupons.length}张可用`
            : '暂无可用'}
        </Text>
        <Text className='order-confirm__cell-arrow'>›</Text>
      </View>

      {/* 订单备注 */}
      <View className='order-confirm__remark'>
        <Text className='order-confirm__remark-label'>订单备注</Text>
        <Textarea
          className='order-confirm__remark-input'
          placeholder='选填，可填写您的特殊需求'
          value={remark}
          onInput={(e) => setRemark(e.detail.value)}
          maxlength={200}
        />
      </View>

      {/* 订单金额 */}
      {orderPreview && (
        <View className='order-confirm__summary'>
          <View className='order-confirm__summary-row'>
            <Text className='order-confirm__summary-label'>商品金额</Text>
            <Text className='order-confirm__summary-value'>
              {formatPriceYuan(orderPreview.total_amount)}
            </Text>
          </View>
          <View className='order-confirm__summary-row'>
            <Text className='order-confirm__summary-label'>配送费</Text>
            <Text className='order-confirm__summary-value'>
              {orderPreview.freight_amount > 0
                ? formatPriceYuan(orderPreview.freight_amount)
                : '免运费'}
            </Text>
          </View>
          {orderPreview.discount_amount > 0 && (
            <View className='order-confirm__summary-row'>
              <Text className='order-confirm__summary-label'>优惠</Text>
              <Text className='order-confirm__summary-value order-confirm__summary-value--discount'>
                -{formatPriceYuan(orderPreview.discount_amount)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 底部结算栏 */}
      <View className='order-confirm__footer'>
        <View className='order-confirm__footer-total'>
          <Text className='order-confirm__footer-total-label'>实付:</Text>
          <Text className='order-confirm__footer-total-price'>
            {formatPriceYuan(orderPreview?.pay_amount || 0)}
          </Text>
        </View>
        <View
          className={`order-confirm__footer-submit ${submitting ? 'order-confirm__footer-submit--disabled' : ''}`}
          onClick={handleSubmitOrder}
        >
          <Text className='order-confirm__footer-submit-text'>
            {submitting ? '提交中...' : '提交订单'}
          </Text>
        </View>
      </View>

      {/* 地址选择器 */}
      <AddressSelector
        visible={showAddressSelector}
        selected={selectedAddress}
        onSelect={setSelectedAddress}
        onClose={() => setShowAddressSelector(false)}
      />

      {/* 优惠券选择弹窗 */}
      {showCouponSelector && (
        <View className='order-confirm__coupon-popup'>
          <View
            className='order-confirm__coupon-popup-mask'
            onClick={() => setShowCouponSelector(false)}
          />
          <View className='order-confirm__coupon-popup-content'>
            <View className='order-confirm__coupon-popup-header'>
              <Text className='order-confirm__coupon-popup-title'>选择优惠券</Text>
              <View
                className='order-confirm__coupon-popup-close'
                onClick={() => setShowCouponSelector(false)}
              >
                <Text className='order-confirm__coupon-popup-close-icon'>×</Text>
              </View>
            </View>
            <View className='order-confirm__coupon-popup-list'>
              {coupons.length === 0 ? (
                <View className='order-confirm__coupon-popup-empty'>
                  <Text>暂无可用优惠券</Text>
                </View>
              ) : (
                coupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    selected={selectedCoupon?.id === coupon.id}
                    onSelect={() => {
                      setSelectedCoupon(
                        selectedCoupon?.id === coupon.id ? null : coupon
                      )
                      setShowCouponSelector(false)
                    }}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
