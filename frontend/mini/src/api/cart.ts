import { get, post, put, del } from './request'
import type { CartItem } from '@/types'

/**
 * 获取购物车列表
 */
export function getCartList() {
  return get<CartItem[]>('/cart')
}

/**
 * 添加商品到购物车
 */
export function addToCart(data: {
  product_id: number
  quantity: number
  spec?: string
}) {
  return post<CartItem>('/cart', data)
}

/**
 * 更新购物车商品数量
 */
export function updateCartItem(id: number, quantity: number) {
  return put<CartItem>(`/cart/${id}`, { quantity })
}

/**
 * 删除购物车商品
 */
export function removeCartItem(id: number) {
  return del(`/cart/${id}`)
}

/**
 * 批量删除购物车商品
 */
export function removeCartItems(ids: number[]) {
  return del('/cart/batch', { showLoading: true })
}

/**
 * 清空购物车
 */
export function clearCart() {
  return del('/cart/clear')
}

/**
 * 更新商品选中状态
 */
export function updateCartItemSelected(id: number, selected: boolean) {
  return put(`/cart/${id}/selected`, { selected })
}

/**
 * 全选/取消全选
 */
export function updateCartAllSelected(selected: boolean) {
  return put('/cart/select-all', { selected })
}

/**
 * 获取购物车商品数量
 */
export function getCartCount() {
  return get<{ count: number }>('/cart/count')
}
