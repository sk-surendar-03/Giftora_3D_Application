import { Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from '../components/common/ScrollToTop.jsx'
import MainLayout from '../layouts/MainLayout'
import Home from '../pages/Home'
import Products from '../pages/Products'
import ProductDetail from '../pages/ProductDetail'
import Customiser from '../pages/Customiser'
import Cart from '../pages/Cart'
import Addresses from '../pages/Addresses'
import Checkout from '../pages/Checkout'
import OrderSuccess from '../pages/OrderSuccess'
import TrackOrder from '../pages/TrackOrder'
import Login from '../pages/Login'
import Register from '../pages/Register'
import MyOrders from '../pages/MyOrders'
import OrderDetails from '../pages/OrderDetails'
import Contact from '../pages/Contact'
import PolicyPage from '../pages/policies/PolicyPage'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/customise" element={<Customiser />} />
          <Route path="/customise/:productId" element={<Navigate to="/customise" replace />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping-delivery" element={<PolicyPage slug="shipping-delivery" />} />
          <Route path="/returns-refunds" element={<PolicyPage slug="returns-refunds" />} />
          <Route path="/privacy-policy" element={<PolicyPage slug="privacy-policy" />} />
          <Route path="/terms-of-service" element={<PolicyPage slug="terms-of-service" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
