// Centralised Express error handler. Later phases should throw/pass errors
// with an optional `status` (HTTP status code) and `message`; anything
// unrecognised falls back to a generic 500 so internal details are never
// leaked to the client.
export function errorHandler(err, req, res, _next) {
  const status = err.status ?? 500
  const message = status === 500 ? 'Internal server error' : err.message
  if (status === 500) console.error(err)
  res.status(status).json({ error: message })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Not found' })
}
