import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authAPI } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized           = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const savedUser  = sessionStorage.getItem('dg_user')
    const savedToken = sessionStorage.getItem('access_token')

    if (savedUser && savedToken) {
      // Verify token is still valid with backend
      authAPI.me()
        .then(res => setUser(res.data.user))
        .catch(() => {
          sessionStorage.removeItem('dg_user')
          sessionStorage.removeItem('access_token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { access_token, user } = res.data
    sessionStorage.setItem('access_token', access_token)
    sessionStorage.setItem('dg_user', JSON.stringify(user))
    setUser(user)
    return res.data
  }

  const logout = async () => {
    try { await authAPI.logout() } catch (e) {}
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('dg_user')
    setUser(null)
  }

  const acceptConsent = async () => {
    await authAPI.consent()
    const updated = { ...user, consent_accepted: true }
    setUser(updated)
    sessionStorage.setItem('dg_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, acceptConsent }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
