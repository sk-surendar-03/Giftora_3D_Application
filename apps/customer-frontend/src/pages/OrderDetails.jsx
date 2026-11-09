import { useEffect, useState } from 'react'
import { useParams, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import { fetchOrder } from '../features/orders/ordersApi.js'
import OrderItemsList from '../components/orders/OrderItemsList.jsx'
import OrderAddressSummary from '../components/orders/OrderAddressSummary.jsx'
import OrderStatusBadge from '../components/orders/OrderStatusBadge.jsx'
import OrderStatusTimeline from '../components/orders/OrderStatusTimeline.jsx'
import { resolveTrackingUrl } from '../utils/carrierTracking.js'

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function OrderDetails() {
  const { orderId } = useParams()
  const location = useLocation()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [state, setState] = useState({ data: null, isLoading: true, error: null })

  useEffect(() => {
    if (!isAuthenticated) return

    const controller = new AbortController()
    const timer = setTimeout(() => {
      setState({ data: null, isLoading: true, error: null })
      fetchOrder(orderId, controller.signal)
        .then((order) => setState({ data: order, isLoading: false, error: null }))
        .catch((err) => {
          if (controller.signal.aborted) return
          setState({ data: null, isLoading: false, error: err })
        })
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [orderId, isAuthenticated])

  if (authLoading) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-[15px] text-muted">
        Checking authentication…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (state.isLoading) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center text-[15px] text-muted">
        Loading order details…
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="bg-bg text-ink min-h-[70vh] flex items-center justify-center">
        <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
          <h1 className="font-display text-[32px] font-semibold text-ink">Order not found</h1>
          <p className="mt-3 font-sans text-[15px] text-muted">
            We couldn't find that order, or it doesn't belong to your account.{' '}
            <Link to="/my-orders" className="font-semibold text-accent hover:underline">
              Back to My Orders
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const order = state.data
  const trackingLink = resolveTrackingUrl(order.shippingCarrier, order.trackingNumber, order.trackingUrl)
  const hasShippingInfo = Boolean(order.shippingCarrier || order.trackingNumber || trackingLink)

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[900px] px-10 max-[760px]:px-[18px] py-12">
        <nav className="mb-6 text-[13px] text-muted">
          <Link to="/my-orders" className="hover:text-ink">
            My Orders
          </Link>
          <span className="mx-2 text-muted/60">/</span>
          <span className="text-ink font-semibold">{order.orderNumber}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-line mb-8">
          <div>
            <h1 className="font-mono text-[30px] max-[760px]:text-[24px] font-bold text-accent m-0">
              {order.orderNumber}
            </h1>
            <p className="mt-1 font-sans text-[13.5px] text-muted m-0">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Manufacturing & Dispatch Progress */}
        <section className="mb-8 rounded-card border border-line bg-surface p-6">
          <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-6">
            Manufacturing & Dispatch Progress
          </h2>
          <div>
            <OrderStatusTimeline status={order.status} />
          </div>
        </section>

        {/* Shipment & Tracking Details (when available) */}
        {hasShippingInfo && (
          <section className="mb-8 rounded-card border border-accent/40 bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
                  Shipment Tracking Details
                </span>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-[14px]">
                  {order.shippingCarrier && (
                    <div>
                      <span className="text-muted text-[13px]">Carrier: </span>
                      <span className="font-semibold text-ink">{order.shippingCarrier}</span>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <span className="text-muted text-[13px]">Tracking Number: </span>
                      {trackingLink ? (
                        <a
                          href={trackingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-accent hover:underline inline-flex items-center gap-1"
                          title="Open official carrier tracking page"
                        >
                          <span>{order.trackingNumber}</span>
                          <span className="text-xs">↗</span>
                        </a>
                      ) : (
                        <span className="font-mono font-bold text-ink">{order.trackingNumber}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {trackingLink && (
                <div>
                  <a
                    href={trackingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-control bg-accent px-5 py-2.5 text-[14px] font-bold text-on-accent hover:bg-accent-dark transition-colors shadow-sm"
                  >
                    <span>Track Shipment</span>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-4">
            Items in this order
          </h2>
          <div>
            <OrderItemsList items={order.items} />
          </div>

          <div className="mt-6 ml-auto max-w-xs space-y-2.5 rounded-card border border-line bg-surface p-5 text-[14px]">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="text-ink font-semibold">{formatPrice(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Shipping</span>
              <span className="text-[#17683f] font-semibold">{formatPrice(order.shippingCents)}</span>
            </div>
            <div className="pt-2 border-t border-line flex justify-between font-sans">
              <span className="text-[16px] font-semibold text-ink">Total</span>
              <span className="text-[20px] font-bold text-accent">{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent m-0 mb-4">
            Delivery destination
          </h2>
          <div>
            <OrderAddressSummary address={order.shippingAddress} />
          </div>
        </section>
      </div>
    </div>
  )
}
