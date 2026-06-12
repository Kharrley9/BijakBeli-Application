const Brand = require('../models/Brand');

class BrandRepository {
  async create(data) {
    return await Brand.create(data);
  }

  async findById(id) {
    return await Brand.findById(id);
  }

  async findAll() {
    return await Brand.find().sort('brandName');
  }

  async update(id, data) {
    return await Brand.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return await Brand.findByIdAndDelete(id);
  }

  async count() {
    return await Brand.countDocuments();
  }
}

module.exports = new BrandRepository();
