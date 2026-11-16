import { readFileSync } from 'node:fs'
import { prisma } from './src/config/db.js'
import { getStorage } from './src/modules/storage/storage.js'
import { sha256Hex } from './src/modules/customizer/stlValidator.js'

const API = 'http://localhost:4000/api/v1'
const STL = 'storage/stand-designs/cmwj3m4u70000v1q8q1nv9fmz/cmwj3mqjj0004v1q84i7n6l7b/14ca2a0150c6429c57ba8d6ebe1f8c144b0f860e6c0efc190bacaa3fec137d42.stl'

async function main() {
  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@jasvel3dmakers.co.in', password: 'Admin@123' }),
  }).then((r) => r.json())
  const token = login.token
  if (!token) throw new Error('login failed: ' + JSON.stringify(login))
  const userId = login.user.id
  console.log('logged in as', login.user.email, login.user.role)

  const source = await prisma.standDesign.findFirst({ where: { status: 'READY' } })
  console.log('source design      :', source.id, source.category, 'stored price', source.unitPriceCents)

  const created = await fetch(`${API}/stand-designs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(source.designConfig),
  }).then((r) => r.json())
  const id = created.design?.id
  if (!id) throw new Error('create failed: ' + JSON.stringify(created))
  console.log('created design     :', id, 'price at create', created.design.unitPriceCents)

  const stl = readFileSync(STL)
  const hash = sha256Hex(stl)
  const uploaded = await fetch(`${API}/stand-designs/${id}/stl`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      Authorization: `Bearer ${token}`,
      'X-Content-SHA256': hash,
      // Deliberately NOT sending X-Volume-Cm3 — it must have no effect.
    },
    body: stl,
  }).then((r) => r.json())
  console.log('after STL upload   :', 'price', uploaded.design?.unitPriceCents, 'status', uploaded.design?.status)

  // A tampered volume header must not change anything.
  const tampered = await prisma.standDesign.findUnique({ where: { id } })
  console.log('db solidVolumeCm3  :', tampered.solidVolumeCm3)
  console.log('db unitPriceCents  :', tampered.unitPriceCents)

  const expected = Math.round(90000 + tampered.solidVolumeCm3 * 100)
  console.log('expected price     :', expected)
  console.log(
    uploaded.design?.unitPriceCents === expected && tampered.solidVolumeCm3 > 240 && tampered.solidVolumeCm3 < 246
      ? 'PHASE 1: PASS — price derived from server-measured STL volume'
      : 'PHASE 1: FAIL',
  )

  // Cleanup: storage object, then the row.
  if (tampered.stlKey) await getStorage().delete(tampered.stlKey)
  await prisma.standDesign.delete({ where: { id } })
  console.log('cleaned up test design')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
