import React, { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { ProductCard } from '@/components'
import { productApi } from '@/api'
import { useCart } from '@/hooks'
import { usePagination } from '@/hooks/useRequest'
import { PAGES, PLACEHOLDER_IMAGE } from '@/constants'
import type { Product, Category } from '@/types'
import './index.scss'

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  const { addToCart } = useCart()

  const {
    list: products,
    loading,
    hasMore,
    run: loadProducts,
    loadMore,
  } = usePagination(
    (params) => productApi.getProductList({ ...params, category_id: activeCategory || undefined }),
    { manual: true }
  )

  useLoad(() => {
    fetchCategories()
  })

  const fetchCategories = async () => {
    try {
      const res = await productApi.getCategoryList()
      setCategories(res)
      if (res.length > 0) {
        setActiveCategory(res[0].id)
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  useEffect(() => {
    if (activeCategory) {
      loadProducts({ category_id: activeCategory })
    }
  }, [activeCategory])

  const handleCategoryClick = (category: Category) => {
    setActiveCategory(category.id)
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
  }

  const handleProductClick = (product: Product) => {
    Taro.navigateTo({
      url: `${PAGES.PRODUCT_DETAIL}?id=${product.id}`,
    })
  }

  const handleScroll = (e: any) => {
    const { scrollTop, scrollHeight } = e.detail
    if (scrollHeight - scrollTop < 1000 && hasMore && !loading) {
      loadMore()
    }
  }

  return (
    <View className='category'>
      {/* 左侧分类列表 */}
      <ScrollView scrollY className='category__sidebar'>
        {categories.map((category) => (
          <View
            key={category.id}
            className={`category__sidebar-item ${activeCategory === category.id ? 'category__sidebar-item--active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            <Text className='category__sidebar-text'>{category.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 右侧商品列表 */}
      <ScrollView
        scrollY
        className='category__content'
        onScroll={handleScroll}
      >
        {/* 分类标题 */}
        {activeCategory && (
          <View className='category__header'>
            {categories.find((c) => c.id === activeCategory) && (
              <>
                <Image
                  className='category__header-icon'
                  src={categories.find((c) => c.id === activeCategory)?.icon || PLACEHOLDER_IMAGE}
                  mode='aspectFill'
                />
                <Text className='category__header-title'>
                  {categories.find((c) => c.id === activeCategory)?.name}
                </Text>
              </>
            )}
          </View>
        )}

        {/* 商品网格 */}
        <View className='category__products'>
          {products.map((product) => (
            <View key={product.id} className='category__product-item'>
              <ProductCard
                product={product}
                mode='grid'
                onAddCart={handleAddToCart}
              />
            </View>
          ))}
        </View>

        {loading && (
          <View className='category__loading'>
            <Text className='category__loading-text'>加载中...</Text>
          </View>
        )}

        {!hasMore && products.length > 0 && (
          <View className='category__no-more'>
            <Text className='category__no-more-text'>— 没有更多了 —</Text>
          </View>
        )}

        {!loading && products.length === 0 && (
          <View className='category__empty'>
            <Text className='category__empty-text'>该分类暂无商品</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
