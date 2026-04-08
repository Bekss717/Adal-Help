const router = require('express').Router();
const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── GET ALL CAMPAIGNS (public) ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, status, urgent, search, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (category) filter.category = category;

    // Only filter by status if explicitly passed, else default to active
    if (status && status !== 'all') filter.status = status;
    else if (!status) filter.status = 'active';
    // status=all → no status filter (shows everything)

    if (urgent === 'true') filter.isUrgent = true;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Campaign.countDocuments(filter);
    const campaigns = await Campaign.find(filter)
      .populate('organizer', 'name trustScore isVerified avatar')
      .sort({ isUrgent: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      campaigns,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET MY CAMPAIGNS (all statuses for the logged-in organizer) ──────────────
router.get('/mine', protect, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ organizer: req.user._id })
      .populate('organizer', 'name trustScore isVerified avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET URGENT CAMPAIGNS (homepage) ─────────────────────────────────────────
router.get('/urgent', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ isUrgent: true, status: 'active' })
      .populate('organizer', 'name trustScore isVerified')
      .sort({ createdAt: -1 })
      .limit(6);
    res.json({ success: true, campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET STATS (homepage analytics) ──────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const totalCampaigns = await Campaign.countDocuments({ status: 'active' });
    const completedCampaigns = await Campaign.countDocuments({ status: 'completed' });
    const totalRaised = await Campaign.aggregate([
      { $group: { _id: null, total: { $sum: '$raisedAmount' } } },
    ]);
    const totalDonors = await Transaction.distinct('donor');

    res.json({
      success: true,
      stats: {
        activeCampaigns: totalCampaigns,
        completedCampaigns,
        totalRaisedKGS: totalRaised[0]?.total || 0,
        totalDonors: totalDonors.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET SINGLE CAMPAIGN ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      'organizer',
      'name trustScore isVerified avatar createdAt'
    );
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    // Get recent transactions for this campaign
    const recentDonations = await Transaction.find({ campaign: req.params.id, status: 'completed' })
      .populate('donor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, campaign, recentDonations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CREATE CAMPAIGN ──────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  requireRole('organizer', 'admin'),
  upload.fields([
    { name: 'documents', maxCount: 5 },
    { name: 'images', maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const { title, description, category, goalAmount, deadline, location, isUrgent } = req.body;

      // Validation
      const errors = {};
      if (!title || title.trim().length < 5) errors.title = 'Title must be at least 5 characters';
      if (!description || description.trim().length < 20) errors.description = 'Description too short';
      if (!category) errors.category = 'Category is required';
      if (!goalAmount || isNaN(goalAmount) || Number(goalAmount) < 1000)
        errors.goalAmount = 'Goal must be at least 1000 KGS';

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
      }

      const documents = (req.files?.documents || []).map((f) => ({
        filename: f.filename,
        originalName: f.originalname,
        path: `/uploads/${f.filename}`,
        uploadedAt: new Date(),
      }));
      const images = (req.files?.images || []).map((f) => `/uploads/${f.filename}`);

      const campaign = await Campaign.create({
        title: title.trim(),
        description: description.trim(),
        category,
        organizer: req.user._id,
        goalAmount: Number(goalAmount),
        deadline: deadline ? new Date(deadline) : undefined,
        location: location?.trim(),
        isUrgent: isUrgent === 'true' || isUrgent === true,
        documents,
        images,
        // For MVP: activate immediately so campaigns appear right away.
        // Change to 'pending' when you have an admin review flow ready.
        status: 'active',
      });

      const populated = await Campaign.findById(campaign._id).populate('organizer', 'name trustScore isVerified');

      res.status(201).json({
        success: true,
        message: 'Campaign created and is now live!',
        campaign: populated,
      });
    } catch (err) {
      console.error('Create campaign error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── UPDATE CAMPAIGN ──────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Not found.' });
    if (campaign.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const allowed = ['title', 'description', 'isUrgent', 'deadline', 'location'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) campaign[field] = req.body[field];
    });

    // Admin can change status
    if (req.user.role === 'admin' && req.body.status) {
      campaign.status = req.body.status;
    }

    await campaign.save();
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;