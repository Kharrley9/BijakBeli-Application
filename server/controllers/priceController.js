const priceComparisonService = require('../services/priceComparisonService');

exports.comparePrices = async (req, res, next) => {
  try {
    const { storeIds, lat, lng } = req.query;
    const preferredStores = storeIds ? storeIds.split(',') : [];
    const origin =
      lat !== undefined && lng !== undefined
        ? { lat: Number(lat), lng: Number(lng) }
        : null;
    const result = await priceComparisonService.comparePrices(
      req.params.productId,
      preferredStores,
      origin
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.updatePrice = async (req, res, next) => {
  try {
    const { productId, storeId, price, inStock } = req.body;
    const result = await priceComparisonService.updatePrice(productId, storeId, { price, inStock });
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getAllPrices = async (req, res, next) => {
  try {
    const { page, limit, storeId, state } = req.query;
    const query = {};
    
    if (storeId) {
      query.storeId = storeId;
    } else if (state) {
      // If filtering by state, we need to get the store IDs first
      const storeService = require('../services/storeService');
      const stores = await storeService.getAllStores({ state });
      const storeIds = stores.map(s => s._id);
      query.storeId = { $in: storeIds };
    }

    const result = await priceComparisonService.getAllPrices(query, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.deletePrice = async (req, res, next) => {
  try {
    await priceComparisonService.deletePrice(req.params.id);
    res.status(200).json({ success: true, message: 'Price deleted' });
  } catch (error) { next(error); }
};
