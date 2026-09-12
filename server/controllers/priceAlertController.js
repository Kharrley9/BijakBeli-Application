const priceAlertService = require('../services/priceAlertService');

exports.setAlert = async (req, res, next) => {
  try {
    const { productId, targetPrice } = req.body;
    const alert = await priceAlertService.setAlert(req.user._id, productId, targetPrice);
    res.status(201).json({ success: true, data: alert });
  } catch (error) { next(error); }
};

exports.listMine = async (req, res, next) => {
  try {
    const alerts = await priceAlertService.listMine(req.user._id);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    await priceAlertService.removeAlert(req.user._id, req.params.productId);
    res.status(200).json({ success: true, message: 'Alert removed' });
  } catch (error) { next(error); }
};
