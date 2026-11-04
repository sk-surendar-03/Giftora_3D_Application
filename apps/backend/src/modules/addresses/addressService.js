import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'

export async function listAddresses(userId) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] })
}

async function unsetOtherDefaults(userId, exceptId) {
  await prisma.address.updateMany({
    where: { userId, isDefault: true, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isDefault: false },
  })
}

export async function createAddress(userId, data) {
  // The very first address a customer adds becomes their default
  // automatically — there's otherwise no way to check out with zero
  // default address, and nothing in the request forces the customer to
  // think about it on their very first address.
  const existingCount = await prisma.address.count({ where: { userId } })
  const isDefault = existingCount === 0 ? true : Boolean(data.isDefault)

  if (isDefault) await unsetOtherDefaults(userId)

  return prisma.address.create({ data: { ...data, userId, isDefault } })
}

async function findOwnedAddress(userId, id) {
  const address = await prisma.address.findUnique({ where: { id } })
  if (!address || address.userId !== userId) {
    throw new HttpError(404, 'Address not found.')
  }
  return address
}

export async function updateAddress(userId, id, data) {
  await findOwnedAddress(userId, id)
  if (data.isDefault === true) await unsetOtherDefaults(userId, id)
  return prisma.address.update({ where: { id }, data })
}

export async function deleteAddress(userId, id) {
  const address = await findOwnedAddress(userId, id)
  await prisma.address.delete({ where: { id } })

  if (address.isDefault) {
    // Keep the "exactly one default, if any addresses remain" invariant —
    // promote the next-oldest remaining address rather than leaving the
    // customer with no default at all.
    const remaining = await prisma.address.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } })
    if (remaining) await prisma.address.update({ where: { id: remaining.id }, data: { isDefault: true } })
  }
}
