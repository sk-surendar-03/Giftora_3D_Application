import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_TTL = '1h'

function secret() {
  const value = process.env.JWT_SECRET
  if (!value || value === 'change-me') {
    // Fails loudly instead of silently signing tokens with a known,
    // publicly-documented default secret.
    throw new Error('JWT_SECRET is not configured. Set a strong, unique value in your environment.')
  }
  return value
}

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, secret(), { expiresIn: ACCESS_TOKEN_TTL })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, secret())
}
