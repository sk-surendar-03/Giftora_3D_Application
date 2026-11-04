// A plain Error subclass carrying an HTTP status, so route handlers can
// `throw new HttpError(409, 'message')` and let the shared error handler
// (middleware/errorHandler.js) turn it into the right response — see that
// file for why 500s never leak their real message to the client.
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
