const shoppingListService = require('../services/shoppingListService');

exports.createList = async (req, res, next) => {
  try {
    const list = await shoppingListService.createList(req.user._id, req.body.title);
    res.status(201).json({ success: true, data: list });
  } catch (error) { next(error); }
};

exports.getUserLists = async (req, res, next) => {
  try {
    const lists = await shoppingListService.getUserLists(req.user._id);
    res.status(200).json({ success: true, data: lists });
  } catch (error) { next(error); }
};

exports.getListById = async (req, res, next) => {
  try {
    const list = await shoppingListService.getListById(req.params.id);
    res.status(200).json({ success: true, data: list });
  } catch (error) { next(error); }
};

exports.addItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const item = await shoppingListService.addItem(req.params.id, productId, quantity);
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.updateItem = async (req, res, next) => {
  try {
    const item = await shoppingListService.updateItem(req.params.itemId, req.body.quantity);
    res.status(200).json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.removeItem = async (req, res, next) => {
  try {
    await shoppingListService.removeItem(req.params.itemId);
    res.status(200).json({ success: true, message: 'Item removed' });
  } catch (error) { next(error); }
};

exports.deleteList = async (req, res, next) => {
  try {
    await shoppingListService.deleteList(req.params.id);
    res.status(200).json({ success: true, message: 'Shopping list deleted' });
  } catch (error) { next(error); }
};

exports.compareStores = async (req, res, next) => {
  try {
    const result = await shoppingListService.compareStores(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};
