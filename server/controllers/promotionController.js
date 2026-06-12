const promotionService = require('../services/promotionService');

exports.create = async (req, res, next) => {
  try {
    const promo = await promotionService.create(req.body);
    res.status(201).json({ success: true, data: promo });
  } catch (error) { next(error); }
};

exports.getActive = async (req, res, next) => {
  try {
    const promos = await promotionService.getActivePromotions();
    res.status(200).json({ success: true, data: promos });
  } catch (error) { next(error); }
};

exports.getBestDeals = async (req, res, next) => {
  try {
    const deals = await promotionService.getBestDeals();
    res.status(200).json({ success: true, data: deals });
  } catch (error) { next(error); }
};

exports.getAll = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await promotionService.getAllPromotions({}, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const promo = await promotionService.getById(req.params.id);
    res.status(200).json({ success: true, data: promo });
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const promo = await promotionService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: promo });
  } catch (error) { next(error); }
};

exports.delete = async (req, res, next) => {
  try {
    await promotionService.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Promotion deleted' });
  } catch (error) { next(error); }
};
