const priceComparisonService = require('../services/priceComparisonService');

exports.comparePrices = async (req, res, next) => {
  try {
    const result = await priceComparisonService.comparePrices(req.params.productId);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.updatePrice = async (req, res, next) => {
  try {
    const { productId, storeId, price } = req.body;
    const result = await priceComparisonService.updatePrice(productId, storeId, price);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getAllPrices = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await priceComparisonService.getAllPrices({}, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.deletePrice = async (req, res, next) => {
  try {
    await priceComparisonService.deletePrice(req.params.id);
    res.status(200).json({ success: true, message: 'Price deleted' });
  } catch (error) { next(error); }
};
