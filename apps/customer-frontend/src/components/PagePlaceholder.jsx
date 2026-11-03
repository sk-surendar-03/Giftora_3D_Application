export default function PagePlaceholder({ title, description }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      {description && <p className="mt-2 text-muted">{description}</p>}
    </div>
  )
}
