const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// ── Protect: requires valid JWT ───────────────────
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please log in first.'
      })
    }

    const token   = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach full user to request
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' })
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' })
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' })
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' })
  }
}

// ── Role guard: requireRole('admin') ─────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required: ${roles.join(' or ')}`
    })
  }
  next()
}

module.exports = { protect, requireRole }