const orderService = require('../services/orderService');

exports.placeOrders = async (req, res, next) => {
  try {
    const carts = req.body.carts || (req.body.storeId ? [req.body] : []);
    const orders = await orderService.placeOrders(req.user, carts);
    res.status(201).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user._id, { status: req.query.status });
    res.status(200).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrder(req.params.id, req.user);
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelByBuyer(req.params.id, req.user, req.body.note);
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};
