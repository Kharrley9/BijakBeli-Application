const Order = require('../models/Order');

const PRODUCT_POP = { path: 'items.productId', select: 'productName image unit storeCategory' };
const STORE_POP = {
  path: 'storeId',
  select: 'storeName logo kind storeCategory phone city state deliveryFee deliveryAvailable pickupAvailable location ownerId',
};
const USER_POP = { path: 'userId', select: 'fullName phone email' };

class OrderRepository {
  async create(data) {
    return await Order.create(data);
  }

  async findById(id) {
    return await Order.findById(id).populate(PRODUCT_POP).populate(STORE_POP).populate(USER_POP);
  }

  async findByUser(userId, filter = {}) {
    return await Order.find({ userId, ...filter })
      .populate(PRODUCT_POP)
      .populate(STORE_POP)
      .sort('-createdAt');
  }

  async findByStore(storeId, filter = {}) {
    return await Order.find({ storeId, ...filter })
      .populate(PRODUCT_POP)
      .populate(USER_POP)
      .sort('-createdAt');
  }

  async save(doc) {
    return await doc.save();
  }

  async count(query = {}) {
    return await Order.countDocuments(query);
  }
}

module.exports = new OrderRepository();
