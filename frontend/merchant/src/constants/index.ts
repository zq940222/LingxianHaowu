// 存储键
export const STORAGE_KEYS = {
  TOKEN: 'merchant_token',
  MERCHANT_INFO: 'merchant_info',
  LAST_REFRESH: 'last_refresh',
} as const

// 页面路径
export const PAGES = {
  INDEX: '/pages/index/index',
  ORDER_LIST: '/pages/order/list',
  ORDER_DETAIL: '/pages/order/detail',
  PRODUCT_LIST: '/pages/product/list',
  PRODUCT_EDIT: '/pages/product/edit',
  STATISTICS: '/pages/statistics/index',
  MY: '/pages/my/index',
  SETTINGS: '/pages/my/settings',
} as const

// API基础地址
export const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8000/api/v1'
  : 'https://api.lingxianhaowu.com/api/v1'

// 订单状态映射
export const ORDER_STATUS_MAP: Record<string, { text: string; color: string }> = {
  pending_payment: { text: '待付款', color: '#faad14' },
  pending_confirm: { text: '待确认', color: '#ff4d4f' },
  pending_delivery: { text: '待配送', color: '#1890ff' },
  delivering: { text: '配送中', color: '#52c41a' },
  pending_pickup: { text: '待自提', color: '#722ed1' },
  completed: { text: '已完成', color: '#8c8c8c' },
  cancelled: { text: '已取消', color: '#bfbfbf' },
  refunding: { text: '退款中', color: '#eb2f96' },
  refunded: { text: '已退款', color: '#8c8c8c' },
}

// 订单Tab配置
export const ORDER_TABS = [
  { key: 'all', title: '全部' },
  { key: 'pending_confirm', title: '待确认' },
  { key: 'pending_delivery', title: '待配送' },
  { key: 'delivering', title: '配送中' },
  { key: 'completed', title: '已完成' },
] as const

// 默认图片
export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/200'
