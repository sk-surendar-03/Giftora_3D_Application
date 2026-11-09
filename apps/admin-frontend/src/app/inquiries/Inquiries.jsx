import { useEffect, useState } from 'react'
import Banner from '../../components/Banner.jsx'
import Pagination from '../../components/Pagination.jsx'
import { fetchInquiries, updateInquiryStatus } from '../../features/inquiries/inquiriesApi.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Something went wrong.'
}

function formatDate(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_BADGES = {
  NEW: { label: 'New', className: 'bg-accent/15 text-accent border border-accent/30' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  RESOLVED: { label: 'Resolved', className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  function load() {
    setIsLoading(true)
    setError(null)
    fetchInquiries({
      page,
      pageSize: 20,
      status: statusFilter || undefined,
      search: search.trim() || undefined,
    })
      .then((result) => {
        setInquiries(result.inquiries || [])
        if (result?.meta) {
          setMeta(result.meta)
        }
      })
      .catch((err) => setError(extractError(err)))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [statusFilter, search, page])

  async function handleStatusChange(id, newStatus) {
    setUpdatingId(id)
    setError(null)
    setSuccessMessage(null)
    try {
      const { inquiry } = await updateInquiryStatus(id, newStatus)
      setInquiries((prev) => prev.map((item) => (item.id === id ? inquiry : item)))
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry(inquiry)
      }
      setSuccessMessage(`Inquiry marked as ${newStatus.replace('_', ' ')}.`)
      window.dispatchEvent(new CustomEvent('giftora:inquiries-updated'))
    } catch (err) {
      setError(extractError(err))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
            Customer Support
          </span>
          <h1 className="font-display text-[28px] font-semibold text-ink leading-tight mt-1 m-0">
            Customer Inquiries
          </h1>
          <p className="mt-1 text-xs text-muted">
            Review and resolve messages submitted through the Customer Contact Us page.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by customer name, email, or subject..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="h-9 w-72 rounded-control border border-line bg-surface px-3 text-xs text-ink placeholder:text-muted outline-none focus:border-accent"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-control border border-line bg-surface px-3 text-xs text-ink outline-none focus:border-accent cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>

        {(statusFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setStatusFilter('')
              setSearch('')
              setPage(1)
            }}
            className="text-xs text-muted hover:text-ink underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <Banner tone="error">{error}</Banner>
      <Banner tone="success">{successMessage}</Banner>

      {/* Table matching Products table styling */}
      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted">Loading customer inquiries…</p>
      ) : inquiries.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-12 text-center text-sm text-muted">
          No customer inquiries found.
        </div>
      ) : (
        <table className="w-full overflow-hidden rounded-lg border border-line bg-surface text-sm">
          <thead className="bg-bg text-left text-xs font-medium tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2">Inquiry ID</th>
              <th className="px-4 py-2">Customer Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Submitted</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => {
              const badge = STATUS_BADGES[inquiry.status] || STATUS_BADGES.NEW
              return (
                <tr key={inquiry.id} className="border-t border-line hover:bg-alt/30 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs text-accent">
                    #{inquiry.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-2 font-medium text-ink">{inquiry.name}</td>
                  <td className="px-4 py-2 text-muted">{inquiry.email}</td>
                  <td className="px-4 py-2 text-muted font-mono text-xs">{inquiry.phone}</td>
                  <td className="px-4 py-2 text-ink max-w-[200px] truncate" title={inquiry.subject}>
                    {inquiry.subject}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted whitespace-nowrap">
                    {formatDate(inquiry.createdAt)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="text-accent hover:underline font-medium text-xs mr-3"
                    >
                      View Details
                    </button>
                    <select
                      value={inquiry.status}
                      disabled={updatingId === inquiry.id}
                      onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                      className="h-7 rounded border border-line bg-surface px-2 text-[11px] text-ink outline-none focus:border-accent cursor-pointer"
                    >
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {!isLoading && inquiries.length > 0 && (
        <Pagination
          page={meta?.page ?? page}
          pageSize={20}
          total={meta?.total ?? inquiries.length}
          totalPages={meta?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}

      {/* Inquiry Details Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-card border border-line bg-surface p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-accent">
                  INQUIRY #{selectedInquiry.id.slice(-6).toUpperCase()}
                </span>
                <h2 className="font-display text-xl font-semibold text-ink mt-1 m-0">
                  {selectedInquiry.subject}
                </h2>
                <span className="text-xs text-muted mt-0.5 block">
                  Received on {formatDate(selectedInquiry.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="text-muted hover:text-ink text-lg px-2"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Sender Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-alt/50 p-3.5 rounded-control border border-line">
              <div>
                <span className="text-muted block">Customer Name</span>
                <span className="font-semibold text-ink text-sm mt-0.5 block">{selectedInquiry.name}</span>
              </div>
              <div>
                <span className="text-muted block">Email Address</span>
                <a href={`mailto:${selectedInquiry.email}`} className="font-medium text-accent hover:underline text-sm mt-0.5 block">
                  {selectedInquiry.email} ↗
                </a>
              </div>
              <div>
                <span className="text-muted block">Phone Number</span>
                <a href={`tel:${selectedInquiry.phone}`} className="font-mono text-ink text-sm mt-0.5 block">
                  {selectedInquiry.phone}
                </a>
              </div>
              <div>
                <span className="text-muted block">Current Status</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                    (STATUS_BADGES[selectedInquiry.status] || STATUS_BADGES.NEW).className
                  }`}>
                    {(STATUS_BADGES[selectedInquiry.status] || STATUS_BADGES.NEW).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
                Message Content
              </span>
              <div className="rounded-control border border-line bg-alt p-4 text-sm text-ink whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Status Update & Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted font-medium">Update Status:</span>
                {['NEW', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={updatingId === selectedInquiry.id || selectedInquiry.status === st}
                    onClick={() => handleStatusChange(selectedInquiry.id, st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                      selectedInquiry.status === st
                        ? 'bg-accent text-on-accent border-accent cursor-default'
                        : 'border-line text-muted hover:text-ink hover:border-muted'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="rounded-control border border-line bg-alt px-4 py-1.5 text-xs font-medium text-ink hover:bg-soft"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
