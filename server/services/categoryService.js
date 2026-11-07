const categoryRepository = require('../repositories/categoryRepository');

class CategoryService {
  async create(data) { return await categoryRepository.create(data); }
  async getById(id) {
    const cat = await categoryRepository.findById(id);
    if (!cat) { const e = new Error('Category not found'); e.statusCode = 404; throw e; }
    return cat;
  }
  async getAll(filter = {}) { return await categoryRepository.findAll(filter); }
  async update(id, data) {
    const cat = await categoryRepository.update(id, data);
    if (!cat) { const e = new Error('Category not found'); e.statusCode = 404; throw e; }
    return cat;
  }
  async delete(id) {
    const cat = await categoryRepository.delete(id);
    if (!cat) { const e = new Error('Category not found'); e.statusCode = 404; throw e; }
    return cat;
  }
}

module.exports = new CategoryService();
