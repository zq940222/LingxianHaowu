import { View, Text, Image } from '@tarojs/components'
import './index.scss'

interface EmptyStateProps {
  image?: string
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export default function EmptyState({
  image,
  title = '暂无数据',
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <View className='empty-state'>
      {image ? (
        <Image className='empty-state__image' src={image} mode='aspectFit' />
      ) : (
        <View className='empty-state__icon'>
          <Text className='empty-state__icon-text'>📭</Text>
        </View>
      )}
      <Text className='empty-state__title'>{title}</Text>
      {description && (
        <Text className='empty-state__description'>{description}</Text>
      )}
      {actionText && onAction && (
        <View className='empty-state__action' onClick={onAction}>
          <Text className='empty-state__action-text'>{actionText}</Text>
        </View>
      )}
    </View>
  )
}
