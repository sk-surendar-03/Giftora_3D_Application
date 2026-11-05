import cors from 'cors'
import express from 'express'
import { prisma } from './config/db.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authRouter } from './modules/auth/authRoutes.js'
import { categoryRouter } from './modules/categories/categoryRoutes.js'
import { productRouter } from './modules/products/productRoutes.js'
import { cartRouter } from './modules/cart/cartRoutes.js'
import { addressRouter } from './modules/addresses/addressRoutes.js'
import { checkoutRouter } from './modules/checkout/checkoutRoutes.js'
import { orderRouter } from './modules/orders/orderRoutes.js'
import { adminOrderRouter } from './modules/orders/adminOrderRoutes.js'
import { customerRouter } from './modules/customers/customerRoutes.js'
import { reportRouter } from './modules/reports/reportRoutes.js'
import { settingsRouter, adminSettingsRouter } from './modules/settings/settingsRoutes.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') ?? '*', credentials: true }))
app.use(express.json())

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Separate from the plain liveness check above — this one actually
// round-trips to the database, so it fails honestly if Postgres/DATABASE_URL
// isn't reachable instead of always reporting "ok".
app.get('/api/v1/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'unreachable', message: err.message })
  }
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/categories', categoryRouter)
app.use('/api/v1/products', productRouter)
app.use('/api/v1/cart', cartRouter)
app.use('/api/v1/addresses', addressRouter)
app.use('/api/v1/checkout', checkoutRouter)
app.use('/api/v1/orders', orderRouter)
app.use('/api/v1/admin/orders', adminOrderRouter)
app.use('/api/v1/admin/customers', customerRouter)
app.use('/api/v1/admin/reports', reportRouter)
app.use('/api/v1/settings', settingsRouter)
app.use('/api/v1/admin/settings', adminSettingsRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
