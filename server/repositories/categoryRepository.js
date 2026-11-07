const Category = require('../models/Category');

class CategoryRepository {
  async create(data) {
    return await Category.create(data);
  }

  async findById(id) {
    return await Category.findById(id);
  }

  async findAll(filter = {}) {
    return await Category.find(filter).sort({ order: 1, categoryName: 1 });
  }

  async update(id, data) {
    return await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Category.findByIdAndDelete(id);
  }

  async count() {
    return await Category.countDocuments();
  }
}

module.exports = new CategoryRepository();
