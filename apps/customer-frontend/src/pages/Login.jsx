import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(location.state?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">Login</h1>
      <p className="mt-1 text-sm text-muted">Access your account.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 block w-full rounded-control border border-border px-3.5 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-control bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-ink hover:text-accent-dark">
          Create one
        </Link>
      </p>
    </div>
  )
}
