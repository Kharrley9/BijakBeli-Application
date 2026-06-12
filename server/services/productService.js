const productRepository = require('../repositories/productRepository');

class ProductService {
  async createProduct(data) {
    return await productRepository.create(data);
  }

  async getProduct(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async getAllProducts(query = {}, options = {}) {
    return await productRepository.findAll(query, options);
  }

  async searchProducts(searchQuery, filters = {}, options = {}) {
    return await productRepository.search(searchQuery, filters, options);
  }

  async updateProduct(id, data) {
    const product = await productRepository.update(id, data);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async deleteProduct(id) {
    const product = await productRepository.delete(id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async getProductCount() {
    return await productRepository.count({ status: 'active' });
  }
}

module.exports = new ProductService();
