import { useState } from 'react'
import Button from '../components/ui/Button'
import { submitContactInquiry } from '../features/contact/contactApi.js'

const PHONE_RE = /^[0-9]{10}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
    if (serverError) setServerError(null)
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required.'

    if (!form.email.trim()) {
      errs.email = 'Email address is required.'
    } else if (!EMAIL_RE.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.'
    }

    if (!form.phone.trim()) {
      errs.phone = 'Phone number is required.'
    } else if (!PHONE_RE.test(form.phone.trim())) {
      errs.phone = 'Phone must be exactly 10 digits (numbers only).'
    }

    if (!form.subject.trim()) errs.subject = 'Subject is required.'
    if (!form.message.trim()) {
      errs.message = 'Message is required.'
    } else if (form.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters long.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate() || submitting) return

    setSubmitting(true)
    setServerError(null)
    try {
      await submitContactInquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      setSubmitted(true)
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      setServerError(
        err.response?.data?.error ?? 'Unable to send your inquiry at this moment. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-bg text-ink min-h-[80vh] pb-20">
      <div className="mx-auto max-w-[1100px] px-10 max-[760px]:px-[18px] py-12">
        {/* Header */}
        <div className="pb-6 border-b border-line mb-10">
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.16em] text-accent block">
            Customer Support
          </span>
          <h1 className="font-display text-[40px] max-[760px]:text-[30px] font-semibold text-ink leading-[1.12] tracking-[-0.02em] mt-2">
            Contact Us
          </h1>
          <p className="mt-2 text-base text-muted max-w-2xl leading-relaxed">
            Have questions about your custom 3D printed keepsake, manufacturing specifications, or delivery status?
            Our team is here to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 min-[900px]:grid-cols-[1.5fr_1fr] gap-12 items-start">
          {/* Left Column: Contact Form or Success Confirmation */}
          <div className="rounded-card border border-line bg-surface p-7 sm:p-9 shadow-sm">
            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-[#e3f4ea] text-[#17683f] flex items-center justify-center text-3xl font-bold">
                  ✓
                </div>
                <h3 className="font-display text-2xl font-semibold text-ink m-0">Inquiry Sent Successfully!</h3>
                <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to JAS 3D PRINTING. We have received your inquiry and our support team will respond to you within 24 business hours.
                </p>
                <div className="pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSubmitted(false)
                      setErrors({})
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <h2 className="font-display text-xl font-semibold text-ink m-0 pb-1">
                  Send Us a Message
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="c-name">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className={`h-11 w-full rounded-control border px-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-danger focus:border-danger focus:ring-danger/20'
                        : 'border-line focus:border-accent focus:ring-accent/30'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-danger font-medium">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="c-email">
                      Email Address <span className="text-danger">*</span>
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="name@domain.com"
                      className={`h-11 w-full rounded-control border px-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 ${
                        errors.email
                          ? 'border-danger focus:border-danger focus:ring-danger/20'
                          : 'border-line focus:border-accent focus:ring-accent/30'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-danger font-medium">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="c-phone">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      id="c-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      className={`h-11 w-full rounded-control border px-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 ${
                        errors.phone
                          ? 'border-danger focus:border-danger focus:ring-danger/20'
                          : 'border-line focus:border-accent focus:ring-accent/30'
                      }`}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-danger font-medium">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="c-subject">
                    Subject <span className="text-danger">*</span>
                  </label>
                  <input
                    id="c-subject"
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                    placeholder="e.g. Order Tracking Inquiry / Custom 3D Design Assistance"
                    className={`h-11 w-full rounded-control border px-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 ${
                      errors.subject
                        ? 'border-danger focus:border-danger focus:ring-danger/20'
                        : 'border-line focus:border-accent focus:ring-accent/30'
                    }`}
                  />
                  {errors.subject && <p className="mt-1 text-xs text-danger font-medium">{errors.subject}</p>}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-ink mb-1.5" htmlFor="c-message">
                    Message <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="c-message"
                    rows={5}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder="Please describe your query or detail any order requirements..."
                    className={`w-full rounded-control border p-3.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 ${
                      errors.message
                        ? 'border-danger focus:border-danger focus:ring-danger/20'
                        : 'border-line focus:border-accent focus:ring-accent/30'
                    }`}
                  />
                  {errors.message && <p className="mt-1 text-xs text-danger font-medium">{errors.message}</p>}
                </div>

                {serverError && (
                  <div className="rounded-control bg-[#fbe6e2] p-3.5 text-sm text-danger font-medium">
                    {serverError}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={submitting}
                    className="w-full text-base font-semibold"
                  >
                    {submitting ? 'Sending inquiry…' : 'Submit Inquiry'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Company & Support Information */}
          <div className="space-y-6">
            <div className="rounded-card border border-line bg-surface p-7 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-line mb-4">
                <img
                  src="/jas-logo.png"
                  alt="JAS 3D PRINTING"
                  className="h-11 w-11 rounded-full object-contain border border-line"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink m-0">JAS 3D PRINTING</h3>
                  <span className="text-xs text-accent font-semibold tracking-wide uppercase">Industrial Precision</span>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-1">Support Availability</h4>
                  <p className="text-muted leading-relaxed">
                    Monday to Saturday, 9:00 AM – 6:00 PM IST.<br />
                    Inquiries submitted on Sundays are answered the next business day.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-1">Response Time</h4>
                  <p className="text-muted leading-relaxed">
                    We typically respond to customer support and custom manufacturing requests within 24 business hours.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-1">Custom Manufacturing</h4>
                  <p className="text-muted leading-relaxed">
                    Looking for bulk nameplates, bespoke keychains, or industrial additive manufacturing prototypes? Mention your specifications in the message form.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-card border border-line bg-alt/60 p-6 text-xs text-muted space-y-2">
              <div className="flex items-center gap-2 text-ink font-semibold">
                <svg className="h-4 w-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Order Status Notice</span>
              </div>
              <p className="leading-relaxed">
                If you have an existing order, you can also check real-time courier tracking and fulfillment status under{' '}
                <span className="font-semibold text-ink">Track Orders</span> in your customer account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
