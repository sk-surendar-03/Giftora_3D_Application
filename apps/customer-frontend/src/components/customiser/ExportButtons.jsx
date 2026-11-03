import { useState } from 'react'
import Button from '../ui/Button'
import { getReadableTextColor } from '../../features/customiser/contrastColor'

/**
 * Real STL/3MF download buttons, backed by the Step (d) export worker
 * (`GeometryClient.export()`). Downloads via a Blob + temporary <a>,
 * revoking the object URL immediately after the click so it doesn't leak.
 *
 * STL has no colour information at all (true of the file format itself,
 * not a limitation of this exporter). 3MF *does* carry colour, but the
 * worker's own default appearance (a fixed red/cream pair) has nothing to
 * do with the customer's actual colour choices unless told otherwise — so
 * `colorHex`/`textColorHex` are passed through as an explicit
 * `appearanceOverrides`, keeping the exported 3MF's colours in sync with
 * what the live preview and the customer actually picked.
 */
export default function ExportButtons({ client, params, fontDefinition, subtitleFontDefinition, canExport, allowDisconnected, colorHex, textColorHex }) {
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  async function handleExport(format) {
    if (!client || pending) return
    setPending(format)
    setError(null)
    try {
      const appearanceOverrides = colorHex
        ? { version: 1, base: colorHex, relief: textColorHex ?? getReadableTextColor(colorHex) }
        : undefined
      const file = await client.export(params, format, 'separate-colors', fontDefinition, appearanceOverrides, subtitleFontDefinition, allowDisconnected)
      const blob = new Blob([file.data], { type: file.mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.failure?.message ?? err?.message ?? 'Export failed. Please try again.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={!canExport || pending !== null} onClick={() => handleExport('stl')}>
          {pending === 'stl' ? 'Preparing STL…' : 'Download STL'}
        </Button>
        <Button variant="secondary" disabled={!canExport || pending !== null} onClick={() => handleExport('3mf')}>
          {pending === '3mf' ? 'Preparing 3MF…' : 'Download 3MF'}
        </Button>
      </div>
      {!canExport && <p className="mt-2 text-xs text-muted">Resolve the printability issues above to enable export.</p>}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  )
}
