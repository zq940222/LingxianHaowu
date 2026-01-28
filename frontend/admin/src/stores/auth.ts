import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Admin } from '@/types'
import { authApi } from '@/api'

interface AuthState {
  admin: Admin | null
  token: string | null
  isLoggedIn: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  fetchAdminInfo: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      token: null,
      isLoggedIn: false,
      loading: false,

      login: async (username: string, password: string) => {
        set({ loading: true })
        try {
          const { token, admin } = await authApi.login({ username, password })
          localStorage.setItem('admin_token', token)
          set({ admin, token, isLoggedIn: true })
          return true
        } catch {
          return false
        } finally {
          set({ loading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('admin_token')
        set({ admin: null, token: null, isLoggedIn: false })
      },

      fetchAdminInfo: async () => {
        if (!get().token) return
        try {
          const admin = await authApi.getAdminInfo()
          set({ admin })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)
