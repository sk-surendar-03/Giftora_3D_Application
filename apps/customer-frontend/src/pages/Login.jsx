import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import Button from '../components/ui/Button'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // The 401 interceptor in api.js redirects here with ?session_expired=1&from=…
  // when a token expires mid-session (e.g. while on the customiser).
  const params = new URLSearchParams(location.search)
  const sessionExpired = params.get('session_expired') === '1'
  // Prefer the router state (set by navigate('/login', { state: { from } }))
  // then fall back to the query-param set by the axios interceptor.
  const redirectTo = location.state?.from ?? params.get('from') ?? params.get('redirect') ?? '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-bg text-ink min-h-[75vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-[420px] rounded-card border border-line bg-surface p-8">
        <div className="text-center mb-6">
          <img
            src="/jas-logo.png"
            alt="JAS 3D PRINTING"
            className="h-12 w-12 rounded-full mx-auto object-contain border border-line mb-3"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 className="font-display text-[28px] font-semibold text-ink m-0">Sign In</h1>
          <p className="mt-1 font-sans text-[14px] text-muted">Access your custom designs and orders.</p>
        </div>

        {sessionExpired && (
          <p className="mb-4 rounded-control bg-[#fef3cd] border border-[#f0c040] p-3 text-[13px] text-[#7a5700] font-medium">
            Your session expired. Please sign in again to continue.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="h-11 w-full rounded-control border border-line bg-surface px-3.5 text-[14.5px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="login-pass">
              Password
            </label>
            <input
              id="login-pass"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-control border border-line bg-surface px-3.5 text-[14.5px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
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
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-[13.5px] text-muted border-t border-line/60 pt-5">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
