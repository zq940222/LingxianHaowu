// 用户相关类型
export interface User {
  id: number
  nickname: string
  avatar: string
  phone: string
  points: number
  created_at: string
}

export interface Address {
  id: number
  user_id: number
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  is_default: boolean
}

// 商品相关类型
export interface Category {
  id: number
  name: string
  icon: string
  parent_id: number | null
  sort_order: number
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  original_price: number
  unit: string
  stock: number
  sales: number
  category_id: number
  images: string[]
  cover_image: string
  is_on_sale: boolean
  is_recommended: boolean
  is_hot: boolean
  group_buy_price?: number
  created_at: string
}

export interface ProductDetail extends Product {
  specs?: ProductSpec[]
  category: Category
}

export interface ProductSpec {
  id: number
  name: string
  values: string[]
}

// 购物车相关类型
export interface CartItem {
  id: number
  product_id: number
  product: Product
  quantity: number
  selected: boolean
  spec?: string
}

// 订单相关类型
export type OrderStatus =
  | 'pending_payment'    // 待付款
  | 'pending_delivery'   // 待配送
  | 'delivering'         // 配送中
  | 'pending_pickup'     // 待自提
  | 'completed'          // 已完成
  | 'cancelled'          // 已取消
  | 'refunding'          // 退款中
  | 'refunded'           // 已退款

export interface Order {
  id: number
  order_no: string
  user_id: number
  total_amount: number
  pay_amount: number
  freight_amount: number
  discount_amount: number
  status: OrderStatus
  delivery_type: 'delivery' | 'pickup'
  address?: Address
  pickup_point_id?: number
  delivery_time?: string
  remark?: string
  items: OrderItem[]
  created_at: string
  paid_at?: string
  completed_at?: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product_name: string
  product_image: string
  price: number
  quantity: number
  spec?: string
}

// 配送相关类型
export interface PickupPoint {
  id: number
  name: string
  address: string
  phone: string
  business_hours: string
  latitude: number
  longitude: number
}

export interface DeliveryZone {
  id: number
  name: string
  min_amount: number
  delivery_fee: number
}

export interface DeliveryTimeSlot {
  date: string
  slots: {
    start: string
    end: string
    available: boolean
  }[]
}

// 活动相关类型
export interface Coupon {
  id: number
  name: string
  type: 'fixed' | 'percent'
  value: number
  min_amount: number
  start_time: string
  end_time: string
  description?: string
}

export interface UserCoupon {
  id: number
  coupon: Coupon
  status: 'unused' | 'used' | 'expired'
  received_at: string
  used_at?: string
}

export interface GroupBuy {
  id: number
  product_id: number
  product: Product
  group_price: number
  group_size: number
  current_size: number
  start_time: string
  end_time: string
  status: 'pending' | 'ongoing' | 'success' | 'failed'
  members: GroupBuyMember[]
}

export interface GroupBuyMember {
  id: number
  user_id: number
  user: Pick<User, 'id' | 'nickname' | 'avatar'>
  joined_at: string
}

export interface Activity {
  id: number
  title: string
  type: 'popup' | 'banner' | 'promotion'
  image: string
  link?: string
  start_time: string
  end_time: string
}

// 积分相关类型
export interface PointsRecord {
  id: number
  user_id: number
  points: number
  type: 'sign_in' | 'order' | 'redeem' | 'expired'
  description: string
  created_at: string
}

export interface SignInRecord {
  id: number
  user_id: number
  sign_date: string
  consecutive_days: number
  points_earned: number
}

export interface PointRule {
  id: number
  type: string
  points: number
  description: string
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
