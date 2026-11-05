// Express 4 doesn't catch rejected promises from async route handlers on
// its own — this wrapper forwards any rejection to `next(err)` so the
// shared error handler (middleware/errorHandler.js) always gets a chance
// to run, instead of the process crashing on an unhandled rejection.
export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
