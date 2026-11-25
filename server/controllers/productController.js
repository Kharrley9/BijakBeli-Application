const productService = require('../services/productService');
const catalogService = require('../services/catalogService');
const scanService = require('../services/scanService');
const aiScanService = require('../services/aiScanService');
const { parseRadiusKm } = require('../services/geoService');

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
      originFrom(req.query),
      req.query.vehicle,
      parseRadiusKm(req.query.radiusKm)
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
      originFrom(req.query),
      parseRadiusKm(req.query.radiusKm)
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
      originFrom(req.query),
      parseRadiusKm(req.query.radiusKm)
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

// GET /api/products/scan?code=<scanned text>&type=<qr|ean13|…> — what a scanned code points to.
// An unknown store barcode is not an error: it returns data=null plus `unknownBarcode`
// so the app can ask the buyer which item it is.
exports.lookupByScan = async (req, res, next) => {
  try {
    const r = await scanService.resolveScan(req.query.code, req.query.type, req.user?._id);
    if (!r.recognised) {
      return res.status(400).json({ success: false, message: 'This code is not a product barcode or BijakBeli QR' });
    }
    if (r.product) {
      return res.status(200).json({ success: true, data: r.product, source: r.source, barcode: r.barcode });
    }
    if (r.barcode) {
      return res.status(200).json({ success: true, data: null, unknownBarcode: r.barcode });
    }
    res.status(404).json({ success: false, message: 'No price data for this item yet' });
  } catch (error) { next(error); }
};

// POST /api/products/scan/link { code, productId } — "this barcode is that item"
exports.linkBarcode = async (req, res, next) => {
  try {
    const product = await scanService.linkBarcode(req.body.code, req.body.productId, req.user._id);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

// POST /api/products/recognize { image: <base64 JPEG> } — photo scan via Gemini
exports.recognizePhoto = async (req, res, next) => {
  try {
    const result = await aiScanService.recognise(req.body?.image);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (!error.statusCode) return next(error);
    if (error.retryAfterSec) res.set('Retry-After', String(error.retryAfterSec));
    const quota = await aiScanService.getQuota().catch(() => undefined);
    res.status(error.statusCode).json({ success: false, message: error.message, limit: error.limit, quota });
  }
};

// GET /api/products/recognize/quota — how many free photo scans are left today
exports.photoScanQuota = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await aiScanService.getQuota() });
  } catch (error) { next(error); }
};

// GET /api/products/qr-labels[?categoryId=] — printable QR labels (HTML)
exports.qrLabels = async (req, res, next) => {
  try {
    const categoryId = /^[a-f0-9]{24}$/i.test(req.query.categoryId || '') ? req.query.categoryId : undefined;
    res.type('html').send(await scanService.renderLabelsPage({ categoryId }));
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
