import { useEffect, useState } from 'react'
import { fetchNameplatePreviewBlob } from '../../features/nameplateStudio/api/nameplateDesignApi.js'

/**
 * A nameplate design's preview image. Fetched privately with the customer's
 * sign-in token and shown from an in-memory object URL.
 */
export default function NameplatePreviewImage({ designId, hasPreview, alt, className = '' }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!designId || !hasPreview) return undefined
    const controller = new AbortController()
    let objectUrl
    fetchNameplatePreviewBlob(designId, controller.signal)
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

  if (url) return <img src={url} alt={alt || 'Nameplate preview'} className={`h-full w-full object-cover ${className}`} />
  return (
    <svg className="w-8 h-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect width="18" height="12" x="3" y="6" rx="2" />
      <path d="M7 12h10M7 9h6" />
    </svg>
  )
}
