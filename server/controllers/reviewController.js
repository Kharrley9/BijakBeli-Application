const reviewService = require('../services/reviewService');

exports.create = async (req, res, next) => {
  try {
    const review = await reviewService.create(req.user, req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) { next(error); }
};

exports.listForStore = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await reviewService.listForStore(req.params.storeId, { page: Number(page) || 1, limit: Number(limit) || 20 });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.listMine = async (req, res, next) => {
  try {
    const reviews = await reviewService.listMine(req.user._id);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) { next(error); }
};

exports.getReviewableOrders = async (req, res, next) => {
  try {
    const orders = await reviewService.getReviewableOrders(req.user._id);
    res.status(200).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await reviewService.delete(req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};
