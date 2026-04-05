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
      return res.status(400).json({ success: false, message: 'amount and from are required.' })
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
      return res.status(400).json({ success: false, message: 'Campaign ID is required.' })
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Enter a valid donation amount.' })
    }

    const campaign = await Campaign.findById(campaignId)
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' })
    if (campaign.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This campaign is not accepting donations.' })
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
    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { raisedAmount: amountKGS, escrowBalance: amountKGS, donorCount: 1 }
    })

    // Auto-complete if goal reached
    const updated = await Campaign.findById(campaignId)
    if (updated.raisedAmount >= updated.goalAmount) {
      await Campaign.findByIdAndUpdate(campaignId, { status: 'completed' })
    }

    res.status(201).json({
      success: true,
      message: `Donation of ${amount} ${currency} (${amountKGS} KGS) received. Thank you!`,
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