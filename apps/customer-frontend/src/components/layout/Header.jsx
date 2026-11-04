import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth.js'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/track-order', label: 'Track Order' },
  { to: '/contact', label: 'Contact' },
]

function MenuIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M4 7h16M4 12h16M4 17h16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="font-display text-xl font-semibold tracking-tight text-ink"
        >
          Giftora
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          {isAuthenticated ? (
            <>
              <Link to="/my-orders" className="hidden text-sm font-medium text-muted hover:text-ink sm:block">
                My Orders
              </Link>
              <Link to="/addresses" className="hidden text-sm font-medium text-muted hover:text-ink sm:block">
                Addresses
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden text-sm font-medium text-muted hover:text-ink sm:block"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden text-sm font-medium text-muted hover:text-ink sm:block">
              Login
            </Link>
          )}
          <Link
            to="/cart"
            className="rounded-control bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90"
          >
            Cart
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="-mr-1.5 rounded-control p-1.5 text-ink md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-surface px-4 py-3 md:hidden">
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block py-2.5 text-sm font-medium ${isActive ? 'text-ink' : 'text-muted'}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            {isAuthenticated && (
              <>
                <li>
                  <Link
                    to="/my-orders"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2.5 text-sm font-medium text-muted"
                  >
                    My Orders
                  </Link>
                </li>
                <li>
                  <Link
                    to="/addresses"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2.5 text-sm font-medium text-muted"
                  >
                    Addresses
                  </Link>
                </li>
              </>
            )}
            <li>
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="block py-2.5 text-sm font-medium text-muted">
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 text-sm font-medium text-muted"
                >
                  Login
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
