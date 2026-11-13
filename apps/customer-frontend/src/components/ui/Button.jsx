const variants = {
  primary: 'bg-accent text-on-accent hover:bg-accent-dark hover:shadow-[0_0_20px_rgba(217,174,78,0.4)] active:scale-[0.97]',
  accent:  'bg-accent text-on-accent hover:bg-accent-dark hover:shadow-[0_0_20px_rgba(217,174,78,0.4)] active:scale-[0.97]',
  secondary: 'bg-surface text-ink border border-line hover:border-accent hover:text-accent hover:shadow-[0_0_16px_rgba(217,174,78,0.15)] active:scale-[0.97]',
  ghost: 'bg-transparent text-accent hover:bg-soft hover:shadow-[0_0_12px_rgba(217,174,78,0.1)] active:scale-[0.97]',
  danger: 'bg-danger text-white hover:bg-danger/90 hover:shadow-[0_4px_16px_rgba(179,50,31,0.4)] active:scale-[0.97]',
  hero: 'btn-glow bg-accent text-on-accent hover:bg-accent-dark hover:scale-[1.03] active:scale-[0.98]',
  hero2: 'bg-transparent text-ink border border-white/30 hover:border-accent hover:text-accent hover:scale-[1.03] active:scale-[0.98]',
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
      className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold font-sans tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
