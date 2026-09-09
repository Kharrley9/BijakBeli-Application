const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/', protect, ctrl.createOrder);
router.get('/', protect, ctrl.getUserOrders);
router.get('/:id', protect, ctrl.getOrderById);
router.put('/:id/cancel', protect, ctrl.cancelOrder);

module.exports = router;
