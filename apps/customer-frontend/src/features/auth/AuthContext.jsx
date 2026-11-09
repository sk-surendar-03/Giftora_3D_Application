import { useMemo, useState } from 'react'
import api from '../../services/api'
import { AuthContext } from './authContextObject.js'
import { saveSession, clearSession, getStoredUser, getToken } from './authStorage'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && getToken()),
      async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password })
        saveSession(data.token, data.user)
        setUser(data.user)
      },
      async register(name, email, password, phone) {
        const { data } = await api.post('/auth/register', { name, email, password, phone })
        saveSession(data.token, data.user)
        setUser(data.user)
      },
      logout() {
        clearSession()
        setUser(null)
        api.post('/auth/logout').catch(() => {})
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
