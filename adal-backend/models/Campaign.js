const mongoose = require('mongoose')

const CampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название обязательно'],
    trim: true,
    minlength: [5, 'Название должно быть не менее 5 символов'],
    maxlength: [200, 'Название не может превышать 200 символов'],
  },
  description: {
    type: String,
    required: [true, 'Описание обязательно'],
    minlength: [20, 'Описание должно быть не менее 20 символов'],
  },
  category: {
    type: String,
    required: [true, 'Категория обязательна'],
    enum: ['medical', 'children', 'elderly', 'pets', 'disability', 'disaster', 'education', 'other', 'health', 'social', 'environment', 'emergency'],
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  goalAmount: {
    type: Number,
    required: [true, 'Целевая сумма обязательна'],
    min: [1000, 'Минимальная цель - 1000 KGS'],
  },
  raisedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  deadline: {
    type: Date,
  },
  location: {
    type: String,
    trim: true,
  },
  isUrgent: {
    type: Boolean,
    default: false,
  },
  donorCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  escrowBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'active',
  },
  documents: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  images: {
    type: [String],
    default: [],
  },
}, { timestamps: true })

module.exports = mongoose.model('Campaign', CampaignSchema)