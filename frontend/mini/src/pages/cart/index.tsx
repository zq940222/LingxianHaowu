import { View, Text, Image, Checkbox } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { EmptyState } from '@/components'
import { useCart, useAuth } from '@/hooks'
import { formatPriceYuan } from '@/utils/format'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import './index.scss'

export default function CartPage() {
  const { isLoggedIn } = useAuth()
  const {
    items,
    loading,
    selectedAmount,
    selectedCount,
    isAllSelected,
    fetchCart,
    updateQuantity,
    removeItem,
    toggleSelected,
    toggleAllSelected,
    checkout,
  } = useCart()

  useDidShow(() => {
    if (isLoggedIn) {
      fetchCart()
    }
  })

  const handleQuantityChange = (id: number, delta: number, currentQuantity: number) => {
    const newQuantity = currentQuantity + delta
    updateQuantity(id, newQuantity)
  }

  const handleProductClick = (productId: number) => {
    Taro.navigateTo({
      url: `${PAGES.PRODUCT_DETAIL}?id=${productId}`,
    })
  }

  if (!isLoggedIn) {
    return (
      <View className='cart cart--empty'>
        <EmptyState
          icon='cart'
          title='登录后查看购物车'
          description='登录后即可查看购物车商品'
          buttonText='去登录'
          onButtonClick={() => Taro.navigateTo({ url: PAGES.MY })}
        />
      </View>
    )
  }

  if (items.length === 0 && !loading) {
    return (
      <View className='cart cart--empty'>
        <EmptyState
          icon='cart'
          title='购物车空空如也'
          description='快去挑选心仪的商品吧'
          buttonText='去购物'
          onButtonClick={() => Taro.switchTab({ url: PAGES.INDEX })}
        />
      </View>
    )
  }

  return (
    <View className='cart'>
      {/* 购物车商品列表 */}
      <View className='cart__list'>
        {items.map((item) => (
          <View key={item.id} className='cart__item'>
            <View className='cart__item-checkbox'>
              <Checkbox
                checked={item.selected}
                color='#07c160'
                onClick={() => toggleSelected(item.id)}
              />
            </View>

            <Image
              className='cart__item-image'
              src={item.product.cover_image || PLACEHOLDER_IMAGE}
              mode='aspectFill'
              onClick={() => handleProductClick(item.product_id)}
            />

            <View className='cart__item-content'>
              <Text
                className='cart__item-name'
                onClick={() => handleProductClick(item.product_id)}
              >
                {item.product.name}
              </Text>

              {item.spec && (
                <Text className='cart__item-spec'>{item.spec}</Text>
              )}

              <View className='cart__item-footer'>
                <Text className='cart__item-price'>
                  {formatPriceYuan(item.product.price)}
                </Text>

                <View className='cart__item-quantity'>
                  <View
                    className={`cart__item-quantity-btn ${item.quantity <= 1 ? 'cart__item-quantity-btn--disabled' : ''}`}
                    onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                  >
                    <Text className='cart__item-quantity-btn-text'>-</Text>
                  </View>
                  <Text className='cart__item-quantity-value'>{item.quantity}</Text>
                  <View
                    className='cart__item-quantity-btn'
                    onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                  >
                    <Text className='cart__item-quantity-btn-text'>+</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className='cart__item-delete' onClick={() => removeItem(item.id)}>
              <Text className='cart__item-delete-icon'>×</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 底部结算栏 */}
      <View className='cart__footer'>
        <View className='cart__footer-left'>
          <View className='cart__footer-checkbox'>
            <Checkbox
              checked={isAllSelected}
              color='#07c160'
              onClick={toggleAllSelected}
            />
          </View>
          <Text className='cart__footer-all'>全选</Text>
        </View>

        <View className='cart__footer-right'>
          <View className='cart__footer-total'>
            <Text className='cart__footer-total-label'>合计:</Text>
            <Text className='cart__footer-total-price'>
              {formatPriceYuan(selectedAmount)}
            </Text>
          </View>

          <View
            className={`cart__footer-checkout ${selectedCount === 0 ? 'cart__footer-checkout--disabled' : ''}`}
            onClick={checkout}
          >
            <Text className='cart__footer-checkout-text'>
              结算{selectedCount > 0 ? `(${selectedCount})` : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
