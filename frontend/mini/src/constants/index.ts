// API基础配置
export const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:8000/api/v1'
  : 'https://api.lingxianhaowu.com/api/v1'

// 存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'user_info',
  CART: 'cart',
  SEARCH_HISTORY: 'search_history',
  SELECTED_ADDRESS: 'selected_address',
  DELIVERY_ZONE: 'delivery_zone',
} as const

// 订单状态映射
export const ORDER_STATUS_MAP: Record<string, { text: string; color: string }> = {
  pending_payment: { text: '待付款', color: '#FA5151' },
  pending_delivery: { text: '待配送', color: '#FA9D3B' },
  delivering: { text: '配送中', color: '#07C160' },
  pending_pickup: { text: '待自提', color: '#FA9D3B' },
  completed: { text: '已完成', color: '#07C160' },
  cancelled: { text: '已取消', color: '#999999' },
  refunding: { text: '退款中', color: '#FA5151' },
  refunded: { text: '已退款', color: '#999999' },
}

// 订单状态TabBar筛选
export const ORDER_STATUS_TABS = [
  { label: '全部', value: '' },
  { label: '待付款', value: 'pending_payment' },
  // 后端已将 paid/preparing/ready 聚合到 pending_delivery
  { label: '待配送', value: 'pending_delivery' },
  { label: '配送中', value: 'delivering' },
  { label: '已完成', value: 'completed' },
]

// 配送方式
export const DELIVERY_TYPES = {
  delivery: '送货上门',
  pickup: '到店自提',
} as const

// 优惠券类型
export const COUPON_TYPE_MAP = {
  fixed: '满减券',
  percent: '折扣券',
} as const

// 积分规则类型
export const POINT_RULE_TYPES = {
  sign_in: '每日签到',
  consecutive_7: '连续签到7天',
  consecutive_30: '连续签到30天',
  order_complete: '完成订单',
  first_order: '首单奖励',
} as const

// 页面路径
export const PAGES = {
  INDEX: '/pages/index/index',
  CATEGORY: '/pages/category/index',
  PRODUCT_LIST: '/pages/product/list',
  PRODUCT_DETAIL: '/pages/product/detail',
  CART: '/pages/cart/index',
  ORDER_CONFIRM: '/pages/order/confirm',
  ORDER_RESULT: '/pages/order/result',
  ORDER_LIST: '/pages/order/list',
  ORDER_DETAIL: '/pages/order/detail',
  MY: '/pages/my/index',
  LOGIN: '/pages/login/index',
  ADDRESS_LIST: '/pages/address/list',
  ADDRESS_EDIT: '/pages/address/edit',
  POINTS: '/pages/points/index',
  COUPON_LIST: '/pages/coupon/list',
  GROUPBUY_DETAIL: '/pages/groupbuy/detail',
} as const

// 分页配置
export const PAGINATION = {
  PAGE_SIZE: 20,
  INITIAL_PAGE: 1,
} as const

// 图片占位符
export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300?text=暂无图片'

// 商品标签颜色
export const PRODUCT_TAG_COLORS = {
  recommended: '#FF6B35',
  hot: '#FA5151',
  groupbuy: '#07C160',
} as const
