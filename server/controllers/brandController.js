const brandService = require('../services/brandService');

exports.create = async (req, res, next) => {
  try {
    const brand = await brandService.create(req.body);
    res.status(201).json({ success: true, data: brand });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const brands = await brandService.getAll();
    res.status(200).json({ success: true, data: brands });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const brand = await brandService.getById(req.params.id);
    res.status(200).json({ success: true, data: brand });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const brand = await brandService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: brand });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    await brandService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Brand deleted' });
  } catch (error) { next(error); }
};
