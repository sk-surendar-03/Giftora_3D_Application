import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import Button from '../components/ui/Button'

const PHONE_RE = /^[0-9+\-() ]{6,20}$/

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Full name is required.')
      return
    }
    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    if (!phone.trim()) {
      setError('Phone number is required.')
      return
    }
    if (!PHONE_RE.test(phone.trim())) {
      setError('Please enter a valid phone number (at least 6 digits).')
      return
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      await register(name.trim(), email.trim(), password, phone.trim())
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-bg text-ink min-h-[75vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-[420px] rounded-card border border-line bg-surface p-8 shadow-sm">
        <div className="text-center mb-6">
          <img
            src="/jas-logo.png"
            alt="JAS 3D PRINTING"
            className="h-12 w-12 rounded-full mx-auto object-contain border border-line mb-3"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 className="font-display text-[28px] font-semibold text-ink m-0">Create Account</h1>
          <p className="mt-1 font-sans text-[14px] text-muted">Join JAS 3D PRINTING for personalized 3D precision keepsakes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="reg-name">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              id="reg-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Sharma"
              className="h-11 w-full rounded-control border border-line bg-surface px-3.5 text-[14.5px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="reg-email">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="h-11 w-full rounded-control border border-line bg-surface px-3.5 text-[14.5px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="reg-phone">
              Phone Number <span className="text-danger">*</span>
            </label>
            <input
              id="reg-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="h-11 w-full rounded-control border border-line bg-surface px-3.5 text-[14.5px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <span className="mt-1 block text-[11.5px] text-muted">Used for courier delivery updates and order fulfillment.</span>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="reg-pass">
              Password <span className="text-danger">*</span>
            </label>
            <input
              id="reg-pass"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-control border border-line bg-surface px-3.5 text-[14.5px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <span className="mt-1 block text-[11.5px] text-muted">Minimum 8 characters.</span>
          </div>

          {error && (
            <p className="rounded-control bg-[#fbe6e2] p-3 text-[13px] text-danger font-medium">{error}</p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
              className="w-full text-base font-semibold"
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-[13.5px] text-muted border-t border-line/60 pt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
