import { View, Image, Text, Button } from '@tarojs/components'
import './index.scss'

interface EmptyStateProps {
  image?: string
  icon?: string
  title?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
}

// 默认空状态图标
const defaultEmptyIcons = {
  cart: '🛒',
  order: '📋',
  address: '📍',
  coupon: '🎫',
  points: '💰',
  search: '🔍',
  data: '📭',
}

export default function EmptyState({
  image,
  icon = 'data',
  title = '暂无数据',
  description,
  buttonText,
  onButtonClick,
}: EmptyStateProps) {
  const emptyIcon = defaultEmptyIcons[icon as keyof typeof defaultEmptyIcons] || '📭'

  return (
    <View className='empty-state'>
      {image ? (
        <Image className='empty-state__image' src={image} mode='aspectFit' />
      ) : (
        <View className='empty-state__icon'>
          <Text className='empty-state__icon-text'>{emptyIcon}</Text>
        </View>
      )}

      <Text className='empty-state__title'>{title}</Text>

      {description && (
        <Text className='empty-state__description'>{description}</Text>
      )}

      {buttonText && onButtonClick && (
        <Button className='empty-state__button' onClick={onButtonClick}>
          {buttonText}
        </Button>
      )}
    </View>
  )
}
