import { Navigate } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'

export default function TrackOrder() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-[15px] text-muted">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/my-orders' }} replace />
  }

  return <Navigate to="/my-orders" replace />
}
