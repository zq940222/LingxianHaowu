import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import { ProductCard, EmptyState, Loading } from '@/components'
import { productApi } from '@/api'
import { PAGES } from '@/constants'
import type { Product, Category } from '@/types'
import './list.scss'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentCategory, setCurrentCategory] = useState<number | null>(null)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  useDidShow(() => {
    fetchCategories()
    fetchProducts(true)
  })

  usePullDownRefresh(async () => {
    await fetchProducts(true)
    Taro.stopPullDownRefresh()
  })

  useReachBottom(() => {
    if (hasMore && !loading) {
      fetchProducts(false)
    }
  })

  const fetchCategories = async () => {
    try {
      const data = await productApi.getCategoryList()
      setCategories(data)
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  const fetchProducts = async (refresh = false) => {
    if (loading) return
    if (!refresh && !hasMore) return

    setLoading(true)
    try {
      const currentPage = refresh ? 1 : page
      const params: any = {
        page: currentPage,
        page_size: 20,
      }

      if (currentCategory) {
        params.category_id = currentCategory
      }

      if (keyword.trim()) {
        params.keyword = keyword.trim()
      }

      const result = await productApi.getProductList(params)

      setProducts(refresh ? result.items : [...products, ...result.items])
      setPage(currentPage + 1)
      setHasMore(result.page < result.total_pages)
    } catch (error) {
      console.error('获取商品列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: number | null) => {
    setCurrentCategory(categoryId)
    setProducts([])
    setPage(1)
    setHasMore(true)
    setTimeout(() => fetchProducts(true), 0)
  }

  const handleSearch = () => {
    setProducts([])
    setPage(1)
    setHasMore(true)
    fetchProducts(true)
  }

  const handleToggleSale = async (product: Product, isOnSale: boolean) => {
    try {
      if (isOnSale) {
        await productApi.onSaleProduct(product.id)
        Taro.showToast({ title: '已上架', icon: 'success' })
      } else {
        await productApi.offSaleProduct(product.id)
        Taro.showToast({ title: '已下架', icon: 'success' })
      }

      // 更新本地状态
      setProducts(products.map((p) =>
        p.id === product.id ? { ...p, is_on_sale: isOnSale } : p
      ))
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const handleEdit = (product: Product) => {
    Taro.navigateTo({
      url: `${PAGES.PRODUCT_EDIT}?id=${product.id}`,
    })
  }

  const handleAddProduct = () => {
    Taro.navigateTo({
      url: PAGES.PRODUCT_EDIT,
    })
  }

  return (
    <View className='product-list'>
      {/* 搜索栏 */}
      <View className='product-list__search'>
        <View className='product-list__search-bar'>
          <Text className='product-list__search-icon'>🔍</Text>
          <Input
            className='product-list__search-input'
            placeholder='搜索商品名称'
            value={keyword}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
          />
        </View>
      </View>

      {/* 分类筛选 */}
      <View className='product-list__categories'>
        <ScrollView scrollX className='product-list__categories-scroll'>
          <View
            className={`product-list__category ${currentCategory === null ? 'product-list__category--active' : ''}`}
            onClick={() => handleCategoryChange(null)}
          >
            <Text className='product-list__category-text'>全部</Text>
          </View>
          {categories.map((category) => (
            <View
              key={category.id}
              className={`product-list__category ${currentCategory === category.id ? 'product-list__category--active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <Text className='product-list__category-text'>{category.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 商品列表 */}
      <ScrollView scrollY className='product-list__content'>
        {products.length === 0 && !loading ? (
          <EmptyState
            title='暂无商品'
            description='点击右下角添加商品'
            actionText='添加商品'
            onAction={handleAddProduct}
          />
        ) : (
          <View className='product-list__items'>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onToggleSale={handleToggleSale}
                onEdit={handleEdit}
              />
            ))}
            {loading && (
              <View className='product-list__loading'>
                <Loading text='加载中...' />
              </View>
            )}
            {!hasMore && products.length > 0 && (
              <View className='product-list__no-more'>
                <Text className='product-list__no-more-text'>— 没有更多了 —</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 添加按钮 */}
      <View className='product-list__add' onClick={handleAddProduct}>
        <Text className='product-list__add-icon'>+</Text>
      </View>
    </View>
  )
}
