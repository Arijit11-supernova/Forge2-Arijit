import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const data = await api.me()
      setUser(data.user)
    } catch {
      localStorage.removeItem('token')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email, password) => {
    const data = await api.login(email, password)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const data = await api.register(payload)
    localStorage.setItem('token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try { await api.logout() } catch {}
    localStorage.removeItem('token')
    setUser(null)
  }

  const isRole = (...roles) => user && roles.includes(user.role)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
