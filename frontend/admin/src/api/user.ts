import { get, post, put } from '@/utils/request'
import type { User, PaginatedResponse } from '@/types'

interface UserListParams {
  page?: number
  page_size?: number
  keyword?: string
  status?: string
}

export async function getUserList(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
  return get('/admin/users', params)
}

export async function getUserDetail(id: number): Promise<User> {
  return get(`/admin/users/${id}`)
}

export async function updateUserStatus(id: number, status: 'active' | 'banned'): Promise<User> {
  return put(`/admin/users/${id}/status`, { status })
}

export async function updateUserPoints(id: number, points: number, reason: string): Promise<User> {
  return post(`/admin/users/${id}/points`, { points, reason })
}
