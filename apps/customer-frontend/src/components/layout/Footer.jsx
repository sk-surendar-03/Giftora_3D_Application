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
      { to: '/shipping-delivery', label: 'Shipping & Delivery' },
      { to: '/returns-refunds', label: 'Returns & Refunds' },
      { to: '/privacy-policy', label: 'Privacy Policy' },
      { to: '/terms-of-service', label: 'Terms of Service' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-band text-muted pt-16 pb-7">
      <div className="mx-auto max-w-[1200px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px]">
        <div className="grid grid-cols-1 min-[761px]:grid-cols-2 min-[1041px]:grid-cols-[320px_1fr_1fr] gap-10 min-[1041px]:gap-x-16">
          
          {/* Brand info */}
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src="/jas-logo.png"
                alt="JAS 3D PRINTING"
                className="h-10 w-10 rounded-full object-contain border border-line"
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <span className="font-display text-[22px] font-semibold tracking-[-0.02em] text-ink">
                JAS 3D PRINTING
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

        </div>

        {/* Bottom row */}
        <div className="mt-11 pt-5.5 border-t border-line flex flex-col min-[761px]:flex-row items-center justify-between gap-4 text-[13px] text-muted">
          <div className="text-center min-[761px]:text-left space-y-1">
            <p>&copy; 2026 JAS 3D PRINTING. All rights reserved.</p>
            <p className="flex flex-wrap items-center justify-center min-[761px]:justify-start gap-1.5">
              <span>Website developed by</span>
              <a
                href="https://tricubedigitalsolutions.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-accent transition-colors group"
              >
                <img
                  src="/tri-cube-logo.png"
                  alt="Tri Cube Digital Solutions"
                  className="h-6 w-6 object-contain rounded-[4px] bg-white p-[2px] shadow-xs transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <span className="font-bold tracking-tight">TRI CUBE DIGITAL SOLUTIONS</span>
              </a>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacy-policy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-ink transition-colors">Terms of Service</Link>
            <Link to="/returns-refunds" className="hover:text-ink transition-colors">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
