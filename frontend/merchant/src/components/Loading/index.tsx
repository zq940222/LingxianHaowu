import { View, Text } from '@tarojs/components'
import './index.scss'

interface LoadingProps {
  text?: string
  fullScreen?: boolean
}

export default function Loading({ text = '加载中...', fullScreen = false }: LoadingProps) {
  return (
    <View className={`loading ${fullScreen ? 'loading--fullscreen' : ''}`}>
      <View className='loading__spinner' />
      {text && <Text className='loading__text'>{text}</Text>}
    </View>
  )
}
