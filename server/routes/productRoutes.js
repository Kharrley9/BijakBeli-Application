const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');

router.get('/search', ctrl.searchProducts);
router.get('/scan', optionalAuth, ctrl.lookupByScan);
router.post('/scan/link', protect, ctrl.linkBarcode);
router.post('/recognize', protect, ctrl.recognizePhoto);
router.get('/recognize/quota', protect, ctrl.photoScanQuota);
router.get('/qr-labels', ctrl.qrLabels);
router.get('/', ctrl.getAllProducts);
router.get('/:id', ctrl.getProduct);
router.post('/', protect, authorize('admin'), ctrl.createProduct);
router.put('/:id', protect, authorize('admin'), ctrl.updateProduct);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteProduct);

module.exports = router;
