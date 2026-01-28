import { View, Image, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { formatPriceYuan } from '@/utils/format'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import type { Product } from '@/types'
import './index.scss'

interface ProductCardProps {
  product: Product
  mode?: 'grid' | 'list'
  showAddCart?: boolean
  onAddCart?: (product: Product) => void
}

export default function ProductCard({
  product,
  mode = 'grid',
  showAddCart = true,
  onAddCart,
}: ProductCardProps) {
  const handleClick = () => {
    Taro.navigateTo({
      url: `${PAGES.PRODUCT_DETAIL}?id=${product.id}`,
    })
  }

  const handleAddCart = (e: any) => {
    e.stopPropagation()
    onAddCart?.(product)
  }

  return (
    <View
      className={`product-card product-card--${mode}`}
      onClick={handleClick}
    >
      <View className='product-card__image-wrapper'>
        <Image
          className='product-card__image'
          src={product.cover_image || PLACEHOLDER_IMAGE}
          mode='aspectFill'
          lazyLoad
        />
        {product.is_hot && (
          <View className='product-card__tag product-card__tag--hot'>热卖</View>
        )}
        {product.is_recommended && !product.is_hot && (
          <View className='product-card__tag product-card__tag--recommended'>推荐</View>
        )}
        {product.group_buy_price && (
          <View className='product-card__tag product-card__tag--groupbuy'>拼团</View>
        )}
      </View>

      <View className='product-card__content'>
        <Text className='product-card__name'>{product.name}</Text>

        {mode === 'list' && product.description && (
          <Text className='product-card__desc'>{product.description}</Text>
        )}

        <View className='product-card__footer'>
          <View className='product-card__price-wrapper'>
            <Text className='product-card__price'>
              {formatPriceYuan(product.group_buy_price || product.price)}
            </Text>
            {product.group_buy_price && (
              <Text className='product-card__group-label'>拼团价</Text>
            )}
            {product.original_price > product.price && !product.group_buy_price && (
              <Text className='product-card__original-price'>
                {formatPriceYuan(product.original_price)}
              </Text>
            )}
          </View>

          {mode === 'list' && (
            <Text className='product-card__sales'>已售{product.sales}</Text>
          )}

          {showAddCart && (
            <View className='product-card__add-cart' onClick={handleAddCart}>
              <Text className='product-card__add-cart-icon'>+</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
