import Review from '../models/Review.js';
import { createNotificationHelper } from './notificationController.js';
import User from '../models/User.js';

// ══════════════════════════════════════════════════════════════
// POST /api/reviews — Client soumet un avis
// ══════════════════════════════════════════════════════════════
export const createReview = async (req, res) => {
  try {
    const clientId = req.user?.id || req.user?._id;
    const { rating, comment, organizationName } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Note entre 1 et 5 requise' });
    }

    const client = await User.findById(clientId);

    const review = await Review.create({
      clientId,
      rating,
      comment: comment || '',
      organizationName: organizationName || client?.company || 'Organisation',
      clientName: client?.name || 'Client',
      clientCompany: client?.company || '',
    });

    // Notifier tous les admins
    const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' });
    for (const admin of admins) {
      await createNotificationHelper({
        userId: admin._id,
        title: '⭐ Nouvel avis client',
        message: `${client?.name} (${organizationName || client?.company}) a laissé un avis : ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`,
        type: 'INFO',
        actionUrl: 'admin-portal',
      });
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/reviews — Admin récupère tous les avis
// ══════════════════════════════════════════════════════════════
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate('clientId', 'name company avatar avatarColor');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ══════════════════════════════════════════════════════════════
// GET /api/reviews/stats — Statistiques globales des avis
// ══════════════════════════════════════════════════════════════
export const getReviewStats = async (req, res) => {
  try {
    const reviews = await Review.find();
    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0;
    const distribution = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
    }));

    res.json({ total, avgRating: parseFloat(avgRating), distribution });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
