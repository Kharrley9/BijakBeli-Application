const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/store/:storeId', ctrl.listForStore);
router.get('/mine', protect, ctrl.listMine);
router.get('/reviewable', protect, ctrl.getReviewableOrders);
router.post('/', protect, ctrl.create);
router.delete('/:id', protect, ctrl.remove);

module.exports = router;
