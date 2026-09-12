const reviewRepository = require('../repositories/reviewRepository');
const storeRepository = require('../repositories/storeRepository');
const Order = require('../models/Order');
const Review = require('../models/Review');

function bad(message, code = 400) {
  const e = new Error(message);
  e.statusCode = code;
  return e;
}

class ReviewService {
  async create(user, { orderId, rating, comment }) {
    if (!orderId) throw bad('An order is required to leave a review');
    const r = Number(rating);
    if (!Number.isFinite(r) || r < 1 || r > 5) throw bad('Rating must be between 1 and 5');

    const order = await Order.findById(orderId);
    if (!order) throw bad('Order not found', 404);
    if (String(order.userId) !== String(user._id)) throw bad('Not your order', 403);
    if (order.status !== 'completed') throw bad('You can only review a completed order');

    const existing = await reviewRepository.findByOrder(orderId);
    if (existing) throw bad('You already reviewed this order', 409);

    let review;
    try {
      review = await reviewRepository.create({
        userId: user._id,
        storeId: order.storeId,
        orderId,
        rating: r,
        comment: (comment || '').trim() || undefined,
      });
    } catch (e) {
      if (e.code === 11000) throw bad('You already reviewed this order', 409);
      throw e;
    }

    await this._recomputeStoreRating(order.storeId);
    return review;
  }

  async _recomputeStoreRating(storeId) {
    const { avg, count } = await reviewRepository.ratingStatsForStore(storeId);
    await storeRepository.update(storeId, {
      rating: Math.round((avg || 0) * 10) / 10,
      reviewCount: count,
    });
  }

  async listForStore(storeId, opts) {
    return reviewRepository.findByStore(storeId, opts);
  }

  async listMine(userId) {
    return reviewRepository.findByUser(userId);
  }

  /** Completed orders the buyer hasn't reviewed yet — the "write a review" picker. */
  async getReviewableOrders(userId) {
    const orders = await Order.find({ userId, status: 'completed' })
      .populate('storeId', 'storeName logo storeCategory')
      .sort('-createdAt');
    if (!orders.length) return [];
    const reviewed = await Review.find({ orderId: { $in: orders.map((o) => o._id) } }).select('orderId');
    const reviewedIds = new Set(reviewed.map((r) => String(r.orderId)));
    return orders.filter((o) => !reviewedIds.has(String(o._id)));
  }

  async delete(id, user) {
    const review = await reviewRepository.findById(id);
    if (!review) throw bad('Review not found', 404);
    if (String(review.userId) !== String(user._id) && user.role !== 'admin') {
      throw bad('Not your review', 403);
    }
    await reviewRepository.delete(id);
    await this._recomputeStoreRating(review.storeId);
    return { _id: id };
  }
}

module.exports = new ReviewService();
