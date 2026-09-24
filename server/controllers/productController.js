const productService = require('../services/productService');
const catalogService = require('../services/catalogService');

function originFrom(query) {
  const { lat, lng } = query;
  if (lat === undefined || lng === undefined) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

exports.createProduct = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

// GET /api/products/:id  — full detail with "prices at nearby stores"
exports.getProduct = async (req, res, next) => {
  try {
    const detail = await catalogService.getProductDetail(
      req.params.id,
      originFrom(req.query)
    );
    res.status(200).json({ success: true, data: detail });
  } catch (error) { next(error); }
};

// GET /api/products — catalogue list with cheapest price / cheapest & nearest store
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page, limit, sort, q, categoryId, brandId } = req.query;
    const result = await catalogService.listProducts(
      { categoryId, brandId, q },
      { page, limit, sort },
      originFrom(req.query)
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q, categoryId, page, limit, sort } = req.query;
    const result = await catalogService.listProducts(
      { q, categoryId },
      { page, limit, sort },
      originFrom(req.query)
    );
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
