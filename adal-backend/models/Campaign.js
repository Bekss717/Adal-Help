const mongoose = require('mongoose')

const CampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [5,   'Title must be at least 5 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [20, 'Description too short'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['medical','children','elderly','pets','disability','disaster','education','other'],
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  goalAmount:   { type: Number, required: true, min: [1000, 'Minimum goal is 1000 KGS'] },
  raisedAmount: { type: Number, default: 0 },
  escrowBalance:{ type: Number, default: 0 },  // funds held until admin approves
  currency:     { type: String, default: 'KGS' },
  status: {
    type: String,
    enum: ['pending','active','frozen','completed','rejected'],
    default: 'pending',
  },
  isUrgent:   { type: Boolean, default: false },
  deadline:   { type: Date },
  location:   { type: String },
  donorCount: { type: Number, default: 0 },
  documents: [{
    filename:     String,
    originalName: String,
    path:         String,
    uploadedAt:   { type: Date, default: Date.now },
  }],
  images: [String],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

// Virtual: percent funded
CampaignSchema.virtual('progressPercent').get(function () {
  if (!this.goalAmount) return 0
  return Math.min(Math.round((this.raisedAmount / this.goalAmount) * 100), 100)
})

module.exports = mongoose.model('Campaign', CampaignSchema)