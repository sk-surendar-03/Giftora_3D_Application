import Button from '../ui/Button'

export default function EmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border py-20 text-center">
      <h3 className="text-base font-semibold text-ink">No products match your filters</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Try removing a filter or searching for something else.
      </p>
      <Button variant="secondary" className="mt-6" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}
