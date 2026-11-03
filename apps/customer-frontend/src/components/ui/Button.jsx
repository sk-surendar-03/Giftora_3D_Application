const variants = {
  primary: 'bg-ink text-paper hover:bg-ink/90',
  accent: 'bg-accent text-white hover:bg-accent-dark',
  secondary: 'bg-surface text-ink border border-border hover:border-ink/30',
  ghost: 'text-ink hover:bg-ink/5',
}

const sizes = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-sm',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-control font-medium tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
