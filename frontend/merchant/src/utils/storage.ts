import Taro from '@tarojs/taro'

/**
 * 本地存储工具
 */
export const storage = {
  /**
   * 获取存储数据
   */
  get<T>(key: string): T | null {
    try {
      const value = Taro.getStorageSync(key)
      return value ? (value as T) : null
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  },

  /**
   * 设置存储数据
   */
  set(key: string, value: any): boolean {
    try {
      Taro.setStorageSync(key, value)
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      return false
    }
  },

  /**
   * 删除存储数据
   */
  remove(key: string): boolean {
    try {
      Taro.removeStorageSync(key)
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  },

  /**
   * 清空存储
   */
  clear(): boolean {
    try {
      Taro.clearStorageSync()
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      return false
    }
  },
}
