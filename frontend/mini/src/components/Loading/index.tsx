import { View, Text } from '@tarojs/components'
import './index.scss'

interface LoadingProps {
  visible?: boolean
  text?: string
  fullscreen?: boolean
}

export default function Loading({
  visible = true,
  text = '加载中...',
  fullscreen = false,
}: LoadingProps) {
  if (!visible) return null

  return (
    <View className={`loading ${fullscreen ? 'loading--fullscreen' : ''}`}>
      <View className='loading__spinner'>
        <View className='loading__spinner-item' />
        <View className='loading__spinner-item' />
        <View className='loading__spinner-item' />
      </View>
      {text && <Text className='loading__text'>{text}</Text>}
    </View>
  )
}
