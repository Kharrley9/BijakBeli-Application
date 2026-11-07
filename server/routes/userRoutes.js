const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:id/preferred-products', ctrl.getPreferredProducts);
router.patch('/:id/preferred-products', ctrl.togglePreferredProduct);

module.exports = router;
