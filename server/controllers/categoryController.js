const categoryService = require('../services/categoryService');
const { STORE_CATEGORIES } = require('../config/constants');

exports.create = async (req, res, next) => {
  try {
    const cat = await categoryService.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (error) { next(error); }
};

// GET /api/categories
//   ?kind=store               -> the 8 top-level store categories (from constants)
//   ?kind=product&group=slug  -> product categories within a group
//   (no params)               -> all product categories
exports.getAll = async (req, res, next) => {
  try {
    const { kind, group } = req.query;
    if (kind === 'store') {
      return res.status(200).json({ success: true, data: STORE_CATEGORIES });
    }
    const filter = {};
    if (group) filter.group = group;
    const categories = await categoryService.getAll(filter);
    res.status(200).json({ success: true, data: categories });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const cat = await categoryService.getById(req.params.id);
    res.status(200).json({ success: true, data: cat });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const cat = await categoryService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: cat });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    await categoryService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
};
