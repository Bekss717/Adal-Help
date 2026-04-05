const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2,   'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,   // never returned in queries unless explicitly asked
  },
  role: {
    type: String,
    enum: ['donor', 'organizer', 'admin'],
    default: 'donor',
  },
  phone:      { type: String, trim: true },
  avatar:     { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  isBlocked:  { type: Boolean, default: false },
  trustScore: { type: Number, default: 100, min: 0, max: 100 },
  documents: [{
    filename:     String,
    originalName: String,
    path:         String,
    uploadedAt:   { type: Date, default: Date.now },
  }],
}, { timestamps: true })

// Remove password from any JSON response automatically
UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', UserSchema)