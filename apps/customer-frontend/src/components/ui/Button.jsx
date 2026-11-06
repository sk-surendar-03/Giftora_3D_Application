const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-dark',
  accent: 'bg-accent text-on-accent hover:bg-accent-dark',
  secondary: 'bg-surface text-ink border border-border hover:border-accent hover:text-accent',
  ghost: 'bg-transparent text-accent hover:bg-soft',
  danger: 'bg-danger text-white hover:bg-danger/90',
  hero: 'bg-accent text-on-accent hover:bg-accent-dark',
  hero2: 'bg-transparent text-ink border border-white/30 hover:border-white/60',
}

const sizes = {
  sm: 'h-[38px] px-4 text-[13.5px]',
  md: 'h-[48px] px-6 text-[14.5px]',
  lg: 'h-[54px] px-[30px] text-[15.5px]',
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
      className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold font-sans tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
