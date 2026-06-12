const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/priceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/compare/:productId', ctrl.comparePrices);
router.get('/', ctrl.getAllPrices);
router.post('/', protect, authorize('admin'), ctrl.updatePrice);
router.delete('/:id', protect, authorize('admin'), ctrl.deletePrice);

module.exports = router;
