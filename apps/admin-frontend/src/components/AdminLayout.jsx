import { useState, useEffect } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import { fetchNewInquiryCount } from '../features/inquiries/inquiriesApi.js'
import { fetchOrders } from '../features/orders/ordersApi.js'

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        end: true,
        icon: (
          <path d="M4 11 12 4l8 7v9H4v-9Z" />
        ),
      },
      {
        to: '/reports',
        label: 'Reports',
        icon: (
          <path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3" />
        ),
      },
    ],
  },
  {
    title: 'Catalog',
    items: [
      {
        to: '/products',
        label: 'Products',
        icon: (
          <path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z M3 7l9 4 9-4M12 11v10" />
        ),
      },
      {
        to: '/categories',
        label: 'Categories',
        icon: (
          <path d="M3 12V4h8l10 10-8 8L3 12Z M7.5 8.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4Z" />
        ),
      },
      {
        to: '/customization',
        label: '3D Customization',
        icon: (
          <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
        ),
      },
    ],
  },
  {
    title: 'Sales',
    items: [
      {
        to: '/orders',
        label: 'Orders',
        icon: (
          <path d="M5 8h14l-1 12H6L5 8Z M9 8V6a3 3 0 0 1 6 0v2" />
        ),
      },
      {
        to: '/customers',
        label: 'Customers',
        icon: (
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
        ),
      },
      {
        to: '/inquiries',
        label: 'Customer Inquiries',
        icon: (
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        ),
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        to: '/settings',
        label: 'Settings',
        icon: (
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        ),
      },
    ],
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadInquiries, setUnreadInquiries] = useState(0)
  const [totalOrders, setTotalOrders] = useState(null)
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    function refreshCounts() {
      fetchNewInquiryCount()
        .then((count) => {
          if (mounted) setUnreadInquiries(Number(count) || 0)
        })
        .catch(() => {})

      fetchOrders({ pageSize: 1 })
        .then((result) => {
          if (mounted && result?.meta?.total != null) {
            setTotalOrders(result.meta.total)
          }
        })
        .catch(() => {})
    }

    refreshCounts()
    const interval = setInterval(refreshCounts, 20000)
    window.addEventListener('giftora:inquiries-updated', refreshCounts)
    window.addEventListener('giftora:orders-updated', refreshCounts)

    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('giftora:inquiries-updated', refreshCounts)
      window.removeEventListener('giftora:orders-updated', refreshCounts)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-bg text-ink flex">
      
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 min-[761px]:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Industrial Obsidian Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-line bg-band py-5 px-3.5 transition-transform duration-200 min-[761px]:static min-[761px]:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full min-[761px]:w-[76px] min-[1041px]:w-[248px]'
        }`}
      >
        <div>
          {/* Sidebar Logo */}
          <Link to="/" className="flex items-center gap-3 px-2.5 pb-4 mb-2 border-b border-line">
            <img
              src="/jas-logo.png"
              alt="JAS 3D PRINTING"
              className="h-8 w-8 rounded-full object-contain border border-line shrink-0"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <span className="font-display text-[17px] font-semibold text-ink tracking-tight whitespace-nowrap min-[761px]:hidden min-[1041px]:inline">
              JAS 3D PRINTING
            </span>
          </Link>

          {/* Navigation Groups */}
          <div className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title}>
                <h5 className="font-sans text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted px-2.5 my-2 min-[761px]:hidden min-[1041px]:block">
                  {group.title}
                </h5>
                <nav className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-control px-3 py-2.5 text-[14px] font-medium transition-colors ${
                          isActive
                            ? 'bg-soft text-ink font-semibold'
                            : 'text-muted hover:text-ink hover:bg-alt'
                        }`
                      }
                      title={item.label}
                    >
                      <svg
                        className="h-5 w-5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {item.icon}
                      </svg>
                      <span className="min-[761px]:hidden min-[1041px]:inline">{item.label}</span>
                      {(() => {
                        const badgeCount =
                          item.to === '/inquiries'
                            ? unreadInquiries > 0
                              ? String(unreadInquiries)
                              : null
                            : item.to === '/orders'
                              ? totalOrders != null
                                ? String(totalOrders)
                                : null
                              : item.count
                        if (!badgeCount) return null
                        return (
                          <span
                            className={`ml-auto hidden min-[1041px]:inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                              item.to === '/inquiries' ? 'bg-accent text-on-accent' : 'bg-secondary text-on-secondary'
                            }`}
                          >
                            {badgeCount}
                          </span>
                        )
                      })()}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* User Block at Bottom */}
        <div className="border-t border-line pt-3 px-2.5">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[12px] font-bold text-on-secondary">
              {user?.email ? user.email.slice(0, 2).toUpperCase() : 'AD'}
            </span>
            <div className="min-w-0 flex-1 min-[761px]:hidden min-[1041px]:block">
              <p className="text-[13px] font-medium text-ink truncate m-0">{user?.email || 'admin'}</p>
              <button
                type="button"
                onClick={logout}
                className="text-[12px] text-muted hover:text-danger cursor-pointer transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-[72px] border-b border-line bg-surface flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-control border border-line text-ink min-[761px]:hidden hover:bg-soft"
              aria-label="Open navigation"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-2 h-10 w-72 rounded-full bg-alt border border-line px-3 text-muted text-sm focus-within:border-accent">
              <svg className="w-4 h-4 text-muted shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="text"
                placeholder="Search orders, products, customers..."
                className="w-full bg-transparent text-ink text-[13px] outline-none placeholder:text-muted"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/inquiries"
              title={unreadInquiries > 0 ? `${unreadInquiries} new customer inquiry` : 'Customer Inquiries'}
              aria-label="Customer Inquiries"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-alt border border-line text-muted hover:text-ink hover:border-accent transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4l2-2ZM10 21h4" />
              </svg>
              {unreadInquiries > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent animate-pulse">
                  {unreadInquiries > 99 ? '99+' : unreadInquiries}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#17683f]" />
              <span className="font-sans text-[12.5px] text-muted">Engine Online</span>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden min-w-0">
          <Outlet />
        </main>
      </div>

    </div>
  )
}
