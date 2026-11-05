import { useState } from 'react'
import { Link } from 'react-router-dom'

const columns = [
  {
    heading: 'Shop',
    links: [
      { to: '/products', label: 'All Products' },
      { to: '/customise', label: '3D Customiser' },
      { to: '/track-order', label: 'Track Order' },
    ],
  },
  {
    heading: 'Customer Service',
    links: [
      { to: '/contact', label: 'Contact Us' },
      { to: '/contact', label: 'Shipping & Delivery' },
      { to: '/contact', label: 'Returns & Refunds' },
      { to: '/contact', label: 'Privacy Policy' },
    ],
  },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e) {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
    }
  }

  return (
    <footer className="border-t border-line bg-band text-muted pt-16 pb-7">
      <div className="mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px]">
        <div className="grid grid-cols-1 min-[761px]:grid-cols-2 min-[1041px]:grid-cols-[1.5fr_1fr_1fr_1.3fr] gap-10">
          
          {/* Brand info */}
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src="/jas-logo.png"
                alt="Giftora"
                className="h-10 w-10 rounded-full object-contain border border-line"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <span className="font-display text-[24px] font-semibold tracking-[-0.02em] text-ink">
                Giftora
              </span>
            </div>
            <p className="mt-3.5 max-w-[34ch] text-[14px] leading-relaxed text-muted">
              Precision 3D manufacturing meets custom design. Every piece engineered and printed to order with industrial accuracy.
            </p>
          </div>

          {/* Columns */}
          {columns.map((column) => (
            <div key={column.heading}>
              <h4 className="font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-ink mb-4">
                {column.heading}
              </h4>
              <ul className="space-y-2.5 list-none p-0 m-0">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-[14px] text-muted hover:text-ink transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter / Updates */}
          <div>
            <h4 className="font-sans text-[12px] font-bold uppercase tracking-[0.14em] text-ink mb-4">
              Stay Informed
            </h4>
            <p className="text-[13px] text-muted mb-3.5">
              Receive updates on industrial engineering materials, new geometries, and offers.
            </p>
            {subscribed ? (
              <p className="text-[13.5px] font-semibold text-[#17683f] bg-[#e3f4ea] px-3 py-2 rounded-control inline-block">
                ✓ Thank you for subscribing!
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 flex-1 rounded-control border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-muted outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  className="h-11 px-4 rounded-control bg-brand text-on-accent text-[13.5px] font-semibold hover:bg-brand-d transition-colors"
                >
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-11 pt-5.5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-muted">
          <p>&copy; {new Date().getFullYear()} Giftora. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/contact" className="hover:text-ink transition-colors">Privacy</Link>
            <Link to="/contact" className="hover:text-ink transition-colors">Terms of Service</Link>
            <Link to="/contact" className="hover:text-ink transition-colors">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
