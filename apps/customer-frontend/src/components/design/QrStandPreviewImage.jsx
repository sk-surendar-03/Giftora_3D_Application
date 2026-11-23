import { useEffect, useState } from 'react'
import { fetchQrStandPreviewBlob } from '../../features/qrStandStudio/api/qrStandDesignApi.js'

/**
 * A QR Stand design's preview image. Fetched privately with the customer's
 * sign-in token and shown from an in-memory object URL.
 */
export default function QrStandPreviewImage({ designId, hasPreview, alt, className = '' }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!designId || !hasPreview) return undefined
    const controller = new AbortController()
    let objectUrl
    fetchQrStandPreviewBlob(designId, controller.signal)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl(null)
    }
  }, [designId, hasPreview])

  if (url) return <img src={url} alt={alt || 'QR Stand preview'} className={`h-full w-full object-cover ${className}`} />
  return (
    <svg className="w-8 h-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect width="7" height="7" x="3" y="3" />
      <rect width="7" height="7" x="14" y="3" />
      <rect width="7" height="7" x="14" y="14" />
      <rect width="7" height="7" x="3" y="14" />
    </svg>
  )
}
