import React, { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { CouponCard, EmptyState } from '@/components'
import { activityApi } from '@/api'
import { usePagination } from '@/hooks/useRequest'
import type { UserCoupon, Coupon } from '@/types'
import './list.scss'

type TabType = 'unused' | 'used' | 'expired' | 'receive'

const TABS = [
  { label: '可使用', value: 'unused' },
  { label: '已使用', value: 'used' },
  { label: '已过期', value: 'expired' },
  { label: '领取中心', value: 'receive' },
]

export default function CouponList() {
  const [activeTab, setActiveTab] = useState<TabType>('unused')

  const {
    list: userCoupons,
    loading: userLoading,
    hasMore: userHasMore,
    run: loadUserCoupons,
    loadMore: loadMoreUserCoupons,
    refresh: refreshUserCoupons,
  } = usePagination(
    (params) =>
      activityApi.getUserCoupons({
        ...params,
        status: activeTab as 'unused' | 'used' | 'expired',
      }),
    { manual: true }
  )

  const {
    list: availableCoupons,
    loading: availableLoading,
    hasMore: availableHasMore,
    run: loadAvailableCoupons,
    loadMore: loadMoreAvailableCoupons,
    refresh: refreshAvailableCoupons,
  } = usePagination((params) => activityApi.getCouponList(params), { manual: true })

  useLoad(() => {
    handleTabChange('unused')
  })

  usePullDownRefresh(async () => {
    if (activeTab === 'receive') {
      await refreshAvailableCoupons()
    } else {
      await refreshUserCoupons()
    }
    Taro.stopPullDownRefresh()
  })

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'receive') {
      loadAvailableCoupons()
    } else {
      loadUserCoupons({ status: tab })
    }
  }

  const handleReceiveCoupon = async (coupon: Coupon) => {
    try {
      await activityApi.receiveCoupon(coupon.id)
      Taro.showToast({ title: '领取成功', icon: 'success' })
      refreshAvailableCoupons()
    } catch (error) {
      console.error('领取优惠券失败:', error)
    }
  }

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight } = e.detail
    if (scrollHeight - scrollTop < 1000) {
      if (activeTab === 'receive') {
        if (availableHasMore && !availableLoading) {
          loadMoreAvailableCoupons()
        }
      } else {
        if (userHasMore && !userLoading) {
          loadMoreUserCoupons()
        }
      }
    }
  }

  const loading = activeTab === 'receive' ? availableLoading : userLoading
  const hasMore = activeTab === 'receive' ? availableHasMore : userHasMore
  const list = activeTab === 'receive' ? availableCoupons : userCoupons

  return (
    <View className='coupon-list'>
      {/* Tab切换 */}
      <View className='coupon-list__tabs'>
        <ScrollView scrollX className='coupon-list__tabs-scroll'>
          {TABS.map((tab) => (
            <View
              key={tab.value}
              className={`coupon-list__tab ${activeTab === tab.value ? 'coupon-list__tab--active' : ''}`}
              onClick={() => handleTabChange(tab.value as TabType)}
            >
              <Text className='coupon-list__tab-text'>{tab.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 优惠券列表 */}
      <ScrollView
        scrollY
        className='coupon-list__content'
        onScroll={handleScroll}
      >
        {list.length === 0 && !loading ? (
          <EmptyState
            icon='coupon'
            title={activeTab === 'receive' ? '暂无可领取优惠券' : '暂无优惠券'}
            description={
              activeTab === 'receive'
                ? '稍后再来看看吧'
                : '快去领取优惠券吧'
            }
          />
        ) : (
          <View className='coupon-list__cards'>
            {activeTab === 'receive'
              ? (list as Coupon[]).map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    type='receive'
                    onReceive={() => handleReceiveCoupon(coupon)}
                  />
                ))
              : (list as UserCoupon[]).map((userCoupon) => (
                  <CouponCard
                    key={userCoupon.id}
                    coupon={userCoupon}
                    type={activeTab}
                  />
                ))}
          </View>
        )}

        {loading && (
          <View className='coupon-list__loading'>
            <Text className='coupon-list__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && list.length > 0 && (
          <View className='coupon-list__no-more'>
            <Text className='coupon-list__no-more-text'>— 没有更多了 —</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
