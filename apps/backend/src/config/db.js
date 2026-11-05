import { PrismaClient } from '@prisma/client'

// A single shared PrismaClient instance for the whole backend process —
// Prisma's own guidance for Node/Express apps (avoids exhausting the
// database connection pool by creating a new client per request).
export const prisma = new PrismaClient()
