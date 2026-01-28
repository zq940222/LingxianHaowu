import { get, post } from '@/utils/request'
import type { Admin, LoginRequest, LoginResponse } from '@/types'

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return post('/admin/login', data)
}

export async function logout(): Promise<void> {
  return post('/admin/logout')
}

export async function getAdminInfo(): Promise<Admin> {
  return get('/admin/info')
}

export async function updatePassword(oldPassword: string, newPassword: string): Promise<void> {
  return post('/admin/password', { old_password: oldPassword, new_password: newPassword })
}
