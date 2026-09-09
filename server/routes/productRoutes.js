const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/search', ctrl.searchProducts);
router.get('/compare-stores', ctrl.compareStores);
router.get('/', ctrl.getAllProducts);
router.get('/:id', ctrl.getProduct);
router.post('/', protect, authorize('admin'), ctrl.createProduct);
router.put('/:id', protect, authorize('admin'), ctrl.updateProduct);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteProduct);

module.exports = router;
