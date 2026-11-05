import 'dotenv/config'
import app from './app.js'
import { prisma } from './config/db.js'

const port = process.env.PORT || 4000

const server = app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`)
})

async function shutdown() {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
