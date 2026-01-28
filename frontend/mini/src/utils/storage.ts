import Taro from '@tarojs/taro'

/**
 * 本地存储封装
 */
export const storage = {
  /**
   * 同步获取存储数据
   */
  get<T = any>(key: string): T | null {
    try {
      const value = Taro.getStorageSync(key)
      return value || null
    } catch {
      return null
    }
  },

  /**
   * 同步设置存储数据
   */
  set(key: string, value: any): boolean {
    try {
      Taro.setStorageSync(key, value)
      return true
    } catch {
      return false
    }
  },

  /**
   * 同步删除存储数据
   */
  remove(key: string): boolean {
    try {
      Taro.removeStorageSync(key)
      return true
    } catch {
      return false
    }
  },

  /**
   * 清空所有存储
   */
  clear(): boolean {
    try {
      Taro.clearStorageSync()
      return true
    } catch {
      return false
    }
  },

  /**
   * 异步获取存储数据
   */
  async getAsync<T = any>(key: string): Promise<T | null> {
    try {
      const { data } = await Taro.getStorage({ key })
      return data || null
    } catch {
      return null
    }
  },

  /**
   * 异步设置存储数据
   */
  async setAsync(key: string, value: any): Promise<boolean> {
    try {
      await Taro.setStorage({ key, data: value })
      return true
    } catch {
      return false
    }
  },

  /**
   * 异步删除存储数据
   */
  async removeAsync(key: string): Promise<boolean> {
    try {
      await Taro.removeStorage({ key })
      return true
    } catch {
      return false
    }
  },
}
