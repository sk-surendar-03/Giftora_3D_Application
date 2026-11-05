const TONES = {
  success: 'border-[#17683f]/40 bg-[#e3f4ea] text-[#17683f]',
  error: 'border-danger/40 bg-[#fbe6e2] text-danger',
}

export default function Banner({ tone = 'error', children }) {
  if (!children) return null
  return <div className={`mb-4 rounded-control border px-4 py-2.5 text-[13.5px] font-semibold ${TONES[tone]}`}>{children}</div>
}
