const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')
const upload  = require('../middleware/upload')
const { protect } = require('../middleware/auth')

// Helper: sign a token
const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

// ── REGISTER ─────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body

    // Validate
    const errors = {}
    if (!name  || name.trim().length < 2)            errors.name     = 'Name must be at least 2 characters'
    if (!email || !/^\S+@\S+\.\S+$/.test(email))     errors.email    = 'Enter a valid email'
    if (!password || password.length < 6)            errors.password = 'Password must be at least 6 characters'
    if (role && !['donor','organizer'].includes(role)) errors.role   = 'Invalid role'

    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors })
    }

    // Check duplicate email
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' })
    }

    // Hash password with salt rounds = 12
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      name:     name.trim(),
      email:    email.toLowerCase(),
      password: hashedPassword,
      role:     role || 'donor',
      phone:    phone?.trim(),
    })

    const token = signToken(user)

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user,
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ success: false, message: 'Server error. Please try again.' })
  }
})

// ── LOGIN ─────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' })
    }

    // .select('+password') because we set select:false on the schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' })
    }

    // Compare plain password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const token = signToken(user)

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: user.toJSON(),   // password is stripped by toJSON()
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, message: 'Server error. Please try again.' })
  }
})

// ── GET CURRENT USER ──────────────────────────────
// GET /api/auth/me   (requires JWT)
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user })
})

// ── UPDATE PROFILE ────────────────────────────────
// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body
    const updates = {}
    if (name && name.trim().length >= 2) updates.name  = name.trim()
    if (phone)                           updates.phone = phone.trim()

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not update profile.' })
  }
})

// ── UPLOAD VERIFICATION DOCUMENT ─────────────────
// POST /api/auth/upload-document
router.post('/upload-document', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' })
    }

    const doc = {
      filename:     req.file.filename,
      originalName: req.file.originalname,
      path:         `/uploads/${req.file.filename}`,
      uploadedAt:   new Date(),
    }

    await User.findByIdAndUpdate(req.user._id, { $push: { documents: doc } })
    res.json({ success: true, message: 'Document uploaded.', document: doc })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed.' })
  }
})

module.exports = router