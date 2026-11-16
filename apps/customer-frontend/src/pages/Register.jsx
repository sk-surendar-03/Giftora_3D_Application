import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import Button from '../components/ui/Button'

const PHONE_RE = /^[0-9]{10}$/

export default function Register() {
  const { registerRequest, registerVerify, registerResend } = useAuth()
  const navigate = useNavigate()

  // Step state: 'form' | 'otp'
  const [step, setStep] = useState('form')

  // Form input states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  // OTP state
  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)

  // Timers: 5-minute expiry (300s) & 60-second resend cooldown
  const [expiresIn, setExpiresIn] = useState(300)
  const [cooldown, setCooldown] = useState(60)
  const [sessionTerminated, setSessionTerminated] = useState(false)

  const otpInputRef = useRef(null)

  // Countdown timer for OTP expiration and resend cooldown
  useEffect(() => {
    if (step !== 'otp') return

    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0))
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [step])

  // Focus OTP input on transition to OTP step
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [step])

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // STEP 1: Submit registration details & request OTP
  async function handleFormSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)

    if (!name.trim()) { setError('Full name is required.'); return }
    if (!email.trim()) { setError('Email address is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return }
    if (!phone.trim()) { setError('Phone number is required.'); return }
    if (!PHONE_RE.test(phone.trim())) { setError('Phone number must be exactly 10 digits (numbers only).'); return }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setSubmitting(true)
    try {
      await registerRequest(name.trim(), email.trim(), password, phone.trim())
      setStep('otp')
      setOtp('')
      setExpiresIn(300)
      setCooldown(60)
      setSessionTerminated(false)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Unable to send verification code. Please check your details and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // STEP 2: Verify 6-digit OTP and complete registration
  async function handleOtpSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    if (expiresIn <= 0) {
      setError('Verification code has expired. Please request a new code.')
      return
    }

    setSubmitting(true)
    try {
      await registerVerify(email.trim(), otp.trim())
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Invalid verification code. Please try again.'
      setError(msg)
      if (msg.includes('terminated') || msg.includes('Too many incorrect attempts')) {
        setSessionTerminated(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // STEP 3: Resend OTP
  async function handleResend() {
    if (cooldown > 0 || submitting) return
    setError(null)
    setInfoMessage(null)
    setSubmitting(true)

    try {
      const res = await registerResend(email.trim())
      setCooldown(res?.resendCooldownSeconds ?? 60)
      setExpiresIn(300)
      setOtp('')
      setInfoMessage('A fresh verification code has been sent to your email.')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Unable to resend code. Please try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleBackToForm() {
    setStep('form')
    setError(null)
    setInfoMessage(null)
    setSessionTerminated(false)
  }

  return (
    <div className="bg-bg text-ink min-h-[75vh] flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-[440px] rounded-card border border-line bg-surface p-5 min-[761px]:p-8 shadow-sm">
        <div className="text-center mb-6">
          <img
            src="/jas-logo.png"
            alt="JAS 3D PRINTING"
            className="h-12 w-12 rounded-full mx-auto object-contain border border-line mb-3"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <h1 className="font-display text-[26px] font-semibold text-ink m-0">
            {step === 'form' ? 'Create Account' : 'Verify Your Email'}
          </h1>
          <p className="mt-1 font-sans text-[14px] text-muted">
            {step === 'form'
              ? 'Join JAS 3D PRINTING for personalized 3D precision keepsakes.'
              : 'Enter the 6-digit verification code sent to your email address.'}
          </p>
        </div>

        {/* STEP 1: Registration Form */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
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
                inputMode="numeric"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="h-11 w-full rounded-control border border-line bg-surface px-3.5 text-[14.5px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <span className="mt-1 block text-[11.5px] text-muted">10-digit mobile number. Used for delivery updates.</span>
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
                {submitting ? 'Sending verification code…' : 'Send Verification Code'}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: 6-Digit OTP Verification Card */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="rounded-control bg-bg/60 border border-line p-3 text-center">
              <span className="text-[12px] text-muted block mb-0.5">Verification code sent to</span>
              <span className="text-[14px] font-semibold text-accent break-all">{email}</span>
              <button
                type="button"
                onClick={handleBackToForm}
                className="block mx-auto mt-2 text-[12px] text-muted hover:text-ink underline cursor-pointer"
              >
                Change Email / Details
              </button>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-ink mb-2 text-center" htmlFor="otp-input">
                6-Digit Verification Code
              </label>
              <input
                id="otp-input"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                disabled={sessionTerminated || submitting}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="h-14 w-full rounded-control border border-line bg-surface text-center font-mono text-2xl font-bold tracking-[0.35em] text-ink placeholder:text-muted/40 focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-[12.5px] px-1">
              <span className={`font-mono ${expiresIn < 60 ? 'text-danger font-semibold' : 'text-muted'}`}>
                {expiresIn > 0 ? `Expires in ${formatTime(expiresIn)}` : 'Code expired'}
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || submitting || sessionTerminated}
                className={`font-semibold transition-colors ${
                  cooldown > 0 || sessionTerminated
                    ? 'text-muted/60 cursor-not-allowed'
                    : 'text-accent hover:underline cursor-pointer'
                }`}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>
            </div>

            {infoMessage && (
              <p className="rounded-control bg-accent/10 border border-accent/30 p-2.5 text-[13px] text-accent font-medium text-center">
                {infoMessage}
              </p>
            )}

            {error && (
              <p className="rounded-control bg-[#fbe6e2] p-3 text-[13px] text-danger font-medium text-center">
                {error}
              </p>
            )}

            <div className="pt-2 space-y-2">
              {!sessionTerminated ? (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting || otp.length !== 6 || expiresIn <= 0}
                  className="w-full text-base font-semibold"
                >
                  {submitting ? 'Verifying…' : 'Verify & Complete Registration'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleBackToForm}
                  className="w-full text-base font-semibold"
                >
                  Restart Registration
                </Button>
              )}
            </div>
          </form>
        )}

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
