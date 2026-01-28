// 商家信息
export interface Merchant {
  id: number
  name: string
  phone: string
  avatar?: string
  store_name: string
  store_address: string
  business_license?: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
}

// 商品
export interface Product {
  id: number
  name: string
  description: string
  price: number
  original_price: number
  cover_image: string
  images: string[]
  category_id: number
  category_name?: string
  stock: number
  sales: number
  unit: string
  specs?: ProductSpec[]
  is_on_sale: boolean
  is_hot: boolean
  is_recommended: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductSpec {
  id: number
  name: string
  price: number
  stock: number
}

// 分类
export interface Category {
  id: number
  name: string
  icon?: string
  sort_order: number
  product_count?: number
}

// 订单
export interface Order {
  id: number
  order_no: string
  user_id: number
  user_name?: string
  user_phone?: string
  status: OrderStatus
  total_amount: number
  discount_amount: number
  delivery_fee: number
  pay_amount: number
  payment_method?: string
  payment_time?: string
  items: OrderItem[]
  address: OrderAddress
  delivery_type: 'delivery' | 'pickup'
  delivery_time?: string
  pickup_point?: string
  remark?: string
  created_at: string
  updated_at: string
}

export type OrderStatus =
  | 'pending_payment'
  | 'pending_confirm'
  | 'pending_delivery'
  | 'delivering'
  | 'pending_pickup'
  | 'completed'
  | 'cancelled'
  | 'refunding'
  | 'refunded'

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_image: string
  spec?: string
  price: number
  quantity: number
}

export interface OrderAddress {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  full_address: string
}

// 统计数据
export interface DailyStatistics {
  date: string
  order_count: number
  total_amount: number
  completed_count: number
  cancelled_count: number
  new_users: number
}

export interface OrderStatistics {
  pending_confirm: number
  pending_delivery: number
  delivering: number
  pending_pickup: number
  refunding: number
}

export interface SalesStatistics {
  today_amount: number
  today_order_count: number
  yesterday_amount: number
  yesterday_order_count: number
  week_amount: number
  week_order_count: number
  month_amount: number
  month_order_count: number
}

// 配送区域
export interface DeliveryZone {
  id: number
  name: string
  address: string
  delivery_fee: number
  min_order_amount: number
  is_active: boolean
}

// 自提点
export interface PickupPoint {
  id: number
  name: string
  address: string
  phone: string
  business_hours: string
  is_active: boolean
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}
