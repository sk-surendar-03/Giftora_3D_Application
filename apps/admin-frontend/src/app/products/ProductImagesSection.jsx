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

// Popup for assigning materials/colors to an image
function MaterialFilterPopup({ materials, colorsByMaterial, assigned, onToggle, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [onClose])

  // Collect unique colors across all materials
  const allColors = []
  const seen = new Set()
  if (colorsByMaterial && typeof colorsByMaterial === 'object') {
    Object.values(colorsByMaterial).forEach((cols) => {
      if (Array.isArray(cols)) {
        cols.forEach((c) => {
          const key = c.label || c
          if (!seen.has(key)) { seen.add(key); allColors.push(c) }
        })
      }
    })
  }

  const hasAnything = (materials && materials.length > 0) || allColors.length > 0

  if (!hasAnything) {
    return (
      <div ref={ref} className="absolute top-10 right-0 z-50 w-52 rounded-lg border border-line bg-[#141414] shadow-2xl p-3 text-xs text-muted">
        Add materials or colors first to tag this image.
      </div>
    )
  }

  return (
    <div ref={ref} className="absolute top-10 right-0 z-50 w-56 rounded-lg border border-line bg-[#141414] shadow-2xl p-3 space-y-3 max-h-72 overflow-y-auto">
      {materials && materials.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider pb-1 border-b border-line">Materials</p>
          {materials.map((mat) => {
            const checked = assigned.includes(mat)
            return (
              <label key={mat} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={checked} onChange={() => onToggle(mat)} className="h-3.5 w-3.5 accent-amber-500" />
                <span className={`text-[12px] ${checked ? 'text-ink font-semibold' : 'text-muted'}`}>{mat}</span>
              </label>
            )
          })}
        </div>
      )}

      {allColors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider pb-1 border-b border-line">Colors</p>
          <div className="flex flex-wrap gap-1.5">
            {allColors.map((c) => {
              const label = c.label || c
              const hex = c.hex || c
              const checked = assigned.includes(label)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onToggle(label)}
                  title={label}
                  className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] cursor-pointer transition-colors ${
                    checked ? 'border-accent bg-accent/20 text-accent font-semibold' : 'border-line text-muted hover:border-muted'
                  }`}
                >
                  <span className="h-3 w-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: hex }} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted pt-1 border-t border-line">Untagged = shows for all</p>
    </div>
  )
}

export default function ProductImagesSection({ images = [], onChange, materials = [], colorsByMaterial = {}, imageMaterials = {}, onImageMaterialsChange }) {
  const [items, setItems] = useState([])
  const [dragOverZone, setDragOverZone] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')
  const [filterPopupId, setFilterPopupId] = useState(null)
  const fileInputRef = useRef(null)
  const replaceInputRef = useRef(null)
  const replacingIndexRef = useRef(null)

  useEffect(() => {
    const propUrls = Array.isArray(images) ? images.filter(Boolean) : []
    setItems((prevItems) => {
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

  function handleToggleMaterial(imageUrl, mat) {
    const current = imageMaterials[imageUrl] || []
    const next = current.includes(mat)
      ? current.filter((m) => m !== mat)
      : [...current, mat]
    const updated = { ...imageMaterials, [imageUrl]: next }
    // Clean up empty arrays
    if (next.length === 0) delete updated[imageUrl]
    onImageMaterialsChange?.(updated)
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
      newItems.forEach((it) => uploadFile(it.file, it.id))
      return next
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOverZone(false)
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files)
  }

  function handleRemove(idToRemove) {
    setItems((prev) => {
      const item = prev.find((it) => it.id === idToRemove)
      const next = prev.filter((it) => it.id !== idToRemove)
      notifyParent(next)
      // Clean up material tags for this image
      if (item?.url && imageMaterials[item.url]) {
        const updated = { ...imageMaterials }
        delete updated[item.url]
        onImageMaterialsChange?.(updated)
      }
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

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOverZone(true) }}
        onDragLeave={() => setDragOverZone(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOverZone ? 'border-brand bg-brand/5' : 'border-line/80 bg-surface/60 hover:border-line hover:bg-surface'
        }`}
      >
        <svg className="mx-auto h-8 w-8 text-muted mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p className="text-xs font-medium text-ink">
          Drag & drop product photos here, or <span className="text-accent underline font-semibold">browse</span>
        </p>
        <p className="mt-1 text-[11px] text-muted">Supports JPG, JPEG, PNG, and WEBP (up to 15 MB each)</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-muted font-medium px-1">
            <span>{items.length} {items.length === 1 ? 'image' : 'images'} · Drag cards or use arrows to reorder</span>
            <span className="text-accent font-semibold">Cover image is first</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((item, index) => {
              const isPrimary = index === 0
              const isUploading = item.status === 'uploading'
              const isError = item.status === 'error'
              const assignedMaterials = (item.url && imageMaterials[item.url]) || []
              const hasFilter = assignedMaterials.length > 0
              const isFilterOpen = filterPopupId === item.id

              return (
                <div
                  key={item.id}
                  draggable={!isUploading}
                  onDragStart={(e) => onCardDragStart(e, index)}
                  onDragOver={(e) => onCardDragOver(e, index)}
                  onDrop={(e) => onCardDrop(e, index)}
                  className={`relative flex flex-col rounded-lg border bg-surface p-2.5 shadow-xs transition-all ${
                    isPrimary ? 'border-accent ring-1 ring-accent' : isError ? 'border-red-400 bg-red-50/20' : 'border-line hover:border-muted'
                  }`}
                >
                  {/* Image Preview — overflow hidden; popup is rendered OUTSIDE this div */}
                  <div className="relative aspect-square w-full rounded-md overflow-hidden bg-soft border border-line/60 flex items-center justify-center">
                    <img
                      src={item.previewUrl}
                      alt={item.filename}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />

                    {isPrimary && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-bold text-white shadow-sm">
                        ★ Primary Cover
                      </span>
                    )}

                    {/* Filter button sits inside image for visual placement */}
                    {item.url && !isUploading && (materials.length > 0 || Object.keys(colorsByMaterial).length > 0) && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFilterPopupId(isFilterOpen ? null : item.id) }}
                        title="Assign to materials / colors"
                        className={`absolute top-2 right-2 inline-flex items-center justify-center h-7 w-7 rounded-full shadow-md border transition-colors cursor-pointer ${
                          hasFilter ? 'bg-accent border-accent text-white' : 'bg-black/60 border-white/20 text-white hover:bg-black/80'
                        }`}
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                      </button>
                    )}

                    {isUploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent mb-2" />
                        <span className="text-xs font-semibold">Uploading {item.progress}%</span>
                        <div className="mt-1.5 h-1.5 w-full max-w-[100px] rounded-full bg-white/30 overflow-hidden">
                          <div className="h-full bg-accent transition-all duration-150" style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                    )}

                    {isError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 p-2 text-center text-white">
                        <svg className="h-6 w-6 text-red-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p className="text-[11px] font-semibold text-red-200 line-clamp-2">{item.error || 'Upload error'}</p>
                        {item.file && (
                          <button type="button" onClick={() => handleRetry(item)} className="mt-2 rounded bg-white px-2 py-1 text-[11px] font-bold text-ink hover:bg-gray-100 cursor-pointer">Retry</button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Popup rendered outside overflow-hidden, relative to card */}
                  {isFilterOpen && (
                    <MaterialFilterPopup
                      materials={materials}
                      colorsByMaterial={colorsByMaterial}
                      assigned={assignedMaterials}
                      onToggle={(tag) => handleToggleMaterial(item.url, tag)}
                      onClose={() => setFilterPopupId(null)}
                    />
                  )}

                  {/* Material tags below image */}
                  {hasFilter && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {assignedMaterials.map((m) => (
                        <span key={m} className="rounded-full bg-accent/20 border border-accent/40 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{m}</span>
                      ))}
                    </div>
                  )}

                  {/* Image Details */}
                  <div className="mt-2 flex items-center justify-between gap-1 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink text-[12px]" title={item.filename}>{item.filename}</p>
                      {item.sizeBytes && <p className="text-[10.5px] text-muted">{formatBytes(item.sizeBytes)}</p>}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 gap-1">
                    <div className="flex items-center gap-1">
                      {!isPrimary && !isUploading && (
                        <button type="button" onClick={() => handleMakePrimary(index)} className="rounded px-1.5 py-1 text-[11px] font-semibold text-muted hover:text-accent hover:bg-soft transition-colors cursor-pointer" title="Set as primary cover image">
                          Make Cover
                        </button>
                      )}
                      {!isUploading && (
                        <button type="button" onClick={() => handleReplace(index)} className="rounded px-1.5 py-1 text-[11px] font-semibold text-muted hover:text-ink hover:bg-soft transition-colors cursor-pointer" title="Replace this image">
                          Replace
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button type="button" disabled={index === 0 || isUploading} onClick={() => handleMove(index, index - 1)} className="rounded p-1 text-muted hover:text-ink hover:bg-soft disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" title="Move left">◀</button>
                      <button type="button" disabled={index === items.length - 1 || isUploading} onClick={() => handleMove(index, index + 1)} className="rounded p-1 text-muted hover:text-ink hover:bg-soft disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" title="Move right">▶</button>
                      <button type="button" onClick={() => handleRemove(item.id)} className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer" title="Remove image">
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

      <div className="pt-1">
        {!showUrlInput ? (
          <button type="button" onClick={() => setShowUrlInput(true)} className="text-xs text-muted hover:text-accent underline transition-colors cursor-pointer">
            + Add external image URL
          </button>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <input type="url" value={urlInputValue} onChange={(e) => setUrlInputValue(e.target.value)} placeholder="https://example.com/photo.jpg" className="flex-1 rounded-md border border-line px-3 py-1.5 text-xs text-ink outline-none focus:border-brand" />
            <button type="button" onClick={handleAddUrl} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 cursor-pointer">Add</button>
            <button type="button" onClick={() => { setShowUrlInput(false); setUrlInputValue('') }} className="rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:text-ink cursor-pointer">Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}
