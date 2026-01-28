import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { formatPriceYuan, formatDateTime, formatRelativeTime } from '@/utils/format'
import { ORDER_STATUS_MAP, PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import type { Order } from '@/types'
import './index.scss'

interface OrderCardProps {
  order: Order
  onConfirm?: (order: Order) => void
  onDelivery?: (order: Order) => void
  onComplete?: (order: Order) => void
  onPickup?: (order: Order) => void
}

export default function OrderCard({
  order,
  onConfirm,
  onDelivery,
  onComplete,
  onPickup,
}: OrderCardProps) {
  const statusInfo = ORDER_STATUS_MAP[order.status] || { text: '未知', color: '#8c8c8c' }

  const handleClick = () => {
    Taro.navigateTo({
      url: `${PAGES.ORDER_DETAIL}?id=${order.id}`,
    })
  }

  const handleAction = (e: any, action: () => void) => {
    e.stopPropagation()
    action()
  }

  const renderActionButtons = () => {
    switch (order.status) {
      case 'pending_confirm':
        return (
          <View
            className='order-card__action order-card__action--primary'
            onClick={(e) => handleAction(e, () => onConfirm?.(order))}
          >
            <Text className='order-card__action-text'>确认订单</Text>
          </View>
        )
      case 'pending_delivery':
        return (
          <View
            className='order-card__action order-card__action--primary'
            onClick={(e) => handleAction(e, () => onDelivery?.(order))}
          >
            <Text className='order-card__action-text'>开始配送</Text>
          </View>
        )
      case 'delivering':
        return (
          <View
            className='order-card__action order-card__action--primary'
            onClick={(e) => handleAction(e, () => onComplete?.(order))}
          >
            <Text className='order-card__action-text'>完成配送</Text>
          </View>
        )
      case 'pending_pickup':
        return (
          <View
            className='order-card__action order-card__action--primary'
            onClick={(e) => handleAction(e, () => onPickup?.(order))}
          >
            <Text className='order-card__action-text'>确认自提</Text>
          </View>
        )
      default:
        return null
    }
  }

  return (
    <View className='order-card' onClick={handleClick}>
      {/* 头部 */}
      <View className='order-card__header'>
        <View className='order-card__order-info'>
          <Text className='order-card__order-no'>订单号: {order.order_no}</Text>
          <Text className='order-card__time'>{formatRelativeTime(order.created_at)}</Text>
        </View>
        <View
          className='order-card__status'
          style={{ backgroundColor: statusInfo.color }}
        >
          <Text className='order-card__status-text'>{statusInfo.text}</Text>
        </View>
      </View>

      {/* 商品列表 */}
      <View className='order-card__products'>
        {order.items.slice(0, 3).map((item) => (
          <View key={item.id} className='order-card__product'>
            <Image
              className='order-card__product-image'
              src={item.product_image || PLACEHOLDER_IMAGE}
              mode='aspectFill'
            />
            <View className='order-card__product-info'>
              <Text className='order-card__product-name'>{item.product_name}</Text>
              {item.spec && (
                <Text className='order-card__product-spec'>{item.spec}</Text>
              )}
            </View>
            <View className='order-card__product-right'>
              <Text className='order-card__product-price'>
                {formatPriceYuan(item.price)}
              </Text>
              <Text className='order-card__product-quantity'>x{item.quantity}</Text>
            </View>
          </View>
        ))}
        {order.items.length > 3 && (
          <Text className='order-card__more'>
            等{order.items.length}件商品
          </Text>
        )}
      </View>

      {/* 收货信息 */}
      <View className='order-card__address'>
        <View className='order-card__address-row'>
          <Text className='order-card__address-label'>
            {order.delivery_type === 'pickup' ? '自提' : '配送'}
          </Text>
          <Text className='order-card__address-name'>{order.address.name}</Text>
          <Text className='order-card__address-phone'>{order.address.phone}</Text>
        </View>
        <Text className='order-card__address-detail'>
          {order.delivery_type === 'pickup'
            ? order.pickup_point
            : order.address.full_address}
        </Text>
      </View>

      {/* 底部 */}
      <View className='order-card__footer'>
        <View className='order-card__amount'>
          <Text className='order-card__amount-label'>实付款: </Text>
          <Text className='order-card__amount-value'>
            {formatPriceYuan(order.pay_amount)}
          </Text>
        </View>
        <View className='order-card__actions'>
          {renderActionButtons()}
        </View>
      </View>
    </View>
  )
}
