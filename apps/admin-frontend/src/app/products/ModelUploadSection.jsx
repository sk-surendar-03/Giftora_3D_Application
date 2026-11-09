import { useRef, useState } from 'react'
import { deleteProductModel, uploadProductModel } from '../../features/products/productsApi.js'
import { formatBytes, MAX_MODEL_BYTES, validateModelFile } from '../../utils/modelFile.js'

function extractError(err) {
  return err.response?.data?.error ?? err.message ?? 'Upload failed.'
}

/**
 * 3D Model Upload (STL / 3MF), separate from the product images.
 * - Editing an existing product: the file uploads immediately, with progress.
 * - New product: the chosen file is staged and uploaded right after the
 *   product is created (the product needs an id first).
 */
export default function ModelUploadSection({ productId, model, onModelChange, stagedFile, onStage }) {
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const busy = progress !== null

  const current = stagedFile
    ? { name: stagedFile.name, size: stagedFile.size, format: stagedFile.name.split('.').pop().toLowerCase(), pending: true }
    : model
      ? { name: model.filename ?? `model.${model.format}`, size: model.sizeBytes, format: model.format, pending: false }
      : null

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-picking the same file
    if (!file) return
    setError(null)
    const problem = validateModelFile(file)
    if (problem) {
      setError(problem)
      return
    }
    if (!productId) {
      onStage(file)
      return
    }
    setProgress(0)
    try {
      const product = await uploadProductModel(productId, file, setProgress)
      onModelChange(product.model)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setProgress(null)
    }
  }

  async function handleRemove() {
    setError(null)
    if (stagedFile) {
      onStage(null)
      return
    }
    if (!window.confirm('Remove this 3D model from the product?')) return
    setProgress(0)
    try {
      await deleteProductModel(productId)
      onModelChange(null)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface/40 p-4 space-y-3">
      <div className="border-b border-line pb-2">
        <h3 className="text-sm font-semibold text-ink">3D Model Upload</h3>
        <p className="text-xs text-muted">
          Optional STL or 3MF model shown to customers in an interactive 3D preview (max {formatBytes(MAX_MODEL_BYTES)}). Kept separate from product images, and
          customers cannot download it from the storefront.
        </p>
      </div>

      {current ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">
              {current.name}{' '}
              <span className="ml-1 rounded bg-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">{current.format}</span>
            </p>
            <p className="text-xs text-muted">
              {formatBytes(current.size)}
              {current.pending && ' · will upload when you create the product'}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-soft disabled:opacity-50">
              Replace
            </button>
            <button type="button" disabled={busy} onClick={handleRemove} className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-danger hover:bg-soft disabled:opacity-50">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-md border border-dashed border-line px-4 py-6 text-sm text-muted hover:border-accent hover:text-ink disabled:opacity-50"
        >
          Choose an STL or 3MF file
        </button>
      )}

      <input ref={inputRef} type="file" accept=".stl,.3mf" onChange={handleFile} className="hidden" aria-label="Upload 3D model (STL or 3MF)" />

      {busy && (
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-soft">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted">Working… {progress}%</p>
        </div>
      )}

      {error && <p className="rounded-md bg-[#fbe6e2] px-3 py-2 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
