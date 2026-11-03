const tones = {
  neutral: 'bg-ink/5 text-ink',
  accent: 'bg-accent-soft text-accent-dark',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
}

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
