import cors from 'cors'
import express from 'express'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') ?? '*', credentials: true }))
app.use(express.json())

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' })
})

export default app
