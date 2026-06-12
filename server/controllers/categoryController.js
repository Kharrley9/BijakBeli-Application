const categoryService = require('../services/categoryService');

exports.create = async (req, res, next) => {
  try {
    const cat = await categoryService.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const categories = await categoryService.getAll();
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
