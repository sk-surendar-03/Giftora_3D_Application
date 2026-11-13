import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth.js'
import { useCart } from '../../features/cart/useCart.js'
import api from '../../services/api.js'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop all' },
  { to: '/customise', label: '3D Customiser' },
  { to: '/contact', label: 'Contact' },
]

function ProfileDropdown({ user, updateUser, onLogout }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    setName(user?.name ?? '')
    setPhone(user?.phone ?? '')
  }, [user])

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError('Full name is required.'); return }
    if (!phone.trim()) { setError('Phone number is required.'); return }
    if (!/^[0-9]{10}$/.test(phone.trim())) { setError('Phone must be exactly 10 digits (numbers only).'); return }

    setSaving(true)
    try {
      const { data } = await api.patch('/auth/me', { name: name.trim(), phone: phone.trim() })
      updateUser(data.user)
      setEditing(false)
      setStatus('ok')
      setTimeout(() => setStatus(null), 2000)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Save failed.')
    }
    setSaving(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setEditing(false) }}
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-ink hover:bg-soft"
        title="My Account"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[50px] w-[min(320px,calc(100vw-36px))] rounded-xl border border-border bg-surface shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-alt">
            <div>
              <p className="text-sm font-semibold text-ink">{user?.name}</p>
              <p className="text-xs text-muted">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(v => !v)}
              className="text-xs font-semibold text-accent hover:underline cursor-pointer"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="p-4 space-y-3">
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Phone (10 digits)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full rounded-lg border border-border bg-alt px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                  placeholder="10-digit mobile number" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full rounded-lg bg-accent py-2 text-sm font-semibold text-on-accent hover:bg-accent-dark disabled:opacity-50 cursor-pointer">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div className="p-4 space-y-2">
              {status === 'ok' && <p className="text-xs text-green-500 font-medium">✓ Profile updated</p>}
              <div className="flex justify-between text-sm">
                <span className="text-muted">Name</span>
                <span className="font-medium text-ink">{user?.name || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Email</span>
                <span className="font-medium text-ink text-xs">{user?.email || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Phone</span>
                <span className="font-medium text-ink">{user?.phone || '—'}</span>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <Link to="/my-orders" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 py-1.5 text-sm text-ink hover:text-accent">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  My Orders
                </Link>
                <Link to="/addresses" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 py-1.5 text-sm text-ink hover:text-accent">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  Saved Addresses
                </Link>
                <button type="button" onClick={onLogout}
                  className="flex items-center gap-2 py-1.5 text-sm text-red-500 hover:text-red-600 w-full cursor-pointer">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { isAuthenticated, user, logout, updateUser } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()

  const cartCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface text-ink">
      <div className="mx-auto flex h-[76px] max-[760px]:h-[64px] max-w-[1200px] items-center justify-between gap-8 max-[1040px]:gap-4 px-10 max-[1040px]:px-7 max-[760px]:px-[18px]">
        
        {/* Left: Hamburger for mobile + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-ink hover:bg-soft min-[761px]:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>

          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 text-decoration-none group"
          >
            <img
              src="/jas-logo.png"
              alt="JAS 3D PRINTING Emblem"
              className="h-10 w-10 rounded-full object-contain border border-border"
              onError={(e) => {
                // fallback if image fails
                e.target.style.display = 'none'
              }}
            />
            <span className="font-display text-[22px] max-[760px]:text-[19px] max-[480px]:text-[15px] font-semibold tracking-[-0.02em] text-ink whitespace-nowrap">
              JAS 3D PRINTING
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden min-[761px]:flex flex-1 items-center gap-[22px] max-[1040px]:gap-4 text-[14.5px] max-[1040px]:text-[13.5px] font-medium font-sans">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `py-1.5 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-ink hover:text-accent'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Tools & Actions */}
        <div className="flex items-center gap-2.5 max-[480px]:gap-1">
          {/* Search pill on desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden min-[1041px]:flex items-center gap-2 h-[42px] w-[220px] rounded-full bg-alt px-4 text-sm text-muted border border-transparent focus-within:border-accent"
          >
            <svg className="h-[18px] w-[18px] shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-ink text-[14px] outline-none placeholder:text-muted"
            />
          </form>

          {/* Search icon button for <= 1040px */}
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex min-[1041px]:hidden h-[42px] w-[42px] items-center justify-center rounded-full text-ink hover:bg-soft"
            aria-label="Toggle search"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>

          {/* Account Icon Button / Profile Dropdown */}
          {isAuthenticated ? (
            <div className="flex items-center">
              <ProfileDropdown user={user} updateUser={updateUser} onLogout={handleLogout} />
            </div>
          ) : (
            <Link
              to="/login"
              title="Sign In"
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-ink hover:bg-soft"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
              </svg>
            </Link>
          )}

          {/* Cart Icon Button with Count Chip */}
          <Link
            to="/cart"
            className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full text-ink hover:bg-soft"
            aria-label={`Cart (${cartCount} items)`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M5 8h14l-1 12H6L5 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-[3px] right-[2px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10.5px] font-bold text-on-accent">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile / Tablet Collapsible Search bar */}
      {searchOpen && (
        <div className="border-t border-border bg-alt p-3 min-[1041px]:hidden">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-[42px] rounded-control bg-surface border border-border px-4 text-sm text-ink placeholder:text-muted outline-none focus:border-accent"
              autoFocus
            />
            <button
              type="submit"
              className="h-[42px] px-4 rounded-control bg-accent text-on-accent text-sm font-semibold hover:bg-accent-dark"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      {menuOpen && (
        <nav className="border-t border-border bg-surface px-6 py-4 min-[761px]:hidden animate-in fade-in duration-200">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block py-2.5 text-base font-medium transition-colors ${
                      isActive ? 'text-accent font-semibold' : 'text-ink hover:text-accent'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="my-2 border-t border-border/80" />
            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/my-orders"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-ink font-medium hover:text-accent"
                  >
                    Track Orders / My Orders
                  </Link>
                </li>
                <li>
                  <Link
                    to="/addresses"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-muted hover:text-ink"
                  >
                    Saved Addresses
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full text-left py-2 text-sm font-semibold text-danger"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-muted hover:text-ink"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-accent hover:underline"
                  >
                    Create Account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
