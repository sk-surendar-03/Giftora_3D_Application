import { useEffect, useState } from 'react'
import { fetchOrderItemPreviewBlob } from '../features/orders/ordersApi.js'

export default function AdminDesignPreview({ orderId, itemId, hasPreview, alt = '3D Design Preview' }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(Boolean(hasPreview))

  useEffect(() => {
    if (!orderId || !itemId || !hasPreview) {
      setLoading(false)
      return undefined
    }
    const controller = new AbortController()
    let objectUrl
    setLoading(true)
    fetchOrderItemPreviewBlob(orderId, itemId, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl(null)
    }
  }, [orderId, itemId, hasPreview])

  if (url) {
    return <img src={url} alt={alt} className="h-full w-full object-cover" />
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-soft text-muted">
      {loading ? (
        <span className="text-[10px] uppercase tracking-wider text-muted animate-pulse">Loading…</span>
      ) : (
        <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
        </svg>
      )}
    </div>
  )
}
