const favoriteStoreService = require('../services/favoriteStoreService');

exports.toggle = async (req, res, next) => {
  try {
    const result = await favoriteStoreService.toggle(req.user._id, req.params.storeId);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.listMine = async (req, res, next) => {
  try {
    const favorites = await favoriteStoreService.listMine(req.user._id);
    res.status(200).json({ success: true, data: favorites });
  } catch (error) { next(error); }
};

exports.check = async (req, res, next) => {
  try {
    const isFavorite = await favoriteStoreService.check(req.user._id, req.params.storeId);
    res.status(200).json({ success: true, data: { isFavorite } });
  } catch (error) { next(error); }
};
