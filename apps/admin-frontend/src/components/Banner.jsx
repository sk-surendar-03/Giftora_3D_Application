const TONES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-700',
}

export default function Banner({ tone = 'error', children }) {
  if (!children) return null
  return <div className={`mb-4 rounded-md border px-4 py-2.5 text-sm ${TONES[tone]}`}>{children}</div>
}
