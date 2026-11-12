import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth.js'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Shown when the 401 interceptor redirects here with ?session_expired=1
  const sessionExpired = new URLSearchParams(window.location.search).get('session_expired') === '1'

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? err.message ?? 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-ink p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-[420px] rounded-card border border-line bg-surface p-8">
        <div className="text-center mb-6">
          <img
            src="/jas-logo.png"
            alt="JAS 3D PRINTING"
            className="h-12 w-12 rounded-full mx-auto object-contain border border-line mb-3"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <span className="font-sans text-[11.5px] font-bold uppercase tracking-[0.16em] text-accent block">
            Industrial Console
          </span>
          <h1 className="font-display text-[24px] font-semibold text-ink mt-1 m-0">JAS 3D PRINTING Admin</h1>
          <p className="mt-1 font-sans text-[13.5px] text-muted">Sign in with administrative privileges.</p>
        </div>

        {sessionExpired && (
          <p className="mb-4 rounded-control bg-[#fef3cd] border border-[#f0c040] p-3 text-[13px] text-[#7a5700] font-medium">
            Your admin session expired. Please sign in again.
          </p>
        )}

        <label className="block text-[13px] font-semibold text-ink">
          Email Address
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 block w-full h-11 rounded-control border border-line bg-surface px-3.5 text-[14.5px] text-ink focus:border-accent focus:outline-none"
          />
        </label>

        <label className="mt-4 block text-[13px] font-semibold text-ink">
          Password
          <div className="relative mt-1.5">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full h-11 rounded-control border border-line bg-surface px-3.5 pr-11 text-[14.5px] text-ink focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-ink cursor-pointer"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </label>

        {error && (
          <p className="mt-4 rounded-control bg-[#fbe6e2] p-3 text-[13px] text-danger font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-control bg-accent text-on-accent text-[14.5px] font-semibold hover:bg-accent-dark transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Authenticating…' : 'Sign in to Console'}
        </button>
      </form>
    </div>
  )
}

export default Login
