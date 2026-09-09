const orderService = require('../services/orderService');

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shoppingListId } = req.body;
    const order = await orderService.createOrder(req.user._id, items, shoppingListId);
    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(req.user._id);
    res.status(200).json({ success: true, data: orders });
  } catch (error) { next(error); }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.id);
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};
