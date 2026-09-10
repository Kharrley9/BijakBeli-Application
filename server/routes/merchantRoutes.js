const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/merchantController');
const { protect, requireOwnStore } = require('../middleware/auth');

// Every merchant route requires a logged-in user.
router.use(protect);

// Store registration — any authenticated user without a store yet.
router.post('/store', ctrl.registerStore);

// Everything below operates on the caller's own store.
router.get('/store', requireOwnStore, ctrl.getMyStore);
router.put('/store', requireOwnStore, ctrl.updateMyStore);
router.get('/categories', requireOwnStore, ctrl.getGroupCategories);

router.get('/products', requireOwnStore, ctrl.listProducts);
router.post('/products', requireOwnStore, ctrl.createProduct);
router.put('/products/:id', requireOwnStore, ctrl.updateProduct);
router.patch('/products/:id/price', requireOwnStore, ctrl.quickUpdatePrice);
router.delete('/products/:id', requireOwnStore, ctrl.deleteProduct);

router.get('/promotions', requireOwnStore, ctrl.listPromotions);
router.post('/promotions', requireOwnStore, ctrl.createPromotion);
router.delete('/promotions/:id', requireOwnStore, ctrl.deletePromotion);

module.exports = router;
