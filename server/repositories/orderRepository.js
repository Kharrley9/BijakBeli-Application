const Order = require('../models/Order');

class OrderRepository {
  async create(data) {
    return await Order.create(data);
  }

  async findByUser(userId) {
    return await Order.find({ userId })
      .populate('items.productId', 'productName image unit')
      .populate('items.storeId', 'storeName mallName')
      .sort('-createdAt');
  }

  async findById(id) {
    return await Order.findById(id)
      .populate('items.productId', 'productName image unit')
      .populate('items.storeId', 'storeName mallName');
  }

  async update(id, data) {
    return await Order.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Order.findByIdAndDelete(id);
  }

  async count(query = {}) {
    return await Order.countDocuments(query);
  }
}

module.exports = new OrderRepository();
