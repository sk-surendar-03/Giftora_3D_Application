const CATEGORY_NAMES = {
  'phone-stand': 'Phone Stand',
  'pen-holder': 'Pen Holder',
  'combined': 'Combined Stand & Pen',
  'desk-organizer': 'Desk Organizer',
  'personalized-gift': 'Personalized Gift',
}

export default function StandDetails({ config, category }) {
  if (!config && !category) return null

  const catName = CATEGORY_NAMES[category || config?.category] || category || config?.category || 'Stand'
  const text = config?.personalization?.text
  const finish = config?.appearance?.finish
  const theme = config?.appearance?.themeId

  return (
    <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
      <div className="flex gap-1">
        <dt>Type:</dt>
        <dd className="text-ink font-medium capitalize">{catName}</dd>
      </div>
      {text && (
        <div className="flex gap-1">
          <dt>Text:</dt>
          <dd className="text-ink font-medium">"{text}"</dd>
        </div>
      )}
      {finish && (
        <div className="flex gap-1">
          <dt>Finish:</dt>
          <dd className="text-ink font-medium capitalize">{finish.replace(/-/g, ' ')}</dd>
        </div>
      )}
      {theme && (
        <div className="flex gap-1">
          <dt>Theme:</dt>
          <dd className="text-ink font-medium capitalize">{theme.replace(/-/g, ' ')}</dd>
        </div>
      )}
    </dl>
  )
}
