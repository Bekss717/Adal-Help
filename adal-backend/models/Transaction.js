const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,          // null when anonymous
  },
  originalAmount:   { type: Number, required: true },
  originalCurrency: { type: String, required: true, uppercase: true },
  amount:           { type: Number, required: true }, // always stored in KGS
  exchangeRate:     { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending','completed','refunded','failed'],
    default: 'completed',
  },
  isAnonymous: { type: Boolean, default: false },
  donorType: {
    type: String,
    enum: ['individual','legal_entity'],
    default: 'individual',
  },
  donorName: { type: String },
  message:   { type: String, maxlength: 500 },
}, { timestamps: true })

module.exports = mongoose.model('Transaction', TransactionSchema)