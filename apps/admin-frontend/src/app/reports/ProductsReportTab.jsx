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
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ProductsReportTab() {
  const [from, setFrom] = useState(() => defaultDate(30))
  const [to, setTo] = useState(() => defaultDate(0))
  const [allTime, setAllTime] = useState(false)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function load() {
    if (!allTime && from && to && from > to) {
      setError('"From" date must not be later than "To" date.')
      return
    }
    setIsLoading(true)
    setError(null)
    const params = allTime ? { allTime: true } : { from, to }
    fetchProductReport(params)
      .then(setReport)
      .catch((err) => setError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [from, to, allTime, refreshKey])

  function handleReset() {
    setFrom(defaultDate(30))
    setTo(defaultDate(0))
    setAllTime(false)
    setRefreshKey((k) => k + 1)
  }

  function handleApply() {
    load()
  }

  return (
    <div className="space-y-6">
      <DateRangeFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        allTime={allTime}
        onAllTimeChange={setAllTime}
        onApply={handleApply}
        onReset={handleReset}
      />

      <Banner tone="error">{error}</Banner>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Loading product sales report…</p>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label="Products With Sales"
              value={report.totalProductsSold}
              hint="Catalog items + custom 3D keepsakes"
            />
            <StatCard
              label="Catalog Products With No Sales"
              value={report.productsWithNoSales?.length ?? 0}
              hint="Active catalog items without orders in range"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Best selling by quantity */}
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase mb-3">
                Best-Selling Models (By Quantity)
              </h2>
              {report.bestSellingByQuantity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No sales in this date range.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-4 py-2">Product Name</th>
                      <th className="px-4 py-2 text-right">Units Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bestSellingByQuantity.map((p, i) => (
                      <tr key={p.productId || `${p.productName}-${i}`} className="border-t border-line hover:bg-alt/30 transition-colors">
                        <td className="px-4 py-2 font-medium text-ink flex items-center gap-2">
                          {p.productName}
                          {p.isCustomDesign && (
                            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent border border-accent/30">
                              Custom 3D
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-muted">{p.quantitySold} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Best selling by revenue */}
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-xs font-semibold tracking-wide text-muted uppercase mb-3">
                Top Revenue Generators (By Value)
              </h2>
              {report.bestSellingByRevenue.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No sales in this date range.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-4 py-2">Product Name</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.bestSellingByRevenue.map((p, i) => (
                      <tr key={p.productId || `${p.productName}-rev-${i}`} className="border-t border-line hover:bg-alt/30 transition-colors">
                        <td className="px-4 py-2 font-medium text-ink flex items-center gap-2">
                          {p.productName}
                          {p.isCustomDesign && (
                            <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent border border-accent/30">
                              Custom 3D
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold text-ink">{formatPrice(p.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
