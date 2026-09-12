const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/priceAlertController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.listMine);
router.post('/', ctrl.setAlert);
router.delete('/:productId', ctrl.remove);

module.exports = router;
