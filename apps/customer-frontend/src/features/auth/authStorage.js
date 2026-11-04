// Separate localStorage key from the admin app's own `admin_access_token`
// (apps/admin-frontend) — these are two different apps/origins in dev, but
// naming them distinctly avoids any confusion if ever served together.
const TOKEN_KEY = 'customer_access_token'
const USER_KEY = 'customer_user'

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
