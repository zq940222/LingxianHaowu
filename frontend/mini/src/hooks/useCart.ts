import React, { useCallback } from 'react'
import Taro from '@tarojs/taro'
import { useCartStore } from '@/stores'
import { useAuth } from './useAuth'
import type { Product } from '@/types'
import { PAGES } from '@/constants'

/**
 * 购物车操作Hook
 */
export function useCart() {
  const { checkLogin } = useAuth()
  const {
    items,
    loading,
    totalCount,
    selectedCount,
    selectedAmount,
    isAllSelected,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    toggleSelected,
    toggleAllSelected,
    clearSelected,
    getSelectedItems,
  } = useCartStore()

  /**
   * 添加商品到购物车
   */
  const handleAddToCart = useCallback(
    async (product: Product, quantity = 1, spec?: string) => {
      if (!checkLogin()) return false

      await addToCart(product, quantity, spec)
      return true
    },
    [checkLogin, addToCart]
  )

  /**
   * 更新商品数量
   */
  const handleUpdateQuantity = useCallback(
    async (id: number, quantity: number) => {
      if (quantity < 1) {
        Taro.showModal({
          title: '提示',
          content: '确定要删除该商品吗？',
          success: (res) => {
            if (res.confirm) {
              removeItem(id)
            }
          },
        })
        return
      }
      await updateQuantity(id, quantity)
    },
    [updateQuantity, removeItem]
  )

  /**
   * 删除商品
   */
  const handleRemoveItem = useCallback(
    (id: number) => {
      Taro.showModal({
        title: '提示',
        content: '确定要删除该商品吗？',
        success: (res) => {
          if (res.confirm) {
            removeItem(id)
          }
        },
      })
    },
    [removeItem]
  )

  /**
   * 清空选中商品
   */
  const handleClearSelected = useCallback(() => {
    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      Taro.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }

    Taro.showModal({
      title: '提示',
      content: `确定要删除选中的${selectedItems.length}件商品吗？`,
      success: (res) => {
        if (res.confirm) {
          clearSelected()
        }
      },
    })
  }, [getSelectedItems, clearSelected])

  /**
   * 去结算
   */
  const handleCheckout = useCallback(() => {
    const selectedItems = getSelectedItems()
    if (selectedItems.length === 0) {
      Taro.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }

    Taro.navigateTo({ url: PAGES.ORDER_CONFIRM })
  }, [getSelectedItems])

  return {
    items,
    loading,
    totalCount: totalCount(),
    selectedCount: selectedCount(),
    selectedAmount: selectedAmount(),
    isAllSelected: isAllSelected(),
    selectedItems: getSelectedItems(),
    fetchCart,
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    toggleSelected,
    toggleAllSelected,
    clearSelected: handleClearSelected,
    checkout: handleCheckout,
  }
}
