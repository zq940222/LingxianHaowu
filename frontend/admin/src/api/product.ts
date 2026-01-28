import { get, post, put, del } from '@/utils/request'
import type { Product, Category, PaginatedResponse } from '@/types'

interface ProductListParams {
  page?: number
  page_size?: number
  keyword?: string
  category_id?: number
  is_on_sale?: boolean
}

export async function getProductList(params: ProductListParams = {}): Promise<PaginatedResponse<Product>> {
  return get('/admin/products', params)
}

export async function getProductDetail(id: number): Promise<Product> {
  return get(`/admin/products/${id}`)
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  return post('/admin/products', data)
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  return put(`/admin/products/${id}`, data)
}

export async function deleteProduct(id: number): Promise<void> {
  return del(`/admin/products/${id}`)
}

export async function updateProductStatus(id: number, is_on_sale: boolean): Promise<Product> {
  return put(`/admin/products/${id}/status`, { is_on_sale })
}

export async function updateProductStock(id: number, stock: number): Promise<Product> {
  return put(`/admin/products/${id}/stock`, { stock })
}

// 分类
export async function getCategoryList(): Promise<Category[]> {
  return get('/admin/categories')
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  return post('/admin/categories', data)
}

export async function updateCategory(id: number, data: Partial<Category>): Promise<Category> {
  return put(`/admin/categories/${id}`, data)
}

export async function deleteCategory(id: number): Promise<void> {
  return del(`/admin/categories/${id}`)
}
