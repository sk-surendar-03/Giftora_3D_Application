import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/products', label: 'Products' },
  { to: '/categories', label: 'Categories' },
  { to: '/orders', label: 'Orders' },
  { to: '/customers', label: 'Customers' },
  { to: '/reports', label: 'Reports' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-gray-900">Giftora Admin</span>
          <nav className="flex items-center gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 font-medium ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <span className="ml-2 text-gray-400">{user?.email}</span>
            <button type="button" onClick={logout} className="rounded-md px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100">
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
