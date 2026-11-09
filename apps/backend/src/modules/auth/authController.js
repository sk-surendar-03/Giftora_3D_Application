import { HttpError } from '../../utils/httpError.js'
import { isValidEmail, isValidPassword, isNonEmptyString } from '../../utils/validation.js'
import { registerUser, loginUser } from './authService.js'

export async function register(req, res) {
  const { name, email, password, phone } = req.body ?? {}

  if (!isNonEmptyString(name, 100)) throw new HttpError(400, 'Name is required.')
  if (!isValidEmail(email)) throw new HttpError(400, 'A valid email is required.')
  if (!isValidPassword(password)) throw new HttpError(400, 'Password must be 8-128 characters.')
  if (!phone || typeof phone !== 'string' || !/^[0-9+\-() ]{6,20}$/.test(phone.trim())) {
    throw new HttpError(400, 'A valid phone number is required.')
  }

  const { user, token } = await registerUser({ name: name.trim(), email: email.toLowerCase().trim(), password, phone: phone.trim() })
  res.status(201).json({ user, token })
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
