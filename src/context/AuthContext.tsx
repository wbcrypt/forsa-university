import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, universityApi } from '../lib/api'

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
  // T-223 discovery — was localStorage.getItem('uni_university_id'), a
  // raw value the login form let the user type in directly, never
  // verified server-side (the same class of bug as K-03/T-103's
  // partners[0] issue, except worse — a manually-typed field). Now
  // resolved via GET /universities/me, keyed off the JWT identity.
  const [universityId, setUniversityId] = useState<string | null>(null)

  const resolveUniversity = useCallback(async () => {
    try {
      const res = await universityApi.me()
      setUniversityId(res.data.id)
    } catch {
      setUniversityId(null)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('uni_token')
    if (token) {
      authApi.me()
        .then(async r => { setUser(r.data); await resolveUniversity() })
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else setLoading(false)
  }, [resolveUniversity])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('uni_token', res.data.accessToken)
    localStorage.setItem('uni_refresh', res.data.refreshToken)
    const me = await authApi.me()
    setUser(me.data)
    await resolveUniversity()
  }, [resolveUniversity])

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
