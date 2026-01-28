import { View, Text } from '@tarojs/components'
import './index.scss'

interface StatCardProps {
  title: string
  value: string | number
  subValue?: string
  icon?: string
  color?: string
  onClick?: () => void
}

export default function StatCard({
  title,
  value,
  subValue,
  icon,
  color = '#1890ff',
  onClick,
}: StatCardProps) {
  return (
    <View className='stat-card' onClick={onClick}>
      {icon && (
        <View className='stat-card__icon' style={{ backgroundColor: color }}>
          <Text className='stat-card__icon-text'>{icon}</Text>
        </View>
      )}
      <View className='stat-card__content'>
        <Text className='stat-card__value' style={{ color }}>
          {value}
        </Text>
        <Text className='stat-card__title'>{title}</Text>
        {subValue && (
          <Text className='stat-card__sub-value'>{subValue}</Text>
        )}
      </View>
    </View>
  )
}
