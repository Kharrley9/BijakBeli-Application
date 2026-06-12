const brandRepository = require('../repositories/brandRepository');

class BrandService {
  async create(data) { return await brandRepository.create(data); }
  async getById(id) {
    const b = await brandRepository.findById(id);
    if (!b) { const e = new Error('Brand not found'); e.statusCode = 404; throw e; }
    return b;
  }
  async getAll() { return await brandRepository.findAll(); }
  async update(id, data) {
    const b = await brandRepository.update(id, data);
    if (!b) { const e = new Error('Brand not found'); e.statusCode = 404; throw e; }
    return b;
  }
  async delete(id) {
    const b = await brandRepository.delete(id);
    if (!b) { const e = new Error('Brand not found'); e.statusCode = 404; throw e; }
    return b;
  }
}

module.exports = new BrandService();
