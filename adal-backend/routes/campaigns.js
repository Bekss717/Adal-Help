const router = require('express').Router()
const Campaign    = require('../models/Campaign')
const Transaction = require('../models/Transaction')
const { protect, requireRole } = require('../middleware/auth')
const upload = require('../middleware/upload')

// ── GET ALL (with filters) ────────────────────────
// GET /api/campaigns
router.get('/', async (req, res) => {
  try {
    const { category, status, urgent, search } = req.query
    const filter = { status: status || 'active' }

    if (category)       filter.category = category
    if (urgent === 'true') filter.isUrgent = true
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const campaigns = await Campaign.find(filter)
      .populate('organizer', 'name trustScore isVerified avatar')
      .sort({ isUrgent: -1, createdAt: -1 })

    res.json({ success: true, campaigns })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET URGENT (homepage) ─────────────────────────
// GET /api/campaigns/urgent
router.get('/urgent', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ isUrgent: true, status: 'active' })
      .populate('organizer', 'name trustScore isVerified')
      .sort({ createdAt: -1 })
      .limit(6)
    res.json({ success: true, campaigns })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET STATS ─────────────────────────────────────
// GET /api/campaigns/stats
router.get('/stats', async (req, res) => {
  try {
    const [activeCampaigns, completedCampaigns, raisedData, donorData] = await Promise.all([
      Campaign.countDocuments({ status: 'active' }),
      Campaign.countDocuments({ status: 'completed' }),
      Campaign.aggregate([{ $group: { _id: null, total: { $sum: '$raisedAmount' } } }]),
      Transaction.distinct('donor'),
    ])
    res.json({
      success: true,
      stats: {
        activeCampaigns,
        completedCampaigns,
        totalRaisedKGS: raisedData[0]?.total || 0,
        totalDonors:    donorData.length,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET ONE ───────────────────────────────────────
// GET /api/campaigns/:id
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('organizer', 'name trustScore isVerified avatar createdAt')

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' })
    }

    const recentDonations = await Transaction.find({
      campaign: req.params.id,
      status: 'completed',
    })
      .populate('donor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({ success: true, campaign, recentDonations })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── CREATE ────────────────────────────────────────
// POST /api/campaigns   (organizer or admin only)
router.post(
  '/',
  protect,
  requireRole('organizer', 'admin'),
  upload.fields([
    { name: 'documents', maxCount: 5 },
    { name: 'images',    maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const { title, description, category, goalAmount, deadline, location, isUrgent } = req.body

      // Validate
      const errors = {}
      if (!title       || title.trim().length < 5)              errors.title       = 'Title too short'
      if (!description || description.trim().length < 20)       errors.description = 'Description too short'
      if (!category)                                             errors.category    = 'Category is required'
      if (!goalAmount  || isNaN(goalAmount) || +goalAmount < 1000) errors.goalAmount = 'Minimum goal is 1000 KGS'

      if (Object.keys(errors).length) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors })
      }

      // Format uploaded files
      const documents = (req.files?.documents || []).map(f => ({
        filename: f.filename, originalName: f.originalname,
        path: `/uploads/${f.filename}`, uploadedAt: new Date(),
      }))
      const images = (req.files?.images || []).map(f => `/uploads/${f.filename}`)

      const campaign = await Campaign.create({
        title:       title.trim(),
        description: description.trim(),
        category,
        organizer:   req.user._id,
        goalAmount:  Number(goalAmount),
        deadline:    deadline ? new Date(deadline) : undefined,
        location:    location?.trim(),
        isUrgent:    isUrgent === 'true' || isUrgent === true,
        documents,
        images,
        // Auto-activate if organizer is already verified, else send to review
        status: req.user.isVerified ? 'active' : 'pending',
      })

      const populated = await Campaign.findById(campaign._id)
        .populate('organizer', 'name trustScore isVerified')

      res.status(201).json({
        success: true,
        message: req.user.isVerified
          ? 'Campaign is now live!'
          : 'Campaign submitted for review.',
        campaign: populated,
      })
    } catch (err) {
      console.error('Create campaign error:', err)
      res.status(500).json({ success: false, message: err.message })
    }
  }
)

// ── UPDATE ────────────────────────────────────────
// PUT /api/campaigns/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
    if (!campaign) return res.status(404).json({ success: false, message: 'Not found.' })

    const isOwner = campaign.organizer.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' })
    }

    // Organizers can only update these fields
    const allowed = ['title', 'description', 'isUrgent', 'deadline', 'location']
    allowed.forEach(f => { if (req.body[f] !== undefined) campaign[f] = req.body[f] })

    // Only admin can change status
    if (isAdmin && req.body.status) campaign.status = req.body.status

    await campaign.save()
    res.json({ success: true, campaign })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router