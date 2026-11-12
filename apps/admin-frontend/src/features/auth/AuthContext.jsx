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
      isAdmin: user?.role === 'ADMIN',
      async login(email, password) {
        const { data } = await api.post('/auth/login', { email, password })
        if (data.user.role !== 'ADMIN') {
          // The backend's /auth/login succeeds for any valid account —
          // this app is admin-only, so a real customer account must be
          // rejected here rather than silently given a (useless, since
          // every write route checks the role itself) admin session.
          throw new Error('This account does not have admin access.')
        }
        saveSession(data.token, data.user)
        setUser(data.user)
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
