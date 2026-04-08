const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Имя обязательно'],
    trim: true,
    minlength: [2,   'Имя должно состоять как минимум из 2 символов.'],
    maxlength: [100, 'Имя не может превышать 100 символов.'],
  },
  email: {
    type: String,
    required: [true, 'Требуется электронная почта'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Введите действительный адрес электронной почты'],
  },
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
    minlength: [6, 'Пароль должен состоять как минимум из 6 символов.'],
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