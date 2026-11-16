import { HttpError } from '../../utils/httpError.js'
import { isValidEmail } from '../../utils/validation.js'
import { loginUser, updateProfile } from './authService.js'
import {
  initiateRegistration,
  verifyRegistrationOtp,
  resendRegistrationOtp,
} from './registrationOtpService.js'

export async function registerRequest(req, res) {
  const { name, email, password, phone } = req.body ?? {}
  const result = await initiateRegistration({ name, email, phone, password })
  res.status(200).json(result)
}

export async function registerVerify(req, res) {
  const { email, otp } = req.body ?? {}
  const result = await verifyRegistrationOtp({ email, otp })
  res.status(201).json(result)
}

export async function registerResend(req, res) {
  const { email } = req.body ?? {}
  const result = await resendRegistrationOtp({ email })
  res.status(200).json(result)
}

export async function register(req, res) {
  // Direct or legacy registration requests initiate the OTP verification workflow
  return registerRequest(req, res)
}

export async function login(req, res) {
  const { email, password } = req.body ?? {}

  if (!isValidEmail(email) || typeof password !== 'string' || !password) {
    // Same generic message as a real auth failure below — invalid input
    // shape shouldn't tell an attacker anything a wrong password wouldn't.
    throw new HttpError(401, 'Invalid email or password.')
  }

  const { user, token } = await loginUser({ email: email.toLowerCase().trim(), password })
  res.json({ user, token })
}

export function logout(req, res) {
  // JWTs are stateless and carry no server-side session to invalidate here
  // — there's no session/token-blacklist store in this project. "Logout"
  // is therefore the client discarding its stored token; this endpoint
  // exists for a conventional client-side call site and to end the
  // request predictably, not because it revokes anything server-side.
  res.status(204).end()
}

export function me(req, res) {
  res.json({ user: req.user })
}

export async function updateMe(req, res) {
  const { name, phone, currentPassword, newPassword } = req.body ?? {}
  const user = await updateProfile(req.user.id, { name, phone, currentPassword, newPassword })
  res.json({ user })
}
