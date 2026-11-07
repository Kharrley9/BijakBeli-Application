const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/priceController');
const { protect, authorize } = require('../middleware/auth');

// ── Existing ──────────────────────────────────────────────────────────────
router.get('/compare/:productId', ctrl.comparePrices);
router.get('/',                   ctrl.getAllPrices);
router.post('/',     protect, authorize('admin'), ctrl.updatePrice);
router.delete('/:id',protect, authorize('admin'), ctrl.deletePrice);

// ── Lowest price nationwide / by state ───────────────────────────────────
router.get('/lowest/:productId', ctrl.getLowestPrice);

// ── Price trend chart ─────────────────────────────────────────────────────
router.get('/trend/:productId', ctrl.getPriceTrend);

// ── JOM Kongsi: crowdsourced price reporting ──────────────────────────────
router.post('/report',                  protect, ctrl.reportPrice);
router.get('/reports',                  protect, ctrl.getPriceReports);
router.post('/reports/:id/confirm',     protect, ctrl.confirmReport);
router.post('/reports/:id/dispute',     protect, ctrl.disputeReport);

module.exports = router;
