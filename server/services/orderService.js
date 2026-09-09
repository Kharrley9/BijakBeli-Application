const orderRepository = require('../repositories/orderRepository');
const budgetService = require('./budgetService');

class OrderService {
  async createOrder(userId, items, shoppingListId = null) {
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await orderRepository.create({
      userId,
      items,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      status: 'completed',
      shoppingListId,
    });

    // Auto-add expense to current month's budget
    try {
      const now = new Date();
      await budgetService.addExpense(userId, totalPrice, now.getMonth() + 1, now.getFullYear());
    } catch (e) {
      // Budget may not be set — that's OK, just skip
    }

    return order;
  }

  async getUserOrders(userId) {
    return await orderRepository.findByUser(userId);
  }

  async getOrderById(id) {
    const order = await orderRepository.findById(id);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }
    return order;
  }

  async cancelOrder(id) {
    const order = await orderRepository.update(id, { status: 'cancelled' });
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }
    return order;
  }
}

module.exports = new OrderService();
