import React, { useMemo } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useAuth } from '@/hooks'
import { PAGES } from '@/constants'
import './index.scss'

function safeDecode(value?: string) {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default function LoginPage() {
  const { login, loading } = useAuth()
  const router = useRouter()

  const redirectTo = useMemo(() => {
    // e.g. /pages/order/confirm?x=1
    const raw = (router?.params as any)?.redirectTo as string | undefined
    return safeDecode(raw)
  }, [router?.params])

  const handleLogin = async () => {
    const ok = await login()
    if (!ok) {
      Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
      return
    }

    // 1) 有回跳地址 → redirect
    if (redirectTo) {
      // 这里优先用 redirectTo，避免用户返回登录页
      Taro.redirectTo({ url: redirectTo })
      return
    }

    // 2) 默认回“我的”页
    Taro.switchTab({ url: PAGES.MY })
  }

  return (
    <View className='login'>
      <View className='login__card'>
        <Text className='login__title'>欢迎使用灵鲜好物</Text>
        <Text className='login__desc'>登录后可管理订单、地址、优惠券与积分</Text>

        <Button
          className='login__btn'
          onClick={handleLogin}
          loading={loading}
        >
          微信一键登录
        </Button>

        <Text className='login__tip'>登录即代表你同意相关服务条款与隐私政策</Text>
      </View>
    </View>
  )
}
