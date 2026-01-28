import React, { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/constants'
import { cartApi } from '@/api'
import type { CartItem, Product } from '@/types'

// 购物车状态
let cartState = {
  items: storage.get<CartItem[]>(STORAGE_KEYS.CART) || [],
  loading: false,
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function setState(newState: Partial<typeof cartState>) {
  cartState = { ...cartState, ...newState }
  notifyListeners()
}

// 计算属性
function getTotalCount() {
  return cartState.items.reduce((sum, item) => sum + item.quantity, 0)
}

function getSelectedCount() {
  return cartState.items
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.quantity, 0)
}

function getSelectedAmount() {
  return cartState.items
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
}

function getIsAllSelected() {
  const items = cartState.items
  return items.length > 0 && items.every((item) => item.selected)
}

function getSelectedItems() {
  return cartState.items.filter((item) => item.selected)
}

// 购物车操作
const cartActions = {
  fetchCart: async () => {
    try {
      setState({ loading: true })
      const items = await cartApi.getCartList()
      setState({ items })
      storage.set(STORAGE_KEYS.CART, items)
    } catch (error) {
      console.error('获取购物车失败:', error)
    } finally {
      setState({ loading: false })
    }
  },

  addToCart: async (product: Product, quantity: number, spec?: string) => {
    try {
      // 检查是否已存在
      const existingItem = cartState.items.find(
        (item) => item.product_id === product.id && item.spec === spec
      )

      if (existingItem) {
        // 更新数量
        await cartActions.updateQuantity(existingItem.id, existingItem.quantity + quantity)
      } else {
        // 添加新商品
        const newItem = await cartApi.addToCart({
          product_id: product.id,
          quantity,
          spec,
        })

        const items = [...cartState.items, { ...newItem, product, selected: true }]
        setState({ items })
        storage.set(STORAGE_KEYS.CART, items)
      }

      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      console.error('添加购物车失败:', error)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  },

  updateQuantity: async (id: number, quantity: number) => {
    if (quantity < 1) {
      await cartActions.removeItem(id)
      return
    }

    try {
      await cartApi.updateCartItem(id, quantity)

      const items = cartState.items.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
      setState({ items })
      storage.set(STORAGE_KEYS.CART, items)
    } catch (error) {
      console.error('更新数量失败:', error)
    }
  },

  removeItem: async (id: number) => {
    try {
      await cartApi.removeCartItem(id)

      const items = cartState.items.filter((item) => item.id !== id)
      setState({ items })
      storage.set(STORAGE_KEYS.CART, items)
    } catch (error) {
      console.error('删除失败:', error)
    }
  },

  toggleSelected: (id: number) => {
    const items = cartState.items.map((item) =>
      item.id === id ? { ...item, selected: !item.selected } : item
    )
    setState({ items })
    storage.set(STORAGE_KEYS.CART, items)
  },

  toggleAllSelected: () => {
    const allSelected = getIsAllSelected()
    const items = cartState.items.map((item) => ({
      ...item,
      selected: !allSelected,
    }))
    setState({ items })
    storage.set(STORAGE_KEYS.CART, items)
  },

  clearSelected: async () => {
    const selectedIds = cartState.items
      .filter((item) => item.selected)
      .map((item) => item.id)

    if (selectedIds.length === 0) return

    try {
      await cartApi.removeCartItems(selectedIds)

      const items = cartState.items.filter((item) => !item.selected)
      setState({ items })
      storage.set(STORAGE_KEYS.CART, items)
    } catch (error) {
      console.error('清除失败:', error)
    }
  },
}

// Hook to use cart store
export function useCartStore() {
  const [, forceUpdate] = useState({})

  // Subscribe to state changes
  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    ...cartState,
    ...cartActions,
    totalCount: getTotalCount,
    selectedCount: getSelectedCount,
    selectedAmount: getSelectedAmount,
    isAllSelected: getIsAllSelected,
    getSelectedItems,
  }
}

// 直接导出状态和操作供非组件使用
export const getCartState = () => cartState
export { cartActions }
