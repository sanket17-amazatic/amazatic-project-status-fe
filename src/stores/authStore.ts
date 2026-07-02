import { create } from 'zustand'

export type UserRole = 'management' | 'pm' | 'member'

export interface AuthUser {
  id: number
  email: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser) => void
  clear: () => void
}

/**
 * Holds the authenticated user (id/email/role). `role` drives management-only
 * nav and UI (the auth-shell + dashboard plans read this store, they don't
 * re-fetch /api/me/ per component).
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}))
