export class GeometryError extends Error {
  constructor(message, code, options) {
    super(message, options)
    this.name = 'GeometryError'
    this.code = code
  }
}
