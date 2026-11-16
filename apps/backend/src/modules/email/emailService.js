import nodemailer from 'nodemailer'

let customTransporter = null

/**
 * Allows automated tests to inject a mock or stream transporter.
 */
export function setCustomTransporter(transporter) {
  customTransporter = transporter
}

export const setMockTransporter = setCustomTransporter

export function resetCustomTransporter() {
  customTransporter = null
}

function getTransporter() {
  if (customTransporter) return customTransporter

  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT) || 465
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    if (process.env.NODE_ENV === 'test') {
      // In test mode without SMTP credentials, use a JSON mock transport
      return nodemailer.createTransport({ jsonTransport: true })
    }
    throw new Error('SMTP credentials are not configured. Set SMTP_USER and SMTP_PASS.')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Sends a 6-digit registration OTP to the customer's email.
 * Rejects if delivery fails.
 */
export async function sendRegistrationOtpEmail({ email, name, otp }) {
  const fromName = process.env.SMTP_FROM_NAME || 'JAS 3D PRINTING'
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@jasvel3dmakers.co.in'
  const from = `"${fromName}" <${fromEmail}>`

  const safeName = escapeHtml(name) || 'there'
  const subject = `${otp} is your Giftora verification code`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6; }
    .wrapper { max-width: 520px; margin: 40px auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; }
    .header { padding: 32px 32px 16px; text-align: center; border-bottom: 1px solid #1f2937; }
    .brand { font-size: 20px; font-weight: 700; color: #d9ae4e; letter-spacing: -0.02em; margin: 0; }
    .content { padding: 32px; text-align: center; }
    .title { font-size: 22px; font-weight: 600; color: #ffffff; margin: 0 0 12px; }
    .greeting { font-size: 15px; color: #9ca3af; margin: 0 0 24px; line-height: 1.5; }
    .otp-box { display: inline-block; background-color: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 16px 36px; margin: 12px 0 24px; }
    .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; color: #d9ae4e; letter-spacing: 0.25em; }
    .warning { font-size: 13px; color: #9ca3af; line-height: 1.6; margin: 0 0 20px; }
    .warning strong { color: #f3f4f6; }
    .footer { padding: 20px 32px; background-color: #0d131f; border-top: 1px solid #1f2937; font-size: 12px; color: #6b7280; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1 class="brand">JAS 3D PRINTING</h1>
    </div>
    <div class="content">
      <h2 class="title">Verify Your Email Address</h2>
      <p class="greeting">Hi ${safeName},<br>Enter this 6-digit code on Giftora to verify your email and complete your account registration:</p>
      <div class="otp-box">
        <span class="otp-code">${otp}</span>
      </div>
      <p class="warning">
        This code is valid for <strong>5 minutes</strong> and can only be used once.<br>
        If you did not attempt to register an account on Giftora, please disregard this email.
      </p>
    </div>
    <div class="footer">
      &copy; 2026 JAS 3D PRINTING. All rights reserved.<br>
      This is an automated security email — do not reply directly.
    </div>
  </div>
</body>
</html>
  `.trim()

  const text = `
JAS 3D PRINTING — Email Verification

Hi ${name || 'there'},

Your 6-digit verification code for Giftora registration is:
${otp}

This code expires in 5 minutes and can only be used once.

If you did not request this, you can safely ignore this email.
  `.trim()

  const transporter = getTransporter()
  const info = await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
    html,
  })

  return { messageId: info.messageId }
}
