import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { WishlistProvider } from './features/wishlist/WishlistContext.jsx'

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <AppRoutes />
      </WishlistProvider>
    </AuthProvider>
  )
}
