import { View, Text, Image, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { formatPriceYuan } from '@/utils/format'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import type { Product } from '@/types'
import './index.scss'

interface ProductCardProps {
  product: Product
  onToggleSale?: (product: Product, isOnSale: boolean) => void
  onEdit?: (product: Product) => void
}

export default function ProductCard({
  product,
  onToggleSale,
  onEdit,
}: ProductCardProps) {
  const handleClick = () => {
    Taro.navigateTo({
      url: `${PAGES.PRODUCT_EDIT}?id=${product.id}`,
    })
  }

  const handleToggleSale = (e: any) => {
    e.stopPropagation()
    onToggleSale?.(product, e.detail.value)
  }

  const handleEdit = (e: any) => {
    e.stopPropagation()
    onEdit?.(product)
  }

  return (
    <View className='product-card' onClick={handleClick}>
      <Image
        className='product-card__image'
        src={product.cover_image || PLACEHOLDER_IMAGE}
        mode='aspectFill'
      />
      <View className='product-card__content'>
        <View className='product-card__header'>
          <Text className='product-card__name'>{product.name}</Text>
          {!product.is_on_sale && (
            <View className='product-card__tag product-card__tag--off'>
              <Text className='product-card__tag-text'>已下架</Text>
            </View>
          )}
        </View>
        <View className='product-card__info'>
          <View className='product-card__price-row'>
            <Text className='product-card__price'>
              {formatPriceYuan(product.price)}
            </Text>
            {product.original_price > product.price && (
              <Text className='product-card__original-price'>
                {formatPriceYuan(product.original_price)}
              </Text>
            )}
          </View>
          <View className='product-card__stats'>
            <Text className='product-card__stat'>库存: {product.stock}</Text>
            <Text className='product-card__stat'>销量: {product.sales}</Text>
          </View>
        </View>
        <View className='product-card__footer'>
          <View className='product-card__switch'>
            <Text className='product-card__switch-label'>在售</Text>
            <Switch
              checked={product.is_on_sale}
              onChange={handleToggleSale}
              color='#1890ff'
            />
          </View>
          <View className='product-card__edit' onClick={handleEdit}>
            <Text className='product-card__edit-text'>编辑</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
