// Matches the token key `services/api.js`'s request interceptor already
// reads (`admin_access_token`) — that convention existed before this phase;
// this module is just where it's written/read/cleared from.
const TOKEN_KEY = 'admin_access_token'
const USER_KEY = 'admin_user'

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
