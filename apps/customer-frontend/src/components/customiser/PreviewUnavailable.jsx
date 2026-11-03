export default function PreviewUnavailable({ message }) {
  return (
    <div className="flex aspect-square w-full flex-col items-center justify-center rounded-card border border-border bg-ink/5 p-6 text-center">
      <p className="text-sm font-medium text-ink">3D preview unavailable</p>
      <p className="mt-1.5 max-w-xs text-xs text-muted">{message}</p>
    </div>
  )
}
