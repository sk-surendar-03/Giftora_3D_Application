import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { WishlistProvider } from './features/wishlist/WishlistContext.jsx'
import { CartProvider } from './features/cart/CartContext.jsx'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <AppRoutes />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}
