// 订单状态
export const ORDER_STATUS_MAP: Record<string, { text: string; color: string }> = {
  pending_payment: { text: '待付款', color: 'warning' },
  pending_confirm: { text: '待确认', color: 'error' },
  pending_delivery: { text: '待配送', color: 'processing' },
  delivering: { text: '配送中', color: 'processing' },
  pending_pickup: { text: '待自提', color: 'purple' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'default' },
  refunding: { text: '退款中', color: 'error' },
  refunded: { text: '已退款', color: 'default' },
}

// 订单状态选项
export const ORDER_STATUS_OPTIONS = [
  { value: 'pending_payment', label: '待付款' },
  { value: 'pending_confirm', label: '待确认' },
  { value: 'pending_delivery', label: '待配送' },
  { value: 'delivering', label: '配送中' },
  { value: 'pending_pickup', label: '待自提' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'refunding', label: '退款中' },
  { value: 'refunded', label: '已退款' },
]

// 优惠券类型
export const COUPON_TYPE_MAP: Record<string, string> = {
  fixed: '满减券',
  percent: '折扣券',
}

// 活动类型
export const ACTIVITY_TYPE_MAP: Record<string, string> = {
  popup: '弹窗活动',
  banner: '首页Banner',
  groupbuy: '拼团活动',
}

// 积分规则类型
export const POINT_RULE_TYPE_MAP: Record<string, string> = {
  sign_in: '签到奖励',
  order: '订单奖励',
  invite: '邀请奖励',
  review: '评价奖励',
}

// 管理员角色
export const ADMIN_ROLE_MAP: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  operator: '运营人员',
}
