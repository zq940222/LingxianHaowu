/**
 * 验证手机号
 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 验证身份证号
 */
export function isValidIdCard(idCard: string): boolean {
  return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard)
}

/**
 * 验证邮箱
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * 验证非空
 */
export function isNotEmpty(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

/**
 * 验证数字范围
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * 验证密码强度 (至少8位，包含字母和数字)
 */
export function isStrongPassword(password: string): boolean {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)
}

/**
 * 验证地址表单
 */
export function validateAddressForm(form: {
  name: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
}): { valid: boolean; message?: string } {
  if (!form.name?.trim()) {
    return { valid: false, message: '请输入收货人姓名' }
  }
  if (!form.phone?.trim()) {
    return { valid: false, message: '请输入手机号' }
  }
  if (!isValidPhone(form.phone)) {
    return { valid: false, message: '请输入正确的手机号' }
  }
  if (!form.province || !form.city || !form.district) {
    return { valid: false, message: '请选择所在地区' }
  }
  if (!form.detail?.trim()) {
    return { valid: false, message: '请输入详细地址' }
  }
  if (form.detail.length < 5) {
    return { valid: false, message: '详细地址至少5个字符' }
  }
  return { valid: true }
}
