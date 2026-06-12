const favoriteService = require('../services/favoriteService');

exports.toggle = async (req, res, next) => {
  try {
    const result = await favoriteService.toggleFavorite(req.user._id, req.params.productId);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getUserFavorites = async (req, res, next) => {
  try {
    const favorites = await favoriteService.getUserFavorites(req.user._id);
    res.status(200).json({ success: true, data: favorites });
  } catch (error) { next(error); }
};

exports.checkFavorite = async (req, res, next) => {
  try {
    const isFavorite = await favoriteService.checkFavorite(req.user._id, req.params.productId);
    res.status(200).json({ success: true, data: { isFavorite } });
  } catch (error) { next(error); }
};
