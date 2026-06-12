const Budget = require('../models/Budget');

class BudgetRepository {
  async create(data) {
    return await Budget.create(data);
  }

  async findByUserAndMonth(userId, month, year) {
    return await Budget.findOne({ userId, month, year });
  }

  async findByUser(userId) {
    return await Budget.find({ userId }).sort('-year -month');
  }

  async update(id, data) {
    return await Budget.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Budget.findByIdAndDelete(id);
  }
}

module.exports = new BudgetRepository();
