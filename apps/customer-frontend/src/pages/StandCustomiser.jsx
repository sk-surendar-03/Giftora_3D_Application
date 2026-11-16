import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { createDefaultDesign } from '../features/standStudio/core/defaults'
import { buildStandAssembly, disposeAssembly } from '../features/standStudio/geometry/standBuilder'
import Button from '../components/ui/Button'

// ─── Category options ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'phone-stand',       name: 'Phone Stand',    emoji: '📱', description: 'Angled desktop phone rest' },
  { id: 'pen-holder',        name: 'Pen Holder',     emoji: '✏️', description: 'Multi-slot cup organiser' },
  { id: 'combined',          name: 'Combined',       emoji: '🖥️', description: 'Phone + pen in one stand' },
  { id: 'desk-organizer',    name: 'Desk Organiser', emoji: '🗂️', description: 'Full workstation caddy' },
  { id: 'personalized-gift', name: 'Gift Stand',     emoji: '🎁', description: 'Monogram or plinth gift' },
]

// ─── Material finish options ──────────────────────────────────────────────────
const FINISH_OPTIONS = [
  { id: 'matte',           label: 'Matte' },
  { id: 'satin',           label: 'Satin' },
  { id: 'metallic-gold',   label: 'Metallic Gold' },
  { id: 'metallic-silver', label: 'Metallic Silver' },
  { id: 'two-tone',        label: 'Two-Tone' },
  { id: 'wood-grain',      label: 'Wood Grain' },
]

// ─── Colour palette presets ───────────────────────────────────────────────────
const COLOR_PALETTES = [
  { id: 'dark-gold',   base: '#1a1a1a', text: '#D4AF37', label: 'Black & Gold' },
  { id: 'slate-blue',  base: '#1E293B', text: '#2563EB', label: 'Slate Blue' },
  { id: 'forest',      base: '#14532D', text: '#86efac', label: 'Forest' },
  { id: 'ivory',       base: '#F5F0E8', text: '#1a1a1a', label: 'Ivory' },
  { id: 'midnight',    base: '#0f172a', text: '#e2e8f0', label: 'Midnight' },
  { id: 'terracotta',  base: '#7c2d12', text: '#fde68a', label: 'Terracotta' },
]

function zoneColor(zone, colors) {
  return colors[zone] ?? colors.base ?? '#1E293B'
}

// ─── 3D Viewport ─────────────────────────────────────────────────────────────
function StandViewport({ assembly, loading, zoneColors }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
      <div
        className="absolute inset-0 rounded-card"
        style={{
          background: '#f3f6fb',
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <Canvas
        className="absolute inset-0 w-full h-full rounded-card"
        camera={{ position: [0, 120, 280], fov: 40 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[200, 300, 200]} intensity={1.2} castShadow />
        <directionalLight position={[-150, 100, -150]} intensity={0.4} />
        <Environment preset="studio" />
        <OrbitControls enablePan={false} minDistance={80} maxDistance={500} target={[0, 40, 0]} />
        {assembly && assembly.parts.map((part, i) => (
          <mesh key={i} geometry={part.geometry}>
            <meshStandardMaterial
              color={zoneColor(part.zone, zoneColors)}
              roughness={0.6}
              metalness={0.1}
            />
          </mesh>
        ))}
      </Canvas>

      <div className="absolute top-3 right-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
          loading ? 'bg-soft text-accent' : 'bg-[#e3f4ea] text-[#17683f]'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-accent animate-pulse' : 'bg-[#17683f]'}`} />
          {loading ? 'Rendering 3D solid' : 'Preview ready'}
        </span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StandCustomiser() {
  const [category, setCategory]     = useState('phone-stand')
  const [finish, setFinish]         = useState('matte')
  const [paletteId, setPaletteId]   = useState('dark-gold')
  const [personText, setPersonText] = useState('')
  const [engrave, setEngrave]       = useState(true)
  const [quantity, setQuantity]     = useState(1)
  const [assembly, setAssembly]     = useState(null)
  const [loading, setLoading]       = useState(false)

  const palette = COLOR_PALETTES.find(p => p.id === paletteId) ?? COLOR_PALETTES[0]

  const zoneColors = useMemo(() => ({
    base:   palette.base,
    back:   palette.base,
    cup:    palette.base,
    text:   palette.text,
    accent: palette.text,
  }), [palette])

  const design = useMemo(() => {
    const base = createDefaultDesign(category, 'minimalist')
    return {
      ...base,
      appearance: {
        ...base.appearance,
        finish,
        colors: {
          ...base.appearance.colors,
          base: palette.base,
          back: palette.base,
          cup: palette.base,
          text: palette.text,
          accent: palette.text,
        },
      },
      personalization: {
        ...base.personalization,
        enabled: personText.trim().length > 0,
        text: personText.trim(),
        mode: engrave ? 'engraved' : 'raised',
      },
    }
  }, [category, finish, palette, personText, engrave])

  const assemblyRef = useRef(null)
  useEffect(() => {
    setLoading(true)
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      try {
        const result = buildStandAssembly(design)
        if (!cancelled) {
          if (assemblyRef.current) disposeAssembly(assemblyRef.current)
          assemblyRef.current = result
          setAssembly(result)
        }
      } catch {
        // keep last assembly on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 150)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [design])

  function resetCustomisation() {
    setCategory('phone-stand')
    setFinish('matte')
    setPaletteId('dark-gold')
    setPersonText('')
    setEngrave(true)
    setQuantity(1)
  }

  return (
    <div className="mx-auto max-w-[1800px] px-10 max-[1040px]:px-7 max-[760px]:px-[18px] py-5">

      {/* Studio switcher pills */}
      <div className="mb-4 flex gap-3">
        <Link
          to="/customise"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-medium text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Name Keychain
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-accent bg-accent/10 px-4 py-1.5 text-[13px] font-semibold text-accent">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="14" width="8" height="8" rx="1" />
            <path d="M10 18h4M14 14h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6" />
            <path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
          </svg>
          Phone & Pen Stand
        </span>
      </div>

      {/* Top action bar */}
      <div className="mb-4 flex items-center justify-between">
        <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-accent">
          ← Browse products
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={resetCustomisation}>Reset</Button>
          <Link to="/cart">
            <Button variant="secondary" size="sm">Cart</Button>
          </Link>
        </div>
      </div>

      {/* 2-column workspace — identical grid to Customiser.jsx */}
      <div className="grid min-w-0 gap-6 min-[1041px]:grid-cols-[440px_minmax(0,1fr)] min-[1200px]:grid-cols-[460px_minmax(0,1fr)] min-[1041px]:items-start min-[1041px]:gap-8">

        {/* LEFT COLUMN */}
        <aside className="min-w-0 space-y-5 order-2 min-[1041px]:order-1">
          <div className="divide-y divide-line rounded-card border border-line bg-surface px-5">

            {/* Step 1: Stand Type */}
            <section className="py-4 first:pt-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">1. Stand Type</span>
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5">
                {CATEGORIES.map(cat => {
                  const isSelected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      aria-pressed={isSelected}
                      className={`group relative flex w-32 shrink-0 flex-col overflow-hidden rounded-[4px] border text-left transition-all cursor-pointer ${
                        isSelected ? 'border-accent bg-soft ring-1 ring-accent' : 'border-line bg-surface hover:border-accent/40'
                      }`}
                    >
                      <div className="flex h-20 w-full items-center justify-center bg-alt text-2xl">
                        {cat.emoji}
                      </div>
                      <div className="p-2">
                        <span className={`block truncate text-[12px] font-semibold ${isSelected ? 'text-accent' : 'text-ink group-hover:text-accent'}`}>
                          {cat.name}
                        </span>
                        <span className="mt-0.5 block line-clamp-1 text-[10.5px] text-muted">{cat.description}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Step 2: Colour Palette */}
            <section className="py-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">2. Colour Palette</span>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PALETTES.map(p => {
                  const isSelected = paletteId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaletteId(p.id)}
                      aria-pressed={isSelected}
                      title={p.label}
                      className={`flex items-center gap-2 rounded-control border px-3 py-2 text-left transition-colors cursor-pointer ${
                        isSelected ? 'border-accent bg-soft ring-1 ring-accent' : 'border-line bg-surface hover:border-accent/40'
                      }`}
                    >
                      <span className="flex gap-1">
                        <span className="h-4 w-4 rounded-full border border-line/40" style={{ background: p.base }} />
                        <span className="h-4 w-4 rounded-full border border-line/40" style={{ background: p.text }} />
                      </span>
                      <span className={`text-[12px] font-medium ${isSelected ? 'text-accent' : 'text-ink'}`}>{p.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Step 3: Material Finish */}
            <section className="py-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">3. Material Finish</span>
              <div className="grid grid-cols-2 gap-2.5">
                {FINISH_OPTIONS.map(f => {
                  const isSelected = finish === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFinish(f.id)}
                      aria-pressed={isSelected}
                      className={`rounded-control border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                        isSelected ? 'border-accent bg-soft ring-1 ring-accent' : 'border-line bg-surface hover:border-accent/40'
                      }`}
                    >
                      <span className={`block text-[13px] font-semibold ${isSelected ? 'text-accent' : 'text-ink'}`}>{f.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Step 4: Personalisation */}
            <section className="py-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">4. Personalisation (optional)</span>
              <input
                type="text"
                value={personText}
                maxLength={20}
                onChange={e => setPersonText(e.target.value.toUpperCase())}
                placeholder="e.g. JASVEL, DESK, STUDIO"
                className="block w-full h-[46px] rounded-control border border-line bg-surface px-3.5 text-[15px] font-medium text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
              {personText.trim().length > 0 && (
                <div className="mt-2 flex gap-2">
                  {['engraved', 'raised'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEngrave(mode === 'engraved')}
                      className={`flex-1 rounded-control border py-2 text-[12px] font-semibold capitalize transition-colors cursor-pointer ${
                        (mode === 'engraved') === engrave
                          ? 'border-accent bg-soft text-accent ring-1 ring-accent'
                          : 'border-line bg-surface text-muted hover:border-accent/40'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Step 5: Quantity */}
            <section className="py-4">
              <span className="mb-2 block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">5. Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-surface text-ink hover:border-accent transition-colors text-lg font-bold cursor-pointer"
                >
                  −
                </button>
                <span className="w-10 text-center font-sans text-[16px] font-semibold text-ink">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(99, q + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-control border border-line bg-surface text-ink hover:border-accent transition-colors text-lg font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </section>
          </div>

          {/* Order Summary card */}
          <div className="rounded-card border border-line bg-surface p-5 space-y-3">
            <span className="block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">Order Summary</span>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Stand type</span>
                <span className="font-medium text-ink">{CATEGORIES.find(c => c.id === category)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Finish</span>
                <span className="font-medium text-ink">{FINISH_OPTIONS.find(f => f.id === finish)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Colour</span>
                <span className="font-medium text-ink">{palette.label}</span>
              </div>
              {personText.trim() && (
                <div className="flex justify-between">
                  <span className="text-muted">Text</span>
                  <span className="font-medium text-ink">{personText.trim()} ({engrave ? 'engraved' : 'raised'})</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Quantity</span>
                <span className="font-medium text-ink">× {quantity}</span>
              </div>
            </div>
            <button
              type="button"
              className="mt-2 w-full rounded-control bg-accent py-3 text-[14px] font-bold text-on-accent hover:bg-accent/90 transition-colors cursor-pointer"
            >
              Add to Cart
            </button>
          </div>
        </aside>

        {/* RIGHT COLUMN — 3D Preview */}
        <main className="min-w-0 space-y-5 order-1 min-[1041px]:order-2 sticky top-0 max-[1040px]:z-20 max-[1040px]:pb-3 min-[1041px]:top-5">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h1 className="font-display text-[26px] max-[760px]:text-[22px] font-semibold text-ink leading-tight m-0">
                Design Your 3D Stand
              </h1>
              <p className="mt-1 font-sans text-[13px] text-muted">Real-time 3D solid model preview</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
              loading ? 'bg-soft text-accent' : 'bg-[#e3f4ea] text-[#17683f]'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-accent animate-pulse' : 'bg-[#17683f]'}`} />
              {loading ? 'Rendering 3D solid' : 'Preview ready'}
            </span>
          </div>

          <StandViewport assembly={assembly} loading={loading} zoneColors={zoneColors} />

          {/* Print facts — desktop only */}
          <div className="max-[1040px]:hidden rounded-card border border-line bg-surface p-4 space-y-2">
            <span className="block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase">Print Facts</span>
            <div className="grid grid-cols-3 gap-3 text-[12px]">
              <div className="rounded-[6px] bg-alt p-3">
                <span className="block text-muted mb-0.5">Material</span>
                <span className="font-semibold text-ink">PLA</span>
              </div>
              <div className="rounded-[6px] bg-alt p-3">
                <span className="block text-muted mb-0.5">Finish</span>
                <span className="font-semibold text-ink">{FINISH_OPTIONS.find(f => f.id === finish)?.label}</span>
              </div>
              <div className="rounded-[6px] bg-alt p-3">
                <span className="block text-muted mb-0.5">Qty</span>
                <span className="font-semibold text-ink">× {quantity}</span>
              </div>
            </div>
          </div>

          {/* Customisation summary — desktop only */}
          <div className="max-[1040px]:hidden rounded-card border border-line bg-surface p-4">
            <span className="block font-sans text-[12px] font-bold tracking-[0.14em] text-accent uppercase mb-3">Customisation Summary</span>
            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Type</span>
                <span className="font-medium text-ink">{CATEGORIES.find(c => c.id === category)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Palette</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                  <span className="h-3 w-3 rounded-full border border-line/40" style={{ background: palette.base }} />
                  <span className="h-3 w-3 rounded-full border border-line/40" style={{ background: palette.text }} />
                  {palette.label}
                </span>
              </div>
              {assembly && (
                <div className="flex justify-between">
                  <span className="text-muted">Volume</span>
                  <span className="font-medium text-ink">{assembly.solidVolumeCm3.toFixed(1)} cm³</span>
                </div>
              )}
              {assembly && (
                <div className="flex justify-between">
                  <span className="text-muted">Triangles</span>
                  <span className="font-medium text-ink">{assembly.triangleCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
