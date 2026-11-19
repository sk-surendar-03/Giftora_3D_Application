import { useEffect, useState } from 'react'
import { fetchStandPreviewBlob } from '../../features/standDesign/standDesignApi.js'

/**
 * A stand design's preview image. The file is private (only its owner can
 * read it), so it is fetched with the customer's sign-in token and shown
 * from an in-memory object URL.
 */
export default function StandPreviewImage({ designId, hasPreview, alt, className = '' }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!designId || !hasPreview) return undefined
    const controller = new AbortController()
    let objectUrl
    fetchStandPreviewBlob(designId, controller.signal)
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

  if (url) return <img src={url} alt={alt || 'Stand preview'} className={`h-full w-full object-cover ${className}`} />
  return (
    <svg className="w-8 h-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 19h16M7 19l2-10h6l2 10M9 9h6" />
    </svg>
  )
}
