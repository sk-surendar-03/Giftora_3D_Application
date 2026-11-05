import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth.js'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated || !isAdmin) return <Navigate to="/login" replace />
  return children
}
