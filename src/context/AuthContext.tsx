import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../lib/api'

interface UniUser {
  id: string; email: string; tenantId: string; permissions: string[]
}

interface AuthCtx {
  user: UniUser | null; loading: boolean
  universityId: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UniUser | null>(null)
  const [loading, setLoading] = useState(true)

  // University ID is stored after login (derived from user's assigned university)
  const universityId = localStorage.getItem('uni_university_id')

  useEffect(() => {
    const token = localStorage.getItem('uni_token')
    if (token) {
      authApi.me().then(r => setUser(r.data)).catch(() => localStorage.clear()).finally(() => setLoading(false))
    } else setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('uni_token', res.data.accessToken)
    localStorage.setItem('uni_refresh', res.data.refreshToken)
    const me = await authApi.me()
    setUser(me.data)
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    localStorage.clear()
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, universityId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
