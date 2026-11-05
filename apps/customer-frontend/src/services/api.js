import axios from 'axios'
import { getToken, clearSession } from '../features/auth/authStorage'
import { saveDraft, loadDraft } from '../features/customDesign/designDraft'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1',
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// When the server rejects with 401 (token expired/invalid), clear the stale
// session and redirect to login.  If the customer was on the customiser page,
// any in-progress design is already in the draft (the customiser writes it on
// every change), so it will be restored automatically after they log back in.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const wasOnCustomiser = window.location.pathname.startsWith('/customise')

      // If there is no draft yet but we were on the customiser, the hook
      // that owns the design state will have already called saveDraft before
      // navigating to login (see CustomizationSummary → handleAddToCart).
      // We only need to clear the now-invalid credentials.
      clearSession()

      // Avoid redirect loops on the login page itself.
      if (!window.location.pathname.startsWith('/login')) {
        const from = wasOnCustomiser ? '/customise' : window.location.pathname
        window.location.href = `/login?session_expired=1&from=${encodeURIComponent(from)}`
      }
    }
    return Promise.reject(error)
  },
)

export default api
