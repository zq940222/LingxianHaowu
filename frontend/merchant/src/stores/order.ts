import React, { useState, useEffect } from 'react'
import { orderApi } from '@/api'
import type { Order, OrderStatistics, OrderStatus } from '@/types'

// 订单状态
let orderState = {
  orders: [] as Order[],
  statistics: null as OrderStatistics | null,
  currentTab: 'all' as OrderStatus | 'all',
  loading: false,
  hasMore: true,
  page: 1,
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function setState(newState: Partial<typeof orderState>) {
  orderState = { ...orderState, ...newState }
  notifyListeners()
}

// 订单操作
const orderActions = {
  setCurrentTab: (tab: OrderStatus | 'all') => {
    setState({ currentTab: tab, orders: [], page: 1, hasMore: true })
  },

  fetchOrders: async (refresh = false) => {
    if (orderState.loading) return
    if (!refresh && !orderState.hasMore) return

    try {
      setState({ loading: true })

      const page = refresh ? 1 : orderState.page
      const params: any = { page, page_size: 20 }

      if (orderState.currentTab !== 'all') {
        params.status = orderState.currentTab
      }

      const result = await orderApi.getOrderList(params)

      setState({
        orders: refresh ? result.items : [...orderState.orders, ...result.items],
        page: page + 1,
        hasMore: result.page < result.total_pages,
      })
    } catch (error) {
      console.error('获取订单列表失败:', error)
    } finally {
      setState({ loading: false })
    }
  },

  fetchStatistics: async () => {
    try {
      const statistics = await orderApi.getOrderStatistics()
      setState({ statistics })
    } catch (error) {
      console.error('获取订单统计失败:', error)
    }
  },

  updateOrderInList: (updatedOrder: Order) => {
    const orders = orderState.orders.map((order) =>
      order.id === updatedOrder.id ? updatedOrder : order
    )
    setState({ orders })
  },

  removeOrderFromList: (orderId: number) => {
    const orders = orderState.orders.filter((order) => order.id !== orderId)
    setState({ orders })
  },

  confirmOrder: async (id: number) => {
    try {
      const order = await orderApi.confirmOrder(id)
      orderActions.updateOrderInList(order)
      orderActions.fetchStatistics()
      return true
    } catch (error) {
      console.error('确认订单失败:', error)
      return false
    }
  },

  startDelivery: async (id: number) => {
    try {
      const order = await orderApi.startDelivery(id)
      orderActions.updateOrderInList(order)
      orderActions.fetchStatistics()
      return true
    } catch (error) {
      console.error('开始配送失败:', error)
      return false
    }
  },

  completeDelivery: async (id: number) => {
    try {
      const order = await orderApi.completeDelivery(id)
      orderActions.updateOrderInList(order)
      orderActions.fetchStatistics()
      return true
    } catch (error) {
      console.error('完成配送失败:', error)
      return false
    }
  },

  confirmPickup: async (id: number) => {
    try {
      const order = await orderApi.confirmPickup(id)
      orderActions.updateOrderInList(order)
      orderActions.fetchStatistics()
      return true
    } catch (error) {
      console.error('确认自提失败:', error)
      return false
    }
  },
}

// Hook to use order store
export function useOrderStore() {
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    ...orderState,
    ...orderActions,
  }
}

// 直接导出状态和操作供非组件使用
export const getOrderState = () => orderState
export { orderActions }
