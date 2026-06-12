const Product = require('../models/Product');

class ProductRepository {
  async create(data) {
    return await Product.create(data);
  }

  async findById(id) {
    return await Product.findById(id)
      .populate('categoryId', 'categoryName')
      .populate('brandId', 'brandName');
  }

  async findAll(query = {}, options = {}) {
    const { page = 1, limit = 12, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('categoryId', 'categoryName')
      .populate('brandId', 'brandName')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return { products, total, page, pages: Math.ceil(total / limit) };
  }

  async search(searchQuery, filters = {}, options = {}) {
    const { page = 1, limit = 12 } = options;
    const skip = (page - 1) * limit;

    let query = { status: 'active' };

    if (searchQuery) {
      query.$or = [
        { productName: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { barcode: searchQuery },
      ];
    }

    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.brandId) query.brandId = filters.brandId;

    const products = await Product.find(query)
      .populate('categoryId', 'categoryName')
      .populate('brandId', 'brandName')
      .sort(options.sort || '-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return { products, total, page, pages: Math.ceil(total / limit) };
  }

  async update(id, data) {
    return await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('categoryId', 'categoryName').populate('brandId', 'brandName');
  }

  async delete(id) {
    return await Product.findByIdAndDelete(id);
  }

  async count(query = {}) {
    return await Product.countDocuments(query);
  }
}

module.exports = new ProductRepository();
