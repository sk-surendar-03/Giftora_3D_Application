import { Link } from 'react-router-dom'

const columns = [
  {
    heading: 'Shop',
    links: [
      { to: '/products', label: 'All Products' },
      { to: '/track-order', label: 'Track Order' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { to: '/contact', label: 'Contact Us' },
      { to: '/contact', label: 'Shipping Policy' },
      { to: '/contact', label: 'Returns & Refunds' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <span className="font-display text-lg font-semibold text-ink">Giftora</span>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Personalised 3D-printed keychains, designed by you and made to order.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold text-ink">{column.heading}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-10 border-t border-border pt-6 text-xs text-muted">
          &copy; {new Date().getFullYear()} Giftora. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
