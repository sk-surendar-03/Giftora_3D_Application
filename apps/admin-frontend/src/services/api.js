import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// When the backend rejects with 401, the admin's session has expired.
// Clear the stale token and redirect to the login page so they can
// re-authenticate — prevents the app from silently re-trying with a
// token the server will always refuse.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_user')
      // Avoid a redirect loop on the login page itself.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?session_expired=1'
      }
    }
    return Promise.reject(error)
  },
)

export default api
