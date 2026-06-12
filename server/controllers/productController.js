const productService = require('../services/productService');

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await productService.getProduct(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const { page, limit, sort, status } = req.query;
    const query = status ? { status } : {};
    const result = await productService.getAllProducts(query, { page, limit, sort });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q, categoryId, brandId, page, limit, sort } = req.query;
    const result = await productService.searchProducts(q, { categoryId, brandId }, { page, limit, sort });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) { next(error); }
};
