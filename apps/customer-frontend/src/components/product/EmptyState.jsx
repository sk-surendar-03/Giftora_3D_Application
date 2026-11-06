import Button from '../ui/Button'

export default function EmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-[#776338] bg-soft py-20 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent mb-4">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <h3 className="font-sans text-[17px] font-semibold text-ink m-0">No products match your filters</h3>
      <p className="mt-2 max-w-sm font-sans text-[14px] text-muted leading-relaxed">
        Try adjusting your search query, clearing material tags, or resetting filters.
      </p>
      <Button variant="secondary" size="md" className="mt-6" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}
