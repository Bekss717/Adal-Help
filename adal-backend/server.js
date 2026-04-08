const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
const morgan   = require('morgan')
const path     = require('path')
require('dotenv').config()

const app = express()

// ── Middleware ────────────────────────────────────
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'https://adal-help.vercel.app',
    'https://adal-help-9lrk980p3-bekss717s-projects.vercel.app'
  ], 
  credentials: true 
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── Routes ────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/campaigns',    require('./routes/campaigns'))
app.use('/api/transactions', require('./routes/transactions'))

// ── Health check ──────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AdalHelp API is running' })
})

// ── Global error handler ──────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Max 10MB.' })
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  })
})

// ── 404 handler ───────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` })
})

// ── Connect DB and start ──────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected')
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`)
    })
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })