const tones = {
  neutral: 'bg-soft text-accent-dark',
  accent: 'bg-secondary text-on-secondary',
  secondary: 'bg-secondary text-on-secondary',
  success: 'bg-[#e3f4ea] text-[#17683f]',
  warning: 'bg-[#fcefd0] text-[#8a5c00]',
  danger: 'bg-[#fbe6e2] text-[#a82d1a]',
}

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 rounded-full px-2.5 text-[11.5px] font-semibold font-sans tracking-normal ${tones[tone] || tones.neutral} ${className}`}
    >
      {children}
    </span>
  )
}
