import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { StatCard, Loading } from '@/components'
import { statisticsApi } from '@/api'
import { priceToYuan, formatAmount } from '@/utils/format'
import type { SalesStatistics, DailyStatistics } from '@/types'
import './index.scss'

export default function Statistics() {
  const [loading, setLoading] = useState(true)
  const [salesStats, setSalesStats] = useState<SalesStatistics | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStatistics[]>([])
  const [hotProducts, setHotProducts] = useState<any[]>([])
  const [dateRange, setDateRange] = useState('week')

  useLoad(() => {
    fetchData()
  })

  usePullDownRefresh(async () => {
    await fetchData()
    Taro.stopPullDownRefresh()
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sales, hot] = await Promise.all([
        statisticsApi.getTodayStatistics(),
        statisticsApi.getHotProducts({ limit: 10 }),
      ])
      setSalesStats(sales)
      setHotProducts(hot)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading fullScreen text='加载中...' />
  }

  return (
    <View className='statistics'>
      <ScrollView scrollY className='statistics__scroll'>
        {/* 今日数据 */}
        <View className='statistics__section'>
          <Text className='statistics__section-title'>今日数据</Text>
          <View className='statistics__today'>
            <View className='statistics__today-item'>
              <Text className='statistics__today-value'>
                {salesStats?.today_order_count || 0}
              </Text>
              <Text className='statistics__today-label'>订单数</Text>
            </View>
            <View className='statistics__today-divider' />
            <View className='statistics__today-item'>
              <Text className='statistics__today-value statistics__today-value--amount'>
                {priceToYuan(salesStats?.today_amount || 0).toFixed(2)}
              </Text>
              <Text className='statistics__today-label'>营业额(元)</Text>
            </View>
          </View>
        </View>

        {/* 数据对比 */}
        <View className='statistics__section'>
          <Text className='statistics__section-title'>数据对比</Text>
          <View className='statistics__compare'>
            <View className='statistics__compare-item'>
              <View className='statistics__compare-header'>
                <Text className='statistics__compare-title'>昨日</Text>
              </View>
              <View className='statistics__compare-data'>
                <View className='statistics__compare-row'>
                  <Text className='statistics__compare-label'>订单数</Text>
                  <Text className='statistics__compare-value'>
                    {salesStats?.yesterday_order_count || 0}
                  </Text>
                </View>
                <View className='statistics__compare-row'>
                  <Text className='statistics__compare-label'>营业额</Text>
                  <Text className='statistics__compare-value'>
                    ¥{priceToYuan(salesStats?.yesterday_amount || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <View className='statistics__compare-item'>
              <View className='statistics__compare-header'>
                <Text className='statistics__compare-title'>本周</Text>
              </View>
              <View className='statistics__compare-data'>
                <View className='statistics__compare-row'>
                  <Text className='statistics__compare-label'>订单数</Text>
                  <Text className='statistics__compare-value'>
                    {salesStats?.week_order_count || 0}
                  </Text>
                </View>
                <View className='statistics__compare-row'>
                  <Text className='statistics__compare-label'>营业额</Text>
                  <Text className='statistics__compare-value'>
                    ¥{priceToYuan(salesStats?.week_amount || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <View className='statistics__compare-item'>
              <View className='statistics__compare-header'>
                <Text className='statistics__compare-title'>本月</Text>
              </View>
              <View className='statistics__compare-data'>
                <View className='statistics__compare-row'>
                  <Text className='statistics__compare-label'>订单数</Text>
                  <Text className='statistics__compare-value'>
                    {salesStats?.month_order_count || 0}
                  </Text>
                </View>
                <View className='statistics__compare-row'>
                  <Text className='statistics__compare-label'>营业额</Text>
                  <Text className='statistics__compare-value'>
                    ¥{priceToYuan(salesStats?.month_amount || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 热销商品 */}
        <View className='statistics__section'>
          <Text className='statistics__section-title'>热销商品 TOP10</Text>
          <View className='statistics__hot-list'>
            {hotProducts.length === 0 ? (
              <View className='statistics__empty'>
                <Text className='statistics__empty-text'>暂无数据</Text>
              </View>
            ) : (
              hotProducts.map((product, index) => (
                <View key={product.id} className='statistics__hot-item'>
                  <View className={`statistics__hot-rank statistics__hot-rank--${index + 1}`}>
                    <Text className='statistics__hot-rank-text'>{index + 1}</Text>
                  </View>
                  <View className='statistics__hot-info'>
                    <Text className='statistics__hot-name'>{product.name}</Text>
                    <Text className='statistics__hot-sales'>
                      销量: {product.sales} | 销售额: ¥{priceToYuan(product.amount).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
