/**
 * Dedicated cryptographic secret validator for OTP verification.
 * Enforces cryptographic key separation: MUST NOT fall back to JWT_SECRET.
 */
export function getOtpSecret() {
  const secret = process.env.OTP_SECRET

  if (!secret || typeof secret !== 'string' || secret.trim().length < 32) {
    throw new Error(
      'FATAL: Dedicated OTP_SECRET environment variable is missing or shorter than 32 characters. ' +
      'Generate a 32-byte hex key using `openssl rand -hex 32`. Do not fall back to JWT_SECRET.'
    )
  }

  return secret.trim()
}
