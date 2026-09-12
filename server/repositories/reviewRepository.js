const Review = require('../models/Review');

class ReviewRepository {
  async create(data) {
    return await Review.create(data);
  }

  async findByStore(storeId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ storeId })
        .populate('userId', 'fullName profilePicture')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ storeId }),
    ]);
    return { reviews, total, page, pages: Math.ceil(total / limit) || 1 };
  }

  async findByUser(userId) {
    return await Review.find({ userId })
      .populate('storeId', 'storeName logo storeCategory')
      .populate('orderId', 'orderNumber')
      .sort('-createdAt');
  }

  async findByOrder(orderId) {
    return await Review.findOne({ orderId });
  }

  async findById(id) {
    return await Review.findById(id);
  }

  async delete(id) {
    return await Review.findByIdAndDelete(id);
  }

  async ratingStatsForStore(storeId) {
    const [agg] = await Review.aggregate([
      { $match: { storeId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    return agg ? { avg: agg.avg, count: agg.count } : { avg: 0, count: 0 };
  }
}

module.exports = new ReviewRepository();
