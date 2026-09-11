const merchantService = require('../services/merchantService');

exports.registerStore = async (req, res, next) => {
  try {
    const store = await merchantService.registerStore(req.user, req.body);
    res.status(201).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.getMyStore = async (req, res, next) => {
  try {
    const store = await merchantService.getMyStore(req.store);
    res.status(200).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.updateMyStore = async (req, res, next) => {
  try {
    const store = await merchantService.updateMyStore(req.store, req.body);
    res.status(200).json({ success: true, data: store });
  } catch (error) { next(error); }
};

exports.getGroupCategories = async (req, res, next) => {
  try {
    const group = req.query.group || req.store.storeCategory;
    const cats = await merchantService.getGroupCategories(group);
    res.status(200).json({ success: true, data: cats });
  } catch (error) { next(error); }
};

exports.listProducts = async (req, res, next) => {
  try {
    const products = await merchantService.listProducts(req.store);
    res.status(200).json({ success: true, data: products });
  } catch (error) { next(error); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const result = await merchantService.createProduct(req.store, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const result = await merchantService.updateProduct(req.store, req.params.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.quickUpdatePrice = async (req, res, next) => {
  try {
    const price = await merchantService.quickUpdatePrice(req.store, req.params.id, req.body);
    res.status(200).json({ success: true, data: price });
  } catch (error) { next(error); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const result = await merchantService.deleteProduct(req.store, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.listPromotions = async (req, res, next) => {
  try {
    const promos = await merchantService.listPromotions(req.store);
    res.status(200).json({ success: true, data: promos });
  } catch (error) { next(error); }
};

exports.createPromotion = async (req, res, next) => {
  try {
    const promo = await merchantService.createPromotion(req.store, req.body);
    res.status(201).json({ success: true, data: promo });
  } catch (error) { next(error); }
};

exports.deletePromotion = async (req, res, next) => {
  try {
    const result = await merchantService.deletePromotion(req.store, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.listOrders = async (req, res, next) => {
  try {
    const orders = await merchantService.listOrders(req.store, { status: req.query.status });
    res.status(200).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await merchantService.updateOrderStatus(
      req.store,
      req.params.id,
      req.body.status,
      req.body.note
    );
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};
