const storeService = require('../services/storeService');

exports.createStore = async (req, res, next) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.getStore = async (req, res, next) => {
  try {
    const store = await storeService.getStore(req.params.id);
    res.status(200).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.getAllStores = async (req, res, next) => {
  try {
    const stores = await storeService.getAllStores();
    res.status(200).json({ success: true, data: stores });
  } catch (error) { next(error); }
};

exports.updateStore = async (req, res, next) => {
  try {
    const store = await storeService.updateStore(req.params.id, req.body);
    res.status(200).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.deleteStore = async (req, res, next) => {
  try {
    await storeService.deleteStore(req.params.id);
    res.status(200).json({ success: true, message: 'Store deleted' });
  } catch (error) { next(error); }
};
