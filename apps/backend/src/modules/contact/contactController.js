import { prisma } from '../../config/db.js'
import { HttpError } from '../../utils/httpError.js'
import { isValidEmail, isNonEmptyString } from '../../utils/validation.js'
import { parsePagination, buildMeta } from '../../utils/pagination.js'

const PHONE_RE = /^[0-9+\-() ]{6,20}$/
export const VALID_INQUIRY_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED']

export async function submitContactInquiry(req, res) {
  const { name, email, phone, subject, message } = req.body ?? {}

  if (!isNonEmptyString(name, 100)) throw new HttpError(400, 'Full name is required.')
  if (!isValidEmail(email)) throw new HttpError(400, 'A valid email is required.')
  if (!phone || typeof phone !== 'string' || !PHONE_RE.test(phone.trim())) {
    throw new HttpError(400, 'A valid phone number is required.')
  }
  if (!isNonEmptyString(subject, 200)) throw new HttpError(400, 'Subject is required.')
  if (!isNonEmptyString(message, 5000)) throw new HttpError(400, 'Message is required (max 5000 characters).')

  const inquiry = await prisma.contactInquiry.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'NEW',
    },
  })

  res.status(201).json({
    ok: true,
    message: 'Your inquiry has been received. Our team will get in touch with you shortly.',
    id: inquiry.id,
  })
}

export async function listAdminInquiries(req, res) {
  const { status, search } = req.query ?? {}

  const where = {
    ...(status && VALID_INQUIRY_STATUSES.includes(status) ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { subject: { contains: search } },
          ],
        }
      : {}),
  }

  const pagination = parsePagination(req.query ?? {})

  const [inquiries, total] = await Promise.all([
    prisma.contactInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.contactInquiry.count({ where }),
  ])

  res.json({ inquiries, meta: buildMeta(pagination, total) })
}

export async function getNewInquiryCount(req, res) {
  const count = await prisma.contactInquiry.count({
    where: { status: 'NEW' },
  })
  res.json({ count })
}

export async function getAdminInquiry(req, res) {
  const { id } = req.params
  const inquiry = await prisma.contactInquiry.findUnique({ where: { id } })
  if (!inquiry) throw new HttpError(404, 'Inquiry not found.')
  res.json({ inquiry })
}

export async function updateAdminInquiryStatus(req, res) {
  const { id } = req.params
  const { status } = req.body ?? {}

  if (!status || !VALID_INQUIRY_STATUSES.includes(status)) {
    throw new HttpError(400, `Status must be one of: ${VALID_INQUIRY_STATUSES.join(', ')}`)
  }

  const existing = await prisma.contactInquiry.findUnique({ where: { id } })
  if (!existing) throw new HttpError(404, 'Inquiry not found.')

  const inquiry = await prisma.contactInquiry.update({
    where: { id },
    data: { status },
  })

  res.json({ inquiry })
}
