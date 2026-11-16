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
      async registerRequest(name, email, password, phone) {
        const { data } = await api.post('/auth/register-request', { name, email, password, phone })
        return data
      },
      async registerVerify(email, otp) {
        const { data } = await api.post('/auth/register-verify', { email, otp })
        saveSession(data.token, data.user)
        setUser(data.user)
        return data
      },
      async registerResend(email) {
        const { data } = await api.post('/auth/register-resend', { email })
        return data
      },
      async register(name, email, password, phone) {
        // Forwarding call for backward compatibility
        return this.registerRequest(name, email, password, phone)
      },
      logout() {
        clearSession()
        setUser(null)
        api.post('/auth/logout').catch(() => {})
      },
      updateUser(updated) {
        saveSession(getToken(), updated)
        setUser(updated)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
