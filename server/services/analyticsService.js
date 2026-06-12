const User = require('../models/User');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Promotion = require('../models/Promotion');
const PurchaseHistory = require('../models/PurchaseHistory');
const FavoriteProduct = require('../models/FavoriteProduct');

class AnalyticsService {
  async getDashboardStats() {
    const [totalUsers, totalProducts, totalStores, activePromotions] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Store.countDocuments(),
      Promotion.countDocuments({
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }),
    ]);

    // Most favorited product
    const mostFavorited = await FavoriteProduct.aggregate([
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    let mostSavedProduct = null;
    if (mostFavorited.length) {
      mostSavedProduct = await Product.findById(mostFavorited[0]._id)
        .select('productName image');
    }

    // Average savings
    const savingsAgg = await PurchaseHistory.aggregate([
      { $group: { _id: null, avgSaving: { $avg: '$totalSaving' } } },
    ]);
    const avgSavings = savingsAgg.length ? savingsAgg[0].avgSaving : 0;

    // Monthly user registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyUsers = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return {
      totalUsers,
      totalProducts,
      totalStores,
      activePromotions,
      mostSavedProduct,
      avgSavings: parseFloat(avgSavings.toFixed(2)),
      monthlyUsers,
    };
  }
}

module.exports = new AnalyticsService();
