const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/favoriteStoreController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.listMine);
router.post('/:storeId', ctrl.toggle);
router.get('/:storeId/check', ctrl.check);

module.exports = router;
