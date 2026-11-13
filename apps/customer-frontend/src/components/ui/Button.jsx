import { useState } from 'react'

const baseVariant = {
  primary:   { base: 'bg-accent text-on-accent',                       hoverBg: '#A9823A', shadow: '0 0 20px rgba(217,174,78,0.4)' },
  accent:    { base: 'bg-accent text-on-accent',                       hoverBg: '#A9823A', shadow: '0 0 20px rgba(217,174,78,0.4)' },
  secondary: { base: 'bg-surface text-ink border border-line',         hoverBg: '',       shadow: '0 0 16px rgba(217,174,78,0.15)' },
  ghost:     { base: 'bg-transparent text-accent',                     hoverBg: '#161616', shadow: '0 0 12px rgba(217,174,78,0.1)' },
  danger:    { base: 'bg-danger text-white',                           hoverBg: '',       shadow: '0 4px 16px rgba(179,50,31,0.4)' },
  hero:      { base: 'bg-accent text-on-accent',                       hoverBg: '#A9823A', shadow: '0 0 28px rgba(217,174,78,0.55), 0 4px 16px rgba(0,0,0,0.4)' },
  hero2:     { base: 'bg-transparent text-ink border border-white/30', hoverBg: '',       shadow: '0 0 16px rgba(217,174,78,0.2)' },
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
  style = {},
  children,
  ...props
}) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const v = baseVariant[variant] || baseVariant.primary

  const hoverStyle = hovered ? {
    boxShadow: v.shadow,
    transform: pressed ? 'scale(0.97)' : (variant === 'hero' || variant === 'hero2') ? 'scale(1.03)' : 'scale(1.01)',
  } : {}

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-control font-semibold font-sans tracking-tight disabled:cursor-not-allowed disabled:opacity-45 disabled:pointer-events-none cursor-pointer ${v.base} ${sizes[size] || sizes.md} ${className}`}
      style={{
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        ...hoverStyle,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      {...props}
    >
      {children}
    </button>
  )
}
