import { useEffect, useState } from 'react'
import { fetchDesignPreviewBlob } from '../../features/customDesign/customDesignApi.js'

/**
 * A custom design's preview image. The file is private (only its owner can
 * read it), so it is fetched with the customer's sign-in token and shown
 * from an in-memory object URL — a plain <img src> couldn't send the token.
 */
export default function DesignPreviewImage({ designId, hasPreview, alt, className = '' }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!designId || !hasPreview) return undefined
    const controller = new AbortController()
    let objectUrl
    fetchDesignPreviewBlob(designId, controller.signal)
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
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z" />
    </svg>
  )
}
