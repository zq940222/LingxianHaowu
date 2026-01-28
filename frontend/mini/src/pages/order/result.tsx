import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { PAGES } from '@/constants'
import './result.scss'

export default function OrderResult() {
  const router = useRouter()
  const { status, orderId } = router.params

  const isSuccess = status === 'success'

  const handleViewOrder = () => {
    Taro.redirectTo({
      url: `${PAGES.ORDER_DETAIL}?id=${orderId}`,
    })
  }

  const handleGoHome = () => {
    Taro.switchTab({ url: PAGES.INDEX })
  }

  const handleRetryPay = () => {
    Taro.redirectTo({
      url: `${PAGES.ORDER_DETAIL}?id=${orderId}`,
    })
  }

  return (
    <View className='order-result'>
      <View className='order-result__icon'>
        <Text className='order-result__icon-text'>
          {isSuccess ? '✓' : '!'}
        </Text>
      </View>

      <Text className='order-result__title'>
        {isSuccess ? '支付成功' : '支付失败'}
      </Text>

      <Text className='order-result__desc'>
        {isSuccess
          ? '您的订单已支付成功，我们会尽快安排配送'
          : '支付未完成，您可以重新支付或查看订单详情'}
      </Text>

      <View className='order-result__actions'>
        {isSuccess ? (
          <>
            <View
              className='order-result__btn order-result__btn--primary'
              onClick={handleViewOrder}
            >
              <Text className='order-result__btn-text'>查看订单</Text>
            </View>
            <View
              className='order-result__btn order-result__btn--secondary'
              onClick={handleGoHome}
            >
              <Text className='order-result__btn-text'>返回首页</Text>
            </View>
          </>
        ) : (
          <>
            <View
              className='order-result__btn order-result__btn--primary'
              onClick={handleRetryPay}
            >
              <Text className='order-result__btn-text'>重新支付</Text>
            </View>
            <View
              className='order-result__btn order-result__btn--secondary'
              onClick={handleGoHome}
            >
              <Text className='order-result__btn-text'>返回首页</Text>
            </View>
          </>
        )}
      </View>
    </View>
  )
}
