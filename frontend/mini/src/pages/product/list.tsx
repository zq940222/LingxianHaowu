import React, { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { ProductCard, EmptyState } from '@/components'
import { productApi } from '@/api'
import { useCart } from '@/hooks'
import { usePagination } from '@/hooks/useRequest'
import { useAppStore } from '@/stores'
import type { Product } from '@/types'
import './list.scss'

type SortType = 'default' | 'sales' | 'price_asc' | 'price_desc'

const SORT_OPTIONS = [
  { label: '综合', value: 'default' },
  { label: '销量', value: 'sales' },
  { label: '价格↑', value: 'price_asc' },
  { label: '价格↓', value: 'price_desc' },
]

export default function ProductList() {
  const router = useRouter()
  const { keyword: initKeyword, categoryId, categoryName, type } = router.params

  const [keyword, setKeyword] = useState(initKeyword || '')
  const [sortType, setSortType] = useState<SortType>('default')
  const [listMode, setListMode] = useState<'grid' | 'list'>('grid')

  const { addToCart } = useCart()
  const { addSearchHistory } = useAppStore()

  const {
    list: products,
    loading,
    hasMore,
    run: loadProducts,
    loadMore,
  } = usePagination(
    (params) => {
      const baseParams = {
        ...params,
        keyword: keyword || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        sort: sortType !== 'default' ? sortType : undefined,
        is_hot: type === 'hot' ? true : undefined,
        is_group_buy: type === 'groupbuy' ? true : undefined,
      }
      return productApi.getProductList(baseParams)
    },
    { manual: true }
  )

  useLoad(() => {
    // 设置页面标题
    if (categoryName) {
      Taro.setNavigationBarTitle({ title: decodeURIComponent(categoryName) })
    } else if (type === 'hot') {
      Taro.setNavigationBarTitle({ title: '热卖商品' })
    } else if (type === 'groupbuy') {
      Taro.setNavigationBarTitle({ title: '拼团商品' })
    }

    loadProducts()
  })

  useEffect(() => {
    loadProducts()
  }, [sortType])

  const handleSearch = () => {
    if (!keyword.trim()) return
    addSearchHistory(keyword)
    loadProducts()
  }

  const handleSortChange = (sort: SortType) => {
    setSortType(sort)
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
  }

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight } = e.detail
    if (scrollHeight - scrollTop < 1000 && hasMore && !loading) {
      loadMore()
    }
  }

  return (
    <View className='product-list'>
      {/* 搜索栏 */}
      <View className='product-list__search'>
        <View className='product-list__search-bar'>
          <Text className='product-list__search-icon'>🔍</Text>
          <Input
            className='product-list__search-input'
            placeholder='搜索商品'
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      {/* 筛选排序栏 */}
      <View className='product-list__filter'>
        <View className='product-list__sort'>
          {SORT_OPTIONS.map((option) => (
            <View
              key={option.value}
              className={`product-list__sort-item ${sortType === option.value ? 'product-list__sort-item--active' : ''}`}
              onClick={() => handleSortChange(option.value as SortType)}
            >
              <Text className='product-list__sort-text'>{option.label}</Text>
            </View>
          ))}
        </View>
        <View className='product-list__mode'>
          <View
            className={`product-list__mode-item ${listMode === 'grid' ? 'product-list__mode-item--active' : ''}`}
            onClick={() => setListMode('grid')}
          >
            <Text className='product-list__mode-icon'>⊞</Text>
          </View>
          <View
            className={`product-list__mode-item ${listMode === 'list' ? 'product-list__mode-item--active' : ''}`}
            onClick={() => setListMode('list')}
          >
            <Text className='product-list__mode-icon'>≡</Text>
          </View>
        </View>
      </View>

      {/* 商品列表 */}
      <ScrollView
        scrollY
        className='product-list__content'
        onScroll={handleScroll}
      >
        {products.length === 0 && !loading ? (
          <EmptyState
            icon='search'
            title='暂无商品'
            description='换个关键词试试吧'
          />
        ) : (
          <View className={`product-list__products product-list__products--${listMode}`}>
            {products.map((product) => (
              <View
                key={product.id}
                className={`product-list__product-item product-list__product-item--${listMode}`}
              >
                <ProductCard
                  product={product}
                  mode={listMode}
                  onAddCart={handleAddToCart}
                />
              </View>
            ))}
          </View>
        )}

        {loading && (
          <View className='product-list__loading'>
            <Text className='product-list__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && products.length > 0 && (
          <View className='product-list__no-more'>
            <Text className='product-list__no-more-text'>— 没有更多了 —</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
