import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useCart } from '@/hooks'
import { formatPriceYuan } from '@/utils/format'
import { PAGES } from '@/constants'
import './index.scss'

interface CartBarProps {
  visible?: boolean
}

export default function CartBar({ visible = true }: CartBarProps) {
  const { totalCount, selectedAmount, selectedCount } = useCart()

  if (!visible || totalCount === 0) {
    return null
  }

  const handleGoCart = () => {
    Taro.switchTab({ url: PAGES.CART })
  }

  return (
    <View className='cart-bar'>
      <View className='cart-bar__content' onClick={handleGoCart}>
        <View className='cart-bar__icon-wrapper'>
          <View className='cart-bar__icon'>
            <Text className='cart-bar__icon-text'>🛒</Text>
          </View>
          {totalCount > 0 && (
            <View className='cart-bar__badge'>
              <Text className='cart-bar__badge-text'>
                {totalCount > 99 ? '99+' : totalCount}
              </Text>
            </View>
          )}
        </View>

        <View className='cart-bar__info'>
          {selectedCount > 0 ? (
            <>
              <Text className='cart-bar__price'>{formatPriceYuan(selectedAmount)}</Text>
              <Text className='cart-bar__tip'>已选{selectedCount}件</Text>
            </>
          ) : (
            <Text className='cart-bar__tip'>未选择商品</Text>
          )}
        </View>
      </View>

      <View
        className={`cart-bar__checkout ${selectedCount === 0 ? 'cart-bar__checkout--disabled' : ''}`}
        onClick={selectedCount > 0 ? () => Taro.navigateTo({ url: PAGES.ORDER_CONFIRM }) : undefined}
      >
        <Text className='cart-bar__checkout-text'>去结算</Text>
      </View>
    </View>
  )
}
