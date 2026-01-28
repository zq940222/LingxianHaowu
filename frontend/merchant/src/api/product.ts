import { get, post, put, del } from './request'
import type { Product, Category, PaginatedResponse } from '@/types'

interface ProductListParams {
  page?: number
  page_size?: number
  category_id?: number
  keyword?: string
  is_on_sale?: boolean
  sort_by?: 'created_at' | 'sales' | 'stock' | 'price'
  sort_order?: 'asc' | 'desc'
}

/**
 * 获取商品列表
 */
export async function getProductList(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
  return get('/merchant/products', params)
}

/**
 * 获取商品详情
 */
export async function getProductDetail(id: number): Promise<Product> {
  return get(`/merchant/products/${id}`)
}

/**
 * 创建商品
 */
export async function createProduct(data: Partial<Product>): Promise<Product> {
  return post('/merchant/products', data)
}

/**
 * 更新商品
 */
export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  return put(`/merchant/products/${id}`, data)
}

/**
 * 删除商品
 */
export async function deleteProduct(id: number): Promise<void> {
  return del(`/merchant/products/${id}`)
}

/**
 * 上架商品
 */
export async function onSaleProduct(id: number): Promise<Product> {
  return post(`/merchant/products/${id}/on-sale`)
}

/**
 * 下架商品
 */
export async function offSaleProduct(id: number): Promise<Product> {
  return post(`/merchant/products/${id}/off-sale`)
}

/**
 * 批量上架
 */
export async function batchOnSale(ids: number[]): Promise<{ success: number; failed: number }> {
  return post('/merchant/products/batch-on-sale', { ids })
}

/**
 * 批量下架
 */
export async function batchOffSale(ids: number[]): Promise<{ success: number; failed: number }> {
  return post('/merchant/products/batch-off-sale', { ids })
}

/**
 * 更新库存
 */
export async function updateStock(id: number, stock: number): Promise<Product> {
  return put(`/merchant/products/${id}/stock`, { stock })
}

/**
 * 获取分类列表
 */
export async function getCategoryList(): Promise<Category[]> {
  return get('/merchant/categories')
}

/**
 * 上传商品图片
 */
export async function uploadProductImage(filePath: string): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const token = require('@/utils/storage').storage.get(require('@/constants').STORAGE_KEYS.TOKEN)

    Taro.uploadFile({
      url: `${require('@/constants').API_BASE_URL}/merchant/upload/image`,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token}`,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          if (data.code === 0 || data.code === 200) {
            resolve(data.data)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      },
    })
  })
}

import Taro from '@tarojs/taro'
