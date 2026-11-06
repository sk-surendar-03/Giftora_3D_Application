import { useEffect, useState } from 'react'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import StatCard from '../../components/StatCard.jsx'
import Banner from '../../components/Banner.jsx'
import { fetchProductReport } from '../../features/reports/reportsApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatPrice(cents) {
  return `₹${(cents / 100).toFixed(2)}`
}

function defaultDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

export default function ProductsReportTab() {
  const [from, setFrom] = useState(defaultDate(30))
  const [to, setTo] = useState(defaultDate(0))
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      setError(null)
      fetchProductReport({ from, to })
        .then(setReport)
        .catch((err) => setError(extractError(err)))
        .finally(() => setIsLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [from, to])

  return (
    <div>
      <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="mt-6 text-sm text-muted">Loading product report…</p>
      ) : report ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Low-stock products"
              value={report.inventoryTrackingAvailable ? report.lowStockProducts : '—'}
              hint={report.inventoryTrackingAvailable ? undefined : 'Inventory tracking not implemented'}
            />
            <StatCard
              label="Out-of-stock products"
              value={report.inventoryTrackingAvailable ? report.outOfStockProducts : '—'}
              hint={report.inventoryTrackingAvailable ? undefined : 'Inventory tracking not implemented'}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Best-selling (by quantity)</h2>
              {report.bestSellingByQuantity.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No sales in this range.</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {report.bestSellingByQuantity.map((p) => (
                      <tr key={p.productId} className="border-t border-line">
                        <td className="py-2 text-ink">{p.productName}</td>
                        <td className="py-2 text-right text-muted">{p.quantitySold} sold</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">Best-selling (by revenue)</h2>
              {report.bestSellingByRevenue.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No sales in this range.</p>
              ) : (
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {report.bestSellingByRevenue.map((p) => (
                      <tr key={p.productId} className="border-t border-line">
                        <td className="py-2 text-ink">{p.productName}</td>
                        <td className="py-2 text-right text-muted">{formatPrice(p.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-line bg-surface p-5">
            <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
              Active products with no sales in this range ({report.productsWithNoSales.length})
            </h2>
            {report.productsWithNoSales.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Every active product sold at least once in this range.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {report.productsWithNoSales.map((p) => (
                  <li key={p.productId} className="rounded-full bg-soft px-3 py-1 text-xs text-muted">
                    {p.productName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
