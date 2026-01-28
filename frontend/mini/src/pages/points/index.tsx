import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { EmptyState, Loading } from '@/components'
import { userApi, activityApi } from '@/api'
import { useUserStore } from '@/stores'
import { usePagination } from '@/hooks/useRequest'
import { formatDate } from '@/utils/format'
import type { PointsRecord, PointRule, SignInRecord } from '@/types'
import './index.scss'

export default function PointsPage() {
  const { user, updatePoints } = useUserStore()
  const [signInStatus, setSignInStatus] = useState<{
    signed_today: boolean
    consecutive_days: number
    calendar: SignInRecord[]
  } | null>(null)
  const [rules, setRules] = useState<PointRule[]>([])
  const [signing, setSigning] = useState(false)
  const [activeTab, setActiveTab] = useState<'records' | 'rules'>('records')

  const {
    list: records,
    loading,
    hasMore,
    run: loadRecords,
    loadMore,
  } = usePagination((params) => userApi.getPointsRecords(params), { manual: true })

  useLoad(() => {
    fetchData()
  })

  usePullDownRefresh(async () => {
    await fetchData()
    Taro.stopPullDownRefresh()
  })

  const fetchData = async () => {
    try {
      const [statusRes, rulesRes] = await Promise.all([
        userApi.getSignInStatus().catch(() => null),
        activityApi.getPointRules().catch(() => []),
      ])
      setSignInStatus(statusRes)
      setRules(rulesRes)
      loadRecords()
    } catch (error) {
      console.error('加载积分数据失败:', error)
    }
  }

  const handleSignIn = async () => {
    if (signing || signInStatus?.signed_today) return

    try {
      setSigning(true)
      const res = await userApi.signIn()
      Taro.showToast({
        title: `签到成功，获得${res.points}积分`,
        icon: 'success',
      })
      updatePoints((user?.points || 0) + res.points)
      setSignInStatus((prev) =>
        prev
          ? {
              ...prev,
              signed_today: true,
              consecutive_days: res.consecutive_days,
            }
          : null
      )
      loadRecords()
    } catch (error) {
      console.error('签到失败:', error)
    } finally {
      setSigning(false)
    }
  }

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight } = e.detail
    if (scrollHeight - scrollTop < 1000 && hasMore && !loading) {
      loadMore()
    }
  }

  const getRecordTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      sign_in: '签到奖励',
      order: '订单奖励',
      redeem: '积分兑换',
      expired: '积分过期',
    }
    return typeMap[type] || type
  }

  return (
    <View className='points'>
      {/* 积分卡片 */}
      <View className='points__card'>
        <View className='points__card-header'>
          <Text className='points__card-label'>我的积分</Text>
          <View className='points__card-value'>
            <Text className='points__card-icon'>💎</Text>
            <Text className='points__card-number'>{user?.points || 0}</Text>
          </View>
        </View>

        <View className='points__sign-in'>
          <View className='points__sign-in-info'>
            <Text className='points__sign-in-days'>
              已连续签到 {signInStatus?.consecutive_days || 0} 天
            </Text>
            <Text className='points__sign-in-tip'>
              {signInStatus?.signed_today ? '今日已签到' : '每日签到获取积分'}
            </Text>
          </View>
          <View
            className={`points__sign-in-btn ${signInStatus?.signed_today ? 'points__sign-in-btn--disabled' : ''}`}
            onClick={handleSignIn}
          >
            <Text className='points__sign-in-btn-text'>
              {signing ? '签到中...' : signInStatus?.signed_today ? '已签到' : '签到'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab切换 */}
      <View className='points__tabs'>
        <View
          className={`points__tab ${activeTab === 'records' ? 'points__tab--active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <Text className='points__tab-text'>积分明细</Text>
        </View>
        <View
          className={`points__tab ${activeTab === 'rules' ? 'points__tab--active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Text className='points__tab-text'>积分规则</Text>
        </View>
      </View>

      {/* 内容区域 */}
      {activeTab === 'records' ? (
        <ScrollView
          scrollY
          className='points__content'
          onScroll={handleScroll}
        >
          {records.length === 0 && !loading ? (
            <EmptyState
              icon='points'
              title='暂无积分记录'
              description='签到、购物都可以获取积分'
            />
          ) : (
            <>
              {records.map((record) => (
                <View key={record.id} className='points__record'>
                  <View className='points__record-info'>
                    <Text className='points__record-type'>
                      {getRecordTypeText(record.type)}
                    </Text>
                    <Text className='points__record-desc'>{record.description}</Text>
                    <Text className='points__record-time'>
                      {formatDate(record.created_at, 'YYYY-MM-DD HH:mm')}
                    </Text>
                  </View>
                  <Text
                    className={`points__record-points ${record.points > 0 ? 'points__record-points--plus' : 'points__record-points--minus'}`}
                  >
                    {record.points > 0 ? '+' : ''}{record.points}
                  </Text>
                </View>
              ))}

              {loading && (
                <View className='points__loading'>
                  <Text className='points__loading-text'>加载中...</Text>
                </View>
              )}

              {!hasMore && records.length > 0 && (
                <View className='points__no-more'>
                  <Text className='points__no-more-text'>— 没有更多了 —</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView scrollY className='points__content'>
          {rules.length === 0 ? (
            <EmptyState icon='data' title='暂无积分规则' />
          ) : (
            <View className='points__rules'>
              {rules.map((rule) => (
                <View key={rule.id} className='points__rule'>
                  <View className='points__rule-info'>
                    <Text className='points__rule-type'>{rule.type}</Text>
                    <Text className='points__rule-desc'>{rule.description}</Text>
                  </View>
                  <Text className='points__rule-points'>+{rule.points}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}
