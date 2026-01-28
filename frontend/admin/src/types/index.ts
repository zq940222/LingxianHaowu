// 管理员
export interface Admin {
  id: number
  username: string
  name: string
  avatar?: string
  role: 'super_admin' | 'admin' | 'operator'
  status: 'active' | 'inactive'
  created_at: string
}

// 用户
export interface User {
  id: number
  openid: string
  nickname: string
  avatar?: string
  phone?: string
  points: number
  total_orders: number
  total_amount: number
  status: 'active' | 'banned'
  created_at: string
  last_login_at?: string
}

// 商品
export interface Product {
  id: number
  name: string
  description?: string
  price: number
  original_price?: number
  cover_image?: string
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
  group_buy_price?: number
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
  is_active: boolean
  created_at: string
}

// 订单
export interface Order {
  id: number
  order_no: string
  user_id: number
  user?: User
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
  product_image?: string
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

// 活动
export interface Activity {
  id: number
  title: string
  type: 'popup' | 'banner' | 'groupbuy'
  image: string
  link?: string
  start_time: string
  end_time: string
  is_active: boolean
  sort_order: number
  created_at: string
}

// 优惠券
export interface Coupon {
  id: number
  name: string
  type: 'fixed' | 'percent'
  value: number
  min_amount: number
  total_count: number
  used_count: number
  claimed_count: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

// 配送区域
export interface DeliveryZone {
  id: number
  name: string
  address: string
  delivery_fee: number
  min_order_amount: number
  is_active: boolean
  created_at: string
}

// 自提点
export interface PickupPoint {
  id: number
  name: string
  address: string
  phone: string
  business_hours: string
  is_active: boolean
  created_at: string
}

// 积分规则
export interface PointRule {
  id: number
  type: 'sign_in' | 'order' | 'invite' | 'review'
  name: string
  points: number
  description?: string
  is_active: boolean
}

// 统计数据
export interface DashboardStats {
  today_orders: number
  today_amount: number
  today_users: number
  total_users: number
  total_orders: number
  total_amount: number
  pending_orders: number
  low_stock_products: number
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
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 登录请求
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应
export interface LoginResponse {
  token: string
  admin: Admin
}
