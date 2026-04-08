const router = require('express').Router();
const Campaign = require('../models/Campaign');
const Transaction = require('../models/Transaction');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── GET ALL CAMPAIGNS (public) ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, status, urgent, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status && status !== 'all') filter.status = status;
    else if (!status) filter.status = 'active';

    if (urgent === 'true') filter.isUrgent = true;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
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

    res.json({ success: true, campaigns, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET MY CAMPAIGNS (all statuses, requires auth) ───────────────────────────
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

// ─── GET URGENT (homepage) ────────────────────────────────────────────────────
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

// ─── GET STATS (homepage counter bar) ────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [activeCampaigns, completedCampaigns, raisedData, donorData] = await Promise.all([
      Campaign.countDocuments({ status: 'active' }),
      Campaign.countDocuments({ status: 'completed' }),
      Campaign.aggregate([{ $group: { _id: null, total: { $sum: '$raisedAmount' } } }]),
      Transaction.distinct('donor'),
    ]);
    res.json({
      success: true,
      stats: {
        activeCampaigns,
        completedCampaigns,
        totalRaisedKGS: raisedData[0]?.total || 0,
        totalDonors:    donorData.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET ANALYTICS (full data for Analytics page) ────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    // Category breakdown
    const byCategory = await Campaign.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalRaised: { $sum: '$raisedAmount' }, totalGoal: { $sum: '$goalAmount' } } },
      { $sort: { totalRaised: -1 } },
    ]);

    // Status breakdown
    const byStatus = await Campaign.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Donations over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const donationsOverTime = await Transaction.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'completed' } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        totalKGS: { $sum: '$amount' },
        count:    { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Top campaigns by raised amount
    const topCampaigns = await Campaign.find({ status: { $in: ['active', 'completed'] } })
      .sort({ raisedAmount: -1 })
      .limit(5)
      .select('title raisedAmount goalAmount category isUrgent');

    // Totals
    const totalRaisedData = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const urgentCount   = await Campaign.countDocuments({ isUrgent: true, status: 'active' });
    const pendingCount  = await Campaign.countDocuments({ status: 'pending' });
    const activeCount   = await Campaign.countDocuments({ status: 'active' });
    const completedCount = await Campaign.countDocuments({ status: 'completed' });

    res.json({
      success: true,
      analytics: {
        byCategory,
        byStatus,
        donationsOverTime,
        topCampaigns,
        totals: {
          totalRaisedKGS: totalRaisedData[0]?.total || 0,
          totalDonations: totalRaisedData[0]?.count || 0,
          urgentCount,
          pendingCount,
          activeCount,
          completedCount,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET SINGLE ───────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('organizer', 'name trustScore isVerified avatar createdAt');
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const recentDonations = await Transaction.find({ campaign: req.params.id, status: 'completed' })
      .populate('donor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, campaign, recentDonations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
router.post('/',
  protect,
  requireRole('organizer', 'admin'),
  upload.fields([{ name: 'documents', maxCount: 5 }, { name: 'images', maxCount: 3 }]),
  async (req, res) => {
    try {
      const { title, description, category, goalAmount, deadline, location } = req.body;

      // isUrgent arrives as string "true"/"false" from FormData
      const isUrgent = req.body.isUrgent === 'true' || req.body.isUrgent === true;

      const errors = {};
      if (!title       || title.trim().length < 5)               errors.title       = 'Title too short';
      if (!description || description.trim().length < 20)        errors.description = 'Description too short';
      if (!category)                                              errors.category    = 'Category is required';
      if (!goalAmount  || isNaN(goalAmount) || +goalAmount < 1000) errors.goalAmount = 'Minimum goal is 1000 KGS';
      if (Object.keys(errors).length) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
      }

      const documents = (req.files?.documents || []).map(f => ({
        filename: f.filename, originalName: f.originalname,
        path: `/uploads/${f.filename}`, uploadedAt: new Date(),
      }));
      const images = (req.files?.images || []).map(f => `/uploads/${f.filename}`);

      const campaign = await Campaign.create({
        title:       title.trim(),
        description: description.trim(),
        category,
        organizer:   req.user._id,
        goalAmount:  Number(goalAmount),
        deadline:    deadline ? new Date(deadline) : undefined,
        location:    location?.trim(),
        isUrgent,
        documents,
        images,
        status: 'active', // immediately active for MVP
      });

      const populated = await Campaign.findById(campaign._id)
        .populate('organizer', 'name trustScore isVerified');

      res.status(201).json({ success: true, message: 'Campaign is now live!', campaign: populated });
    } catch (err) {
      console.error('Create campaign error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── UPDATE ───────────────────────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Not found.' });

    const isOwner = campaign.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });

    const allowed = ['title', 'description', 'isUrgent', 'deadline', 'location'];
    allowed.forEach(f => { if (req.body[f] !== undefined) campaign[f] = req.body[f]; });
    if (isAdmin && req.body.status) campaign.status = req.body.status;

    await campaign.save();
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;


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