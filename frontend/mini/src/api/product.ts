import { get } from './request'
import type { Product, ProductDetail, Category, PaginatedData } from '@/types'

/**
 * 获取分类列表
 */
export function getCategoryList() {
  return get<Category[]>('/products/categories')
}

/**
 * 获取商品列表
 */
export function getProductList(params: {
  page?: number
  page_size?: number
  category_id?: number
  keyword?: string
  sort?: 'sales' | 'price_asc' | 'price_desc' | 'newest'
  is_recommended?: boolean
  is_hot?: boolean
  is_group_buy?: boolean
}) {
  return get<PaginatedData<Product>>('/products', params)
}

/**
 * 获取商品详情
 */
export function getProductDetail(id: number) {
  return get<ProductDetail>(`/products/${id}`)
}

/**
 * 获取推荐商品
 */
export function getRecommendedProducts(params?: { page?: number; page_size?: number }) {
  return get<PaginatedData<Product>>('/products/recommended', params)
}

/**
 * 获取热卖商品
 */
export function getHotProducts(params?: { page?: number; page_size?: number }) {
  return get<PaginatedData<Product>>('/products/hot', params)
}

/**
 * 获取拼团商品
 */
export function getGroupBuyProducts(params?: { page?: number; page_size?: number }) {
  return get<PaginatedData<Product>>('/products/group-buy', params)
}

/**
 * 搜索商品
 */
export function searchProducts(keyword: string, params?: {
  page?: number
  page_size?: number
  sort?: 'sales' | 'price_asc' | 'price_desc' | 'newest'
}) {
  return get<PaginatedData<Product>>('/products/search', { keyword, ...params })
}

/**
 * 获取首页Banner
 */
export function getHomeBanners() {
  return get<{ id: number; image: string; link?: string }[]>('/home/banners')
}

/**
 * 获取首页分类快捷入口
 */
export function getHomeCategoryShortcuts() {
  return get<{ id: number; name: string; icon: string }[]>('/home/category-shortcuts')
}
