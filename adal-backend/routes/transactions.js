const router = require('express').Router()
const Transaction = require('../models/Transaction')
const Campaign    = require('../models/Campaign')
const { protect } = require('../middleware/auth')
const { convertToKGS } = require('../middleware/currency')

// ── PREVIEW CONVERSION ────────────────────────────
// GET /api/transactions/convert?amount=100&from=USD
router.get('/convert', async (req, res) => {
  try {
    const { amount, from } = req.query
    if (!amount || !from) {
      return res.status(400).json({ success: false, message: 'Необходимы поля «сумма» и «от».' })
    }
    const result = await convertToKGS(parseFloat(amount), from)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

// ── DONATE ────────────────────────────────────────
// POST /api/transactions/donate
router.post('/donate', protect, async (req, res) => {
  try {
    const { campaignId, amount, currency = 'KGS', isAnonymous = false, donorType = 'individual', message } = req.body

    if (!campaignId) {
      return res.status(400).json({ success: false, message: 'Требуется ID сбора.' })
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Введите действительную сумму пожертвования.' })
    }

    const campaign = await Campaign.findById(campaignId)
    if (!campaign) return res.status(404).json({ success: false, message: 'Сбор не найден.' })
    if (campaign.status !== 'active') {
      return res.status(400).json({ success: false, message: 'В рамках этого сбора пожертвования не принимаются.' })
    }

    // Convert to KGS using live exchange rate
    const { amountKGS, rate } = await convertToKGS(parseFloat(amount), currency)

    // Save transaction
    const transaction = await Transaction.create({
      campaign:         campaignId,
      donor:            isAnonymous ? null : req.user._id,
      originalAmount:   parseFloat(amount),
      originalCurrency: currency.toUpperCase(),
      amount:           amountKGS,
      exchangeRate:     rate,
      isAnonymous,
      donorType,
      donorName:        isAnonymous ? 'Anonymous' : req.user.name,
      message:          message?.trim(),
      status:           'completed',
    })

    // Update campaign totals
    const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { raisedAmount: amountKGS, escrowBalance: amountKGS, donorCount: 1 }
    }, { new: true, runValidators: true })

    // Auto-complete if goal reached
    if (updatedCampaign.raisedAmount >= updatedCampaign.goalAmount) {
      await Campaign.findByIdAndUpdate(campaignId, { status: 'completed' })
    }

    res.status(201).json({
      success: true,
      message: `Пожертвование ${amount} ${currency} (${amountKGS} KGS) получено. Спасибо вам!`,
      transaction,
      amountKGS,
      exchangeRate: rate,
    })
  } catch (err) {
    console.error('Donation error:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET DONATIONS FOR A CAMPAIGN ──────────────────
// GET /api/transactions/campaign/:id
router.get('/campaign/:campaignId', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      campaign: req.params.campaignId,
      status: 'completed',
    })
      .populate('donor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ success: true, transactions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET MY DONATION HISTORY ───────────────────────
// GET /api/transactions/my
router.get('/my', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ donor: req.user._id })
      .populate('campaign', 'title category status')
      .sort({ createdAt: -1 })

    res.json({ success: true, transactions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router