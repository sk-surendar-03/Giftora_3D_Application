// Shared helpers for the backend tests (run with `npm test`).

/** A binary STL (same layout the geometry engine's exporter writes) of an axis-aligned box. */
export function makeBoxStl({ x = 40, y = 12, z = 3, offset = 0 } = {}) {
  const v = [
    [0, 0, 0], [x, 0, 0], [x, y, 0], [0, y, 0],
    [0, 0, z], [x, 0, z], [x, y, z], [0, y, z],
  ].map(([a, b, c]) => [a + offset, b + offset, c + offset])
  const faces = [
    [0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5],
    [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7],
  ]
  const buffer = Buffer.alloc(84 + faces.length * 50)
  buffer.write('OpenKeychain STL - millimetres', 0, 'latin1')
  buffer.writeUInt32LE(faces.length, 80)
  faces.forEach((face, index) => {
    const base = 84 + index * 50
    face.forEach((vertexIndex, vertex) => {
      v[vertexIndex].forEach((value, axis) => buffer.writeFloatLE(value, base + 12 + vertex * 12 + axis * 4))
    })
  })
  return buffer
}

/** A minimal but structurally valid PNG header (signature + IHDR) of the given size. */
export function makePng(width = 640, height = 480, extraBytes = 0) {
  const buffer = Buffer.alloc(33 + extraBytes)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0)
  buffer.writeUInt32BE(13, 8)
  buffer.write('IHDR', 12, 'ascii')
  buffer.writeUInt32BE(width, 16)
  buffer.writeUInt32BE(height, 20)
  return buffer
}

export const validDesign = (overrides = {}) => ({
  templateId: 'name-keychain',
  styleId: 'contour',
  text: 'Alex',
  subtitle: '',
  fontId: 'bungee',
  material: 'Standard PLA',
  color: { label: 'anything', hex: '#f5f3ee' },
  textColor: { hex: '#1A1A1A' },
  size: 'Medium (5.5 cm)',
  thickness: 'standard',
  keyringPosition: 'left',
  allowDisconnected: false,
  ...overrides,
})
