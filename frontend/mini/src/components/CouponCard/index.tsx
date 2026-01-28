import { View, Text } from '@tarojs/components'
import { formatDate, formatCouponValue } from '@/utils/format'
import type { Coupon, UserCoupon } from '@/types'
import './index.scss'

interface CouponCardProps {
  coupon: Coupon | UserCoupon
  type?: 'available' | 'used' | 'expired' | 'receive'
  selected?: boolean
  onSelect?: () => void
  onReceive?: () => void
}

export default function CouponCard({
  coupon,
  type = 'available',
  selected = false,
  onSelect,
  onReceive,
}: CouponCardProps) {
  // 判断是否是UserCoupon
  const isUserCoupon = 'coupon' in coupon
  const couponData = isUserCoupon ? (coupon as UserCoupon).coupon : (coupon as Coupon)
  const status = isUserCoupon ? (coupon as UserCoupon).status : type

  const isDisabled = status === 'used' || status === 'expired'

  return (
    <View
      className={`coupon-card coupon-card--${status} ${selected ? 'coupon-card--selected' : ''}`}
      onClick={!isDisabled && onSelect ? onSelect : undefined}
    >
      <View className='coupon-card__left'>
        <View className='coupon-card__value'>
          {couponData.type === 'fixed' ? (
            <>
              <Text className='coupon-card__symbol'>¥</Text>
              <Text className='coupon-card__amount'>{couponData.value}</Text>
            </>
          ) : (
            <Text className='coupon-card__amount'>{couponData.value}折</Text>
          )}
        </View>
        <Text className='coupon-card__condition'>
          满{couponData.min_amount}元可用
        </Text>
      </View>

      <View className='coupon-card__divider' />

      <View className='coupon-card__right'>
        <Text className='coupon-card__name'>{couponData.name}</Text>
        <Text className='coupon-card__time'>
          {formatDate(couponData.start_time, 'MM.DD')}-{formatDate(couponData.end_time, 'MM.DD')}
        </Text>
        {couponData.description && (
          <Text className='coupon-card__desc'>{couponData.description}</Text>
        )}
      </View>

      {type === 'receive' && onReceive && (
        <View className='coupon-card__action' onClick={onReceive}>
          <Text className='coupon-card__action-text'>领取</Text>
        </View>
      )}

      {selected && (
        <View className='coupon-card__check'>
          <Text className='coupon-card__check-icon'>✓</Text>
        </View>
      )}

      {isDisabled && (
        <View className='coupon-card__status'>
          <Text className='coupon-card__status-text'>
            {status === 'used' ? '已使用' : '已过期'}
          </Text>
        </View>
      )}
    </View>
  )
}
