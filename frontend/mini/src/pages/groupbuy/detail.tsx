import React, { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useLoad, useRouter, useShareAppMessage } from '@tarojs/taro'
import { Loading } from '@/components'
import { activityApi } from '@/api'
import { useAuth } from '@/hooks'
import { formatPriceYuan, formatCountdown, formatDate } from '@/utils/format'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import type { GroupBuy } from '@/types'
import './detail.scss'

export default function GroupBuyDetail() {
  const router = useRouter()
  const { id } = router.params

  const [groupBuy, setGroupBuy] = useState<GroupBuy | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const [joining, setJoining] = useState(false)

  const { checkLogin } = useAuth()

  useLoad(() => {
    if (id) {
      fetchGroupBuy(Number(id))
    }
  })

  useShareAppMessage(() => ({
    title: groupBuy ? `${groupBuy.product.name} 仅需¥${groupBuy.group_price}` : '超值拼团',
    path: `${PAGES.GROUPBUY_DETAIL}?id=${id}`,
    imageUrl: groupBuy?.product.cover_image,
  }))

  useEffect(() => {
    if (groupBuy && groupBuy.status === 'ongoing') {
      const endTime = new Date(groupBuy.end_time).getTime()
      const updateCountdown = () => {
        const now = Date.now()
        const diff = Math.max(0, Math.floor((endTime - now) / 1000))
        setCountdown(diff)
        if (diff === 0) {
          fetchGroupBuy(Number(id))
        }
      }
      updateCountdown()
      const timer = setInterval(updateCountdown, 1000)
      return () => clearInterval(timer)
    }
  }, [groupBuy])

  const fetchGroupBuy = async (groupBuyId: number) => {
    try {
      setLoading(true)
      const res = await activityApi.getGroupBuyDetail(groupBuyId)
      setGroupBuy(res)
    } catch (error) {
      console.error('获取拼团详情失败:', error)
      Taro.showToast({ title: '拼团不存在', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroupBuy = async () => {
    if (!groupBuy || joining) return
    if (!checkLogin()) return

    try {
      setJoining(true)
      await activityApi.joinGroupBuy(groupBuy.id)
      Taro.showToast({ title: '参团成功', icon: 'success' })
      fetchGroupBuy(groupBuy.id)
    } catch (error) {
      console.error('参与拼团失败:', error)
    } finally {
      setJoining(false)
    }
  }

  const handleCreateGroupBuy = async () => {
    if (!groupBuy) return
    if (!checkLogin()) return

    try {
      const res = await activityApi.createGroupBuy(groupBuy.product_id)
      Taro.showToast({ title: '发起拼团成功', icon: 'success' })
      Taro.redirectTo({ url: `${PAGES.GROUPBUY_DETAIL}?id=${res.id}` })
    } catch (error) {
      console.error('发起拼团失败:', error)
    }
  }

  const handleShare = () => {
    // 触发分享
  }

  const handleViewProduct = () => {
    if (!groupBuy) return
    Taro.navigateTo({
      url: `${PAGES.PRODUCT_DETAIL}?id=${groupBuy.product_id}`,
    })
  }

  if (loading) {
    return <Loading fullscreen />
  }

  if (!groupBuy) {
    return (
      <View className='groupbuy-detail__empty'>
        <Text>拼团不存在</Text>
      </View>
    )
  }

  const remainingSlots = groupBuy.group_size - groupBuy.current_size
  const isOngoing = groupBuy.status === 'ongoing'
  const isSuccess = groupBuy.status === 'success'
  const isFailed = groupBuy.status === 'failed'

  return (
    <View className='groupbuy-detail'>
      {/* 拼团状态 */}
      <View
        className={`groupbuy-detail__status groupbuy-detail__status--${groupBuy.status}`}
      >
        {isOngoing && (
          <>
            <View className='groupbuy-detail__progress'>
              <Text className='groupbuy-detail__progress-text'>
                还差 <Text className='groupbuy-detail__progress-num'>{remainingSlots}</Text> 人成团
              </Text>
            </View>
            <Text className='groupbuy-detail__countdown'>
              剩余 {formatCountdown(countdown)}
            </Text>
          </>
        )}
        {isSuccess && (
          <Text className='groupbuy-detail__status-text'>拼团成功</Text>
        )}
        {isFailed && (
          <Text className='groupbuy-detail__status-text'>拼团失败</Text>
        )}
      </View>

      {/* 参团成员 */}
      <View className='groupbuy-detail__members'>
        <View className='groupbuy-detail__members-header'>
          <Text className='groupbuy-detail__members-title'>参团成员</Text>
          <Text className='groupbuy-detail__members-count'>
            {groupBuy.current_size}/{groupBuy.group_size}人
          </Text>
        </View>
        <View className='groupbuy-detail__members-list'>
          {groupBuy.members.map((member) => (
            <View key={member.id} className='groupbuy-detail__member'>
              <Image
                className='groupbuy-detail__member-avatar'
                src={member.user.avatar || PLACEHOLDER_IMAGE}
                mode='aspectFill'
              />
              <Text className='groupbuy-detail__member-name'>
                {member.user.nickname}
              </Text>
            </View>
          ))}
          {Array.from({ length: remainingSlots }).map((_, index) => (
            <View key={`empty-${index}`} className='groupbuy-detail__member groupbuy-detail__member--empty'>
              <View className='groupbuy-detail__member-placeholder'>
                <Text className='groupbuy-detail__member-placeholder-text'>?</Text>
              </View>
              <Text className='groupbuy-detail__member-name'>待加入</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 商品信息 */}
      <View className='groupbuy-detail__product' onClick={handleViewProduct}>
        <Image
          className='groupbuy-detail__product-image'
          src={groupBuy.product.cover_image || PLACEHOLDER_IMAGE}
          mode='aspectFill'
        />
        <View className='groupbuy-detail__product-content'>
          <Text className='groupbuy-detail__product-name'>
            {groupBuy.product.name}
          </Text>
          <View className='groupbuy-detail__product-prices'>
            <View className='groupbuy-detail__product-group-price'>
              <Text className='groupbuy-detail__product-group-label'>拼团价</Text>
              <Text className='groupbuy-detail__product-group-value'>
                {formatPriceYuan(groupBuy.group_price)}
              </Text>
            </View>
            <Text className='groupbuy-detail__product-original-price'>
              原价 {formatPriceYuan(groupBuy.product.price)}
            </Text>
          </View>
        </View>
        <Text className='groupbuy-detail__product-arrow'>›</Text>
      </View>

      {/* 拼团规则 */}
      <View className='groupbuy-detail__rules'>
        <View className='groupbuy-detail__rules-header'>
          <Text className='groupbuy-detail__rules-title'>拼团规则</Text>
        </View>
        <View className='groupbuy-detail__rules-content'>
          <View className='groupbuy-detail__rule'>
            <Text className='groupbuy-detail__rule-num'>1</Text>
            <Text className='groupbuy-detail__rule-text'>邀请好友参团，人数达到即可成团</Text>
          </View>
          <View className='groupbuy-detail__rule'>
            <Text className='groupbuy-detail__rule-num'>2</Text>
            <Text className='groupbuy-detail__rule-text'>拼团成功后，系统自动按拼团价下单</Text>
          </View>
          <View className='groupbuy-detail__rule'>
            <Text className='groupbuy-detail__rule-num'>3</Text>
            <Text className='groupbuy-detail__rule-text'>拼团时间截止未成团，自动退款</Text>
          </View>
        </View>
      </View>

      {/* 底部操作栏 */}
      {isOngoing && (
        <View className='groupbuy-detail__footer'>
          <View
            className='groupbuy-detail__footer-btn groupbuy-detail__footer-btn--share'
            onClick={handleShare}
          >
            <Text className='groupbuy-detail__footer-btn-text'>邀请好友</Text>
          </View>
          <View
            className={`groupbuy-detail__footer-btn groupbuy-detail__footer-btn--join ${joining ? 'groupbuy-detail__footer-btn--disabled' : ''}`}
            onClick={handleJoinGroupBuy}
          >
            <Text className='groupbuy-detail__footer-btn-text'>
              {joining ? '参团中...' : '一键参团'}
            </Text>
          </View>
        </View>
      )}

      {(isSuccess || isFailed) && (
        <View className='groupbuy-detail__footer'>
          <View
            className='groupbuy-detail__footer-btn groupbuy-detail__footer-btn--new'
            onClick={handleCreateGroupBuy}
          >
            <Text className='groupbuy-detail__footer-btn-text'>发起新拼团</Text>
          </View>
        </View>
      )}
    </View>
  )
}
