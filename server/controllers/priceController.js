const priceComparisonService = require('../services/priceComparisonService');
const CrowdsourcedPrice = require('../models/CrowdsourcedPrice');
const Product = require('../models/Product');
const Price   = require('../models/Price');

exports.comparePrices = async (req, res, next) => {
  try {
    const { storeIds, lat, lng, vehicle } = req.query;
    const preferredStores = storeIds ? storeIds.split(',') : [];
    const origin =
      lat !== undefined && lng !== undefined
        ? { lat: Number(lat), lng: Number(lng) }
        : null;
    const result = await priceComparisonService.comparePrices(
      req.params.productId,
      preferredStores,
      origin,
      vehicle
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.updatePrice = async (req, res, next) => {
  try {
    const { productId, storeId, price, inStock } = req.body;
    const result = await priceComparisonService.updatePrice(productId, storeId, { price, inStock });
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getAllPrices = async (req, res, next) => {
  try {
    const { page, limit, storeId, state } = req.query;
    const query = {};
    
    if (storeId) {
      query.storeId = storeId;
    } else if (state) {
      // If filtering by state, we need to get the store IDs first
      const storeService = require('../services/storeService');
      const stores = await storeService.getAllStores({ state });
      const storeIds = stores.map(s => s._id);
      query.storeId = { $in: storeIds };
    }

    const result = await priceComparisonService.getAllPrices(query, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) { next(error); }
};

exports.deletePrice = async (req, res, next) => {
  try {
    await priceComparisonService.deletePrice(req.params.id);
    res.status(200).json({ success: true, message: 'Price deleted' });
  } catch (error) { next(error); }
};

// ── JOM Kongsi: crowdsourced price reporting ──────────────────────────────

/**
 * POST /api/prices/report
 * Body: { productId, storeId, price, isPromo?, promoDescription?, photoUrl? }
 */
exports.reportPrice = async (req, res, next) => {
  try {
    const { productId, storeId, price, isPromo, promoDescription, photoUrl } = req.body;
    if (!productId || !storeId || price == null) {
      return res.status(400).json({ success: false, message: 'productId, storeId and price are required' });
    }
    const report = await CrowdsourcedPrice.create({
      productId,
      storeId,
      reportedBy: req.user._id,
      price: Number(price),
      isPromo: !!isPromo,
      promoDescription: promoDescription || null,
      photoUrl: photoUrl || null,
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) { next(error); }
};

/**
 * GET /api/prices/reports?productId=&storeId=&status=pending&page=1&limit=20
 */
exports.getPriceReports = async (req, res, next) => {
  try {
    const { productId, storeId, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (productId) query.productId = productId;
    if (storeId)   query.storeId   = storeId;
    if (status)    query.status    = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      CrowdsourcedPrice.find(query)
        .populate('productId', 'productName unit')
        .populate('storeId',   'storeName city state')
        .populate('reportedBy','fullName')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)).lean(),
      CrowdsourcedPrice.countDocuments(query),
    ]);
    res.status(200).json({ success: true, data: reports, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) { next(error); }
};

/**
 * POST /api/prices/reports/:id/confirm
 * POST /api/prices/reports/:id/dispute
 */
exports.confirmReport = async (req, res, next) => {
  try {
    const report = await CrowdsourcedPrice.findByIdAndUpdate(
      req.params.id, { $inc: { confirmations: 1 } }, { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    // Auto-verify if 3+ confirmations
    if (report.confirmations >= 3 && report.status === 'pending') {
      report.status = 'verified';
      report.verifiedAt = new Date();
      await report.save();
    }
    res.status(200).json({ success: true, data: report });
  } catch (error) { next(error); }
};

exports.disputeReport = async (req, res, next) => {
  try {
    const report = await CrowdsourcedPrice.findByIdAndUpdate(
      req.params.id, { $inc: { disputes: 1 } }, { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    if (report.disputes >= 3 && report.status === 'pending') {
      report.status = 'rejected';
      await report.save();
    }
    res.status(200).json({ success: true, data: report });
  } catch (error) { next(error); }
};

// ── Lowest price nationwide / by state ───────────────────────────────────

/**
 * GET /api/prices/lowest/:productId?state=Selangor
 * Returns the single lowest price (optionally filtered by state) + store info.
 */
exports.getLowestPrice = async (req, res, next) => {
  try {
    const { state } = req.query;
    const productId = req.params.productId;

    // Build a join-like pipeline
    const pipeline = [
      { $match: { productId: new (require('mongoose').Types.ObjectId)(productId) } },
      {
        $lookup: {
          from: 'stores', localField: 'storeId', foreignField: '_id', as: 'store',
        },
      },
      { $unwind: '$store' },
      { $match: { 'store.isActive': { $ne: false } } },
    ];

    if (state) {
      pipeline.push({ $match: { 'store.state': new RegExp(state, 'i') } });
    }

    pipeline.push(
      { $sort: { price: 1 } },
      { $limit: 1 },
      {
        $project: {
          price: 1, previousPrice: 1, lastUpdated: 1,
          store: { storeName: 1, city: 1, state: 1, location: 1 },
        },
      }
    );

    const [result] = await Price.aggregate(pipeline);
    if (!result) return res.status(404).json({ success: false, message: 'No price found' });
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ── Price trend (historical) ──────────────────────────────────────────────

/**
 * GET /api/prices/trend/:productId?days=30&state=
 * Without storeId: real daily PriceCatcher summaries (PriceDaily), one point per day:
 *   { date, price (median), min, max, count, source: 'pricecatcher' }
 * With `state`, that state's figures when it has enough days of data, else national;
 * the response's `scope` says which ('state' | 'national').
 *
 * GET /api/prices/trend/:productId?storeId=&days=30
 * With storeId: that store's current price plus verified crowdsourced reports.
 */
exports.getPriceTrend = async (req, res, next) => {
  try {
    const { storeId, state, days = 30 } = req.query;
    const productId = req.params.productId;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(days));

    if (!storeId) {
      const PriceDaily = require('../models/PriceDaily');
      const since = cutoff.toISOString().slice(0, 10);
      const rows = await PriceDaily.find({ productId, date: { $gte: since } })
        .sort({ date: 1 })
        .lean();

      const national = rows.map((r) => ({
        date: r.date, price: r.median, min: r.min, max: r.max, count: r.count, source: 'pricecatcher',
      }));
      let points = national;
      let scope = 'national';
      if (state) {
        const forState = rows
          .map((r) => ({ date: r.date, s: (r.byState || []).find((b) => b.state === state) }))
          .filter((x) => x.s)
          .map(({ date, s }) => ({
            date, price: s.median, min: s.min, max: s.max, count: s.count, source: 'pricecatcher',
          }));
        // A state with only a handful of days would make a misleading line
        if (forState.length >= Math.min(7, national.length)) {
          points = forState;
          scope = 'state';
        }
      }
      return res.status(200).json({ success: true, data: points, scope, state: scope === 'state' ? state : null });
    }

    const match = {
      productId: new (require('mongoose').Types.ObjectId)(productId),
      lastUpdated: { $gte: cutoff },
    };
    if (storeId) match.storeId = new (require('mongoose').Types.ObjectId)(storeId);

    // Current prices (we'll use lastUpdated as the date point)
    const prices = await Price.find(match)
      .populate('storeId', 'storeName')
      .sort({ lastUpdated: 1 })
      .lean();

    const trend = prices.map(p => ({
      date:      p.lastUpdated,
      price:     p.price,
      storeName: p.storeId?.storeName || 'Unknown',
    }));

    // Also check crowdsourced verified prices
    const crowdMatch = {
      productId: new (require('mongoose').Types.ObjectId)(productId),
      status: 'verified',
      createdAt: { $gte: cutoff },
    };
    if (storeId) crowdMatch.storeId = new (require('mongoose').Types.ObjectId)(storeId);
    const crowd = await CrowdsourcedPrice.find(crowdMatch)
      .populate('storeId', 'storeName')
      .sort({ createdAt: 1 })
      .lean();

    const crowdTrend = crowd.map(p => ({
      date:      p.createdAt,
      price:     p.price,
      storeName: p.storeId?.storeName || 'Unknown',
      source:    'crowdsourced',
    }));

    const combined = [...trend, ...crowdTrend].sort((a, b) => new Date(a.date) - new Date(b.date));
    res.status(200).json({ success: true, data: combined });
  } catch (error) { next(error); }
};
