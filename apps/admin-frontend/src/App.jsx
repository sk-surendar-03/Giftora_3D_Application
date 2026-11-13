import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import ProtectedRoute from './features/auth/ProtectedRoute.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import Login from './app/login/Login.jsx'
import Dashboard from './app/dashboard/Dashboard.jsx'
import Products from './app/products/Products.jsx'
import ProductForm from './app/products/ProductForm.jsx'
import Categories from './app/categories/Categories.jsx'
import Orders from './app/orders/Orders.jsx'
import OrderDetail from './app/orders/OrderDetail.jsx'
import Customers from './app/customers/Customers.jsx'
import CustomerDetail from './app/customers/CustomerDetail.jsx'
import Inquiries from './app/inquiries/Inquiries.jsx'
import Reports from './app/reports/Reports.jsx'
import Settings from './app/settings/Settings.jsx'
import CustomizationSettings from './app/customization/CustomizationSettings.jsx'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/inquiries" element={<Inquiries />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/customization" element={<CustomizationSettings />} />
        </Route>
      </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
