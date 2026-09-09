const promotionService = require('../services/promotionService');

exports.create = async (req, res, next) => {
  try {
    const promo = await promotionService.create(req.body);
    res.status(201).json({ success: true, data: promo });
  } catch (error) { next(error); }
};

exports.getActive = async (req, res, next) => {
  try {
    const { city, state, storeId } = req.query;
    let query = { endDate: { $gte: new Date() } };
    
    if (storeId || city || state) {
      const storeService = require('../services/storeService');
      let storeIds = [];
      if (storeId) {
        storeIds = [storeId];
      } else {
        const storeQuery = {};
        if (city) storeQuery.city = city;
        if (state) storeQuery.state = state;
        const stores = await storeService.getAllStores(storeQuery);
        storeIds = stores.map(s => s._id);
      }
      query.storeId = { $in: storeIds };
    }

    const promos = await promotionService.getActivePromotions(query);
    res.status(200).json({ success: true, data: promos });
  } catch (error) { next(error); }
};

exports.getBestDeals = async (req, res, next) => {
  try {
    const { city, state, storeId } = req.query;
    let query = { endDate: { $gte: new Date() } };
    
    if (storeId || city || state) {
      const storeService = require('../services/storeService');
      let storeIds = [];
      if (storeId) {
        storeIds = [storeId];
      } else {
        const storeQuery = {};
        if (city) storeQuery.city = city;
        if (state) storeQuery.state = state;
        const stores = await storeService.getAllStores(storeQuery);
        storeIds = stores.map(s => s._id);
      }
      query.storeId = { $in: storeIds };
    }

    // Pass the query to the service if supported, otherwise filter in service or controller.
    // For now we'll pass query and assume service is updated to accept it.
    const deals = await promotionService.getBestDeals(query);
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
