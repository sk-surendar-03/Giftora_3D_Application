/**
 * Consistent pagination control across Admin management tables.
 *
 * @param {object} props
 * @param {number} props.page - 1-based current page
 * @param {number} [props.pageSize=20] - Records per page
 * @param {number} props.total - Total number of records
 * @param {number} props.totalPages - Total number of pages
 * @param {(newPage: number) => void} props.onPageChange - Page change callback
 */
export default function Pagination({ page = 1, pageSize = 20, total = 0, totalPages = 1, onPageChange }) {
  if (total === 0 && totalPages <= 1) {
    return null
  }

  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endRecord = Math.min(total, page * pageSize)

  // Generate page numbers with ellipses if many pages
  const pages = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else if (page <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages)
  } else if (page >= totalPages - 3) {
    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
  } else {
    pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
  }

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
      {/* Information text */}
      <div>
        Showing <span className="font-semibold text-ink">{startRecord}</span>–
        <span className="font-semibold text-ink">{endRecord}</span> of{' '}
        <span className="font-semibold text-ink">{total}</span>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-control border border-line bg-surface px-2.5 font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink cursor-pointer"
          aria-label="Previous page"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>Previous</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-muted select-none">
                  …
                </span>
              )
            }

            const isCurrent = p === page
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-control px-2 font-medium transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-accent text-on-accent font-bold shadow-sm'
                    : 'border border-line bg-surface text-ink hover:border-accent hover:text-accent'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next Button */}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-control border border-line bg-surface px-2.5 font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink cursor-pointer"
          aria-label="Next page"
        >
          <span>Next</span>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
