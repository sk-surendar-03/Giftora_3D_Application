import { useEffect, useState } from 'react'
import { fetchStandPreviewBlob } from '../../features/standDesign/standDesignApi.js'

/**
 * A stand design's preview image. The file is private (only its owner can
 * read it), so it is fetched with the customer's sign-in token and shown
 * from an in-memory object URL — a plain <img src> couldn't send the token.
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

  if (url) return <img src={url} alt={alt} className={`h-full w-full object-cover ${className}`} />
  return (
    <svg className="w-8 h-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="2" y="14" width="8" height="8" rx="1" />
      <path d="M10 18h4M14 14h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6" />
      <path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
    </svg>
  )
}
