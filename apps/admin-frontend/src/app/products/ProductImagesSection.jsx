import { useState, useEffect, useRef } from 'react'
import { uploadProductImage } from '../../features/products/productsApi.js'
import { resolveImageUrl, extractImageFilename } from '../../utils/imageUrl.js'

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Upload failed.'
}

export default function ProductImagesSection({ images = [], onChange }) {
  const [items, setItems] = useState([])
  const [dragOverZone, setDragOverZone] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')
  const fileInputRef = useRef(null)
  const replaceInputRef = useRef(null)
  const replacingIndexRef = useRef(null)

  // Sync internal items from the `images` prop whenever it changes externally
  useEffect(() => {
    const propUrls = Array.isArray(images) ? images.filter(Boolean) : []
    setItems((prevItems) => {
      // If URLs already match the current state order, don't overwrite in-flight uploads
      const currentReadyUrls = prevItems
        .filter((it) => it.status === 'ready' && it.url)
        .map((it) => it.url)
      const matches =
        propUrls.length === currentReadyUrls.length &&
        propUrls.every((url, i) => url === currentReadyUrls[i])
      if (matches) return prevItems

      return propUrls.map((url, idx) => {
        const existing = prevItems.find((it) => it.url === url)
        if (existing) return existing
        return {
          id: `img-${idx}-${url}`,
          url,
          filename: extractImageFilename(url),
          sizeBytes: null,
          previewUrl: resolveImageUrl(url),
          status: 'ready',
          progress: 100,
          error: null,
        }
      })
    })
  }, [images])

  function notifyParent(updatedItems) {
    const validUrls = updatedItems
      .filter((it) => it.status === 'ready' && it.url)
      .map((it) => it.url)
    onChange?.(validUrls)
  }

  async function uploadFile(file, tempId) {
    try {
      const result = await uploadProductImage(file, (progress) => {
        setItems((prev) =>
          prev.map((it) => (it.id === tempId ? { ...it, progress } : it))
        )
      })

      setItems((prev) => {
        const next = prev.map((it) =>
          it.id === tempId
            ? {
                ...it,
                url: result.url,
                filename: result.filename,
                sizeBytes: result.sizeBytes,
                previewUrl: resolveImageUrl(result.url),
                status: 'ready',
                progress: 100,
                error: null,
              }
            : it
        )
        notifyParent(next)
        return next
      })
    } catch (err) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === tempId
            ? { ...it, status: 'error', error: extractError(err), progress: 0 }
            : it
        )
      )
    }
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return
    const validFiles = Array.from(files).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      return ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
    })

    if (validFiles.length === 0) {
      alert('Please select valid JPG, JPEG, PNG, or WEBP image files.')
      return
    }

    const newItems = validFiles.map((file, i) => {
      const tempId = `upload-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`
      const previewUrl = URL.createObjectURL(file)
      return {
        id: tempId,
        url: null,
        filename: file.name,
        sizeBytes: file.size,
        previewUrl,
        status: 'uploading',
        progress: 0,
        error: null,
        file,
      }
    })

    setItems((prev) => {
      const next = [...prev, ...newItems]
      // Trigger upload for each new item
      newItems.forEach((it) => uploadFile(it.file, it.id))
      return next
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOverZone(false)
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function handleRemove(idToRemove) {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== idToRemove)
      notifyParent(next)
      return next
    })
  }

  function handleRetry(item) {
    if (!item.file) return
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, status: 'uploading', progress: 0, error: null } : it
      )
    )
    uploadFile(item.file, item.id)
  }

  function handleMakePrimary(index) {
    if (index === 0) return
    setItems((prev) => {
      const target = prev[index]
      const rest = prev.filter((_, i) => i !== index)
      const next = [target, ...rest]
      notifyParent(next)
      return next
    })
  }

  function handleMove(index, targetIndex) {
    if (targetIndex < 0 || targetIndex >= items.length) return
    setItems((prev) => {
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      notifyParent(next)
      return next
    })
  }

  function handleReplace(index) {
    replacingIndexRef.current = index
    if (replaceInputRef.current) {
      replaceInputRef.current.value = ''
      replaceInputRef.current.click()
    }
  }

  function handleReplaceFileSelected(e) {
    const file = e.target.files?.[0]
    const index = replacingIndexRef.current
    if (!file || index === null || index === undefined || !items[index]) return

    const tempId = `replace-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const previewUrl = URL.createObjectURL(file)

    const updatedItem = {
      id: tempId,
      url: null,
      filename: file.name,
      sizeBytes: file.size,
      previewUrl,
      status: 'uploading',
      progress: 0,
      error: null,
      file,
    }

    setItems((prev) => {
      const next = [...prev]
      next[index] = updatedItem
      uploadFile(file, tempId)
      return next
    })
  }

  function handleAddUrl() {
    const trimmed = urlInputValue.trim()
    if (!trimmed) return
    const newItem = {
      id: `url-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: trimmed,
      filename: extractImageFilename(trimmed),
      sizeBytes: null,
      previewUrl: resolveImageUrl(trimmed),
      status: 'ready',
      progress: 100,
      error: null,
    }
    setItems((prev) => {
      const next = [...prev, newItem]
      notifyParent(next)
      return next
    })
    setUrlInputValue('')
    setShowUrlInput(false)
  }

  // Drag-and-drop reordering between image cards
  function onCardDragStart(e, index) {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onCardDragOver(e, index) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onCardDrop(e, targetIndex) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return
    handleMove(draggedIndex, targetIndex)
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-4 rounded-lg border border-line bg-surface/40 p-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleReplaceFileSelected}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-ink">Product Images</h3>
          <p className="text-xs text-muted">
            Upload multiple photos from various angles. The first photo is the primary cover image.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Upload Images
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOverZone(true)
        }}
        onDragLeave={() => setDragOverZone(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOverZone
            ? 'border-brand bg-brand/5'
            : 'border-line/80 bg-surface/60 hover:border-line hover:bg-surface'
        }`}
      >
        <svg
          className="mx-auto h-8 w-8 text-muted mb-2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p className="text-xs font-medium text-ink">
          Drag & drop product photos here, or <span className="text-accent underline font-semibold">browse</span>
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Supports JPG, JPEG, PNG, and WEBP (up to 15 MB each)
        </p>
      </div>

      {/* Uploaded Images List / Grid */}
      {items.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-muted font-medium px-1">
            <span>
              {items.length} {items.length === 1 ? 'image' : 'images'} · Drag cards or use arrows to reorder
            </span>
            <span className="text-accent font-semibold">Cover image is first</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((item, index) => {
              const isPrimary = index === 0
              const isUploading = item.status === 'uploading'
              const isError = item.status === 'error'

              return (
                <div
                  key={item.id}
                  draggable={!isUploading}
                  onDragStart={(e) => onCardDragStart(e, index)}
                  onDragOver={(e) => onCardDragOver(e, index)}
                  onDrop={(e) => onCardDrop(e, index)}
                  className={`relative flex flex-col rounded-lg border bg-surface p-2.5 shadow-xs transition-all ${
                    isPrimary
                      ? 'border-accent ring-1 ring-accent'
                      : isError
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-line hover:border-muted'
                  }`}
                >
                  {/* Image Preview Tile */}
                  <div className="relative aspect-square w-full rounded-md overflow-hidden bg-soft border border-line/60 flex items-center justify-center">
                    <img
                      src={item.previewUrl}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Fallback icon on broken image preview
                        e.currentTarget.style.display = 'none'
                      }}
                    />

                    {/* Primary Badge */}
                    {isPrimary && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-bold text-white shadow-sm">
                        ★ Primary Cover
                      </span>
                    )}

                    {/* Uploading Spinner & Progress */}
                    {isUploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent mb-2" />
                        <span className="text-xs font-semibold">Uploading {item.progress}%</span>
                        <div className="mt-1.5 h-1.5 w-full max-w-[100px] rounded-full bg-white/30 overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Overlay */}
                    {isError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 p-2 text-center text-white">
                        <svg className="h-6 w-6 text-red-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="text-[11px] font-semibold text-red-200 line-clamp-2">{item.error || 'Upload error'}</p>
                        {item.file && (
                          <button
                            type="button"
                            onClick={() => handleRetry(item)}
                            className="mt-2 rounded bg-white px-2 py-1 text-[11px] font-bold text-ink hover:bg-gray-100 cursor-pointer"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Image Details */}
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink text-[12px]" title={item.filename}>
                        {item.filename}
                      </p>
                      {item.sizeBytes && (
                        <p className="text-[10.5px] text-muted">{formatBytes(item.sizeBytes)}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 gap-1">
                    <div className="flex items-center gap-1">
                      {/* Set Primary Button */}
                      {!isPrimary && !isUploading && (
                        <button
                          type="button"
                          onClick={() => handleMakePrimary(index)}
                          className="rounded px-1.5 py-1 text-[11px] font-semibold text-muted hover:text-accent hover:bg-soft transition-colors cursor-pointer"
                          title="Set as primary cover image"
                        >
                          Make Cover
                        </button>
                      )}

                      {/* Replace Button */}
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => handleReplace(index)}
                          className="rounded px-1.5 py-1 text-[11px] font-semibold text-muted hover:text-ink hover:bg-soft transition-colors cursor-pointer"
                          title="Replace this image"
                        >
                          Replace
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Move Left / Up */}
                      <button
                        type="button"
                        disabled={index === 0 || isUploading}
                        onClick={() => handleMove(index, index - 1)}
                        className="rounded p-1 text-muted hover:text-ink hover:bg-soft disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move left"
                      >
                        ◀
                      </button>

                      {/* Move Right / Down */}
                      <button
                        type="button"
                        disabled={index === items.length - 1 || isUploading}
                        onClick={() => handleMove(index, index + 1)}
                        className="rounded p-1 text-muted hover:text-ink hover:bg-soft disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move right"
                      >
                        ▶
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Optional: Add external image URL toggle */}
      <div className="pt-1">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-xs text-muted hover:text-accent underline transition-colors cursor-pointer"
          >
            + Add external image URL
          </button>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="url"
              value={urlInputValue}
              onChange={(e) => setUrlInputValue(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs text-ink outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false)
                setUrlInputValue('')
              }}
              className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
